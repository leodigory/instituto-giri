# 📋 TODO - MÓDULO DE GESTÃO DO INSTITUTO

## 🎯 CONTEXTO DO PROJETO EXISTENTE

O aplicativo é um Web App/PWA Mobile-First hospedado no Netlify com backend em Firebase (Auth, Firestore/RTDB). As funcionalidades primárias (Estoque, Venda, Loja, Histórico) e a gestão de Roles (Admin, Gerente, Voluntário, Usuário) na aba Conta já estão operacionais. O objetivo é implementar um módulo robusto de Gestão sem perturbar o sistema existente.

## 🏗️ REQUISITO CENTRAL DE ARQUITETURA

O sistema deve implementar uma **troca de contexto de navegação**. Ao invés de uma rota secundária, o clique em um botão na aba Conta deve substituir visualmente a Nav Bar principal pela Nav Bar de Gestão.

---

## 📦 MÓDULO 1: NAVEGAÇÃO E CONTROLE DE ACESSO (RBAC)

### Botão de Alternância (Na Aba Conta)

- [ ] Adicionar um botão **"Entrar em Gestão do Instituto"** na aba Conta
- [ ] **Visibilidade**: Apenas Admin e Gerente
- [ ] **Ação**: Ao clicar, alterna o estado da aplicação para Modo Gestão, substituindo a Nav Bar Padrão pela Nav Bar de Gestão

### Nav Bar de Gestão (Rotas e Permissões)

Implementar a nova Nav Bar com as seguintes abas/rotas:

- [ ] **Voltar** (Admin, Gerente): Restaura a Nav Bar e o estado anterior
- [ ] **Agenda & Alertas** (Admin, Gerente)
- [ ] **Reuniões** (Admin, Gerente, Voluntário)
- [ ] **Relatórios** (Admin, Gerente)
- [ ] **Configurações** (Apenas Admin)

---

## 🏢 MÓDULO 2: GESTÃO DE REUNIÕES AVANÇADA (SALA DE REUNIÃO)

Desenvolver a página **Sala de Reunião** (acessível via `/reunioes/:id/sala`) utilizando o **Firebase Realtime Database** para interações instantâneas.

### 2.1 Quórum e Início

- [ ] Início da reunião condicionado à **Presença Mínima de 50%** dos convidados
- [ ] Admin pode ignorar, mas o sistema deve registrar a quebra de quórum no Log
- [ ] **Armazenamento**: Log Detalhado (`Reuniao_X_HistoricoDetalhado`) registra o resultado da verificação

### 2.2 Presença em Tempo Real

- [ ] Todos os presentes clicam em **"Marcar Presença"** para registro de timestamp
- [ ] **Armazenamento**: `timestamp_entrada` e `Role` registrados na coleção da reunião

### 2.3 Gestão e Aprovação de Pauta

- [ ] Admin/Gerente inicia a pauta (**"No Ar"**)
- [ ] **Votação de Aprovação** (Sim/Não) obrigatória de todos os presentes para iniciar a discussão
- [ ] Pautas podem ser pré-cadastradas ou adicionadas **Em Tempo Real** (Pauta Rápida)
- [ ] **Armazenamento**: Pautas salvas no Firebase

### 2.4 Discussão (Opiniões)

- [ ] Campo de texto liberado para todos os presentes enviarem opiniões em tempo real enquanto a pauta está "No Ar"
- [ ] **Armazenamento**: Opiniões salvas instantaneamente em `Reuniao_X_Opinioes` com timestamp, nome e role

### 2.5 Votação de Decisão

- [ ] Opções de voto final: **Sim, Não, Abstenção**
- [ ] Resultados exibidos em gráficos simples e atualizados em tempo real
- [ ] **Armazenamento**: Votos salvos em `Reuniao_X_Votacao` e logados no Histórico Detalhado

### 2.6 Finalização da Pauta

- [ ] Admin/Gerente registra a decisão na Ata
- [ ] Opção de marcar **"Pauta Adiada"** (move a pauta para o banco de pautas sem data)
- [ ] **Armazenamento**: Registro obrigatório na Ata do Firebase

