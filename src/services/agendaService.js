import { db } from '../firebase/config';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, where } from 'firebase/firestore';

const COLLECTION = 'agenda';

export const agendaService = {
  // Criar evento
  async criarEvento(evento) {
    const ref = await addDoc(collection(db, COLLECTION), {
      ...evento,
      timestamp: new Date().toISOString()
    });
    return ref.id;
  },

  // Listar eventos
  async listarEventos(filtroRole = null) {
    const q = filtroRole 
      ? query(collection(db, COLLECTION), where('publico_alvo', 'array-contains', filtroRole))
      : collection(db, COLLECTION);
    
    const snapshot = await getDocs(q);
    const eventos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Ordenar manualmente por data
    eventos.sort((a, b) => new Date(a.data_hora) - new Date(b.data_hora));
    
    return eventos;
  },

  // Atualizar evento
  async atualizarEvento(id, dados) {
    await updateDoc(doc(db, COLLECTION, id), dados);
  },

  // Excluir evento
  async excluirEvento(id) {
    await deleteDoc(doc(db, COLLECTION, id));
  }
};
