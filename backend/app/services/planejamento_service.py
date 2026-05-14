"""Camada de orquestração do módulo Planejamento Financeiro.

Lida com:
- CRUD de distribuições e objetivos (delegando ao repository);
- cálculos derivados (valor planejado, % comprometida, alertas);
- validação cruzada (soma de porcentagens, salário > 0, etc.).
"""

from datetime import UTC, date, datetime
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.planejamento import DistribuicaoFinanceira, ObjetivoFinanceiro
from app.models.user import User
from app.repositories.expense_repository import ExpenseRepository
from app.repositories.planejamento_repository import (
    DistribuicaoRepository,
    ObjetivoRepository,
)
from app.schemas.planejamento import (
    AlertaFinanceiro,
    AlertasResponse,
    CategoriaResumo,
    DistribuicaoCreate,
    DistribuicaoResponse,
    DistribuicaoUpdate,
    ObjetivoCreate,
    ObjetivoResponse,
    ObjetivoUpdate,
    PlanejamentoResumo,
)
from app.services.planejamento_calculations import (
    ZERO,
    arredonda,
    calcular_valor_necessario_por_mes,
    calcular_valor_planejado,
    percentual_utilizado,
    progresso_percentual,
    soma_porcentagens_validas,
    status_categoria,
)
from app.utils.enums import ExpenseCategory


# tipo_categoria do plano → categorias de gasto que contam pra ela.
# A ideia é que o usuário descreva o orçamento em "envelopes" e o sistema
# soma os gastos do mês caindo em cada envelope.
MAPA_TIPO_CATEGORIA: dict[str, tuple[str, ...]] = {
    "Fixo": (ExpenseCategory.HOUSING.value, ExpenseCategory.UTILITIES.value),
    "Reserva": (ExpenseCategory.SAVINGS.value,),
    "Lazer": (
        ExpenseCategory.ENTERTAINMENT.value,
        ExpenseCategory.SHOPPING.value,
    ),
    "Transporte": (ExpenseCategory.TRANSPORT.value,),
    "Educacao": (ExpenseCategory.EDUCATION.value,),
    "Saude": (ExpenseCategory.HEALTH.value,),
    # "Fundo Viagem" e "Objetivos Tech" não têm uma categoria de gasto
    # equivalente: o usuário registra o aporte como "savings" (Reserva) e
    # acompanha o progresso na tela de Objetivos.
    "Fundo Viagem": (),
    "Objetivos Tech": (),
    "Outros": (ExpenseCategory.OTHER.value,),
}


def _intervalo_do_mes(hoje: date) -> tuple[datetime, datetime]:
    inicio = datetime(hoje.year, hoje.month, 1, tzinfo=UTC)
    if hoje.month == 12:
        fim = datetime(hoje.year + 1, 1, 1, tzinfo=UTC)
    else:
        fim = datetime(hoje.year, hoje.month + 1, 1, tzinfo=UTC)
    return inicio, fim


