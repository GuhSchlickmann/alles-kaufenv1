import React, { useState, useEffect } from 'react';
import { LayoutDashboard, ShoppingCart, Wallet, Users, LogOut, Search, Bell, Plus } from 'lucide-react';
import LottieLogo from './components/LottieLogo';
import Dashboard from './pages/Dashboard';
import PurchaseRequests from './pages/PurchaseRequests';
import BudgetManagement from './pages/BudgetManagement';
import AdminPanel from './pages/AdminPanel';
import Login from './components/Login';
import ChangePassword from './components/ChangePassword';
import { API_URL } from './config';

type Tab = 'dashboard' | 'purchases' | 'budget' | 'admin' | 'settings';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [user, setUser] = useState<any>(null);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = () => {
    if (user && user.username) {
      fetch(`${API_URL}/notifications/${user.username}`)
        .then(res => res.json())
        .then(data => setNotifications(data))
        .catch(err => console.error('Erro ao buscar notificações:', err));
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = async (id: number) => {
    await fetch(`${API_URL}/notifications/${id}/read`, { method: 'POST' });
    fetchNotifications();
  };

  const clearNotifications = async () => {
    if (user && user.username) {
      await fetch(`${API_URL}/notifications/${user.username}`, { method: 'DELETE' });
      fetchNotifications();
    }
  };

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
          {user.sector === 'TI' && (
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
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="glass" 
                style={{ padding: '10px', borderRadius: '50%', color: 'white', position: 'relative' }}
              >
                <Bell size={20} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span style={{
                    position: 'absolute', top: '-2px', right: '-2px',
                    width: '18px', height: '18px', borderRadius: '50%',
                    background: '#ef4444', color: 'white', fontSize: '10px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold', border: '2px solid var(--bg-main)'
                  }}>
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="card" style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '12px',
                  width: '320px', zIndex: 1002, padding: '0', overflow: 'hidden',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                }}>
                  <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', fontWeight: '600', display: 'flex', justifyContent: 'space-between' }}>
                    Notificações
                    <span 
                      onClick={clearNotifications}
                      style={{ fontSize: '11px', color: 'var(--primary)', cursor: 'pointer' }}
                    >
                      Limpar
                    </span>
                  </div>
                  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {notifications.length > 0 ? notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => markAsRead(n.id)}
                        style={{ 
                          padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.03)', 
                          cursor: 'pointer', background: n.read ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                          transition: '0.2s'
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: n.read ? '500' : '700', marginBottom: '4px' }}>{n.title}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{n.message}</div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.2)', marginTop: '8px' }}>
                          {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    )) : (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
                        Nenhuma notificação por enquanto.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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
