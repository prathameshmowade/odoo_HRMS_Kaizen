from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import Optional
from datetime import date
import json, calendar

from app.database import get_db
from app.models.employee import Employee, UserRole
from app.models.payroll import Payroll, PayrollStatus
from app.models.attendance import Attendance, AttendanceStatus
from app.models.leave import LeaveRequest, LeaveStatus, LeaveType
from app.models.salary import SalaryStructure
from app.auth.dependencies import get_current_user, require_hr_or_admin
from app.services.salary_calculator import calculate_salary

router = APIRouter(prefix="/api/payroll", tags=["Payroll"])


class GeneratePayrollRequest(BaseModel):
    employee_id: int
    month: int
    year: int


@router.post("/generate")
def generate_payroll(req: GeneratePayrollRequest, current_user: Employee = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    # Check existing
    existing = db.query(Payroll).filter(
        Payroll.employee_id == req.employee_id,
        Payroll.month == req.month,
        Payroll.year == req.year
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Payroll already generated for this period")

    salary_structure = db.query(SalaryStructure).options(joinedload(SalaryStructure.components)).filter(
        SalaryStructure.employee_id == req.employee_id
    ).first()
    if not salary_structure:
        raise HTTPException(status_code=404, detail="Salary structure not found for this employee")

    # Calculate attendance in the month
    month_start = date(req.year, req.month, 1)
    month_end = date(req.year, req.month, calendar.monthrange(req.year, req.month)[1])

    attendances = db.query(Attendance).filter(
        Attendance.employee_id == req.employee_id,
        Attendance.date >= month_start,
        Attendance.date <= month_end
    ).all()

    present_days = sum(1 for a in attendances if a.status == AttendanceStatus.present)
    on_leave_days = sum(1 for a in attendances if a.status == AttendanceStatus.on_leave)

    # Find unpaid leave days in this month
    unpaid_leave_type = db.query(LeaveType).filter(LeaveType.is_paid == False).all()
    unpaid_leave_type_ids = [lt.id for lt in unpaid_leave_type]

    unpaid_leaves = db.query(LeaveRequest).filter(
        LeaveRequest.employee_id == req.employee_id,
        LeaveRequest.status == LeaveStatus.approved,
        LeaveRequest.leave_type_id.in_(unpaid_leave_type_ids),
        LeaveRequest.start_date >= month_start,
        LeaveRequest.start_date <= month_end
    ).all()

    unpaid_leave_days = sum(l.days for l in unpaid_leaves)

    # Payable days = present + paid leave - unpaid leave
    working_days = salary_structure.working_days or 26
    paid_leave_days = on_leave_days - unpaid_leave_days
    payable_days = max(0, present_days + max(0, paid_leave_days))

    # Calculate salary
    calc = calculate_salary(salary_structure, payable_days=payable_days)

    payroll = Payroll(
        employee_id=req.employee_id,
        month=req.month,
        year=req.year,
        working_days=working_days,
        payable_days=payable_days,
        present_days=present_days,
        leave_days=on_leave_days,
        unpaid_leave_days=unpaid_leave_days,
        gross_salary=calc["gross_salary"],
        total_allowances=calc["total_allowances"],
        total_deductions=calc["total_deductions"],
        net_salary=calc["net_salary"],
        status=PayrollStatus.generated,
        breakdown=json.dumps(calc["breakdown"])
    )
    db.add(payroll)
    db.commit()
    db.refresh(payroll)

    return {
        "message": "Payroll generated successfully",
        "id": payroll.id,
        "net_salary": payroll.net_salary,
        "payable_days": payroll.payable_days,
        "breakdown": calc["breakdown"]
    }


@router.get("/my")
def my_payroll(current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    payrolls = db.query(Payroll).filter(Payroll.employee_id == current_user.id).order_by(Payroll.year.desc(), Payroll.month.desc()).all()
    return [_fmt_payroll(p) for p in payrolls]


@router.get("/")
def all_payroll(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: Employee = Depends(require_hr_or_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Payroll).join(Employee).filter(Employee.company_id == current_user.company_id)
    if month:
        query = query.filter(Payroll.month == month)
    if year:
        query = query.filter(Payroll.year == year)

    payrolls = query.order_by(Payroll.year.desc(), Payroll.month.desc()).all()
    return [_fmt_payroll(p, include_employee=True) for p in payrolls]


@router.get("/{payroll_id}")
def get_payslip(payroll_id: int, current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    payroll = db.query(Payroll).filter(Payroll.id == payroll_id).first()
    if not payroll:
        raise HTTPException(status_code=404, detail="Payroll not found")

    if current_user.id != payroll.employee_id and current_user.role not in [UserRole.hr_officer, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Access denied")

    return _fmt_payroll(payroll, include_employee=True, include_breakdown=True)


def _fmt_payroll(p: Payroll, include_employee=False, include_breakdown=False) -> dict:
    data = {
        "id": p.id,
        "employee_id": p.employee_id,
        "month": p.month,
        "year": p.year,
        "working_days": p.working_days,
        "payable_days": p.payable_days,
        "present_days": p.present_days,
        "leave_days": p.leave_days,
        "unpaid_leave_days": p.unpaid_leave_days,
        "gross_salary": p.gross_salary,
        "total_allowances": p.total_allowances,
        "total_deductions": p.total_deductions,
        "net_salary": p.net_salary,
        "status": p.status.value,
        "generated_at": p.generated_at.isoformat() if p.generated_at else None
    }
    if include_employee and p.employee:
        data["employee"] = {
            "id": p.employee.id,
            "login_id": p.employee.login_id,
            "first_name": p.employee.first_name,
            "last_name": p.employee.last_name,
            "avatar_path": p.employee.avatar_path
        }
    if include_breakdown and p.breakdown:
        try:
            data["breakdown"] = json.loads(p.breakdown)
        except:
            data["breakdown"] = {}
    return data
