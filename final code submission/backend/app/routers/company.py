from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import os, shutil, uuid

from app.database import get_db
from app.models.company import Company
from app.models.department import Department
from app.models.employee import Employee, UserRole
from app.auth.dependencies import get_current_user, require_hr_or_admin, require_admin
from app.core.config import settings

router = APIRouter(prefix="/api/company", tags=["Company"])


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class DeptCreate(BaseModel):
    name: str
    manager_id: Optional[int] = None


class DeptUpdate(BaseModel):
    name: Optional[str] = None
    manager_id: Optional[int] = None


@router.get("/")
def get_company(current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return {
        "id": company.id,
        "name": company.name,
        "logo_path": company.logo_path,
        "address": company.address,
        "email": company.email,
        "phone": company.phone,
        "created_at": company.created_at.isoformat() if company.created_at else None
    }


@router.put("/")
def update_company(req: CompanyUpdate, current_user: Employee = Depends(require_admin), db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    for field, value in req.model_dump(exclude_none=True).items():
        setattr(company, field, value)
    db.commit()
    return {"message": "Company updated"}


@router.post("/logo")
def upload_company_logo(file: UploadFile = File(...), current_user: Employee = Depends(require_admin), db: Session = Depends(get_db)):
    company = db.query(Company).filter(Company.id == current_user.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    upload_dir = os.path.join(settings.UPLOAD_DIR, "logos")
    os.makedirs(upload_dir, exist_ok=True)
    ext = file.filename.split(".")[-1] if "." in file.filename else "png"
    filename = f"company_{current_user.company_id}.{ext}"
    path = os.path.join(upload_dir, filename)
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    company.logo_path = f"/uploads/logos/{filename}"
    db.commit()
    return {"logo_path": company.logo_path}


@router.get("/departments")
def get_departments(current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    depts = db.query(Department).filter(Department.company_id == current_user.company_id).all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "manager": {"id": d.manager.id, "first_name": d.manager.first_name, "last_name": d.manager.last_name} if d.manager else None,
            "employee_count": len(d.employees)
        }
        for d in depts
    ]


@router.post("/departments")
def create_department(req: DeptCreate, current_user: Employee = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    dept = Department(name=req.name, company_id=current_user.company_id, manager_id=req.manager_id)
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return {"id": dept.id, "name": dept.name, "message": "Department created"}


@router.put("/departments/{dept_id}")
def update_department(dept_id: int, req: DeptUpdate, current_user: Employee = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == dept_id, Department.company_id == current_user.company_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    for field, value in req.model_dump(exclude_none=True).items():
        setattr(dept, field, value)
    db.commit()
    return {"message": "Department updated"}


@router.delete("/departments/{dept_id}")
def delete_department(dept_id: int, current_user: Employee = Depends(require_admin), db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == dept_id, Department.company_id == current_user.company_id).first()
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    db.delete(dept)
    db.commit()
    return {"message": "Department deleted"}


@router.get("/dashboard-stats")
def dashboard_stats(current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    from datetime import date
    from app.models.attendance import Attendance, AttendanceStatus
    from app.models.leave import LeaveRequest, LeaveStatus

    today = date.today()
    total_employees = db.query(Employee).filter(Employee.company_id == current_user.company_id, Employee.is_active == True).count()
    present_today = db.query(Attendance).join(Employee).filter(
        Employee.company_id == current_user.company_id,
        Attendance.date == today,
        Attendance.status == AttendanceStatus.present
    ).count()
    on_leave = db.query(Attendance).join(Employee).filter(
        Employee.company_id == current_user.company_id,
        Attendance.date == today,
        Attendance.status == AttendanceStatus.on_leave
    ).count()
    pending_approvals = 0
    if current_user.role in [UserRole.hr_officer, UserRole.admin]:
        from app.models.leave import LeaveStatus
        pending_approvals = db.query(LeaveRequest).join(LeaveRequest.employee).filter(
            Employee.company_id == current_user.company_id,
            LeaveRequest.status == LeaveStatus.pending
        ).count()

    return {
        "total_employees": total_employees,
        "present_today": present_today,
        "on_leave": on_leave,
        "absent": total_employees - present_today - on_leave,
        "pending_approvals": pending_approvals
    }
