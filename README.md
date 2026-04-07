# University Task Board

Внутривузовская платформа для распределения задач между сотрудниками и студентами.

## Что уже работает

- Регистрация и авторизация по ролям.
- Жизненный цикл задачи: создание, модерация, отклик, назначение исполнителя, сдача, проверка, начисление баллов.
- Swagger/OpenAPI.
- Публичная лента задач и личные кабинеты.
- Автосоздание стартовых категорий на запуске backend.

## Быстрый запуск

1. Запусти стек:

```powershell
docker compose --env-file src/app/.env up --build
```

2. Открой приложение:

- SPA: `http://localhost`
- Backend API: `http://localhost:8000`
- Swagger: `http://localhost/docs`

## Локальный запуск без Docker

Backend:

```powershell
cd src/app
python main.py
```

Frontend:

```powershell
cd spa
npm run dev
```

## Админ

После регистрации обычного аккаунта переведи его в администратора:

```powershell
cd src
python make_admin.py user@example.com
```

## Seed

- Стартовые категории создаются автоматически при запуске backend.
- Если база уже была заполнена, seed повторно ничего не изменит.

## Проверка

Рекомендуем перед демо проверить:

```powershell
cd src
python -m pytest
cd ..\spa
npm run build
```
