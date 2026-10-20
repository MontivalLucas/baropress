# Redundâncias e UX
Data: 07/10/2026. Evidência: INSPECIONADO NO CÓDIGO; validação visual BLOQUEADA.

| Local | Constatação | Recomendação / prós / contras | Estado |
|---|---|---|---|
| Pacientes: formulário | Salvar/cancelar no topo e rodapé fazem a mesma ação | Manter ambos para formulários longos: evita rolar; ocupa espaço, mas tem utilidade | Mantidos |
| Análise / configurações avançadas | Gamma, VMAX, threshold e suavização repetidos; painel acrescenta resolução e explicações | Manter controles rápidos e componente compartilhado; só simplificar apresentação após testar viewport | Mantidos |
| Análise / Novo exame / Configurações | Mesmo conjunto visual aparece em contextos distintos | Não são páginas equivalentes: análise ao vivo, parâmetros congelados por exame e preferências globais | Preservados |
| Exames / Relatórios | Ambas listam exames, com ações diferentes | Consolidar filtros/consulta em hook e talvez um único ponto de abertura; menos manutenção, risco na navegação cruzada | Futuro, M |
| Sidebar / Configurações | Alternar tema em dois locais | Atalho global mais opção explícita na tela; sem perda de função ao manter | Preservados |
| Auditoria de autenticação | Logs frontend e backend poderiam duplicar segurança | Backend passa a registrar categorias fixas, sem argumentos; frontend não duplica eventos auth | Aplicado |
| Campos com labels repetidos | IDs iguais afetavam labels e mensagens | useId, erro associado e type explícito de Button | Aplicado |
| Tooltip | Hover toggling dificultava clique e Escape | Ajuda sob clique e fechamento Escape, com aria-describedby | Aplicado; interação manual pendente |
| Formulário paciente | HTML e validações têm faixas diferentes | Escolher faixas canônicas antes de unificar; depende de decisão clínica/produto | UX-04 pendente |
| Observações do relatório | Texto era editável sem esclarecer persistência | Esclarecer que entra em PDF/impressão; preservar exame salvo | Aplicado |
| Painel de mapa em Configurações | Mesmo componente usa role dialog fora de modal | Pode tornar role region configurável conforme contexto; precisa avaliar foco/ARIA em todos os locais | Futuro, P |

Não removi páginas, menus, campos clínicos ou dados. Não encontrei href externo quebrado nem handler deliberadamente vazio que justificasse remover função; controles delegados e eventos stopPropagation do inventário são intencionais. Arquivamento preserva pacientes/exames e não possui restauração na UI atual.

Legibilidade, contraste total, tabulação, scroll, clipping e proporção dos mapas ainda precisam da conferência nos quatro tamanhos solicitados. Tokens Tailwind ausentes e CSS de impressão foram corrigidos no código, sem alegar resultado visual.

