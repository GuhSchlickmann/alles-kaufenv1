import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, AlertCircle, Save, Edit3, CheckCircle, PieChart as PieIcon } from 'lucide-react';
import { API_URL } from '../config';

const BudgetManagement: React.FC<{ user: any }> = ({ user }) => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [seasonality, setSeasonality] = useState<any[]>([]);
  const [editingValue, setEditingValue] = useState<{ [key: string]: { monthly?: string, annual?: string } }>({});

  const fetchData = () => {
    const sharedSectors = ['Marketing', 'Comercial', 'Eventos'];
    const isSharedUser = ['Grazi', 'Esther', 'Ramon'].includes(user.name);

    fetch(`${API_URL}/budgets`)
      .then(res => res.json())
      .then(data => {
        const isTI = user.sector === 'TI';
        const isFinance = user.role === 'FINANCE';

        if (isTI || isFinance) {
          // TI (Gustavo) e Financeiro veem tudo
          setBudgets(data);
        } else if (isSharedUser) {
          // Setores compartilhados
          setBudgets(data.filter((b: any) => sharedSectors.includes(b.sector)));
        } else {
          // Resto vê apenas o seu próprio setor
          setBudgets(data.filter((b: any) => b.sector === user.sector));
        }
      });

    fetch(`${API_URL}/seasonality/${user.sector}`)
      .then(res => res.json())
      .then(data => setSeasonality(data));
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleUpdateBudget = async (sector: string, type: 'monthly' | 'annual') => {
    const value = editingValue[sector]?.[type];
    if (!value) return;

    await fetch(`${API_URL}/budgets/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sector, 
        [type === 'monthly' ? 'monthly_budget' : 'annual_budget']: parseFloat(value) 
      })
    });
    
    setEditingValue({ ...editingValue, [sector]: { ...editingValue[sector], [type]: '' } });
    fetchData();
  };

  const handleUpdateSeasonality = async (month: string, budget: number, sector: string) => {
    await fetch(`${API_URL}/seasonality/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sector, month, budget })
    });
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
                width: `${(b.spent / b.monthly_budget) * 100}%`,
                background: (b.spent / b.monthly_budget) > 0.9 ? 'var(--danger)' : 'var(--primary)',
                transition: 'width 1s ease-in-out'
              }}></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Mensal</div>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>R$ {parseFloat(b.monthly_budget || 0).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Anual</div>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>R$ {parseFloat(b.annual_budget || 0).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Gasto</div>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>R$ {parseFloat(b.spent || 0).toLocaleString()}</div>
              </div>
            </div>

            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="number" 
                  placeholder="Novo Mensal" 
                  style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                  value={editingValue[b.sector]?.monthly || ''}
                  onChange={e => setEditingValue({ ...editingValue, [b.sector]: { ...editingValue[b.sector], monthly: e.target.value } })}
                />
                <button 
                  onClick={() => handleUpdateBudget(b.sector, 'monthly')}
                  style={{ background: 'var(--primary)', color: 'white', padding: '0 8px', fontSize: '11px', borderRadius: '4px' }}
                >
                  Salvar
                </button>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="number" 
                  placeholder="Novo Anual" 
                  style={{ flex: 1, padding: '8px', fontSize: '12px' }}
                  value={editingValue[b.sector]?.annual || ''}
                  onChange={e => setEditingValue({ ...editingValue, [b.sector]: { ...editingValue[b.sector], annual: e.target.value } })}
                />
                <button 
                  onClick={() => handleUpdateBudget(b.sector, 'annual')}
                  style={{ background: 'var(--success)', color: 'white', padding: '0 8px', fontSize: '11px', borderRadius: '4px' }}
                >
                  Salvar
                </button>
              </div>
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
              <span style={{ fontWeight: '700', color: (b.spent * 1.1) > b.monthly_budget ? 'var(--warning)' : 'var(--success)' }}>
                R$ {(b.spent * 1.1).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Planejamento Mensal por Setor */}
      {seasonality.length > 0 && (
        <div className="card" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <TrendingUp size={20} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '18px' }}>Planejamento Mensal (Sazonalidade)</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '14px', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px' }}>Mês</th>
                  <th>Teto de Gasto (R$)</th>
                  <th>Status Atual</th>
                </tr>
              </thead>
              <tbody>
                {seasonality.map(m => (
                  <tr key={`${m.sector}-${m.month}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}>
                    <td style={{ padding: '16px 12px', fontWeight: '600' }}>{m.month}</td>
                    <td>
                      <input 
                        type="number" 
                        defaultValue={m.budget}
                        onBlur={(e) => handleUpdateSeasonality(m.month, parseFloat(e.target.value), m.sector)}
                        style={{ width: '120px', padding: '6px', fontSize: '13px' }}
                      />
                    </td>
                    <td>
                      <span className="badge" style={{ 
                        background: m.spent > m.budget ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: m.spent > m.budget ? '#ef4444' : '#10b981'
                      }}>
                        {m.spent > m.budget ? 'Excedido' : 'Dentro do limite'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(user.sector === 'TI' || user.role === 'FINANCE') && (
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
