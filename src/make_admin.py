import asyncio
import os
import subprocess
import sys
from pathlib import Path


def ensure_project_venv() -> None:
    script_path = Path(__file__).resolve()
    project_root = script_path.parent.parent
    venv_python = project_root / ".venv" / "Scripts" / "python.exe"

    if not venv_python.exists():
        return

    if Path(sys.executable).resolve() == venv_python.resolve():
        return

    result = subprocess.run([str(venv_python), str(script_path), *sys.argv[1:]], check=False)
    raise SystemExit(result.returncode)


ensure_project_venv()

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "app"))

from sqlalchemy import select

from core.config import engine, sessionmaker
from database.all_models import Role, User, create_tables


async def main(email: str) -> int:
    await create_tables(engine)

    async with sessionmaker() as session:
        stmt = select(User).where(User.email == email)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if not user:
            print(f"User with email {email} not found.")
            return 1

        user.role = Role.ADMIN
        await session.commit()
        print(f"User {email} is now admin.")
        return 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py <email>")
        raise SystemExit(1)

    raise SystemExit(asyncio.run(main(sys.argv[1])))
