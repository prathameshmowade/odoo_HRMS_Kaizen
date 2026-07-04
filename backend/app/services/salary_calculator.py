from app.models.salary import SalaryStructure, SalaryComponent, ComponentType, CalcType
from typing import Dict, Any

def calculate_salary(salary_structure: SalaryStructure, payable_days: float = None) -> Dict[str, Any]:
    """
    Calculate net salary from salary structure components.
    payable_days: if provided, prorate the salary
    """
    working_days = salary_structure.working_days or 26
    monthly_wage = salary_structure.monthly_wage or 0.0
    
    if payable_days is None:
        payable_days = working_days
    
    prorate_factor = payable_days / working_days if working_days > 0 else 0

    total_allowances = 0.0
    total_deductions = 0.0
    breakdown = {"allowances": [], "deductions": []}

    for comp in salary_structure.components:
        if not comp.is_active:
            continue
        
        if comp.calc_type == CalcType.percentage:
            amount = (comp.value / 100) * monthly_wage
        else:
            amount = comp.value
        
        # Prorate
        amount = round(amount * prorate_factor, 2)

        if comp.component_type == ComponentType.allowance:
            total_allowances += amount
            breakdown["allowances"].append({"name": comp.name, "amount": amount})
        else:
            total_deductions += amount
            breakdown["deductions"].append({"name": comp.name, "amount": amount})

    gross_salary = round((monthly_wage * prorate_factor) + total_allowances, 2)
    net_salary = round(gross_salary - total_deductions, 2)

    return {
        "payable_days": payable_days,
        "working_days": working_days,
        "monthly_wage": monthly_wage,
        "gross_salary": gross_salary,
        "total_allowances": total_allowances,
        "total_deductions": total_deductions,
        "net_salary": net_salary,
        "breakdown": breakdown
    }
