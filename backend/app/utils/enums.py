from enum import StrEnum


class ExpenseCategory(StrEnum):
    HOUSING = "housing"
    FOOD = "food"
    TRANSPORT = "transport"
    HEALTH = "health"
    EDUCATION = "education"
    ENTERTAINMENT = "entertainment"
    UTILITIES = "utilities"
    SHOPPING = "shopping"
    SAVINGS = "savings"
    OTHER = "other"
