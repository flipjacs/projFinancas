from sqlalchemy.orm import Session

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserUpdate


class UserService:
    def __init__(self, db: Session) -> None:
        self.users = UserRepository(db)

    def update(self, user: User, data: UserUpdate) -> User:
        return self.users.update(
            user,
            name=data.name,
            monthly_salary=data.monthly_salary,
        )

    def delete(self, user: User) -> None:
        self.users.delete(user)