### 2.7 Finalização da Sessão

- [ ] Votação de encerramento da sessão pelos presentes
- [ ] Admin finaliza o Log Detalhado
- [ ] **Armazenamento**: Encerra o `timestamp_final` da reunião e move para o Historico

---

## 📊 MÓDULO 3: FERRAMENTA DE DADOS INTEGRADA E EXPORTAÇÃO

### A. Ferramenta de Busca em Reunião (Admin/Gerente)

- [ ] Implementar um campo de **Pesquisa Universal** na Sala de Reunião
- [ ] Consultas otimizadas no Firebase (Vendas, Estoque, Agenda)
- [ ] **Filtros rápidos**: Vendas, Estoque, Agenda
- [ ] Filtros por: data/hora, produto, role ou evento
- [ ] Modal de resultados com botão **"Citar na Ata"**
- [ ] Inserir a informação buscada no Log Detalhado da pauta que está "no ar"

### B. Relatórios (Na Rota /gestao/relatorios)

#### Relatório Detalhado

- [ ] Geração de um relatório textual em prosa
- [ ] Narrar o passo a passo completo da reunião
- [ ] Usar o Log Detalhado (quórum, nome do Admin, opiniões, votos, dados citados)

#### Exportação

- [ ] Implementar funcionalidade **Exportar para Sheets/CSV**
- [ ] Exportar Relatório Detalhado
- [ ] Exportar Relatório de Decisões

#### KPIs

- [ ] Exibir métricas de **Engajamento** (Presença por Role)
- [ ] Exibir métricas **Financeiras** (Vendas/Estoque)

---

## 📅 MÓDULO 4: COMUNICAÇÃO E INTEGRAÇÃO GOOGLE CALENDAR

### Notificações Segmentadas

- [ ] Lógica de Pop-up deve filtrar eventos da coleção `Agenda`
- [ ] Filtrar onde o Role do usuário (Admin, Gerente, Voluntário, Usuário) está no array `publico_alvo`
- [ ] **Mensagens Individuais** enviadas apenas pelo Admin

### Integração Google Calendar (OAuth)

#### Permissão

- [ ] Solicitar permissão de acesso ao Google Calendar via OAuth
- [ ] Solicitar no primeiro acesso à área de Gestão

#### Automação

- [ ] Eventos criados automaticamente no calendário do Google do usuário
- [ ] Criar somente se o seu Role for um `publico_alvo`
- [ ] **Alerta Fixo**: Configurar automaticamente um lembrete (reminder) de **1 hora de antecedência**
- [ ] Configurar para todos os eventos criados via API

---

## 🗂️ ESTRUTURA DE DADOS FIREBASE

### Collections Firestore

```
gestao/
├── agenda/
│   ├── {eventoId}/
│   │   ├── titulo
│   │   ├── descricao
│   │   ├── data_hora
│   │   ├── publico_alvo: [roles]
│   │   ├── criado_por
│   │   └── timestamp
│
├── reunioes/
│   ├── {reuniaoId}/
│   │   ├── titulo
│   │   ├── data_hora
│   │   ├── convidados: [userIds]
│   │   ├── presentes: [userIds]
│   │   ├── quorum_minimo
│   │   ├── status: "agendada" | "em_andamento" | "finalizada"
│   │   ├── pautas: []
│   │   └── ata
│
└── relatorios/
    ├── {relatorioId}/
    │   ├── reuniao_id
    │   ├── tipo: "detalhado" | "decisoes"
    │   ├── conteudo
    │   ├── kpis
    │   └── timestamp
```

### Realtime Database (Sala de Reunião)

```
reunioes_realtime/
├── {reuniaoId}/
│   ├── presenca/
│   │   └── {userId}: { timestamp, role, nome }
│   │
│   ├── pautas/
│   │   └── {pautaId}/
│   │       ├── titulo
│   │       ├── status: "aguardando" | "no_ar" | "finalizada" | "adiada"
│   │       ├── votacao_aprovacao/
│   │       │   └── {userId}: "sim" | "nao"
│   │       ├── opinioes/
│   │       │   └── {opiniao_id}: { userId, texto, timestamp, role }
│   │       ├── votacao_decisao/
│   │       │   └── {userId}: "sim" | "nao" | "abstencao"
│   │       └── decisao_final
│   │
│   └── log_detalhado/
│       └── {timestamp}: { acao, usuario, dados }
```

