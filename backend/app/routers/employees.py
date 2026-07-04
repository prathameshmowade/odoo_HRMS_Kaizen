from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import os, shutil, uuid

from app.database import get_db
from app.models.employee import Employee, UserRole
from app.models.employee_profile import EmployeeProfile, Skill, Certification
from app.models.department import Department
from app.models.salary import SalaryStructure, SalaryComponent, ComponentType, CalcType
from app.models.leave import LeaveType, LeaveBalance
from app.auth.dependencies import get_current_user, require_hr_or_admin
from app.auth.jwt import hash_password
from app.utils.employee_id import generate_employee_login_id, generate_default_password
from app.core.config import settings

router = APIRouter(prefix="/api/employees", tags=["Employees"])

class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    role: UserRole = UserRole.employee
    department_id: Optional[int] = None
    manager_id: Optional[int] = None
    location: Optional[str] = None
    mobile: Optional[str] = None
    joining_date: Optional[str] = None

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[EmailStr] = None
    mobile: Optional[str] = None
    location: Optional[str] = None
    department_id: Optional[int] = None
    manager_id: Optional[int] = None
    role: Optional[UserRole] = None

class ProfileUpdate(BaseModel):
    about: Optional[str] = None
    dob: Optional[str] = None
    nationality: Optional[str] = None
    personal_email: Optional[str] = None
    gender: Optional[str] = None
    marital_status: Optional[str] = None
    address: Optional[str] = None
    bank_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc_code: Optional[str] = None
    pan_number: Optional[str] = None
    uan_number: Optional[str] = None
    hobbies: Optional[str] = None

class SkillCreate(BaseModel):
    name: str
    level: Optional[str] = None

class CertCreate(BaseModel):
    name: str
    issuer: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None


def employee_to_dict(emp: Employee, include_private: bool = False) -> dict:
    dept = None
    if emp.department:
        dept = {"id": emp.department.id, "name": emp.department.name}
    manager = None
    if emp.manager:
        manager = {"id": emp.manager.id, "first_name": emp.manager.first_name, "last_name": emp.manager.last_name}

    data = {
        "id": emp.id,
        "login_id": emp.login_id,
        "first_name": emp.first_name,
        "last_name": emp.last_name,
        "email": emp.email,
        "mobile": emp.mobile,
        "role": emp.role.value,
        "avatar_path": emp.avatar_path,
        "company_id": emp.company_id,
        "department": dept,
        "manager": manager,
        "location": emp.location,
        "joining_date": emp.joining_date.isoformat() if emp.joining_date else None,
        "is_active": emp.is_active,
        "created_at": emp.created_at.isoformat() if emp.created_at else None,
    }

    if emp.profile and include_private:
        data["profile"] = {
            "about": emp.profile.about,
            "dob": emp.profile.dob.isoformat() if emp.profile.dob else None,
            "nationality": emp.profile.nationality,
            "personal_email": emp.profile.personal_email,
            "gender": emp.profile.gender,
            "marital_status": emp.profile.marital_status,
            "address": emp.profile.address,
            "bank_name": emp.profile.bank_name,
            "account_number": emp.profile.account_number,
            "ifsc_code": emp.profile.ifsc_code,
            "pan_number": emp.profile.pan_number,
            "uan_number": emp.profile.uan_number,
            "hobbies": emp.profile.hobbies,
        }
    elif emp.profile:
        data["profile"] = {"about": emp.profile.about, "gender": emp.profile.gender, "hobbies": emp.profile.hobbies}

    data["skills"] = [{"id": s.id, "name": s.name, "level": s.level} for s in (emp.skills or [])]
    data["certifications"] = [{"id": c.id, "name": c.name, "issuer": c.issuer, "issue_date": c.issue_date.isoformat() if c.issue_date else None} for c in (emp.certifications or [])]

    return data


@router.get("/")
def list_employees(
    search: Optional[str] = None,
    department_id: Optional[int] = None,
    role: Optional[str] = None,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Employee).options(
        joinedload(Employee.department),
        joinedload(Employee.manager),
        joinedload(Employee.profile),
        joinedload(Employee.skills),
        joinedload(Employee.certifications)
    ).filter(Employee.company_id == current_user.company_id, Employee.is_active == True)

    if search:
        query = query.filter(
            (Employee.first_name.ilike(f"%{search}%")) |
            (Employee.last_name.ilike(f"%{search}%")) |
            (Employee.login_id.ilike(f"%{search}%")) |
            (Employee.email.ilike(f"%{search}%"))
        )
    if department_id:
        query = query.filter(Employee.department_id == department_id)
    if role:
        query = query.filter(Employee.role == role)

    employees = query.all()
    return [employee_to_dict(e) for e in employees]


