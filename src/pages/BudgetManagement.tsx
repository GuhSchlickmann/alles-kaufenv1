import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  AlertCircle, 
  Save, 
  Edit3, 
  CheckCircle, 
  PieChart as PieIcon,
  ChevronRight,
  Info
} from 'lucide-react';
import { API_URL } from '../config';
import { maskCurrency, parseCurrencyToNumber } from '../utils/currency';

const BudgetManagement: React.FC<{ user: any }> = ({ user }) => {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [seasonality, setSeasonality] = useState<any[]>([]);
  const [editingValue, setEditingValue] = useState<{ [key: string]: { monthly?: string, annual?: string } }>({});
  const [selectedSeasonalitySector, setSelectedSeasonalitySector] = useState<string>('');
  
  const sharedSectors = ['Marketing e Comercial', 'Eventos'];
  const isSharedUser = ['Grazi', 'Esther', 'Ramon'].includes(user.name);

  const fetchData = () => {
    fetch(`${API_URL}/budgets`)
      .then(res => res.json())
      .then(data => {
        const isTI = user.sector === 'TI';
        const isFinance = user.role === 'FINANCE';

        let filteredBudgets = [];
        if (isTI || isFinance) {
          filteredBudgets = data;
        } else if (isSharedUser) {
          filteredBudgets = data.filter((b: any) => sharedSectors.includes(b.sector));
        } else {
          filteredBudgets = data.filter((b: any) => b.sector === user.sector);
        }
        setBudgets(filteredBudgets);
        
        // Define o setor inicial para a sazonalidade se não estiver definido
        if (!selectedSeasonalitySector && filteredBudgets.length > 0) {
          const mySectorBudget = filteredBudgets.find(b => b.sector === user.sector);
          setSelectedSeasonalitySector(mySectorBudget ? mySectorBudget.sector : filteredBudgets[0].sector);
        }

      });
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (selectedSeasonalitySector) {
      fetch(`${API_URL}/seasonality/${selectedSeasonalitySector}`)
        .then(res => res.json())
        .then(data => setSeasonality(data));
    }
  }, [selectedSeasonalitySector]);

  const handleUpdateBudget = async (sector: string, type: 'monthly' | 'annual') => {
    const value = editingValue[sector]?.[type];
    if (!value) return;

    try {
      const res = await fetch(`${API_URL}/budgets/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sector, 
          [type === 'monthly' ? 'monthly_budget' : 'annual_budget']: parseCurrencyToNumber(value) 
        })
      });

      if (res.ok) {
        setEditingValue({ ...editingValue, [sector]: { ...editingValue[sector], [type]: '' } });
        fetchData();
      }
    } catch (err) {
      console.error('Erro no update:', err);
    }
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', animation: 'fadeIn 0.5s ease' }}>
      <header>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>Gestão de Budget</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          {isSharedUser ? 'Você tem permissão para gerenciar os budgets de Comercial/Marketing e Eventos.' : 'Gerencie os tetos de gastos e planejamento do seu setor.'}
        </p>
      </header>

      {/* Grid de Cartões de Setores */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {budgets.map(b => (
          <div key={b.sector} className="card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '20px',
            border: selectedSeasonalitySector === b.sector ? '1px solid var(--primary)' : '1px solid var(--border)',
            boxShadow: selectedSeasonalitySector === b.sector ? '0 0 0 1px var(--primary)' : 'none'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', color: 'var(--primary)' }}>
                  <Wallet size={18} />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{b.sector}</h3>
              </div>
              <button 
                onClick={() => setSelectedSeasonalitySector(b.sector)}
                style={{ 
                  background: selectedSeasonalitySector === b.sector ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                  color: selectedSeasonalitySector === b.sector ? 'white' : 'var(--text-muted)',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  borderRadius: '6px'
                }}
              >
                Ver Detalhes
              </button>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Progresso do Orçamento Anual</span>
                <span style={{ fontSize: '12px', fontWeight: '600' }}>{((b.spent / b.annual_budget) * 100 || 0).toFixed(1)}%</span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${Math.min(100, (b.spent / b.annual_budget) * 100)}%`,
                  background: (b.spent / b.annual_budget) > 0.9 ? 'var(--danger)' : 'var(--success)',
                  transition: 'width 1s ease-in-out'
                }}></div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Teto Anual</p>
                <p style={{ fontWeight: '700', fontSize: '16px' }}>R$ {parseFloat(b.annual_budget || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Total Gasto</p>
                <p style={{ fontWeight: '700', fontSize: '16px', color: (b.spent > b.annual_budget) ? 'var(--danger)' : 'inherit' }}>
                  R$ {parseFloat(b.spent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <label style={{ display: 'block', fontSize: '12px', marginBottom: '8px', color: 'var(--text-muted)' }}>Atualizar Budget Anual</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="R$ 0,00" 
                  style={{ flex: 1, padding: '8px 12px', fontSize: '13px' }}
                  value={editingValue[b.sector]?.annual || ''}
                  onChange={e => setEditingValue({ ...editingValue, [b.sector]: { ...editingValue[b.sector], annual: maskCurrency(e.target.value) } })}
                />
                <button 
                  onClick={() => handleUpdateBudget(b.sector, 'annual')}
                  style={{ background: 'var(--primary)', color: 'white', padding: '0 16px', fontSize: '13px', fontWeight: '600' }}
                >
                  <Save size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Planejamento Mensal (Sazonalidade) */}
      {seasonality.length > 0 && (
        <div className="card" style={{ animation: 'fadeIn 0.5s ease 0.2s both' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: 'var(--success)' }}>
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Sazonalidade: {selectedSeasonalitySector}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Planejamento de gastos mês a mês</p>
              </div>
            </div>

            {(() => {
              const myBudget = budgets.find(b => b.sector === selectedSeasonalitySector);
              if (!myBudget) return null;
              
              const seasonalTotal = seasonality.reduce((acc, curr) => acc + parseFloat(curr.budget || 0), 0);
              const annualTeto = parseFloat(myBudget.annual_budget || 0);
              const isOver = seasonalTotal > (annualTeto + 0.1);

              return (
                <div style={{ 
                  padding: '10px 16px', 
                  borderRadius: '10px', 
                  fontSize: '13px',
                  background: isOver ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  color: isOver ? '#ef4444' : '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  border: '1px solid currentColor'
                }}>
                  {isOver ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                  <span style={{ fontWeight: '500' }}>
                    Soma dos Meses: R$ {seasonalTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
                    {isOver ? ' (EXCEDE O TETO)' : ' (DENTRO DO TETO)'}
                  </span>
                </div>
              );
            })()}
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px' }}>Mês</th>
                  <th style={{ padding: '12px 16px' }}>Teto Planejado</th>
                  <th style={{ padding: '12px 16px' }}>Gasto Realizado</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {seasonality.map(m => (
                  <tr key={`${m.sector}-${m.month}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '14px' }}>
                    <td style={{ padding: '16px', fontWeight: '600' }}>{m.month}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="text" 
                          value={editingValue[`${m.sector}-${m.month}`] !== undefined ? editingValue[`${m.sector}-${m.month}`] : maskCurrency(parseFloat(m.budget || 0).toFixed(2).replace('.', ''))}
                          onChange={(e) => setEditingValue({ ...editingValue, [`${m.sector}-${m.month}`]: maskCurrency(e.target.value) })}


                          onBlur={(e) => {
                            const val = parseCurrencyToNumber(e.target.value);
                            handleUpdateSeasonality(m.month, val, m.sector);
                          }}
                          style={{ width: '130px', padding: '6px 10px', fontSize: '13px' }}
                        />
                        <Edit3 size={14} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>R$ {parseFloat(m.spent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '11px',
                        fontWeight: '700',
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default BudgetManagement;

