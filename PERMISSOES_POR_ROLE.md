# 🔐 PERMISSÕES POR ROLE - Sistema Instituto Giri

## 📋 LEGENDA
✅ = Permitido
❌ = Bloqueado
🔒 = Permitido com restrições

---

## 👑 ADMINISTRADOR (Admin)
**Acesso total ao sistema**

### 🏠 Dashboard
- ✅ Ver todas as métricas
- ✅ Ver vendas de todos os vendedores
- ✅ Ver gráficos e estatísticas
- ✅ Ver fluxo de caixa completo
- ✅ Ver projeções
- ✅ **Gráfico de comparação de vendas por vendedor** (comparar 1, 2 ou mais usuários por dia)

### 📦 Estoque
- ✅ Ver todos os produtos
- ✅ Adicionar produtos
- ✅ Editar produtos
- ✅ Excluir produtos
- ✅ Ajustar quantidades
- ✅ Ver histórico de movimentação

### 💰 Vendas
- ✅ Criar vendas
- ✅ Selecionar qualquer cliente
- ✅ Adicionar itens
- ✅ Aplicar descontos manuais
- ✅ Aplicar promoções
- ✅ Processar pagamento
- ✅ Gerar QR Code
- ✅ Cancelar venda durante criação

### 📋 Histórico
- ✅ Ver todas as vendas (todos os vendedores)
- ✅ Filtrar por data/cliente/vendedor
- ✅ Editar status de pagamento
- ✅ Editar status de entrega
- ✅ Cancelar vendas
- ✅ Ver vendas canceladas
- ✅ Restaurar vendas canceladas
- ✅ Escanear QR Code
- ✅ Exportar relatórios

### 👤 Conta
- ✅ Ver perfil
- ✅ Alterar tema
- ✅ Gerenciar usuários (adicionar/editar/excluir)
- ✅ Gerenciar promoções (criar/editar/excluir)
- ✅ Ver vendas canceladas
- ✅ Configurações avançadas

---

## 📊 GERENTE (Gerente)
**Acesso de gerenciamento e supervisão**

### 🏠 Dashboard
- ✅ Ver todas as métricas (resumo geral)
- ✅ Ver vendas de todos os vendedores
- ✅ Ver gráficos e estatísticas
- ✅ Ver fluxo de caixa completo
- ✅ Ver projeções

### 📦 Estoque
- ✅ Ver todos os produtos
- ✅ Adicionar produtos
- ✅ Editar produtos
- ❌ Excluir produtos (somente Admin)
- ✅ Ajustar quantidades
- ✅ Ver histórico de movimentação

### 💰 Vendas
- ✅ Criar vendas
- ✅ Selecionar qualquer cliente
- ✅ Adicionar itens
- ✅ Aplicar descontos manuais (até 20%)
- ✅ Aplicar promoções
- ✅ Processar pagamento
- ✅ Gerar QR Code
- ✅ Cancelar venda durante criação

### 📋 Histórico
- ✅ Ver todas as vendas (todos os vendedores)
- ✅ Filtrar por data/cliente/vendedor
- ✅ Editar status de pagamento
- ✅ Editar status de entrega
- ✅ Cancelar vendas (com motivo obrigatório)
- ✅ Ver vendas canceladas
- 🔒 Restaurar vendas (apenas do mesmo dia)
- ✅ Escanear QR Code
- ✅ Exportar relatórios

### 👤 Conta
- ✅ Ver perfil
- ✅ Alterar tema
- ❌ Gerenciar usuários
- ✅ Gerenciar promoções (criar/editar/excluir)
- ✅ Ver vendas canceladas
- ❌ Configurações avançadas

---

## 👤 USUÁRIO (User)
**Acesso básico para vendas**

### 🏠 Dashboard
- ✅ Ver métricas resumidas (apenas suas vendas)
- ✅ Ver apenas suas próprias vendas
- ✅ Ver gráfico simplificado (suas vendas)
- ❌ Ver fluxo de caixa completo
- ❌ Ver projeções
- ❌ Ver vendas de outros vendedores

### 📦 Estoque
- ✅ Ver todos os produtos
- ❌ Adicionar produtos
- ❌ Editar produtos
- ❌ Excluir produtos
- ❌ Ajustar quantidades
- ✅ Ver disponibilidade

### 💰 Vendas
- ✅ Criar vendas
- ✅ Selecionar qualquer cliente
- ✅ Adicionar itens
- ❌ Aplicar descontos manuais
- ✅ Aplicar promoções automáticas
- ✅ Processar pagamento
- ✅ Gerar QR Code
- 🔒 Cancelar venda (apenas durante criação, antes de finalizar)

### 📋 Histórico
- 🔒 Ver apenas suas próprias vendas
- ✅ Filtrar por data/cliente
- ❌ Editar status de pagamento
- ❌ Editar status de entrega
- ❌ Cancelar vendas finalizadas
- ❌ Ver vendas canceladas
- ❌ Restaurar vendas
- ✅ Escanear QR Code (apenas suas vendas)
- ❌ Exportar relatórios

### 👤 Conta
- ✅ Ver perfil
- ✅ Alterar tema
- ❌ Gerenciar usuários
- ❌ Gerenciar promoções
- ❌ Ver vendas canceladas
- ❌ Configurações avançadas

---

## 📊 RESUMO COMPARATIVO

| Funcionalidade | Admin | Gerente | Usuário |
|---|---|---|---|
| **Dashboard completo** | ✅ | ✅ | 🔒 |
| **Adicionar produtos** | ✅ | ✅ | ❌ |
| **Editar produtos** | ✅ | ✅ | ❌ |
| **Excluir produtos** | ✅ | ❌ | ❌ |
| **Criar vendas** | ✅ | ✅ | ✅ |
| **Descontos manuais** | ✅ | 🔒 | ❌ |
| **Ver todas as vendas** | ✅ | ✅ | ❌ |
| **Cancelar vendas** | ✅ | ✅ | ❌ |
| **Restaurar vendas** | ✅ | 🔒 | ❌ |
| **Gerenciar usuários** | ✅ | ❌ | ❌ |
| **Gerenciar promoções** | ✅ | ✅ | ❌ |
| **Ver vendas canceladas** | ✅ | ✅ | ❌ |
| **Exportar relatórios** | ✅ | ✅ | ❌ |

---

## 🎯 RECOMENDAÇÕES

### Para Usuário Comum (Vendedor):
- Foco em VENDER
- Sem acesso a dados financeiros sensíveis
- Sem poder de cancelamento (evita fraudes)
- Vê apenas suas próprias vendas (motivação)

### Para Gerente:
- Supervisão e controle
- Pode gerenciar promoções (estratégia de vendas)
- Pode cancelar vendas com justificativa
- Vê todas as vendas (supervisão)
- Não pode mexer em usuários (segurança)

### Para Admin:
- Controle total
- Único que pode gerenciar usuários
- Acesso a todos os dados
- Pode reverter qualquer ação

---

## ✅ DEFINIÇÕES CONFIRMADAS

1. **Dashboard do Usuário**: ✅ Ver apenas suas próprias vendas
2. **Dashboard Admin/Gerente**: ✅ Ver resumo geral de todos
3. **Dashboard Admin**: ✅ Gráfico de comparação entre vendedores
4. **Estoque Gerente**: ✅ Pode editar | ❌ NÃO pode excluir
5. **Promoções Gerente**: ✅ Pode criar/editar promoções
6. **Descontos Gerente**: 🔒 Limite de 20%
7. **Relatórios**: ✅ Admin e Gerente podem exportar

---

**Me diga quais permissões você quer ajustar!** ✅❌🔒
