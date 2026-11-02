import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, X, Users, MessageSquare, Pencil, RefreshCw, AlertCircle, Send, ChevronLeft, ChevronRight, Check, Phone, ClipboardList } from 'lucide-react';
import AdminLayout from './AdminLayout';
import WhatsAppIcon from '../../components/WhatsAppIcon';
import { adminApi } from '../../utils/api';

// Existing message templates are intentionally kept unchanged.
const SERVER_MODE = process.env.REACT_APP_CRM_SERVER_PAGINATION === 'true';
const PER_PAGE = 18;

const DEFAULT_TEMPLATES = [
  { id: 1, name: '🎉 New Offer', text: `Hello {name}! 👋\n\n🎉 *Special Offer Just for You!*\n\n🛒 Shop fresh fruits & vegetables at amazing prices!\n🏷️ Use code: *SAVE20* to get *20% OFF*\n\n🚀 Order now & get delivery at your doorstep!\n\n👉 Open App & Order Now!\n\n_Fruites Bazzar Team_ 🍎` },
  { id: 2, name: '🍎 New Arrivals', text: `Hello {name}! 👋\n\n🍎 *Fresh Stock Available Now!*\n\n✅ Fresh Mangoes\n✅ Organic Vegetables  \n✅ Exotic Fruits\n\n🚚 Fast delivery to your door!\n💰 Best prices guaranteed!\n\nOrder now on our app! 🛒\n\n_Fruites Bazzar_ 🌿` },
  { id: 3, name: '💰 Flash Sale', text: `Hello {name}! 🔥\n\n⚡ *FLASH SALE — Today Only!*\n\n🥭 Mangoes — 20% OFF\n🍇 Grapes — 15% OFF\n🥦 Vegetables — 10% OFF\n\n⏰ Limited time offer!\n🛒 Order before midnight!\n\n_Fruites Bazzar Team_ 🍎` },
  { id: 4, name: '🙏 Thank You', text: `Hello {name}! 🙏\n\nThank you for shopping with *Fruites Bazzar!* 🍎\n\nWe hope you enjoyed our fresh products.\n\n⭐ Please rate us & share with friends!\n🎁 Refer a friend & get *₹50 OFF* on next order!\n\nSee you again soon! 😊\n\n_Fruites Bazzar Team_` },
];

function getPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `91${digits.slice(1)}`;
  if (digits.length >= 11 && digits.length <= 15) return digits;
  return '';
}
function whatsappLink(user, template) {
  const phone = getPhone(user?.phone);
  if (!phone) return null;
  const message = template.text.replace(/\{name\}/g, user?.name || 'Sir/Madam');
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
function openWhatsApp(user, template) {
  const url = whatsappLink(user, template);
  if (!url) return false;
  const newWindow = window.open(url, '_blank');
  if (newWindow) newWindow.opener = null;
  // Opening the tab never means that a WhatsApp message was delivered.
  return Boolean(newWindow);
}

export default function AdminCRMScreen() {
  const [users, setUsers] = useState([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [requestVersion, setRequestVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [selectedId, setSelectedId] = useState(DEFAULT_TEMPLATES[0].id);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editText, setEditText] = useState('');
  const [searchTxt, setSearchTxt] = useState('');
  const [page, setPage] = useState(1);
  const [batch, setBatch] = useState(null);
  const [batchIndex, setBatchIndex] = useState(0);
  const [message, setMessage] = useState('');

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError('');
    try {
      const response = SERVER_MODE
        ? await adminApi.get('/users', { params: { page, limit: PER_PAGE, search: searchTxt.trim() }, signal })
        : await adminApi.get('/users', { signal });
      if (signal?.aborted) return;
      if (SERVER_MODE) {
        const body = response.data;
        if (!body || !Array.isArray(body.users) || !Number.isFinite(Number(body.total))) {
          throw new Error('Backend pagination response must contain users[] and total');
        }
        setUsers(body.users);
        setTotalCustomers(Number(body.total));
      } else {
        if (!Array.isArray(response.data)) throw new Error('Invalid customers response');
        setUsers(response.data);
        setTotalCustomers(response.data.length);
      }
    } catch (err) {
      if (signal?.aborted || err?.code === 'ERR_CANCELED') return;
      setError('Unable to load customers. Please retry.');
      console.error('CRM customers load failed:', err);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [page, searchTxt, requestVersion]);
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);
  const refresh = () => setRequestVersion((v) => v + 1);

  const selectedTpl = templates.find((t) => t.id === selectedId) || templates[0];
  const filteredUsers = useMemo(() => {
    const q = searchTxt.trim().toLowerCase();
    if (SERVER_MODE || !q) return users;
    return users.filter((u) => String(u?.name || '').toLowerCase().includes(q) || String(u?.phone || '').includes(q));
  }, [users, searchTxt]);
  const totalPages = Math.max(1, Math.ceil((SERVER_MODE ? totalCustomers : filteredUsers.length) / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const visibleUsers = SERVER_MODE ? filteredUsers : filteredUsers.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
  const reachable = (SERVER_MODE ? visibleUsers : filteredUsers).filter((u) => getPhone(u.phone)).length;

  const sendToUser = (user) => {
    if (!whatsappLink(user, selectedTpl)) {
      setMessage('This customer does not have a valid WhatsApp phone number.');
      return;
    }
    setMessage('WhatsApp was opened. Review and press Send inside WhatsApp to deliver the message.');
    if (!openWhatsApp(user, selectedTpl)) {
      setMessage('Your browser may have blocked the new tab. Allow pop-ups, then try again.');
    }
  };
  const startBatch = () => {
    const valid = (SERVER_MODE ? visibleUsers : filteredUsers).filter((u) => getPhone(u.phone));
    if (!valid.length) { setMessage('No customers with valid phone numbers in the current search.'); return; }
    if (!window.confirm(`Review WhatsApp messages for ${valid.length} customers? Each message must be sent manually inside WhatsApp.`)) return;
    setBatch({ users: valid, template: { ...selectedTpl } });
    setBatchIndex(0);
    setMessage('');
  };
  const batchUser = batch?.users[batchIndex];
  const advanceBatch = () => {
    if (!batch) return;
    if (batchIndex + 1 >= batch.users.length) {
      setBatch(null);
      setMessage('Review complete. Message delivery is not tracked in this dashboard.');
    } else setBatchIndex((n) => n + 1);
  };
  const editTemplate = (template) => {
    setEditingId(template.id);
    setEditName(template.name);
    setEditText(template.text);
  };
  const saveTemplate = (e) => {
    e.preventDefault();
    if (!editName.trim() || !editText.trim()) return;
    setTemplates((old) => old.map((t) => t.id === editingId ? { ...t, name: editName.trim(), text: editText } : t));
    setEditingId(null);
    setMessage('Template saved for this session. It is not stored on the server.');
  };

  return (
    <AdminLayout activeScreen="AdminCRM">
      <style>{`
        .crm-pro{font-family:inherit;color:#241932;max-width:1440px;margin:auto;padding:28px 30px 64px;min-width:0}
        .crm-pro *{box-sizing:border-box}.crm-pro button,.crm-pro input,.crm-pro textarea{font:inherit}
        .crm-heading{display:flex;align-items:center;justify-content:space-between;gap:18px;margin-bottom:22px;flex-wrap:wrap}
        .crm-eyebrow{font-size:11px;letter-spacing:1.6px;color:#8334DD;font-weight:900;text-transform:uppercase}
        .crm-title{font-size:clamp(24px,3vw,32px);font-weight:900;letter-spacing:-1px;margin:6px 0 4px}
        .crm-muted{font-size:13px;color:#80748F;line-height:1.55}
        .crm-action{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:11px 16px;border-radius:11px;border:1px solid #E6D9F6;background:#fff;color:#6D28D9;font-size:13px;font-weight:800;cursor:pointer;white-space:nowrap}
        .crm-action.primary{background:#7B2FF7;border-color:#7B2FF7;color:white;box-shadow:0 6px 16px rgba(123,47,247,.17)}
        .crm-action:disabled{opacity:.45;cursor:not-allowed}.crm-action:focus-visible,.crm-input:focus-visible,.crm-pro button:focus-visible{outline:3px solid #CBA8F8;outline-offset:2px}
        .crm-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:22px}
        .crm-stat{padding:18px 20px;border-radius:16px;border:1px solid #EAE2F5;background:#fff;box-shadow:0 4px 24px rgba(52,19,99,.035)}
        .crm-stat-num{font-size:27px;font-weight:900;letter-spacing:-1px;color:#291A43}.crm-stat-label{font-size:12px;font-weight:650;color:#857991;margin-top:4px}
        .crm-two{display:grid;grid-template-columns:minmax(250px,.87fr) minmax(0,1.5fr);gap:18px;margin-bottom:22px}
        .crm-panel{background:#fff;border:1px solid #E9E0F4;border-radius:18px;padding:22px;min-width:0;box-shadow:0 5px 24px rgba(50,19,100,.035)}
        .crm-panel-head{font-size:16px;font-weight:900;letter-spacing:-.3px;margin:0 0 6px}.crm-panel-sub{font-size:12px;color:#81758F;margin:0 0 18px;line-height:1.5}
        .crm-template-list{display:grid;grid-template-columns:1fr;gap:9px}
        .crm-template{width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;border:1px solid #EBE2F4;background:#FCFAFE;color:#3C2D50;border-radius:12px;padding:13px;text-align:left;font-size:13px;font-weight:750;cursor:pointer}
        .crm-template.selected{background:#F2E9FF;border-color:#AD87E8;color:#6925CC}
        .crm-preview-top{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px}
        .crm-preview{white-space:pre-wrap;overflow-wrap:anywhere;background:linear-gradient(145deg,#F8F5FE,#F9FBFF);padding:20px;border:1px solid #EBE2F5;border-radius:14px;font-size:13px;line-height:1.65;min-height:210px;max-height:370px;overflow-y:auto}
        .crm-tip{display:flex;align-items:flex-start;gap:7px;color:#796F87;font-size:11px;margin-top:12px;line-height:1.5}
        .crm-customers-top{display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom:16px}
        .crm-search{display:flex;align-items:center;gap:9px;border:1px solid #E6DDF0;border-radius:12px;padding:0 12px;background:#fff;min-height:45px;max-width:440px;flex:1;min-width:185px}
        .crm-input{width:100%;min-width:0;padding:10px 0;border:0;outline:none;background:transparent;font-size:13px;color:#2A1E3A}
        .crm-card-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
        .crm-user{background:#fff;border:1px solid #EAE3F3;border-radius:15px;padding:15px;display:flex;align-items:center;gap:12px;min-width:0}
        .crm-avatar{width:43px;height:43px;flex:none;border-radius:13px;background:#F1E5FF;color:#742BDA;display:grid;place-items:center;font-size:17px;font-weight:900}
        .crm-user-detail{min-width:0;flex:1}.crm-user-name{font-size:13px;font-weight:850;white-space:nowrap;text-overflow:ellipsis;overflow:hidden}.crm-user-phone{font-size:12px;color:#857991;margin-top:4px;overflow:hidden;text-overflow:ellipsis}
        .crm-wa{width:39px;height:39px;flex:none;display:grid;place-items:center;border:0;border-radius:11px;background:#e6f9ed;color:#119B52;cursor:pointer}
        .crm-wa:disabled{opacity:.35;cursor:not-allowed}.crm-empty{text-align:center;color:#83798F;border:1px dashed #DED0EF;background:#fff;padding:40px;border-radius:16px}
        .crm-pages{display:flex;justify-content:center;align-items:center;gap:12px;margin-top:20px;color:#71657E;font-size:12px;font-weight:700}
        .crm-alert{border-radius:12px;padding:12px 15px;margin-bottom:18px;font-size:12px;background:#F5ECFF;color:#6425B7;border:1px solid #E4D3FA;display:flex;align-items:center;gap:9px}
        .crm-alert.error{background:#FFF0F0;border-color:#FFDCDC;color:#B42332}
        .crm-backdrop{position:fixed;inset:0;background:rgba(19,12,32,.55);z-index:1100;display:grid;place-items:center;padding:14px}
        .crm-modal{background:white;border-radius:20px;width:min(100%,560px);max-height:90vh;overflow-y:auto;padding:24px;box-shadow:0 20px 70px rgba(15,8,29,.3)}
        .crm-modal-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:18px}
        .crm-field-label{display:block;font-size:12px;font-weight:800;margin:14px 0 7px}.crm-field{width:100%;border-radius:11px;border:1px solid #E2D7EE;padding:12px;background:#FCFAFF;font-size:13px;color:#271B39}
        .crm-field:focus{outline:3px solid #E8D8FE}.crm-textarea{min-height:210px;resize:vertical;line-height:1.6}
        .crm-modal-actions{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:18px}
        @media(max-width:1150px){.crm-card-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:800px){.crm-pro{padding:18px 14px 56px}.crm-two{grid-template-columns:minmax(0,1fr)}.crm-template-list{grid-template-columns:repeat(2,minmax(0,1fr))}.crm-panel{padding:18px}}
        @media(max-width:560px){.crm-pro{padding:14px 10px 52px}.crm-stats{gap:7px}.crm-stat{padding:13px 10px}.crm-stat-num{font-size:21px}.crm-stat-label{font-size:10px}.crm-title{font-size:24px}.crm-heading .crm-action{width:100%}.crm-template-list{grid-template-columns:minmax(0,1fr)}.crm-card-grid{grid-template-columns:minmax(0,1fr)}.crm-search{max-width:none;width:100%}.crm-customers-top{align-items:stretch}.crm-panel{padding:15px}.crm-modal{padding:18px}.crm-preview{padding:15px}.crm-action{padding:11px 12px}}
      `}</style>
      <main className="crm-pro" data-testid="admin-crm-screen">
        <header className="crm-heading">
          <div><div className="crm-eyebrow">Customer relationships</div><h1 className="crm-title">CRM & Customers</h1><div className="crm-muted">Manage your audience and WhatsApp message templates</div></div>
          <button type="button" className="crm-action primary" onClick={startBatch} disabled={loading || !reachable} data-testid="send-all-whatsapp-btn"><Send size={15} /> {SERVER_MODE ? 'Review Page WhatsApp' : 'Review Bulk WhatsApp'} <span>({reachable})</span></button>
        </header>
        <section className="crm-stats" aria-label="CRM overview">
          <div className="crm-stat"><div className="crm-stat-num">{totalCustomers}</div><div className="crm-stat-label">Total customers</div></div>
          <div className="crm-stat"><div className="crm-stat-num">{reachable}</div><div className="crm-stat-label">{SERVER_MODE ? 'Contacts on this page' : 'Matching contacts'}</div></div>
          <div className="crm-stat"><div className="crm-stat-num">{templates.length}</div><div className="crm-stat-label">Message templates</div></div>
        </section>
        {error && <div className="crm-alert error" role="alert"><AlertCircle size={16} /> {error}<button className="crm-action" onClick={refresh} type="button"><RefreshCw size={13}/> Retry</button></div>}
        {message && <div className="crm-alert" role="status"><ClipboardList size={15}/><span style={{flex:1}}>{message}</span><button type="button" aria-label="Dismiss notice" onClick={() => setMessage('')} style={{background:'none',border:0,cursor:'pointer'}}><X size={15}/></button></div>}
        <div className="crm-two">
          <section className="crm-panel"><h2 className="crm-panel-head">Message templates</h2><p className="crm-panel-sub">Choose the message your customers will see in WhatsApp.</p><div className="crm-template-list">{templates.map((tpl) => <button key={tpl.id} type="button" className={`crm-template ${selectedTpl.id === tpl.id ? 'selected' : ''}`} onClick={() => setSelectedId(tpl.id)} data-testid={`template-chip-${tpl.id}`} aria-pressed={selectedTpl.id === tpl.id}><span>{tpl.name}</span>{selectedTpl.id === tpl.id && <Check size={16}/>}</button>)}</div></section>
          <section className="crm-panel" data-testid="template-preview-card"><div className="crm-preview-top"><div><h2 className="crm-panel-head" style={{display:'flex',alignItems:'center',gap:7,margin:0}}><MessageSquare size={17} color="#7B2FF7" /> Message preview</h2><p className="crm-panel-sub" style={{margin:'5px 0 0'}}>Selected template: {selectedTpl.name}</p></div><button type="button" className="crm-action" onClick={() => editTemplate(selectedTpl)} data-testid="edit-template-btn"><Pencil size={14}/> Edit template</button></div><div className="crm-preview">{selectedTpl.text.replace(/\{name\}/g, 'Customer')}</div><div className="crm-tip">{'{name}'} is replaced with each customer's name. Edits are session-only (not saved to backend).</div></section>
        </div>
        <section aria-label="Customers">
          <div className="crm-customers-top"><div><h2 className="crm-panel-head" style={{marginBottom:3}}>Customer directory</h2><div className="crm-muted">{SERVER_MODE ? totalCustomers : filteredUsers.length} matching customer{(SERVER_MODE ? totalCustomers : filteredUsers.length) === 1 ? '' : 's'}</div></div><div className="crm-search"><Search size={17} color="#987EAF"/><input className="crm-input" placeholder="Search name or mobile number" aria-label="Search customers" value={searchTxt} onChange={(e) => {setSearchTxt(e.target.value);setPage(1);}} data-testid="customer-search-input"/>{searchTxt && <button type="button" aria-label="Clear search" onClick={() => {setSearchTxt('');setPage(1);}} style={{border:0,background:'none',cursor:'pointer',display:'flex'}} data-testid="clear-search-btn"><X size={16}/></button>}</div><button type="button" className="crm-action" onClick={refresh} disabled={loading}><RefreshCw size={15}/> Refresh</button></div>
          {loading ? <div className="crm-empty">Loading CRM customers…</div> : filteredUsers.length === 0 ? <div className="crm-empty" data-testid="empty-customers-state"><Users size={30} style={{marginBottom:12}}/><div>{error ? 'Customers could not be loaded' : 'No customers found'}</div></div> : <><div className="crm-card-grid">{visibleUsers.map((u) => <div className="crm-user" key={u.id} data-testid={`user-card-${u.id}`}><div className="crm-avatar">{u.name?.[0]?.toUpperCase() || '?'}</div><div className="crm-user-detail"><div className="crm-user-name" title={u.name || 'Unknown'}>{u.name || 'Unknown customer'}</div><div className="crm-user-phone" title={u.phone || ''}><Phone size={11} style={{verticalAlign:'middle',marginRight:5}}/>{u.phone || 'No phone'}</div></div><button type="button" className="crm-wa" aria-label={`Open WhatsApp for ${u.name || 'customer'}`} onClick={() => sendToUser(u)} disabled={!getPhone(u.phone)} data-testid={`whatsapp-btn-${u.id}`}><WhatsAppIcon size={19}/></button></div>)}</div>{totalPages > 1 && <div className="crm-pages"><button className="crm-action" type="button" disabled={currentPage === 1} onClick={() => setPage((n) => Math.max(1,n-1))}><ChevronLeft size={16}/> Prev</button><span>Page {currentPage} / {totalPages}</span><button className="crm-action" type="button" disabled={currentPage === totalPages} onClick={() => setPage((n) => Math.min(totalPages,n+1))}>Next <ChevronRight size={16}/></button></div>}</>}
        </section>
      </main>
      {editingId !== null && <div className="crm-backdrop" onClick={() => setEditingId(null)} data-testid="edit-template-modal-overlay"><form className="crm-modal" onSubmit={saveTemplate} onClick={(e) => e.stopPropagation()} aria-label="Edit WhatsApp template"><div className="crm-modal-head"><h2 className="crm-panel-head" style={{margin:0}}>Edit template</h2><button type="button" className="crm-action" aria-label="Close modal" onClick={() => setEditingId(null)} data-testid="close-modal-btn"><X size={17}/></button></div><label className="crm-field-label" htmlFor="crm-edit-name">Template name *</label><input className="crm-field" id="crm-edit-name" value={editName} onChange={(e) => setEditName(e.target.value)} required data-testid="edit-template-name-input"/><label className="crm-field-label" htmlFor="crm-edit-text">Message text *</label><textarea className="crm-field crm-textarea" id="crm-edit-text" value={editText} onChange={(e) => setEditText(e.target.value)} required data-testid="edit-template-text-input"/><div className="crm-tip">Changes last until the page is refreshed. Existing backend has no template-save endpoint.</div><div className="crm-modal-actions"><button type="button" className="crm-action" onClick={() => setEditingId(null)}>Cancel</button><button type="submit" className="crm-action primary" data-testid="save-template-btn"><Check size={15}/> Save template</button></div></form></div>}
      {batch && batchUser && <div className="crm-backdrop" onClick={() => setBatch(null)}><div className="crm-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Bulk WhatsApp review"><div className="crm-modal-head"><h2 className="crm-panel-head" style={{margin:0}}>WhatsApp review · {batchIndex + 1}/{batch.users.length}</h2><button type="button" className="crm-action" onClick={() => setBatch(null)} aria-label="Close bulk review"><X size={17}/></button></div><div className="crm-muted">Customer: <strong>{batchUser.name || 'Unknown'}</strong> · {batchUser.phone}</div><div className="crm-preview" style={{minHeight:120,maxHeight:230,marginTop:14}}>{batch.template.text.replace(/\{name\}/g, batchUser.name || 'Sir/Madam')}</div><div className="crm-tip">Opening WhatsApp does not send a message. Review it and press Send inside WhatsApp. You can skip any contact.</div><div className="crm-modal-actions"><button type="button" className="crm-action" onClick={advanceBatch}>Skip / Next</button><button type="button" className="crm-action primary" onClick={() => {openWhatsApp(batchUser, batch.template); advanceBatch();}}><WhatsAppIcon size={16}/> Open WhatsApp & Next</button></div></div></div>}
    </AdminLayout>
  );
}
