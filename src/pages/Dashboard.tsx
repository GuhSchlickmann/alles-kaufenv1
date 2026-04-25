import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { DollarSign, Clock, CheckCircle, TrendingUp, TrendingDown, PieChart as PieChartIcon } from 'lucide-react';
import { API_URL } from '../config';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard: React.FC<{ user: any }> = ({ user }) => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [selectedSector, setSelectedSector] = useState<string>(user.sector);
  const [allSectors, setAllSectors] = useState<any[]>([]);

  useEffect(() => {
    const sharedSectors = ['Marketing', 'Comercial', 'Eventos'];
    const isSharedUser = ['Grazi', 'Esther', 'Ramon'].includes(user.name);
    const isAfonso = user.name === 'Afonso';
    const afonsoSectors = ['Marketing', 'Comercial', 'Eventos', 'TI', 'RH', 'Financeiro', 'Jurídico', 'Diretoria'];

    fetch(`${API_URL}/purchases`)
      .then(res => res.json())
      .then(data => {
        if (user.role === 'FINANCE' || user.role === 'ADMIN') {
          setPurchases(data);
        } else if (isSharedUser) {
          setPurchases(data.filter((p: any) => sharedSectors.includes(p.sector)));
        } else if (isAfonso) {
          setPurchases(data.filter((p: any) => afonsoSectors.includes(p.sector)));
        } else {
          setPurchases(data.filter((p: any) => p.sector === user.sector));
        }
      });

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

    fetch(`${API_URL}/seasonality/${selectedSector}`)
      .then(res => res.json())
      .then(data => setMonthlyData(data));

    fetch(`${API_URL}/sectors`)
      .then(res => res.json())
      .then(data => setAllSectors(data));
  }, [user, selectedSector]);

  // Filtragem Dinâmica
  const filteredPurchases = selectedSector === 'TODOS' 
    ? purchases 
    : purchases.filter(p => p.sector === selectedSector);

  const filteredBudgets = selectedSector === 'TODOS' 
    ? budgets 
    : budgets.filter(b => b.sector === selectedSector);

  const totalSpent = filteredBudgets.reduce((acc, curr) => acc + parseFloat(curr.spent || 0), 0);
  const totalMonthlyBudget = filteredBudgets.reduce((acc, curr) => acc + parseFloat(curr.monthly_budget || 0), 0);
  const totalAnnualBudget = filteredBudgets.reduce((acc, curr) => acc + parseFloat(curr.annual_budget || 0), 0);

  const sectorPieData = budgets.map(b => ({
    name: b.sector,
    value: b.spent
  })).filter(b => b.value > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Filtro de Setor */}
      {(user.sector === 'TI' || user.role === 'FINANCE') && (
        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>Filtrar por Setor:</span>
          <select 
            value={selectedSector} 
            onChange={(e) => setSelectedSector(e.target.value)}
            style={{ width: '200px', marginBottom: 0 }}
          >
            <option value="TODOS">Todos os Setores</option>
            {allSectors.map(s => (
              <option key={s.sector} value={s.sector}>{s.sector}</option>
            ))}
          </select>
        </div>
      )}
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        {user.name !== 'Afonso' && (
          <StatCard 
            title="Gasto Total" 
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSpent)} 
            trend="+12%" 
            trendUp={false} 
            icon={<DollarSign size={20} />} 
            color="#6366f1"
          />
        )}
        <StatCard 
          title="Pendentes" 
          value={filteredPurchases.filter(p => p.status === 'PENDING').length.toString()} 
          trend="Aguardando" 
          icon={<Clock size={20} />} 
          color="#f59e0b"
        />
        {user.role === 'ADMIN' && (
          <StatCard 
            title="Planejamento Anual" 
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalAnnualBudget)} 
            trend="Meta Total" 
            icon={<TrendingUp size={20} />} 
            color="#ec4899"
          />
        )}
        {user.name !== 'Afonso' && (
          <StatCard 
            title="Disponível no Mês" 
            value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalMonthlyBudget - totalSpent)} 
            trend="Saldo Atual" 
            icon={<CheckCircle size={20} />} 
            color="#10b981"
          />
        )}
      </div>

      {/* Charts Row */}
      {(user.role === 'FINANCE' || user.role === 'ADMIN') ? (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Evolução Mensal: Budget vs Realizado</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val/1000}k`} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255, 255, 255, 0.03)' }}
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                    formatter={(value: any) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
                  />
                  <Bar dataKey="budget" name="Planejado" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="spent" name="Realizado" fill="var(--success)" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            {selectedSector !== 'TODOS' && (
               <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center' }}>
                 * Exibindo orçamento mensal planejado da empresa vs gasto real do setor {selectedSector}.
               </p>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>Gastos por Setor</h3>
            <div style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sectorPieData.length > 0 ? sectorPieData : [{ name: 'Sem gastos', value: 1 }]}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {sectorPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    {sectorPieData.length === 0 && <Cell fill="rgba(255,255,255,0.05)" />}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: '40px', textAlign: 'center', background: 'rgba(99, 102, 241, 0.05)' }}>
          <DollarSign size={48} style={{ color: 'var(--primary)', marginBottom: '16px', opacity: 0.5 }} />
          <h3>Seu Orçamento do Setor</h3>
          <p style={{ color: 'var(--text-muted)' }}>Você tem acesso total às solicitações e ao budget do seu setor (**{user.sector}**).</p>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>Solicitações Recentes</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '14px', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '12px 0' }}>Produto</th>
              <th>Setor</th>
              <th>Valor</th>
              <th>Status</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {purchases.slice(0, 5).map(row => (
              <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}>
                <td style={{ padding: '16px 0', fontWeight: '500' }}>{row.productName}</td>
                <td>{row.sector}</td>
                <td>R$ {parseFloat(row.amount).toLocaleString()}</td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    background: row.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: row.status === 'APPROVED' ? '#10b981' : '#f59e0b'
                  }}>
                    {row.status}
                  </span>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{new Date(row.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {purchases.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  Nenhuma solicitação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string, value: string, trend: string, trendUp?: boolean, icon: React.ReactNode, color: string }> = ({ title, value, trend, trendUp, icon, color }) => (
  <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
    <div style={{ 
      position: 'absolute', 
      top: '0', 
      right: '0', 
      width: '60px', 
      height: '60px', 
      background: color, 
      opacity: 0.1, 
      borderRadius: '0 0 0 100%' 
    }}></div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{title}</div>
      <div style={{ color }}>{icon}</div>
    </div>
    <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>{value}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
      <span style={{ color: trendUp ? 'var(--success)' : 'var(--text-muted)' }}>{trend}</span>
      {trendUp !== undefined && (trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />)}
    </div>
  </div>
);

export default Dashboard;
