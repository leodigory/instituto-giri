class Promotion {
  constructor(
    id,
    name,
    discount,
    discountType,
    criterio = [],
    productId = null,
    productName = null,
    isActive = true,
    startDate = null,
    endDate = null,
    minQuantity = 1,
    maxDiscount = null
  ) {
    this.id = id;
    this.name = name;
    this.discount = discount;
    this.discountType = discountType; // 'percentage' or 'fixed'
    this.criterio = criterio; // Array de critérios avançados
    this.productId = productId;
    this.productName = productName;
    this.isActive = isActive;
    this.startDate = startDate; // Data de início (YYYY-MM-DD)
    this.endDate = endDate; // Data de fim (YYYY-MM-DD)
    this.minQuantity = minQuantity; // Quantidade mínima para aplicar
    this.maxDiscount = maxDiscount; // Desconto máximo permitido
  }

  // Método para verificar se a promoção está ativa hoje
  isValidToday() {
    if (!this.isActive) return false;

    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

    if (this.startDate && this.startDate > todayStr) return false;
    if (this.endDate && this.endDate < todayStr) return false;

    return true;
  }

  // Método para verificar se atende aos critérios de produtos
  matchesProductCriteria(itemName, itemQuantity = 1) {
    if (!this.criterio || this.criterio.length === 0) return true;

    for (let criterion of this.criterio) {
      if (criterion.type === "product_quantity") {
        // Verifica se o produto específico tem quantidade mínima
        if (criterion.productName.toLowerCase() === itemName.toLowerCase()) {
          return itemQuantity >= criterion.minQuantity;
        }
      } else if (criterion.type === "product_combo") {
        // Para combos, será verificado no método evaluateAdvancedCriteria
        continue;
      }
    }

    return true;
  }

  // Método avançado para avaliar critérios
  evaluateAdvancedCriteria(items) {
    if (!this.isValidToday()) return false;

    if (!this.criterio || this.criterio.length === 0) return true;

    let totalQuantity = 0;
    let productMatches = {};

    // Primeiro, verificar critérios de quantidade mínima
    for (let criterion of this.criterio) {
      if (criterion.type === "product_quantity") {
        let foundQuantity = 0;
        for (let item of items) {
          if (
            item.nome
              .trim()
              .toLowerCase()
              .includes(criterion.productName.trim().toLowerCase()) ||
            criterion.productName
              .trim()
              .toLowerCase()
              .includes(item.nome.trim().toLowerCase())
          ) {
            foundQuantity += item.quantidadeSelecionada;
          }
        }
        if (foundQuantity < criterion.minQuantity) {
          return false;
        }
      } else if (criterion.type === "total_quantity") {
        // Soma total de itens no carrinho
        totalQuantity = items.reduce(
          (sum, item) => sum + item.quantidadeSelecionada,
          0
        );
        if (totalQuantity < criterion.minQuantity) {
          return false;
        }
      } else if (criterion.type === "product_combo") {
        // Verificar combinação exata de produtos
        console.log(
          "Evaluating product_combo, items:",
          items.map((i) => i.nome)
        );
        const requiredProducts = criterion.products || [];
        console.log("Required products:", requiredProducts);
        const cartProductNames = items.map((item) =>
          item.nome.trim().toLowerCase()
        );
        console.log("Cart product names:", cartProductNames);

        for (let required of requiredProducts) {
          const requiredLower = required.trim().toLowerCase();
          const inCart = cartProductNames.includes(requiredLower);
          console.log(
            "Required:",
            required,
            "lower:",
            requiredLower,
            "in cart:",
            inCart
          );
          if (!inCart) {
            console.log("Not all required products in cart, return false");
            return false;
          }
        }
        console.log("All required products in cart, continue");
      }
    }

    return true;
  }

  calculateDiscount(subtotal, items = []) {
    if (!this.evaluateAdvancedCriteria(items)) {
      return 0;
    }

    let discount = 0;

    if (this.discountType === "percentage") {
      discount = subtotal * (this.discount / 100);
    } else {
      discount = Math.min(this.discount, subtotal);
    }

    // Aplicar limite máximo de desconto se especificado
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }

    return discount;
  }

  static async getAll() {
    try {
      const { collection, getDocs, query, orderBy } = await import(
        "firebase/firestore"
      );
      const { db } = await import("../firebase/config");

      const promotionsQuery = query(
        collection(db, "promotions"),
        orderBy("name")
      );
      const snapshot = await getDocs(promotionsQuery);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Erro ao buscar promoções:", error);
      return [];
    }
  }

  static async getActive() {
    try {
      const { collection, getDocs, query, where } = await import(
        "firebase/firestore"
      );
      const { db } = await import("../firebase/config");

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      const promotionsQuery = query(
        collection(db, "promotions"),
        where("isActive", "==", true)
      );
      const snapshot = await getDocs(promotionsQuery);

      // Filtrar adicionalmente por datas válidas e ordenar por nome
      const validPromotions = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((promo) => {
          if (promo.startDate && promo.startDate > todayStr) return false;
          if (promo.endDate && promo.endDate < todayStr) return false;
          return true;
        })
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      return validPromotions;
    } catch (error) {
      console.error("Erro ao buscar promoções ativas:", error);
      return [];
    }
  }

  static async add(promotionData) {
    try {
      const { collection, addDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );
      const { db } = await import("../firebase/config");

      const docRef = await addDoc(collection(db, "promotions"), {
        ...promotionData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return { id: docRef.id, ...promotionData };
    } catch (error) {
      console.error("Erro ao adicionar promoção:", error);
      throw error;
    }
  }

  static async update(id, updateData) {
    try {
      const { doc, updateDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );
      const { db } = await import("../firebase/config");

      await updateDoc(doc(db, "promotions", id), {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Erro ao atualizar promoção:", error);
      throw error;
    }
  }

  static async delete(id) {
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase/config");

      await deleteDoc(doc(db, "promotions", id));
    } catch (error) {
      console.error("Erro ao deletar promoção:", error);
      throw error;
    }
  }
}

export { Promotion };
