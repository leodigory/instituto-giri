import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase/config";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";
import { useLocation } from "react-router-dom";

import { Customer } from "../models/Customer";
import "./SalesCreation.css";

const SalesCreation = ({ onBack }) => {
  const location = useLocation();
  const editSale = location.state?.editSale;
  
  // Estados do fluxo de venda
  const [currentStep, setCurrentStep] = useState(1);
  const [saleData, setSaleData] = useState({
    cliente: { name: "", phone: "" },
    itens: [],
    doacao: 0,
    valorPago: 0,
    status: "Pendente",
  });

  // Estados para autocomplete
  const [clientSearch, setClientSearch] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [clientSuggestions, setClientSuggestions] = useState([]);
  const [itemSuggestions, setItemSuggestions] = useState([]);
  const [showClientSuggestions, setShowClientSuggestions] = useState(false);
  const [showItemSuggestions, setShowItemSuggestions] = useState(false);

  // Estados para controle de seleção de cliente
  const [clientSelected, setClientSelected] = useState(false);

  // Estados para item temporário
  const [temporaryItem, setTemporaryItem] = useState(null);
  const [tempQuantity, setTempQuantity] = useState(1);
  const [isManualItem, setIsManualItem] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempPreco, setTempPreco] = useState(0);

  // Estados para controle de busca
  const [searchExecuted, setSearchExecuted] = useState(false);

  // Estados para formatação automática do valor pago
  const [displayValorPago, setDisplayValorPago] = useState("0,00");

  // Estados para promoções
  const [promotions, setPromotions] = useState([]);
  const [appliedPromotions, setAppliedPromotions] = useState([]);
  const [automaticDiscount, setAutomaticDiscount] = useState(0);

  // Estados para validação
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Estados para toasts e animações
  const [toasts, setToasts] = useState([]);
  const [itemsRealTime, setItemsRealTime] = useState([]);
  const [clientsRealTime, setClientsRealTime] = useState([]);

  // Estados para troco
  const [devolver, setDevolver] = useState(0);
  const [doar, setDoar] = useState(0);
  const [displayDevolver, setDisplayDevolver] = useState("0,00");
  const [displayDoar, setDisplayDoar] = useState("0,00");
  
  // Estado para tema
  const [isDarkTheme, setIsDarkTheme] = useState(
    document.documentElement.getAttribute("data-theme") === "dark"
  );

  // Estado para vendedor
  const [vendedor, setVendedor] = useState("");

  const clientInputRef = useRef(null);
  const itemInputRef = useRef(null);

  // Buscar nome do usuário logado e carregar dados de edição
  useEffect(() => {
    const loadVendedor = () => {
      const user = auth.currentUser;
      if (user) {
        const nome = user.displayName || user.email || "Vendedor";
        console.log("Vendedor carregado:", nome);
        setVendedor(nome);
      } else {
        console.log("Usuário não autenticado");
        setVendedor("Vendedor");
      }
    };
    
    loadVendedor();
  }, []);
  
  useEffect(() => {
    if (editSale) {
      const user = auth.currentUser;
      const currentVendedor = user ? (user.displayName || user.email || "Vendedor") : "Vendedor";
      
      console.log("Carregando venda para edição, ID:", editSale.id);
      
      setCurrentStep(3);
      setClientSelected(true);
      setSaleData({
        id: editSale.id,
        cliente: editSale.cliente,
        itens: editSale.itens.map(item => ({
          ...item,
          quantidadeSelecionada: item.quantidade,
          quantidadeDisponivel: item.quantidade + (item.quantidadeSelecionada || 0)
        })),
        doacao: editSale.doacao || 0,
        valorPago: editSale.valorPago || 0,
        status: editSale.status || "Pendente",
        desconto: editSale.desconto || 0,
      });
      setVendedor(currentVendedor);
      
      if (editSale.valorPago) {
        const digitsOnly = Math.round(editSale.valorPago * 100).toString();
        const formatted = formatMoneyInput(digitsOnly);
        setDisplayValorPago(formatted);
      }
    }
  }, [editSale]);

  // Função para formatar moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Função para formatar input de moeda enquanto digita
  const formatMoneyInput = (value) => {
    if (!value || value === "0") return "0,00";
    const numericValue = value.toString().replace(/[^\d]/g, "");
    if (numericValue.length === 0) return "0,00";
    const number = parseInt(numericValue, 10);
    if (isNaN(number)) return "0,00";
    const reais = Math.floor(number / 100);
    const centavos = number % 100;
    const centavosStr = centavos < 10 ? "0" + centavos : centavos.toString();
    return `${reais},${centavosStr}`;
  };

  // Função para converter string formatada em número
  const parseMoneyInput = (value) => {
    if (!value || value === "0,00") return 0;
    const cleanValue = value.toString().replace(/[^\d,]/g, '');
    const parts = cleanValue.split(',');
    if (parts.length === 1) {
      return parseFloat(parts[0]) || 0;
    }
    if (parts.length === 2) {
      const reais = parseFloat(parts[0]) || 0;
      const centavos = parseFloat(parts[1].padEnd(2, '0').substring(0, 2)) || 0;
      return reais + (centavos / 100);
    }
    return 0;
  };



  // Função para lidar com mudança no campo de valor pago com formatação automática
  const handleValorPagoChange = (e) => {
    const input = e.target.value;
    // Remove tudo exceto dígitos
    const digitsOnly = input.replace(/\D/g, '');
    
    if (digitsOnly === '') {
      setDisplayValorPago('0,00');
      setSaleData((prev) => ({ ...prev, valorPago: 0 }));
      return;
    }
    
    // Formata como moeda brasileira
    const formatted = formatMoneyInput(digitsOnly);
    setDisplayValorPago(formatted);

    // Converte para número
    const numValue = parseInt(digitsOnly, 10) / 100;
    setSaleData((prev) => ({ ...prev, valorPago: numValue }));
  };

  // Função para gerar ID único da venda
  const generateSaleId = () => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 5);
    return `V${timestamp}${random}`.toUpperCase();
  };

  // Função para mostrar toast
  const showToast = (message, type = "success") => {
    const id = Date.now();
    const toast = { id, message, type };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  // Buscar sugestões de clientes (case-insensitive) - usa dados real-time
  const searchClients = (searchTerm) => {
    console.log("Searching clients for term:", searchTerm);
    if (searchTerm.length < 1) {
      console.log("Search term too short, clearing suggestions");
      setClientSuggestions([]);
      return;
    }

    try {
      const searchTermLower = searchTerm.toLowerCase();
      const searchTermUpper =
        searchTermLower.charAt(0).toUpperCase() + searchTermLower.slice(1);

      const clients = [];

      console.log("Clients real-time count:", clientsRealTime.length);

      // Filtra localmente dos clientes real-time
      clientsRealTime.forEach((client) => {
        const clientName = client.name || client.nome;
        if (clientName) {
          const nameLower = clientName.toLowerCase();
          if (
            nameLower.includes(searchTermLower) ||
            clientName.includes(searchTermUpper)
          ) {
            clients.push({
              id: client.id,
              name: clientName,
              phone: client.phone || client.telefone || "",
              ...client,
            });
          }
        }
      });
      console.log("Filtered clients:", clients.length);

      // Ordena os resultados
      const sortedClients = clients.sort((a, b) => {
        const aStartsWith = (a.name || a.nome)
          .toLowerCase()
          .startsWith(searchTermLower);
        const bStartsWith = (b.name || b.nome)
          .toLowerCase()
          .startsWith(searchTermLower);

        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return (a.name || a.nome).localeCompare(b.name || b.nome);
      });

      setClientSuggestions(sortedClients);
    } catch (error) {
      console.error("Erro ao filtrar clientes:", error);
      setClientSuggestions([]);
      setErrors((prev) => ({
        ...prev,
        clientSearch: "Erro ao buscar clientes. Tente novamente.",
      }));
      showToast("Erro ao buscar clientes", "error");
    }
  };

  // Buscar sugestões de itens (case-insensitive) - usa dados real-time
  const searchItems = async (searchTerm) => {
    console.log("Searching items for term:", searchTerm);
    setSearchExecuted(true); // Marca que a busca foi executada

    if (searchTerm.length < 1) {
      console.log("Search term too short, clearing suggestions");
      setItemSuggestions([]);
      setSearchExecuted(false);
      return;
    }

    try {
      const searchTermLower = searchTerm.toLowerCase();
      const searchTermUpper =
        searchTermLower.charAt(0).toUpperCase() + searchTermLower.slice(1);

      const items = [];

      console.log("Items real-time count:", itemsRealTime.length);

      // Filtra localmente dos itens real-time
      itemsRealTime.forEach((item) => {
        const nome = item.name || item.nome;
        const preco = Number(item.salePrice || item.preco);
        const quantidade = Number(item.quantity || item.quantidade);
        if (nome && !isNaN(preco) && !isNaN(quantidade)) {
          const itemName = nome.toLowerCase();
          // Verifica se o nome contém o termo de busca (case-insensitive)
          if (
            itemName.includes(searchTermLower) ||
            nome.includes(searchTermUpper)
          ) {
            items.push({
              id: item.id,
              nome,
              preco,
              quantidade,
              quantidadeDisponivel: quantidade,
              ...item,
            });
          }
        }
      });
      console.log("Filtered items:", items.length);

      // Ordena os resultados para mostrar primeiro os que começam com o termo
      const sortedItems = items.sort((a, b) => {
        const aStartsWith = a.nome.toLowerCase().startsWith(searchTermLower);
        const bStartsWith = b.nome.toLowerCase().startsWith(searchTermLower);

        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return a.nome.localeCompare(b.nome);
      });

      setItemSuggestions(sortedItems);
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
      setItemSuggestions([]);
      setErrors((prev) => ({
        ...prev,
        itemSearch: "Erro ao buscar itens. Tente novamente.",
      }));
      showToast("Erro ao buscar itens", "error");
    }
  };

  // Selecionar cliente
  const selectClient = (client) => {
    setSaleData((prev) => ({
      ...prev,
      cliente: {
        name: client.name || client.nome,
        phone: client.phone || client.telefone || "",
      },
    }));
    setClientSearch("");
    setClientSelected(true);
    setShowClientSuggestions(false);
    setErrors((prev) => ({ ...prev, cliente: null }));
  };

  // Selecionar item para painel temporário
  const selectItem = useCallback((item) => {
    if (!item || !item.id) {
      console.error("Item inválido:", item);
      return;
    }

    if (item.quantidade <= 0) {
      setErrors((prev) => ({ ...prev, itens: "Item sem estoque disponível" }));
      return;
    }

    console.log("Selecionando item:", item); // Debug log

    setTemporaryItem({
      id: item.id,
      nome: item.nome,
      preco: Number(item.preco),
      quantidadeDisponivel: Number(
        item.quantidade || item.quantidadeDisponivel || 0
      ),
    });
    setTempQuantity(1);
    setIsManualItem(false);
    setErrors((prev) => ({
      ...prev,
      itens: undefined,
      item: undefined,
    }));
  }, []);

  // Adicionar item temporário ao carrinho
  const addTemporaryToCart = () => {
    if (!temporaryItem) {
      setErrors((prev) => ({
        ...prev,
        itens: "Selecione um item da lista",
      }));
      return;
    }
    
    if (temporaryItem) {
      if (tempQuantity <= 0) return;
      if (tempQuantity > temporaryItem.quantidadeDisponivel) {
        setErrors((prev) => ({
          ...prev,
          itens: "Quantidade excede estoque disponível",
        }));
        return;
      }
      setSaleData((prev) => {
        const existingItemIndex = prev.itens.findIndex(
          (i) => i.id === temporaryItem.id
        );
        if (existingItemIndex >= 0) {
          const updatedItens = [...prev.itens];
          const newQtd =
            updatedItens[existingItemIndex].quantidadeSelecionada +
            tempQuantity;
          if (newQtd > temporaryItem.quantidadeDisponivel) {
            setErrors((prev) => ({
              ...prev,
              itens: "Quantidade excede estoque disponível",
            }));
            return prev;
          }
          updatedItens[existingItemIndex] = {
            ...updatedItens[existingItemIndex],
            quantidadeSelecionada: newQtd,
          };
          return { ...prev, itens: updatedItens };
        } else {
          return {
            ...prev,
            itens: [
              ...prev.itens,
              {
                id: temporaryItem.id,
                nome: temporaryItem.nome,
                preco: temporaryItem.preco,
                quantidadeDisponivel: temporaryItem.quantidadeDisponivel,
                quantidadeSelecionada: tempQuantity,
                pago: false,
                entregue: false,
              },
            ],
          };
        }
      });
    } else {
      return;
    }

    // Limpar
    setTemporaryItem(null);
    setIsManualItem(false);
    setTempQuantity(1);
    setTempName("");
    setTempPreco(0);
    setItemSearch("");
    setItemSuggestions([]);
    setShowItemSuggestions(false);
    setErrors((prev) => ({ ...prev, itens: undefined }));
  };

  // Atualizar quantidade do item
  const updateItemQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    console.log('[UPDATE] Atualizando quantidade:', itemId, newQuantity);

    setSaleData((prev) => {
      const updatedItens = prev.itens.map((item) =>
        item.id === itemId
          ? { ...item, quantidadeSelecionada: newQuantity }
          : item
      );
      
      return { ...prev, itens: updatedItens };
    });
  };

  // Remover item
  const removeItem = (itemId) => {
    setSaleData((prev) => {
      const updatedItens = prev.itens.filter((item) => item.id !== itemId);
      return { ...prev, itens: updatedItens };
    });
  };

  // Toggle per-item status
  const toggleItemStatus = (itemId, status) => {
    setSaleData((prev) => ({
      ...prev,
      itens: prev.itens.map((item) =>
        item.id === itemId ? { ...item, [status]: !item[status] } : item
      ),
    }));
  };

  // Calcular totais
  const calculateTotals = useCallback(
    (data = saleData) => {
      const valorTotal = data.itens.reduce(
        (total, item) => total + item.preco * item.quantidadeSelecionada,
        0
      );
      const totalComDesconto = valorTotal - (data.desconto || 0);
      const troco = Math.max(0, data.valorPago - totalComDesconto);
      return {
        valorTotal,
        troco,
      };
    },
    [saleData]
  );

  // Função auxiliar para avaliar critérios da promoção
  const evaluateCriteria = (criteria, items) => {
    if (!items || items.length === 0) return false;
    if (!criteria || criteria.length === 0) return false;

    // Verificar cada critério
    for (let crit of criteria) {
      if (typeof crit === "object" && crit.type) {
        // Critério: Quantidade total de itens
        if (crit.type === "total_quantity") {
          const totalQty = items.reduce(
            (sum, i) => sum + (i.quantidadeSelecionada || 0),
            0
          );
          console.log(`[PROMO] total_quantity: totalQty=${totalQty}, minQuantity=${crit.minQuantity}`);
          if (totalQty < crit.minQuantity) return false;
        }
        
        // Critério: Quantidade de produto específico
        else if (crit.type === "product_quantity") {
          const productItem = items.find(
            (i) => i.nome.toLowerCase().includes(crit.productName.toLowerCase())
          );
          console.log(`[PROMO] product_quantity: product=${crit.productName}, found=${!!productItem}, qty=${productItem?.quantidadeSelecionada}`);
          if (!productItem || productItem.quantidadeSelecionada < crit.minQuantity) {
            return false;
          }
        }
        
        // Critério: Combinação de produtos
        else if (crit.type === "product_combo") {
          const cartNames = items.map((i) => i.nome.trim().toLowerCase());
          const allProductsPresent = crit.products.every((reqProduct) =>
            cartNames.some(cartName => cartName.includes(reqProduct.trim().toLowerCase()))
          );
          console.log(`[PROMO] product_combo: required=${crit.products}, present=${allProductsPresent}`);
          if (!allProductsPresent) return false;
        }
      }
    }

    return true;
  };

  // Calcular descontos automáticos
  const calculateAutomaticDiscounts = useCallback(
    (items) => {
      console.log('[CALC PROMO] Iniciando cálculo com', items.length, 'itens');
      
      if (!items || items.length === 0) {
        setAutomaticDiscount(0);
        setAppliedPromotions([]);
        setSaleData((prev) => ({ ...prev, desconto: 0 }));
        return;
      }
      
      if (!promotions || promotions.length === 0) {
        console.log('[CALC PROMO] Nenhuma promoção disponível');
        setAutomaticDiscount(0);
        setAppliedPromotions([]);
        setSaleData((prev) => ({ ...prev, desconto: 0 }));
        return;
      }

      let totalDiscount = 0;
      const applied = [];
      const subtotal = items.reduce(
        (sum, item) => sum + item.preco * item.quantidadeSelecionada,
        0
      );
      
      console.log('[CALC PROMO] Subtotal:', subtotal);

      // Verificar cada promoção
      promotions.forEach((promotion) => {
        console.log(`[PROMO] Verificando: ${promotion.name}`);
        console.log(`[PROMO] - isActive: ${promotion.isActive}`);
        console.log(`[PROMO] - criterio:`, promotion.criterio);
        
        if (!promotion.isActive) {
          console.log(`[PROMO] - IGNORADA: inativa`);
          return;
        }

        // Verificar período de validade se especificado
        if (promotion.startDate || promotion.endDate) {
          const today = new Date().toISOString().split("T")[0];
          if (promotion.startDate && today < promotion.startDate) {
            console.log(`[PROMO] - IGNORADA: ainda não iniciou`);
            return;
          }
          if (promotion.endDate && today > promotion.endDate) {
            console.log(`[PROMO] - IGNORADA: já expirou`);
            return;
          }
        }

        let promotionApplied = false;
        let discount = 0;

        // Avaliar critérios
        const criteriaMatch = evaluateCriteria(promotion.criterio, items);
        console.log(`[PROMO] - Critérios atendidos: ${criteriaMatch}`);
        
        if (criteriaMatch) {
          if (promotion.discountType === "percentage") {
            discount = subtotal * (promotion.discount / 100);
          } else {
            discount = Math.min(promotion.discount, subtotal);
          }
          console.log(`[PROMO] - Desconto calculado: ${discount}`);
          promotionApplied = true;
        }
        // Promoção para produto específico (fallback)
        else if (promotion.productId) {
          const productItem = items.find(
            (item) => item.id === promotion.productId
          );

          if (productItem) {
            if (promotion.discountType === "percentage") {
              discount =
                productItem.preco *
                productItem.quantidadeSelecionada *
                (promotion.discount / 100);
            } else {
              discount = Math.min(
                promotion.discount,
                productItem.preco * productItem.quantidadeSelecionada
              );
            }
            console.log(`[PROMO] - Desconto por produto: ${discount}`);
            promotionApplied = true;
          }
        }

        if (promotionApplied) {
          // Aplicar limite máximo se especificado
          if (promotion.maxDiscount && discount > promotion.maxDiscount) {
            discount = promotion.maxDiscount;
          }

          totalDiscount += discount;
          applied.push({
            id: promotion.id,
            name: promotion.name,
            discount: discount,
            type: promotion.discountType,
          });
          console.log(`[PROMO] - APLICADA: ${promotion.name} com desconto ${discount}`);
        } else {
          console.log(`[PROMO] - NÃO APLICADA: ${promotion.name}`);
        }
      });
      
      console.log('[CALC PROMO] Total de desconto:', totalDiscount);
      console.log('[CALC PROMO] Promoções aplicadas:', applied);

      setAutomaticDiscount(totalDiscount);
      setAppliedPromotions(applied);

      // Atualizar o desconto no saleData
      setSaleData((prev) => ({
        ...prev,
        desconto: totalDiscount,
      }));
    },
    [promotions]
  );

  // Validar etapa atual
  const validateCurrentStep = async () => {
    const newErrors = {};

    switch (currentStep) {
      case 1: // Cliente
        if (!saleData.cliente.name.trim()) {
          newErrors.cliente = "Nome do cliente é obrigatório";
        } else {
          // Check if new client needs to be added
          const normalizedName = Customer.normalizeName(saleData.cliente.name);
          const existingClient = clientsRealTime.find(
            (client) =>
              client.id === normalizedName ||
              (client.name || client.nome) === saleData.cliente.name
          );
          if (!existingClient) {
            try {
              const customerData = {
                id: null,
                name: saleData.cliente.name.trim(),
                phone: saleData.cliente.phone || "",
              };
              const newCustomer = await Customer.addOrUpdate(customerData);
              selectClient(newCustomer);
              showToast("Novo cliente adicionado!", "success");
            } catch (error) {
              console.error("Erro ao adicionar novo cliente:", error);
              newErrors.cliente = "Erro ao adicionar cliente";
            }
          }
        }
        break;
      case 2: // Itens
        if (saleData.itens.length === 0) {
          newErrors.itens = "Adicione pelo menos um item";
        }
        break;
      case 3: // Pagamento
        // Valor pode ser 0 (venda pendente)
        if (saleData.valorPago < 0) {
          newErrors.pagamento = "Valor não pode ser negativo";
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Avançar para próxima etapa
  const nextStep = async () => {
    if (await validateCurrentStep()) {
      const totalComDesconto = valorTotal - (saleData.desconto || 0);
      if (currentStep === 3 && saleData.valorPago > totalComDesconto) {
        // Ir para etapa de troco
        setCurrentStep(4);
        // Inicializar devolver e doar com troco
        setDevolver(troco);
        setDoar(0);
        setDisplayDevolver(formatMoneyInput((troco * 100).toString()));
        setDisplayDoar("0,00");
      } else if (currentStep === 3) {
        // Sem troco, finalizar
        finalizeSale();
      } else if (currentStep === 4) {
        // Continuar da etapa de troco para finalizar
        finalizeSale();
      } else {
        setCurrentStep((prev) => prev + 1);
      }
    }
  };

  // Voltar para etapa anterior
  const prevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Finalizar venda
  const finalizeSale = async () => {
    setLoading(true);
    try {
      const { valorTotal, troco } = calculateTotals();
      const saleId = saleData.id || generateSaleId();
      console.log("Finalizando venda com ID:", saleId, "editSale:", !!editSale);
      const now = new Date();
      const totalComDesconto = valorTotal - (saleData.desconto || 0);
      const isPago = saleData.valorPago >= totalComDesconto;
      const isPartial = saleData.valorPago > 0 && saleData.valorPago < totalComDesconto;
      const paymentStatus = isPago ? "Pago" : isPartial ? "Parcial" : "Pendente";
      const allEntregue = saleData.itens.every((item) => item.entregue);
      const deliveryStatus = allEntregue ? "Entregue" : "Pendente";
      const saleStatus = deliveryStatus === "Entregue" ? "Entregue" : paymentStatus;

      const saleRecord = {
        id: saleId,
        vendedor: vendedor,
        cliente: saleData.cliente,
        itens: saleData.itens.map((item) => ({
          id: item.id,
          nome: item.nome,
          preco: item.preco,
          quantidade: item.quantidadeSelecionada,
          pago: item.pago,
          entregue: item.entregue,
        })),
        valorTotal,
        valorPago: saleData.valorPago,
        doacao: doar,
        troco: devolver,
        desconto: saleData.desconto || 0,
        status: saleStatus,
        statusPagamento: paymentStatus,
        deliveryStatus,
        pago: isPago,
        createdAt: editSale ? (editSale.createdAt || now) : now,
        updatedAt: now,
      };

      if (editSale) {
        const salesQuery = query(collection(db, "Vendas"), where("id", "==", saleId));
        const querySnapshot = await getDocs(salesQuery);
        if (!querySnapshot.empty) {
          const docToUpdate = querySnapshot.docs[0];
          await updateDoc(doc(db, "Vendas", docToUpdate.id), saleRecord);
        }
      } else {
        const salesCollection = collection(db, "Vendas");
        await addDoc(salesCollection, saleRecord);
      }

      if (!editSale) {
        for (const item of saleData.itens) {
          const itemRef = doc(db, "inventory", item.id);
          const itemSnap = await getDoc(itemRef);
          if (itemSnap.exists()) {
            const current = itemSnap.data();
            await updateDoc(itemRef, {
              quantity:
                (current.quantity || current.quantidade || 0) -
                item.quantidadeSelecionada,
            });
          }
        }
      }

      if (!editSale) {
        setSaleData((prev) => ({ ...prev, id: saleId, status: saleStatus }));
      } else {
        setSaleData((prev) => ({ ...prev, status: saleStatus }));
      }
      setCurrentStep(5);
      showToast(editSale ? "Venda atualizada!" : "Venda finalizada!", "success");
    } catch (error) {
      console.error("Erro:", error);
      setErrors({ finalizar: "Erro ao finalizar" });
      showToast("Erro ao finalizar", "error");
    } finally {
      setLoading(false);
    }
  };

  // Carregar promoções ativas
  useEffect(() => {
    const loadPromotions = async () => {
      try {
        const { Promotion } = await import("../models/Promotion");
        const activePromos = await Promotion.getActive();
        console.log("Promoções ativas carregadas:", activePromos);
        setPromotions(activePromos);
      } catch (error) {
        console.error("Erro ao carregar promoções:", error);
        setPromotions([]);
      }
    };
    loadPromotions();
  }, []);

  // Real-time listener para clientes
  useEffect(() => {
    const clientsQuery = query(collection(db, "customers"));
    const unsubscribe = onSnapshot(
      clientsQuery,
      (snapshot) => {
        const clientsData = [];
        snapshot.forEach((doc) => {
          clientsData.push({ id: doc.id, ...doc.data() });
        });
        setClientsRealTime(clientsData);
      },
      (error) => {
        console.error("Erro ao escutar clientes:", error);
        showToast("Erro ao carregar clientes em tempo real", "error");
      }
    );

    return () => unsubscribe();
  }, []);

  // Real-time listener para itens
  useEffect(() => {
    const itemsQuery = query(collection(db, "inventory"));
    const unsubscribe = onSnapshot(
      itemsQuery,
      (snapshot) => {
        const itemsData = [];
        snapshot.forEach((doc) => {
          itemsData.push({ id: doc.id, ...doc.data() });
        });
        setItemsRealTime(itemsData);
      },
      (error) => {
        console.error("Erro ao escutar itens:", error);
        showToast("Erro ao carregar estoque em tempo real", "error");
      }
    );

    return () => unsubscribe();
  }, []);

  // Recalcular descontos automáticos quando itens mudarem
  useEffect(() => {
    const itemsKey = saleData.itens.map(i => `${i.id}:${i.quantidadeSelecionada}`).join(',');
    console.log('[EFFECT] Itens mudaram:', itemsKey);
    if (saleData.itens.length > 0) {
      calculateAutomaticDiscounts(saleData.itens);
    } else {
      setAutomaticDiscount(0);
      setAppliedPromotions([]);
      setSaleData((prev) => ({ ...prev, desconto: 0 }));
    }
  }, [saleData.itens.map(i => `${i.id}:${i.quantidadeSelecionada}`).join(','), calculateAutomaticDiscounts]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (itemSearch.length >= 1) {
        searchItems(itemSearch);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [itemSearch]);

  // Debounce para busca de clientes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (clientSearch.length >= 1) {
        searchClients(clientSearch);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [clientSearch]);

  // Modo manual desabilitado - apenas itens da lista podem ser adicionados
  useEffect(() => {
    if (itemSearch.length === 0 && !temporaryItem) {
      setIsManualItem(false);
      setTempName("");
      setTempPreco(0);
      setTemporaryItem(null);
      setSearchExecuted(false);
    }
  }, [itemSearch, temporaryItem]);

  // Lógica de verificação de pagamento em tempo real
  useEffect(() => {
    if (saleData.itens.length === 0) return;

    const descontoTotal = saleData.desconto || 0;
    const itensSorted = [...saleData.itens].sort((a, b) => {
      const totalA = a.preco * a.quantidadeSelecionada;
      const totalB = b.preco * b.quantidadeSelecionada;
      return totalA - totalB;
    });

    const itensComDesconto = itensSorted.map((item, index) => {
      const itemTotal = item.preco * item.quantidadeSelecionada;
      if (index === itensSorted.length - 1) {
        return { ...item, valorComDesconto: Math.max(0, itemTotal - descontoTotal) };
      }
      return { ...item, valorComDesconto: itemTotal };
    });

    let cumulative = 0;
    let hasChanges = false;
    
    const itensComPagamento = itensComDesconto.map((item) => {
      cumulative += item.valorComDesconto;
      const shouldBePaid = saleData.valorPago >= cumulative;
      if (item.pago !== shouldBePaid) {
        hasChanges = true;
      }
      return { ...item, pago: shouldBePaid };
    });

    const updatedItens = saleData.itens.map((originalItem) => {
      const updatedItem = itensComPagamento.find(item => item.id === originalItem.id);
      return updatedItem || originalItem;
    });

    if (hasChanges) {
      setSaleData((prev) => ({
        ...prev,
        itens: updatedItens,
      }));
    }
  }, [saleData.valorPago, saleData.itens.length, saleData.desconto]);

  const { valorTotal, troco } = calculateTotals();

  // Função para alternar tema
  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    setIsDarkTheme(newTheme === "dark");
  };

  return (
    <div className="sales-creation">
      <div className="sales-header">

        <div className="step-indicator">
          <div className={`steps-container ${(() => {
            const totalComDesconto = valorTotal - (saleData.desconto || 0);
            const hasChange = saleData.valorPago > totalComDesconto;
            return hasChange ? 'has-five-steps' : '';
          })()}`}>
            {(() => {
              const totalComDesconto = valorTotal - (saleData.desconto || 0);
              const hasChange = saleData.valorPago > totalComDesconto;
              const steps = [
                { num: 1, label: "Cliente", icon: "1" },
                { num: 2, label: "Itens", icon: "2" },
                { num: 3, label: "Pagamento", icon: "3" },
                ...(hasChange ? [{ num: 4, label: "Troco", icon: "4" }] : []),
                { num: hasChange ? 5 : 4, label: "Finalizar", icon: hasChange ? "5" : "4" }
              ];
              
              return steps.map((step, index) => (
                <div key={step.num} className="step-wrapper">
                  <div className={`step-item ${
                    currentStep > step.num ? "completed" : 
                    currentStep === step.num ? "active" : "pending"
                  }`}>
                    <div className="step-circle">
                      {currentStep > step.num ? (
                        <span className="check-icon">✓</span>
                      ) : (
                        <span className="step-icon">{step.icon}</span>
                      )}
                    </div>
                    <div className="step-info">
                      <span className="step-label">{step.label}</span>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`step-connector ${
                      currentStep > step.num ? "completed" : ""
                    }`}></div>
                  )}
                </div>
              ));
            })()
            }
          </div>
        </div>
      </div>

      <div className="sales-content">
        {currentStep === 1 && !editSale && (
          <div className="step-content">
            <h2>👤 Identificação do Cliente</h2>

            <div className="client-form">
              <div className="form-group">
                <label>Nome do Cliente *</label>
                <div className="autocomplete-container">
                  <input
                    ref={clientInputRef}
                    type="text"
                    value={clientSelected ? "" : clientSearch}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setClientSearch(value);
                      setSaleData((prev) => ({
                        ...prev,
                        cliente: { ...prev.cliente, name: value },
                      }));
                      setClientSelected(false);
                      setShowClientSuggestions(true);
                    }}
                    onFocus={() => setShowClientSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowClientSuggestions(false), 200)
                    }
                    placeholder="Digite o nome do cliente..."
                    className={errors.cliente ? "error" : ""}
                  />
                  {showClientSuggestions && clientSuggestions.length > 0 && (
                    <div className="suggestions">
                      {clientSuggestions.map((client) => (
                        <div
                          key={client.id}
                          className="suggestion-item"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectClient(client);
                          }}
                        >
                          <span className="client-name">
                            {client.name || client.nome}
                          </span>
                          {client.phone && (
                            <span className="client-phone">{client.phone}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.cliente && (
                  <span className="error-message">{errors.cliente}</span>
                )}
              </div>

              {clientSelected && saleData.cliente.name && (
                <div className="selected-client">
                  <div className="client-badge">
                    <span className="badge-icon">✓</span>
                    <span className="badge-text">{saleData.cliente.name}</span>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Telefone do Cliente (Opcional)</label>
                <input
                  type="tel"
                  value={saleData.cliente.phone}
                  onChange={(e) =>
                    setSaleData((prev) => ({
                      ...prev,
                      cliente: { ...prev.cliente, phone: e.target.value },
                    }))
                  }
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>
        )}

        {/* Etapa 2: Seleção de Itens */}
        {currentStep === 2 && (
          <div className="step-content">
            <h2>🛍️ Seleção de Itens</h2>

            <div className="item-form">
              <div className="form-group">
                <label>Buscar Item</label>
                <div className="autocomplete-container">
                  <input
                    ref={itemInputRef}
                    type="text"
                    value={itemSearch}
                    onChange={(e) => {
                      const value = e.target.value;
                      setItemSearch(value);
                      setShowItemSuggestions(true);
                    }}
                    onFocus={() => setShowItemSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowItemSuggestions(false), 200)
                    }
                    placeholder="Digite o nome do item..."
                    className={errors.itens ? "error" : ""}
                  />
                  {showItemSuggestions && itemSuggestions.length > 0 && (
                    <div className="suggestions">
                      {itemSuggestions.map((item) => (
                        <div
                          key={item.id}
                          className="suggestion-item"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectItem(item);
                            setItemSearch(""); // Limpar o campo de busca
                            setIsManualItem(false);
                            setShowItemSuggestions(false);
                            setItemSuggestions([]);
                          }}
                        >
                          <span className="item-name">{item.nome}</span>
                          <span className="item-price">
                            {formatCurrency(item.preco)}
                          </span>
                          <span className="item-stock">
                            Estoque: {item.quantidade}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Painel temporário para quantidade e adicionar */}
              {temporaryItem && (
                <div className="temporary-item-panel">
                  <div className="temp-item-info">
                    <h4>{temporaryItem.nome}</h4>
                    <div className="temp-price">
                      <label>Preço Unitário:</label>
                      <span className="price-display">
                        {formatCurrency(temporaryItem.preco)}
                      </span>
                    </div>
                  </div>
                  <div className="temp-quantity-controls">
                    <button
                      onClick={() =>
                        setTempQuantity(Math.max(1, tempQuantity - 1))
                      }
                    >
                      -
                    </button>
                    <span>{tempQuantity}</span>
                    <button onClick={() => setTempQuantity(tempQuantity + 1)}>
                      +
                    </button>
                  </div>
                  <button
                    className="add-item-button"
                    onClick={addTemporaryToCart}
                    disabled={!temporaryItem}
                  >
                    ✓ Adicionar Item
                  </button>
                  <button
                    className="cancel-item-button"
                    onClick={() => {
                      setTemporaryItem(null);
                      setIsManualItem(false);
                      setTempQuantity(1);
                      setTempName("");
                      setTempPreco(0);
                      setItemSearch("");
                      setItemSuggestions([]);
                      setShowItemSuggestions(false);
                    }}
                  >
                    ✕ Cancelar
                  </button>
                </div>
              )}

              {errors.itens && (
                <span className="error-message">{errors.itens}</span>
              )}
            </div>

            {/* Lista de itens adicionados */}
            {saleData.itens.length > 0 && (
              <div className="selected-items">
                <h3>Itens Selecionados (Resumo):</h3>
                {saleData.itens.map((item) => (
                  <div key={item.id} className="item-card">
                    <h4 className="item-title">{item.nome}</h4>
                    <div className="item-details-row">
                      <span data-label="Preço">
                        {formatCurrency(item.preco)}
                      </span>
                      <span data-label="Qtd">
                        {item.quantidadeSelecionada}
                      </span>
                      {item.quantidadeDisponivel !== Infinity && (
                        <span data-label="Estoque">
                          {item.quantidadeDisponivel}
                        </span>
                      )}
                    </div>
                    <div className="item-controls">
                      <div className="quantity-controls">
                        <button
                          onClick={() =>
                            updateItemQuantity(
                              item.id,
                              item.quantidadeSelecionada - 1
                            )
                          }
                          disabled={item.quantidadeSelecionada <= 1}
                        >
                          -
                        </button>
                        <span className="quantity-display">
                          {item.quantidadeSelecionada}
                        </span>
                        <button
                          onClick={() =>
                            updateItemQuantity(
                              item.id,
                              item.quantidadeSelecionada + 1
                            )
                          }
                          disabled={
                            typeof item.quantidadeDisponivel === "number" &&
                            item.quantidadeSelecionada >=
                              item.quantidadeDisponivel
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="item-subtotal">
                      Subtotal:{" "}
                      {formatCurrency(item.preco * item.quantidadeSelecionada)}
                    </div>
                    <button
                      className="remove-item"
                      onClick={() => removeItem(item.id)}
                    >
                      🗑️ Remover
                    </button>
                  </div>
                ))}

                {/* Card de descontos automáticos */}
                {appliedPromotions.length > 0 && (
                  <div className="automatic-discount-card">
                    <div className="discount-header">
                      <span className="discount-icon">🎉</span>
                      <h4>Promoções Automáticas Aplicadas</h4>
                    </div>

                    <div className="applied-promotions">
                      {appliedPromotions.map((promo) => {
                        // Encontrar a promoção original para mostrar detalhes
                        const originalPromo = promotions.find(
                          (p) => p.id === promo.id
                        );
                        return (
                          <div key={promo.id} className="promotion-item">
                            <div className="promo-info">
                              <span className="promo-name">{promo.name}</span>
                              <span className="promo-discount">
                                -{formatCurrency(promo.discount)}
                              </span>
                              {originalPromo && (
                                <div className="promo-criteria">
                                  {originalPromo.startDate && (
                                    <small className="promo-detail">
                                      📅 Válida até:{" "}
                                      {originalPromo.endDate || "sem fim"}
                                    </small>
                                  )}
                                  {originalPromo.criteria &&
                                    originalPromo.criteria.length > 0 && (
                                      <small className="promo-detail">
                                        🎯 Critérios aplicados
                                      </small>
                                    )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="discount-total">
                      <strong>Total de Desconto:</strong>
                      <strong className="discount-amount">
                        -{formatCurrency(automaticDiscount)}
                      </strong>
                    </div>
                  </div>
                )}

                <div className="total-resumo">
                  <h4>
                    Valor Total:{" "}
                    {formatCurrency(valorTotal - automaticDiscount)}
                  </h4>
                  {automaticDiscount > 0 && (
                    <p className="discount-info">
                      (Desconto aplicado: -{formatCurrency(automaticDiscount)})
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Pagamento */}
        {currentStep === 3 && (
          <div className="step-content">
            <h2>💰 Pagamento</h2>

            <div className="payment-form">
              <div className="form-group">
                <label>Valor Total a Pagar</label>
                <p className="total-display">
                  {formatCurrency(valorTotal - (saleData.desconto || 0))}
                </p>
              </div>

              <div className="form-group">
                <label>Valor Recebido *</label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={displayValorPago}
                  onChange={handleValorPagoChange}
                  onFocus={(e) => {
                    if (e.target.value === "0,00") {
                      setDisplayValorPago("");
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value === "") {
                      setDisplayValorPago("0,00");
                      setSaleData((prev) => ({ ...prev, valorPago: 0 }));
                    }
                  }}
                  placeholder="0,00"
                  className={errors.pagamento ? "error" : ""}
                  style={{ fontSize: '18px', padding: '12px' }}
                />
                {errors.pagamento && (
                  <span className="error-message">{errors.pagamento}</span>
                )}
              </div>

              {saleData.valorPago === 0 && (
                <div className="pending-stripe">
                  <p>🟡 Venda Pendente - Nenhum pagamento</p>
                </div>
              )}
              {saleData.valorPago > 0 && saleData.valorPago < valorTotal - (saleData.desconto || 0) && (
                <div className="partial-stripe">
                  <p>🟠 Pagamento Parcial - Falta: {formatCurrency(valorTotal - (saleData.desconto || 0) - saleData.valorPago)}</p>
                </div>
              )}
              {saleData.valorPago >= valorTotal - (saleData.desconto || 0) && (
                <div className="paid-stripe">
                  <p>✅ Pagamento Completo</p>
                </div>
              )}

              {troco > 0 && (
                <div className="troco-display">
                  <h3>Troco: {formatCurrency(troco)}</h3>
                </div>
              )}

              <div className="payment-items">
                <h3>Controle dos Itens</h3>
                <div className="payment-items-list">
                  {saleData.itens.map((item) => (
                    <div key={item.id} className="payment-item-row">
                      <div className="item-basic-info">
                        <span className="item-name">{item.nome}</span>
                        <span className="item-quantity">
                          Qtd: {item.quantidadeSelecionada}
                        </span>
                        <span className="item-total">
                          Total:{" "}
                          {formatCurrency(
                            item.preco * item.quantidadeSelecionada
                          )}
                        </span>
                      </div>
                      <div className="item-toggle-group">
                        <label className="status-toggle">
                          <input type="checkbox" checked={item.pago} disabled />
                          <span className="toggle-switch"></span>
                          <span className="toggle-label">Pago</span>
                        </label>
                        <label className="status-toggle">
                          <input
                            type="checkbox"
                            checked={item.entregue}
                            onChange={() =>
                              toggleItemStatus(item.id, "entregue")
                            }
                          />
                          <span className="toggle-switch"></span>
                          <span className="toggle-label">Entregue</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Troco */}
        {currentStep === 4 && (
          <div className="step-content">
            <h2>💰 Troco</h2>

            <div className="change-form">
              <div className="change-amount">
                <h3>Valor do Troco: {formatCurrency(troco)}</h3>
              </div>

              <div className="change-inputs">
                <div className="form-group">
                  <label>Devolver</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={displayDevolver}
                    onChange={(e) => {
                      const input = e.target.value;
                      const digitsOnly = input.replace(/\D/g, '');
                      
                      if (digitsOnly === '') {
                        setDisplayDevolver('0,00');
                        setDevolver(0);
                        setDoar(troco);
                        setDisplayDoar(formatMoneyInput((troco * 100).toString()));
                        return;
                      }
                      
                      const numValue = parseInt(digitsOnly, 10) / 100;
                      if (numValue > troco) {
                        return;
                      }
                      
                      const formatted = formatMoneyInput(digitsOnly);
                      setDisplayDevolver(formatted);
                      const newDevolver = numValue;
                      const newDoar = troco - newDevolver;
                      setDevolver(newDevolver);
                      setDoar(newDoar);
                      setDisplayDoar(formatMoneyInput((newDoar * 100).toString()));
                    }}
                    onFocus={(e) => {
                      if (e.target.value === "0,00") {
                        setDisplayDevolver("");
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        setDisplayDevolver("0,00");
                        setDevolver(0);
                        setDoar(troco);
                        setDisplayDoar(formatMoneyInput((troco * 100).toString()));
                      }
                    }}
                    placeholder="0,00"
                    style={{ fontSize: '18px', padding: '12px' }}
                  />
                </div>

                <div className="form-group">
                  <label>Doar</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={displayDoar}
                    onChange={(e) => {
                      const input = e.target.value;
                      const digitsOnly = input.replace(/\D/g, '');
                      
                      if (digitsOnly === '') {
                        setDisplayDoar('0,00');
                        setDoar(0);
                        setDevolver(troco);
                        setDisplayDevolver(formatMoneyInput((troco * 100).toString()));
                        return;
                      }
                      
                      const numValue = parseInt(digitsOnly, 10) / 100;
                      if (numValue > troco) {
                        return;
                      }
                      
                      const formatted = formatMoneyInput(digitsOnly);
                      setDisplayDoar(formatted);
                      const newDoar = numValue;
                      const newDevolver = troco - newDoar;
                      setDoar(newDoar);
                      setDevolver(newDevolver);
                      setDisplayDevolver(formatMoneyInput((newDevolver * 100).toString()));
                    }}
                    onFocus={(e) => {
                      if (e.target.value === "0,00") {
                        setDisplayDoar("");
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === "") {
                        setDisplayDoar("0,00");
                        setDoar(0);
                        setDevolver(troco);
                        setDisplayDevolver(formatMoneyInput((troco * 100).toString()));
                      }
                    }}
                    placeholder="0,00"
                    style={{ fontSize: '18px', padding: '12px' }}
                  />
                </div>
              </div>

              <div className="change-button">
                <button
                  className="nav-button finalize"
                  onClick={() => {
                    if (doar === troco) {
                      setDevolver(troco);
                      setDoar(0);
                      setDisplayDevolver(formatMoneyInput((troco * 100).toString()));
                      setDisplayDoar("0,00");
                    } else {
                      setDoar(troco);
                      setDevolver(0);
                      setDisplayDoar(formatMoneyInput((troco * 100).toString()));
                      setDisplayDevolver("0,00");
                    }
                  }}
                >
                  {doar === troco ? "Devolver Tudo" : "Doar Tudo"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: QRCode */}
        {currentStep === 5 && (
          <div className="step-content">
            <h2>✅ Venda Finalizada</h2>

            <div className="success-message">
              <div className="qr-container">
                <QRCodeCanvas
                  value={saleData.id}
                  size={120}
                  level="H"
                  includeMargin={false}
                  marginSize={0}
                  id="qrcode-canvas"
                />
              </div>
              <button
                className="share-button"
                onClick={async () => {
                  const receiptElement = document.getElementById('receipt-to-share');
                  try {
                    const canvas = await html2canvas(receiptElement, {
                      backgroundColor: '#ffffff',
                      scale: 2
                    });
                    
                    canvas.toBlob(async (blob) => {
                      const file = new File([blob], 'comprovante-venda.png', { type: 'image/png' });
                      
                      if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({ files: [file] });
                      } else {
                        const link = document.createElement('a');
                        link.download = 'comprovante-venda.png';
                        link.href = canvas.toDataURL();
                        link.click();
                      }
                    });
                  } catch (err) {
                    console.log('Erro ao gerar imagem:', err);
                  }
                }}
              >
                📤 Compartilhar Comprovante
              </button>
            </div>

            <div id="receipt-to-share" className="receipt-to-share">
              <div className="receipt-header">
                <h2>🧾 COMPROVANTE DE VENDA</h2>
                <p className="receipt-id">ID: {saleData.id}</p>
              </div>
              
              <div className="receipt-qr">
                <QRCodeCanvas
                  value={saleData.id}
                  size={150}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="receipt-info">
                <div className="receipt-row">
                  <span className="receipt-label">Vendedor:</span>
                  <span className="receipt-value">{vendedor}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Cliente:</span>
                  <span className="receipt-value">{saleData.cliente.name}</span>
                </div>
                
                <div className="receipt-divider"></div>
                
                <div className="receipt-items">
                  <h3>Itens:</h3>
                  {saleData.itens.map((item, index) => (
                    <div key={index} className="receipt-item">
                      <span>{item.nome} x{item.quantidadeSelecionada}</span>
                      <span>{formatCurrency(item.preco * item.quantidadeSelecionada)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="receipt-divider"></div>
                
                <div className="receipt-row">
                  <span className="receipt-label">Total:</span>
                  <span className="receipt-value">{formatCurrency(valorTotal)}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Desconto:</span>
                  <span className="receipt-value">{formatCurrency(saleData.desconto || 0)}</span>
                </div>
                <div className="receipt-row receipt-highlight">
                  <span className="receipt-label">Valor Pago:</span>
                  <span className="receipt-value">{formatCurrency(saleData.valorPago)}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Troco:</span>
                  <span className="receipt-value">{formatCurrency(troco)}</span>
                </div>
                
                <div className="receipt-divider"></div>
                
                <div className="receipt-row">
                  <span className="receipt-label">Status:</span>
                  <span className="receipt-value receipt-status">{saleData.status}</span>
                </div>
              </div>
              
              <div className="receipt-footer">
                <p>Obrigado pela preferência!</p>
              </div>
            </div>

            <div className="qr-code-section">
              <h3>ID da Venda</h3>
              <div className="sale-id-display">
                <strong>{saleData.id}</strong>
              </div>
              <p className="qr-instruction">
                Use este ID para localizar a venda no histórico.
              </p>
            </div>

            <div className="final-summary">
              <h3>Resumo Final</h3>
              <div className="summary-details">
                <p>
                  <strong>Vendedor:</strong> {vendedor}
                </p>
                <p>
                  <strong>Cliente:</strong> {saleData.cliente.name}
                </p>
                <p>
                  <strong>Total:</strong> {formatCurrency(valorTotal)}
                </p>
                <p>
                  <strong>Desconto:</strong> {formatCurrency(saleData.desconto)}
                </p>
                <p>
                  <strong>Valor Pago:</strong>{" "}
                  {formatCurrency(saleData.valorPago)}
                </p>
                <p>
                  <strong>Troco:</strong> {formatCurrency(troco)}
                </p>
                <p>
                  <strong>Status:</strong> {saleData.status}
                </p>
              </div>
            </div>

            <div className="receipt-section">
              <h3>Comprovante de Venda</h3>
              <div className="receipt-details">
                <p>
                  <strong>ID:</strong> {saleData.id}
                </p>
                <p>
                  <strong>Vendedor:</strong> {vendedor}
                </p>
                <p>
                  <strong>Cliente:</strong> {saleData.cliente.name}
                </p>
                <p>
                  <strong>Itens:</strong>
                </p>
                <ul>
                  {saleData.itens.map((item) => (
                    <li key={item.id}>
                      {item.nome} x{item.quantidadeSelecionada} -{" "}
                      {formatCurrency(item.preco * item.quantidadeSelecionada)}
                    </li>
                  ))}
                </ul>
                <p>
                  <strong>Total:</strong> {formatCurrency(valorTotal)}
                </p>
                <p>
                  <strong>Desconto:</strong>{" "}
                  {formatCurrency(saleData.desconto || 0)}
                </p>
                <p>
                  <strong>Valor Pago:</strong>{" "}
                  {formatCurrency(saleData.valorPago)}
                </p>
                <p>
                  <strong>Troco:</strong> {formatCurrency(troco)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botões de Navegação */}
        <div className="navigation-buttons">
          {currentStep > 1 && currentStep < 5 && !editSale && (
            <button className="nav-button prev" onClick={prevStep}>
              ← Anterior
            </button>
          )}
          
          {currentStep > 2 && currentStep < 5 && editSale && (
            <button className="nav-button prev" onClick={prevStep}>
              ← Anterior
            </button>
          )}

          {currentStep < 3 && (
            <button className="nav-button next" onClick={nextStep}>
              Continuar →
            </button>
          )}

          {currentStep === 3 && (
            <button className="nav-button next" onClick={nextStep}>
              Continuar →
            </button>
          )}

          {currentStep === 4 && (
            <button className="nav-button finalize" onClick={nextStep}>
              Finalizar Venda
            </button>
          )}

          {currentStep === 5 && (
            <button
              className="nav-button new"
              onClick={() => window.location.reload()}
            >
              Nova Venda
            </button>
          )}
        </div>

        {errors.finalizar && (
          <div className="error-message global">{errors.finalizar}</div>
        )}
      </div>
    </div>
  );
};

export default SalesCreation;
