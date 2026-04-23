import React, { useState } from 'react';
import { LayoutDashboard, ShoppingCart, Wallet, Users, LogOut, Search, Bell, Plus } from 'lucide-react';
import LottieLogo from './components/LottieLogo';
import Dashboard from './pages/Dashboard';
import PurchaseRequests from './pages/PurchaseRequests';
import BudgetManagement from './pages/BudgetManagement';
import AdminPanel from './pages/AdminPanel';
import Login from './components/Login';
import ChangePassword from './components/ChangePassword';

type Tab = 'dashboard' | 'purchases' | 'budget' | 'admin' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  if (user.mustChangePassword) {
    return <ChangePassword user={user} onPasswordChanged={setUser} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard user={user} />;
      case 'purchases': return <PurchaseRequests user={user} showNewRequest={showNewRequest} setShowNewRequest={setShowNewRequest} searchTerm={searchTerm} />;
      case 'budget': return <BudgetManagement user={user} />;
      case 'admin': return <AdminPanel user={user} />;
      default: return <Dashboard user={user} />;
    }
  };

  return (
    <div className="app-container" style={{ display: 'flex', height: '100vh', background: 'var(--bg-main)' }}>
      {/* Sidebar */}
      <aside className="sidebar" style={{
        width: '260px',
        background: 'var(--bg-sidebar)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--border)'
      }}>
        <div style={{ padding: '0 8px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '20px', fontWeight: 'bold' }}>
          <LottieLogo size={40} />
          <span>Alles Kaufen</span>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SidebarItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={<ShoppingCart size={20} />} 
            label="Solicitações" 
            active={activeTab === 'purchases'} 
            onClick={() => setActiveTab('purchases')} 
          />
          {user.name !== 'Afonso' && (
            <SidebarItem 
              icon={<Wallet size={20} />} 
              label="Budget / Orçamentos" 
              active={activeTab === 'budget'} 
              onClick={() => setActiveTab('budget')} 
            />
          )}
          {user.role === 'ADMIN' && (
            <SidebarItem 
              icon={<Users size={20} />} 
              label="Administração" 
              active={activeTab === 'admin'} 
              onClick={() => setActiveTab('admin')} 
            />
          )}
        </nav>

        <div className="user-profile" style={{
          marginTop: 'auto',
          padding: '16px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 'var(--radius)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#334155' }}></div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{user.sector}</div>
            </div>
          <LogOut 
            size={16} 
            style={{ cursor: 'pointer', color: 'var(--text-muted)' }} 
            onClick={() => setUser(null)}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '32px' 
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600' }}>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
              Bem-vindo de volta, {user.name}.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
              <input 
                placeholder="Pesquisar..." 
                style={{ paddingLeft: '40px', width: '240px' }}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="glass" style={{ padding: '10px', borderRadius: '50%', color: 'white' }}>
              <Bell size={20} />
            </button>
            <button 
              onClick={() => {
                setActiveTab('purchases');
                setShowNewRequest(true);
              }}
              style={{ 
                background: 'var(--primary)', 
                color: 'white', 
                padding: '10px 20px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                fontWeight: '500'
              }}
            >
              <Plus size={18} />
              Nova Solicitação
            </button>
          </div>
        </header>

        {renderContent()}
      </main>

      <style>{`
        .sidebar-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: var(--radius);
          transition: all 0.2s;
          color: var(--text-muted);
          cursor: pointer;
        }
        .sidebar-item:hover {
          background: rgba(255,255,255,0.05);
          color: var(--text-main);
        }
        .sidebar-item.active {
          background: var(--primary);
          color: white;
        }
      `}</style>
    </div>
  );
};

const SidebarItem: React.FC<{ icon: React.ReactNode, label: string, active?: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <div className={`sidebar-item ${active ? 'active' : ''}`} onClick={onClick}>
    {icon}
    <span style={{ fontWeight: active ? '600' : '400' }}>{label}</span>
  </div>
);

export default App;
