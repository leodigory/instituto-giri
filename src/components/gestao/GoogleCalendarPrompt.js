import React, { useState, useEffect } from 'react';
import { googleCalendarService } from '../../services/googleCalendarService';
import { auth, db } from '../../firebase/config';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import './AlertasPopup.css';

const GoogleCalendarPrompt = ({ userRole }) => {
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    // Apenas para admin, gerente e voluntario
    if (userRole && userRole !== 'user') {
      // Delay para dar tempo dos outros popups
      const timer = setTimeout(() => {
        verificarVinculacao();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [userRole]);

  const verificarVinculacao = async () => {
    try {
      if (!auth.currentUser) return;
      
      // Buscar status de vinculação no Firebase
      const usersQuery = query(collection(db, 'users'), where('email', '==', auth.currentUser.email));
      const snapshot = await getDocs(usersQuery);
      
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        
        // Se já vinculou, não mostrar
        if (userData.google_calendar_vinculado === true) {
          return;
        }
      }
      
      // Mostrar prompt de vinculação
      setMostrar(true);
    } catch (error) {
      console.error('Erro ao verificar vinculação:', error);
    }
  };

  const handleVincular = async () => {
    try {
      // Salvar preferência no Firebase
      const usersQuery = query(collection(db, 'users'), where('email', '==', auth.currentUser.email));
      const snapshot = await getDocs(usersQuery);
      
      if (!snapshot.empty) {
        const userId = snapshot.docs[0].id;
        await updateDoc(doc(db, 'users', userId), {
          google_calendar_vinculado: true,
          google_calendar_data_vinculacao: new Date().toISOString()
        });
      }
      
      setMostrar(false);
      alert('✅ Preferência salva! Você receberá eventos no Google Calendar.');
    } catch (error) {
      console.error('Erro:', error);
      alert('❌ Erro ao salvar. Tente novamente.');
    }
  };

  const handleMaisTarde = () => {
    // Não salvar nada, apenas fechar
    // Na próxima atualização vai perguntar novamente
    setMostrar(false);
  };

  if (!mostrar) return null;

  return (
    <div className="alertas-overlay" onClick={handleMaisTarde}>
      <div className="alertas-popup" onClick={(e) => e.stopPropagation()}>
        <div className="alertas-header">
          <h3>📅 Vincular Google Calendar</h3>
          <button onClick={handleMaisTarde}>✕</button>
        </div>
        <div className="alertas-lista">
          <div className="alerta-item" style={{ borderLeftColor: '#3b82f6' }}>
<h4>Deseja receber eventos no Google Calendar?</h4>
            <p>Os eventos da agenda serão sincronizados automaticamente com seu Google Calendar.</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button 
                onClick={handleVincular}
                style={{
                  flex: 1,
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
Sim, Vincular
              </button>
              <button 
                onClick={handleMaisTarde}
                style={{
                  flex: 1,
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Mais Tarde
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleCalendarPrompt;
