import bcrypt

_MAX_BCRYPT_BYTES = 72


def _to_bytes(password: str) -> bytes:
    encoded = password.encode("utf-8")
    return encoded[:_MAX_BCRYPT_BYTES]


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(_to_bytes(plain_password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(_to_bytes(plain_password), hashed_password.encode("utf-8"))
    except ValueError:
        return False
