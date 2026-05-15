from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

# bcrypt opera sobre os primeiros 72 bytes da senha. Passar disso na codificação
# UTF-8 faria com que duas senhas distintas (mas que compartilham os 72 bytes
# iniciais) virassem o mesmo hash. Validamos no schema para falhar com mensagem
# clara antes do hashing.
BCRYPT_MAX_BYTES = 72


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

    @field_validator("password")
    @classmethod
    def _password_within_bcrypt_limit(cls, value: str) -> str:
        if len(value.encode("utf-8")) > BCRYPT_MAX_BYTES:
            raise ValueError(
                f"A senha excede {BCRYPT_MAX_BYTES} bytes em UTF-8 "
                "(use uma frase mais curta ou apenas ASCII)."
            )
        return value


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
