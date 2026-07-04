from sqlalchemy import Column, Integer, String, ForeignKey, Date, Text
from sqlalchemy.orm import relationship
from app.database import Base

class EmployeeProfile(Base):
    __tablename__ = "employee_profiles"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), unique=True, nullable=False)
    about = Column(Text, nullable=True)
    dob = Column(Date, nullable=True)
    nationality = Column(String(100), nullable=True)
    personal_email = Column(String(200), nullable=True)
    gender = Column(String(20), nullable=True)
    marital_status = Column(String(30), nullable=True)
    address = Column(Text, nullable=True)
    bank_name = Column(String(200), nullable=True)
    account_number = Column(String(30), nullable=True)
    ifsc_code = Column(String(20), nullable=True)
    pan_number = Column(String(20), nullable=True)
    uan_number = Column(String(20), nullable=True)
    employee_code = Column(String(50), nullable=True)
    hobbies = Column(Text, nullable=True)

    employee = relationship("Employee", back_populates="profile")


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    name = Column(String(200), nullable=False)
    level = Column(String(50), nullable=True)  # Beginner/Intermediate/Expert

    employee = relationship("Employee", back_populates="skills")


class Certification(Base):
    __tablename__ = "certifications"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    name = Column(String(300), nullable=False)
    issuer = Column(String(200), nullable=True)
    issue_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)

    employee = relationship("Employee", back_populates="certifications")
