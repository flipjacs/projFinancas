# Hospedagem na rede local

Deploy validado em 26/09/2026 com `docker compose up -d --build`.

- Endereço atual: http://192.168.15.6:5173
- Frontend/Nginx publicado em 0.0.0.0:5173.
- API publicada apenas em 127.0.0.1:8000; MySQL apenas em 127.0.0.1:3307, conforme o `.env` existente. Redis permanece interno.
- `.env` configurado para produção, debug desligado, CORS explícito e chave JWT forte. Credenciais do banco e volume existentes preservados.
- Reinício: `docker compose up -d`.
- Atualização de código: `docker compose up -d --build`.
- Parada preservando dados: `docker compose down`.
- Não usar `docker compose down -v`: apaga o banco.

Verificações: build das imagens passou, migrações concluíram, quatro serviços saudáveis, Nginx validado, login retornou HTTP 200, `/health/ready` confirmou banco saudável e `/api/v1/users/me` sem token retornou 401. Tela de login abriu pelo IP privado sem erros de console. O teste foi feito nesta máquina pelo endereço LAN; não houve teste físico em outro dispositivo.

O firewall atual permite a porta 5173; nenhuma regra de firewall foi alterada. Dispositivos precisam estar na mesma rede e sem isolamento entre clientes Wi-Fi. O IP pode mudar com DHCP; para um endereço estável, reserve o IP da máquina no roteador. Este deploy usa HTTP local e não configura exposição à internet.
