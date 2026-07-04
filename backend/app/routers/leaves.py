from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
import os, shutil, uuid

from app.database import get_db
from app.models.employee import Employee, UserRole
from app.models.leave import LeaveRequest, LeaveType, LeaveBalance, LeaveStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.auth.dependencies import get_current_user, require_hr_or_admin
from app.core.config import settings

router = APIRouter(prefix="/api/leaves", tags=["Leaves"])


class LeaveApplyRequest(BaseModel):
    leave_type_id: int
    start_date: str
    end_date: str
    reason: Optional[str] = None

class LeaveActionRequest(BaseModel):
    reason: Optional[str] = None


@router.get("/types")
def get_leave_types(db: Session = Depends(get_db), current_user: Employee = Depends(get_current_user)):
    leave_types = db.query(LeaveType).all()
    return [{"id": lt.id, "name": lt.name, "max_days": lt.max_days, "is_paid": lt.is_paid, "color": lt.color} for lt in leave_types]


@router.get("/balances/my")
def my_leave_balances(current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    year = date.today().year
    balances = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == current_user.id,
        LeaveBalance.year == year
    ).all()

    return [
        {
            "id": b.id,
            "leave_type": {"id": b.leave_type.id, "name": b.leave_type.name, "color": b.leave_type.color},
            "allocated": b.allocated,
            "used": b.used,
            "remaining": b.remaining
        }
        for b in balances
    ]


@router.post("/apply")
def apply_leave(req: LeaveApplyRequest, current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    start = date.fromisoformat(req.start_date)
    end = date.fromisoformat(req.end_date)

    if end < start:
        raise HTTPException(status_code=400, detail="End date must be after start date")

    days = (end - start).days + 1

    # Check balance
    year = start.year
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == current_user.id,
        LeaveBalance.leave_type_id == req.leave_type_id,
        LeaveBalance.year == year
    ).first()

    leave_type = db.query(LeaveType).filter(LeaveType.id == req.leave_type_id).first()
    if not leave_type:
        raise HTTPException(status_code=404, detail="Leave type not found")

    if balance and leave_type.is_paid and balance.remaining < days:
        raise HTTPException(status_code=400, detail=f"Insufficient leave balance. Remaining: {balance.remaining} days")

    leave_request = LeaveRequest(
        employee_id=current_user.id,
        leave_type_id=req.leave_type_id,
        start_date=start,
        end_date=end,
        days=days,
        reason=req.reason,
        status=LeaveStatus.pending
    )
    db.add(leave_request)
    db.commit()
    db.refresh(leave_request)

    return {"message": "Leave request submitted successfully", "id": leave_request.id, "days": days}


