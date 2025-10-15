import React, { useState, useEffect } from 'react';
import { reunioesService } from '../../services/reunioesService';
import { auth } from '../../firebase/config';
import './GestaoViews.css';

const ReunioesView = () => {
  const [reunioes, setReunioes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titulo: '', data_hora: '', convidados: [], quorum_minimo: 50 });

  useEffect(() => {
    carregarReunioes();
  }, []);

  const carregarReunioes = async () => {
    const lista = await reunioesService.listarReunioes();
    setReunioes(lista);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const dados = { ...form, criado_por: auth.currentUser?.email || 'desconhecido' };
    await reunioesService.criarReuniao(dados);
    setForm({ titulo: '', data_hora: '', convidados: [], quorum_minimo: 50 });
    setShowForm(false);
    carregarReunioes();
  };

  const handleExcluir = async (id) => {
    if (window.confirm('Excluir esta reuni\u00e3o?')) {
      await reunioesService.excluirReuniao(id);
      carregarReunioes();
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'agendada': return '#3b82f6';
      case 'em_andamento': return '#f59e0b';
      case 'finalizada': return '#10b981';
      default: return '#6b7280';
    }
  };

  return (
    <div className="gestao-view">
      <div className="gestao-content">
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '\u2715 Cancelar' : '+ Nova Reuni\u00e3o'}
        </button>

        {showForm && (
          <form onSubmit={handleSubmit} className="evento-form">
            <input
              type="text"
              placeholder="T\u00edtulo da Reuni\u00e3o"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
            />
            <input
              type="datetime-local"
              value={form.data_hora}
              onChange={(e) => setForm({ ...form, data_hora: e.target.value })}
              required
            />
            <input
              type="number"
              placeholder="Qu\u00f3rum M\u00ednimo (%)"
              value={form.quorum_minimo}
              onChange={(e) => setForm({ ...form, quorum_minimo: parseInt(e.target.value) })}
              min="1"
              max="100"
            />
            <button type="submit" className="btn-success">Criar Reuni\u00e3o</button>
          </form>
        )}

        <div className="eventos-lista">
          {reunioes.map(reuniao => (
            <div key={reuniao.id} className="evento-card" style={{ borderLeftColor: getStatusColor(reuniao.status) }}>
              <h3>{reuniao.titulo}</h3>
              <p className="evento-data">
                \ud83d\udcc5 {new Date(reuniao.data_hora).toLocaleString('pt-BR')}
              </p>
              <p className="evento-publico">
                \ud83d\udc65 Qu\u00f3rum: {reuniao.quorum_minimo}% | Status: {reuniao.status}
              </p>
              <div className="evento-actions">
                <button onClick={() => handleExcluir(reuniao.id)} className="btn-delete">\ud83d\uddd1\ufe0f</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReunioesView;
