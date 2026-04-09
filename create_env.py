import random
import secrets
import string


def random_word(length: int) -> str:
    letters = string.ascii_letters
    return "".join(random.choice(letters) for _ in range(length))


with open(".env.example", "w", encoding="utf-8") as f:
    f.write(
        f"""# Backend / DB
POSTGRES_USER=user_{random_word(10)}
POSTGRES_PASSWORD={random_word(16)}
POSTGRES_DATABASE={random_word(12)}
SECRET_KEY={secrets.token_hex(32)}
DEMO_SEED=true

SMTP_USER=test@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
MAIL_FROM=test@gmail.com
FRONTEND_URL=http://localhost:3000

# Frontend dev proxy target (host only, without /api)
VITE_API_URL=http://localhost:8000

# Nginx/deploy helpers
NGINX_FILE=local_nginx.conf
PROJECT_VOLUME_SRC=./src/app
"""
    )
