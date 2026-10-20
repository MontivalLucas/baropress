# Inventário funcional por controle

Gerado da AST em 07/10/2026. 13 rotas autenticadas + login; 234 definições estáticas de controles; 1 conjunto de abas; 6 definições de painéis/diálogos; 43 comandos Tauri. Componentes genéricos e expressões em listas são contados uma vez; não são contagens de botões simultaneamente visíveis.

Método por linha: INSPECIONADO NO CÓDIGO (AST + revisão de fluxo). Nenhuma linha desta tabela afirma que houve clique de UI. Testes dos serviços e stores estão separados em RESULTADOS_TESTES.md; roteiro de execução em CHECKLIST_MANUAL.md.

| ID | Módulo / tela e linha | Controle / rótulo | Ação / dependência direta | Estado bloqueado | Método e resultado |
|---|---|---|---|---|---|
| C001 | src/components/ErrorBoundary.tsx:16 | Button Voltar ao dashboard | {() => useSession.getState().go('dashboard')} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C002 | src/components/Sidebar.tsx:40 | button {label} {off && <span className="text-xs text-mute">Fase {phase}</span>} | {() => go(id)} | {off} | INSPECIONADO NO CÓDIGO; UI pendente |
| C003 | src/components/Sidebar.tsx:52 | button {dark ? "Tema claro" : "Tema escuro"} | {toggleTheme} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C004 | src/components/Sidebar.tsx:53 | button "Sair" | {async () => { setLeaving(true); setError(""); try { await logout(); } catch (e) { setError((e as Error).message); } finally { setLeaving(false); } }} | {leaving} | INSPECIONADO NO CÓDIGO; UI pendente |
| C005 | src/components/ui/controls.tsx:6 | button button | Controle nativo ou delegação via componente; conferir contexto | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C006 | src/components/ui/controls.tsx:17 | input {id} | Controle nativo ou delegação via componente; conferir contexto | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C007 | src/features/acquisition/AcquisitionPage.tsx:148 | button Hardware Real | {() => setDeviceType("SERIAL")} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C008 | src/features/acquisition/AcquisitionPage.tsx:160 | button Simulador (Mock) | {() => setDeviceType("MOCK")} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C009 | src/features/acquisition/AcquisitionPage.tsx:180 | button "Atualizar lista de portas" | {refreshPorts} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C010 | src/features/acquisition/AcquisitionPage.tsx:189 | select {availablePorts.length === 0 ? ( <option value="">Nenhuma porta detectada</option> ) : ( availablePorts.map((p) => ( <option key={p.name} value={p.name}> {p.name} {p.isBluetooth ? "— (Bluetooth SPP)" : ""} {p.manufacture | {(e) => setSelectedPort(e.target.value)} | {status.connected} | INSPECIONADO NO CÓDIGO; UI pendente |
| C011 | src/features/acquisition/AcquisitionPage.tsx:209 | select {BAUD_RATES.map((b) => ( <option key={b} value={b}> {b} baud {b === 115200 ? "(Padrão ESP32)" : ""} </option> ))} | {(e) => setSelectedBaud(Number(e.target.value))} | {status.connected} | INSPECIONADO NO CÓDIGO; UI pendente |
| C012 | src/features/acquisition/AcquisitionPage.tsx:231 | button {p.label} {p.desc} | {() => setMockPattern(p.id)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C013 | src/features/acquisition/AcquisitionPage.tsx:252 | button {status.connected ? ( <> <Square size={16} /> Desconectar Dispositivo </> ) : ( <> <Play size={16} /> Conectar Dispositivo </> )} | {handleConnectToggle} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C014 | src/features/acquisition/AcquisitionPage.tsx:274 | button {status.acquiring ? ( <> <Square size={16} /> Pausar Aquisição </> ) : ( <> <Activity size={16} /> Iniciar Aquisição Contínua </> )} | {handleAcquisitionToggle} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C015 | src/features/acquisition/AcquisitionPage.tsx:317 | button {tareState.isZeroing ? `Zerando (${tareState.zeroingProgress}%)…` : "Zerar Tara (20 frames)"} | {startZeroing} | {!status.acquiring \|\| tareState.isZeroing} | INSPECIONADO NO CÓDIGO; UI pendente |
| C016 | src/features/acquisition/AcquisitionPage.tsx:327 | button {tareState.active ? "Tara: Ativa" : "Tara: Inativa"} | {toggleTareActive} | {!tareState.baseline} | INSPECIONADO NO CÓDIGO; UI pendente |
| C017 | src/features/acquisition/AcquisitionPage.tsx:342 | button "Limpar Baseline de Tara" | {clearTare} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C018 | src/features/acquisition/AcquisitionPage.tsx:365 | button Limpar | {clearLogs} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C019 | src/features/agenda/AgendaPage.tsx:79 | Button Novo profissional | {() => { setProfessionalForm(true); setFormError(""); }} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C020 | src/features/agenda/AgendaPage.tsx:79 | Button Nova consulta | {() => open(date)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C021 | src/features/agenda/AgendaPage.tsx:81 | Button "Período anterior" | {() => setDate(shiftCalendar(date, view, -1))} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C022 | src/features/agenda/AgendaPage.tsx:81 | Button Hoje | {() => setDate(localDate())} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C023 | src/features/agenda/AgendaPage.tsx:81 | Button "Próximo período" | {() => setDate(shiftCalendar(date, view, 1))} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C024 | src/features/agenda/AgendaPage.tsx:81 | input "Data da agenda" | {(e) => { if (e.target.value) setDate(e.target.value); }} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C025 | src/features/agenda/AgendaPage.tsx:84 | Button {label} | {() => setView(id)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C026 | src/features/agenda/AgendaPage.tsx:87 | button {`Nova consulta em ${day}`} | {() => open(day)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C027 | src/features/agenda/AgendaPage.tsx:88 | button {a.startTime}–{a.endTime ?? '—'} {a.patientName} {a.professionalName ?? 'Sem profissional'} {appointmentStatuses[a.status]} | {() => open(day, a)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C028 | src/features/agenda/AgendaPage.tsx:93 | select Selecione {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)} | {(e) => setForm({ ...form, patientId: Number(e.target.value) })} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C029 | src/features/agenda/AgendaPage.tsx:94 | select Não informado {professionals.map((p) => <option key={p.id} value={p.id}>{p.name}{p.registration ? ` · ${p.registration}` : ''}</option>)} | {(e) => setForm({ ...form, professionalId: Number(e.target.value) \|\| null })} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C030 | src/features/agenda/AgendaPage.tsx:95 | Field "Data" | {(e) => setForm({ ...form, date: e.target.value })} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C031 | src/features/agenda/AgendaPage.tsx:95 | Field "Início" | {(e) => setForm({ ...form, startTime: e.target.value })} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C032 | src/features/agenda/AgendaPage.tsx:95 | Field "Término" | {(e) => setForm({ ...form, endTime: e.target.value })} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C033 | src/features/agenda/AgendaPage.tsx:96 | Field "Tipo da consulta" | {(e) => setForm({ ...form, type: e.target.value })} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C034 | src/features/agenda/AgendaPage.tsx:97 | select {Object.entries(appointmentStatuses).map(([id, label]) => <option key={id} value={id}>{label}</option>)} | {(e) => setForm({ ...form, status: e.target.value as AppointmentInput['status'] })} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C035 | src/features/agenda/AgendaPage.tsx:98 | textarea textarea | {(e) => setForm({ ...form, notes: e.target.value })} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C036 | src/features/agenda/AgendaPage.tsx:100 | Button {deleteConfirm ? 'Confirmar exclusão' : 'Excluir consulta'} | {() => { if (deleteConfirm) void remove(); else setDeleteConfirm(true); }} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C037 | src/features/agenda/AgendaPage.tsx:105 | Button Cancelar | {() => setForm(null)} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C038 | src/features/agenda/AgendaPage.tsx:105 | Button {busy ? 'Salvando...' : 'Salvar consulta'} | Controle nativo ou delegação via componente; conferir contexto | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C039 | src/features/agenda/AgendaPage.tsx:123 | Field {{ name: 'Nome', profession: 'Profissão', registration: 'Registro profissional' }[key]} | {(e) => setNewProfessional({ ...newProfessional, [key]: e.target.value })} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C040 | src/features/agenda/AgendaPage.tsx:123 | Button Cancelar | {() => setProfessionalForm(false)} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C041 | src/features/agenda/AgendaPage.tsx:123 | Button Salvar profissional | Controle nativo ou delegação via componente; conferir contexto | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C042 | src/features/auth/AccountSettings.tsx:41 | Button Alterar senha | {() => switchMode("change")} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C043 | src/features/auth/AccountSettings.tsx:41 | Button Gerar código de recuperação | {() => switchMode("recovery")} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C044 | src/features/auth/AccountSettings.tsx:41 | Button Cadastrar usuário | {() => switchMode("register")} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C045 | src/features/auth/AccountSettings.tsx:43 | Field "Nome do usuário" | {(e) => setName(e.target.value)} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C046 | src/features/auth/AccountSettings.tsx:43 | Field "E-mail do usuário" | {(e) => setEmail(e.target.value)} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C047 | src/features/auth/AccountSettings.tsx:43 | select Profissional Assistente | {(e) => setRole(e.target.value as typeof role)} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C048 | src/features/auth/AccountSettings.tsx:43 | PasswordField "Senha atual" | {setPassword} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C049 | src/features/auth/AccountSettings.tsx:44 | PasswordField "Nova senha" | {setNext} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C050 | src/features/auth/AccountSettings.tsx:44 | PasswordField "Confirmar nova senha" | {setConfirm} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C051 | src/features/auth/AccountSettings.tsx:48 | Button {busy ? "Aguarde..." : operation === "register" ? "Criar conta" : operation === "recovery" ? "Gerar novo código" : "Alterar senha e sair"} | Controle nativo ou delegação via componente; conferir contexto | {busy \|\| activeExam} | INSPECIONADO NO CÓDIGO; UI pendente |
| C052 | src/features/auth/LoginPage.tsx:40 | Button Tentar novamente | {() => setRetry(retry + 1)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C053 | src/features/auth/LoginPage.tsx:40 | Button Voltar para entrar | {() => switchMode("login")} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C054 | src/features/auth/LoginPage.tsx:41 | Field "Nome" | {(e) => setName(e.target.value)} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C055 | src/features/auth/LoginPage.tsx:42 | Field "E-mail" | {(e) => setEmail(e.target.value)} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C056 | src/features/auth/LoginPage.tsx:43 | Field "Código de recuperação" | {(e) => setCode(e.target.value)} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C057 | src/features/auth/LoginPage.tsx:44 | PasswordField {mode === "recover" ? "Nova senha" : "Senha"} | {setPassword} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C058 | src/features/auth/LoginPage.tsx:45 | PasswordField "Confirmar senha" | {setConfirmation} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C059 | src/features/auth/LoginPage.tsx:47 | Button {busy ? "Aguarde..." : mode === "register" ? "Criar conta" : mode === "recover" ? "Redefinir senha" : "Entrar"} | Controle nativo ou delegação via componente; conferir contexto | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C060 | src/features/auth/LoginPage.tsx:49 | button Voltar para entrar | {() => switchMode("login")} | {busy \|\| !!firstRun} | INSPECIONADO NO CÓDIGO; UI pendente |
| C061 | src/features/auth/LoginPage.tsx:49 | button Criar conta / Cadastrar usuário | {() => switchMode("register")} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C062 | src/features/auth/LoginPage.tsx:49 | button Esqueci minha senha? | {() => switchMode("recover")} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C063 | src/features/auth/PasswordField.tsx:5 | Field {label} | {(e) => onChange(e.target.value)} | {disabled} | INSPECIONADO NO CÓDIGO; UI pendente |
| C064 | src/features/auth/PasswordField.tsx:5 | button {`${visible ? "Ocultar" : "Mostrar"} ${label.toLowerCase()}`} | {() => setVisible(!visible)} | {disabled} | INSPECIONADO NO CÓDIGO; UI pendente |
| C065 | src/features/auth/RecoveryReceipt.tsx:5 | input input | {(e) => setSaved(e.target.checked)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C066 | src/features/auth/RecoveryReceipt.tsx:5 | Button Continuar | {onDone} | {!saved} | INSPECIONADO NO CÓDIGO; UI pendente |
| C067 | src/features/backup/BackupPage.tsx:108 | Button Exportar backup completo | {() => void exportBackup(false)} | {busy \|\| examinationActive} | INSPECIONADO NO CÓDIGO; UI pendente |
| C068 | src/features/backup/BackupPage.tsx:108 | select Selecione o paciente {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)} | {(e) => setPatientId(Number(e.target.value))} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C069 | src/features/backup/BackupPage.tsx:108 | Button Exportar dados deste paciente | {() => void exportBackup(true)} | {busy \|\| !patientId \|\| examinationActive} | INSPECIONADO NO CÓDIGO; UI pendente |
| C070 | src/features/backup/BackupPage.tsx:109 | input input | {(e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) void inspect(file); }} | {busy \|\| examinationActive} | INSPECIONADO NO CÓDIGO; UI pendente |
| C071 | src/features/backup/BackupPage.tsx:115 | input input | {(e) => setConfirmed(e.target.checked)} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C072 | src/features/backup/BackupPage.tsx:116 | Button Pausar aquisição | {() => void acq.stopAcquisition()} | {busy \|\| examinationActive} | INSPECIONADO NO CÓDIGO; UI pendente |
| C073 | src/features/backup/BackupPage.tsx:117 | Button {busy ? 'Processando...' : preview?.kind === 'patient' ? 'Importar paciente' : 'Restaurar backup completo'} | {() => void restore()} | {busy \|\| !preview \|\| !confirmed \|\| examinationActive \|\| acq.status.acquiring} | INSPECIONADO NO CÓDIGO; UI pendente |
| C074 | src/features/baropodometry/BaropodometryPage.tsx:148 | button "Capturar baseline sem carga sobre a esteira" | {startZeroing} | {!status.acquiring \|\| tareState.isZeroing} | INSPECIONADO NO CÓDIGO; UI pendente |
| C075 | src/features/baropodometry/BaropodometryPage.tsx:160 | button {status.acquiring ? ( <> <Square size={12} /> Pausar </> ) : ( <> <Play size={12} /> Iniciar </> )} | {handleAcquisitionToggle} | {actionBusy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C076 | src/features/baropodometry/BaropodometryPage.tsx:183 | button "Ajustes Avançados do Mapa (Resolução e Painel Flutuante)" | {() => setShowAdvancedSettings((v) => !v)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C077 | src/features/baropodometry/BaropodometryPage.tsx:244 | button {p.label} | {() => setMockPattern(p.id)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C078 | src/features/baropodometry/HeatmapSettingsPanel.tsx:45 | button {`Ajuda sobre ${title}`} | {(e) => { e.stopPropagation(); onToggle(id); }} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C079 | src/features/baropodometry/HeatmapSettingsPanel.tsx:158 | button "Fechar painel de ajustes" | {onClose} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C080 | src/features/baropodometry/HeatmapSettingsPanel.tsx:170 | button Automático | {() => handleModeChange("AUTO")} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C081 | src/features/baropodometry/HeatmapSettingsPanel.tsx:183 | button Manual | {() => handleModeChange("MANUAL")} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C082 | src/features/baropodometry/HeatmapSettingsPanel.tsx:205 | TooltipTrigger "Gamma Visual" | {handleTooltipToggle} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C083 | src/features/baropodometry/HeatmapSettingsPanel.tsx:217 | input "Gamma Visual" | {(e) => handleSliderChange({ gamma: parseFloat(e.target.value) })} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C084 | src/features/baropodometry/HeatmapSettingsPanel.tsx:234 | TooltipTrigger "Escala Máxima (VMAX)" | {handleTooltipToggle} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C085 | src/features/baropodometry/HeatmapSettingsPanel.tsx:246 | input "Escala Máxima VMAX" | {(e) => handleSliderChange({ vmax: parseInt(e.target.value, 10) })} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C086 | src/features/baropodometry/HeatmapSettingsPanel.tsx:263 | TooltipTrigger "Threshold (Limiar de Contato)" | {handleTooltipToggle} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C087 | src/features/baropodometry/HeatmapSettingsPanel.tsx:275 | input "Threshold de Contato" | {(e) => handleSliderChange({ threshold: parseInt(e.target.value, 10) })} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C088 | src/features/baropodometry/HeatmapSettingsPanel.tsx:292 | TooltipTrigger "Suavização / Bordas" | {handleTooltipToggle} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C089 | src/features/baropodometry/HeatmapSettingsPanel.tsx:304 | input "Suavização de Bordas" | {(e) => handleSliderChange({ smoothing: parseFloat(e.target.value) })} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C090 | src/features/baropodometry/HeatmapSettingsPanel.tsx:321 | TooltipTrigger "Atualização Visual (FPS)" | {handleTooltipToggle} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C091 | src/features/baropodometry/HeatmapSettingsPanel.tsx:333 | input "Atualização Visual FPS" | {(e) => handleSliderChange({ renderFps: parseInt(e.target.value, 10) })} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C092 | src/features/baropodometry/HeatmapSettingsPanel.tsx:350 | TooltipTrigger "Resolução da Superfície" | {handleTooltipToggle} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C093 | src/features/baropodometry/HeatmapSettingsPanel.tsx:364 | button {p.label} | {() => handleSliderChange({ resolution: p.value })} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C094 | src/features/baropodometry/HeatmapSettingsPanel.tsx:385 | TooltipTrigger "Marcador de CoP" | {handleTooltipToggle} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C095 | src/features/baropodometry/HeatmapSettingsPanel.tsx:393 | button {settings.showCop ? <Eye size={12} /> : <EyeOff size={12} />} {settings.showCop ? "Visível" : "Oculto"} | {() => handleSliderChange({ showCop: !settings.showCop })} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C096 | src/features/baropodometry/HeatmapSettingsPanel.tsx:411 | button Restaurar padrão | {handleReset} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C097 | src/features/baropodometry/HeatmapSettingsPanel.tsx:420 | button Concluir | {onClose} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C098 | src/features/baropodometry/MetricsPanel.tsx:165 | button "Informações sobre calibração" | {() => setShowInfo((v) => !v)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C099 | src/features/baropodometry/MetricsPanel.tsx:185 | button Fechar | {() => setShowInfo(false)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C100 | src/features/baropodometry/ParameterBar.tsx:41 | button {`Ajuda sobre ${title}`} | {(e) => { e.stopPropagation(); onToggle(id); }} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C101 | src/features/baropodometry/ParameterBar.tsx:134 | MiniTooltip "Threshold (Corte)" | {handleTooltipToggle} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C102 | src/features/baropodometry/ParameterBar.tsx:146 | input "Threshold" | {(e) => handleSliderChange({ threshold: parseInt(e.target.value, 10) }) } | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C103 | src/features/baropodometry/ParameterBar.tsx:165 | MiniTooltip "VMAX (Escala Máxima)" | {handleTooltipToggle} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C104 | src/features/baropodometry/ParameterBar.tsx:177 | input "VMAX" | {(e) => handleSliderChange({ vmax: parseInt(e.target.value, 10) }) } | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C105 | src/features/baropodometry/ParameterBar.tsx:196 | MiniTooltip "Gamma Visual" | {handleTooltipToggle} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C106 | src/features/baropodometry/ParameterBar.tsx:208 | input "Gamma" | {(e) => handleSliderChange({ gamma: parseFloat(e.target.value) }) } | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C107 | src/features/baropodometry/ParameterBar.tsx:227 | MiniTooltip "Suavização / Bordas" | {handleTooltipToggle} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C108 | src/features/baropodometry/ParameterBar.tsx:239 | input "Suavização" | {(e) => handleSliderChange({ smoothing: parseFloat(e.target.value) }) } | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C109 | src/features/baropodometry/ParameterBar.tsx:258 | MiniTooltip "Atualização Visual" | {handleTooltipToggle} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C110 | src/features/baropodometry/ParameterBar.tsx:270 | input "Atualização Visual" | {(e) => handleSliderChange({ renderFps: parseInt(e.target.value, 10) }) } | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C111 | src/features/baropodometry/ParameterBar.tsx:289 | MiniTooltip "Marcador de CoP" | {handleTooltipToggle} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C112 | src/features/baropodometry/ParameterBar.tsx:301 | button {settings.showCop ? "Visível" : "Oculto"} | {() => handleSliderChange({ showCop: !settings.showCop })} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C113 | src/features/baropodometry/ParameterBar.tsx:318 | button { settings.mode === "AUTO" ? "Modo Automático ativo (clique para fixar em Manual)" : "Modo Manual ativo (clique para ativar Automático)" } | {toggleMode} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C114 | src/features/baropodometry/ParameterBar.tsx:346 | button "Restaurar padrões de fábrica" | {handleReset} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C115 | src/features/comparison/ComparisonPage.tsx:112 | select "Paciente para comparação" | {(e) => setPatientId(Number(e.target.value))} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C116 | src/features/comparison/ComparisonPage.tsx:113 | input input | {() => { setIds((prev) => prev.includes(e.id) ? prev.filter((id) => id !== e.id) : [...prev, e.id]); setExams([]); }} | {busy \|\| (!ids.includes(e.id) && ids.length >= 4)} | INSPECIONADO NO CÓDIGO; UI pendente |
| C117 | src/features/comparison/ComparisonPage.tsx:115 | Button {busy ? "Carregando..." : `Comparar ${ids.length} exames`} | {compare} | {busy \|\| ids.length < 2} | INSPECIONADO NO CÓDIGO; UI pendente |
| C118 | src/features/comparison/ComparisonPage.tsx:118 | input input | {(e) => setCommonScale(e.target.checked)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C119 | src/features/exams/CancelExamDialog.tsx:39 | button Continuar exame | {onClose} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C120 | src/features/exams/CancelExamDialog.tsx:46 | button Cancelar exame | {onConfirm} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C121 | src/features/exams/ExamDetailsModal.tsx:135 | button "Fechar" | {onClose} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C122 | src/features/exams/ExamDetailsModal.tsx:318 | button "Emitir relatório em padrão A4, exportar PDF e imprimir" | {() => { if (exam?.id) { openReport(exam.id); onClose(); } }} | {!exam} | INSPECIONADO NO CÓDIGO; UI pendente |
| C123 | src/features/exams/ExamDetailsModal.tsx:333 | button Fechar | {onClose} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C124 | src/features/exams/ExamExportActions.tsx:38 | Button CSV da matriz média | {() => run('csv')} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C125 | src/features/exams/ExamExportActions.tsx:38 | Button Imagem PNG | {() => run('png')} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C126 | src/features/exams/ExamExportActions.tsx:38 | Button Dados processados JSON | {() => run('json')} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C127 | src/features/exams/ExamSettingsTab.tsx:36 | button {isStarting ? "Conectando..." : status.acquiring ? "Prévia ao vivo ativa" : "Ativar prévia ao vivo"} | {() => { void startPreview().catch(() => {}); }} | {isStarting \|\| status.acquiring} | INSPECIONADO NO CÓDIGO; UI pendente |
| C128 | src/features/exams/ExamSettingsTab.tsx:40 | button {tareState.isZeroing ? `Tara: ${tareState.zeroingProgress}%` : "Zerar tara"} | {startZeroing} | {!status.acquiring \|\| tareState.isZeroing \|\| isStarting} | INSPECIONADO NO CÓDIGO; UI pendente |
| C129 | src/features/exams/ExamSettingsTab.tsx:44 | button Tara {tareState.active ? "ativada" : "desativada"} | {toggleTareActive} | {tareState.isZeroing \|\| isStarting \|\| !tareState.baseline} | INSPECIONADO NO CÓDIGO; UI pendente |
| C130 | src/features/exams/ExamsPage.tsx:53 | button "Atualizar lista de exames" | {() => setRevision((r)=>r+1)} | {loading} | INSPECIONADO NO CÓDIGO; UI pendente |
| C131 | src/features/exams/ExamsPage.tsx:63 | button Novo Exame | {() => go("new-exam")} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C132 | src/features/exams/ExamsPage.tsx:79 | input "Pesquisar por paciente ou CPF..." | {(e) => setSearch(e.target.value)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C133 | src/features/exams/ExamsPage.tsx:130 | button Realizar Primeiro Exame | {() => go("new-exam")} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C134 | src/features/exams/ExamsPage.tsx:220 | button "Visualizar mapa de calor e resultados" | {() => setSelectedExamId(exam.id)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C135 | src/features/exams/ExamsPage.tsx:230 | button "Emitir relatório em PDF e impressão" | {() => openReport(exam.id)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C136 | src/features/exams/ExamsPage.tsx:240 | button "Comparar exames deste paciente" | {() => openComparison(exam.patientId)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C137 | src/features/exams/NewExamPage.tsx:73 | button Recarregar pacientes | {() => setPatientsRevision((r) => r + 1)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C138 | src/features/exams/NewExamPage.tsx:77 | button "Voltar para a lista de exames" | {() => { if (examStore.isSaving) return; if (examStore.step === "ACQUIRING" \|\| examStore.step === "PREPARING" \|\| examStore.isStarting) { examStore.openCancelModal(); } else { go("exams"); } }} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C139 | src/features/exams/NewExamPage.tsx:123 | button Tentar novamente | {() => { if (examStore.step === "RESULT") void examStore.saveExam().catch(() => {}); else if (examStore.selectedPatient) void examStore.startPreview().catch(() => {}); }} | {examStore.isSaving \|\| examStore.isStarting} | INSPECIONADO NO CÓDIGO; UI pendente |
| C140 | src/features/exams/NewExamPage.tsx:152 | input "Pesquisar por nome ou CPF..." | {(e) => setSearch(e.target.value)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C141 | src/features/exams/NewExamPage.tsx:196 | button Selecionar | Controle nativo ou delegação via componente; conferir contexto | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C142 | src/features/exams/NewExamPage.tsx:216 | button {label} | {() => setConfirmTab(id)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C143 | src/features/exams/NewExamPage.tsx:238 | button Trocar paciente | {examStore.clearPatient} | {examStore.isStarting} | INSPECIONADO NO CÓDIGO; UI pendente |
| C144 | src/features/exams/NewExamPage.tsx:285 | button {sec} s | {() => examStore.setDurationSeconds(sec)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C145 | src/features/exams/NewExamPage.tsx:303 | button Regular Gamma, VMAX e visualização antes do exame | {() => setConfirmTab("settings")} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C146 | src/features/exams/NewExamPage.tsx:311 | button Cancelar | {examStore.clearPatient} | {examStore.isStarting} | INSPECIONADO NO CÓDIGO; UI pendente |
| C147 | src/features/exams/NewExamPage.tsx:319 | button {examStore.isStarting ? "Conectando dispositivo..." : "Iniciar Exame"} | {examStore.startPreparation} | {examStore.isStarting \|\| acqStore.tareState.isZeroing} | INSPECIONADO NO CÓDIGO; UI pendente |
| C148 | src/features/exams/NewExamPage.tsx:379 | button Cancelar Exame | {examStore.openCancelModal} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C149 | src/features/exams/NewExamPage.tsx:386 | button Pular e Iniciar Agora | {examStore.startAcquisition} | {examStore.isStarting} | INSPECIONADO NO CÓDIGO; UI pendente |
| C150 | src/features/exams/NewExamPage.tsx:493 | button Cancelar Exame (Descartar Coleta) | {examStore.openCancelModal} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C151 | src/features/exams/NewExamPage.tsx:626 | button {examStore.isSaving ? "Salvando no banco..." : "Salvar Exame no Banco"} | {() => { void examStore.saveExam().catch(() => {}); }} | {examStore.isSaving} | INSPECIONADO NO CÓDIGO; UI pendente |
| C152 | src/features/exams/NewExamPage.tsx:636 | button Repetir Aquisição | {examStore.startPreparation} | {examStore.isSaving} | INSPECIONADO NO CÓDIGO; UI pendente |
| C153 | src/features/exams/NewExamPage.tsx:645 | button Descartar | {examStore.resetExam} | {examStore.isSaving} | INSPECIONADO NO CÓDIGO; UI pendente |
| C154 | src/features/exams/NewExamPage.tsx:700 | button Visualizar Exame Salvo | {() => setInspectModalOpen(true)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C155 | src/features/exams/NewExamPage.tsx:708 | button Novo Exame | {examStore.resetExam} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C156 | src/features/exams/NewExamPage.tsx:715 | button Lista de Exames | {() => go("exams")} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C157 | src/features/logs/LogsPage.tsx:31 | select "Nível dos logs" | {(e) => setLevel(e.target.value)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C158 | src/features/logs/LogsPage.tsx:31 | Button Atualizar | {() => setRevision((r) => r + 1)} | {loading} | INSPECIONADO NO CÓDIGO; UI pendente |
| C159 | src/features/logs/LogsPage.tsx:31 | Button Exportar eventos exibidos | {() => downloadTextFile(JSON.stringify(logs, null, 2), 'BAROPRESS_logs.json')} | {!logs.length \|\| loading} | INSPECIONADO NO CÓDIGO; UI pendente |
| C160 | src/features/logs/LogsPage.tsx:31 | summary Aquisição nesta sessão ( {acquisition.length} ) | Controle nativo ou delegação via componente; conferir contexto | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C161 | src/features/patients/PatientCareHistory.tsx:26 | summary Consultas ( {appointments.length} ) | Controle nativo ou delegação via componente; conferir contexto | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C162 | src/features/patients/PatientDetails.tsx:122 | Button Voltar para a lista | {onBack} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C163 | src/features/patients/PatientDetails.tsx:137 | button Voltar para lista de pacientes | {onBack} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C164 | src/features/patients/PatientDetails.tsx:147 | Button Editar cadastro | {() => onEdit(patient.id)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C165 | src/features/patients/PatientDetails.tsx:156 | Button Arquivar paciente | {() => setConfirmArchive(true)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C166 | src/features/patients/PatientDetails.tsx:378 | Button Comparar e ver evolução | {() => openComparison(patientId)} | {exams.filter((e) => e.status === "completed").length < 2} | INSPECIONADO NO CÓDIGO; UI pendente |
| C167 | src/features/patients/PatientDetails.tsx:448 | button Visualizar | {() => setSelectedExamId(exam.id)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C168 | src/features/patients/PatientDetails.tsx:496 | Button Cancelar | {() => setConfirmArchive(false)} | {archiving} | INSPECIONADO NO CÓDIGO; UI pendente |
| C169 | src/features/patients/PatientDetails.tsx:503 | Button {archiving ? "Arquivando…" : "Arquivar"} | {handleArchiveConfirm} | {archiving} | INSPECIONADO NO CÓDIGO; UI pendente |
| C170 | src/features/patients/PatientForm.tsx:145 | button "Voltar para a lista" | {onCancel} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C171 | src/features/patients/PatientForm.tsx:166 | Button Cancelar | {onCancel} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C172 | src/features/patients/PatientForm.tsx:169 | Button {busy ? "Salvando…" : isEditing ? "Salvar alterações" : "Salvar paciente"} | {handleSubmit} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C173 | src/features/patients/PatientForm.tsx:208 | input "Ex: João Silva de Alencar" | {(e) => { setName(e.target.value); if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: "" })); }} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C174 | src/features/patients/PatientForm.tsx:233 | input "Opcional" | {(e) => setSocialName(e.target.value)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C175 | src/features/patients/PatientForm.tsx:248 | input "patient-birth" | {(e) => setBirthDate(e.target.value)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C176 | src/features/patients/PatientForm.tsx:261 | select Selecione… Masculino Feminino Outro Não informado | {(e) => setSex(e.target.value)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C177 | src/features/patients/PatientForm.tsx:290 | input "000.000.000-00" | {handleCpfChange} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C178 | src/features/patients/PatientForm.tsx:313 | input "(00) 00000-0000" | {handlePhoneChange} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C179 | src/features/patients/PatientForm.tsx:328 | input "paciente@exemplo.com" | {(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: "" })); }} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C180 | src/features/patients/PatientForm.tsx:364 | input "Ex: 175" | {(e) => { setHeight(e.target.value); if (fieldErrors.height) setFieldErrors((p) => ({ ...p, height: "" })); }} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C181 | src/features/patients/PatientForm.tsx:391 | input "Ex: 72.5" | {(e) => { setWeight(e.target.value); if (fieldErrors.weight) setFieldErrors((p) => ({ ...p, weight: "" })); }} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C182 | src/features/patients/PatientForm.tsx:418 | input "Ex: 40" | {(e) => { setShoeSize(e.target.value); if (fieldErrors.shoeSize) setFieldErrors((p) => ({ ...p, shoeSize: "" })); }} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C183 | src/features/patients/PatientForm.tsx:445 | input "Ex: Professor" | {(e) => setProfession(e.target.value)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C184 | src/features/patients/PatientForm.tsx:468 | input "Rua, número, complemento, bairro, cidade - UF" | {(e) => setAddress(e.target.value)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C185 | src/features/patients/PatientForm.tsx:482 | textarea "Anotações sobre queixas de dor, calosidades, cirurgias prévias ou objetivos da avaliação baropodométrica…" | {(e) => setObservations(e.target.value)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C186 | src/features/patients/PatientForm.tsx:496 | Button Cancelar | {onCancel} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C187 | src/features/patients/PatientForm.tsx:499 | Button {busy ? "Salvando…" : isEditing ? "Salvar alterações" : "Cadastrar paciente"} | Controle nativo ou delegação via componente; conferir contexto | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C188 | src/features/patients/PatientList.tsx:46 | input "Buscar por nome, CPF ou telefone…" | {(e) => onSearchChange(e.target.value)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C189 | src/features/patients/PatientList.tsx:55 | button "Limpar busca" | {() => onSearchChange("")} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C190 | src/features/patients/PatientList.tsx:67 | Button Novo paciente | {onNewPatient} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C191 | src/features/patients/PatientList.tsx:86 | Button Tentar novamente | {onRetry} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C192 | src/features/patients/PatientList.tsx:129 | Button Cadastrar paciente | {onNewPatient} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C193 | src/features/patients/PatientList.tsx:148 | Button Limpar busca | {() => onSearchChange("")} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C194 | src/features/patients/PatientList.tsx:236 | button {`Visualizar paciente ${p.name}`} | {() => onSelectPatient(p.id)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C195 | src/features/patients/PatientList.tsx:246 | button {`Editar paciente ${p.name}`} | {() => onEditPatient(p.id)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C196 | src/features/patients/PatientsPage.tsx:98 | button "Fechar notificação" | {() => setNotification(null)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C197 | src/features/questionnaires/QuestionnaireHistory.tsx:7 | summary {s.questionnaire.name} · {formatDateTime(s.answeredAt)} | Controle nativo ou delegação via componente; conferir contexto | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C198 | src/features/questionnaires/QuestionnairesPage.tsx:102 | Button Novo modelo | {() => { setEditor({ id: null, name: '', description: '', active: true, questions: [blankQuestion()] }); setError(''); setMessage(''); }} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C199 | src/features/questionnaires/QuestionnairesPage.tsx:105 | Field "Nome do questionário" | {(e) => setEditor({ ...editor, name: e.target.value })} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C200 | src/features/questionnaires/QuestionnairesPage.tsx:105 | Field "Descrição" | {(e) => setEditor({ ...editor, description: e.target.value })} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C201 | src/features/questionnaires/QuestionnairesPage.tsx:105 | input input | {(e) => setEditor({ ...editor, active: e.target.checked })} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C202 | src/features/questionnaires/QuestionnairesPage.tsx:106 | input input | {(e) => updateQuestion(index, { groupName: e.target.value })} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C203 | src/features/questionnaires/QuestionnairesPage.tsx:106 | select {Object.entries(questionTypes).map(([id, label]) => <option key={id} value={id}>{label}</option>)} | {(e) => updateQuestion(index, { type: e.target.value as Question['type'] })} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C204 | src/features/questionnaires/QuestionnairesPage.tsx:106 | input input | {(e) => updateQuestion(index, { question: e.target.value })} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C205 | src/features/questionnaires/QuestionnairesPage.tsx:107 | textarea textarea | {(e) => updateQuestion(index, { options: e.target.value.split('\n') })} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C206 | src/features/questionnaires/QuestionnairesPage.tsx:108 | input input | {(e) => updateQuestion(index, { required: e.target.checked })} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C207 | src/features/questionnaires/QuestionnairesPage.tsx:108 | input input | {(e) => updateQuestion(index, { active: e.target.checked })} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C208 | src/features/questionnaires/QuestionnairesPage.tsx:108 | Button Remover do modelo | {() => setEditor({ ...editor, questions: editor.questions.filter((_, i) => i !== index) })} | {busy \|\| editor.questions.length <= 1} | INSPECIONADO NO CÓDIGO; UI pendente |
| C209 | src/features/questionnaires/QuestionnairesPage.tsx:109 | Button Adicionar pergunta | {() => setEditor({ ...editor, questions: [...editor.questions, blankQuestion()] })} | {busy \|\| editor.questions.length >= 200} | INSPECIONADO NO CÓDIGO; UI pendente |
| C210 | src/features/questionnaires/QuestionnairesPage.tsx:109 | Button Cancelar | {() => setEditor(null)} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C211 | src/features/questionnaires/QuestionnairesPage.tsx:109 | Button {busy ? 'Salvando...' : 'Salvar modelo'} | Controle nativo ou delegação via componente; conferir contexto | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C212 | src/features/questionnaires/QuestionnairesPage.tsx:111 | Button Editar | {() => { setEditor(structuredClone(q)); setError(''); setMessage(''); }} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C213 | src/features/questionnaires/QuestionnairesPage.tsx:111 | Button Responder | {() => { setSelected(q); setAnswers({}); setError(''); setMessage(''); }} | {!q.active \|\| busy \|\| !q.questions.some((p) => p.active)} | INSPECIONADO NO CÓDIGO; UI pendente |
| C214 | src/features/questionnaires/QuestionnairesPage.tsx:112 | select "Paciente do questionário" | {(e) => { setPatientId(Number(e.target.value)); setMessage(''); }} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C215 | src/features/questionnaires/QuestionnairesPage.tsx:118 | textarea {`answer-${id}`} | {(e) => setAnswers({ ...answers, [id]: e.target.value })} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C216 | src/features/questionnaires/QuestionnairesPage.tsx:118 | input {`answer-${id}`} | {(e) => setAnswers({ ...answers, [id]: e.target.value === '' ? null : Number(e.target.value) })} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C217 | src/features/questionnaires/QuestionnairesPage.tsx:118 | select Selecione {q.type === 'yesno' ? <><option value="true">Sim</option><option value="false">Não</option></> : q.options.map((o) => <option key={o} value={o}>{o}</option>)} | {(e) => setAnswers({ ...answers, [id]: e.target.value === '' ? null : q.type === 'yesno' ? e.target.value === 'true' : e.target.value })} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C218 | src/features/questionnaires/QuestionnairesPage.tsx:118 | input input | {() => { const prev = Array.isArray(value) ? value : []; setAnswers({ ...answers, [id]: prev.includes(o) ? prev.filter((v) => v !== o) : [...prev, o] }); }} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C219 | src/features/questionnaires/QuestionnairesPage.tsx:120 | Button Cancelar | {() => setSelected(null)} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |
| C220 | src/features/questionnaires/QuestionnairesPage.tsx:120 | Button {busy ? 'Salvando...' : 'Salvar respostas'} | Controle nativo ou delegação via componente; conferir contexto | {busy \|\| !patientId} | INSPECIONADO NO CÓDIGO; UI pendente |
| C221 | src/features/reports/ReportsPage.tsx:112 | button "Atualizar lista de exames" | {() => fetchExams(search)} | {loading} | INSPECIONADO NO CÓDIGO; UI pendente |
| C222 | src/features/reports/ReportsPage.tsx:133 | input "Pesquisar por paciente ou CPF..." | {(e) => setSearch(e.target.value)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C223 | src/features/reports/ReportsPage.tsx:243 | button Visualizar relatório | {() => handleSelectExam(item.id)} | {loadingExam} | INSPECIONADO NO CÓDIGO; UI pendente |
| C224 | src/features/reports/ReportViewer.tsx:97 | button "Voltar para a listagem" | {onBack} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C225 | src/features/reports/ReportViewer.tsx:131 | button "Imprimir documento formatado A4" | {handlePrint} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C226 | src/features/reports/ReportViewer.tsx:141 | button "Exportar documento como arquivo PDF vetorial" | {handleExportPdf} | {exporting} | INSPECIONADO NO CÓDIGO; UI pendente |
| C227 | src/features/reports/ReportViewer.tsx:461 | textarea "Observações adicionais do relatório" | {(e) => setObservations(e.target.value)} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C228 | src/pages/Settings.tsx:18 | Button Alternar tema | {toggleTheme} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C229 | src/pages/Settings.tsx:18 | Field "Duração padrão do exame (segundos)" | {(e) => prefs.setDuration(Number(e.target.value))} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C230 | src/pages/Settings.tsx:18 | select Simulação ESP32 Serial / Bluetooth SPP | {(e) => acq.setDeviceType(e.target.value as 'MOCK' \| 'SERIAL')} | {acq.status.connected} | INSPECIONADO NO CÓDIGO; UI pendente |
| C231 | src/pages/Settings.tsx:18 | Field "Porta serial" | {(e) => acq.setSelectedPort(e.target.value)} | {acq.status.connected} | INSPECIONADO NO CÓDIGO; UI pendente |
| C232 | src/pages/Settings.tsx:18 | select {[9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600].map((v) => <option key={v}>{v}</option>)} | {(e) => acq.setSelectedBaud(Number(e.target.value))} | {acq.status.connected} | INSPECIONADO NO CÓDIGO; UI pendente |
| C233 | src/pages/Settings.tsx:18 | Button Gerenciar conexão | {() => go('acquisition')} | Sem disabled declarado | INSPECIONADO NO CÓDIGO; UI pendente |
| C234 | src/pages/Settings.tsx:18 | Button {busy ? 'Salvando...' : 'Salvar configurações agora'} | {async () => { setBusy(true); setMessage(''); try { await saveCurrentPreferences(); await api.logs.add('settings', 'Configurações salvas.'); setMessage('Configurações salvas no banco local.'); } catch (e) { usePreferencesStore.setState({ error: (e as Error).message }); } finally { setBusy(false); } }} | {busy} | INSPECIONADO NO CÓDIGO; UI pendente |

## Comandos e fronteira de autenticação

Todos os comandos da aplicação passam por auth::authorize no invoke_handler. APIs core/plugin do Tauri usam o ACL próprio. Apenas has_users, register_first, login, recover, current e logout são públicos; registro inicial verifica que não há contas. Backups e cadastro de equipe exigem administrador.

- acquisition_list_ports — src-tauri/src/acquisition.rs
- acquisition_connect — src-tauri/src/acquisition.rs
- acquisition_disconnect — src-tauri/src/acquisition.rs
- acquisition_start — src-tauri/src/acquisition.rs
- acquisition_stop — src-tauri/src/acquisition.rs
- acquisition_get_status — src-tauri/src/acquisition.rs
- acquisition_poll_frames — src-tauri/src/acquisition.rs
- appointments_list — src-tauri/src/agenda.rs
- appointments_save — src-tauri/src/agenda.rs
- appointments_delete — src-tauri/src/agenda.rs
- professionals_list — src-tauri/src/agenda.rs
- professionals_create — src-tauri/src/agenda.rs
- auth_has_users — src-tauri/src/auth.rs
- auth_register_first — src-tauri/src/auth.rs
- auth_register_user — src-tauri/src/auth.rs
- auth_login — src-tauri/src/auth.rs
- auth_current — src-tauri/src/auth.rs
- auth_logout — src-tauri/src/auth.rs
- auth_provision_recovery — src-tauri/src/auth.rs
- auth_change_password — src-tauri/src/auth.rs
- auth_recover — src-tauri/src/auth.rs
- backups_export — src-tauri/src/backup.rs
- backups_preview — src-tauri/src/backup.rs
- backups_import — src-tauri/src/backup.rs
- exams_list — src-tauri/src/exams.rs
- exams_get — src-tauri/src/exams.rs
- exams_create — src-tauri/src/exams.rs
- exams_delete — src-tauri/src/exams.rs
- dashboard_stats — src-tauri/src/lib.rs
- patients_list — src-tauri/src/patients.rs
- patients_get — src-tauri/src/patients.rs
- patients_create — src-tauri/src/patients.rs
- patients_update — src-tauri/src/patients.rs
- patients_archive — src-tauri/src/patients.rs
- patients_exam_history — src-tauri/src/patients.rs
- questionnaires_list — src-tauri/src/questionnaires.rs
- questionnaires_save — src-tauri/src/questionnaires.rs
- questionnaires_answer — src-tauri/src/questionnaires.rs
- questionnaires_history — src-tauri/src/questionnaires.rs
- app_settings_get — src-tauri/src/support.rs
- app_settings_save — src-tauri/src/support.rs
- system_logs_add — src-tauri/src/support.rs
- system_logs_list — src-tauri/src/support.rs

## Navegação encontrada na sidebar

- Dashboard (dashboard)
- Pacientes (patients)
- Aquisição (acquisition)
- Análise (baropodometry)
- Agenda (agenda)
- Exames (exams)
- Novo exame (new-exam)
- Comparação (comparison)
- Relatórios (reports)
- Questionários (questionnaires)
- Backup (backup)
- Logs (logs)
- Configurações (settings)

Ver AUDITORIA_FINAL.md para telas indiretas, estados, testes, evidências e pendências.
