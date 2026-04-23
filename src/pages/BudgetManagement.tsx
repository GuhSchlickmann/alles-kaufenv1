import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, AlertCircle, Save, Edit3, CheckCircle, PieChart as PieIcon } from 'lucide-react';
import { API_URL } from '../config';

const BudgetManagement: React.FC<{ user: any }> = ({ user }) => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [editingValue, setEditingValue] = useState<{ [key: string]: string }>({});

  const fetchData = () => {
    const sharedSectors = ['Marketing', 'Comercial', 'Eventos'];
    const isSharedUser = ['Grazi', 'Esther', 'Ramon'].includes(user.name);

    fetch(`${API_URL}/budgets`)
      .then(res => res.json())
      .then(data => {
        if (user.role === 'FINANCE' || user.role === 'ADMIN') {
          setBudgets(data);
        } else if (isSharedUser) {
          setBudgets(data.filter((b: any) => sharedSectors.includes(b.sector)));
        } else {
          setBudgets(data.filter((b: any) => b.sector === user.sector));
        }
      });
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleUpdateBudget = async (sector: string) => {
    const value = editingValue[sector];
    if (!value) return;

    await fetch(`${API_URL}/budgets/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sector, allocated: parseFloat(value) })
    });
    
    setEditingValue({ ...editingValue, [sector]: '' });
    fetchData();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {budgets.map(b => (
          <div key={b.sector} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px' }}>{b.sector}</h3>
              <PieIcon size={18} style={{ color: 'var(--text-muted)' }} />
            </div>
            
            <div style={{ position: 'relative', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                position: 'absolute', left: 0, top: 0, height: '100%', 
                width: `${(b.spent / b.allocated) * 100}%`,
                background: (b.spent / b.allocated) > 0.9 ? 'var(--danger)' : 'var(--primary)',
                transition: 'width 1s ease-in-out'
              }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Alocado</div>
                <div style={{ fontWeight: '600' }}>R$ {parseFloat(b.allocated).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Gasto</div>
                <div style={{ fontWeight: '600' }}>R$ {parseFloat(b.spent).toLocaleString()}</div>
              </div>
            </div>

            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              <input 
                type="number" 
                placeholder="Novo Budget" 
                style={{ flex: 1, padding: '8px' }}
                value={editingValue[b.sector] || ''}
                onChange={e => setEditingValue({ ...editingValue, [b.sector]: e.target.value })}
              />
              <button 
                onClick={() => handleUpdateBudget(b.sector)}
                style={{ background: 'var(--primary)', color: 'white', padding: '0 12px', fontSize: '12px' }}
              >
                Salvar
              </button>
            </div>

            <div style={{ 
              padding: '12px', 
              background: 'rgba(255,255,255,0.03)', 
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '12px' }}>Previsão Próximo Mês:</span>
              <span style={{ fontWeight: '700', color: (b.spent * 1.1) > b.allocated ? 'var(--warning)' : 'var(--success)' }}>
                R$ {(b.spent * 1.1).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {(user.role === 'FINANCE' || user.role === 'ADMIN') && (
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Consolidado Geral (Visão Financeiro)</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '200px' }}>
            {budgets.map(b => (
               <div key={b.sector} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                 <div style={{ 
                   width: '100%', 
                   background: 'var(--primary)', 
                   height: `${Math.min(100, (parseFloat(b.spent) / 80000) * 100)}%`, 
                   borderRadius: '4px 4px 0 0',
                   opacity: 0.8
                 }}></div>
                 <span style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>{b.sector}</span>
               </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetManagement;
