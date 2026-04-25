import React, { useState, useEffect } from 'react';
import { Filter, Search, Plus, AlertCircle, FileText, Download, ExternalLink, Link as LinkIcon, Trash2, Check, X } from 'lucide-react';
import { format, getDate } from 'date-fns';
import * as XLSX from 'xlsx';
import { API_URL } from '../config';

const PurchaseRequests: React.FC<{ 
  user: any, 
  showNewRequest: boolean, 
  setShowNewRequest: (show: boolean) => void,
  searchTerm: string
}> = ({ user, showNewRequest, setShowNewRequest, searchTerm }) => {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetails, setShowDetails] = useState<any>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [availableSectors, setAvailableSectors] = useState<any[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterSector, setFilterSector] = useState('ALL');
  const [sectors, setSectors] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    productName: '',
    productLink: '',
    description: '',
    amount: '',
    sector: user.sector || 'Operação',
    paymentMethod: 'BOLETO',
    dueDate: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    if (showNewRequest) {
      setFormData(prev => ({ ...prev, sector: user.sector }));
    }
  }, [showNewRequest, user]);

  const fetchData = () => {
    const sharedSectors = ['Marketing', 'Comercial', 'Eventos'];
    const afonsoSectors = ['Manutenção', 'Estação'];
    const isSharedUser = ['Grazi', 'Esther', 'Ramon'].includes(user.name);
    const isAfonso = user.name === 'Afonso';

    fetch(`${API_URL}/purchases`)
      .then(res => res.json())
      .then(data => {
        if (user.sector === 'TI' || user.role === 'FINANCE') {
          setPurchases(data);
        } else if (isSharedUser) {
          setPurchases(data.filter((p: any) => sharedSectors.includes(p.sector)));
        } else if (isAfonso) {
          setPurchases(data.filter((p: any) => afonsoSectors.includes(p.sector)));
        } else {
          setPurchases(data.filter((p: any) => p.sector === user.sector));
        }
      });
  };

  const fetchSectors = async () => {
    try {
      const res = await fetch(`${API_URL}/sectors`);
      const data = await res.json();
      setSectors(data.map((s: any) => s.sector));
    } catch (err) {
      console.error('Erro ao buscar setores:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchSectors();
    // Busca os setores cadastrados no banco
    fetch(`${API_URL}/budgets`)
      .then(res => res.json())
      .then(data => setAvailableSectors(data));
  }, [user]);

  const filteredPurchases = purchases.filter(p => {
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const matchSector = filterSector === 'ALL' || p.sector === filterSector;
    const matchSearch = 
      p.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sector?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.status?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSector && matchSearch;
  });

  const isLateInMonth = getDate(new Date()) >= 25;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount),
      requestedBy: user.name,
      productLink: formData.productLink 
    };

    await fetch(`${API_URL}/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    setShowNewRequest(false);
    fetchData();
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta solicitação?')) {
      await fetch(`${API_URL}/purchases/${id}`, {
        method: 'DELETE'
      });
      fetchData();
    }
  };

  const handleStatusChange = async (id: number, status: string, reason?: string) => {
    try {
      const res = await fetch(`${API_URL}/purchases/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason: reason })
      });
      if (res.ok) {
        setShowRejectModal(false);
        setRejectionReason('');
        fetchData();
      } else {
        alert('Erro ao atualizar status no servidor');
      }
    } catch (err) {
      alert('Erro de conexão com o servidor');
    }
  };

  const handleExport = () => {
    const dataToExport = purchases.map(p => ({
      'ID': p.id,
      'Produto': p.productName,
      'Setor': p.sector,
      'Valor (R$)': parseFloat(p.amount),
      'Vencimento': p.dueDate ? new Date(p.dueDate).toLocaleDateString() : '-',
      'Status': p.status,
      'Solicitado por': p.requestedBy,
      'Link': p.productLink || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Solicitações");

    const wscols = [
      { wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, 
      { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 40 }
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Gestao_Compras_${format(new Date(), 'dd_MM_yyyy')}.xlsx`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {isLateInMonth && (
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          border: '1px solid rgba(239, 68, 68, 0.2)', 
          padding: '16px', 
          borderRadius: 'var(--radius)',
          display: 'flex',
          gap: '12px',
          color: '#ef4444',
          alignItems: 'center'
        }}>
          <AlertCircle size={20} />
          <div>
            <strong>Atenção:</strong> Bloqueio de novas compras ativo (após dia 25). 
            Apenas solicitações críticas serão avaliadas.
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          {(user.sector === 'TI' || user.role === 'FINANCE') && (
            <button className="glass" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }} onClick={() => setShowFilters(!showFilters)}>
              <Filter size={16} /> Filtros
            </button>
          )}
          <button 
            className="glass" 
            style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
            onClick={handleExport}
          >
            <Download size={16} /> Exportar
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="card" style={{ marginBottom: '24px', padding: '16px', background: 'rgba(255,255,255,0.03)', display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Status</label>
            <select 
              value={filterStatus} 
              onChange={e => setFilterStatus(e.target.value)}
              style={{ width: '160px', padding: '8px' }}
            >
              <option value="ALL">Todos</option>
              <option value="PENDING">Pendentes</option>
              <option value="APPROVED">Aprovados</option>
              <option value="REJECTED">Recusados</option>
            </select>
          </div>
          
          {(user.role === 'ADMIN' || user.role === 'FINANCE') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Setor</label>
              <select 
                value={filterSector} 
                onChange={e => setFilterSector(e.target.value)}
                style={{ width: '160px', padding: '8px' }}
              >
                <option value="ALL">Todos os Setores</option>
                {sectors.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          <button 
            className="glass" 
            style={{ padding: '8px 16px', color: 'var(--text-muted)' }}
            onClick={() => { setFilterStatus('ALL'); setFilterSector('ALL'); }}
          >
            Limpar
          </button>
        </div>
      )}

      {/* Requests Table */}
      <div className="card" style={{ padding: '0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
            <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: '14px', borderBottom: '1px solid var(--border)' }}>
              <th style={{ padding: '16px 24px' }}>Solicitação</th>
              <th>Setor</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th style={{ padding: '16px 24px', textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredPurchases.map(req => (
                <tr key={req.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}>
                <td style={{ padding: '16px 12px' }}>
                  <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {req.productName}
                    {req.productLink && (
                      <a 
                        href={req.productLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ color: 'var(--primary)', display: 'flex' }}
                        title="Abrir link do produto"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    ID: #{req.id} • {req.paymentMethod} • Criado em: {format(new Date(new Date(req.createdAt).getTime() - 3 * 3600 * 1000), 'dd/MM/yy HH:mm')}
                  </div>
                  {req.rejectionReason && (
                    <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontStyle: 'italic' }}>
                      Motivo: {req.rejectionReason}
                    </div>
                  )}
                </td>
                <td>{req.sector}</td>
                <td>R$ {parseFloat(req.amount).toLocaleString()}</td>
                <td>{req.dueDate ? new Date(req.dueDate).toLocaleDateString() : '-'}</td>
                <td>
                   <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    background: req.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : req.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                    color: req.status === 'APPROVED' ? '#10b981' : req.status === 'REJECTED' ? '#ef4444' : '#f59e0b'
                  }}>
                    {req.status}
                  </span>
                </td>
                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {req.productLink && (
                      <a href={req.productLink} target="_blank" rel="noreferrer" className="glass" style={{ padding: '6px', borderRadius: '6px', color: 'var(--primary)' }}>
                        <LinkIcon size={16} />
                      </a>
                    )}
                    {(user.role === 'ADMIN' || user.role === 'FINANCE') && req.status === 'PENDING' && (
                      <>
                        <button 
                          onClick={() => handleStatusChange(req.id, 'APPROVED')}
                          className="glass" 
                          style={{ padding: '6px', borderRadius: '6px', color: 'var(--success)' }}
                          title="Aprovar"
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={() => {
                            setRejectId(req.id);
                            setShowRejectModal(true);
                          }}
                          className="glass" 
                          style={{ padding: '6px', borderRadius: '6px', color: 'var(--danger)' }}
                          title="Reprovar"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => handleDelete(req.id)}
                      className="glass" 
                      style={{ padding: '6px', borderRadius: '6px', color: 'var(--text-muted)' }}
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button 
                      onClick={() => setShowDetails(req)}
                      className="glass" 
                      style={{ padding: '6px', borderRadius: '6px' }}
                      title="Detalhes"
                    >
                      <FileText size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showNewRequest && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
            <h2 style={{ marginBottom: '24px' }}>Nova Solicitação de Compra</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Link do Produto (Opcional)</label>
                <input 
                  value={formData.productLink}
                  onChange={e => setFormData({...formData, productLink: e.target.value})}
                  placeholder="https://exemplo.com/produto" 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Nome do Produto / Serviço</label>
                <input 
                  required 
                  value={formData.productName}
                  onChange={e => setFormData({...formData, productName: e.target.value})}
                  placeholder="Ex: Notebook, Reforma..." 
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Descrição Detalhada</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Explique a necessidade desta compra..."
                  style={{ height: '80px', resize: 'none' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Valor (R$)</label>
                  <input 
                    type="number" 
                    required 
                    value={formData.amount}
                    onChange={e => setFormData({...formData, amount: e.target.value})}
                    placeholder="0,00" 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Setor</label>
                  <select 
                    value={formData.sector}
                    onChange={e => setFormData({...formData, sector: e.target.value})}
                    disabled={
                      user.role !== 'ADMIN' && 
                      user.role !== 'FINANCE' && 
                      !['Grazi', 'Esther', 'Ramon', 'Afonso'].includes(user.name)
                    }
                  >
                    {(!['Grazi', 'Esther', 'Ramon', 'Afonso'].includes(user.name) && user.role !== 'ADMIN' && user.role !== 'FINANCE') ? (
                       <option value={user.sector}>{user.sector}</option>
                    ) : (['Grazi', 'Esther', 'Ramon'].includes(user.name) && user.role !== 'ADMIN' && user.role !== 'FINANCE') ? (
                      <>
                        <option value="Marketing">Marketing</option>
                        <option value="Comercial">Comercial</option>
                        <option value="Eventos">Eventos</option>
                      </>
                    ) : (user.name === 'Afonso') ? (
                      <>
                        <option value="Manutenção">Manutenção</option>
                        <option value="Estação">Estação</option>
                      </>
                    ) : (
                      availableSectors.map(s => (
                        <option key={s.sector} value={s.sector}>{s.sector}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Forma de Pagamento</label>
                <select 
                   value={formData.paymentMethod}
                   onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                >
                  <option value="BOLETO">Boleto (30 dias)</option>
                  <option value="PIX">PIX</option>
                  <option value="CREDIT_CARD">Cartão</option>
                </select>
              </div>
              
              <div style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
                <button type="submit" style={{ flex: 1, background: 'var(--primary)', color: 'white', padding: '12px' }}>
                  Enviar Solicitação
                </button>
                <button type="button" onClick={() => setShowNewRequest(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: '#cbd5e1', padding: '12px' }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FAB */}
      {!showNewRequest && (
        <button 
          onClick={() => setShowNewRequest(true)}
          style={{
            position: 'fixed', bottom: '32px', right: '32px',
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'var(--primary)', color: 'white',
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <Plus size={24} />
        </button>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1001
        }}>
          <div className="card" style={{ width: '400px', maxWidth: '90%' }}>
            <h2 style={{ marginBottom: '16px', color: '#ef4444' }}>Motivo da Recusa</h2>
            <p style={{ marginBottom: '20px', fontSize: '14px', color: 'var(--text-muted)' }}>
              Por favor, informe por que esta solicitação está sendo recusada.
            </p>
            <textarea 
              autoFocus
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Ex: Valor acima do esperado, orçamento insuficiente..."
              style={{ height: '100px', resize: 'none', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={() => handleStatusChange(rejectId!, 'REJECTED', rejectionReason)}
                style={{ flex: 1, background: '#ef4444', color: 'white', padding: '12px' }}
              >
                Confirmar Recusa
              </button>
              <button 
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', padding: '12px' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1002
        }}>
          <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px' }}>Detalhes da Solicitação</h2>
              <button onClick={() => setShowDetails(null)} className="glass" style={{ padding: '4px 8px' }}>X</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Produto</div>
                  <div style={{ fontWeight: '600' }}>{showDetails.productName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Setor</div>
                  <div style={{ fontWeight: '600' }}>{showDetails.sector}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Descrição</div>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '8px', marginTop: '4px', fontSize: '14px' }}>
                  {showDetails.description || 'Nenhuma descrição fornecida.'}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Valor</div>
                  <div style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '18px' }}>
                    R$ {parseFloat(showDetails.amount).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Pagamento</div>
                  <div style={{ fontWeight: '600' }}>{showDetails.paymentMethod}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Data Solicitação</div>
                  <div style={{ fontWeight: '600' }}>{format(new Date(new Date(showDetails.createdAt).getTime() - 3 * 3600 * 1000), 'dd/MM/yyyy HH:mm')}</div>
                </div>
                {showDetails.productLink && (
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Link do Produto</div>
                    <a href={showDetails.productLink} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontSize: '14px', wordBreak: 'break-all', fontWeight: 'bold', textDecoration: 'underline' }}>
                      Acessar Produto
                    </a>
                  </div>
                )}
              </div>

              {showDetails.rejectionReason && (
                <div style={{ borderTop: '1px solid rgba(239, 68, 68, 0.2)', paddingTop: '16px' }}>
                  <div style={{ fontSize: '12px', color: '#ef4444' }}>Motivo da Recusa</div>
                  <div style={{ color: '#ef4444', fontStyle: 'italic', fontSize: '14px' }}>
                    {showDetails.rejectionReason}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={() => setShowDetails(null)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.05)', padding: '12px', marginTop: '24px' }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseRequests;
