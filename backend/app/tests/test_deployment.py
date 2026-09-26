import ssl

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from sqlalchemy.exc import OperationalError

from app.core.config import Settings
from app.database.connection import connection_options
from app.database.session import get_db


def deployment_settings(**overrides):
    values = dict(_env_file=None, database_url='mysql+pymysql://user:password@db.example.com:3306/financeiro', jwt_secret_key='x' * 48, app_env='production', cors_origins='', debug=False)
    values.update(overrides)
    return Settings(**values)


@pytest.mark.parametrize('host', ['mysql', 'localhost', '127.0.0.1', '[::1]'])
def test_vercel_rejects_local_database(monkeypatch, host):
    monkeypatch.setenv('VERCEL', '1')
    with pytest.raises(ValidationError, match='external MySQL'):
        deployment_settings(database_url=f'mysql+pymysql://user:password@{host}:3306/db')


def test_external_database_and_same_origin_cors(monkeypatch):
    monkeypatch.setenv('VERCEL', '1')
    assert deployment_settings().cors_origins_list == []


def test_mysql_tls_verifies_certificate_and_host():
    options = connection_options(deployment_settings(database_ssl=True))
    assert options['connect_timeout'] == 10
    assert options['ssl'].verify_mode == ssl.CERT_REQUIRED
    assert options['ssl'].check_hostname


def test_sqlite_test_connection_has_no_mysql_options():
    assert connection_options(deployment_settings(app_env='test', database_url='sqlite://')) == {}


def test_readiness_does_not_expose_database_errors(client: TestClient):
    class BrokenDatabase:
        def execute(self, statement):
            raise OperationalError('SELECT 1', {}, Exception('private-provider-details'))
    def failing_db():
        yield BrokenDatabase()
    client.app.dependency_overrides[get_db] = failing_db
    response = client.get('/health/ready')
    assert response.status_code == 503
    assert response.json()['components']['database']['detail'] == 'Database connection failed'
    assert 'private-provider-details' not in response.text
