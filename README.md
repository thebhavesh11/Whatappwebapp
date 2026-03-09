# SmartFlow AI - WhatsApp Automation Platform

Full-stack application with FastAPI backend and Next.js frontend for AI-powered WhatsApp automation.

## Project Structure

- **Backend**: FastAPI application with SQLAlchemy ORM
- **Frontend**: Next.js 14 with React 18
- **Database**: PostgreSQL

## Local Development

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
```

Create `.env` file:
```bash
cp .env.example .env
```

Update `.env` with your PostgreSQL connection string and API keys.

Start backend:
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:3000
```

## Deployment on Railway

### 1. Create GitHub Repository

```bash
cd "c:\Bhavesh\Automation\new app 3"
git init
git add .
git commit -m "Initial commit: SmartFlow AI Platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 2. Deploy on Railway

1. Go to [Railway.app](https://railway.app)
2. Sign in with your GitHub account
3. Click "New Project" → "Deploy from GitHub Repo"
4. Select your repository
5. Configure environment variables in Railway dashboard:
   - `DATABASE_URL`: PostgreSQL connection string (Railway will provide)
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `GOOGLE_API_KEY`: Your Google API key
   - `FRONTEND_URL`: Your deployed frontend URL
   - `ENVIRONMENT`: production

### 3. Configure Services in Railway

**Backend Service:**
- Build: Root Directory (automatic)
- Start Command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`

**Frontend Service:**
- Build: Root Directory
- Build Command: `cd frontend && npm install && npm run build`
- Start Command: `cd frontend && npm start`

**Database Service:**
- Add PostgreSQL plugin from Railway marketplace

### 4. Connect Services

- Link Backend to PostgreSQL database
- Link Frontend to Backend API

## Environment Variables

See `.env.example` for all required variables.

## Features

- AI-powered WhatsApp automation
- Business management
- Lead management
- Conversation tracking
- Dashboard analytics
- Customizable AI settings

## API Documentation

Once running, visit `http://localhost:8000/docs` for interactive API documentation.

## License

Proprietary - SmartFlow AI
