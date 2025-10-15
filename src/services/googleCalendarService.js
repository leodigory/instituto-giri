// Integração com Google Calendar API
const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

export const googleCalendarService = {
  // Inicializar Google API
  async inicializar() {
    return new Promise((resolve, reject) => {
      if (!CLIENT_ID || !API_KEY) {
        console.warn('Credenciais do Google não configuradas');
        reject(new Error('Credenciais não configuradas'));
        return;
      }
      
      if (!window.gapi) {
        reject(new Error('Google API não carregada'));
        return;
      }

      window.gapi.load('client:auth2', async () => {
        try {
          await window.gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  },

  // Verificar se está autenticado
  estaAutenticado() {
    if (!window.gapi?.auth2) return false;
    return window.gapi.auth2.getAuthInstance().isSignedIn.get();
  },

  // Fazer login
  async login() {
    if (!window.gapi?.auth2) {
      throw new Error('Google Auth não inicializado');
    }
    
    try {
      const authInstance = window.gapi.auth2.getAuthInstance();
      if (!authInstance) {
        throw new Error('Instância de autenticação não encontrada');
      }
      
      await authInstance.signIn();
      return true;
    } catch (error) {
      console.error('Erro ao fazer login no Google:', error);
      if (error.error === 'popup_closed_by_user') {
        return false; // Usuário cancelou
      }
      throw error;
    }
  },

  // Criar evento no Google Calendar
  async criarEvento(evento) {
    try {
      if (!this.estaAutenticado()) {
        console.log('Usuário não autenticado no Google Calendar');
        return null;
      }

      const dataEvento = new Date(evento.data_hora);
      const dataFim = new Date(dataEvento.getTime() + 60 * 60 * 1000); // +1h

      // Estrutura do evento seguindo a API do Google Calendar
      const eventoGoogle = {
        summary: evento.titulo,
        description: evento.descricao || 'Evento criado pelo Sistema Instituto Giri',
        location: 'Instituto Giri',
        start: {
          dateTime: dataEvento.toISOString(),
          timeZone: 'America/Fortaleza'
        },
        end: {
          dateTime: dataFim.toISOString(),
          timeZone: 'America/Fortaleza'
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 } // 1 hora antes
          ]
        }
      };

      // POST para https://www.googleapis.com/calendar/v3/calendars/primary/events
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: 'primary',
        resource: eventoGoogle
      });

      console.log('Evento criado no Google Calendar:', response.result.id);
      return response.result.id;
    } catch (error) {
      console.error('Erro ao criar evento no Google Calendar:', error);
      return null;
    }
  },

  // Excluir evento do Google Calendar
  async excluirEvento(eventoId) {
    if (!this.estaAutenticado()) return false;

    try {
      await window.gapi.client.calendar.events.delete({
        calendarId: 'primary',
        eventId: eventoId
      });
      return true;
    } catch (error) {
      console.error('Erro ao excluir evento do Google Calendar:', error);
      return false;
    }
  }
};
