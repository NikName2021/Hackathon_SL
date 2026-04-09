from fastapi_mail import ConnectionConfig, FastMail, MessageSchema, MessageType
from pydantic import EmailStr
from core.config import SMTP_USER, SMTP_PASSWORD, SMTP_SERVER, SMTP_PORT, MAIL_FROM, FRONTEND_URL, SECRET_KEY, ALGORITHM, DEBUG
import jwt
from datetime import datetime, timedelta

conf = ConnectionConfig(
    MAIL_USERNAME=SMTP_USER,
    MAIL_PASSWORD=SMTP_PASSWORD,
    MAIL_FROM=MAIL_FROM,
    MAIL_PORT=SMTP_PORT,
    MAIL_SERVER=SMTP_SERVER,
    # Если порт 465, используем SSL, если нет (например 587) - STARTTLS
    MAIL_STARTTLS=False if int(SMTP_PORT) == 465 else True,
    MAIL_SSL_TLS=True if int(SMTP_PORT) == 465 else False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=False, # Отключаем для избежания проблем с таймаутами сертификатов в Docker
    TIMEOUT=20 # Увеличиваем таймаут
)

class EmailService:
    @staticmethod
    def create_verification_token(user_id: int) -> str:
        expire = datetime.utcnow() + timedelta(hours=24)
        to_encode = {"user_id": user_id, "exp": expire, "scope": "email_verification"}
        return jwt.encode(to_encode, str(SECRET_KEY), algorithm=ALGORITHM)

    @staticmethod
    async def send_verification_email(email: str, token: str):
        if DEBUG:
            return
        verification_url = f"{FRONTEND_URL}/verify-email?token={token}"
        
        html = f"""
        <html>
        <body style="font-family: sans-serif; background-color: #f8fafc; padding: 40px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <h1 style="color: #4f46e5; margin-bottom: 24px;">Подтверждение почты</h1>
                <p style="color: #475569; font-size: 16px; line-height: 24px;">
                    Добро пожаловать в Slopiks! Пожалуйста, подтвердите вашу почту, чтобы начать откликаться на задачи.
                </p>
                <div style="margin: 32px 0;">
                    <a href="{verification_url}" 
                       style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">
                        Подтвердить аккаунт
                    </a>
                </div>
                <p style="color: #94a3b8; font-size: 14px;">
                    Если вы не регистрировались на нашей платформе, просто проигнорируйте это письмо.
                </p>
            </div>
        </body>
        </html>
        """

        message = MessageSchema(
            subject="Подтверждение регистрации Slopiks",
            recipients=[email],
            body=html,
            subtype=MessageType.html
        )

        fm = FastMail(conf)
        await fm.send_message(message)

    @staticmethod
    def create_password_reset_token(user_id: int) -> str:
        expire = datetime.utcnow() + timedelta(hours=1)
        to_encode = {"user_id": user_id, "exp": expire, "scope": "password_reset"}
        return jwt.encode(to_encode, str(SECRET_KEY), algorithm=ALGORITHM)

    @staticmethod
    async def send_password_reset_email(email: str, token: str):
        if DEBUG:
            return
        reset_url = f"{FRONTEND_URL}/reset-password?token={token}"
        
        html = f"""
        <html>
        <body style="font-family: sans-serif; background-color: #f8fafc; padding: 40px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <h1 style="color: #4f46e5; margin-bottom: 24px;">Сброс пароля</h1>
                <p style="color: #475569; font-size: 16px; line-height: 24px;">
                    Вы получили это письмо, потому что запросили сброс пароля для вашего аккаунта в Slopiks.
                </p>
                <div style="margin: 32px 0;">
                    <a href="{reset_url}" 
                       style="background-color: #4f46e5; color: #ffffff; padding: 12px 24px; border-radius: 12px; text-decoration: none; font-weight: bold; display: inline-block;">
                        Установить новый пароль
                    </a>
                </div>
                <p style="color: #94a3b8; font-size: 14px;">
                    Срок действия этой ссылки — 1 час. Если вы не запрашивали сброс пароля, просто проигнорируйте это письмо.
                </p>
            </div>
        </body>
        </html>
        """

        message = MessageSchema(
            subject="Восстановление пароля Slopiks",
            recipients=[email],
            body=html,
            subtype=MessageType.html
        )

        fm = FastMail(conf)
        await fm.send_message(message)
