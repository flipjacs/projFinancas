# Revisão exclusiva do tema claro

## Escopo e diagnóstico

O tema escuro é o benchmark. A revisão preserva páginas, posição, densidade, tipografia, ícones, arredondamentos, marca verde e comportamento funcional. A versão clara tinha sidebar/cards brancos sem separação suficiente e barras financeiras com apenas 25% de opacidade. Categorias compartilhavam cores pastel do escuro em fundos claros.

## Alterações

Tokens centralizados em `frontend/src/styles/globals.css`: background off-white, sidebar neutra própria, cards quase brancos, superfícies elevadas brancas e áreas internas suaves. Bordas subtle/default/strong/focus, texto principal/secundário/terciário/desabilitado, estados de interação e cores semânticas dos gráficos. Os nomes existentes foram mantidos: `primary` continua sendo a marca e `accent` continua sendo seleção neutra, evitando alterar a semântica Radix/shadcn.

Cards têm sombra de 1 px muito suave no claro. O saldo ganha superfície e borda próprias, mantendo a mesma composição. Sidebar tem separador mais visível, categorias mais legíveis e item ativo com borda interna discreta e o indicador verde existente. Botão principal tem verdes distintos para default/hover/pressed; disabled fica neutro. Menus, selects e modais usam a superfície elevada; o drawer conserva a superfície da sidebar. Foco mantém o ring verde acessível.

O gráfico financeiro usa tokens separados para grid, eixos, referência, saldo, barras e pontos. Barras são opacas no claro, linha de saldo sólida com marcadores e linha de referência tracejada. Legenda e consulta textual permanecem. Paleta de categorias foi centralizada; variantes claras mais escuras tornam segmentos/ícones legíveis, enquanto os hexadecimais originais do escuro são preservados. Cores fixas de objetivo concluído e parcela livre também viraram tokens.

## Contraste medido

Cálculo WCAG de luminância relativa com os tokens efetivos, sem arredondar cores antes do cálculo:

| Uso no claro | Razão |
| --- | --- |
| Texto principal / card | 15,98:1 |
| Texto secundário / sidebar | 6,99:1 |
| Texto terciário / card | 6,59:1 |
| Texto terciário / estado pressed | 4,54:1 |
| Texto branco / botão principal | 7,19:1 |
| Texto branco / hover do botão | 8,77:1 |
| Texto branco / pressed do botão | 10,24:1 |
| Barras financeiras / card | 4,65:1 |
| Linha de referência / card | 5,36:1 |
| Borda de input / background | 3,04:1 |

Grid e bordas estruturais são mais suaves porque não carregam dados nem representam sozinhas um controle. Botões e campos usam borda/ring próprios; disabled é visualmente distinto e está isento do mínimo normativo de texto. A barra e a linha do gráfico têm estilos e legenda diferentes, e os valores continuam disponíveis em texto.

## Verificações

- Testes automatizados de contraste: textos nas superfícies e estados, botão nos três estados, eixos/barras/referência, foco, borda de input e paleta de categorias.
- Teste de preservação da paleta escura. O bloco original de tokens `.dark` foi comparado ao anterior e permaneceu idêntico; superfícies computadas do body, sidebar, topbar e saldo também coincidiram.
- Varredura de contraste dos textos renderizados em painel, gastos, planejamento, objetivos, parcelamentos, disciplina, simulador e configurações: nenhuma falha nos dados de teste. Componentes ocultos e desabilitados foram excluídos; a ferramenta não substitui auditoria completa de leitor de tela.
- Oito páginas verificadas em 320, 390, 768, 1024, 1440 e 1920 px sem overflow horizontal. Inspeção visual desktop e mobile.
- Formulário: labels, placeholder, ring e contraste. Dropdown: estado selecionado. Períodos: seleção e foco distinto por Tab. Drawer: contraste e retorno de foco após Escape.
- Estados default/hover/pressed/disabled do botão cobertos pelos tokens e teste de contraste; seleção de período e foco conferidos no navegador. Não houve alteração de layout ou da preferência de tema do usuário.
- Lint, type-check, testes e build passaram. Nenhuma dependência adicionada. Movimento reduzido existente preservado.

Integração visual testada com API e base fictícias isoladas, sem criar registros no banco hospedado. O frontend foi reconstruído no Compose existente; backend e volume do banco não foram alterados. Esta revisão cobre contraste e interações do escopo, sem alegar certificação integral WCAG 2.2 AA.