class PlanejamentoService:
    def __init__(self, db: Session) -> None:
        self.distribuicoes = DistribuicaoRepository(db)
        self.objetivos = ObjetivoRepository(db)
        self.expenses = ExpenseRepository(db)

    # ----------------------- helpers de propriedade -----------------------

    def _get_distribuicao_own(
        self, usuario_id: int, distribuicao_id: int
    ) -> DistribuicaoFinanceira:
        item = self.distribuicoes.get_by_id(distribuicao_id)
        if item is None or item.usuario_id != usuario_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Distribuição não encontrada",
            )
        return item

    def _get_objetivo_own(
        self, usuario_id: int, objetivo_id: int
    ) -> ObjetivoFinanceiro:
        item = self.objetivos.get_by_id(objetivo_id)
        if item is None or item.usuario_id != usuario_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Objetivo não encontrado",
            )
        return item

    # ----------------------- validação cruzada -----------------------

    def _validar_total_porcentagens(
        self,
        user: User,
        nova_porcentagem: Decimal,
        ignore_id: int | None = None,
    ) -> None:
        """Impede que a soma das distribuições por % passe de 100%."""
        existentes = [
            Decimal(item.porcentagem)
            for item in self.distribuicoes.list_by_user(user.id)
            if item.tipo_distribuicao == "porcentagem"
            and (ignore_id is None or item.id != ignore_id)
        ]
        total = soma_porcentagens_validas(existentes) + Decimal(nova_porcentagem)
        if total > Decimal("100"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"A soma das porcentagens passou de 100% (ficou em {total}%)."
                ),
            )

    # ----------------------- CRUD distribuição -----------------------

    def listar_distribuicoes(self, user: User) -> list[DistribuicaoResponse]:
        itens = self.distribuicoes.list_by_user(user.id)
        return [DistribuicaoResponse.model_validate(i) for i in itens]

    def criar_distribuicao(
        self, user: User, data: DistribuicaoCreate
    ) -> DistribuicaoResponse:
        if data.tipo_distribuicao == "porcentagem":
            self._validar_total_porcentagens(user, data.porcentagem)
        item = self.distribuicoes.create(
            usuario_id=user.id,
            categoria=data.categoria,
            tipo_categoria=data.tipo_categoria.value,
            tipo_distribuicao=data.tipo_distribuicao.value,
            valor=data.valor,
            porcentagem=data.porcentagem,
            limite_mensal=data.limite_mensal,
        )
        return DistribuicaoResponse.model_validate(item)

    def atualizar_distribuicao(
        self, user: User, distribuicao_id: int, data: DistribuicaoUpdate
    ) -> DistribuicaoResponse:
        item = self._get_distribuicao_own(user.id, distribuicao_id)

        nova_porcentagem = (
            data.porcentagem if data.porcentagem is not None else Decimal(item.porcentagem)
        )
        novo_tipo = (
            data.tipo_distribuicao.value
            if data.tipo_distribuicao is not None
            else item.tipo_distribuicao
        )
        if novo_tipo == "porcentagem":
            self._validar_total_porcentagens(
                user, nova_porcentagem, ignore_id=item.id
            )

        item = self.distribuicoes.update(
            item,
            categoria=data.categoria,
            tipo_categoria=(
                data.tipo_categoria.value if data.tipo_categoria is not None else None
            ),
            tipo_distribuicao=(
                data.tipo_distribuicao.value
                if data.tipo_distribuicao is not None
                else None
            ),
            valor=data.valor,
            porcentagem=data.porcentagem,
            limite_mensal=data.limite_mensal,
        )
        return DistribuicaoResponse.model_validate(item)

    def deletar_distribuicao(self, user: User, distribuicao_id: int) -> None:
        item = self._get_distribuicao_own(user.id, distribuicao_id)
        self.distribuicoes.delete(item)

    # ----------------------- CRUD objetivos -----------------------

    def _to_objetivo_response(self, item: ObjetivoFinanceiro) -> ObjetivoResponse:
        necessario = calcular_valor_necessario_por_mes(
            item.valor_meta, item.valor_atual, item.prazo_meses
        )
        progresso = progresso_percentual(item.valor_atual, item.valor_meta)
        return ObjetivoResponse(
            id=item.id,
            usuario_id=item.usuario_id,
            nome=item.nome,
            valor_meta=item.valor_meta,
            valor_atual=item.valor_atual,
            prazo_meses=item.prazo_meses,
            valor_necessario_por_mes=necessario,
            progresso_percentual=progresso,
            criado_em=item.criado_em,
        )

    def listar_objetivos(self, user: User) -> list[ObjetivoResponse]:
        itens = self.objetivos.list_by_user(user.id)
        return [self._to_objetivo_response(i) for i in itens]

    def criar_objetivo(self, user: User, data: ObjetivoCreate) -> ObjetivoResponse:
        if Decimal(data.valor_atual) > Decimal(data.valor_meta):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O valor atual não pode ser maior que a meta.",
            )
        item = self.objetivos.create(
            usuario_id=user.id,
            nome=data.nome,
            valor_meta=data.valor_meta,
            valor_atual=data.valor_atual,
            prazo_meses=data.prazo_meses,
        )
        return self._to_objetivo_response(item)

    def atualizar_objetivo(
        self, user: User, objetivo_id: int, data: ObjetivoUpdate
    ) -> ObjetivoResponse:
        item = self._get_objetivo_own(user.id, objetivo_id)
        valor_meta = (
            Decimal(data.valor_meta) if data.valor_meta is not None else Decimal(item.valor_meta)
        )
        valor_atual = (
            Decimal(data.valor_atual)
            if data.valor_atual is not None
            else Decimal(item.valor_atual)
        )
        if valor_atual > valor_meta:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O valor atual não pode ser maior que a meta.",
            )
        item = self.objetivos.update(
            item,
            nome=data.nome,
            valor_meta=data.valor_meta,
            valor_atual=data.valor_atual,
            prazo_meses=data.prazo_meses,
        )
        return self._to_objetivo_response(item)

    def deletar_objetivo(self, user: User, objetivo_id: int) -> None:
        item = self._get_objetivo_own(user.id, objetivo_id)
        self.objetivos.delete(item)

    # ----------------------- Análise (resumo + alertas) -----------------------

    def _hoje(self) -> date:
        return datetime.now(UTC).date()

    def _gastos_por_categoria_do_mes(self, user: User) -> dict[str, Decimal]:
        inicio, fim = _intervalo_do_mes(self._hoje())
        totais = self.expenses.totals_by_category_in_period(user.id, inicio, fim)
        return {cat: Decimal(total) for cat, total in totais}

    def _gasto_da_categoria(
        self,
        tipo_categoria: str,
        gastos_por_cat: dict[str, Decimal],
    ) -> Decimal:
        categorias = MAPA_TIPO_CATEGORIA.get(tipo_categoria, ())
        return sum(
            (gastos_por_cat.get(c, ZERO) for c in categorias),
            start=ZERO,
        )

    def resumo(self, user: User) -> PlanejamentoResumo:
        salario = Decimal(user.monthly_salary)
        itens = self.distribuicoes.list_by_user(user.id)
        gastos_por_cat = self._gastos_por_categoria_do_mes(user)

        categorias: list[CategoriaResumo] = []
        total_distribuido = ZERO
        total_gasto_mes = ZERO

        for item in itens:
            calc = calcular_valor_planejado(
                item.tipo_distribuicao,
                Decimal(item.valor),
                Decimal(item.porcentagem),
                salario,
            )
            gasto_atual = self._gasto_da_categoria(
                item.tipo_categoria, gastos_por_cat
            )
            # Quando o usuário definiu um limite explícito, usamos ele;
            # caso contrário, o limite passa a ser o próprio valor planejado.
            limite = (
                Decimal(item.limite_mensal)
                if Decimal(item.limite_mensal) > ZERO
                else calc.valor_planejado
            )
            pct_util = percentual_utilizado(gasto_atual, limite)
            excedido, proximo = status_categoria(pct_util)

            categorias.append(
                CategoriaResumo(
                    distribuicao_id=item.id,
                    categoria=item.categoria,
                    tipo_categoria=item.tipo_categoria,
                    tipo_distribuicao=item.tipo_distribuicao,
                    valor_planejado=calc.valor_planejado,
                    porcentagem_planejada=calc.porcentagem_planejada,
                    limite_mensal=arredonda(limite),
                    gasto_atual=arredonda(gasto_atual),
                    percentual_utilizado=pct_util,
                    excedido=excedido,
                    proximo_do_limite=proximo,
                )
            )
            total_distribuido += calc.valor_planejado
            total_gasto_mes += gasto_atual

        pct_comprometida = (
            (total_distribuido / salario) * Decimal("100") if salario > ZERO else ZERO
        )
        return PlanejamentoResumo(
            salario=arredonda(salario),
            total_distribuido=arredonda(total_distribuido),
            porcentagem_comprometida=arredonda(pct_comprometida),
            saldo_restante=arredonda(salario - total_distribuido),
            total_gasto_mes=arredonda(total_gasto_mes),
            categorias=categorias,
        )

    def alertas(self, user: User) -> AlertasResponse:
        resumo = self.resumo(user)
        alertas: list[AlertaFinanceiro] = []

        for cat in resumo.categorias:
            if cat.excedido:
                alertas.append(
                    AlertaFinanceiro(
                        categoria=cat.categoria,
                        tipo="excedido",
                        mensagem=(
                            f"Você excedeu o orçamento de {cat.categoria.lower()}."
                        ),
                    )
                )
            elif cat.proximo_do_limite:
                alertas.append(
                    AlertaFinanceiro(
                        categoria=cat.categoria,
                        tipo="proximo_limite",
                        mensagem=(
                            f"Seu orçamento de {cat.categoria.lower()} está "
                            "próximo do limite."
                        ),
                    )
                )

            # Reserva abaixo da meta: quando a categoria é do tipo "Reserva"
            # e o "gasto" (aporte) deste mês ficou abaixo do valor planejado.
            if (
                cat.tipo_categoria == "Reserva"
                and cat.valor_planejado > ZERO
                and Decimal(cat.gasto_atual) < Decimal(cat.valor_planejado)
            ):
                alertas.append(
                    AlertaFinanceiro(
                        categoria=cat.categoria,
                        tipo="reserva_baixa",
                        mensagem="Sua reserva mensal está abaixo da meta.",
                    )
                )

        return AlertasResponse(alertas=alertas)
