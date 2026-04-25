import React, { useState, useEffect } from 'react';
import { Shield, UserPlus, FolderPlus, Users, Layout, Save, Trash2, AlertCircle } from 'lucide-react';
import { API_URL } from '../config';

const AdminPanel: React.FC<{ user: any }> = ({ user }) => {
  const [users, setUsers] = useState<any[]>([]);
  const [sectors, setSectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New User Form State
  const [newUser, setNewUser] = useState({
    username: '',
    password: '123',
    name: '',
    role: 'SECTOR_LEAD',
    sector: ''
  });

  // New Sector Form State
  const [newSector, setNewSector] = useState({
    name: '',
    monthly_budget: '0',
    annual_budget: '0'
  });

  const fetchData = async () => {
    try {
      const [uRes, sRes] = await Promise.all([
        fetch(`${API_URL}/users`),
        fetch(`${API_URL}/sectors`)
      ]);
      const [uData, sData] = await Promise.all([uRes.json(), sRes.json()]);
      setUsers(uData);
      setSectors(sData);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.sector) {
      alert('Selecione um setor para o usuário!');
      return;
    }
    await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    setNewUser({ username: '', password: '123', name: '', role: 'SECTOR_LEAD', sector: '' });
    fetchData();
    alert('Usuário criado com sucesso! Senha padrão: 123');
  };

  const handleCreateSector = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_URL}/sectors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sector: newSector.name, 
        monthly_budget: parseFloat(newSector.monthly_budget),
        annual_budget: parseFloat(newSector.annual_budget)
      })
    });
    setNewSector({ name: '', monthly_budget: '0', annual_budget: '0' });
    fetchData();
    alert('Novo setor criado com sucesso!');
  };

  const handleDeleteSector = async (sectorName: string) => {
    if (user.name !== 'Gustavo') {
      alert('Apenas o Gustavo (TI) pode excluir setores!');
      return;
    }

    if (window.confirm(`ATENÇÃO: Deseja realmente excluir o setor "${sectorName}"? Isso removerá todos os dados de orçamento vinculados.`)) {
      const res = await fetch(`${API_URL}/sectors/${sectorName}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        fetchData();
        alert('Setor excluído com sucesso!');
      } else {
        const error = await res.json();
        alert(error.error || 'Erro ao excluir setor.');
      }
    }
  };

  if (user.role !== 'ADMIN') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
        <AlertCircle size={48} style={{ color: 'var(--danger)', marginBottom: '16px' }} />
        <h2>Acesso Restrito</h2>
        <p style={{ color: 'var(--text-muted)' }}>Apenas o Administrador de TI (Gustavo) tem acesso a esta página.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <header style={{ marginBottom: '8px' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>Painel de Controle TI</h1>
        <p style={{ color: 'var(--text-muted)' }}>Gerenciamento de acessos, setores e estrutura do sistema.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* User Management */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', color: 'var(--primary)' }}>
              <UserPlus size={20} />
            </div>
            <h3 style={{ fontSize: '18px' }}>Cadastrar Novo Usuário</h3>
          </div>

          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-muted)' }}>Nome Completo</label>
                <input required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Ex: João Silva" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-muted)' }}>Usuário (Login)</label>
                <input required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} placeholder="Ex: joao.silva" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-muted)' }}>Setor Responsável</label>
                <select required value={newUser.sector} onChange={e => setNewUser({...newUser, sector: e.target.value})}>
                  <option value="">Selecione...</option>
                  {sectors.map(s => <option key={s.sector} value={s.sector}>{s.sector}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-muted)' }}>Nível de Acesso</label>
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <option value="SECTOR_LEAD">Líder de Setor</option>
                  <option value="FINANCE">Financeiro</option>
                  <option value="ADMIN">Administrador TI</option>
                </select>
              </div>
            </div>

            <button type="submit" style={{ background: 'var(--primary)', color: 'white', padding: '12px', fontWeight: 'bold', marginTop: '8px' }}>
              Criar Usuário
            </button>
          </form>
        </div>

        {/* Sector Management */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: 'var(--success)' }}>
              <FolderPlus size={20} />
            </div>
            <h3 style={{ fontSize: '18px' }}>Criar Novo Setor</h3>
          </div>

          <form onSubmit={handleCreateSector} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-muted)' }}>Nome do Setor</label>
              <input required value={newSector.name} onChange={e => setNewSector({...newSector, name: e.target.value})} placeholder="Ex: Recursos Humanos" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-muted)' }}>Budget Mensal (R$)</label>
                <input type="number" required value={newSector.monthly_budget} onChange={e => setNewSector({...newSector, monthly_budget: e.target.value})} placeholder="0.00" />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '6px', color: 'var(--text-muted)' }}>Budget Anual (R$)</label>
                <input type="number" required value={newSector.annual_budget} onChange={e => setNewSector({...newSector, annual_budget: e.target.value})} placeholder="0.00" />
              </div>
            </div>

            <button type="submit" style={{ background: 'var(--success)', color: 'white', padding: '12px', fontWeight: 'bold', marginTop: '8px' }}>
              Criar Setor
            </button>
          </form>
        </div>
      </div>

      {/* Sectors List Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Layout size={20} style={{ color: 'var(--success)' }} />
          <h3 style={{ fontSize: '18px' }}>Setores e Orçamentos</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '14px', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px' }}>Setor</th>
                <th>Mensal</th>
                <th>Anual</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sectors.map(s => (
                <tr key={s.sector} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}>
                  <td style={{ padding: '16px 12px', fontWeight: '600' }}>{s.sector}</td>
                  <td>R$ {parseFloat(s.monthly_budget || 0).toLocaleString()}</td>
                  <td>R$ {parseFloat(s.annual_budget || 0).toLocaleString()}</td>
                  <td style={{ textAlign: 'right' }}>
                    {user.name === 'Gustavo' && (
                      <button 
                        onClick={() => handleDeleteSector(s.sector)}
                        className="glass" 
                        style={{ padding: '6px', color: 'var(--danger)' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users List Table */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <Users size={20} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '18px' }}>Usuários Cadastrados</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '14px', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px' }}>Nome</th>
                <th>Usuário</th>
                <th>Setor</th>
                <th>Nível</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.username} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}>
                  <td style={{ padding: '16px 12px', fontWeight: '600' }}>{u.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{u.username}</td>
                  <td><span className="badge" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)' }}>{u.sector}</span></td>
                  <td>{u.role}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="glass" style={{ padding: '6px', color: 'var(--danger)' }}><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
