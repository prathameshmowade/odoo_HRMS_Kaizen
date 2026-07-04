# HRMS Kaizen Suite

A full-stack, multi-tenant **Human Resource Management System (HRMS)** built for the Odoo Hackathon. It handles the full employee lifecycle — onboarding, attendance, leave management, salary structuring, and payroll processing — through a modern web dashboard.

---

> 📦 **Note:** This repository is provided as a complete, ready-to-run project folder containing the full source code for both the backend and frontend — no additional setup beyond installing dependencies is required to get it running locally.

## 🧭 Overview

Kaizen Suite is designed as a self-serve HR platform for organizations of any size. A company signs up once and gets its own isolated workspace (multi-tenant by `company_id`), with role-based access for Admins, HR Officers, and Employees. Every employee gets an auto-generated Employee ID and login credentials, and can manage their own attendance, leave requests, and profile — while Admins and HR get full visibility and control over the workforce.

The system is built as two independently deployable services — a **FastAPI backend** (REST API + JWT auth) and a **React frontend** (SPA dashboard) — connected through a clean API layer, and can be run either locally or fully containerized via Docker Compose.

---

## ✨ Features

### 🔐 Authentication & Access Control
- Company registration flow — creates a company and its first Admin account in one step
- JWT-based login with access + refresh tokens
- Auto-generated unique **Login IDs** (e.g. `JODO20260001`) and default passwords on employee creation
- Role-based permissions: **Admin**, **HR Officer**, **Employee**
- Change password / profile management

### 👥 Employee Management
- Add, view, update, and deactivate employee records
- Rich employee profiles (contact info, joining date, department, manager, documents/certificates)
- Department management with assigned managers
- Avatar and certificate uploads

### 🕒 Attendance
- Daily check-in/check-out tracking
- Attendance status per day (present / absent / on leave)
- Attendance summary and history views
- Calendar-based attendance visualization

### 🌴 Leave Management
- Employees can raise leave requests
- HR/Admin approval workflow (approve/reject pending requests)
- Leave status tracking and history

### 💰 Salary & Payroll
- Configurable salary structures per employee
- Automated payroll calculation engine (`salary_calculator` service)
- Payroll generation and history records
- Company-wide payroll and salary views for HR/Admin

### 🏢 Company Administration
- Company profile management (name, logo, address, contact details)
- Department creation, editing, and deletion
- Company-wide dashboard with real-time stats: total employees, present today, on leave, pending approvals

### 📊 Dashboard
- At-a-glance stats cards for company health
- Recent employees, pending leave approvals, attendance summaries
- Personalized welcome and quick navigation

---

## 🛠️ Technology Stack

### Backend
| Layer | Technology |
|---|---|
| Framework | **FastAPI** (Python) |
| ORM | **SQLAlchemy** |
| Database | SQLite (local dev) / **PostgreSQL** (Docker/production) |
| Auth | **JWT** (access + refresh tokens), `python-jose`, `passlib` |
| Server | **Uvicorn** (ASGI) |
| Validation | **Pydantic** |

### Frontend
| Layer | Technology |
|---|---|
| Framework | **React 19** |
| Build tool | **Vite** |
| Styling | **Tailwind CSS v4** |
| State management | **Zustand** (with persisted auth store) |
| Routing | **React Router v7** |
| Forms & validation | **React Hook Form** + **Zod** |
| HTTP client | **Axios** (with auth-refresh interceptors) |
| Animation | **Framer Motion** |
| Charts | **Recharts** |
| UI utilities | **Lucide React** / **React Icons**, **React Hot Toast**, **date-fns**, **react-calendar** |

### Infrastructure
- **Docker & Docker Compose** — containerized backend, frontend, and PostgreSQL for one-command startup
- **Vite dev server proxy** — routes `/api` and `/uploads` calls to the backend during local development

---

## 📁 Project Structure

```
odoo_hackathon/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entrypoint & router mounting
│   │   ├── database.py          # SQLAlchemy engine/session setup
│   │   ├── core/config.py       # Environment-driven settings
│   │   ├── auth/                # JWT handling & auth dependencies
│   │   ├── models/               # company, department, employee, salary, attendance, leave, payroll
│   │   ├── routers/              # auth, employees, attendance, leaves, salary, payroll, company
│   │   ├── services/             # salary_calculator.py
│   │   └── utils/                # employee_id.py (login ID + default password generation)
│   ├── requirements.txt
│   ├── .env
│   └── uploads/                  # avatars, certificates, logos
├── frontend/
│   ├── src/
│   │   ├── pages/                # Login, Register, Dashboard, Employees, Attendance, Leaves, Salary, Payroll, Company, Profile
│   │   ├── components/           # Layout, Sidebar, Topbar, AddEmployeeModal
│   │   ├── store/authStore.js    # Zustand auth store
│   │   └── api/                  # Axios instance + API modules
│   └── package.json
├── docker-compose.yml
├── run.bat                       # Docker Compose launcher (Windows)
└── start-local.bat               # Local (no Docker) launcher (Windows)
```

---

## 🚀 Getting Started

### Option A — Docker (recommended)
```bash
docker-compose up --build
```
- Frontend → http://localhost:5173
- Backend API docs → http://localhost:8000/api/docs
- PostgreSQL → localhost:5432

### Option B — Run locally

**Backend:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Then open **http://localhost:5173** and register your company to get started.

---

## 🔑 First-Time Login Flow

1. Go to `/register` and create your company + admin account.
2. Note the **Login ID** generated for you (shown on the success screen).
3. Log in at `/login` using that Login ID and the password you set.
4. As Admin, go to **Employees → Add Employee** to onboard your team — each new employee gets an auto-generated Login ID and default password (`{login_id}@Hrms123`), which you share with them manually.

---

## 📄 API Documentation

Once the backend is running, interactive API docs are available at:
- Swagger UI → `http://localhost:8000/api/docs`
- ReDoc → `http://localhost:8000/api/redoc`

---

## 👤 Team

Team Kaizen