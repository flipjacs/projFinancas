# Redesign do frontend — diagnóstico e decisões

## Objetivo
Aplicar as referências visuais a um produto de finanças pessoais em português, com grafite, superfícies discretas, métricas legíveis e verde moderado. Preservar operações e contratos existentes. O texto fornecido pelo usuário é a especificação deste trabalho.

## Diagnóstico inicial (25/09/2026)
- React 18, TypeScript, Vite 5, Tailwind 3, componentes shadcn/Radix, Recharts 3, React Router 6, Axios, React Query 5, Zustand, React Hook Form e Zod já instalados no manifesto.
- `src/pages`: painel, gastos, planejamento, objetivos, parcelamentos, simulação de compra, configurações, login, cadastro e 404. Disciplina consta na navegação, mas está desativada e sem página; a API já existe.
- `src/layouts`: navegação compartilhada, barra superior e sidebar. Sidebar móvel atual apenas sai da tela, sem isolamento de foco; não recolhe no desktop.
- `src/hooks` + `src/services`: consultas centralizadas e invalidações. Rotas privadas já usam lazy/Suspense. Existem consultas mensais duplicadas por chaves implícitas/explícitas; formulários fechados ainda consultam categorias.
- Formulários têm validação e toasts. Falhas de leitura de algumas páginas se confundem com listas vazias. Dialogs não limitam altura. Gastos só têm tabela, sem busca/período e com limite silencioso de 200 registros.
- Tokens atuais são azul/índigo; tema inicial segue o sistema. Vários gráficos usam cores saturadas. Barra de objetivos reutiliza semáforo de orçamento e sinaliza conclusão como problema.
- JWT Bearer no localStorage (`fp:token` e cópia em `fp:auth`); perfil e salário também persistidos. `useAuth` registra interceptores em cada consumidor, podendo desmontar o handler de outro consumidor. Cache financeiro não é limpo no logout. Backend valida assinatura/expiração e proprietário dos recursos. Não há refresh token ou autenticação por cookies.
- Busca inicial não encontrou HTML manual, `dangerouslySetInnerHTML`, eval ou Function no frontend. Log de ErrorBoundary restrito ao desenvolvimento. Nenhum script de CDN. HTML ainda usa inglês e favicon Vite inexistente.
- Nginx tem nosniff, proteção de iframe, referrer e permissions policy; falta CSP. Servidor exposto em HTTP, portanto não adicionar HSTS incondicional.
- Não há suíte de testes frontend. Build inicial bloqueado por dependências ausentes; auditoria inicial bloqueada por rede. Instalação do lockfile e auditoria solicitadas com a permissão apropriada.

## Design e arquitetura
Refatoração incremental da base existente. Alternativas consideradas: somente trocar tokens (insuficiente para mobile/fluxos) e reescrever todas as páginas (risco desnecessário). Escolha: shell e componentes compartilhados primeiro, depois composição das páginas e correções funcionais localizadas.

Sidebar fixa de 224 px com opção compacta, seções Principal/Planejamento/Sistema, drawer Radix no mobile. Topbar com contexto, busca e conta. Painel com saldo destacado, métricas compactas, evolução financeira em área ampla, categorias, distribuição e alertas. Mesmos tokens, títulos e estados nas demais páginas. Tema escuro inicial, mantendo preferência clara existente. Tipografia de sistema sem download externo, números tabulares. Gráficos com valores textuais acessíveis e animações desativadas ou reduzidas.

## Limites de contrato
- Backend armazena data de criação do gasto, sem data independente, observação, pagamento/status ou periodicidade diferente de mensal. Não apresentar inputs que descartem informações. Compra parcelada usa o formulário/endpoint de parcelamentos existente; poupança usa categoria savings e vínculo ao planejamento.
- Resumos históricos usam o salário atual: identificar renda como referência, sem fingir histórico salarial. API oferece consolidação mensal; 7 dias só pode representar gastos registrados nesse intervalo, sem inventar renda diária ou saldo bancário.
- Saldo é renda menos gastos, não saldo bancário. Compromissos de parcelas são separados dos gastos; identificar a fórmula do disponível. Não somar novamente envelopes e gastos já contabilizados.
- Disciplina expõe `streak_days`, não sequência em meses: mostrar dias. Usar status da API, resumo comportamental e objetivos reais.
- JWT permanece Bearer; não introduzir CSRF para cookies inexistentes nem migração parcial de login.

## Plano de execução
- [x] 1. Tokens, componentes comuns, dark inicial, HTML e metadados.
- [x] 2. Sidebar desktop/mobile acessível, topbar contextual e navegação preservada.
- [x] 3. Painel: métricas, períodos reais, categorias, distribuição, alertas e erros locais.
- [x] 4. Gastos: busca, período, recorrência, paginação explícita, cards mobile e formulário progressivo.
- [x] 5. Planejamento e objetivos: hierarquia, limites/restante, progresso correto e ação de aporte.
- [x] 6. Parcelamentos e disciplina: impacto, contratos existentes, carregamento/erro e limites editáveis.
- [x] 7. Autenticação: bootstrap único, expiração, cache entre contas e persistência mínima.
- [x] 8. Auditoria: CSP, exposição, dependências, estilos responsivos e navegação por teclado.
- [x] 9. Validação: build, lint, type-check, auditoria, verificações de sessão e navegador nas larguras solicitadas; registrar qualquer impedimento real.

## Casos de revisão
Falha de rede sem números falsamente zerados; valores financeiros grandes em 320 px; troca de usuário sem cache anterior; objetivo concluído sem alerta vermelho; drawer/modal com Escape e retorno de foco; filtros sem ocultar limite de paginação; servidor HTTP local funcionando após CSP.

## Encerramento
Implementação e verificações concluídas em 26/09/2026. Resultados, limitações e riscos residuais estão em `frontend-redesign-report.md`.