@router.post("/{leave_id}/upload-certificate")
def upload_certificate(leave_id: int, file: UploadFile = File(...), current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id, LeaveRequest.employee_id == current_user.id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")

    upload_dir = os.path.join(settings.UPLOAD_DIR, "certificates")
    os.makedirs(upload_dir, exist_ok=True)

    ext = file.filename.split(".")[-1] if "." in file.filename else "pdf"
    filename = f"{uuid.uuid4()}.{ext}"
    path = os.path.join(upload_dir, filename)

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    leave.certificate_path = f"/uploads/certificates/{filename}"
    db.commit()
    return {"message": "Certificate uploaded", "path": leave.certificate_path}


@router.get("/my")
def my_leaves(current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    leaves = db.query(LeaveRequest).filter(LeaveRequest.employee_id == current_user.id).order_by(LeaveRequest.created_at.desc()).all()
    return _format_leaves(leaves)


@router.get("/")
def all_leaves(
    status: Optional[str] = None,
    search: Optional[str] = None,
    current_user: Employee = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    query = db.query(LeaveRequest).join(LeaveRequest.employee).filter(Employee.company_id == current_user.company_id)
    if status:
        query = query.filter(LeaveRequest.status == status)
    if search:
        query = query.filter(
            (Employee.first_name.ilike(f"%{search}%")) |
            (Employee.last_name.ilike(f"%{search}%")) |
            (Employee.login_id.ilike(f"%{search}%"))
        )
    leaves = query.order_by(LeaveRequest.created_at.desc()).all()
    return _format_leaves(leaves, include_employee=True)


@router.put("/{leave_id}/approve")
def approve_leave(leave_id: int, current_user: Employee = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if leave.status != LeaveStatus.pending:
        raise HTTPException(status_code=400, detail="Leave is not in pending state")

    leave.status = LeaveStatus.approved
    leave.approved_by = current_user.id
    leave.approved_at = datetime.utcnow()

    # Deduct from balance
    year = leave.start_date.year
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == leave.employee_id,
        LeaveBalance.leave_type_id == leave.leave_type_id,
        LeaveBalance.year == year
    ).first()
    if balance:
        balance.used = round(balance.used + leave.days, 1)

    # Mark attendance as on_leave
    current_date = leave.start_date
    while current_date <= leave.end_date:
        existing = db.query(Attendance).filter(
            Attendance.employee_id == leave.employee_id,
            Attendance.date == current_date
        ).first()
        if existing:
            existing.status = AttendanceStatus.on_leave
        else:
            db.add(Attendance(employee_id=leave.employee_id, date=current_date, status=AttendanceStatus.on_leave))
        current_date = date(current_date.year, current_date.month, current_date.day + 1) if current_date.day < 28 else date.fromordinal(current_date.toordinal() + 1)

    db.commit()
    return {"message": "Leave approved successfully"}


@router.put("/{leave_id}/reject")
def reject_leave(leave_id: int, req: LeaveActionRequest, current_user: Employee = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found")
    if leave.status != LeaveStatus.pending:
        raise HTTPException(status_code=400, detail="Leave is not in pending state")

    leave.status = LeaveStatus.rejected
    leave.approved_by = current_user.id
    leave.rejection_reason = req.reason
    db.commit()
    return {"message": "Leave rejected"}


@router.put("/{leave_id}/cancel")
def cancel_leave(leave_id: int, current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    leave = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id, LeaveRequest.employee_id == current_user.id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave not found")
    if leave.status not in [LeaveStatus.pending]:
        raise HTTPException(status_code=400, detail="Cannot cancel this leave")
    leave.status = LeaveStatus.cancelled
    db.commit()
    return {"message": "Leave cancelled"}


@router.get("/calendar")
def leave_calendar(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    y = year or today.year
    m = month or today.month

    query = db.query(LeaveRequest).join(LeaveRequest.employee).filter(
        Employee.company_id == current_user.company_id,
        LeaveRequest.status == LeaveStatus.approved
    )

    if current_user.role == UserRole.employee:
        query = query.filter(LeaveRequest.employee_id == current_user.id)

    leaves = query.all()
    events = []
    for leave in leaves:
        events.append({
            "id": leave.id,
            "title": f"{leave.employee.first_name} {leave.employee.last_name}" if current_user.role != UserRole.employee else leave.leave_type.name,
            "start": leave.start_date.isoformat(),
            "end": leave.end_date.isoformat(),
            "leave_type": leave.leave_type.name,
            "color": leave.leave_type.color,
            "days": leave.days
        })
    return events


def _format_leaves(leaves, include_employee=False):
    result = []
    for leave in leaves:
        data = {
            "id": leave.id,
            "leave_type": {"id": leave.leave_type.id, "name": leave.leave_type.name, "color": leave.leave_type.color, "is_paid": leave.leave_type.is_paid},
            "start_date": leave.start_date.isoformat(),
            "end_date": leave.end_date.isoformat(),
            "days": leave.days,
            "reason": leave.reason,
            "status": leave.status.value,
            "certificate_path": leave.certificate_path,
            "created_at": leave.created_at.isoformat() if leave.created_at else None,
            "approved_at": leave.approved_at.isoformat() if leave.approved_at else None,
            "rejection_reason": leave.rejection_reason
        }
        if include_employee:
            data["employee"] = {
                "id": leave.employee.id,
                "login_id": leave.employee.login_id,
                "first_name": leave.employee.first_name,
                "last_name": leave.employee.last_name,
                "avatar_path": leave.employee.avatar_path
            }
        result.append(data)
    return result
