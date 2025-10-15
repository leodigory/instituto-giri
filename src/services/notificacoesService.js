// Controle de notificações exibidas
const STORAGE_KEY = 'alertas_exibidos';

export const notificacoesService = {
  // Verificar se já foi exibido hoje
  jaExibidoHoje(eventoId) {
    const hoje = new Date().toDateString();
    const exibidos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return exibidos[eventoId] === hoje;
  },

  // Marcar como exibido hoje
  marcarExibido(eventoId) {
    const hoje = new Date().toDateString();
    const exibidos = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    exibidos[eventoId] = hoje;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(exibidos));
  },

  // Verificar se deve exibir (1x por dia até o evento, + 1h antes)
  deveExibir(evento) {
    const agora = new Date();
    const dataEvento = new Date(evento.data_hora);
    const umaHoraAntes = new Date(dataEvento.getTime() - 60 * 60 * 1000);
    
    // Evento já passou
    if (dataEvento < agora) return false;
    
    // 1 hora antes (sempre exibe)
    if (agora >= umaHoraAntes && agora < dataEvento) return true;
    
    // 1x por dia até o evento
    if (!this.jaExibidoHoje(evento.id)) return true;
    
    return false;
  },

  // Solicitar permissão de notificações do navegador
  async solicitarPermissao() {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  },

  // Enviar notificação do navegador
  enviarNotificacaoNavegador(evento) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const agora = new Date();
      const dataEvento = new Date(evento.data_hora);
      const umaHoraAntes = new Date(dataEvento.getTime() - 60 * 60 * 1000);
      
      let titulo = '📅 Lembrete de Evento';
      let corpo = evento.titulo;
      
      if (agora >= umaHoraAntes && agora < dataEvento) {
        titulo = '⏰ Evento em 1 hora!';
        corpo = `${evento.titulo} - ${dataEvento.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      new Notification(titulo, {
        body: corpo,
        icon: '/logo192.png',
        badge: '/logo192.png'
      });
    }
  }
};
