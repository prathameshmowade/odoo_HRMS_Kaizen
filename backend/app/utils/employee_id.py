from sqlalchemy.orm import Session
from app.models.employee import Employee

def generate_employee_login_id(db: Session, first_name: str, last_name: str, joining_year: int) -> str:
    """
    Format: {fn[:2].upper()}{ln[:2].upper()}{year}{seq:04d}
    Example: John Doe 2025 → JODO20250001
    """
    prefix = (first_name[:2] + last_name[:2]).upper()
    year_str = str(joining_year)
    base_prefix = prefix + year_str

    # Count existing employees with same prefix
    existing = db.query(Employee).filter(
        Employee.login_id.like(f"{base_prefix}%")
    ).count()

    seq = existing + 1
    return f"{base_prefix}{seq:04d}"


def generate_default_password(login_id: str) -> str:
    """Default password: loginId@123"""
    return f"{login_id}@Hrms123"
