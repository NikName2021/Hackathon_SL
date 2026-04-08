import random
import secrets
import string


def randomword(length):
    letters = string.ascii_letters
    return ''.join(random.choice(letters) for i in range(length))


with open(".env.example", "w") as f:
    f.write(f"""# СОЗДАНО СКРИПТОМ
PROJECT_VOLUME_SRC=./src/app
NGINX_FILE=local_nginx.conf

POSTGRES_USER=user_{randomword(15)}
POSTGRES_PASSWORD={randomword(15)}
POSTGRES_DATABASE={randomword(15)}
JWT_SECRET_KEY={secrets.token_hex(32)}
VITE_API_URL=http://localhost:8000""")
