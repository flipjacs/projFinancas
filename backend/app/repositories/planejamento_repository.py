from decimal import Decimal

from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.planejamento import DistribuicaoFinanceira, ObjetivoFinanceiro


class DistribuicaoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, distribuicao_id: int) -> DistribuicaoFinanceira | None:
        return self.db.get(DistribuicaoFinanceira, distribuicao_id)

    def list_by_user(self, usuario_id: int) -> list[DistribuicaoFinanceira]:
        stmt = (
            select(DistribuicaoFinanceira)
            .where(DistribuicaoFinanceira.usuario_id == usuario_id)
            .order_by(desc(DistribuicaoFinanceira.criado_em))
        )
        return list(self.db.execute(stmt).scalars().all())

    def create(
        self,
        usuario_id: int,
        categoria: str,
        tipo_categoria: str,
        tipo_distribuicao: str,
        valor: Decimal,
        porcentagem: Decimal,
        limite_mensal: Decimal,
        subcategoria: str | None = None,
        objetivo_relacionado_id: int | None = None,
    ) -> DistribuicaoFinanceira:
        item = DistribuicaoFinanceira(
            usuario_id=usuario_id,
            categoria=categoria,
            tipo_categoria=tipo_categoria,
            tipo_distribuicao=tipo_distribuicao,
            valor=valor,
            porcentagem=porcentagem,
            limite_mensal=limite_mensal,
            subcategoria=subcategoria,
            objetivo_relacionado_id=objetivo_relacionado_id,
        )
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def update(
        self,
        item: DistribuicaoFinanceira,
        categoria: str | None = None,
        tipo_categoria: str | None = None,
        tipo_distribuicao: str | None = None,
        valor: Decimal | None = None,
        porcentagem: Decimal | None = None,
        limite_mensal: Decimal | None = None,
        subcategoria: str | None = None,
        objetivo_relacionado_id: int | None = None,
        clear_objetivo_relacionado: bool = False,
    ) -> DistribuicaoFinanceira:
        if categoria is not None:
            item.categoria = categoria
        if tipo_categoria is not None:
            item.tipo_categoria = tipo_categoria
        if tipo_distribuicao is not None:
            item.tipo_distribuicao = tipo_distribuicao
        if valor is not None:
            item.valor = valor
        if porcentagem is not None:
            item.porcentagem = porcentagem
        if limite_mensal is not None:
            item.limite_mensal = limite_mensal
        if subcategoria is not None:
            item.subcategoria = subcategoria
        if clear_objetivo_relacionado:
            item.objetivo_relacionado_id = None
        elif objetivo_relacionado_id is not None:
            item.objetivo_relacionado_id = objetivo_relacionado_id
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item: DistribuicaoFinanceira) -> None:
        self.db.delete(item)
        self.db.commit()


class ObjetivoRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, objetivo_id: int) -> ObjetivoFinanceiro | None:
        return self.db.get(ObjetivoFinanceiro, objetivo_id)

    def list_by_user(self, usuario_id: int) -> list[ObjetivoFinanceiro]:
        stmt = (
            select(ObjetivoFinanceiro)
            .where(ObjetivoFinanceiro.usuario_id == usuario_id)
            .order_by(desc(ObjetivoFinanceiro.criado_em))
        )
        return list(self.db.execute(stmt).scalars().all())

    def create(
        self,
        usuario_id: int,
        nome: str,
        valor_meta: Decimal,
        valor_atual: Decimal,
        prazo_meses: int,
    ) -> ObjetivoFinanceiro:
        item = ObjetivoFinanceiro(
            usuario_id=usuario_id,
            nome=nome,
            valor_meta=valor_meta,
            valor_atual=valor_atual,
            prazo_meses=prazo_meses,
        )
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        return item

    def update(
        self,
        item: ObjetivoFinanceiro,
        nome: str | None = None,
        valor_meta: Decimal | None = None,
        valor_atual: Decimal | None = None,
        prazo_meses: int | None = None,
    ) -> ObjetivoFinanceiro:
        if nome is not None:
            item.nome = nome
        if valor_meta is not None:
            item.valor_meta = valor_meta
        if valor_atual is not None:
            item.valor_atual = valor_atual
        if prazo_meses is not None:
            item.prazo_meses = prazo_meses
        self.db.commit()
        self.db.refresh(item)
        return item

    def delete(self, item: ObjetivoFinanceiro) -> None:
        self.db.delete(item)
        self.db.commit()
