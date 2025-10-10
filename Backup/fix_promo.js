// Script para corrigir a promoção "PROMO 5 ITENS"
// Execute: node fix_promo.js

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Você precisa baixar isso do Firebase Console

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixPromotion() {
  try {
    const promotionsRef = db.collection('promotions');
    const snapshot = await promotionsRef.where('name', '==', 'PROMO 5 ITENS').get();
    
    if (snapshot.empty) {
      console.log('Promoção "PROMO 5 ITENS" não encontrada');
      return;
    }
    
    snapshot.forEach(async (doc) => {
      await doc.ref.update({
        criterio: [{
          type: 'total_quantity',
          minQuantity: 5
        }]
      });
      console.log('Promoção atualizada com sucesso!');
    });
  } catch (error) {
    console.error('Erro:', error);
  }
}

fixPromotion();
