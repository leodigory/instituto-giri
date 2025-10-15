import { db } from '../firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, where } from 'firebase/firestore';

const COLLECTION = 'reunioes';

export const reunioesService = {
  // Criar reunião
  async criarReuniao(reuniao) {
    const ref = await addDoc(collection(db, COLLECTION), {
      ...reuniao,
      status: 'agendada',
      presentes: [],
      timestamp: new Date().toISOString()
    });
    return ref.id;
  },

  // Listar reuniões
  async listarReunioes() {
    const q = query(collection(db, COLLECTION), orderBy('data_hora', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Atualizar reunião
  async atualizarReuniao(id, dados) {
    await updateDoc(doc(db, COLLECTION, id), dados);
  },

  // Excluir reunião
  async excluirReuniao(id) {
    await deleteDoc(doc(db, COLLECTION, id));
  }
};
