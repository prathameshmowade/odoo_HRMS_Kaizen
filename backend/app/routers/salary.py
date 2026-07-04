from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import Optional, List
import json

from app.database import get_db
from app.models.employee import Employee, UserRole
from app.models.salary import SalaryStructure, SalaryComponent, ComponentType, CalcType
from app.auth.dependencies import get_current_user, require_hr_or_admin, require_admin

router = APIRouter(prefix="/api/salary", tags=["Salary"])


class SalaryStructureUpdate(BaseModel):
    monthly_wage: float
    working_days: Optional[int] = 26
    break_time: Optional[int] = 60


class ComponentCreate(BaseModel):
    name: str
    component_type: ComponentType
    calc_type: CalcType = CalcType.fixed
    value: float
    is_active: bool = True


class ComponentUpdate(BaseModel):
    name: Optional[str] = None
    component_type: Optional[ComponentType] = None
    calc_type: Optional[CalcType] = None
    value: Optional[float] = None
    is_active: Optional[bool] = None


def _default_components(salary_id: int, monthly_wage: float) -> List[SalaryComponent]:
    return [
        SalaryComponent(salary_structure_id=salary_id, name="Basic Salary", component_type=ComponentType.allowance, calc_type=CalcType.percentage, value=50.0),
        SalaryComponent(salary_structure_id=salary_id, name="House Rent Allowance (HRA)", component_type=ComponentType.allowance, calc_type=CalcType.percentage, value=20.0),
        SalaryComponent(salary_structure_id=salary_id, name="Standard Allowance", component_type=ComponentType.allowance, calc_type=CalcType.fixed, value=2000.0),
        SalaryComponent(salary_structure_id=salary_id, name="Performance Bonus", component_type=ComponentType.allowance, calc_type=CalcType.percentage, value=5.0),
        SalaryComponent(salary_structure_id=salary_id, name="Leave Travel Allowance", component_type=ComponentType.allowance, calc_type=CalcType.fixed, value=1500.0),
        SalaryComponent(salary_structure_id=salary_id, name="Provident Fund (Employee)", component_type=ComponentType.deduction, calc_type=CalcType.percentage, value=12.0),
        SalaryComponent(salary_structure_id=salary_id, name="Professional Tax", component_type=ComponentType.deduction, calc_type=CalcType.fixed, value=200.0),
    ]


@router.get("/{employee_id}")
def get_salary(employee_id: int, current_user: Employee = Depends(get_current_user), db: Session = Depends(get_db)):
    # Only admin/HR or self
    if current_user.id != employee_id and current_user.role not in [UserRole.hr_officer, UserRole.admin]:
        raise HTTPException(status_code=403, detail="Access denied")

    structure = db.query(SalaryStructure).options(joinedload(SalaryStructure.components)).filter(
        SalaryStructure.employee_id == employee_id
    ).first()

    if not structure:
        return {"exists": False, "employee_id": employee_id}

    allowances = [c for c in structure.components if c.component_type == ComponentType.allowance and c.is_active]
    deductions = [c for c in structure.components if c.component_type == ComponentType.deduction and c.is_active]

    def fmt(c):
        return {"id": c.id, "name": c.name, "component_type": c.component_type.value, "calc_type": c.calc_type.value, "value": c.value, "is_active": c.is_active}

    return {
        "exists": True,
        "id": structure.id,
        "employee_id": employee_id,
        "monthly_wage": structure.monthly_wage,
        "yearly_wage": structure.monthly_wage * 12,
        "working_days": structure.working_days,
        "break_time": structure.break_time,
        "allowances": [fmt(c) for c in allowances],
        "deductions": [fmt(c) for c in deductions],
        "all_components": [fmt(c) for c in structure.components]
    }


@router.put("/{employee_id}")
def update_salary_structure(employee_id: int, req: SalaryStructureUpdate, current_user: Employee = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    structure = db.query(SalaryStructure).filter(SalaryStructure.employee_id == employee_id).first()

    if not structure:
        structure = SalaryStructure(
            employee_id=employee_id,
            monthly_wage=req.monthly_wage,
            yearly_wage=req.monthly_wage * 12,
            working_days=req.working_days,
            break_time=req.break_time
        )
        db.add(structure)
        db.flush()
        # Add default components
        for comp in _default_components(structure.id, req.monthly_wage):
            db.add(comp)
    else:
        structure.monthly_wage = req.monthly_wage
        structure.yearly_wage = req.monthly_wage * 12
        structure.working_days = req.working_days
        structure.break_time = req.break_time

    db.commit()
    return {"message": "Salary structure saved successfully"}


@router.post("/{employee_id}/components")
def add_component(employee_id: int, req: ComponentCreate, current_user: Employee = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    structure = db.query(SalaryStructure).filter(SalaryStructure.employee_id == employee_id).first()
    if not structure:
        raise HTTPException(status_code=404, detail="Salary structure not found")

    comp = SalaryComponent(
        salary_structure_id=structure.id,
        name=req.name,
        component_type=req.component_type,
        calc_type=req.calc_type,
        value=req.value,
        is_active=req.is_active
    )
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return {"id": comp.id, "name": comp.name, "message": "Component added"}


@router.put("/{employee_id}/components/{component_id}")
def update_component(employee_id: int, component_id: int, req: ComponentUpdate, current_user: Employee = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    structure = db.query(SalaryStructure).filter(SalaryStructure.employee_id == employee_id).first()
    if not structure:
        raise HTTPException(status_code=404, detail="Salary structure not found")

    comp = db.query(SalaryComponent).filter(SalaryComponent.id == component_id, SalaryComponent.salary_structure_id == structure.id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Component not found")

    for field, value in req.model_dump(exclude_none=True).items():
        setattr(comp, field, value)

    db.commit()
    return {"message": "Component updated"}


@router.delete("/{employee_id}/components/{component_id}")
def delete_component(employee_id: int, component_id: int, current_user: Employee = Depends(require_hr_or_admin), db: Session = Depends(get_db)):
    structure = db.query(SalaryStructure).filter(SalaryStructure.employee_id == employee_id).first()
    if not structure:
        raise HTTPException(status_code=404, detail="Salary structure not found")

    comp = db.query(SalaryComponent).filter(SalaryComponent.id == component_id, SalaryComponent.salary_structure_id == structure.id).first()
    if comp:
        db.delete(comp)
        db.commit()
    return {"message": "Component deleted"}
