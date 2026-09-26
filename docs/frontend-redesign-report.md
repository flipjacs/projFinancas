# Relatório do redesign do frontend

Concluído em 26/09/2026. O backend e os contratos da API foram preservados. O diagnóstico e as decisões estão em `frontend-redesign.md`.

## 1. Alterações visuais

Interface grafite com superfícies em três níveis, bordas discretas, tipografia de sistema, números tabulares e verde moderado. Shell com sidebar de 224 px, modo compacto de 72 px, navegação em três seções, barra contextual, busca rápida e conta. Painel com saldo e fórmula explícita, métricas, evolução financeira, categorias, distribuição, gastos recentes e alertas. Gastos, planejamento, objetivos, parcelamentos, simulador, configurações e autenticação seguem os mesmos tokens. Modo disciplina passou a ter uma página funcional com a API existente.

## 2. Componentes e módulos criados

`PageHeader`, `FinancialEvolution`, `IncomeDistribution`, `GoalContributionDialog`, `DisciplineSettingsForm` e `DisciplinePage`. Serviço, tipos e hook de disciplina; módulos `session` e `queryClient`; favicon e script externo de aplicação inicial do tema; configuração ESLint e testes de sessão.

## 3. Componentes modificados

Sidebar, Navbar, AppLayout, AuthLayout, cards/métricas, gráficos, estados vazios/erro, botões, diálogos, tabelas, filtros, formulários e cards de gastos, categorias, objetivos e parcelamentos. Hooks e serviços mantêm a separação existente. Rotas ganharam disciplina e perfil; o simulador foi preservado. O gráfico mensal antigo, sem referências após a substituição, foi removido.

## 4. Responsividade

Sidebar vira drawer no celular. Métricas e conteúdo reorganizam o grid; títulos e ações quebram em linhas. Gastos usam cards abaixo de 1024 px e tabela no desktop. Modais têm largura/altura limitadas e rolagem interna. A matriz de nove páginas foi verificada em 320, 375, 390, 414, 768, 1024, 1280, 1440 e 1920 px, sem overflow horizontal do documento com dados fictícios. O formulário de gasto também foi conferido visualmente em 320 px.

## 5. Acessibilidade

Link para pular ao conteúdo, foco no conteúdo ao navegar, labels associados, mensagens de validação e erro anunciáveis, nomes contextualizados nos menus, estados selecionados explícitos e foco visível. Drawer e diálogos usam Radix com isolamento de foco e Escape. Retorno de foco foi verificado no botão de origem, inclusive na troca de gasto para parcelamento. Valores dos gráficos têm representações textuais; projeção de parcelas permite consultar valores por mês. CSS respeita movimento reduzido; animações dos gráficos foram desativadas. Isto é revisão prática de teclado/DOM, não certificação WCAG nem teste completo com leitor de tela.

## 6. Performance

Rotas continuam lazy, consultas mensais usam chaves coerentes e formulários fechados evitam consultas desnecessárias. Gastos carregam páginas de 50 registros. Parcelamentos consultam páginas de 100 até completar a lista antes de calcular totais, eliminando truncamento silencioso. Leituras paginadas e evolução semanal aceitam cancelamento. Fontes de sistema e ausência de imagens decorativas/CDNs evitam downloads extras. Cache de consultas é limpo entre contas.

No build final, o maior chunk é Recharts: aproximadamente 412 kB / 119 kB gzip. O chunk principal fica próximo de 149 kB / 49 kB gzip, com React, Radix e formulários separados. Não foi feita medição Lighthouse em dispositivo físico ou rede limitada; não há alegação de melhora percentual de velocidade. Históricos muito grandes ainda exigem mais requisições; filtragem de gastos deixa explícito que opera nos registros carregados.

## 7. Segurança: verificado, corrigido e riscos

