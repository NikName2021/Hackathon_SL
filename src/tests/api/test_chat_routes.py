import pytest
from httpx import AsyncClient
from unittest.mock import patch

from main import app
from helpers.auth import get_current_user


@pytest.mark.asyncio
async def test_send_chat_message_success(test_client: AsyncClient, mock_student_user):
    app.dependency_overrides[get_current_user] = lambda: mock_student_user

    with patch("services.chat.ChatService.send_message") as mock_send:
        mock_send.return_value = {
            "id": 1,
            "task_id": 10,
            "sender_id": mock_student_user.id,
            "sender": {
                "id": mock_student_user.id,
                "email": mock_student_user.email,
                "role": "student",
                "points": 0,
                "reputation": 0.0,
                "full_name": mock_student_user.full_name,
                "is_active": True,
            },
            "content": "Hello",
            "created_at": "2026-04-01T12:00:00",
        }

        response = await test_client.post("/api/v1/chat/10", json={"content": "Hello"})

        assert response.status_code == 200
        assert response.json()["content"] == "Hello"

    app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.asyncio
async def test_get_chat_messages_success(test_client: AsyncClient, mock_student_user):
    app.dependency_overrides[get_current_user] = lambda: mock_student_user

    with patch("services.chat.ChatService.get_messages") as mock_get:
        mock_get.return_value = [
            {
                "id": 1,
                "task_id": 10,
                "sender_id": mock_student_user.id,
                "sender": {
                    "id": mock_student_user.id,
                    "email": mock_student_user.email,
                    "role": "student",
                    "points": 0,
                    "reputation": 0.0,
                    "full_name": mock_student_user.full_name,
                    "is_active": True,
                },
                "content": "Hello",
                "created_at": "2026-04-01T12:00:00",
            }
        ]

        response = await test_client.get("/api/v1/chat/10")

        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["content"] == "Hello"

    app.dependency_overrides.pop(get_current_user, None)
