# University Task Board

Внутривузовская платформа для распределения задач между сотрудниками и студентами.

## Быстрый старт (Docker)

1. Создай `.env` в корне проекта:

```powershell
Copy-Item .env.example .env
```

2. Подними проект:

```powershell
docker compose up -d --build
```

3. Открой сервисы:
- SPA: `http://localhost`
- Backend API: `http://localhost:8000/api/v1`
- Swagger: `http://localhost:8000/docs`

## Локальный запуск (без Docker)

### 1) Backend

```powershell
cd src
python -m venv .venv
python -m pip --python .venv/Scripts/python.exe install -r requirements.txt
```

Создай `src/app/.env` (можно взять значения из `.env.example`) и обязательно укажи:
- `POSTGRES_HOST=localhost`
- `POSTGRES_PORT=5450`
- `POSTGRES_USER=...`
- `POSTGRES_PASSWORD=...`
- `POSTGRES_DATABASE=...`
- `SECRET_KEY=...`

Запуск backend:

```powershell
cd app
..\.venv\Scripts\python.exe main.py
```

### 2) Frontend

```powershell
cd spa
npm install
npm run dev
```

По умолчанию Vite проксирует `/api` на `http://localhost:8000`.

## Администратор

1. Зарегистрируй пользователя через UI.
2. Назначь ему роль админа:

```powershell
cd src
python make_admin.py user@example.com
```

## Demo seed

При запуске backend автоматически создаются:
- категории задач;
- demo-пользователи и demo-задачи (если `DEMO_SEED=true`).

Демо-аккаунты:
- `admin@demo.local`
- `employee@demo.local`
- `student@demo.local`

Пароль по умолчанию: `demo12345`

## Проверка перед демо

```powershell
cd src
.venv\Scripts\python.exe -m pytest tests/api/test_auth_routes.py -q
.venv\Scripts\python.exe -m pytest tests/api/test_admin_routes.py -q
cd ..\spa
npm run build
```
