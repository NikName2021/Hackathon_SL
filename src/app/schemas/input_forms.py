from typing import Optional, Union

from fastapi import Form, File, UploadFile
from pydantic import BaseModel, EmailStr, field_validator
import re


class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    role: str = "student"

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Пароль должен содержать минимум 8 символов")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Пароль должен содержать хотя бы одну заглавную букву")
        if not re.search(r"[a-z]", v):
            raise ValueError("Пароль должен содержать хотя бы одну строчную букву")
        if not re.search(r"\d", v):
            raise ValueError("Пароль должен содержать хотя бы одну цифру")
        if not re.search(r"[@#$%^&*_!]", v):
            raise ValueError("Пароль должен содержать хотя бы один специальный символ (@#$%^&*_!)")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


def validate_file(file: Union[UploadFile, str, None]) -> Optional[UploadFile]:
    if file is None:
        return None
    if isinstance(file, str) and file == "":
        return None
    if isinstance(file, UploadFile) and not file.filename:
        return None
    return file


class EventCreateForm:
    def __init__(
            self,
            name: str = Form(...),
            date_str: str = Form(...),
            description: str = Form(...),
            image: Union[UploadFile, str, None] = File(None),
            csv_file: Union[UploadFile, str, None] = File(None)
    ):
        self.name = name
        self.date_str = date_str
        self.description = description
        self.image = validate_file(image)
        self.csv_file = validate_file(csv_file)


class EventUpdateForm:
    def __init__(
            self,
            name: Optional[str] = Form(None),
            date_str: Optional[str] = Form(None),
            description: Optional[str] = Form(None),
            image: Union[UploadFile, str, None] = File(None),
            csv_file: Union[UploadFile, str, None] = File(None)
    ):
        self.name = name
        self.date_str = date_str
        self.description = description
        self.image = validate_file(image)
        self.csv_file = validate_file(csv_file)
