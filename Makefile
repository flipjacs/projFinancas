.PHONY: help up up-d down logs ps build rebuild test migrate shell clean

help:
	@echo "Atalhos do docker compose:"
	@echo "  make up        - sobe todos os serviços (em foreground)"
	@echo "  make up-d      - sobe todos os serviços em background"
	@echo "  make down      - derruba os containers"
	@echo "  make logs      - tail dos logs de todos os serviços"
	@echo "  make ps        - status dos containers"
	@echo "  make build     - build das imagens"
	@echo "  make rebuild   - rebuild sem cache"
	@echo "  make test      - roda pytest no backend"
	@echo "  make migrate   - aplica migrações Alembic pendentes"
	@echo "  make shell     - abre shell no container do backend"
	@echo "  make clean     - down + remove o volume do MySQL"

up:
	docker compose up --build

up-d:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f --tail=200

ps:
	docker compose ps

build:
	docker compose build

rebuild:
	docker compose build --no-cache

test:
	docker compose exec backend pytest

migrate:
	docker compose exec backend alembic upgrade head

shell:
	docker compose exec backend sh

clean:
	docker compose down -v
