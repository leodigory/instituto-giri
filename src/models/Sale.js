class Sale {
  constructor(data) {
    // Handle both old constructor format and new data object format
    if (typeof data === 'object' && data !== null) {
      this.id = data.id || '';
      this.date = data.createdAt || data.date || new Date().toISOString();
      this.amount = data.valorTotal || data.amount || 0;
      this.status = data.status || 'Pendente';
      this.customer = data.cliente?.nome || data.customer || '';
      this.customerPhone = data.cliente?.telefone || '';
      this.items = data.itens || [];
      this.valorPago = data.valorPago || 0;
      this.doacao = data.doacao || 0;
      this.troco = data.troco || 0;
      this.statusPagamento = data.statusPagamento || 'Pendente';
      this.deliveryStatus = data.deliveryStatus || 'Pendente';
      this.pago = data.pago || false;
      this.entregue = data.entregue || false;
      this.createdAt = data.createdAt || new Date().toISOString();
      this.updatedAt = data.updatedAt || new Date().toISOString();
    } else {
      // Fallback for old constructor format (backward compatibility)
      this.id = data || '';
      this.date = arguments[1] || new Date().toISOString();
      this.amount = arguments[2] || 0;
      this.status = arguments[3] || 'Pendente';
      this.customer = arguments[4] || '';
      this.customerPhone = '';
      this.items = [];
      this.valorPago = 0;
      this.doacao = 0;
      this.troco = 0;
      this.statusPagamento = 'Pendente';
      this.deliveryStatus = 'Pendente';
      this.pago = false;
      this.entregue = false;
      this.createdAt = this.date;
      this.updatedAt = this.date;
    }
  }

  // Method to get formatted date
  getFormattedDate() {
    try {
      return new Date(this.date).toLocaleDateString('pt-BR');
    } catch (error) {
      return 'Data inválida';
    }
  }

  // Method to get formatted amount
  getFormattedAmount() {
    try {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(this.amount);
    } catch (error) {
      return 'R$ 0,00';
    }
  }

  // Method to get formatted customer info
  getFormattedCustomer() {
    if (this.customerPhone) {
      return `${this.customer} (${this.customerPhone})`;
    }
    return this.customer;
  }

  // Method to get payment status
  getPaymentStatus() {
    return this.statusPagamento;
  }

  // Method to get delivery status
  getDeliveryStatus() {
    return this.deliveryStatus;
  }

  // Method to check if sale is fully paid
  isFullyPaid() {
    return this.pago;
  }

  // Method to check if sale is fully delivered
  isFullyDelivered() {
    return this.entregue;
  }
}

export default Sale;
