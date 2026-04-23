import React, { useState } from 'react';
import { Lock, User } from 'lucide-react';
import LottieLogo from './LottieLogo';

import { API_URL } from '../config';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const user = await res.json();
        onLogin(user);
      } else {
        setError('Usuário ou senha incorretos');
      }
    } catch (err) {
      setError('Erro ao conectar ao servidor');
    }
  };

  return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(circle at top right, #1e293b, #0f172a)'
    }}>
      <div className="card" style={{ width: '400px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ 
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}>
            <LottieLogo size={80} />
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Alles Kaufen</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Gestão de Compras & Budget</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Usuário</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                required 
                style={{ paddingLeft: '40px' }}
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Seu usuário"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Senha</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                required 
                style={{ paddingLeft: '40px' }}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && <div style={{ color: 'var(--danger)', fontSize: '13px', textAlign: 'center' }}>{error}</div>}

          <button type="submit" style={{ 
            background: 'var(--primary)', color: 'white', padding: '12px', 
            fontSize: '16px', fontWeight: 'bold', marginTop: '10px',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
          }}>
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
