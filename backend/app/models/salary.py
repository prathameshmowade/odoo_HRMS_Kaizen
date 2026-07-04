from sqlalchemy import Column, Integer, String, ForeignKey, Float, Enum as SAEnum, Boolean
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class CalcType(str, enum.Enum):
    fixed = "fixed"
    percentage = "percentage"

class ComponentType(str, enum.Enum):
    allowance = "allowance"
    deduction = "deduction"

class SalaryStructure(Base):
    __tablename__ = "salary_structures"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), unique=True, nullable=False)
    monthly_wage = Column(Float, default=0.0)
    yearly_wage = Column(Float, default=0.0)
    working_days = Column(Integer, default=26)
    break_time = Column(Integer, default=60)  # minutes per day

    employee = relationship("Employee", back_populates="salary_structure")
    components = relationship("SalaryComponent", back_populates="salary_structure", cascade="all, delete-orphan")


class SalaryComponent(Base):
    __tablename__ = "salary_components"

    id = Column(Integer, primary_key=True, index=True)
    salary_structure_id = Column(Integer, ForeignKey("salary_structures.id"), nullable=False)
    name = Column(String(200), nullable=False)
    component_type = Column(SAEnum(ComponentType), nullable=False)
    calc_type = Column(SAEnum(CalcType), default=CalcType.fixed)
    value = Column(Float, default=0.0)  # fixed amount or percentage
    is_active = Column(Boolean, default=True)

    salary_structure = relationship("SalaryStructure", back_populates="components")
