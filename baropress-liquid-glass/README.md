# Baropress — Liquid Glass Concept

Protótipo visual original, clicável e independente, criado em uma pasta própria. Todo o conteúdo é fictício. Não acessa o Tauri, o banco, a comunicação serial ou os serviços do Baropress atual.

## Abrir

Abra `index.html` diretamente no Edge, Chrome ou outro navegador moderno. No Windows, também pode dar dois cliques em `abrir-preview.bat`.

Não exige instalação, npm, build ou internet. Você pode copiar **esta pasta inteira** para outro local e continuar usando o protótipo.

Para uma prévia HTTP opcional, com Node.js já instalado:

```powershell
cd "caminho\para\baropress-liquid-glass"
node preview.mjs
```

Abra [a prévia local](http://127.0.0.1:4178). O servidor entrega somente os seis arquivos estáticos permitidos desta pasta, escuta apenas em 127.0.0.1 e não possui rotas de API. Encerre com Ctrl+C.

## Explorar

- Visão geral: indicadores, mapa plantar ilustrativo, agenda e exames recentes.
- Pacientes: busca local e prévias de perfis fictícios.
- Exames: busca, período, status e detalhes ilustrativos.
- Agenda: seleção de dia e formulário visual de agendamento.
- Análises: alternância entre duas composições de exemplo e controle de legendas.
- Relatórios: prévias visuais; exportação apresenta apenas uma mensagem.
- Preferências: tema claro/escuro, superfícies opacas e legendas.
- Novo exame: três etapas visuais, sem coleta, criação ou gravação de exame.
- Busca global: botão superior ou Ctrl+K; Escape fecha as janelas.

As interações existem somente na memória da página e são reiniciadas ao recarregar. Nenhum formulário salva dados. Não utiliza cookies, localStorage, fetch, WebSocket ou serviços externos. A política CSP bloqueia conexões de aplicação (`connect-src 'none'`) e submissão de formulários.

## Direção de UX/UI

Fundo mineral com luz azul e lavanda; navegação em vidro translúcido; bordas com reflexo; controles com profundidade; superfícies de leitura mais sólidas; espaços generosos; tipografia de sistema. SVGs originais, locais e sem dependências.

Layout responsivo para desktop, tablet e celular. Controles com rótulos acessíveis, foco de teclado, diálogos nativos e suporte a movimento reduzido. A opção “Reduzir transparência” prioriza leitura.

Referências consultadas:

- [Apple — apresentação do Liquid Glass](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/).
- [Apple Human Interface Guidelines — Materials](https://developer.apple.com/design/human-interface-guidelines/materials).

O efeito no navegador é uma interpretação visual em CSS/SVG; não utiliza os componentes nativos da Apple.

## Verificação

`node verify.mjs` executa verificações de isolamento, conteúdo, filtros e fluxos usando os arquivos desta pasta e recursos nativos do Node.js. Não exige pacotes do projeto original. A verificação de lógica usa substitutos mínimos de DOM; não substitui a inspeção visual em um navegador.

A abertura automática no navegador foi negada pela política da ferramenta durante a criação. A renderização, os breakpoints e o comportamento nativo dos diálogos precisam de inspeção manual no navegador.

## Isolamento

Todos os novos arquivos estão nesta pasta. Nenhum arquivo do projeto atual precisa ser alterado para abrir ou usar a página. `original-files.sha256.json` registra os hashes dos arquivos originais antes da criação para verificar a preservação do projeto; não é uma dependência da página.
