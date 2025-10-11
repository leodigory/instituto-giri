# 📋 Estrutura do Projeto - Instituto Giri

## 🎯 Páginas Principais (Rotas)

### 1. **Dashboard** (`/`)
   - Resumo de vendas do dia
   - Gráficos e métricas
   - Fluxo de caixa
   - Vendas recentes

### 2. **Estoque** (`/estoque`)
   - Lista de produtos
   - Adicionar/Editar/Excluir produtos
   - Controle de quantidade
   - Preços

### 3. **Vendas** (`/vendas`)
   - Criar nova venda
   - Selecionar cliente
   - Adicionar itens
   - Aplicar promoções
   - Processar pagamento
   - Gerar QR Code

### 4. **Histórico** (`/historico`)
   - Lista de todas as vendas
   - Filtros (data, status, cliente)
   - Scanner QR Code
   - Editar status de pagamento/entrega
   - Cancelar vendas

### 5. **Conta** (`/conta`)
   - Perfil do usuário
   - Login com Google
   - Configurações de tema
   - Gerenciar usuários (admin)
   - Gerenciar promoções (admin)
   - Ver vendas canceladas (admin)
   - Logout

## 🔧 Componentes Auxiliares

- **PromotionsManager**: Modal para gerenciar promoções
- **CanceledSales**: Modal para ver vendas canceladas
- **UsersManager**: Modal para gerenciar usuários
- **SalesView**: Visualização detalhada de venda
- **ProgressBar**: Barra de progresso
- **TestSales**: Página de testes

## ❌ O QUE NÃO TEM NO PROJETO

- ❌ Localização / CEP
- ❌ Endereço / Rua / Logradouro
- ❌ Estado / Cidade
- ❌ Mapa / Geolocalização
- ❌ Lista de compras

## ✅ Firebase Collections

- `Vendas`: Vendas realizadas
- `inventory`: Produtos em estoque
- `promotions`: Promoções ativas
- `customers`: Clientes cadastrados
- `VendasCanceladas`: Vendas canceladas
- `users`: Usuários do sistema

## 🚀 Navegação (Bottom Nav)

1. 🏠 Dashboard
2. 📦 Estoque
3. 💰 Vendas
4. 📋 Histórico
5. 👤 Conta

## ⚠️ PROBLEMA NO NETLIFY

Se aparecer "Minha Localização", "CEP", "Estado", "Cidade":
- ❌ Está fazendo deploy do REPOSITÓRIO ERRADO
- ❌ Está com CACHE antigo
- ❌ Está conectado a outro projeto

## ✅ SOLUÇÃO

1. Delete o site no Netlify COMPLETAMENTE
2. Crie novo site
3. Conecte ao repositório: **leodigory/instituto-giri**
4. Trigger deploy → Clear cache and deploy site
5. Limpe o cache do navegador (Ctrl+Shift+Delete)

## 📦 Repositório Correto

**GitHub**: https://github.com/leodigory/instituto-giri
**Commit**: 21351c2 - Build limpo - Versão final funcionando