---

## 🎨 COMPONENTES A CRIAR

### Navegação

- [ ] `GestaoNavBar.js` - Nav Bar de Gestão
- [ ] `GestaoContext.js` - Context para controle de estado do modo gestão
- [ ] `GestaoToggleButton.js` - Botão de alternância na aba Conta

### Agenda & Alertas

- [ ] `AgendaView.js` - Visualização de eventos
- [ ] `EventoForm.js` - Formulário de criação/edição de eventos
- [ ] `AlertasPopup.js` - Pop-up de notificações segmentadas

### Reuniões

- [ ] `ReunioesLista.js` - Lista de reuniões
- [ ] `ReuniaoForm.js` - Formulário de criação de reunião
- [ ] `SalaReuniao.js` - Sala de reunião em tempo real
- [ ] `QuorumCheck.js` - Verificação de quórum
- [ ] `PresencaMarker.js` - Marcação de presença
- [ ] `PautaManager.js` - Gestão de pautas
- [ ] `VotacaoAprovacao.js` - Votação de aprovação de pauta
- [ ] `DiscussaoOpinioes.js` - Campo de opiniões em tempo real
- [ ] `VotacaoDecisao.js` - Votação final da pauta
- [ ] `AtaEditor.js` - Editor de ata

### Ferramentas

- [ ] `BuscaUniversal.js` - Busca integrada de dados
- [ ] `CitarNaAta.js` - Botão para citar dados na ata

### Relatórios

- [ ] `RelatoriosView.js` - Visualização de relatórios
- [ ] `RelatorioDetalhado.js` - Relatório em prosa
- [ ] `RelatorioDecisoes.js` - Relatório de decisões
- [ ] `ExportarCSV.js` - Exportação para CSV
- [ ] `ExportarSheets.js` - Exportação para Google Sheets
- [ ] `KPIsPanel.js` - Painel de KPIs

### Configurações

- [ ] `ConfiguracoesGestao.js` - Configurações do módulo de gestão
- [ ] `GoogleCalendarAuth.js` - Autenticação OAuth Google Calendar
- [ ] `GoogleCalendarSync.js` - Sincronização automática de eventos

---

## 🔧 SERVIÇOS FIREBASE A CRIAR

### Firestore Services

- [ ] `agendaService.js` - CRUD de eventos da agenda
- [ ] `reunioesService.js` - CRUD de reuniões
- [ ] `relatoriosService.js` - Geração e armazenamento de relatórios

### Realtime Database Services

- [ ] `salaReuniaoService.js` - Operações em tempo real da sala
- [ ] `presencaService.js` - Gestão de presença
- [ ] `pautasRealtimeService.js` - Gestão de pautas em tempo real
- [ ] `votacaoService.js` - Sistema de votação
- [ ] `opinioesService.js` - Sistema de opiniões
- [ ] `logDetalhadoService.js` - Registro de log detalhado

### Integração Externa

- [ ] `googleCalendarService.js` - Integração com Google Calendar API
- [ ] `exportService.js` - Exportação para CSV/Sheets

---

## 📝 ROTAS A ADICIONAR

```javascript
// Modo Gestão
/gestao/agenda           // Agenda & Alertas (Admin, Gerente)
/gestao/reunioes         // Lista de Reuniões (Admin, Gerente, Voluntário)
/gestao/reunioes/:id     // Detalhes da Reunião
/gestao/reunioes/:id/sala // Sala de Reunião (Tempo Real)
/gestao/relatorios       // Relatórios (Admin, Gerente)
/gestao/configuracoes    // Configurações (Admin)
```

---

## 🔐 PERMISSÕES POR MÓDULO

