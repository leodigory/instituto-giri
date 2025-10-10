import { useState, useEffect, useCallback } from "react";
import { useFirebase } from "./useFirebase";
import Sale from "../models/Sale";

export const useSales = () => {
  const { getDocuments, addDocument, updateDocument, deleteDocument } =
    useFirebase();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch sales from nested structure: /Vendas/{year}/{month}/{day}
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const salesData = [];

      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("../firebase/config");

      const salesCollectionRef = collection(db, "Vendas");
      const querySnapshot = await getDocs(salesCollectionRef);

      querySnapshot.forEach((doc) => {
        salesData.push({
          id: doc.id,
          ...doc.data(),
          date: doc.data().createdAt
        });
      });

      const salesObjects = salesData.map((data) => new Sale(data));
      setSales(salesObjects);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getDocuments]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const addSale = async (saleData) => {
    try {
      const { collection, addDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase/config");

      const docRef = await addDoc(collection(db, "Vendas"), saleData);
      const newSale = new Sale({ ...saleData, id: docRef.id });
      setSales((prev) => [...prev, newSale]);
      return docRef.id;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateSale = async (id, saleData) => {
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase/config");

      const saleRef = doc(db, "Vendas", id);
      await updateDoc(saleRef, saleData);

      setSales((prev) =>
        prev.map((sale) =>
          sale.id === id ? new Sale({ ...sale, ...saleData }) : sale
        )
      );
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const removeSale = async (id) => {
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db } = await import("../firebase/config");

      const saleRef = doc(db, "Vendas", id);
      await deleteDoc(saleRef);

      setSales((prev) => prev.filter((sale) => sale.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const getSalesByDateRange = (startDate, endDate) => {
    return sales.filter((sale) => {
      const saleDate = new Date(sale.date);
      return saleDate >= startDate && saleDate <= endDate;
    });
  };

  const getTotalSales = () => {
    return sales.reduce((total, sale) => total + sale.amount, 0);
  };

  const getSalesByStatus = (status) => {
    return sales.filter((sale) => sale.status === status);
  };

  return {
    sales,
    loading,
    error,
    addSale,
    updateSale,
    removeSale,
    fetchSales,
    getSalesByDateRange,
    getTotalSales,
    getSalesByStatus,
  };
};
