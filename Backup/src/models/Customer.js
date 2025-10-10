class Customer {
  constructor(id, name, phone, email = "", createdAt = null) {
    this.id = id;
    this.name = name;
    this.phone = phone;
    this.email = email;
    this.createdAt = createdAt;
  }

  static normalizeName(name) {
    return name.toUpperCase().trim();
  }

  static async getAll() {
    try {
      const { collection, getDocs, query, orderBy } = await import(
        "firebase/firestore"
      );
      const { db } = await import("../firebase/config");

      const customersQuery = query(
        collection(db, "customers"),
        orderBy("name")
      );
      const snapshot = await getDocs(customersQuery);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        name: doc.data().name || doc.id,
      }));
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      return [];
    }
  }

  static async addOrUpdate(customerData) {
    try {
      const { doc, setDoc, serverTimestamp } = await import(
        "firebase/firestore"
      );
      const { db } = await import("../firebase/config");

      const normalizedName = Customer.normalizeName(customerData.name);
      const customerRef = doc(db, "customers", normalizedName);

      const customerDoc = {
        name: normalizedName,
        phone: customerData.phone || "",
        email: customerData.email || "",
        updatedAt: serverTimestamp(),
      };

      if (!customerData.id) {
        customerDoc.createdAt = serverTimestamp();
      }

      await setDoc(customerRef, customerDoc, { merge: true });
      return { id: normalizedName, ...customerDoc };
    } catch (error) {
      console.error("Erro ao salvar cliente:", error);
      throw error;
    }
  }
}

export { Customer };
