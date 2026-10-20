# Pendências e recomendações
Data: 07/10/2026.

## Bloqueios/validações
- **UI-TEST:** janela do desktop debug foi localizada com base isolada; Computer Use get_window_state respondeu “Computer Use app approval timed out”. Abertura de janela não prova que os controles funcionam. Nenhum clique/teclado ou screenshot validou o app.
- **HW-TEST:** ESP32 físico, COM USB, Bluetooth SPP, impressora e pareamento não usados.
- **Layouts:** quatro dimensões solicitadas e contraste/leitor de tela ainda NÃO TESTADOS.
- **Instalação:** instalador pode ser gerado, mas não foi instalado/desinstalado nem alterou instalação real.
- **Arquivos:** CSV e jsPDF testados como lógica; CanvasPNG, download/save do WebView2 e abertura/impressão exigem ensaio manual.
- **Performance:** nenhum perfil real de CPU/memória com450x450 e aquisição prolongada/base volumosa.

## Decisões explícitas antes de novas mudanças
1. **SEC-01 (ALTO):** decidir cifragem de SQLite/backup e gestão/recuperação da chave. Login não cifra arquivos. Não executar migração de segurança sem cópia e decisão.
2. **SCI-01 (MÉDIO):** definir contato para threshold0: manter >= atual, impor mínimo positivo ou ignorar zero. Nenhuma regra clínica foi alterada.
3. **UX-04 (BAIXO):** escolher faixas canônicas de altura/peso/calçado antes de unificar camadas.
4. **HIST-01 (MÉDIO):** decidir snapshot demográfico por exame versus dados cadastrais atuais; dados antigos não permitem reconstrução histórica.
5. **PERF-01 (MÉDIO):** medir volume típico para paginação e limites; evitar otimização sem cenário reproduzível.

## Limites da recuperação local
- Conta antiga sem código e sem senha atual não pode ser recuperada automaticamente. Nome, e-mail ou CPF não provam posse.
- Não há e-mail/SMS, perguntas triviais ou admin reset sem credencial do titular. O admin cria equipe; cada titular pode provisionar/rotacionar o próprio código após entrar.
- Código recupera uma vez, é hash no banco e precisa ser guardado fora do computador. Após usar, entrar com senha nova e provisionar outro.
- Alteração comum de senha mantém código previamente provisionado; rotação pode ser feita em Configurações.
- Restaurar backup completo restaura também contas e hashes recovery daquele momento, podendo reativar códigos antigos e senhas antigas; depois do restore, revisar credenciais e gerar códigos novos.
- Sessão só existe no processo Rust, expira8h; limitador de tentativas é local/em memória. Quem controla arquivos/sistema operacional pode contornar proteção de app; permissões e segurança do Windows continuam necessárias.

Seguir CHECKLIST_MANUAL.md e registrar resultados na Sprint com versão, origem, ambiente e evidência, sem dados pessoais. Lotes A/B/C autorizados estão aplicados; lote D e decisões acima continuam como propostas.

