import React, { useState, useEffect } from 'react';
import { agendaService } from '../../services/agendaService';
import './AlertasPopup.css';

const AlertasPopup = ({ userRole }) => {
  const [alertas, setAlertas] = useState([]);
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    carregarAlertas();
  }, [userRole]);

  const carregarAlertas = async () => {
    const eventos = await agendaService.listarEventos(userRole);
    const agora = new Date();
    const proximasHoras = new Date(agora.getTime() + 24 * 60 * 60 * 1000);
    
    const eventosProximos = eventos.filter(evento => {
      const dataEvento = new Date(evento.data_hora);
      return dataEvento >= agora && dataEvento <= proximasHoras;
    });

    if (eventosProximos.length > 0) {
      setAlertas(eventosProximos);
      setMostrar(true);
    }
  };

  if (!mostrar || alertas.length === 0) return null;

  return (
    <div className="alertas-overlay" onClick={() => setMostrar(false)}>
      <div className="alertas-popup" onClick={(e) => e.stopPropagation()}>
        <div className="alertas-header">
          <h3>🔔 Eventos Próximos</h3>
          <button onClick={() => setMostrar(false)}>✕</button>
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
