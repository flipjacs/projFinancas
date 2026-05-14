"""Funções puras de cálculo do módulo de Planejamento Financeiro.

Mantemos a regra de negócio aqui (sem ORM nem dependências de banco) para
que cada função possa ser testada de forma isolada — o service só orquestra.
"""

from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

ZERO = Decimal("0")
CEM = Decimal("100")
QUANTIZE_2 = Decimal("0.01")

LIMITE_AVISO_PCT = Decimal("80")  # alerta de "próximo do limite"
LIMITE_EXCEDIDO_PCT = Decimal("100")


def arredonda(valor: Decimal) -> Decimal:
    return Decimal(valor).quantize(QUANTIZE_2, rounding=ROUND_HALF_UP)


@dataclass(frozen=True)
class DistribuicaoCalculada:
    """Resultado do cálculo de quanto vai para uma categoria."""

    valor_planejado: Decimal
    porcentagem_planejada: Decimal


def calcular_valor_planejado(
    tipo_distribuicao: str,
    valor: Decimal,
    porcentagem: Decimal,
    salario: Decimal,
) -> DistribuicaoCalculada:
    """Converte (tipo, valor, porcentagem) numa dupla (R$, %) consistente."""
    salario = Decimal(salario)
    if tipo_distribuicao == "valor_fixo":
        valor_planejado = Decimal(valor)
        if salario > ZERO:
            pct = (valor_planejado / salario) * CEM
        else:
            pct = ZERO
        return DistribuicaoCalculada(
            valor_planejado=arredonda(valor_planejado),
            porcentagem_planejada=arredonda(pct),
        )

    # tipo_distribuicao == 'porcentagem'
    pct = Decimal(porcentagem)
    valor_planejado = (salario * pct) / CEM if salario > ZERO else ZERO
    return DistribuicaoCalculada(
        valor_planejado=arredonda(valor_planejado),
        porcentagem_planejada=arredonda(pct),
    )


def percentual_utilizado(gasto: Decimal, limite: Decimal) -> Decimal:
    """Quanto da categoria já foi consumido (0 quando limite = 0)."""
    limite = Decimal(limite)
    if limite <= ZERO:
        return ZERO
    pct = (Decimal(gasto) / limite) * CEM
    return arredonda(pct)


def calcular_valor_necessario_por_mes(
    valor_meta: Decimal, valor_atual: Decimal, prazo_meses: int
) -> Decimal:
    """Quanto guardar por mês para bater a meta no prazo informado.

    Exemplo: meta R$4000, R$0 guardados, 6 meses → R$667/mês.
    Se a meta já foi batida, retorna 0.
    """
    if prazo_meses <= 0:
        raise ValueError("prazo_meses precisa ser maior que zero.")
    faltando = Decimal(valor_meta) - Decimal(valor_atual)
    if faltando <= ZERO:
        return ZERO
    return arredonda(faltando / Decimal(prazo_meses))


def progresso_percentual(valor_atual: Decimal, valor_meta: Decimal) -> Decimal:
    meta = Decimal(valor_meta)
    if meta <= ZERO:
        return ZERO
    pct = (Decimal(valor_atual) / meta) * CEM
    if pct > CEM:
        pct = CEM
    return arredonda(pct)


def soma_porcentagens_validas(porcentagens: list[Decimal]) -> Decimal:
    """Retorna o total; útil para validar que a distribuição não passa de 100%."""
    return sum((Decimal(p) for p in porcentagens), start=ZERO)


def status_categoria(percentual: Decimal) -> tuple[bool, bool]:
    """Devolve (excedido, proximo_do_limite)."""
    excedido = Decimal(percentual) >= LIMITE_EXCEDIDO_PCT
    proximo = (
        Decimal(percentual) >= LIMITE_AVISO_PCT
        and Decimal(percentual) < LIMITE_EXCEDIDO_PCT
    )
    return excedido, proximo
