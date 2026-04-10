import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock

from main import app
from core.config import async_get_db
from database.all_models import User, Role

# Mock dependencies
@pytest_asyncio.fixture
async def mock_db_session():
    """Provides a mocked AsyncSession for database dependency injection."""
    from unittest.mock import MagicMock
    session_mock = AsyncMock()
    session_mock.add = MagicMock()
    session_mock.add_all = MagicMock()
    session_mock.delete = MagicMock()
    return session_mock

@pytest_asyncio.fixture
async def test_client(mock_db_session):
    """Provides a Test Client with overridden dependencies."""
    app.dependency_overrides[async_get_db] = lambda: mock_db_session
    
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client
        
    app.dependency_overrides.clear()

# Dummy Data Fixtures
@pytest.fixture
def mock_student_user():
    return User(
        id=1, 
        email="student@test.com", 
        hashed_password="hashed_pass", 
        full_name="Test Student", 
        role=Role.STUDENT,
        points=0,
        reputation=0.0,
        is_active=True,
        is_verified=True
    )

@pytest.fixture
def mock_employee_user():
    return User(
        id=2, 
        email="employee@test.com", 
        hashed_password="hashed_pass", 
        full_name="Test Employee", 
        role=Role.EMPLOYEE,
        points=0,
        reputation=0.0,
        is_active=True,
        is_verified=True
    )

@pytest.fixture
def mock_admin_user():
    return User(
        id=3, 
        email="admin@test.com", 
        hashed_password="hashed_pass", 
        full_name="Test Admin", 
        role=Role.ADMIN,
        points=0,
        reputation=0.0,
        is_active=True,
        is_verified=True
    )
