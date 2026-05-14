from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from app.services.planejamento_calculations import (
    calcular_valor_necessario_por_mes,
    calcular_valor_planejado,
    percentual_utilizado,
    progresso_percentual,
    soma_porcentagens_validas,
    status_categoria,
)


# ============================================================
# Cálculos puros — testáveis sem banco / sem HTTP
# ============================================================


def test_valor_planejado_porcentagem_sobre_salario() -> None:
    resultado = calcular_valor_planejado(
        "porcentagem",
        valor=Decimal("0"),
        porcentagem=Decimal("20"),
        salario=Decimal("5000"),
    )
    assert resultado.valor_planejado == Decimal("1000.00")
    assert resultado.porcentagem_planejada == Decimal("20.00")


def test_valor_planejado_valor_fixo_converte_para_porcentagem() -> None:
    resultado = calcular_valor_planejado(
        "valor_fixo",
        valor=Decimal("500"),
        porcentagem=Decimal("0"),
        salario=Decimal("5000"),
    )
    assert resultado.valor_planejado == Decimal("500.00")
    assert resultado.porcentagem_planejada == Decimal("10.00")


def test_valor_planejado_lida_com_salario_zero() -> None:
    resultado = calcular_valor_planejado(
        "porcentagem",
        valor=Decimal("0"),
        porcentagem=Decimal("30"),
        salario=Decimal("0"),
    )
    assert resultado.valor_planejado == Decimal("0.00")


def test_valor_necessario_por_mes_exemplo_doc() -> None:
    # exemplo do enunciado: 4000 em 6 meses ~= 667/mês
    assert calcular_valor_necessario_por_mes(
        Decimal("4000"), Decimal("0"), 6
    ) == Decimal("666.67")


def test_valor_necessario_zero_quando_meta_batida() -> None:
    assert calcular_valor_necessario_por_mes(
        Decimal("1000"), Decimal("1000"), 6
    ) == Decimal("0")


def test_valor_necessario_lanca_em_prazo_invalido() -> None:
    with pytest.raises(ValueError):
        calcular_valor_necessario_por_mes(Decimal("1000"), Decimal("0"), 0)


def test_percentual_utilizado_zero_quando_sem_limite() -> None:
    assert percentual_utilizado(Decimal("500"), Decimal("0")) == Decimal("0")


def test_percentual_utilizado_proporcional() -> None:
    assert percentual_utilizado(Decimal("400"), Decimal("1000")) == Decimal("40.00")


def test_status_categoria_amarelo_aos_80_pct() -> None:
    excedido, proximo = status_categoria(Decimal("85"))
    assert proximo is True
    assert excedido is False


def test_status_categoria_vermelho_aos_100_pct() -> None:
    excedido, proximo = status_categoria(Decimal("100"))
    assert excedido is True
    assert proximo is False


def test_progresso_percentual_limitado_a_100() -> None:
    assert progresso_percentual(Decimal("4000"), Decimal("1000")) == Decimal("100.00")


def test_soma_porcentagens() -> None:
    assert soma_porcentagens_validas(
        [Decimal("10"), Decimal("20"), Decimal("30")]
    ) == Decimal("60")


# ============================================================
# Endpoints
# ============================================================


def _criar_distribuicao(
    client: TestClient,
    headers: dict,
    **overrides,
) -> dict:
    payload = {
        "categoria": "Lazer mensal",
        "tipo_categoria": "Lazer",
        "tipo_distribuicao": "porcentagem",
        "valor": 0,
        "porcentagem": 15,
        "limite_mensal": 0,
    }
    payload.update(overrides)
    response = client.post(
        "/planejamento/distribuicao", json=payload, headers=headers
    )
    assert response.status_code == 201, response.text
    return response.json()


def _criar_objetivo(
    client: TestClient, headers: dict, **overrides
) -> dict:
    payload = {
        "nome": "iPhone 15 Pro",
        "valor_meta": 4000,
        "valor_atual": 0,
        "prazo_meses": 6,
    }
    payload.update(overrides)
    response = client.post(
        "/planejamento/objetivos", json=payload, headers=headers
    )
    assert response.status_code == 201, response.text
    return response.json()


