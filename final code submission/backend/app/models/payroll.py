from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class PayrollStatus(str, enum.Enum):
    draft = "draft"
    generated = "generated"
    paid = "paid"

class Payroll(Base):
    __tablename__ = "payrolls"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    working_days = Column(Integer, default=0)
    payable_days = Column(Float, default=0.0)
    present_days = Column(Float, default=0.0)
    leave_days = Column(Float, default=0.0)
    unpaid_leave_days = Column(Float, default=0.0)
    gross_salary = Column(Float, default=0.0)
    total_allowances = Column(Float, default=0.0)
    total_deductions = Column(Float, default=0.0)
    net_salary = Column(Float, default=0.0)
    status = Column(SAEnum(PayrollStatus), default=PayrollStatus.draft)
    generated_at = Column(DateTime, default=datetime.utcnow)
    breakdown = Column(String(5000), nullable=True)  # JSON string of component breakdown

    employee = relationship("Employee", back_populates="payrolls")
