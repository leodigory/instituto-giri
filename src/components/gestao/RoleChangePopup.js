import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './AlertasPopup.css';

const RoleChangePopup = ({ userRole }) => {
  const [mostrar, setMostrar] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (userRole && auth.currentUser) {
      buscarUserId();
    }
  }, [userRole]);

  const buscarUserId = async () => {
    try {
      const { collection, query, where, getDocs } = await import('firebase/firestore');
      const usersQuery = query(collection(db, 'users'), where('email', '==', auth.currentUser.email));
      const snapshot = await getDocs(usersQuery);
      
      if (!snapshot.empty) {
        const id = snapshot.docs[0].id;
        setUserId(id);
        verificarMudancaRole(id);
      }
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
    }
  };

  const verificarMudancaRole = async (id) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', id));
      const userData = userDoc.data();
      
      // Verificar se já visualizou a notificação do role atual
      if (userData.role_notificacao_visualizada === true) {
        return; // Já visualizou
      }
      
      // Verificar se tem role anterior salvo
      const roleAnterior = userData.role_anterior;
      
      if (roleAnterior && roleAnterior !== userRole) {
        // Houve mudança de role
        const msg = gerarMensagem(roleAnterior, userRole);
        setMensagem(msg);
        setMostrar(true);
      } else if (!roleAnterior) {
        // Primeiro acesso - salvar role atual
        await updateDoc(doc(db, 'users', id), {
          role_anterior: userRole,
          role_notificacao_visualizada: true
        });
      }
    } catch (error) {
      console.error('Erro ao verificar mudança de role:', error);
    }
  };

  const gerarMensagem = (roleAntigo, roleNovo) => {
    const roles = {
      admin: 'Administrador',
      gerente: 'Gerente',
      voluntario: 'Voluntário',
      user: 'Usuário'
    };

    const isPromocao = ['user', 'voluntario', 'gerente', 'admin'].indexOf(roleNovo) > 
                       ['user', 'voluntario', 'gerente', 'admin'].indexOf(roleAntigo);

    if (isPromocao) {
      return `🎉 Parabéns! Você foi promovido a ${roles[roleNovo]}!`;
    } else {
      return `ℹ️ Você agora é um ${roles[roleNovo]}!`;
    }
  };

  const handleFechar = async () => {
    if (userId) {
      try {
        // Marcar como visualizado no Firebase
        await updateDoc(doc(db, 'users', userId), {
          role_notificacao_visualizada: true,
          role_anterior: userRole
        });
      } catch (error) {
        console.error('Erro ao atualizar visualização:', error);
      }
    }
    setMostrar(false);
  };

  if (!mostrar) return null;

  return (
    <div className="alertas-overlay" onClick={handleFechar}>
      <div className="alertas-popup" onClick={(e) => e.stopPropagation()}>
        <div className="alertas-header">
          <h3>Atualização de Perfil</h3>
          <button onClick={handleFechar}>✕</button>
        </div>
        <div className="alertas-lista">
          <div className="alerta-item" style={{ borderLeftColor: '#10b981' }}>
            <h4>{mensagem}</h4>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleChangePopup;