# ---------- CRUD ----------


def test_criar_e_listar_distribuicao(
    client: TestClient, auth_headers: dict
) -> None:
    _criar_distribuicao(client, auth_headers)
    response = client.get("/planejamento/distribuicao", headers=auth_headers)
    assert response.status_code == 200
    assert len(response.json()) == 1


def test_porcentagens_acima_de_100_sao_rejeitadas(
    client: TestClient, auth_headers: dict
) -> None:
    _criar_distribuicao(client, auth_headers, porcentagem=70)
    response = client.post(
        "/planejamento/distribuicao",
        json={
            "categoria": "Mais Lazer",
            "tipo_categoria": "Lazer",
            "tipo_distribuicao": "porcentagem",
            "valor": 0,
            "porcentagem": 40,
            "limite_mensal": 0,
        },
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "100" in response.json()["error"]["message"]


def test_porcentagem_invalida_rejeitada_no_schema(
    client: TestClient, auth_headers: dict
) -> None:
    response = client.post(
        "/planejamento/distribuicao",
        json={
            "categoria": "Lazer",
            "tipo_categoria": "Lazer",
            "tipo_distribuicao": "porcentagem",
            "valor": 0,
            "porcentagem": 150,
            "limite_mensal": 0,
        },
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_valor_negativo_rejeitado(
    client: TestClient, auth_headers: dict
) -> None:
    response = client.post(
        "/planejamento/distribuicao",
        json={
            "categoria": "Lazer",
            "tipo_categoria": "Lazer",
            "tipo_distribuicao": "valor_fixo",
            "valor": -10,
            "porcentagem": 0,
            "limite_mensal": 0,
        },
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_atualizar_distribuicao(client: TestClient, auth_headers: dict) -> None:
    item = _criar_distribuicao(client, auth_headers)
    response = client.put(
        f"/planejamento/distribuicao/{item['id']}",
        json={"porcentagem": 25},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert float(response.json()["porcentagem"]) == 25.0


def test_deletar_distribuicao(client: TestClient, auth_headers: dict) -> None:
    item = _criar_distribuicao(client, auth_headers)
    response = client.delete(
        f"/planejamento/distribuicao/{item['id']}", headers=auth_headers
    )
    assert response.status_code == 204
    assert client.get("/planejamento/distribuicao", headers=auth_headers).json() == []


# ---------- Objetivos ----------


def test_criar_objetivo_calcula_valor_necessario(
    client: TestClient, auth_headers: dict
) -> None:
    obj = _criar_objetivo(client, auth_headers)
    assert float(obj["valor_necessario_por_mes"]) == 666.67
    assert float(obj["progresso_percentual"]) == 0


def test_objetivo_progresso_quando_ja_guardou(
    client: TestClient, auth_headers: dict
) -> None:
    obj = _criar_objetivo(
        client, auth_headers, valor_meta=1000, valor_atual=250, prazo_meses=5
    )
    assert float(obj["progresso_percentual"]) == 25.0
    assert float(obj["valor_necessario_por_mes"]) == 150.0


def test_objetivo_meta_invalida(client: TestClient, auth_headers: dict) -> None:
    response = client.post(
        "/planejamento/objetivos",
        json={
            "nome": "Foo",
            "valor_meta": 0,
            "valor_atual": 0,
            "prazo_meses": 6,
        },
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_objetivo_prazo_invalido(client: TestClient, auth_headers: dict) -> None:
    response = client.post(
        "/planejamento/objetivos",
        json={
            "nome": "Foo",
            "valor_meta": 1000,
            "valor_atual": 0,
            "prazo_meses": 0,
        },
        headers=auth_headers,
    )
    assert response.status_code == 422


def test_objetivo_atual_maior_que_meta(
    client: TestClient, auth_headers: dict
) -> None:
    response = client.post(
        "/planejamento/objetivos",
        json={
            "nome": "Foo",
            "valor_meta": 100,
            "valor_atual": 200,
            "prazo_meses": 6,
        },
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_atualizar_objetivo(client: TestClient, auth_headers: dict) -> None:
    obj = _criar_objetivo(client, auth_headers)
    response = client.put(
        f"/planejamento/objetivos/{obj['id']}",
        json={"valor_atual": 1000},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert float(response.json()["progresso_percentual"]) == 25.0


def test_deletar_objetivo(client: TestClient, auth_headers: dict) -> None:
    obj = _criar_objetivo(client, auth_headers)
    response = client.delete(
        f"/planejamento/objetivos/{obj['id']}", headers=auth_headers
    )
    assert response.status_code == 204


# ---------- Resumo + alertas ----------


def test_resumo_calcula_valores(client: TestClient, auth_headers: dict) -> None:
    # 20% de 5000 = 1000
    _criar_distribuicao(
        client, auth_headers, categoria="Lazer", porcentagem=20
    )
    response = client.get("/planejamento/resumo", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert float(body["salario"]) == 5000
    assert float(body["total_distribuido"]) == 1000
    assert float(body["porcentagem_comprometida"]) == 20.0
    assert float(body["saldo_restante"]) == 4000


def test_alerta_de_excedido_em_lazer(
    client: TestClient, auth_headers: dict
) -> None:
    # 10% de 5000 = 500 de limite para Lazer
    _criar_distribuicao(
        client, auth_headers, categoria="Lazer", porcentagem=10
    )
    # gera um gasto de entretenimento de 600
    client.post(
        "/expenses",
        json={
            "title": "Show",
            "amount": 600,
            "category": "entertainment",
            "recurring": False,
        },
        headers=auth_headers,
    )
    response = client.get("/planejamento/alertas", headers=auth_headers)
    assert response.status_code == 200
    alertas = response.json()["alertas"]
    assert any(a["tipo"] == "excedido" for a in alertas)


def test_alerta_proximo_do_limite(
    client: TestClient, auth_headers: dict
) -> None:
    # 10% de 5000 = 500 de limite
    _criar_distribuicao(
        client, auth_headers, categoria="Lazer", porcentagem=10
    )
    # 80% de 500 = 400
    client.post(
        "/expenses",
        json={
            "title": "Cinema",
            "amount": 420,
            "category": "entertainment",
            "recurring": False,
        },
        headers=auth_headers,
    )
    response = client.get("/planejamento/alertas", headers=auth_headers)
    assert response.status_code == 200
    alertas = response.json()["alertas"]
    assert any(a["tipo"] == "proximo_limite" for a in alertas)


def test_alerta_reserva_baixa(client: TestClient, auth_headers: dict) -> None:
    # planeja guardar 10% (R$500) mas só aporta R$100
    _criar_distribuicao(
        client,
        auth_headers,
        categoria="Reserva mensal",
        tipo_categoria="Reserva",
        porcentagem=10,
    )
    client.post(
        "/expenses",
        json={
            "title": "Aporte",
            "amount": 100,
            "category": "savings",
            "recurring": False,
        },
        headers=auth_headers,
    )
    response = client.get("/planejamento/alertas", headers=auth_headers)
    alertas = response.json()["alertas"]
    assert any(a["tipo"] == "reserva_baixa" for a in alertas)


# ---------- Autenticação ----------


def test_endpoints_exigem_autenticacao(client: TestClient) -> None:
    assert client.get("/planejamento/distribuicao").status_code == 401
    assert client.get("/planejamento/objetivos").status_code == 401
    assert client.get("/planejamento/resumo").status_code == 401
    assert client.get("/planejamento/alertas").status_code == 401


# ============================================================
# Hierarquia de categoria + auto-link com objetivo
# ============================================================


def test_objetivos_inline_cria_objetivo_e_linka(
    client: TestClient, auth_headers: dict
) -> None:
    # Cria uma distribuição do tipo Objetivos com payload inline → o sistema
    # deve criar um ObjetivoFinanceiro e linkar com a distribuição.
    response = client.post(
        "/planejamento/distribuicao",
        json={
            "categoria": "Viagem Japão",
            "tipo_categoria": "Objetivos",
            "subcategoria": "Fundo Viagem",
            "tipo_distribuicao": "valor_fixo",
            "valor": 500,
            "porcentagem": 0,
            "limite_mensal": 0,
            "objetivo": {
                "nome": "Viagem Japão 2027",
                "valor_meta": 12000,
                "valor_atual": 0,
                "prazo_meses": 24,
            },
        },
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["tipo_categoria"] == "Objetivos"
    assert body["subcategoria"] == "Fundo Viagem"
    assert body["objetivo_relacionado_id"] is not None

    # O objetivo deve aparecer na lista de objetivos.
    objetivos = client.get("/planejamento/objetivos", headers=auth_headers).json()
    assert any(o["nome"] == "Viagem Japão 2027" for o in objetivos)


def test_objetivos_sem_dados_rejeita(
    client: TestClient, auth_headers: dict
) -> None:
    response = client.post(
        "/planejamento/distribuicao",
        json={
            "categoria": "Algo",
            "tipo_categoria": "Objetivos",
            "tipo_distribuicao": "valor_fixo",
            "valor": 200,
            "porcentagem": 0,
            "limite_mensal": 0,
        },
        headers=auth_headers,
    )
    assert response.status_code == 400
    assert "Objetivos" in response.json()["error"]["message"]


def test_objetivos_aceita_id_existente(
    client: TestClient, auth_headers: dict
) -> None:
    obj = _criar_objetivo(client, auth_headers, nome="Notebook", valor_meta=5000)
    response = client.post(
        "/planejamento/distribuicao",
        json={
            "categoria": "Aporte notebook",
            "tipo_categoria": "Objetivos",
            "tipo_distribuicao": "valor_fixo",
            "valor": 250,
            "porcentagem": 0,
            "limite_mensal": 0,
            "objetivo_relacionado_id": obj["id"],
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json()["objetivo_relacionado_id"] == obj["id"]


def test_objetivo_inline_rejeitado_fora_de_objetivos(
    client: TestClient, auth_headers: dict
) -> None:
    response = client.post(
        "/planejamento/distribuicao",
        json={
            "categoria": "Lazer",
            "tipo_categoria": "Lazer",
            "tipo_distribuicao": "porcentagem",
            "valor": 0,
            "porcentagem": 10,
            "limite_mensal": 0,
            "objetivo": {
                "nome": "Não devia",
                "valor_meta": 1000,
                "valor_atual": 0,
                "prazo_meses": 6,
            },
        },
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_mudar_categoria_para_nao_objetivos_solta_link(
    client: TestClient, auth_headers: dict
) -> None:
    criada = client.post(
        "/planejamento/distribuicao",
        json={
            "categoria": "Aporte viagem",
            "tipo_categoria": "Objetivos",
            "tipo_distribuicao": "valor_fixo",
            "valor": 300,
            "porcentagem": 0,
            "limite_mensal": 0,
            "objetivo": {
                "nome": "Viagem",
                "valor_meta": 3000,
                "valor_atual": 0,
                "prazo_meses": 10,
            },
        },
        headers=auth_headers,
    ).json()
    assert criada["objetivo_relacionado_id"] is not None

    response = client.put(
        f"/planejamento/distribuicao/{criada['id']}",
        json={"tipo_categoria": "Lazer"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["objetivo_relacionado_id"] is None


def test_alterar_valor_sincroniza_prazo_do_objetivo(
    client: TestClient, auth_headers: dict
) -> None:
    # Cria objetivo de 6000 em 24 meses (= 250/mês) e linka uma distribuição
    # que aloca 500/mês. O sync deve recalcular o prazo para 12 meses.
    criada = client.post(
        "/planejamento/distribuicao",
        json={
            "categoria": "Aporte",
            "tipo_categoria": "Objetivos",
            "tipo_distribuicao": "valor_fixo",
            "valor": 250,
            "porcentagem": 0,
            "limite_mensal": 0,
            "objetivo": {
                "nome": "Carro",
                "valor_meta": 6000,
                "valor_atual": 0,
                "prazo_meses": 24,
            },
        },
        headers=auth_headers,
    ).json()
    objetivo_id = criada["objetivo_relacionado_id"]

    # Aumenta o aporte para 500
    client.put(
        f"/planejamento/distribuicao/{criada['id']}",
        json={"valor": 500},
        headers=auth_headers,
    )

    objetivos = client.get("/planejamento/objetivos", headers=auth_headers).json()
    alvo = next(o for o in objetivos if o["id"] == objetivo_id)
    assert alvo["prazo_meses"] == 12


# ============================================================
# Categoria comportamental + classificação inteligente
# ============================================================


def test_gasto_default_recebe_comportamental_da_base(
    client: TestClient, auth_headers: dict
) -> None:
    response = client.post(
        "/expenses",
        json={
            "title": "Almoço",
            "amount": 30,
            "category": "food",
            "recurring": False,
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["categoria_comportamental"] == "essencial"
    assert body["impacto_financeiro"] == "neutro"


def test_gasto_aceita_comportamental_explicito(
    client: TestClient, auth_headers: dict
) -> None:
    # McDonald's = food + lazer
    response = client.post(
        "/expenses",
        json={
            "title": "McDonald's",
            "amount": 40,
            "category": "food",
            "categoria_comportamental": "lazer",
            "recurring": False,
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json()["categoria_comportamental"] == "lazer"


def test_lazer_envelope_conta_mcdonalds(
    client: TestClient, auth_headers: dict
) -> None:
    # Categoria de Lazer com 20% de 5000 = 1000 de limite.
    _criar_distribuicao(
        client, auth_headers, categoria="Lazer", porcentagem=20
    )
    # Cinema (entertainment) — 200
    client.post(
        "/expenses",
        json={
            "title": "Cinema",
            "amount": 200,
            "category": "entertainment",
            "recurring": False,
        },
        headers=auth_headers,
    )
    # McDonald's (food + lazer) — 100; deveria entrar em Lazer também.
    client.post(
        "/expenses",
        json={
            "title": "McDonald's",
            "amount": 100,
            "category": "food",
            "categoria_comportamental": "lazer",
            "recurring": False,
        },
        headers=auth_headers,
    )

    resumo = client.get("/planejamento/resumo", headers=auth_headers).json()
    lazer = next(c for c in resumo["categorias"] if c["categoria"] == "Lazer")
    assert float(lazer["gasto_atual"]) == 300.0


def test_alimentacao_envelope_ignora_food_lazer(
    client: TestClient, auth_headers: dict
) -> None:
    _criar_distribuicao(
        client,
        auth_headers,
        categoria="Comida",
        tipo_categoria="Alimentacao",
        porcentagem=15,
    )
    # Mercado (essencial)
    client.post(
        "/expenses",
        json={
            "title": "Mercado",
            "amount": 300,
            "category": "food",
            "recurring": False,
        },
        headers=auth_headers,
    )
    # McDonald's (food + lazer) — NÃO deve contar em Alimentação.
    client.post(
        "/expenses",
        json={
            "title": "Mc",
            "amount": 100,
            "category": "food",
            "categoria_comportamental": "lazer",
            "recurring": False,
        },
        headers=auth_headers,
    )

    resumo = client.get("/planejamento/resumo", headers=auth_headers).json()
    alimentacao = next(
        c for c in resumo["categorias"] if c["categoria"] == "Comida"
    )
    assert float(alimentacao["gasto_atual"]) == 300.0


def test_resumo_inclui_agregado_comportamental(
    client: TestClient, auth_headers: dict
) -> None:
    client.post(
        "/expenses",
        json={
            "title": "Mercado",
            "amount": 200,
            "category": "food",
            "recurring": False,
        },
        headers=auth_headers,
    )
    client.post(
        "/expenses",
        json={
            "title": "Show",
            "amount": 150,
            "category": "entertainment",
            "recurring": False,
        },
        headers=auth_headers,
    )
    resumo = client.get("/planejamento/resumo", headers=auth_headers).json()
    comp = resumo["comportamental"]
    assert float(comp["essencial"]) == 200.0
    assert float(comp["lazer"]) == 150.0


# ============================================================
# Isolation de Reserva/Objetivos (bug do "Poupança" replicado)
# ============================================================


def _criar_reserva(client: TestClient, headers: dict, categoria: str) -> dict:
    return _criar_distribuicao(
        client,
        headers,
        categoria=categoria,
        tipo_categoria="Reserva",
        porcentagem=10,
    )


def test_savings_sem_earmark_nao_cai_em_nenhuma_reserva(
    client: TestClient, auth_headers: dict
) -> None:
    """Bug 1: 'Poupança' sem alvo explícito NÃO entra em todas as reservas."""
    _criar_reserva(client, auth_headers, categoria="Reserva de Emergência")
    _criar_reserva(client, auth_headers, categoria="Reserva Sabbatical")

    client.post(
        "/expenses",
        json={"title": "Poupança", "amount": 200, "category": "savings"},
        headers=auth_headers,
    )

    resumo = client.get("/planejamento/resumo", headers=auth_headers).json()
    emergencia = next(
        c for c in resumo["categorias"] if c["categoria"] == "Reserva de Emergência"
    )
    sabbatical = next(
        c for c in resumo["categorias"] if c["categoria"] == "Reserva Sabbatical"
    )
    assert float(emergencia["gasto_atual"]) == 0
    assert float(sabbatical["gasto_atual"]) == 0


def test_earmark_isola_aporte_na_reserva_alvo(
    client: TestClient, auth_headers: dict
) -> None:
    emergencia = _criar_reserva(client, auth_headers, categoria="Reserva de Emergência")
    _criar_reserva(client, auth_headers, categoria="Reserva Sabbatical")
    _criar_distribuicao(
        client,
        auth_headers,
        categoria="Fundo Viagem",
        tipo_categoria="Objetivos",
        porcentagem=5,
        objetivo={
            "nome": "Viagem",
            "valor_meta": 3000,
            "valor_atual": 0,
            "prazo_meses": 12,
        },
    )

    # Earmark explícito para a reserva de Emergência.
    response = client.post(
        "/expenses",
        json={
            "title": "Aporte Emergência",
            "amount": 500,
            "category": "savings",
            "distribuicao_id": emergencia["id"],
        },
        headers=auth_headers,
    )
    assert response.status_code == 201
    assert response.json()["distribuicao_id"] == emergencia["id"]

    resumo = client.get("/planejamento/resumo", headers=auth_headers).json()
    cats = {c["categoria"]: float(c["gasto_atual"]) for c in resumo["categorias"]}
    assert cats["Reserva de Emergência"] == 500
    assert cats["Reserva Sabbatical"] == 0
    assert cats["Fundo Viagem"] == 0


def test_earmark_para_distribuicao_de_outro_user_rejeita(
    client: TestClient, auth_headers: dict
) -> None:
    # Cria um segundo user com sua própria distribuição.
    client.post(
        "/auth/register",
        json={
            "name": "Outro",
            "email": "outro@example.com",
            "password": "supersecret123",
            "monthly_salary": 1000,
        },
    )
    outro_login = client.post(
        "/auth/login",
        json={"email": "outro@example.com", "password": "supersecret123"},
    )
    outro_headers = {"Authorization": f"Bearer {outro_login.json()['access_token']}"}
    outra_reserva = _criar_reserva(client, outro_headers, categoria="Reserva")

    # User principal tenta fazer earmark pro id de outro user.
    response = client.post(
        "/expenses",
        json={
            "title": "Aporte",
            "amount": 100,
            "category": "savings",
            "distribuicao_id": outra_reserva["id"],
        },
        headers=auth_headers,
    )
    assert response.status_code == 400


def test_earmark_em_envelope_generico_nao_double_count(
    client: TestClient, auth_headers: dict
) -> None:
    """Um earmark deve substituir a agregação por categoria — não somar duas vezes."""
    lazer = _criar_distribuicao(
        client, auth_headers, categoria="Lazer mensal", porcentagem=15
    )
    # Cria um gasto de entertainment earmarked para Lazer mensal.
    client.post(
        "/expenses",
        json={
            "title": "Cinema",
            "amount": 80,
            "category": "entertainment",
            "distribuicao_id": lazer["id"],
        },
        headers=auth_headers,
    )

    resumo = client.get("/planejamento/resumo", headers=auth_headers).json()
    lazer_resumo = next(
        c for c in resumo["categorias"] if c["categoria"] == "Lazer mensal"
    )
    # 80, não 160 (não conta duas vezes).
    assert float(lazer_resumo["gasto_atual"]) == 80


def test_earmark_em_outro_lazer_nao_vaza(
    client: TestClient, auth_headers: dict
) -> None:
    """Se earmarkar Cinema em 'Lazer A', NÃO pode aparecer em 'Lazer B'."""
    lazer_a = _criar_distribuicao(
        client, auth_headers, categoria="Lazer A", porcentagem=10
    )
    _criar_distribuicao(
        client, auth_headers, categoria="Lazer B", porcentagem=10
    )
    client.post(
        "/expenses",
        json={
            "title": "Cinema",
            "amount": 80,
            "category": "entertainment",
            "distribuicao_id": lazer_a["id"],
        },
        headers=auth_headers,
    )

    resumo = client.get("/planejamento/resumo", headers=auth_headers).json()
    cats = {c["categoria"]: float(c["gasto_atual"]) for c in resumo["categorias"]}
    assert cats["Lazer A"] == 80
    assert cats["Lazer B"] == 0


def test_desvincular_earmark_via_patch(
    client: TestClient, auth_headers: dict
) -> None:
    reserva = _criar_reserva(client, auth_headers, categoria="Reserva")
    expense = client.post(
        "/expenses",
        json={
            "title": "Aporte",
            "amount": 300,
            "category": "savings",
            "distribuicao_id": reserva["id"],
        },
        headers=auth_headers,
    ).json()

    antes = client.get("/planejamento/resumo", headers=auth_headers).json()
    assert next(c for c in antes["categorias"] if c["categoria"] == "Reserva")[
        "gasto_atual"
    ] == "300.00"

    # Limpa o earmark via flag.
    client.patch(
        f"/expenses/{expense['id']}",
        json={"desvincular_distribuicao": True},
        headers=auth_headers,
    )
    depois = client.get("/planejamento/resumo", headers=auth_headers).json()
    reserva_resumo = next(c for c in depois["categorias"] if c["categoria"] == "Reserva")
    assert float(reserva_resumo["gasto_atual"]) == 0


# ============================================================
# Agregação automática de gastos recorrentes em "Fixo"
# ============================================================


def _gasto_recorrente(
    client: TestClient,
    headers: dict,
    **overrides,
) -> dict:
    payload = {
        "title": "Recorrente",
        "amount": 100,
        "category": "utilities",
        "recurring": True,
    }
    payload.update(overrides)
    response = client.post("/expenses", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


def test_recorrente_de_qualquer_base_entra_em_fixo(
    client: TestClient, auth_headers: dict
) -> None:
    # Cria uma distribuição Fixo de 30% (1500 de 5000).
    _criar_distribuicao(
        client,
        auth_headers,
        categoria="Custos fixos",
        tipo_categoria="Fixo",
        porcentagem=30,
    )
    # Recorrentes em categorias DIFERENTES (utilities, health, entertainment).
    _gasto_recorrente(client, auth_headers, title="Internet", amount=120, category="utilities")
    _gasto_recorrente(client, auth_headers, title="Academia", amount=90, category="health")
    _gasto_recorrente(client, auth_headers, title="Netflix", amount=40, category="entertainment")

    resumo = client.get("/planejamento/resumo", headers=auth_headers).json()
    fixo = next(c for c in resumo["categorias"] if c["categoria"] == "Custos fixos")
    assert float(fixo["gasto_atual"]) == 250.0

    # Também precisa aparecer na composição agregada.
    assert float(resumo["total_gastos_fixos"]) == 250.0
    titulos = {item["title"] for item in resumo["composicao_fixos"]}
    assert titulos == {"Internet", "Academia", "Netflix"}


def test_recorrente_netflix_nao_aparece_no_lazer(
    client: TestClient, auth_headers: dict
) -> None:
    # Netflix é entertainment + recurring → conta como Fixo, não como Lazer.
    _criar_distribuicao(
        client, auth_headers, categoria="Lazer", porcentagem=15
    )
    _gasto_recorrente(
        client, auth_headers, title="Netflix", amount=40, category="entertainment"
    )
    # Um gasto avulso de Lazer pra ter algo no envelope.
    client.post(
        "/expenses",
        json={
            "title": "Cinema",
            "amount": 80,
            "category": "entertainment",
            "recurring": False,
        },
        headers=auth_headers,
    )
    resumo = client.get("/planejamento/resumo", headers=auth_headers).json()
    lazer = next(c for c in resumo["categorias"] if c["categoria"] == "Lazer")
    # Lazer só tem o cinema (avulso); Netflix entrou em Fixo.
    assert float(lazer["gasto_atual"]) == 80.0


def test_remover_recorrente_recalcula_fixo(
    client: TestClient, auth_headers: dict
) -> None:
    _criar_distribuicao(
        client, auth_headers, categoria="Fixos", tipo_categoria="Fixo", porcentagem=20
    )
    criado = _gasto_recorrente(
        client, auth_headers, title="Spotify", amount=20, category="entertainment"
    )
    antes = client.get("/planejamento/resumo", headers=auth_headers).json()
    assert float(antes["total_gastos_fixos"]) == 20.0

    # Deleta o gasto recorrente — o Fixo deve voltar a zero automaticamente.
    client.delete(f"/expenses/{criado['id']}", headers=auth_headers)
    depois = client.get("/planejamento/resumo", headers=auth_headers).json()
    assert float(depois["total_gastos_fixos"]) == 0.0


def test_recorrente_desativado_deixa_de_contar(
    client: TestClient, auth_headers: dict
) -> None:
    _criar_distribuicao(
        client, auth_headers, categoria="Fixos", tipo_categoria="Fixo", porcentagem=20
    )
    criado = _gasto_recorrente(
        client, auth_headers, title="Curso", amount=80, category="education"
    )
    antes = client.get("/planejamento/resumo", headers=auth_headers).json()
    assert float(antes["total_gastos_fixos"]) == 80.0

    # PATCH para desligar recurring.
    client.patch(
        f"/expenses/{criado['id']}",
        json={"recurring": False},
        headers=auth_headers,
    )
    depois = client.get("/planejamento/resumo", headers=auth_headers).json()
    assert float(depois["total_gastos_fixos"]) == 0.0


def test_composicao_fixos_inclui_metadados(
    client: TestClient, auth_headers: dict
) -> None:
    _gasto_recorrente(
        client, auth_headers, title="Internet", amount=120, category="utilities"
    )
    resumo = client.get("/planejamento/resumo", headers=auth_headers).json()
    assert len(resumo["composicao_fixos"]) == 1
    item = resumo["composicao_fixos"][0]
    assert item["title"] == "Internet"
    assert item["category"] == "utilities"
    assert float(item["amount"]) == 120.0


def test_discipline_conta_food_lazer_como_lazer(
    client: TestClient, auth_headers: dict
) -> None:
    # Salário 5000, limite default lazer = 15% = 750
    # McDonald's marcado como lazer no valor de 800 → deve estourar.
    client.post(
        "/expenses",
        json={
            "title": "Mc",
            "amount": 800,
            "category": "food",
            "categoria_comportamental": "lazer",
            "recurring": False,
        },
        headers=auth_headers,
    )
    response = client.get("/discipline/warnings", headers=auth_headers)
    assert any(
        "leisure" in w.lower() for w in response.json()["warnings"]
    )
