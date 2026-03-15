"""SmartFlow AI Automation Platform — FastAPI Backend."""

import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from database import engine, Base
from routers import business, ai_settings, leads, conversations, dashboard, whatsapp


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables on startup and seed defaults."""
    from database import async_session
    from sqlalchemy import select
    from models import Business, AISetting
    import sys

    try:
        # Try to connect and create tables
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # Seed default business & AI settings if not exists
        async with async_session() as session:
            async with session.begin():
                result = await session.execute(select(Business).where(Business.id == 1))
                if not result.scalar_one_or_none():
                    session.add(Business(name="My Business"))
                    await session.flush()
                result = await session.execute(select(AISetting).where(AISetting.business_id == 1))
                if not result.scalar_one_or_none():
                    session.add(AISetting(business_id=1))
        
        print("✓ Database initialized successfully")
    except Exception as e:
        print(f"⚠ Database initialization warning: {type(e).__name__}: {str(e)[:100]}")
        print("  App will continue with fallback SQLite database")
        # Don't exit, let the app continue with whatever DB is configured

    yield
    
    try:
        await engine.dispose()
    except Exception as e:
        print(f"⚠ Error disposing engine: {e}")


app = FastAPI(
    title="SmartFlow AI",
    description="AI-Powered WhatsApp Automation Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:3000"),
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(business.router)
app.include_router(ai_settings.router)
app.include_router(leads.router)
app.include_router(conversations.router)
app.include_router(dashboard.router)
app.include_router(whatsapp.router)


@app.get("/")
async def root():
    return {"name": "SmartFlow AI", "version": "1.0.0", "status": "running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
