from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import os, shutil, uuid

from app.database import get_db
from app.models.company import Company
from app.models.employee import Employee, UserRole
from app.models.salary import SalaryStructure, SalaryComponent, ComponentType, CalcType
from app.models.leave import LeaveType, LeaveBalance
from app.auth.jwt import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from app.auth.dependencies import get_current_user
from app.utils.employee_id import generate_employee_login_id, generate_default_password
from app.core.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# ─── Schemas ────────────────────────────────────────────────────────────────

class CompanyRegisterRequest(BaseModel):
    company_name: str
    company_email: Optional[str] = None
    admin_first_name: str
    admin_last_name: str
    admin_email: EmailStr
    admin_password: str

class LoginRequest(BaseModel):
    login_id: str
    password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class EmployeeRegisterRequest(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    role: UserRole = UserRole.employee
    department_id: Optional[int] = None
    manager_id: Optional[int] = None
    location: Optional[str] = None
    mobile: Optional[str] = None
    joining_date: Optional[str] = None

# ─── Routes ─────────────────────────────────────────────────────────────────

@router.post("/register/company")
def register_company(req: CompanyRegisterRequest, db: Session = Depends(get_db)):
    # Create company
    company = Company(name=req.company_name, email=req.company_email)
    db.add(company)
    db.flush()

    # Create default leave types
    leave_types = [
        LeaveType(name="Paid Leave", max_days=12, is_paid=True, color="#6C63FF"),
        LeaveType(name="Sick Leave", max_days=6, is_paid=True, color="#10B981"),
        LeaveType(name="Unpaid Leave", max_days=30, is_paid=False, color="#F59E0B"),
    ]
    for lt in leave_types:
        db.add(lt)
    db.flush()

    # Generate admin login ID
    joining_year = datetime.utcnow().year
    login_id = generate_employee_login_id(db, req.admin_first_name, req.admin_last_name, joining_year)

    # Create admin employee
    admin = Employee(
        login_id=login_id,
        first_name=req.admin_first_name,
        last_name=req.admin_last_name,
        email=req.admin_email,
        password_hash=hash_password(req.admin_password),
        role=UserRole.admin,
        company_id=company.id,
        joining_date=datetime.utcnow()
    )
    db.add(admin)
    db.flush()

    # Create leave balances for admin
    for lt in leave_types:
        db.add(LeaveBalance(
            employee_id=admin.id,
            leave_type_id=lt.id,
            year=joining_year,
            allocated=lt.max_days,
            used=0
        ))

    db.commit()
    db.refresh(admin)

    return {
        "message": "Company and admin account created successfully",
        "login_id": login_id,
        "company_id": company.id,
        "admin_id": admin.id
    }


@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(
        Employee.login_id == req.login_id,
        Employee.is_active == True
    ).first()

    if not employee or not verify_password(req.password, employee.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = create_access_token({"sub": str(employee.id), "role": employee.role.value})
    refresh_token = create_refresh_token({"sub": str(employee.id)})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": employee.id,
            "login_id": employee.login_id,
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "email": employee.email,
            "role": employee.role.value,
            "avatar_path": employee.avatar_path,
            "company_id": employee.company_id,
        }
    }


@router.post("/refresh")
def refresh_token(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    employee_id = payload.get("sub")
    employee = db.query(Employee).filter(Employee.id == int(employee_id), Employee.is_active == True).first()
    if not employee:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Employee not found")

    access_token = create_access_token({"sub": str(employee.id), "role": employee.role.value})
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/change-password")
def change_password(req: ChangePasswordRequest, current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


@router.get("/me")
def get_me(current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    dept = None
    if current_user.department_id:
        from app.models.department import Department
        dept = db.query(Department).filter_by(id=current_user.department_id).first()
    manager = None
    if current_user.manager_id:
        manager = db.query(Employee).filter_by(id=current_user.manager_id).first()

    return {
        "id": current_user.id,
        "login_id": current_user.login_id,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
        "email": current_user.email,
        "mobile": current_user.mobile,
        "role": current_user.role.value,
        "avatar_path": current_user.avatar_path,
        "company_id": current_user.company_id,
        "department": {"id": dept.id, "name": dept.name} if dept else None,
        "manager": {"id": manager.id, "first_name": manager.first_name, "last_name": manager.last_name} if manager else None,
        "location": current_user.location,
        "joining_date": current_user.joining_date.isoformat() if current_user.joining_date else None,
    }
