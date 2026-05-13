# TaskFlow — FARM Stack Task Management Application

A full-stack task management app built with **FastAPI**, **React**, and **MongoDB**.

## 🚀 Features

- 🔐 **JWT Authentication** (Register / Login / Protected routes)
- ✅ **Full CRUD** for tasks (Create, Read, Update, Delete)
- 🔴 **Real-time updates** via WebSockets
- 🔍 **Filtering & Search** by status, priority, and keyword
- 📊 **Dashboard** with stats, completion rate, and recent tasks
- 📱 **Fully Responsive** (desktop sidebar + mobile bottom nav)
- 🌙 **Dark glassmorphism UI**

## 📁 Project Structure

```
Task-Management-Application/
├── backend/         # FastAPI + MongoDB
│   ├── app/
│   │   ├── main.py          # App entry + WebSocket
│   │   ├── config.py        # Settings
│   │   ├── database.py      # Motor (async MongoDB)
│   │   ├── models/          # Pydantic schemas
│   │   ├── routes/          # auth.py, tasks.py
│   │   └── utils/           # JWT, bcrypt
│   └── requirements.txt
└── frontend/        # React + Vite
    ├── src/
    │   ├── api/             # Axios + service layer
    │   ├── components/      # TaskCard, TaskModal, Sidebar
    │   ├── context/         # AuthContext
    │   ├── hooks/           # useTaskSocket (WebSocket)
    │   ├── layouts/         # AppLayout
    │   └── pages/           # Login, Register, Dashboard, Tasks
    └── .env
```

## ⚙️ Setup & Run

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB (local or Atlas)

---

### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Copy env file
copy .env.example .env       # Windows
# cp .env.example .env       # Mac/Linux

# Start the server
uvicorn app.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

App runs at: http://localhost:5173

---

## 🔌 API Endpoints

| Method | Endpoint              | Description             | Auth |
|--------|-----------------------|-------------------------|------|
| POST   | `/api/auth/register`  | Register new user       | ❌   |
| POST   | `/api/auth/login`     | Login + get JWT         | ❌   |
| GET    | `/api/auth/me`        | Get current user        | ✅   |
| GET    | `/api/tasks`          | List tasks (paginated)  | ✅   |
| POST   | `/api/tasks`          | Create task             | ✅   |
| GET    | `/api/tasks/stats`    | Task statistics         | ✅   |
| GET    | `/api/tasks/{id}`     | Get single task         | ✅   |
| PATCH  | `/api/tasks/{id}`     | Update task             | ✅   |
| DELETE | `/api/tasks/{id}`     | Delete task             | ✅   |
| WS     | `/ws?token=<JWT>`     | Real-time task events   | ✅   |

## 🛠 Tech Stack

| Layer     | Technology                         |
|-----------|------------------------------------|
| Frontend  | React 18, Vite, React Router v6    |
| Styling   | Vanilla CSS (glassmorphism, dark)  |
| HTTP      | Axios                              |
| Backend   | FastAPI (Python)                   |
| Auth      | JWT (python-jose) + bcrypt         |
| Database  | MongoDB (Motor async driver)       |
| Real-time | WebSockets                         |