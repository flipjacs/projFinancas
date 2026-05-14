from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.auth.jwt_handler import create_access_token
from app.auth.security import hash_password, verify_password
from app.core.config import settings
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse


class AuthService:
    def __init__(self, db: Session) -> None:
        self.users = UserRepository(db)

    def register(self, data: RegisterRequest) -> User:
        if self.users.get_by_email(data.email) is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        return self.users.create(
            name=data.name,
            email=data.email,
            hashed_password=hash_password(data.password),
            monthly_salary=Decimal(str(data.monthly_salary)),
        )

    def login(self, data: LoginRequest) -> TokenResponse:
        user = self.users.get_by_email(data.email)
        if user is None or not verify_password(data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        token = create_access_token(subject=user.id)
        return TokenResponse(
            access_token=token,
            expires_in=settings.jwt_expire_minutes * 60,
        )
