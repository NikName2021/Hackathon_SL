import asyncio
import sys
import os

# Скрипт для выдачи админских прав любому зарегистрированному email
# Запускать из папки src: python make_admin.py admin@test.com

sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'app'))
from core.config import sessionmaker
from database.all_models import Role, User
from sqlalchemy import select

async def main(email: str):
    async with sessionmaker() as session:
        stmt = select(User).where(User.email == email)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            print(f"Пользователь с email {email} не найден.")
            return

        user.role = Role.ADMIN
        await session.commit()
        print(f"Успех! Пользователь {email} теперь стал АДМИНИСТРАТОРОМ.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Использование: python make_admin.py <email>")
        sys.exit(1)
    
    asyncio.run(main(sys.argv[1]))
