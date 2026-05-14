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


class CategoriaComportamental(StrEnum):
    """Como o gasto se comporta financeiramente, independente da categoria base.

    Um McDonald's tem `category = food` mas comportamental = `lazer`. Uber
    para a faculdade é `essencial`; Uber para o shopping é `lazer`.
    """

    ESSENCIAL = "essencial"
    LAZER = "lazer"
    CRESCIMENTO = "crescimento"
    SOBREVIVENCIA = "sobrevivencia"
    EMOCIONAL = "emocional"


class ImpactoFinanceiro(StrEnum):
    """Sinal do impacto do gasto no patrimônio do usuário."""

    POSITIVO = "positivo"
    NEUTRO = "neutro"
    NEGATIVO = "negativo"


# Mapa de defaults: quando o usuário não informa o lado comportamental, o
# sistema deriva a partir da categoria base. Mantemos como "sugestão" — o
# usuário sempre pode sobrescrever (Uber para faculdade vs. para shopping).
_DEFAULT_COMPORTAMENTAL: dict[str, CategoriaComportamental] = {
    ExpenseCategory.HOUSING.value: CategoriaComportamental.ESSENCIAL,
    ExpenseCategory.FOOD.value: CategoriaComportamental.ESSENCIAL,
    ExpenseCategory.TRANSPORT.value: CategoriaComportamental.ESSENCIAL,
    ExpenseCategory.HEALTH.value: CategoriaComportamental.SOBREVIVENCIA,
    ExpenseCategory.EDUCATION.value: CategoriaComportamental.CRESCIMENTO,
    ExpenseCategory.ENTERTAINMENT.value: CategoriaComportamental.LAZER,
    ExpenseCategory.UTILITIES.value: CategoriaComportamental.ESSENCIAL,
    ExpenseCategory.SHOPPING.value: CategoriaComportamental.EMOCIONAL,
    ExpenseCategory.SAVINGS.value: CategoriaComportamental.CRESCIMENTO,
    ExpenseCategory.OTHER.value: CategoriaComportamental.ESSENCIAL,
}

_DEFAULT_IMPACTO: dict[CategoriaComportamental, ImpactoFinanceiro] = {
    CategoriaComportamental.ESSENCIAL: ImpactoFinanceiro.NEUTRO,
    CategoriaComportamental.SOBREVIVENCIA: ImpactoFinanceiro.NEUTRO,
    CategoriaComportamental.CRESCIMENTO: ImpactoFinanceiro.POSITIVO,
    CategoriaComportamental.LAZER: ImpactoFinanceiro.NEGATIVO,
    CategoriaComportamental.EMOCIONAL: ImpactoFinanceiro.NEGATIVO,
}


def default_comportamental(base: str) -> CategoriaComportamental:
    return _DEFAULT_COMPORTAMENTAL.get(base, CategoriaComportamental.ESSENCIAL)


def default_impacto(comportamental: CategoriaComportamental) -> ImpactoFinanceiro:
    return _DEFAULT_IMPACTO.get(comportamental, ImpactoFinanceiro.NEUTRO)
