# TODO - Sistema de Promoções

## Correções Implementadas:

### Problemas Identificados e Corrigidos:

- [x] Promoções não estavam sendo deletadas do Firebase - Adicionado listener em tempo real para promoções em AccountView.js
- [x] Campo de critérios estava sendo salvo como "criteria" em vez de "criterio" - Corrigido para usar "criterio" em todo o código
- [x] Promoções simples estavam salvando critérios incorretamente - Agora salvam productId e productName corretamente
- [x] Falta de validação de data nas promoções - Adicionada verificação de período de validade no calculateAutomaticDiscounts

### Funcionalidades Implementadas:

- [x] Aplicação automática de descontos baseada em critérios específicos
- [x] Suporte a diferentes tipos de promoção: produto específico, combo exato, quantidade mínima, período de validade
- [x] Exibição de card de promoções aplicadas abaixo dos itens do carrinho
- [x] Validação de critérios avançados usando o modelo Promotion
- [x] Compatibilidade com promoções legadas (string criteria)

### Testes Pendentes:

- [ ] Testar criação de promoções de diferentes tipos
- [ ] Verificar aplicação automática de descontos no fluxo de vendas
- [ ] Confirmar exclusão de promoções do Firebase
- [ ] Validar critérios de data e quantidade
