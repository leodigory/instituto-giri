import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const syncCalendarService = {
  // Buscar usuários que autorizaram sincronização e fazem parte do público-alvo
  async buscarUsuariosSincronizados(publicoAlvo) {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('google_calendar_vinculado', '==', true)
      );
      
      const snapshot = await getDocs(usersQuery);
      const usuarios = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => publicoAlvo.includes(user.role));
      
      return usuarios;
    } catch (error) {
      console.error('Erro ao buscar usuários sincronizados:', error);
      return [];
    }
  },

  // Notificar usuários sobre evento (criar/editar/excluir)
  async notificarUsuarios(usuarios, evento) {
    const acao = evento.acao || 'criado';
    const mensagem = acao === 'criado' ? 'novo evento' :
                     acao === 'atualizado' ? 'evento atualizado' :
                     'evento excluído';
    
    console.log(`📧 ${usuarios.length} usuários serão notificados sobre ${mensagem}: ${evento.titulo}`);
    
    // Log detalhado dos usuários
    usuarios.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    // TODO: Implementar envio de email ou push notification
    // Exemplo: await sendEmail(user.email, evento);
    // Exemplo: await sendPushNotification(user.id, evento);
  }
};
