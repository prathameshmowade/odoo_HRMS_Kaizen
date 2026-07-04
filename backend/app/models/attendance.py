from sqlalchemy import Column, Integer, String, ForeignKey, Date, DateTime, Float, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class AttendanceStatus(str, enum.Enum):
    present = "present"
    absent = "absent"
    half_day = "half_day"
    on_leave = "on_leave"

class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    date = Column(Date, nullable=False, index=True)
    check_in = Column(DateTime, nullable=True)
    check_out = Column(DateTime, nullable=True)
    work_hours = Column(Float, default=0.0)
    extra_hours = Column(Float, default=0.0)
    status = Column(SAEnum(AttendanceStatus), default=AttendanceStatus.present)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee = relationship("Employee", back_populates="attendances")
