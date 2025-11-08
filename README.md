# FastAPI + React Monorepo

A **full-stack, type-safe monorepo** featuring a modern React frontend and an async Python FastAPI backend for accounting management. This project follows the [react-kit](https://github.com/DivineDemon/react-kit) template structure for rapid, scalable development.

---

## Project Structure

```
accounting-for-dummies-fastapi/
├── backend/                # FastAPI backend (Python)
│   ├── app/                # Main backend application code
│   │   ├── core/           # Core config, DB, logger, etc.
│   │   ├── constants/      # Seed data and static files
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── routers/        # API route definitions
│   │   ├── schemas/        # Pydantic schemas for validation
│   │   └── main.py         # FastAPI app entrypoint
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Backend environment variables
│   └── main.py            # Backend entry point
│
├── frontend/               # React frontend (TypeScript)
│   ├── src/                # Source code
│   │   ├── routes/         # Route components (file-based routing)
│   │   ├── store/          # Redux store & API services
│   │   ├── assets/         # Static assets (CSS, images)
│   │   └── main.tsx        # App entrypoint
│   ├── index.html          # HTML template
│   ├── package.json        # Frontend dependencies & scripts
│   ├── tsconfig*.json      # TypeScript configs
│   └── vite.config.ts      # Vite build config
│
├── .gitignore              # Git ignore rules
└── README.md               # This file
```

---

## Features

- **Account Management**: Create and manage multiple accounts
- **Transaction Tracking**: Record income, expenses, and transfers
- **Category Organization**: Categorize transactions with colors
- **RESTful API**: FastAPI with automatic OpenAPI documentation
- **Type Safety**: Pydantic + TypeScript end-to-end validation
- **Modern Frontend**: React with TanStack Router and Redux Toolkit
- **Database**: SQLAlchemy ORM with SQLite/PostgreSQL support
- **Seed Data**: Pre-populated with sample accounts and transactions

---

## Quick Start

### Prerequisites

- **Python 3.10+** (recommended: 3.12)
- **Node.js 18+** and **pnpm** (or npm/yarn)

### 1. Setup Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Edit .env for your configuration
```

### 2. Setup Frontend

```bash
cd frontend
pnpm install
```

### 3. Start Development Servers

**Backend:**
```bash
cd backend
python main.py
# Or: uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
pnpm run dev
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

---

## API Endpoints

### Accounts
- `GET /api/v1/accounts/` - Get all accounts
- `POST /api/v1/accounts/` - Create a new account
- `GET /api/v1/accounts/{account_id}` - Get specific account

### Transactions
- `GET /api/v1/transactions/` - Get all transactions
- `POST /api/v1/transactions/` - Create a new transaction
- `GET /api/v1/transactions/{transaction_id}` - Get specific transaction

### Categories
- `GET /api/v1/categories/` - Get all categories
- `POST /api/v1/categories/` - Create a new category
- `GET /api/v1/categories/{category_id}` - Get specific category

---

## Development

### Backend Development

The backend follows the react-kit structure:
- **Database migrations**: Use Alembic to manage schema changes. To set it up:
  1. `cd backend && source .venv/bin/activate`
  2. `alembic init migrations`
  3. Update `alembic.ini` to point `sqlalchemy.url` at your `DATABASE_URL`, or configure it inside `migrations/env.py` using `settings.DATABASE_URL`.
  4. Wire the models inside `migrations/env.py` by importing `Base` from `app.core.database`.
  5. Generate migrations with `alembic revision --autogenerate -m "describe change"` and apply them via `alembic upgrade head`.
  6. For a quick reset during development, you can still run `python -m app.core.init_db` to rebuild and reseed the database from scratch.
- **Auto-router inclusion**: All files in `app/routers/` are automatically included
- **Database seeding**: Initial data is loaded from `app/constants/seed_data.json`
- **Type safety**: Pydantic v2 for request/response validation
- **Async support**: SQLAlchemy async engine for high concurrency

### Frontend Development

The frontend uses modern React patterns:
- **File-based routing**: TanStack Router for zero-config routing
- **State management**: Redux Toolkit with RTK Query for API calls
- **Type safety**: Full TypeScript support with generated types
- **Styling**: Tailwind CSS for utility-first styling

### Adding New Features

1. **Backend**: Add new models in `backend/app/models/`, schemas in `backend/app/schemas/`, and routers in `backend/app/routers/`
2. **Frontend**: Add new routes in `frontend/src/routes/` and API endpoints in `frontend/src/store/api.ts`

---

## Production Deployment

For production deployment:

1. **Database**: Use PostgreSQL instead of SQLite
2. **Environment**: Set proper environment variables
3. **CORS**: Configure allowed origins
4. **Authentication**: Add JWT authentication
5. **Build**: Use `pnpm run build` for frontend and proper WSGI server for backend

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all tests pass
5. Submit a pull request

---

**Happy accounting!** 📊💰
