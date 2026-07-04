from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    manager_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="departments")
    manager = relationship("Employee", foreign_keys=[manager_id])
    employees = relationship("Employee", back_populates="department", foreign_keys="Employee.department_id")
