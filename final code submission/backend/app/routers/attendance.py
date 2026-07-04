from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date, timedelta

from app.database import get_db
from app.models.employee import Employee, UserRole
from app.models.attendance import Attendance, AttendanceStatus
from app.auth.dependencies import get_current_user, require_hr_or_admin

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


@router.post("/clock-in")
def clock_in(current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    existing = db.query(Attendance).filter(
        Attendance.employee_id == current_user.id,
        Attendance.date == today
    ).first()

    if existing and existing.check_in:
        raise HTTPException(status_code=400, detail="Already clocked in today")

    if existing:
        existing.check_in = datetime.utcnow()
        existing.status = AttendanceStatus.present
    else:
        attendance = Attendance(
            employee_id=current_user.id,
            date=today,
            check_in=datetime.utcnow(),
            status=AttendanceStatus.present
        )
        db.add(attendance)

    db.commit()
    return {"message": "Clocked in successfully", "time": datetime.utcnow().isoformat()}


@router.post("/clock-out")
def clock_out(current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    attendance = db.query(Attendance).filter(
        Attendance.employee_id == current_user.id,
        Attendance.date == today
    ).first()

    if not attendance or not attendance.check_in:
        raise HTTPException(status_code=400, detail="Not clocked in today")
    if attendance.check_out:
        raise HTTPException(status_code=400, detail="Already clocked out today")

    now = datetime.utcnow()
    attendance.check_out = now
    duration = (now - attendance.check_in).total_seconds() / 3600
    attendance.work_hours = round(duration, 2)
    attendance.extra_hours = round(max(0, duration - 8), 2)

    db.commit()
    return {"message": "Clocked out successfully", "work_hours": attendance.work_hours}


@router.get("/status")
def get_clock_status(current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    attendance = db.query(Attendance).filter(
        Attendance.employee_id == current_user.id,
        Attendance.date == today
    ).first()

    if not attendance:
        return {"status": "not_clocked_in", "check_in": None, "check_out": None}
    if attendance.check_in and not attendance.check_out:
        return {"status": "clocked_in", "check_in": attendance.check_in.isoformat(), "check_out": None}
    return {"status": "clocked_out", "check_in": attendance.check_in.isoformat(), "check_out": attendance.check_out.isoformat(), "work_hours": attendance.work_hours}


@router.get("/my")
def my_attendance(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: Employee = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Attendance).filter(Attendance.employee_id == current_user.id)
    if month and year:
        from sqlalchemy import extract
        query = query.filter(
            extract('month', Attendance.date) == month,
            extract('year', Attendance.date) == year
        )
    records = query.order_by(Attendance.date.desc()).all()

    return [
        {
            "id": r.id,
            "date": r.date.isoformat(),
            "check_in": r.check_in.isoformat() if r.check_in else None,
            "check_out": r.check_out.isoformat() if r.check_out else None,
            "work_hours": r.work_hours,
            "extra_hours": r.extra_hours,
            "status": r.status.value
        }
        for r in records
    ]


@router.get("/")
def all_attendance(
    month: Optional[int] = None,
    year: Optional[int] = None,
    employee_id: Optional[int] = None,
    search: Optional[str] = None,
    current_user: Employee = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    from sqlalchemy import extract
    query = db.query(Attendance).join(Employee).filter(Employee.company_id == current_user.company_id)

    if month and year:
        query = query.filter(
            extract('month', Attendance.date) == month,
            extract('year', Attendance.date) == year
        )
    if employee_id:
        query = query.filter(Attendance.employee_id == employee_id)
    if search:
        query = query.filter(
            (Employee.first_name.ilike(f"%{search}%")) |
            (Employee.last_name.ilike(f"%{search}%")) |
            (Employee.login_id.ilike(f"%{search}%"))
        )

    records = query.order_by(Attendance.date.desc()).limit(500).all()

    return [
        {
            "id": r.id,
            "employee_id": r.employee_id,
            "employee_name": f"{r.employee.first_name} {r.employee.last_name}",
            "employee_login_id": r.employee.login_id,
            "date": r.date.isoformat(),
            "check_in": r.check_in.isoformat() if r.check_in else None,
            "check_out": r.check_out.isoformat() if r.check_out else None,
            "work_hours": r.work_hours,
            "extra_hours": r.extra_hours,
            "status": r.status.value
        }
        for r in records
    ]


@router.get("/summary")
def attendance_summary(current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    today = date.today()
    month_start = today.replace(day=1)

    records = db.query(Attendance).filter(
        Attendance.employee_id == current_user.id,
        Attendance.date >= month_start,
        Attendance.date <= today
    ).all()

    present = sum(1 for r in records if r.status == AttendanceStatus.present)
    total_hours = sum(r.work_hours for r in records)
    extra_hours = sum(r.extra_hours for r in records)

    return {
        "present_days": present,
        "total_work_hours": round(total_hours, 2),
        "total_extra_hours": round(extra_hours, 2),
        "records_this_month": len(records)
    }
