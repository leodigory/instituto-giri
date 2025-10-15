import React, { useState, useEffect } from 'react';
import { agendaService } from '../../services/agendaService';
import { auth } from '../../firebase/config';
import './GestaoViews.css';

const AgendaView = () => {
  const [eventos, setEventos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ titulo: '', descricao: '', data_hora: '', publico_alvo: [] });

  useEffect(() => {
    carregarEventos();
  }, []);

  const carregarEventos = async () => {
    const lista = await agendaService.listarEventos();
    setEventos(lista);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dados = { ...form, criado_por: auth.currentUser?.email || 'desconhecido' };
    
    if (editando) {
      await agendaService.atualizarEvento(editando, dados);
    } else {
      await agendaService.criarEvento(dados);
    }
    
    setForm({ titulo: '', descricao: '', data_hora: '', publico_alvo: [] });
    setEditando(null);
    setShowForm(false);
    carregarEventos();
  };

  const handleEditar = (evento) => {
    setForm({ titulo: evento.titulo, descricao: evento.descricao, data_hora: evento.data_hora, publico_alvo: evento.publico_alvo });
    setEditando(evento.id);
    setShowForm(true);
  };

  const handleExcluir = async (id) => {
    if (window.confirm('Excluir este evento?')) {
      await agendaService.excluirEvento(id);
      carregarEventos();
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
