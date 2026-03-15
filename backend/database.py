"""SQLAlchemy async database setup."""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

# Use DATABASE_URL environment variable (from Railway/deployment)
# Fall back to SQLite for local development
database_url = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./smartflow.db")

# Replace postgresql:// with postgresql+asyncpg:// for async support
if database_url and database_url.startswith("postgresql://"):
    database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Configure echo based on environment
echo_sql = os.getenv("ENVIRONMENT", "development") == "development"

try:
    engine = create_async_engine(
        database_url,
        echo=echo_sql,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10
    )
except Exception as e:
    print(f"Database connection error: {e}")
    print(f"Using fallback SQLite database")
    engine = create_async_engine("sqlite+aiosqlite:///./smartflow.db", echo=echo_sql)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        async with session.begin():
            yield session
