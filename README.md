# 💰 Economiza AI - Sistema de Gestão de Vendas

![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-9.0+-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=for-the-badge&logo=netlify&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

Sistema completo de gestão de vendas desenvolvido para o Instituto Giri, com controle de estoque, vendas, promoções automáticas, histórico detalhado e dashboard analítico em tempo real.

## 📋 Visão Geral

O **Economiza AI** é uma aplicação web moderna e responsiva que permite gerenciar todo o fluxo de vendas de forma eficiente, desde o cadastro de produtos até a finalização da venda com geração de QR Code para rastreamento.

### 🎯 Funcionalidades Principais

#### 📊 Dashboard Analítico
- **Métricas em Tempo Real**: Faturamento diário, mensal e projeções
- **Gráficos Interativos**: Vendas dos últimos 7 dias com visualização em barras
- **Top Produtos**: Ranking dos produtos mais vendidos
- **Taxa de Crescimento**: Cálculo automático de crescimento semanal
- **Filtros Inteligentes**: Visualização por usuário ou global (para administradores)

#### 🛒 Sistema de Vendas
- **Fluxo em Etapas**: Cliente → Itens → Pagamento → Troco → Finalização
- **Autocomplete Inteligente**: Busca de clientes e produtos com sugestões em tempo real
- **Controle de Estoque**: Validação automática de disponibilidade
- **Múltiplas Formas de Pagamento**: Suporte a pagamento parcial, pendente ou completo
- **Gestão de Troco**: Opção de devolver ou doar o troco
- **QR Code**: Geração automática para rastreamento da venda
- **Comprovante Digital**: Compartilhamento via WhatsApp ou download

#### 🎁 Sistema de Promoções Automáticas
- **Tipos de Promoções**:
  - **Quantidade Total**: Desconto ao atingir X itens no carrinho
  - **Produto Específico**: Desconto ao comprar X unidades de um produto
  - **Combo de Produtos**: Desconto ao combinar produtos específicos
- **Tipos de Desconto**: Percentual (%) ou Valor Fixo (R$)
- **Período de Validade**: Data de início e fim configuráveis
- **Aplicação Automática**: Descontos aplicados automaticamente no carrinho
- **Autocomplete de Produtos**: Seleção de produtos do Firebase para evitar erros

#### 📦 Gestão de Estoque
- **CRUD Completo**: Criar, visualizar, editar e excluir produtos
- **Controle de Quantidade**: Atualização automática após vendas
- **Preços Diferenciados**: Preço de custo e preço de venda
- **Busca e Filtros**: Localização rápida de produtos

#### 📜 Histórico de Vendas
- **Filtros Avançados**:
  - Por período: Hoje, Semana, Mês, Ano
  - Por status de pagamento: Pago, Parcial, Pendente
  - Por status de entrega: Entregue, Parcial, Não Entregue
  - Por cliente ou ID da venda
- **Scanner QR Code**: Localização rápida de vendas via QR Code
- **Edição de Vendas**: Atualização de status de pagamento e entrega
- **Cancelamento**: Registro de motivo e histórico de vendas canceladas
- **Restauração**: Recuperação de vendas canceladas

#### 👥 Gestão de Usuários
- **Autenticação Google**: Login seguro via Firebase Auth
- **Controle de Acesso**: Administradores e usuários comuns
- **Rastreamento**: Vendas vinculadas ao vendedor responsável

#### 🎨 Interface e UX
- **Tema Claro/Escuro**: Alternância com persistência
- **Design Responsivo**: Otimizado para desktop e mobile
- **Skeleton Loading**: Carregamento estilo YouTube
- **Animações Suaves**: Transições CSS para melhor experiência
- **Feedback Visual**: Toasts, badges e indicadores de status

## 🛠️ Tecnologias Utilizadas

### Frontend
- **React 18.2.0**: Biblioteca JavaScript para interfaces
- **React Router DOM**: Navegação entre páginas
- **CSS3**: Estilização com variáveis CSS e media queries
- **HTML5 QR Code**: Scanner e geração de QR Codes
- **QRCode.react**: Geração de QR Codes
- **html2canvas**: Captura de tela para compartilhamento

### Backend & Database
- **Firebase 9.0+**:
  - **Firestore**: Banco de dados NoSQL em tempo real
  - **Authentication**: Autenticação via Google
  - **Hosting**: Hospedagem da aplicação
- **Netlify**: Deploy e CI/CD

### Estrutura de Dados

#### Coleções Firebase

**Vendas**
```javascript
{
  id: "V1760075791252O6MM4",
  vendedor: "Leonardo Araujo",
  cliente: { name: "João Silva", phone: "(11) 99999-9999" },
  itens: [
    {
      id: "item-id",
      nome: "Cartela Bingo",
      preco: 5.00,
      quantidade: 5,
      pago: true,
      entregue: false
    }
  ],
  valorTotal: 25.00,
  valorPago: 25.00,
  desconto: 2.00,
  doacao: 0,
  troco: 0,
  status: "Pago",
  statusPagamento: "Pago",
  deliveryStatus: "Pendente",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**inventory**
```javascript
{
  id: "item-id",
  name: "Cartela Bingo",
  salePrice: 5.00,
  costPrice: 3.00,
  quantity: 100,
  createdAt: Timestamp
}
```

**promotions**
```javascript
{
  id: "promo-id",
  name: "PROMO 5 ITENS",
  discount: 2.00,
  discountType: "fixed", // ou "percentage"
  criterio: [
    {
      type: "total_quantity", // ou "product_quantity" ou "product_combo"
      minQuantity: 5
    }
  ],
  isActive: true,
  startDate: "2024-01-01",
  endDate: "2024-12-31",
  maxDiscount: 10.00
}
```

**customers**
```javascript
{
  id: "customer-id",
  name: "João Silva",
  phone: "(11) 99999-9999",
  createdAt: Timestamp
}
```

## 📐 Métodos e Cálculos

### Cálculo de Descontos Automáticos

```javascript
// 1. Verificar critérios da promoção
if (criterio.type === "total_quantity") {
  const totalQty = items.reduce((sum, i) => sum + i.quantidadeSelecionada, 0);
  if (totalQty >= criterio.minQuantity) {
    // Aplicar desconto
  }
}

// 2. Calcular desconto
if (discountType === "percentage") {
  discount = subtotal * (discount / 100);
} else {
  discount = Math.min(discount, subtotal);
}

// 3. Aplicar limite máximo
if (maxDiscount && discount > maxDiscount) {
  discount = maxDiscount;
}
```

### Cálculo de Pagamento por Item

```javascript
// Ordenar itens do menor para o maior valor
const itensSorted = items.sort((a, b) => 
  (a.preco * a.quantidadeSelecionada) - (b.preco * b.quantidadeSelecionada)
);

// Aplicar desconto no último item
const itensComDesconto = itensSorted.map((item, index) => {
  const itemTotal = item.preco * item.quantidadeSelecionada;
  if (index === itensSorted.length - 1) {
    return { ...item, valorComDesconto: Math.max(0, itemTotal - desconto) };
  }
  return { ...item, valorComDesconto: itemTotal };
});

// Marcar itens como pagos cumulativamente
let cumulative = 0;
const itensComPagamento = itensComDesconto.map((item) => {
  cumulative += item.valorComDesconto;
  return { ...item, pago: valorPago >= cumulative };
});
```

### Cálculo de Métricas do Dashboard

```javascript
// Taxa de crescimento semanal
const lastWeekRevenue = weeklyData.slice(0, 3).reduce((sum, day) => sum + day.revenue, 0);
const thisWeekRevenue = weeklyData.slice(4, 7).reduce((sum, day) => sum + day.revenue, 0);
const growthRate = lastWeekRevenue > 0 
  ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 
  : 0;

// Projeção mensal
const avgDailyRevenue = monthlyCashFlow / currentDay;
const daysInMonth = new Date(year, month, 0).getDate();
const projectedRevenue = avgDailyRevenue * daysInMonth;
```

## 📦 Instalação e Deploy

### Instalação Local

```bash
# Clone o repositório
git clone https://github.com/leodigory/Economiza-ai.git
cd Economiza-ai

# Instale as dependências
npm install

# Configure as variáveis de ambiente
# Crie um arquivo .env na raiz do projeto
REACT_APP_FIREBASE_API_KEY=sua-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=seu-auth-domain
REACT_APP_FIREBASE_PROJECT_ID=seu-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=seu-storage-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=seu-sender-id
REACT_APP_FIREBASE_APP_ID=seu-app-id

# Inicie o servidor de desenvolvimento
npm start
```

### Deploy no Netlify

1. **Via GitHub**:
   - Conecte seu repositório GitHub ao Netlify
   - Configure o build command: `npm run build`
   - Configure o publish directory: `build`
   - Adicione as variáveis de ambiente no painel do Netlify

2. **Via CLI**:
```bash
# Instale o Netlify CLI
npm install -g netlify-cli

# Faça login
netlify login

# Deploy
netlify deploy --prod
```

### Deploy no Firebase Hosting

```bash
# Instale o Firebase CLI
npm install -g firebase-tools

# Faça login
firebase login

# Inicialize o projeto
firebase init hosting

# Build e deploy
npm run build
firebase deploy --only hosting
```

## 🎨 Estrutura do Projeto

```
Economiza_AI/
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── key-click.mp3
├── src/
│   ├── components/
│   │   ├── Dashboard.js          # Dashboard analítico
│   │   ├── SalesCreation.js      # Criação de vendas
│   │   ├── SalesHistory.js       # Histórico de vendas
│   │   ├── Inventory.js          # Gestão de estoque
│   │   ├── PromotionsManager.js  # Gerenciador de promoções
│   │   ├── CanceledSales.js      # Vendas canceladas
│   │   ├── UsersManager.js       # Gestão de usuários
│   │   └── AccountView.js        # Perfil do usuário
│   ├── models/
│   │   ├── Customer.js           # Modelo de cliente
│   │   ├── Promotion.js          # Modelo de promoção
│   │   └── Sale.js               # Modelo de venda
│   ├── firebase/
│   │   └── config.js             # Configuração Firebase
│   ├── hooks/
│   │   ├── useFirebase.js        # Hook Firebase
│   │   └── useSales.js           # Hook de vendas
│   ├── utils/
│   │   └── qrCode.js             # Utilitários QR Code
│   ├── App.jsx                   # Componente principal
│   ├── App.css                   # Estilos globais
│   └── index.js                  # Entry point
├── firebase.json                 # Config Firebase
├── netlify.toml                  # Config Netlify
├── package.json
└── README.md
```

## 🚀 Funcionalidades Futuras

- [ ] Relatórios em PDF
- [ ] Integração com WhatsApp Business API
- [ ] Sistema de notificações push
- [ ] Backup automático de dados
- [ ] Modo offline com sincronização
- [ ] Dashboard de métricas avançadas
- [ ] Sistema de metas e comissões
- [ ] Integração com impressora térmica

## 📜 Licença

Este projeto está licenciado sob a MIT License.

## 🤝 Contribuições

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📧 Contato

**Leonardo Araujo**
- GitHub: [@leodigory](https://github.com/leodigory)
- Email: leodigory@gmail.com

---

Desenvolvido com 💻 e ☕ por Leonardo Araujo para o Instituto Giri
