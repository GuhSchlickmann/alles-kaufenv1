import React, { useState } from 'react';
import { Lock, Key, ShieldCheck } from 'lucide-react';
import { API_URL } from '../config';

interface ChangePasswordProps {
  user: any;
  onPasswordChanged: (updatedUser: any) => void;
}

const ChangePassword: React.FC<ChangePasswordProps> = ({ user, onPasswordChanged }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem!');
      return;
    }
    if (newPassword === '123') {
      setError('A nova senha não pode ser a senha padrão!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/users/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username, newPassword })
      });
      if (res.ok) {
        onPasswordChanged({ ...user, mustChangePassword: false });
      }
    } catch (err) {
      setError('Erro ao alterar senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a'
    }}>
      <div className="card" style={{ width: '400px', padding: '40px', textAlign: 'center' }}>
        <div style={{ 
          width: '60px', height: '60px', background: 'rgba(99, 102, 241, 0.1)', 
          borderRadius: '50%', margin: '0 auto 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1'
        }}>
          <ShieldCheck size={32} />
        </div>
        <h2 style={{ marginBottom: '8px' }}>Segurança Obrigatória</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '32px' }}>
          Olá **{user.name}**, para sua segurança, você deve alterar a senha padrão (123) no primeiro acesso.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
          {error && <div style={{ color: 'var(--danger)', fontSize: '13px', textAlign: 'center' }}>{error}</div>}
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Nova Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" required 
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={{ paddingLeft: '40px' }} 
                placeholder="Digite sua nova senha"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Confirmar Senha</label>
            <div style={{ position: 'relative' }}>
              <Key size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" required 
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ paddingLeft: '40px' }} 
                placeholder="Repita a nova senha"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              background: 'var(--primary)', color: 'white', padding: '12px', 
              marginTop: '8px', fontWeight: 'bold' 
            }}
          >
            {loading ? 'Salvando...' : 'Alterar Senha e Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
