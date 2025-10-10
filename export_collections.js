const { initializeApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");
const fs = require("fs");

const firebaseConfig = {
  apiKey: "AIzaSyCkEYlreLoQFqrdN8eKASS20a6DaLpJtYE",
  authDomain: "lista-de-compras-f67aa.firebaseapp.com",
  projectId: "lista-de-compras-f67aa",
  storageBucket: "lista-de-compras-f67aa.firebasestorage.app",
  messagingSenderId: "276613236544",
  appId: "1:276613236544:web:b5419812728802e013dca5",
  measurementId: "G-2HFQ3BGVVF",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function exportCollection(collectionName) {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const data = [];
    querySnapshot.forEach((doc) => {
      data.push({
        id: doc.id,
        ...doc.data(),
      });
    });
    return data;
  } catch (error) {
    console.error(`Erro ao exportar coleção ${collectionName}:`, error);
    return [];
  }
}

async function main() {
  const collections = [
    "inventory",
    "Vendas",
    "customers",
    "Promotions",
    "Users",
  ];

  const allData = {};

  for (const col of collections) {
    console.log(`Exportando coleção: ${col}`);
    allData[col] = await exportCollection(col);
  }

  // Salvar em arquivo JSON
  fs.writeFileSync(
    "firebase_collections_export.json",
    JSON.stringify(allData, null, 2)
  );
  console.log(
    "Exportação concluída! Arquivo: firebase_collections_export.json"
  );
}

main().catch(console.error);
