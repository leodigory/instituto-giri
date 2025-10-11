# 🚀 IMPLEMENTAÇÃO DE ROLES - Plano de Ação

## ✅ PERMISSÕES DEFINIDAS

### 👑 ADMIN
- Dashboard: Todas as vendas + Gráfico comparativo de vendedores
- Estoque: Controle total (adicionar/editar/excluir)
- Vendas: Sem restrições
- Histórico: Todas as vendas + Cancelar/Restaurar
- Conta: Gerenciar usuários + Promoções

### 📊 GERENTE
- Dashboard: Todas as vendas (resumo geral)
- Estoque: Adicionar/Editar (NÃO excluir)
- Vendas: Descontos até 20%
- Histórico: Todas as vendas + Cancelar (com motivo)
- Conta: Gerenciar promoções (NÃO usuários)

### 👤 USUÁRIO
- Dashboard: Apenas suas vendas
- Estoque: Apenas visualizar
- Vendas: Sem descontos manuais
- Histórico: Apenas suas vendas
- Conta: Apenas perfil e tema

---

## 📋 COMPONENTES A MODIFICAR

### 1. **Dashboard.js**
```javascript
// Adicionar filtro por role
if (userRole === 'user') {
  // Filtrar apenas vendas do usuário logado
  vendas = vendas.filter(v => v.vendedor === currentUser.displayName);
}

// Admin: Adicionar gráfico de comparação de vendedores
if (userRole === 'admin') {
  // Novo componente: VendedoresComparison
  // Selecionar 1, 2 ou mais vendedores
  // Comparar vendas por dia
}
```

### 2. **Inventory.js**
```javascript
// Esconder botões baseado no role
{userRole === 'admin' && (
  <button onClick={handleDelete}>Excluir</button>
)}

{(userRole === 'admin' || userRole === 'gerente') && (
  <button onClick={handleEdit}>Editar</button>
)}

{userRole === 'user' && (
  <p>Você não tem permissão para editar o estoque</p>
)}
```

### 3. **SalesCreation.js**
```javascript
// Descontos manuais
{(userRole === 'admin' || userRole === 'gerente') && (
  <input 
    type="number" 
    placeholder="Desconto manual"
    max={userRole === 'gerente' ? subtotal * 0.2 : subtotal}
  />
)}

// Validação no backend
if (userRole === 'gerente' && desconto > subtotal * 0.2) {
  alert('Gerente pode aplicar no máximo 20% de desconto');
  return;
}
```

### 4. **SalesHistory.js**
```javascript
// Filtrar vendas por role
const fetchSales = async () => {
  let vendas = await getAllSales();
  
  if (userRole === 'user') {
    vendas = vendas.filter(v => v.vendedor === currentUser.displayName);
  }
  
  setSales(vendas);
};

// Botões de ação
{(userRole === 'admin' || userRole === 'gerente') && (
  <button onClick={handleCancel}>Cancelar</button>
)}

{userRole === 'admin' && (
  <button onClick={handleRestore}>Restaurar</button>
)}
```

### 5. **AccountView.js**
```javascript
// Já implementado! ✅
// Ações rápidas baseadas no role
{userRole === 'admin' && (
  <button onClick={() => setShowUsers(true)}>
    Gerenciar Usuários
  </button>
)}

{(userRole === 'admin' || userRole === 'gerente') && (
  <button onClick={() => setShowPromotions(true)}>
    Promoções
  </button>
)}
```

---

## 🎯 NOVOS COMPONENTES

### 1. **VendedoresComparison.js** (Admin)
```javascript
// Gráfico de comparação de vendas por vendedor
// Selecionar múltiplos vendedores
// Comparar vendas por dia/semana/mês
// Gráfico de barras ou linhas
```

### 2. **UserDashboard.js** (Usuário)
```javascript
// Dashboard simplificado
// Apenas métricas do próprio usuário
// Gráfico de suas vendas
// Metas pessoais
```

---

## 🔧 HOOKS E CONTEXTOS

### useAuth.js
```javascript
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('user');
  
  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const role = await getUserRole(currentUser.email);
        setUserRole(role);
      }
      setUser(currentUser);
    });
  }, []);
  
  return { user, userRole };
};
```

### RoleContext.js
```javascript
export const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const { user, userRole } = useAuth();
  
  const hasPermission = (permission) => {
    const permissions = {
      admin: ['all'],
      gerente: ['view_all_sales', 'edit_stock', 'manage_promotions'],
      user: ['create_sale', 'view_own_sales']
    };
    
    return permissions[userRole]?.includes(permission) || 
           permissions[userRole]?.includes('all');
  };
  
  return (
    <RoleContext.Provider value={{ userRole, hasPermission }}>
      {children}
    </RoleContext.Provider>
  );
};
```

---

## 📊 ORDEM DE IMPLEMENTAÇÃO

### Fase 1: Base (Já feito ✅)
- [x] Sistema de roles no Firebase
- [x] AccountView com roles dinâmicos
- [x] UsersManager com 3 roles

### Fase 2: Restrições Básicas
- [ ] Dashboard filtrado por role
- [ ] Inventory com botões condicionais
- [ ] SalesHistory filtrado por role

### Fase 3: Validações
- [ ] Desconto máximo para gerente (20%)
- [ ] Bloqueio de exclusão no estoque (gerente)
- [ ] Validação de permissões no backend

### Fase 4: Recursos Avançados
- [ ] Gráfico de comparação de vendedores (admin)
- [ ] Dashboard simplificado (usuário)
- [ ] Relatórios por role

---

## 🧪 TESTES

### Cenários de Teste

1. **Admin**
   - ✅ Ver todas as vendas
   - ✅ Excluir produtos
   - ✅ Gerenciar usuários
   - ✅ Comparar vendedores

2. **Gerente**
   - ✅ Ver todas as vendas
   - ✅ Editar produtos
   - ❌ Excluir produtos
   - ✅ Aplicar 20% desconto
   - ❌ Aplicar 30% desconto

3. **Usuário**
   - ✅ Ver apenas suas vendas
   - ❌ Ver vendas de outros
   - ❌ Editar estoque
   - ❌ Aplicar descontos

---

## 🚀 PRÓXIMOS PASSOS

1. Implementar filtros no Dashboard
2. Adicionar validações de desconto
3. Criar gráfico de comparação (admin)
4. Testar todas as permissões
5. Deploy no Netlify

**Quer que eu comece a implementar agora?** 🔨
