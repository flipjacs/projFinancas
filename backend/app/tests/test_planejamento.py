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
