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
from app.models.expense import Expense
from app.schemas.planejamento import (
    AlertaFinanceiro,
    AlertasResponse,
    CategoriaResumo,
    DistribuicaoCreate,
    DistribuicaoResponse,
    DistribuicaoUpdate,
    GastoFixoItem,
    ObjetivoCreate,
    ObjetivoResponse,
    ObjetivoUpdate,
    PlanejamentoResumo,
    ResumoComportamental,
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
from app.utils.enums import (
    CategoriaComportamental,
    ExpenseCategory,
    default_comportamental,
)


# Cada categoria principal define como "alguns gastos contam pra ela".
# Diferente da v1, agora misturamos base + comportamental: um McDonald's
# (food + comportamental=lazer) entra no envelope de Lazer, não no de
# Alimentação. Isso casa com a forma como o dinheiro foi de fato gasto.

# Mapeia tipo_categoria principal → (categorias base aceitas, comportamental aceito)
MAPA_TIPO_CATEGORIA: dict[
    str, tuple[tuple[str, ...], tuple[CategoriaComportamental, ...]]
] = {
    "Fixo": (
        (ExpenseCategory.HOUSING.value, ExpenseCategory.UTILITIES.value),
        (CategoriaComportamental.ESSENCIAL,),
    ),
    "Reserva": (
        (ExpenseCategory.SAVINGS.value,),
        (CategoriaComportamental.CRESCIMENTO,),
    ),
    "Alimentacao": (
        (ExpenseCategory.FOOD.value,),
        (CategoriaComportamental.ESSENCIAL,),
    ),
    "Lazer": (
        # Aqui o filtro principal é o comportamental: qualquer gasto cuja
        # leitura financeira seja "lazer" cai aqui, mesmo se a base for food.
        (),
        (CategoriaComportamental.LAZER, CategoriaComportamental.EMOCIONAL),
    ),
    "Transporte": (
        (ExpenseCategory.TRANSPORT.value,),
        (CategoriaComportamental.ESSENCIAL,),
    ),
    "Educacao": (
        (ExpenseCategory.EDUCATION.value,),
        (CategoriaComportamental.CRESCIMENTO,),
    ),
    "Saude": (
        (ExpenseCategory.HEALTH.value,),
        (CategoriaComportamental.SOBREVIVENCIA,),
    ),
    "Objetivos": (
        # Aportes pra objetivos entram como "savings" do ponto de vista da base.
        (ExpenseCategory.SAVINGS.value,),
        (CategoriaComportamental.CRESCIMENTO,),
    ),
    # Valores legados — mantidos pra não quebrar dados antigos.
    "Fundo Viagem": ((ExpenseCategory.SAVINGS.value,), ()),
    "Objetivos Tech": ((ExpenseCategory.SAVINGS.value,), ()),
    "Outros": ((ExpenseCategory.OTHER.value,), ()),
}


def comportamental_de(expense: Expense) -> CategoriaComportamental:
    """Lê o comportamental do gasto, derivando do default se vier vazio."""
    if expense.categoria_comportamental:
        try:
            return CategoriaComportamental(expense.categoria_comportamental)
        except ValueError:
            pass
    return default_comportamental(expense.category)


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

        # Auto-link com objetivo quando a categoria principal for Objetivos.
        # Aceita tanto um id existente quanto um payload inline (cria na hora).
        objetivo_id = data.objetivo_relacionado_id
        if data.tipo_categoria.value == "Objetivos":
            if objetivo_id is not None:
                # valida ownership
                self._get_objetivo_own(user.id, objetivo_id)
            elif data.objetivo is not None:
                criado = self.objetivos.create(
                    usuario_id=user.id,
                    nome=data.objetivo.nome,
                    valor_meta=data.objetivo.valor_meta,
                    valor_atual=data.objetivo.valor_atual,
                    prazo_meses=data.objetivo.prazo_meses,
                )
                objetivo_id = criado.id
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        "Para a categoria 'Objetivos' informe um "
                        "objetivo_relacionado_id existente ou os dados do "
                        "objetivo no campo 'objetivo'."
                    ),
                )
        elif data.objetivo is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Apenas categorias do tipo 'Objetivos' aceitam um objetivo inline.",
            )

        item = self.distribuicoes.create(
            usuario_id=user.id,
            categoria=data.categoria,
            tipo_categoria=data.tipo_categoria.value,
            tipo_distribuicao=data.tipo_distribuicao.value,
            valor=data.valor,
            porcentagem=data.porcentagem,
            limite_mensal=data.limite_mensal,
            subcategoria=data.subcategoria,
            objetivo_relacionado_id=objetivo_id,
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

        # Quando o usuário muda a categoria principal pra algo que NÃO é
        # Objetivos, soltamos o link com o objetivo (mas não apagamos o
        # objetivo em si — o usuário pode querer mantê-lo na tela de Objetivos).
        clear_link = False
        nova_categoria_principal = (
            data.tipo_categoria.value
            if data.tipo_categoria is not None
            else item.tipo_categoria
        )
        if (
            nova_categoria_principal != "Objetivos"
            and item.objetivo_relacionado_id is not None
        ):
            clear_link = True

        if data.objetivo_relacionado_id is not None:
            self._get_objetivo_own(user.id, data.objetivo_relacionado_id)

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
            subcategoria=data.subcategoria,
            objetivo_relacionado_id=data.objetivo_relacionado_id,
            clear_objetivo_relacionado=clear_link,
        )

        # Sincroniza o prazo/meta do objetivo quando a alocação mudar:
        # quanto o usuário planeja guardar por mês → ajusta prazo automaticamente.
        if (
            item.objetivo_relacionado_id is not None
            and data.valor is not None
        ):
            self._sync_prazo_do_objetivo(item)

        return DistribuicaoResponse.model_validate(item)

    def _sync_prazo_do_objetivo(self, item) -> None:
        """Quando o usuário muda o valor mensal alocado, recalcula o prazo
        do objetivo linkado para que matemática bata (faltando / valor_mensal).

        Usado só quando o tipo de distribuição é valor_fixo — pra porcentagem
        o valor depende do salário e fica mais natural deixar o prazo fixo.
        """
        if item.objetivo_relacionado_id is None:
            return
        if item.tipo_distribuicao != "valor_fixo":
            return
        valor_mensal = Decimal(item.valor)
        if valor_mensal <= ZERO:
            return
        objetivo = self.objetivos.get_by_id(item.objetivo_relacionado_id)
        if objetivo is None:
            return
        faltando = Decimal(objetivo.valor_meta) - Decimal(objetivo.valor_atual)
        if faltando <= ZERO:
            return
        novo_prazo = max(1, int((faltando / valor_mensal).to_integral_value()))
        if novo_prazo != objetivo.prazo_meses:
            self.objetivos.update(objetivo, prazo_meses=novo_prazo)

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

    def _coletar_gastos(
        self, user: User
    ) -> tuple[list[Expense], list[Expense]]:
        """Devolve (recorrentes_globais, nao_recorrentes_do_mes).

        Gastos `recurring=True` representam obrigações mensais — contam
        SEMPRE como Fixo, independente do mês de criação. Gastos avulsos
        são filtrados pelo mês corrente. Os dois conjuntos não se sobrepõem.
        """
        recorrentes = self.expenses.list_recurring(user.id)
        inicio, fim = _intervalo_do_mes(self._hoje())
        mes_inteiro = self.expenses.list_period_with_behavior(
            user.id, inicio, fim
        )
        nao_recorrentes_mes = [g for g in mes_inteiro if not g.recurring]
        return recorrentes, nao_recorrentes_mes

    def _gasto_da_categoria(
        self,
        distribuicao_id: int,
        tipo_categoria: str,
        recorrentes: list[Expense],
        nao_recorrentes_mes: list[Expense],
    ) -> Decimal:
        """Soma os gastos que caem nesse envelope ESPECÍFICO.

        Regras:
        1. Fixo = todos os gastos `recurring=True`, independente de earmark.
        2. Reserva / Objetivos = ISOLATION estrita. Só conta gastos com
           `distribuicao_id == este envelope`. Sem o earmark, o sistema NÃO
           tem como decidir qual reserva o dinheiro alimenta — então não
           espalha. Isso resolve o bug do "Poupança" ser contado em todos
           os fundos ao mesmo tempo.
        3. Outros envelopes (Lazer, Alimentação, etc.): contam gastos
           earmarked para este envelope + gastos sem earmark cuja categoria
           base/comportamental case. Gasto earmarked para OUTRO envelope
           nunca cai aqui.
        """
        if tipo_categoria == "Fixo":
            return sum((Decimal(g.amount) for g in recorrentes), start=ZERO)

        earmarked_aqui = sum(
            (
                Decimal(exp.amount)
                for exp in nao_recorrentes_mes
                if exp.distribuicao_id == distribuicao_id
            ),
            start=ZERO,
        )

        # Categorias que existem para guardar dinheiro precisam ser explícitas:
        # sem earmark, nada cai. Isso impede agregação ambígua.
        if tipo_categoria in ("Reserva", "Objetivos"):
            return earmarked_aqui

        bases, comportamentais = MAPA_TIPO_CATEGORIA.get(tipo_categoria, ((), ()))
        if not bases and not comportamentais:
            return earmarked_aqui

        total = earmarked_aqui
        for exp in nao_recorrentes_mes:
            if exp.distribuicao_id is not None:
                # Já foi contado acima quando for daqui; se for de outro
                # envelope, NÃO cai aqui mesmo se a categoria casar.
                continue
            comp = comportamental_de(exp)
            casa_base = (not bases) or exp.category in bases
            casa_comp = (not comportamentais) or comp in comportamentais
            if casa_base and casa_comp:
                total += Decimal(exp.amount)
        return total

    def _agrega_comportamental(
        self, gastos: list[Expense]
    ) -> ResumoComportamental:
        buckets: dict[CategoriaComportamental, Decimal] = {
            c: ZERO for c in CategoriaComportamental
        }
        for exp in gastos:
            buckets[comportamental_de(exp)] += Decimal(exp.amount)
        return ResumoComportamental(
            essencial=arredonda(buckets[CategoriaComportamental.ESSENCIAL]),
            lazer=arredonda(buckets[CategoriaComportamental.LAZER]),
            crescimento=arredonda(buckets[CategoriaComportamental.CRESCIMENTO]),
            sobrevivencia=arredonda(buckets[CategoriaComportamental.SOBREVIVENCIA]),
            emocional=arredonda(buckets[CategoriaComportamental.EMOCIONAL]),
        )

    def resumo(self, user: User) -> PlanejamentoResumo:
        salario = Decimal(user.monthly_salary)
        itens = self.distribuicoes.list_by_user(user.id)
        recorrentes, nao_recorrentes_mes = self._coletar_gastos(user)

        categorias: list[CategoriaResumo] = []
        total_distribuido = ZERO

        for item in itens:
            calc = calcular_valor_planejado(
                item.tipo_distribuicao,
                Decimal(item.valor),
                Decimal(item.porcentagem),
                salario,
            )
            gasto_atual = self._gasto_da_categoria(
                item.id, item.tipo_categoria, recorrentes, nao_recorrentes_mes
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
                    subcategoria=item.subcategoria,
                    tipo_distribuicao=item.tipo_distribuicao,
                    valor_planejado=calc.valor_planejado,
                    porcentagem_planejada=calc.porcentagem_planejada,
                    limite_mensal=arredonda(limite),
                    gasto_atual=arredonda(gasto_atual),
                    percentual_utilizado=pct_util,
                    excedido=excedido,
                    proximo_do_limite=proximo,
                    objetivo_relacionado_id=item.objetivo_relacionado_id,
                )
            )
            total_distribuido += calc.valor_planejado

        total_fixos = sum((Decimal(g.amount) for g in recorrentes), start=ZERO)
        total_gasto_mes = total_fixos + sum(
            (Decimal(g.amount) for g in nao_recorrentes_mes), start=ZERO
        )
        comportamental = self._agrega_comportamental(
            recorrentes + nao_recorrentes_mes
        )
        composicao = [
            GastoFixoItem(
                id=g.id,
                title=g.title,
                category=g.category,
                amount=arredonda(Decimal(g.amount)),
            )
            for g in recorrentes
        ]

        pct_comprometida = (
            (total_distribuido / salario) * Decimal("100") if salario > ZERO else ZERO
        )
        return PlanejamentoResumo(
            salario=arredonda(salario),
            total_distribuido=arredonda(total_distribuido),
            porcentagem_comprometida=arredonda(pct_comprometida),
            saldo_restante=arredonda(salario - total_distribuido),
            total_gasto_mes=arredonda(total_gasto_mes),
            total_gastos_fixos=arredonda(total_fixos),
            composicao_fixos=composicao,
            categorias=categorias,
            comportamental=comportamental,
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
