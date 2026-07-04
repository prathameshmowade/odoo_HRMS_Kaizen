from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.database import engine, Base
from app.routers import auth, employees, attendance, leaves, salary, payroll, company

# Import all models to ensure they're registered
import app.models.company
import app.models.department
import app.models.employee
import app.models.employee_profile
import app.models.salary
import app.models.attendance
import app.models.leave
import app.models.payroll

# Create all tables
Base.metadata.create_all(bind=engine)

# Create upload directories
os.makedirs(os.path.join(settings.UPLOAD_DIR, "avatars"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "logos"), exist_ok=True)
os.makedirs(os.path.join(settings.UPLOAD_DIR, "certificates"), exist_ok=True)

app = FastAPI(
    title="GLOBAL HR SOLUTIONS API",
    description="GLOBAL HR SOLUTIONS API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include routers
app.include_router(auth.router)
app.include_router(employees.router)
app.include_router(attendance.router)
app.include_router(leaves.router)
app.include_router(salary.router)
app.include_router(payroll.router)
app.include_router(company.router)

@app.get("/")
def root():
    return {"message": "HRMS API is running", "docs": "/api/docs"}

@app.get("/health")
def health():
    return {"status": "healthy"}