- Busca no código não encontrou `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, logs de tokens ou scripts externos de CDN. Dados continuam sujeitos ao escaping do React. Nenhum segredo de backend foi adicionado ao frontend.
- Bootstrap de sessão e handler de 401 centralizados; respostas antigas não encerram uma sessão nova. JWT expirado limpa a sessão, com aviso no login. Timer suporta validade longa e revalida ao focar a janela. Trocas entre abas sincronizam a sessão. Login/logout limpam cache financeiro. Perfil e salário deixaram de ser persistidos; cópia legada de autenticação é removida.
- Destino após login restringido às rotas internas conhecidas. Rotas privadas continuam protegidas e autorização permanece no backend. Logout seguido de visita a parcelamentos redirecionou ao login.
- Erros apresentados ao usuário são mensagens neutras em português; detalhes internos da API não são renderizados. ErrorBoundary só registra detalhes em desenvolvimento. Build sem source maps.
- Nginx recebeu CSP com scripts somente da origem e sem `unsafe-eval`, além de nosniff, proteção de iframe, referrer e permissions policy. `style-src 'unsafe-inline'` permanece necessário para posicionamento/estilos de Recharts e Radix. A sintaxe passou em `nginx -t`; `/login` devolveu os headers esperados. A tela de login do build carregou sob a CSP sem erros de console.
- Proxy same-origin preservado. CORS do backend exige lista explícita em produção e não foi alterado. HSTS não foi adicionado ao servidor HTTP; depende de terminação HTTPS no deploy.
- JWT ainda fica no localStorage: código malicioso executado na origem poderia lê-lo. Migração completa para cookie HttpOnly/refresh token requer trabalho coordenado com o backend. Não foi implementado CSRF artificial em uma autenticação Bearer sem cookies.

## 8. Dependências

Nenhuma biblioteca de aplicação foi adicionada. Atualizações compatíveis com os intervalos existentes corrigiram ocorrências em Axios e dependências transitivas (incluindo Babel, form-data, PostCSS e outras). Stack React/Vite/Tailwind/Radix/Router/React Query preservada. Testes usam o runner nativo do Node, sem framework adicional. A execução dos testes de TypeScript requer Node 22.6 ou superior com suporte a `--experimental-strip-types`.

## 9. Limitações preservadas e pendências reais

A API não oferece observação, data de gasto independente da criação, status de pagamento ou recorrência distinta de mensal; não há campos que descartem silenciosamente esses dados. Histórico mensal usa renda atual como referência, não histórico salarial. Período de sete dias mostra gastos registrados, sem renda/saldo diário inventado. Saldo mostrado não é saldo bancário. Disciplina usa sequência em dias, conforme a API, e não meses. Aporte em objetivo atualiza o valor guardado; não cria transferência bancária ou gasto, como informa o formulário.

As quatro ocorrências de dependências abaixo permanecem. Sua correção exige migração de Vite e React Router; não foi aplicado `audit fix --force`. Ainda faltam teste com leitor de tela, medição em aparelho físico e teste de todo o fluxo autenticado dentro do Nginx de produção: o teste Nginx isolado validou sintaxe, headers e login estático; a integração autenticada foi testada via Vite e API real com SQLite temporário.

## 10. Testes executados

- Testes de sessão: expiração JWT, tokens inválidos e destino interno após login; três casos passaram na execução direta. Script `npm test` também passou.
- Suíte do backend: 164 testes passaram com SQLite de teste; sem alterações de backend. Pytest emitiu aviso de configuração futura do escopo de fixtures asyncio.
- Navegador com API real e base fictícia isolada: login, logout, bloqueio de rota privada, navegação das nove páginas, validação e criação de gasto, atualização do painel, aporte em objetivo, configuração de disciplina, formulário de compra parcelada e criação de parcelamento com feedback de sucesso.
- Modais/drawer, Escape e retorno de foco; matriz responsiva nas nove larguras; nenhuma mensagem de erro de console na revisão final das páginas.
- `git diff --check` sem erros. Não foram usados dados financeiros reais para os testes de escrita.

## 11. Build

`npm run build`: aprovado. TypeScript e Vite geraram o build de produção. `npm run type-check`: aprovado.

## 12. Lint

`npm run lint`: aprovado, sem avisos. Foi criada a configuração ESLint que faltava para o script existente funcionar.

## 13. Auditoria de dependências

`npm audit --json` em 26/09/2026: **4 ocorrências, 1 alta e 3 moderadas; 0 críticas e 0 baixas**. O comando retorna código 1 porque essas ocorrências ainda existem. A auditoria inicial tinha 15 ocorrências; as atualizações compatíveis reduziram esse número.

| Pacote | Gravidade | Correção indicada pelo npm |
| --- | --- | --- |
| Vite | Alta | Vite 8.3.1, alteração de versão principal |
| esbuild | Moderada | Migração do Vite |
| react-router | Moderada | React Router DOM 7.18.4, alteração de versão principal |
| react-router-dom | Moderada | React Router DOM 7.18.4, alteração de versão principal |

Vite/esbuild são ferramentas de desenvolvimento/build; a configuração Nginx distribui arquivos estáticos. Os avisos de Router também exigem revisão de uso e migração. Esses pontos não justificam afirmar que a aplicação está integralmente segura. O JSON da auditoria foi preservado em `frontend-dependency-audit.json`.