@router.post("/")
def create_employee(req: EmployeeCreate, current_user: Employee = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    if db.query(Employee).filter(Employee.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    joining_year = datetime.now().year
    if req.joining_date:
        try:
            joining_year = datetime.fromisoformat(req.joining_date).year
        except:
            pass

    login_id = generate_employee_login_id(db, req.first_name, req.last_name, joining_year)
    default_password = generate_default_password(login_id)

    employee = Employee(
        login_id=login_id,
        first_name=req.first_name,
        last_name=req.last_name,
        email=req.email,
        password_hash=hash_password(default_password),
        role=req.role,
        company_id=current_user.company_id,
        department_id=req.department_id,
        manager_id=req.manager_id,
        location=req.location,
        mobile=req.mobile,
        joining_date=datetime.fromisoformat(req.joining_date) if req.joining_date else datetime.utcnow()
    )
    db.add(employee)
    db.flush()

    # Create empty profile
    db.add(EmployeeProfile(employee_id=employee.id))

    # Create leave balances
    leave_types = db.query(LeaveType).all()
    for lt in leave_types:
        db.add(LeaveBalance(employee_id=employee.id, leave_type_id=lt.id, year=joining_year, allocated=lt.max_days, used=0))

    db.commit()
    db.refresh(employee)

    return {
        "message": "Employee created successfully",
        "login_id": login_id,
        "default_password": default_password,
        "employee_id": employee.id
    }


@router.get("/{employee_id}")
def get_employee(employee_id: int, current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = db.query(Employee).options(
        joinedload(Employee.department),
        joinedload(Employee.manager),
        joinedload(Employee.profile),
        joinedload(Employee.skills),
        joinedload(Employee.certifications)
    ).filter(Employee.id == employee_id, Employee.company_id == current_user.company_id).first()

    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    include_private = (current_user.id == employee_id) or current_user.role in [UserRole.hr_officer, UserRole.admin]
    return employee_to_dict(emp, include_private=include_private)


@router.put("/{employee_id}")
def update_employee(employee_id: int, req: EmployeeUpdate, current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == employee_id, Employee.company_id == current_user.company_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Only HR/admin can change role or other employees' info
    if current_user.id != employee_id and current_user.role not in [UserRole.hr_officer, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Not allowed")

    for field, value in req.model_dump(exclude_none=True).items():
        if field == "role" and current_user.role != UserRole.admin:
            continue  # Only admin can change roles
        setattr(emp, field, value)

    db.commit()
    db.refresh(emp)
    return {"message": "Employee updated successfully"}


@router.put("/{employee_id}/profile")
def update_profile(employee_id: int, req: ProfileUpdate, current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.id != employee_id and current_user.role not in [UserRole.hr_officer, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Not allowed")

    profile = db.query(EmployeeProfile).filter(EmployeeProfile.employee_id == employee_id).first()
    if not profile:
        profile = EmployeeProfile(employee_id=employee_id)
        db.add(profile)

    for field, value in req.model_dump(exclude_none=True).items():
        setattr(profile, field, value)

    db.commit()
    return {"message": "Profile updated successfully"}


@router.post("/{employee_id}/avatar")
def upload_avatar(employee_id: int, file: UploadFile = File(...), current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.id != employee_id and current_user.role not in [UserRole.hr_officer, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Not allowed")

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")

    upload_dir = os.path.join(settings.UPLOAD_DIR, "avatars")
    os.makedirs(upload_dir, exist_ok=True)

    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(upload_dir, filename)

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    emp.avatar_path = f"/uploads/avatars/{filename}"
    db.commit()
    return {"avatar_path": emp.avatar_path}


@router.post("/{employee_id}/skills")
def add_skill(employee_id: int, req: SkillCreate, current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.id != employee_id and current_user.role not in [UserRole.hr_officer, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Not allowed")
    skill = Skill(employee_id=employee_id, name=req.name, level=req.level)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return {"id": skill.id, "name": skill.name, "level": skill.level}


@router.delete("/{employee_id}/skills/{skill_id}")
def delete_skill(employee_id: int, skill_id: int, current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.id != employee_id and current_user.role not in [UserRole.hr_officer, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Not allowed")
    skill = db.query(Skill).filter(Skill.id == skill_id, Skill.employee_id == employee_id).first()
    if skill:
        db.delete(skill)
        db.commit()
    return {"message": "Skill deleted"}


@router.post("/{employee_id}/certifications")
def add_certification(employee_id: int, req: CertCreate, current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.id != employee_id and current_user.role not in [UserRole.hr_officer, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Not allowed")
    from datetime import date
    cert = Certification(
        employee_id=employee_id,
        name=req.name,
        issuer=req.issuer,
        issue_date=date.fromisoformat(req.issue_date) if req.issue_date else None,
        expiry_date=date.fromisoformat(req.expiry_date) if req.expiry_date else None
    )
    db.add(cert)
    db.commit()
    db.refresh(cert)
    return {"id": cert.id, "name": cert.name, "issuer": cert.issuer}
