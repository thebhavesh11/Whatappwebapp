"""SQLAlchemy async database setup."""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

# Get database URL from environment or use SQLite
database_url = os.getenv("DATABASE_URL")

# Default to SQLite if no DATABASE_URL is set
if not database_url:
    database_url = "sqlite+aiosqlite:///./smartflow.db"
    print("No DATABASE_URL set, using SQLite database")
else:
    # Convert PostgreSQL to async format if needed
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
        print(f"Using PostgreSQL database")
    elif database_url.startswith("sqlite"):
        print("Using SQLite database from environment")

print(f"Database URL configured: {database_url[:50]}...")

try:
    engine = create_async_engine(
        database_url,
        echo=False,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        # SQLite-specific options (safe to ignore for PostgreSQL)
        connect_args={"timeout": 30} if "sqlite" in database_url else {}
    )
except Exception as e:
    print(f"Error creating database engine: {e}")
    print("Falling back to SQLite")
    engine = create_async_engine(
        "sqlite+aiosqlite:///./smartflow.db",
        echo=False,
        pool_pre_ping=True
    )

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with async_session() as session:
        async with session.begin():
            yield session
