from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        return self.db.execute(stmt).scalar_one_or_none()

    def create(
        self,
        name: str,
        email: str,
        hashed_password: str,
        monthly_salary: Decimal,
    ) -> User:
        user = User(
            name=name,
            email=email,
            hashed_password=hashed_password,
            monthly_salary=monthly_salary,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update(
        self,
        user: User,
        name: str | None = None,
        monthly_salary: Decimal | None = None,
    ) -> User:
        if name is not None:
            user.name = name
        if monthly_salary is not None:
            user.monthly_salary = monthly_salary
        self.db.commit()
        self.db.refresh(user)
        return user

    def delete(self, user: User) -> None:
        self.db.delete(user)
        self.db.commit()
