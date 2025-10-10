const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} = require("firebase/firestore");

// Configuração do Firebase (substitua pelas suas credenciais)
const firebaseConfig = {
  // Adicione sua configuração do Firebase aqui
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateSalesToDaysStructure() {
  console.log("🚀 Iniciando migração de vendas para estrutura por dias...");

  try {
    // Buscar todas as vendas existentes
    const salesRef = collection(db, "Vendas");
    const salesSnapshot = await getDocs(salesRef);

    if (salesSnapshot.empty) {
      console.log("ℹ️ Nenhuma venda encontrada para migrar.");
      return;
    }

    console.log(`📊 Encontradas ${salesSnapshot.size} vendas para migrar.`);

    let migratedCount = 0;
    let errorCount = 0;

    // Processar cada venda
    for (const saleDoc of salesSnapshot.docs) {
      try {
        const saleData = saleDoc.data();
        const saleId = saleDoc.id;

        // Verificar se já tem createdAt
        if (!saleData.createdAt) {
          console.log(`⚠️ Venda ${saleId} não tem data de criação. Pulando...`);
          continue;
        }

        // Extrair data
        const createdAt = saleData.createdAt.toDate
          ? saleData.createdAt.toDate()
          : new Date(saleData.createdAt);

        const year = createdAt.getFullYear();
        const month = String(createdAt.getMonth() + 1).padStart(2, "0");
        const day = String(createdAt.getDate()).padStart(2, "0");

        // Criar nova estrutura de dados
        const migratedSaleData = {
          ...saleData,
          id: saleId, // Manter o ID original
          migratedAt: new Date(),
          originalId: saleId,
        };

        // Adicionar na nova estrutura
        const newDocRef = await addDoc(
          collection(db, "Vendas", year, month, day),
          migratedSaleData
        );

        console.log(
          `✅ Venda ${saleId} migrada para ${year}/${month}/${day} com novo ID: ${newDocRef.id}`
        );

        // Opcional: remover da estrutura antiga após confirmação
        // await deleteDoc(doc(db, 'Vendas', saleId));

        migratedCount++;

        // Pequena pausa para não sobrecarregar
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Erro ao migrar venda ${saleDoc.id}:`, error);
        errorCount++;
      }
    }

    console.log(`\n🎉 Migração concluída!`);
    console.log(`✅ Vendas migradas: ${migratedCount}`);
    console.log(`❌ Erros: ${errorCount}`);

    if (errorCount === 0) {
      console.log(
        "\n💡 Dica: Após verificar que tudo está correto, você pode remover as vendas da coleção antiga."
      );
    }
  } catch (error) {
    console.error("💥 Erro geral na migração:", error);
  }
}

// Função para verificar estrutura migrada
async function verifyMigration() {
  console.log("🔍 Verificando estrutura migrada...");

  try {
    const salesRef = collection(db, "Vendas");
    const salesSnapshot = await getDocs(salesRef);

    console.log(`📁 Vendas na estrutura antiga: ${salesSnapshot.size}`);

    // Verificar alguns anos/meses
    const years = ["2023", "2024"];
    let totalMigrated = 0;

    for (const year of years) {
      for (let month = 1; month <= 12; month++) {
        const monthStr = String(month).padStart(2, "0");
        try {
          const monthRef = collection(db, "Vendas", year, monthStr);
          const monthSnapshot = await getDocs(monthRef);

          if (!monthSnapshot.empty) {
            console.log(`📅 ${year}/${monthStr}: ${monthSnapshot.size} vendas`);
            totalMigrated += monthSnapshot.size;
          }
        } catch (error) {
          // Coleção não existe, continuar
        }
      }
    }

    console.log(`📊 Total de vendas migradas encontradas: ${totalMigrated}`);
  } catch (error) {
    console.error("❌ Erro ao verificar migração:", error);
  }
}

// Função para limpar estrutura antiga (usar com cuidado!)
async function cleanupOldStructure() {
  console.log("🧹 Limpando estrutura antiga...");
  console.log("⚠️ Esta operação é irreversível!");

  const confirm = process.argv.includes("--confirm");
  if (!confirm) {
    console.log("Para confirmar a limpeza, execute com --confirm");
    return;
  }

  try {
    const salesRef = collection(db, "Vendas");
    const salesSnapshot = await getDocs(salesRef);

    let deletedCount = 0;
    for (const saleDoc of salesSnapshot.docs) {
      await deleteDoc(doc(db, "Vendas", saleDoc.id));
      deletedCount++;
    }

    console.log(`🗑️ Removidas ${deletedCount} vendas da estrutura antiga.`);
  } catch (error) {
    console.error("❌ Erro ao limpar estrutura antiga:", error);
  }
}

// Executar migração
async function main() {
  const command = process.argv[2];

  switch (command) {
    case "migrate":
      await migrateSalesToDaysStructure();
      break;
    case "verify":
      await verifyMigration();
      break;
    case "cleanup":
      await cleanupOldStructure();
      break;
    default:
      console.log("📖 Uso:");
      console.log("  node migrate_sales_days.js migrate  - Migrar vendas");
      console.log("  node migrate_sales_days.js verify   - Verificar migração");
      console.log(
        "  node migrate_sales_days.js cleanup  - Limpar estrutura antiga (--confirm para confirmar)"
      );
      break;
  }

  process.exit(0);
}

main().catch(console.error);
