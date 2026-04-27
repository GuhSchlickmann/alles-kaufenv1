import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Filter,
  BarChart3,
  PieChart as PieIcon,
  ArrowRight,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { API_URL } from '../config';

const Dashboard: React.FC<{ user: any }> = ({ user }) => {
  const sharedSectors = ['Marketing e Comercial', 'Eventos'];
  const isSharedUser = ['Grazi', 'Esther', 'Ramon'].includes(user.name);
  
  const [selectedSector, setSelectedSector] = useState<string>(
    isSharedUser ? 'MEUS_SETORES' : user.sector
  );
  const [purchases, setPurchases] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [allSectors, setAllSectors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Busca setores para o filtro
    fetch(`${API_URL}/sectors`)
      .then(res => res.json())
      .then(data => setAllSectors(data));

    // Busca compras com cache: 'no-cache' para garantir dados novos
    fetch(`${API_URL}/purchases`, { cache: 'no-cache' })
      .then(res => res.json())
      .then(data => {
        if (user.role === 'FINANCE' || user.role === 'ADMIN') {
          setPurchases(data);
        } else if (isSharedUser) {
          setPurchases(data.filter((p: any) => sharedSectors.includes(p.sector)));
        } else {
          setPurchases(data.filter((p: any) => p.sector === user.sector));
        }
      });

    // Busca orçamentos com cache: 'no-cache'
    fetch(`${API_URL}/budgets`, { cache: 'no-cache' })
      .then(res => res.json())
      .then(data => {
        if (user.role === 'FINANCE' || user.role === 'ADMIN') {
          setBudgets(data);
        } else if (isSharedUser) {
          setBudgets(data.filter((b: any) => sharedSectors.includes(b.sector)));
        } else {
          setBudgets(data.filter((b: any) => b.sector === user.sector));
        }
        setIsLoading(false);
      });
  }, [user, isSharedUser]);

  useEffect(() => {
    const fetchPath = (selectedSector === 'TODOS' || selectedSector === 'MEUS_SETORES') ? 'ALL' : selectedSector;
    fetch(`${API_URL}/seasonality/${fetchPath}`, { cache: 'no-cache' })
      .then(res => res.json())
      .then(data => setMonthlyData(data));
  }, [selectedSector]);


  // Cálculos filtrados
  const filteredPurchases = useMemo(() => {
    if (selectedSector === 'TODOS' || selectedSector === 'MEUS_SETORES') return purchases;
    return purchases.filter(p => p.sector === selectedSector);
  }, [purchases, selectedSector]);

  const filteredBudgets = useMemo(() => {
    if (selectedSector === 'TODOS' || selectedSector === 'MEUS_SETORES') return budgets;
    return budgets.filter(b => b.sector === selectedSector);
  }, [budgets, selectedSector]);

  const totalSpent = filteredBudgets.reduce((acc, curr) => acc + parseFloat(curr.spent || 0), 0);
  const totalAnnualBudget = filteredBudgets.reduce((acc, curr) => acc + parseFloat(curr.annual_budget || 0), 0);

  const sectorPieData = budgets.map(b => ({
    name: b.sector,
    value: parseFloat(b.spent || 0)
  })).filter(item => item.value > 0);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'];

  const getDashboardTitle = () => {
    if (isSharedUser && selectedSector === 'MEUS_SETORES') return 'Dashboard Comercial / Marketing';
    if (selectedSector === 'TODOS') return 'Dashboard Corporativo';
    return `Dashboard ${selectedSector}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.5s ease' }}>
      {/* Header com Filtro */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.03)',
        padding: '16px 24px',
        borderRadius: '16px',
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, var(--primary), #8b5cf6)', 
            padding: '8px', 
            borderRadius: '10px',
            color: 'white'
          }}>
            <LayoutDashboard size={20} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '600' }}>{getDashboardTitle()}</h2>
        </div>

        {(user.sector === 'TI' || user.role === 'FINANCE' || isSharedUser) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>
              <Filter size={14} style={{ verticalAlign: 'middle', marginRight: '6px' }} />
              Filtrar visão:
            </span>
            <select 
              value={selectedSector} 
              onChange={(e) => setSelectedSector(e.target.value)}
              style={{ 
                width: '220px', 
                marginBottom: 0, 
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {(user.role === 'FINANCE' || user.role === 'ADMIN') ? (
                <>
                  <option value="TODOS">Todos os Setores</option>
                  {allSectors.map(s => (
                    <option key={s.sector} value={s.sector}>{s.sector}</option>
                  ))}
                </>
              ) : (
                <>
                  <option value="MEUS_SETORES">Meus Setores (Consolidado)</option>
                  {sharedSectors.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </>
              )}
            </select>
          </div>
        )}
      </div>

      {/* Alerta de Dashboard Vazio para o Comercial */}
      {totalSpent === 0 && totalAnnualBudget === 0 && !isLoading && (
        <div className="card" style={{ 
          background: 'rgba(99, 102, 241, 0.05)', 
          border: '1px dashed var(--primary)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ background: 'var(--primary)', color: 'white', padding: '12px', borderRadius: '50%' }}>
            <Info size={32} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Seu Orçamento do Setor</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '500px', fontSize: '14px' }}>
              Você tem acesso total às solicitações e ao budget do seu setor (<strong>{isSharedUser ? 'Marketing e Comercial' : user.sector}</strong>). 
              No momento, não há dados de orçamento ou gastos cadastrados para esta visão.
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              background: 'var(--primary)', 
              color: 'white', 
              padding: '10px 24px',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Sincronizar Dados
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        <StatCard 
          title="Gasto Total" 
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSpent)} 
          trend={totalSpent > 0 ? "+12%" : "Sem gastos"} 
          trendUp={false} 
          icon={<DollarSign size={20} />} 
          color="#6366f1"
        />
        <StatCard 
          title="Pendentes" 
          value={filteredPurchases.filter(p => p.status === 'PENDING').length.toString()} 
          trend="Aguardando" 
          icon={<Clock size={20} />} 
          color="#f59e0b"
        />
        {(user.role === 'ADMIN' || isSharedUser || user.role === 'FINANCE') && (
          <StatCard 
            title="Orçamento Anual" 
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAnnualBudget)} 
            trend="Teto Definido" 
            icon={<TrendingUp size={20} />} 
            color="#ec4899"
          />
        )}
        <StatCard 
          title="Saldo Disponível" 
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.max(0, totalAnnualBudget - totalSpent))} 
          trend="Até o fim do ano" 
          icon={<CheckCircle size={20} />} 
          color="#10b981"
        />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: (sectorPieData.length > 0) ? '2fr 1fr' : '1fr', gap: '24px' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart3 size={18} color="var(--primary)" />
              Evolução Mensal: Budget vs Realizado
            </h3>
          </div>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis 
                  stroke="var(--text-muted)" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => val >= 1000 ? `R$ ${val/1000}k` : `R$ ${val}`} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '12px' }}
                  itemStyle={{ fontSize: '12px' }}
                  formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                />
                <Bar dataKey="budget" name="Planejado" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={24} minPointSize={2} />
                <Bar dataKey="spent" name="Realizado" fill="var(--success)" radius={[4, 4, 0, 0]} barSize={24} minPointSize={2} />

              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {sectorPieData.length > 0 && (
          <div className="card">
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieIcon size={18} color="var(--success)" />
              Gastos por Setor
            </h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorPieData}
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {sectorPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Recent Activity Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600' }}>Solicitações Recentes</h3>
          <button style={{ background: 'transparent', color: 'var(--primary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Ver todas <ArrowRight size={14} />
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px 24px' }}>Produto</th>
                <th>Setor</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {purchases.slice(0, 6).map(row => (
                <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '14px', transition: 'background 0.2s' }} className="table-row-hover">
                  <td style={{ padding: '16px 24px', fontWeight: '500' }}>{row.productName}</td>
                  <td>
                    <span style={{ fontSize: '12px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                      {row.sector}
                    </span>
                  </td>
                  <td style={{ fontWeight: '600' }}>R$ {parseFloat(row.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '11px',
                      fontWeight: '700',
                      background: row.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : row.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                      color: row.status === 'APPROVED' ? '#10b981' : row.status === 'REJECTED' ? '#ef4444' : '#f59e0b',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                      {row.status === 'APPROVED' ? 'Aprovado' : row.status === 'REJECTED' ? 'Recusado' : 'Pendente'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '13px' }}>{new Date(row.createdAt).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <ShoppingCart size={40} style={{ opacity: 0.2 }} />
                      <span>Nenhuma solicitação encontrada para esta visão.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .table-row-hover:hover {
          background: rgba(255, 255, 255, 0.02);
        }
      `}</style>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, trend: string, trendUp?: boolean, icon: React.ReactNode, color: string }> = ({ title, value, trend, trendUp, icon, color }) => (
  <div className="card" style={{ 
    position: 'relative', 
    overflow: 'hidden', 
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'default'
  }}>
    <div style={{ 
      position: 'absolute', 
      top: '0', 
      right: '0', 
      width: '80px', 
      height: '80px', 
      background: `linear-gradient(135deg, ${color}, transparent)`, 
      opacity: 0.1, 
      borderRadius: '0 0 0 100%' 
    }}></div>
    
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>{title}</div>
      <div style={{ 
        color, 
        background: `${color}15`, 
        padding: '8px', 
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>{icon}</div>
    </div>
    
    <div style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.02em' }}>{value}</div>
    
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
      <span style={{ 
        color: trendUp ? 'var(--success)' : trendUp === false ? 'var(--danger)' : 'var(--text-muted)',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        {trendUp === true && <TrendingUp size={14} />}
        {trendUp === false && <TrendingDown size={14} />}
        {trend}
      </span>
    </div>
  </div>
);

export default Dashboard;