| Funcionalidade | Admin | Gerente | Voluntário | User |
|---|---|---|---|---|
| **Entrar em Gestão** | ✅ | ✅ | ❌ | ❌ |
| **Agenda & Alertas** | ✅ | ✅ | ❌ | ❌ |
| **Criar Reunião** | ✅ | ✅ | ❌ | ❌ |
| **Participar Reunião** | ✅ | ✅ | ✅ | ❌ |
| **Iniciar Pauta** | ✅ | ✅ | ❌ | ❌ |
| **Opinar em Pauta** | ✅ | ✅ | ✅ | ❌ |
| **Votar** | ✅ | ✅ | ✅ | ❌ |
| **Busca Universal** | ✅ | ✅ | ❌ | ❌ |
| **Relatórios** | ✅ | ✅ | ❌ | ❌ |
| **Exportar Dados** | ✅ | ✅ | ❌ | ❌ |
| **Configurações** | ✅ | ❌ | ❌ | ❌ |

---

## 🚀 ORDEM DE IMPLEMENTAÇÃO SUGERIDA

### Fase 1: Infraestrutura Base
1. [ ] Criar `GestaoContext.js` para controle de estado
2. [ ] Implementar `GestaoNavBar.js`
3. [ ] Adicionar botão de alternância na aba Conta
4. [ ] Configurar rotas do módulo de gestão

### Fase 2: Agenda & Alertas
5. [ ] Criar serviço `agendaService.js`
6. [ ] Implementar `AgendaView.js`
7. [ ] Criar `EventoForm.js`
8. [ ] Implementar `AlertasPopup.js` com filtro por role

### Fase 3: Reuniões Básicas
9. [ ] Criar serviço `reunioesService.js`
10. [ ] Implementar `ReunioesLista.js`
11. [ ] Criar `ReuniaoForm.js`

### Fase 4: Sala de Reunião (Tempo Real)
12. [ ] Configurar Firebase Realtime Database
13. [ ] Criar `salaReuniaoService.js`
14. [ ] Implementar `SalaReuniao.js`
15. [ ] Criar `QuorumCheck.js`
16. [ ] Implementar `PresencaMarker.js`
17. [ ] Criar `PautaManager.js`
18. [ ] Implementar sistema de votação
19. [ ] Criar sistema de opiniões em tempo real
20. [ ] Implementar `AtaEditor.js`

### Fase 5: Ferramentas e Relatórios
21. [ ] Criar `BuscaUniversal.js`
22. [ ] Implementar `CitarNaAta.js`
23. [ ] Criar `relatoriosService.js`
24. [ ] Implementar `RelatorioDetalhado.js`
25. [ ] Criar sistema de exportação (CSV/Sheets)
26. [ ] Implementar `KPIsPanel.js`

### Fase 6: Integração Google Calendar
27. [ ] Configurar OAuth Google Calendar
28. [ ] Criar `googleCalendarService.js`
29. [ ] Implementar sincronização automática
30. [ ] Configurar lembretes automáticos

### Fase 7: Configurações e Ajustes Finais
31. [ ] Criar `ConfiguracoesGestao.js`
32. [ ] Testes de integração
33. [ ] Ajustes de UX/UI
34. [ ] Documentação final

---

## 📚 INSTRUÇÕES PARA IMPLEMENTAÇÃO

**Instrução para o Amazon Q**:

"Gere o código modular necessário (componentes, serviços Firebase, e lógica de estado/contexto para a Nav Bar) para implementar os módulos de Gestão, focando no Firebase Realtime para a Sala de Reunião e nas rotinas de auditoria (Log Detalhado e Exportação para CSV/Sheets)."

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

1. **Não perturbar o sistema existente**: Todos os novos componentes devem ser isolados no contexto de Gestão
2. **Mobile-First**: Todos os componentes devem ser responsivos e otimizados para mobile
3. **Tempo Real**: Usar Firebase Realtime Database para interações instantâneas na Sala de Reunião
4. **Auditoria**: Todos os logs devem ser detalhados e exportáveis
5. **Segurança**: Validar permissões em todas as operações
6. **Performance**: Otimizar queries do Firebase para evitar leituras desnecessárias

---

**Status**: 🔴 Não Iniciado
**Prioridade**: 🔥 Alta
**Desenvolvedor**: Leonardo Araújo (leodigory)
