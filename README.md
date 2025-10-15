# 🏪 Sistema Instituto Giri - Gestão Completa de Vendas

> 💡 Sistema completo de vendas integrado ao Firebase com fluxo linear e inquebrável, e-commerce com Giri Gold, sistema de permissões por role e gamificação.

[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/leodigory/instituto-giri)

---

## 📋 Índice

- [Funcionalidades Principais](#-funcionalidades-principais)
- [Sistema de Vendas](#-sistema-de-vendas)
- [E-commerce Giri Gold](#-e-commerce-giri-gold)
- [Sistema de Permissões](#-sistema-de-permissões)
- [Dashboard e Gamificação](#-dashboard-e-gamificação)
- [Tecnologias](#-tecnologias)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Desenvolvedor](#-desenvolvedor)

---

## ✨ Funcionalidades Principais

### 🎯 Sistema Completo
- ✅ **Vendas** com fluxo linear inquebrável
- ✅ **E-commerce** com Giri Gold (moeda virtual)
- ✅ **Dashboard** com métricas e gamificação
- ✅ **Gestão de Estoque** em tempo real
- ✅ **Histórico de Vendas** com QR Code
- ✅ **Sistema de Permissões** por role (Admin, Gerente, Voluntário, User)
- ✅ **Promoções Automáticas** com critérios avançados
- ✅ **Aprovação de Usuários** com status (pending/approved/denied)

---

## 🛒 Sistema de Vendas

### Fluxo Linear e Inquebrável

```
Cliente → Itens → Resumo → Doação → Pagamento → QRCode → Histórico
```

### 1️⃣ Identificação do Cliente
- Input com **autocomplete inteligente** (a partir do 3º caractere)
- Dados vindos do Firebase → `/Clientes`
- Opção **Cadastrar Novo Cliente** se não existir
- ☎️ Telefone opcional

### 2️⃣ Seleção de Itens
- Busca por **nome** ou **ID** com autocomplete
- ⚠️ **Validação de estoque em tempo real**
- Exibe: Nome, Preço Unitário, Quantidade Disponível

### 3️⃣ Resumo Parcial
- Lista completa dos itens com subtotais
- 💵 **Total acumulado** em tempo real

### 4️⃣ Doação (Opcional)
- Input manual de valor
- Botão **"Adicionar todo o valor pago"** → converte troco em doação
- Valor deduzido do troco

### 5️⃣ Pagamento
- Campo obrigatório: **Valor Pago** (≥ Valor da Compra)
- Cálculo automático: `Troco = Valor Pago – (Total + Doação)`

### 6️⃣ Finalizar Venda
- Registro no Firebase: `/Vendas/{ano}/{mes}/{dia}/{idVenda}`
- **Gera QRCode único** para rastreamento
- Status inicial: **Pendente**

### 📜 Histórico
- Listagem com filtros (data, cliente, vendedor)
- Ações: Marcar como Entregue, Processar Devolução
- Scanner QR Code integrado
- Atualização em tempo real do Resumo do Caixa

---

## 🪙 E-commerce Giri Gold

### Layout Estilo eBay Mobile

#### 🛍️ Loja de Produtos
- **Layout horizontal**: foto + descrição lado a lado
- **Filtros**: Todos, ❤️ Favoritos, 🎉 Eventos
- **Sistema de favoritos** persistente
- **Modal deslizante** de baixo para cima
- **Carrinho funcional** com controle de quantidade

#### 💰 Pacotes de Giri Gold
- **4 pacotes** com bônus progressivo:
  - R$ 10 = 50 GGs
  - R$ 25 = 130 GGs (+5% bônus)
  - R$ 50 = 275 GGs (+10% bônus)
  - R$ 100 = 575 GGs (+15% bônus)

#### ❤️ Doação de GGs
- Card em destaque no topo
- Layout padrão dos pacotes
- Badge "❤️ Doe" vermelho

#### 🪙 Moeda Animada
- **Componente GiriCoin** SVG personalizado
- **Animação 3D** de flip suave (6s)
- **Brilho dourado** nas laterais durante rotação
- Texto "GGs" sempre legível

#### 🛒 Carrinho
- Adicionar produtos e pacotes GGs
- Controle de quantidade (+/-)
- Total calculado automaticamente
- Badge no ícone do carrinho

---

## 🔐 Sistema de Permissões

### 👑 ADMINISTRADOR (Admin)
**Acesso total ao sistema**

#### Dashboard
- ✅ Ver todas as métricas
- ✅ Ver vendas de todos os vendedores
- ✅ Gráficos e estatísticas completas
- ✅ Gráfico de comparação entre vendedores

#### Estoque
- ✅ Ver, Adicionar, Editar, Excluir produtos
- ✅ Ajustar quantidades
- ✅ Ver histórico de movimentação

#### Vendas & Histórico
- ✅ Criar vendas com descontos manuais ilimitados
- ✅ Ver todas as vendas (todos os vendedores)
- ✅ Cancelar e restaurar vendas
- ✅ Exportar relatórios

#### Conta
- ✅ Gerenciar usuários (adicionar/editar/excluir)
- ✅ Gerenciar promoções
- ✅ Ver vendas canceladas
- ✅ Configurações avançadas

---

### 📊 GERENTE
**Acesso de gerenciamento e supervisão**

#### Dashboard
- ✅ Ver todas as métricas (resumo geral)
- ✅ Ver vendas de todos os vendedores

#### Estoque
- ✅ Ver, Adicionar, Editar produtos
- ❌ Excluir produtos (somente Admin)

#### Vendas & Histórico
- ✅ Criar vendas com descontos até 20%
- ✅ Ver todas as vendas
- ✅ Cancelar vendas (com motivo obrigatório)
- 🔒 Restaurar vendas (apenas do mesmo dia)

#### Conta
- ✅ Gerenciar promoções
- ❌ Gerenciar usuários

---

### 🎯 VOLUNTÁRIO
**Acesso para vendas sem gestão de estoque**

#### Dashboard
- ✅ Ver métricas resumidas (apenas suas vendas)
- ✅ Giri Gold diferenciado: **R$ 1 = 1.75 GGs** (35%)

#### Estoque
- ❌ Sem acesso ao Estoque

#### Vendas & Histórico
- ✅ Criar vendas
- ✅ Ver apenas suas próprias vendas
- ✅ Aplicar promoções automáticas
- ❌ Descontos manuais

#### Loja
- ✅ Acesso completo ao E-commerce

---

### 👤 USER
**Acesso básico - apenas loja**

#### Loja
- ✅ Acesso completo ao E-commerce
- ✅ Comprar produtos com GGs
- ✅ Comprar pacotes de GGs

#### Conta
- ✅ Ver perfil
- ✅ Alterar tema

---

## 📊 Dashboard e Gamificação

### Métricas em Tempo Real
- 💰 **Valor Recebido** (valorPago) do dia/mês
- 🎁 **Total de Doações**
- 🪙 **Giri Gold** acumulado
- 📈 **Projeção Mensal** com meta diária

### Sistema Giri Gold
- **Admin/Gerente**: R$ 1 = 5 GGs (100%)
- **Voluntário**: R$ 1 = 1.75 GGs (35%)
- Distribuição interna:
  - 15% Custo
  - 10% Logística
  - 50% Instituto
  - 25% Vendedor

### 🏆 Ranking Gamificado
- **Top 10** usuários por Giri Gold
- Cores especiais:
  - 🥇 1º lugar: Ouro (#fbbf24)
  - 🥈 2º lugar: Prata (#94a3b8)
  - 🥉 3º lugar: Azul (#60a5fa)
- Destaque para usuário atual (verde)
- Botão "Ver Todos" para ranking completo
- Barras de progresso visuais

### Vendas Recentes
- Nome do vendedor (modo global)
- Status de pagamento com cores:
  - 🟢 Verde: Pago
  - 🟡 Amarelo: Parcial
  - 🔴 Vermelho: Não pago

### Comparação de Vendedores
- Lista compacta estilo ranking
- Gráfico de barras horizontais
- Valor total recebido por vendedor

---

## 🧩 Tecnologias

| Categoria | Ferramenta |
|-----------|-----------|
| 🔥 Banco de Dados | Firebase Firestore |
| ⚡ Autenticação | Firebase Auth (Google) |
| 🖥️ Front-end | React.js |
| 🎨 Estilização | CSS Modules + CSS Variables |
| 📱 QRCode | qrcode.react |
| 🧠 Estado | React Hooks (useState, useEffect) |
| 🔄 Tempo Real | Firebase Realtime Updates |

---

## 📁 Estrutura do Projeto

### 🎯 Páginas Principais (Rotas)

```
/                → Dashboard (padrão após login)
/estoque         → Gestão de Estoque
/vendas          → Criar Nova Venda
/historico       → Histórico de Vendas
/conta           → Perfil e Configurações
/loja            → E-commerce Giri Gold
```

### 🔧 Componentes Principais

```
src/
├── components/
│   ├── Dashboard.js          # Dashboard com métricas
│   ├── Inventory.js           # Gestão de estoque
│   ├── SalesCreation.js       # Criar vendas
│   ├── SalesHistory.js        # Histórico
│   ├── AccountView.js         # Conta e configurações
│   ├── Ecommerce.js           # Loja Giri Gold
│   ├── GiriCoin.js            # Componente moeda animada
│   ├── UsersManager.js        # Gerenciar usuários
│   ├── PromotionsManager.js   # Gerenciar promoções
│   ├── VendedoresComparison.js # Comparação vendedores
│   └── ProtectedRoute.js      # Proteção de rotas
├── firebase/
│   └── config.js              # Configuração Firebase
└── App.jsx                    # Rotas principais
```

### ✅ Firebase Collections

```
Vendas/              # Vendas realizadas
inventory/           # Produtos em estoque
promotions/          # Promoções ativas
customers/           # Clientes cadastrados
VendasCanceladas/    # Vendas canceladas
users/               # Usuários do sistema
```

---

## 🚀 Como Usar

### 1. Clone o repositório
```bash
git clone https://github.com/leodigory/instituto-giri.git
cd instituto-giri
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Firebase
Crie um arquivo `.env` com suas credenciais:
```env
REACT_APP_FIREBASE_API_KEY=sua_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=seu_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=seu_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=seu_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
REACT_APP_FIREBASE_APP_ID=seu_app_id
```

### 4. Execute o projeto
```bash
npm start
```

---

## 🔒 Regras de Segurança

### Fluxo de Vendas
- ✅ Nenhuma etapa pode ser pulada
- ✅ Cada venda gera QRCode único
- ✅ Resumo do Caixa atualizado em tempo real
- ✅ Validação de estoque antes de finalizar

### Sistema de Aprovação
- ✅ Primeiro login cria usuário com status "pending"
- ✅ Admin aprova/nega novos usuários
- ✅ Usuários negados não têm acesso ao sistema
- ✅ Admin principal (01leonardoaraujo@gmail.com) protegido

---

## 📊 Resumo Comparativo de Permissões

| Funcionalidade | Admin | Gerente | Voluntário | User |
|---|---|---|---|---|
| **Dashboard completo** | ✅ | ✅ | 🔒 | ❌ |
| **Gestão de Estoque** | ✅ | 🔒 | ❌ | ❌ |
| **Criar vendas** | ✅ | ✅ | ✅ | ❌ |
| **Descontos manuais** | ✅ | 🔒 | ❌ | ❌ |
| **Ver todas as vendas** | ✅ | ✅ | ❌ | ❌ |
| **Gerenciar usuários** | ✅ | ❌ | ❌ | ❌ |
| **Gerenciar promoções** | ✅ | ✅ | ❌ | ❌ |
| **Acesso à Loja** | ✅ | ✅ | ✅ | ✅ |

**Legenda**: ✅ Permitido | ❌ Bloqueado | 🔒 Com restrições

---

## 🎨 Destaques Visuais

### 🪙 Moeda Giri Gold Animada
- Rotação 3D suave (6s)
- Brilho dourado nas laterais
- Texto sempre legível
- Usado em botões e cards

### 🎨 Design Responsivo
- Layout mobile-first
- Cards compactos
- Padding lateral otimizado
- Animações suaves

### 🌈 Tema Claro/Escuro
- Alternância via toggle
- CSS Variables para cores
- Persistência no localStorage

---

## ✅ Funcionalidades Implementadas

### Sistema de Vendas
- [x] Fluxo linear inquebrável
- [x] Autocomplete de clientes e produtos
- [x] Validação de estoque em tempo real
- [x] Sistema de doações integrado
- [x] Geração de QR Code único
- [x] Histórico com filtros avançados

### E-commerce
- [x] Layout eBay mobile
- [x] Filtros (Todos, Favoritos, Eventos)
- [x] Sistema de favoritos
- [x] Carrinho funcional
- [x] Pacotes de GGs com bônus
- [x] Card de doação em destaque
- [x] Moeda animada

### Dashboard
- [x] Métricas em tempo real
- [x] Sistema Giri Gold
- [x] Ranking gamificado
- [x] Comparação de vendedores
- [x] Projeção mensal

### Sistema de Permissões
- [x] 4 roles (Admin, Gerente, Voluntário, User)
- [x] Aprovação de usuários
- [x] Proteção de rotas
- [x] Navegação condicional

### Promoções
- [x] Criação de promoções avançadas
- [x] Aplicação automática de descontos
- [x] Validação de critérios
- [x] Período de validade

---

## 🧠 Desenvolvido por

**Leonardo Araújo (leodigory)**  
🎓 Estudante de Engenharia da Computação | Designer Gráfico | Dev Web  
📧 [01leonardoaraujo@gmail.com](mailto:01leonardoaraujo@gmail.com)  
🌎 Fortaleza - CE  
🔗 [GitHub](https://github.com/leodigory) | [Repositório](https://github.com/leodigory/instituto-giri)

---

## 📝 Licença

Este projeto é de uso exclusivo do **Instituto Giri**.

---

## 🔗 Links Úteis

- 📦 **Repositório**: https://github.com/leodigory/instituto-giri
- 🔥 **Firebase**: https://firebase.google.com/
- ⚛️ **React**: https://reactjs.org/

---

<div align="center">

**⭐ Se este projeto foi útil, deixe uma estrela no GitHub!**

Made with ❤️ by [leodigory](https://github.com/leodigory)

</div>
