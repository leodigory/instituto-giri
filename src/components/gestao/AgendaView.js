import React, { useState, useEffect } from 'react';
import { agendaService } from '../../services/agendaService';
import { googleCalendarService } from '../../services/googleCalendarService';
import { auth } from '../../firebase/config';
import './GestaoViews.css';

const AgendaView = () => {
  const [eventos, setEventos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ titulo: '', descricao: '', data_hora: '', publico_alvo: [] });

  useEffect(() => {
    carregarEventos();
    googleCalendarService.inicializar().catch(err => console.log('Google API não disponível'));
  }, []);

  const carregarEventos = async () => {
    try {
      const lista = await agendaService.listarEventos();
      setEventos(lista);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dados = { ...form, criado_por: auth.currentUser?.email || 'desconhecido' };
      
      if (editando) {
        await agendaService.atualizarEvento(editando, dados);
      } else {
        const eventoId = await agendaService.criarEvento(dados);
        
        // Criar no Google Calendar se houver roles além de 'user'
        const temOutrosRoles = dados.publico_alvo.some(r => r !== 'user');
        
        if (temOutrosRoles) {
          try {
            // Tentar criar evento no Google Calendar
            await googleCalendarService.inicializar();
            const googleEventId = await googleCalendarService.criarEvento(dados);
            
            if (googleEventId) {
              await agendaService.atualizarEvento(eventoId, { googleEventId });
              console.log('Evento sincronizado com Google Calendar');
            }
          } catch (err) {
            console.log('Não foi possível sincronizar com Google Calendar:', err.message);
          }
        }
      }
      
      setForm({ titulo: '', descricao: '', data_hora: '', publico_alvo: [] });
      setEditando(null);
      setShowForm(false);
      carregarEventos();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      alert('Erro ao salvar evento');
    }
  };

  const handleEditar = (evento) => {
    setForm({ titulo: evento.titulo, descricao: evento.descricao, data_hora: evento.data_hora, publico_alvo: evento.publico_alvo });
    setEditando(evento.id);
    setShowForm(true);
  };

  const handleExcluir = async (id) => {
    if (window.confirm('Excluir este evento?')) {
      try {
        const evento = eventos.find(e => e.id === id);
        
        // Tentar excluir do Google Calendar
        if (evento?.googleEventId) {
          try {
            await googleCalendarService.excluirEvento(evento.googleEventId);
          } catch (err) {
            console.log('Não foi possível excluir do Google Calendar');
          }
        }
        
        await agendaService.excluirEvento(id);
        carregarEventos();
      } catch (error) {
        console.error('Erro ao excluir evento:', error);
        alert('Erro ao excluir evento');
      }
    }
  };

  const toggleRole = (role) => {
    setForm(prev => ({
      ...prev,
      publico_alvo: prev.publico_alvo.includes(role)
        ? prev.publico_alvo.filter(r => r !== role)
        : [...prev.publico_alvo, role]
    }));
  };

  return (
    <div className="gestao-view">
      <div className="gestao-content">
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancelar' : '+ Novo Evento'}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="evento-form">
            <input
              type="text"
              placeholder="Título"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
            />
            <textarea
              placeholder="Descrição"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              required
            />
            <input
              type="datetime-local"
              value={form.data_hora}
              onChange={(e) => setForm({ ...form, data_hora: e.target.value })}
              required
            />
            <div className="roles-selector">
              <label>Público-alvo:</label>
              {['admin', 'gerente', 'voluntario', 'user'].map(role => (
                <label key={role} className="role-checkbox">
                  <input
                    type="checkbox"
                    checked={form.publico_alvo.includes(role)}
                    onChange={() => toggleRole(role)}
                  />
                  {role}
                </label>
              ))}
            </div>
            <button type="submit" className="btn-success">
              {editando ? 'Atualizar' : 'Criar'}
            </button>
          </form>
        )}

        <div className="eventos-lista">
          {eventos.map(evento => (
            <div key={evento.id} className="evento-card">
              <h3>{evento.titulo}</h3>
              <p>{evento.descricao}</p>
              <p className="evento-data">
                📅 {new Date(evento.data_hora).toLocaleString('pt-BR')}
              </p>
              <p className="evento-publico">
                👥 {evento.publico_alvo.join(', ')}
              </p>
              <div className="evento-actions">
                <button onClick={() => handleEditar(evento)} className="btn-edit">✏️</button>
                <button onClick={() => handleExcluir(evento.id)} className="btn-delete">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AgendaView;
