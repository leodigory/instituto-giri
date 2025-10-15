import React, { useState, useEffect } from 'react';
import { agendaService } from '../../services/agendaService';
import { googleCalendarService } from '../../services/googleCalendarService';
import { syncCalendarService } from '../../services/syncCalendarService';
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
        // EDITAR EVENTO
        const eventoAntigo = eventos.find(e => e.id === editando);
        
        // 1. Atualizar no Firebase
        await agendaService.atualizarEvento(editando, dados);
        console.log('✅ Evento atualizado no Firebase');
        
        // 2. Buscar usuários sincronizados
        const usuariosSincronizados = await syncCalendarService.buscarUsuariosSincronizados(dados.publico_alvo);
        
        // 3. Atualizar no Google Calendar (se existir)
        if (eventoAntigo?.googleEventId) {
          try {
            await googleCalendarService.inicializar();
            // Google Calendar não tem update direto, precisa excluir e recriar
            await googleCalendarService.excluirEvento(eventoAntigo.googleEventId);
            const novoGoogleEventId = await googleCalendarService.criarEvento(dados);
            
            if (novoGoogleEventId) {
              await agendaService.atualizarEvento(editando, { googleEventId: novoGoogleEventId });
              console.log('✅ Evento atualizado no Google Calendar');
            }
          } catch (err) {
            console.log('⚠️ Não foi possível atualizar no Google Calendar');
          }
        }
        
        // 4. Notificar usuários sobre atualização
        if (usuariosSincronizados.length > 0) {
          await syncCalendarService.notificarUsuarios(usuariosSincronizados, { ...dados, acao: 'atualizado' });
          alert(`✅ Evento atualizado! ${usuariosSincronizados.length} usuário(s) notificado(s).`);
        } else {
          alert('✅ Evento atualizado!');
        }
      } else {
        // CRIAR EVENTO
        // 1. Criar evento no Firebase
        const eventoId = await agendaService.criarEvento(dados);
        console.log('✅ Evento criado no Firebase:', eventoId);
        
        // 2. Buscar usuários sincronizados do público-alvo
        const usuariosSincronizados = await syncCalendarService.buscarUsuariosSincronizados(dados.publico_alvo);
        
        if (usuariosSincronizados.length > 0) {
          console.log(`🔄 ${usuariosSincronizados.length} usuários sincronizados encontrados`);
          
          // 3. Tentar criar no Google Calendar do usuário atual (se sincronizado)
          try {
            await googleCalendarService.inicializar();
            
            // Verificar se está autenticado, se não, fazer login
            if (!googleCalendarService.estaAutenticado()) {
              console.log('🔑 Solicitando autenticação no Google Calendar...');
              const loginSucesso = await googleCalendarService.login();
              
              if (!loginSucesso) {
                console.log('⚠️ Usuário cancelou autenticação');
                throw new Error('Autenticação cancelada');
              }
            }
            
            const googleEventId = await googleCalendarService.criarEvento(dados);
            
            if (googleEventId) {
              await agendaService.atualizarEvento(eventoId, { googleEventId });
              console.log('✅ Evento sincronizado com seu Google Calendar');
            }
          } catch (err) {
            console.log('⚠️ Não foi possível sincronizar com seu Google Calendar:', err.message);
          }
          
          // 4. Notificar outros usuários sincronizados
          await syncCalendarService.notificarUsuarios(usuariosSincronizados, dados);
          
          alert(`✅ Evento criado! ${usuariosSincronizados.length} usuário(s) sincronizado(s) serão notificado(s).`);
        } else {
          alert('✅ Evento criado no Firebase!');
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
    if (window.confirm('Excluir este evento? Todos os usuários sincronizados serão notificados.')) {
      try {
        const evento = eventos.find(e => e.id === id);
        
        // 1. Buscar usuários sincronizados
        const usuariosSincronizados = await syncCalendarService.buscarUsuariosSincronizados(evento.publico_alvo);
        
        // 2. Excluir do Google Calendar
        if (evento?.googleEventId) {
          try {
            await googleCalendarService.inicializar();
            await googleCalendarService.excluirEvento(evento.googleEventId);
            console.log('✅ Evento excluído do Google Calendar');
          } catch (err) {
            console.log('⚠️ Não foi possível excluir do Google Calendar');
          }
        }
        
        // 3. Excluir do Firebase
        await agendaService.excluirEvento(id);
        console.log('✅ Evento excluído do Firebase');
        
        // 4. Notificar usuários sobre exclusão
        if (usuariosSincronizados.length > 0) {
          await syncCalendarService.notificarUsuarios(usuariosSincronizados, { ...evento, acao: 'excluido' });
          alert(`✅ Evento excluído! ${usuariosSincronizados.length} usuário(s) notificado(s).`);
        } else {
          alert('✅ Evento excluído!');
        }
        
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
