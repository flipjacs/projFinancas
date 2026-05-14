from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "name": "Alice Doe",
                "email": "alice@example.com",
                "password": "supersecret123",
                "monthly_salary": 5000.00,
            }
        }
    )

    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    monthly_salary: float = Field(default=0, ge=0)


class LoginRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "email": "alice@example.com",
                "password": "supersecret123",
            }
        }
    )

    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class TokenPayload(BaseModel):
    sub: str
    exp: int
