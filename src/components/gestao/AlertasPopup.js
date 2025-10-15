import React, { useState, useEffect } from 'react';
import { agendaService } from '../../services/agendaService';
import { notificacoesService } from '../../services/notificacoesService';
import './AlertasPopup.css';

const AlertasPopup = ({ userRole }) => {
  const [alertas, setAlertas] = useState([]);
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    // Apenas para roles que não sejam 'user'
    if (userRole && userRole !== 'user') {
      // Delay para dar tempo dos outros popups aparecerem primeiro
      const timer = setTimeout(() => {
        carregarAlertas();
        notificacoesService.solicitarPermissao().catch(err => console.log('Permissão negada'));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [userRole]);

  const carregarAlertas = async () => {
    try {
      const eventos = await agendaService.listarEventos(userRole);
      const agora = new Date();
      
      const eventosParaExibir = eventos.filter(evento => {
        if (!evento.data_hora) return false;
        const dataEvento = new Date(evento.data_hora);
        if (dataEvento < agora) return false;
        
        // Verificar se o evento é para o role do usuário (exceto 'user')
        if (!evento.publico_alvo || !evento.publico_alvo.includes(userRole)) return false;
        
        return notificacoesService.deveExibir(evento);
      });

      if (eventosParaExibir.length > 0) {
        setAlertas(eventosParaExibir);
        setMostrar(true);
        
        eventosParaExibir.forEach(evento => {
          notificacoesService.enviarNotificacaoNavegador(evento);
        });
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    }
  };

  const handleFechar = () => {
    // Marcar todos como exibidos
    alertas.forEach(alerta => {
      notificacoesService.marcarExibido(alerta.id);
    });
    setMostrar(false);
  };

  if (!mostrar || alertas.length === 0) return null;

  return (
    <div className="alertas-overlay" onClick={handleFechar}>
      <div className="alertas-popup" onClick={(e) => e.stopPropagation()}>
        <div className="alertas-header">
          <h3>🔔 Eventos Próximos</h3>
          <button onClick={handleFechar}>✕</button>
        </div>
        <div className="alertas-lista">
          {alertas.map(alerta => (
            <div key={alerta.id} className="alerta-item">
              <h4>{alerta.titulo}</h4>
              <p>{alerta.descricao}</p>
              <p className="alerta-data">
                📅 {new Date(alerta.data_hora).toLocaleString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AlertasPopup;
