import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ShoppingBag, Clock3, CheckCircle2, Truck, PackageOpen, History,
  MapPin, UserRound, Bike, RefreshCw, Search, AlertCircle,
  CalendarDays, ChevronDown, ChevronLeft, ChevronRight,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import WhatsAppIcon from '../../components/WhatsAppIcon';
import { adminApi } from '../../utils/api';
import { useAdminNavigation } from '../../utils/navigation';

// API status values are intentionally unchanged.
const STATUSES = ['Pending', 'Assigned', 'OutForDelivery', 'Delivered', 'Cancelled'];
const STATUS_LABEL = {
  Pending: 'Pending', Assigned: 'Assigned', OutForDelivery: 'Out for delivery',
  Delivered: 'Delivered', Cancelled: 'Cancelled',
};
const STATUS_TONE = {
  Pending: 'pending', Assigned: 'assigned', OutForDelivery: 'delivery',
  Delivered: 'delivered', Cancelled: 'cancelled',
};

const validDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
// All day buckets are calculated in the store timezone, not the browser timezone.
const STORE_TIMEZONE = 'Asia/Kolkata';
const dateKeyIST = (value) => {
  const date = validDate(value);
  if (!date) return null;
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: STORE_TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = (type) => parts.find(p => p.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
};
const todayKeyIST = () => dateKeyIST(new Date());
const shiftISODate = (key, days) => {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
};
const labelDate = (key) => {
  if (!key) return 'Date unavailable';
  const [year, month, day] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)));
};
const isToday = (value) => dateKeyIST(value) === todayKeyIST();
const orderTime = (value) => {
  const date = validDate(value);
  return date ? date.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Date unavailable';
};
const currency = (value) => {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })
    : '₹0.00';
};
const normalisePhone = (value) => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  return /^\d{11,15}$/.test(digits) ? digits : '';
};

export default function AdminOrdersScreen() {
  const navigation = useAdminNavigation();
  const navigationRef = useRef(navigation);
  navigationRef.current = navigation;
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);
  const savingRef = useRef(new Set());

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [savingIds, setSavingIds] = useState([]);
  const [tab, setTab] = useState('today');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [historyMode, setHistoryMode] = useState('day');
  const [selectedDay, setSelectedDay] = useState(() => shiftISODate(todayKeyIST(), -1));
  const [rangeStart, setRangeStart] = useState(() => shiftISODate(todayKeyIST(), -7));
  const [rangeEnd, setRangeEnd] = useState(() => shiftISODate(todayKeyIST(), -1));

  const load = useCallback(async (initial = false) => {
    const requestId = ++requestIdRef.current;
    if (initial) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const response = await adminApi.get('/orders');
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      if (!Array.isArray(response?.data)) {
        throw new Error('Invalid orders response: expected an array.');
      }
      setOrders(response.data);
    } catch (err) {
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      console.error('Failed to load orders:', err);
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        navigationRef.current.replace('AdminLogin');
        return;
      }
      setError('Could not load orders. Please check your connection and retry.');
    } finally {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load(true);
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [load]);

  const updateStatus = async (orderId, nextStatus) => {
    if (!STATUSES.includes(nextStatus) || savingRef.current.has(orderId)) return;
    const existing = orders.find(o => o.id === orderId);
    if (!existing || existing.status === nextStatus) return;
    savingRef.current.add(orderId);
    setSavingIds(prev => [...prev, orderId]);
    setActionError('');
    try {
      // Keep the original endpoint and payload. Only update UI after server confirmation.
      await adminApi.put(`/orders/${orderId}/status`, { status: nextStatus });
      if (mountedRef.current) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o));
      }
    } catch (err) {
      console.error('Order status update failed:', err);
      if (mountedRef.current) {
        setActionError(`Could not update order #${orderId}. No changes were saved.`);
      }
      if ([401, 403].includes(err?.response?.status) && mountedRef.current) {
        navigationRef.current.replace('AdminLogin');
      }
    } finally {
      savingRef.current.delete(orderId);
      if (mountedRef.current) setSavingIds(prev => prev.filter(id => id !== orderId));
    }
  };

  const sendWhatsAppMessage = (order) => {
    const phone = normalisePhone(order?.user?.phone);
    if (!phone) {
      window.alert('A valid customer phone number is not available for this order.');
      return;
    }
    const items = Array.isArray(order.items) ? order.items : [];
    const itemsList = items.map(item => `${item?.name || 'Item'} x${item?.qty ?? 1}`).join(', ') || 'N/A';
    const message = `Hello ${order.user?.name || 'Customer'},\n\n` +
      `*GrabZomart Order Update*\n\n` +
      `*Order ID:* #${order.id}\n` +
      `*Items:* ${itemsList}\n` +
      `*Total Amount:* ${currency(order.total)}\n` +
      `*Status:* ${STATUS_LABEL[order.status] || order.status || 'Pending'}\n` +
      `*Date:* ${order.created_at || 'Not available'}\n\n` +
      `Thank you for shopping with us!`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const todayOrders = useMemo(() => orders.filter(o => isToday(o.created_at)), [orders]);
  const historyOrders = useMemo(() => orders.filter(o => !isToday(o.created_at)), [orders]);
  const historicalDates = useMemo(() =>
    [...new Set(historyOrders.map(o => dateKeyIST(o.created_at)).filter(Boolean))]
      .sort((a, b) => b.localeCompare(a)), [historyOrders]);
  const maxHistoryDate = shiftISODate(todayKeyIST(), -1);
  const currentOrders = useMemo(() => {
    if (tab === 'today') return todayOrders;
    if (historyMode === 'range') {
      if (!rangeStart || !rangeEnd || rangeStart > rangeEnd) return [];
      return historyOrders.filter(o => {
        const key = dateKeyIST(o.created_at);
        return key && key >= rangeStart && key <= rangeEnd;
      });
    }
    return historyOrders.filter(o => dateKeyIST(o.created_at) === selectedDay);
  }, [tab, todayOrders, historyOrders, historyMode, rangeStart, rangeEnd, selectedDay]);
  const dailySummary = useMemo(() => ({
    total: currentOrders.length,
    delivered: currentOrders.filter(o => o.status === 'Delivered').length,
    cancelled: currentOrders.filter(o => o.status === 'Cancelled').length,
    revenue: currentOrders.filter(o => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (Number.isFinite(Number(o.total)) ? Number(o.total) : 0), 0),
  }), [currentOrders]);
  const visibleOrders = useMemo(() => {
    const search = query.trim().toLowerCase();
    return currentOrders.filter(o => {
      if (statusFilter !== 'All' && o.status !== statusFilter) return false;
      if (!search) return true;
      return [o.id, o.user?.name, o.user?.phone, o.address, o.worker?.name]
        .some(value => String(value ?? '').toLowerCase().includes(search));
    }).slice().sort((a, b) => {
      const dateA = validDate(a.created_at)?.getTime() || 0;
      const dateB = validDate(b.created_at)?.getTime() || 0;
      return dateB - dateA;
    });
  }, [currentOrders, statusFilter, query]);

  const metrics = [
    { label: 'Total orders', value: orders.length, icon: ShoppingBag, tone: 'violet' },
    { label: 'Pending', value: orders.filter(o => o.status === 'Pending').length, icon: Clock3, tone: 'amber' },
    { label: 'Out for delivery', value: orders.filter(o => o.status === 'OutForDelivery').length, icon: Truck, tone: 'blue' },
    { label: 'Delivered', value: orders.filter(o => o.status === 'Delivered').length, icon: CheckCircle2, tone: 'green' },
  ];

  return (
    <AdminLayout activeScreen="AdminOrders">
      <style>{styles}</style>
      <div className="gzo-page">
        <header className="gzo-heading">
          <div>
            <p className="gzo-eyebrow">STORE OPERATIONS / ORDER MANAGEMENT</p>
            <h1>Orders <span>management</span></h1>
            <p>Review customer purchases, manage fulfilment and keep every order on track.</p>
          </div>
          <button className="gzo-refresh" type="button" onClick={() => load(false)} disabled={loading || refreshing}>
            <RefreshCw size={17} className={refreshing ? 'gzo-spin' : ''} /> {refreshing ? 'Refreshing…' : 'Refresh orders'}
          </button>
        </header>

        <section className="gzo-metrics" aria-label="Order statistics">
          {metrics.map(metric => {
            const Icon = metric.icon;
            return <div className={`gzo-metric gzo-${metric.tone}`} key={metric.label}>
              <div className="gzo-metric-top"><span>{metric.label}</span><span className="gzo-metric-icon"><Icon size={21}/></span></div>
              <strong>{loading ? '—' : metric.value.toLocaleString('en-IN')}</strong>
            </div>;
          })}
        </section>

        <section className="gzo-panel" aria-label="Order list">
          <div className="gzo-panel-head">
            <div><h2>Order centre</h2><p>See what needs attention and manage every delivery.</p></div>
            <span className="gzo-count">{orders.length} orders</span>
          </div>
          <div className="gzo-toolbar">
            <div className="gzo-tabs" role="group" aria-label="Order date filter">
              <button type="button" className={tab === 'today' ? 'is-active' : ''} onClick={() => setTab('today')}><CalendarDays size={16}/> Today <b>{todayOrders.length}</b></button>
              <button type="button" className={tab === 'history' ? 'is-active' : ''} onClick={() => setTab('history')}><History size={16}/> History <b>{historyOrders.length}</b></button>
            </div>
            <div className="gzo-filters">
              <label className="gzo-search"><Search size={17}/><input aria-label="Search orders" placeholder="Search orders, customer, phone…" value={query} onChange={e => setQuery(e.target.value)}/></label>
              <label className="gzo-filter"><span className="gzo-sr-only">Filter by status</span><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="All">All statuses</option>{STATUSES.map(st => <option value={st} key={st}>{STATUS_LABEL[st]}</option>)}</select><ChevronDown size={15}/></label>
            </div>
          </div>

          {tab === 'history' && <section className="gzo-datepanel" aria-label="Browse order history by date">
            <div className="gzo-datepanel-top">
              <div><h3>Browse history by date</h3><p>Orders are grouped by Indian Standard Time (IST).</p></div>
              <div className="gzo-mode" role="group" aria-label="History selection mode">
                <button type="button" className={historyMode === 'day' ? 'active' : ''} onClick={() => setHistoryMode('day')}>Day-wise</button>
                <button type="button" className={historyMode === 'range' ? 'active' : ''} onClick={() => setHistoryMode('range')}>Date range</button>
              </div>
            </div>
            {historyMode === 'day' ? <>
              <div className="gzo-datecontrol">
                <button type="button" className="gzo-datenav" onClick={() => setSelectedDay(d => shiftISODate(d, -1))} aria-label="Previous day"><ChevronLeft size={17}/></button>
                <label className="gzo-datepicker"><CalendarDays size={17}/><span className="gzo-sr-only">Selected history date</span><input type="date" value={selectedDay} max={maxHistoryDate} onChange={e => { if (e.target.value) setSelectedDay(e.target.value); }}/></label>
                <button type="button" className="gzo-datenav" disabled={selectedDay >= maxHistoryDate} onClick={() => setSelectedDay(d => shiftISODate(d, 1))} aria-label="Next day"><ChevronRight size={17}/></button>
                <button type="button" className="gzo-yesterday" onClick={() => setSelectedDay(maxHistoryDate)}>Yesterday</button>
              </div>
              {historicalDates.length > 0 && <div className="gzo-datechips" aria-label="Dates containing orders">
                {historicalDates.slice(0, 12).map(day => <button type="button" key={day} className={selectedDay === day ? 'active' : ''} onClick={() => setSelectedDay(day)}>{day === maxHistoryDate ? 'Yesterday' : labelDate(day)} <span>{historyOrders.filter(o => dateKeyIST(o.created_at) === day).length}</span></button>)}
              </div>}
            </> : <div className="gzo-rangepicker">
              <label>From<input type="date" value={rangeStart} max={maxHistoryDate} onChange={e => setRangeStart(e.target.value)}/></label>
              <label>To<input type="date" value={rangeEnd} max={maxHistoryDate} onChange={e => setRangeEnd(e.target.value)}/></label>
              {rangeStart > rangeEnd && <span role="alert" className="gzo-rangeerror">Start date must be on or before end date.</span>}
            </div>}
            <div className="gzo-datesummary">
              <div className="gzo-datetitle"><span>{historyMode === 'day' ? labelDate(selectedDay) : `${rangeStart || '—'} to ${rangeEnd || '—'}`}</span><small>Summary for selected {historyMode === 'day' ? 'day' : 'period'}</small></div>
              <div><small>Total</small><strong>{dailySummary.total}</strong></div>
              <div><small>Delivered</small><strong>{dailySummary.delivered}</strong></div>
              <div><small>Cancelled</small><strong>{dailySummary.cancelled}</strong></div>
              <div><small>Non-cancelled value</small><strong>{currency(dailySummary.revenue)}</strong></div>
            </div>
          </section>}

          {error && <div className="gzo-alert" role="alert"><AlertCircle size={18}/>{error}<button type="button" onClick={() => load(false)}>Retry</button></div>}
          {actionError && <div className="gzo-alert" role="alert"><AlertCircle size={18}/>{actionError}<button type="button" onClick={() => setActionError('')}>Dismiss</button></div>}

          {loading ? <div className="gzo-state"><RefreshCw size={25} className="gzo-spin"/><strong>Loading orders…</strong><span>Fetching your latest order information</span></div> : (
            visibleOrders.length === 0 ? <div className="gzo-state"><PackageOpen size={34}/><strong>No matching orders</strong><span>{error ? 'Order data could not be loaded.' : 'No orders match this date, status or search.'}</span></div> :
              <div className="gzo-list">
                {visibleOrders.map(o => {
                  const tone = STATUS_TONE[o.status] || 'unknown';
                  const saving = savingIds.includes(o.id);
                  return <article className="gzo-order" key={o.id}>
                    <div className="gzo-order-head">
                      <div className="gzo-order-identity"><span className="gzo-order-symbol"><ShoppingBag size={19}/></span><div><h3>Order #{o.id}</h3><span className="gzo-date">{orderTime(o.created_at)}</span></div></div>
                      <div className="gzo-order-actions"><span className={`gzo-status gzo-status-${tone}`}>{STATUS_LABEL[o.status] || o.status || 'Unknown'}</span><label className="gzo-status-picker"><span className="gzo-sr-only">Update status for order {o.id}</span><select aria-label={`Update status of order ${o.id}`} disabled={saving} value={o.status || 'Pending'} onChange={e => updateStatus(o.id, e.target.value)}>{STATUSES.map(st => <option key={st} value={st}>{STATUS_LABEL[st]}</option>)}</select><ChevronDown size={14}/></label></div>
                    </div>
                    <div className="gzo-order-grid">
                      <div className="gzo-info"><UserRound size={17}/><div><span>Customer</span><strong>{o.user?.name || 'Unknown customer'}</strong><small>{o.user?.phone || 'No phone available'}</small></div></div>
                      <div className="gzo-info"><MapPin size={17}/><div><span>Delivery address</span><strong className="gzo-address">{o.address || 'Address unavailable'}</strong></div></div>
                      <div className="gzo-info"><Bike size={17}/><div><span>Delivery partner</span><strong>{o.worker?.name || 'Not assigned'}</strong></div></div>
                    </div>
                    {Array.isArray(o.items) && o.items.length > 0 && <div className="gzo-items">{o.items.map((item, i) => <span key={`${o.id}-${i}`}>{item?.name || 'Item'} <b>×{item?.qty ?? 1}</b></span>)}</div>}
                    <div className="gzo-order-bottom"><div className="gzo-amount"><span>Order total</span><strong>{currency(o.total)}</strong></div><button type="button" className="gzo-whatsapp" onClick={() => sendWhatsAppMessage(o)}><WhatsAppIcon size={17}/><span>WhatsApp update</span></button></div>
                    {saving && <div className="gzo-saving" role="status">Saving order status…</div>}
                  </article>;
                })}
              </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}

const styles = `
  .gzo-page{font-family:'Plus Jakarta Sans','Inter',system-ui,sans-serif;color:#221532;max-width:1500px;margin:auto;min-width:0;padding:4px 0 30px}
  .gzo-page *{box-sizing:border-box}.gzo-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:20px;flex-wrap:wrap;margin-bottom:25px}
  .gzo-eyebrow{margin:0 0 8px;font-size:10px;font-weight:800;letter-spacing:1.7px;color:#8355C0}
  .gzo-heading h1{margin:0;color:#231135;font-size:clamp(27px,3vw,37px);font-weight:850;line-height:1.2;letter-spacing:-1.3px}
  .gzo-heading h1 span{color:#7831CE}.gzo-heading p:not(.gzo-eyebrow){margin:8px 0 0;font-size:13px;line-height:1.65;color:#847992}
  .gzo-refresh{display:flex;align-items:center;justify-content:center;gap:9px;background:#fff;border:1px solid #E6DAF3;border-radius:11px;padding:12px 17px;color:#61329B;font-size:12px;font-weight:800;cursor:pointer;min-height:44px}.gzo-refresh:disabled{opacity:.6;cursor:wait}
  .gzo-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px;margin-bottom:25px}
  .gzo-metric{border-radius:18px;background:#fff;border:1px solid #EBE4F2;padding:21px 20px;min-width:0;box-shadow:0 7px 20px rgba(50,21,83,.035)}
  .gzo-metric-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.gzo-metric-top>span:first-child{font-size:12px;font-weight:750;color:#746780;padding-top:3px}.gzo-metric-icon{width:42px;height:42px;flex-shrink:0;border-radius:13px;display:grid;place-items:center;background:#F2E8FF;color:#792AE1}
  .gzo-metric strong{display:block;font-size:clamp(25px,3vw,35px);font-weight:850;color:#241437;letter-spacing:-1.2px;margin-top:12px;font-variant-numeric:tabular-nums}.gzo-amber .gzo-metric-icon{background:#FFF4DE;color:#C68610}.gzo-blue .gzo-metric-icon{background:#E9F1FE;color:#3676CA}.gzo-green .gzo-metric-icon{background:#E5F8EF;color:#15935B}
  .gzo-panel{background:#fff;border:1px solid #EAE3F0;border-radius:20px;box-shadow:0 10px 34px rgba(46,23,69,.04);overflow:hidden}
  .gzo-panel-head{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:24px 25px 19px}.gzo-panel-head h2{margin:0;font-size:19px;font-weight:850;letter-spacing:-.5px}.gzo-panel-head p{margin:6px 0 0;color:#897C94;font-size:12px}.gzo-count{border-radius:99px;background:#F2E9FC;color:#7531B8;padding:8px 12px;white-space:nowrap;font-size:11px;font-weight:800}
  .gzo-toolbar{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:0 25px 20px;flex-wrap:wrap;border-bottom:1px solid #EEE8F3}.gzo-tabs{display:flex;gap:5px;padding:4px;border-radius:12px;background:#F6F1FA}.gzo-tabs button{border:0;border-radius:9px;background:transparent;display:flex;align-items:center;gap:7px;min-height:36px;padding:8px 11px;color:#81708C;font-size:12px;font-weight:750;cursor:pointer}.gzo-tabs button.is-active{background:#6D28D9;color:white;box-shadow:0 2px 7px #6D28D920}.gzo-tabs b{font-size:10px;min-width:21px;text-align:center;background:#E9DFF2;border-radius:20px;padding:3px 5px;color:#745D8B}.gzo-tabs button.is-active b{background:#ffffff30;color:white}
  .gzo-filters{display:flex;align-items:center;gap:9px;flex:1;justify-content:flex-end;min-width:0}.gzo-search{display:flex;align-items:center;gap:8px;color:#8D7A9B;border:1px solid #E6DCEC;border-radius:10px;padding:0 12px;min-width:170px;max-width:310px;flex:1;background:#FCFAFE}.gzo-search input{width:100%;min-width:0;outline:0;border:0;background:transparent;height:40px;font-size:12px;color:#241437}.gzo-filter{display:flex;align-items:center;gap:2px;position:relative;border:1px solid #E6DCEC;border-radius:10px;background:#fff;min-height:42px;padding-right:10px}.gzo-filter select{appearance:none;border:0;outline:0;background:transparent;padding:0 12px;max-width:150px;color:#554464;font-size:12px;font-weight:700;cursor:pointer}.gzo-filter svg{pointer-events:none;color:#847194}
  .gzo-datepanel{padding:20px 25px;background:#FCFAFF;border-bottom:1px solid #EEE5F6}
  .gzo-datepanel-top{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}.gzo-datepanel h3{font-size:15px;margin:0;color:#32164F;font-weight:850}.gzo-datepanel p{font-size:11px;color:#857491;margin:4px 0 0}.gzo-mode{display:flex;border:1px solid #E4D6F2;border-radius:10px;overflow:hidden}.gzo-mode button{padding:9px 12px;color:#6C4C88;background:#fff;border:0;cursor:pointer;font-size:12px;font-weight:800}.gzo-mode button.active{background:#6D28D9;color:#fff}
  .gzo-datecontrol{display:flex;align-items:center;gap:8px;margin:18px 0 12px;flex-wrap:wrap}.gzo-datenav,.gzo-yesterday{min-height:39px;padding:0 12px;background:#fff;border:1px solid #E3D5F1;border-radius:9px;color:#6E30A6;font-weight:750;cursor:pointer}.gzo-datenav:disabled{opacity:.35;cursor:not-allowed}.gzo-datepicker{display:flex;align-items:center;gap:7px;border:1px solid #D9C7EE;background:#fff;border-radius:9px;padding:0 10px;color:#7530B8;min-height:40px}.gzo-datepicker input,.gzo-rangepicker input{border:0;background:transparent;min-height:38px;color:#351B50;font-family:inherit;font-weight:700;max-width:185px}
  .gzo-datechips{display:flex;gap:7px;overflow-x:auto;padding:2px 0 12px;scrollbar-width:thin}.gzo-datechips button{flex-shrink:0;background:#fff;border:1px solid #E5DAF0;color:#745A89;border-radius:9px;padding:9px 10px;font-size:11px;font-weight:700;cursor:pointer}.gzo-datechips button.active{background:#ECDDFF;border-color:#BE94EA;color:#57218D}.gzo-datechips button span{font-size:10px;margin-left:6px;background:#F3EBFB;padding:2px 6px;border-radius:30px}
  .gzo-rangepicker{display:flex;gap:12px;align-items:end;flex-wrap:wrap;margin:16px 0}.gzo-rangepicker label{display:flex;flex-direction:column;gap:4px;font-size:11px;color:#725887;font-weight:750}.gzo-rangepicker input{border:1px solid #E4D6F2;border-radius:8px;background:#fff;padding:0 10px}.gzo-rangeerror{color:#BD354C;font-size:11px;font-weight:700}
  .gzo-datesummary{background:#fff;border:1px solid #EDE2F5;border-radius:13px;padding:15px;display:grid;grid-template-columns:1.6fr repeat(4,minmax(0,1fr));gap:10px;margin-top:10px;align-items:center}.gzo-datesummary>div:not(:first-child){border-left:1px solid #EEE9F3;padding-left:12px;min-width:0}.gzo-datesummary small{font-size:10px;color:#8C7C98;display:block}.gzo-datesummary strong{font-size:16px;color:#34164F;display:block;margin-top:5px;overflow-wrap:anywhere}.gzo-datetitle span{font-size:13px;color:#502477;font-weight:850;display:block;margin-bottom:5px}
  .gzo-alert{margin:18px 25px 0;padding:12px 14px;background:#FFF4F4;border:1px solid #F8CDCD;border-radius:11px;color:#A22A3A;display:flex;align-items:center;gap:10px;font-size:12px;font-weight:700}.gzo-alert button{margin-left:auto;border:0;background:#fff;border-radius:7px;padding:6px 9px;cursor:pointer;color:#A22A3A;font-weight:800}
  .gzo-list{padding:8px 25px 25px}.gzo-order{position:relative;border:1px solid #EDE6F1;border-radius:16px;margin-top:16px;background:#fff;overflow:hidden;transition:box-shadow .2s,border-color .2s}.gzo-order:hover{border-color:#D9C2EF;box-shadow:0 8px 28px #3D166D0C}.gzo-order-head{padding:17px 19px;display:flex;align-items:center;justify-content:space-between;gap:14px;border-bottom:1px solid #F1ECF5;flex-wrap:wrap}.gzo-order-identity{display:flex;align-items:center;gap:11px}.gzo-order-symbol{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:#F1E6FE;color:#7928D5;flex-shrink:0}.gzo-order h3{font-size:14px;margin:0 0 3px;font-weight:850;color:#26153A}.gzo-date{font-size:11px;color:#93859B}.gzo-order-actions{display:flex;gap:9px;align-items:center;flex-wrap:wrap}.gzo-status{font-size:10px;font-weight:800;padding:8px 11px;border-radius:8px;background:#F4F1F8;color:#71637E}.gzo-status-pending{background:#FFF4E2;color:#A56B0C}.gzo-status-assigned{background:#E9F2FF;color:#306CAC}.gzo-status-delivery{background:#F1E7FF;color:#782CC9}.gzo-status-delivered{background:#E5F8ED;color:#147B49}.gzo-status-cancelled{background:#FFEBEC;color:#C0444D}.gzo-status-picker{display:flex;align-items:center;position:relative;border:1px solid #E7DEEF;border-radius:8px;min-height:34px;padding-right:9px}.gzo-status-picker select{border:0;background:transparent;appearance:none;padding:0 8px;color:#6C547E;font-size:11px;font-weight:800;cursor:pointer;outline:0;max-width:160px}.gzo-status-picker svg{pointer-events:none;color:#7F688E}.gzo-status-picker:has(select:disabled){opacity:.5}
  .gzo-order-grid{padding:17px 19px;display:grid;grid-template-columns:1fr 1.35fr 1fr;gap:15px}.gzo-info{display:flex;align-items:flex-start;gap:9px;min-width:0}.gzo-info>svg{color:#9E7CBF;flex-shrink:0;margin-top:2px}.gzo-info>div{min-width:0;display:flex;flex-direction:column;gap:4px}.gzo-info span{font-size:10px;font-weight:700;color:#94869C}.gzo-info strong{font-size:12px;color:#362745;font-weight:750;overflow-wrap:anywhere;line-height:1.5}.gzo-info small{font-size:11px;color:#877B90}.gzo-address{max-width:100%;display:block}
  .gzo-items{display:flex;flex-wrap:wrap;gap:7px;padding:0 19px 16px}.gzo-items span{font-size:11px;color:#6B4C85;background:#F7F1FE;border:1px solid #EEE4FA;padding:7px 9px;border-radius:8px}.gzo-items b{font-weight:850;color:#612AA2}
  .gzo-order-bottom{display:flex;align-items:center;justify-content:space-between;gap:16px;border-top:1px solid #F1ECF5;padding:15px 19px;background:#FCFAFE}.gzo-amount{display:flex;flex-direction:column;gap:4px}.gzo-amount span{font-size:10px;color:#877A91;font-weight:650}.gzo-amount strong{font-size:19px;letter-spacing:-.5px;color:#33164E;font-weight:850}.gzo-whatsapp{display:flex;align-items:center;justify-content:center;gap:9px;background:#25B96C;color:#fff;border:0;border-radius:10px;padding:12px 16px;font-size:12px;font-weight:800;cursor:pointer;min-height:43px}.gzo-whatsapp:hover{background:#199A57}.gzo-saving{padding:7px 19px;background:#FFF8E8;color:#976216;font-size:11px;font-weight:750}
  .gzo-state{min-height:240px;padding:35px 20px;display:flex;align-items:center;justify-content:center;gap:11px;flex-direction:column;color:#927DA4;text-align:center}.gzo-state strong{font-size:15px;color:#4F3663}.gzo-state span{font-size:12px}.gzo-spin{animation:gzo-spin 1s linear infinite}@keyframes gzo-spin{to{transform:rotate(360deg)}}.gzo-sr-only{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip:rect(0,0,0,0)!important;white-space:nowrap!important;border:0!important}
  @media(max-width:1100px){.gzo-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.gzo-order-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.gzo-filters{justify-content:flex-start}}
  @media(max-width:650px){.gzo-page{padding:0 0 20px}.gzo-heading{align-items:stretch;margin-bottom:18px}.gzo-heading h1{font-size:28px}.gzo-heading p:not(.gzo-eyebrow){font-size:12px}.gzo-refresh{width:100%}.gzo-metrics{gap:9px;margin-bottom:16px}.gzo-metric{padding:15px;border-radius:14px}.gzo-metric-icon{width:32px;height:32px;border-radius:9px}.gzo-metric-icon svg{width:17px;height:17px}.gzo-metric-top>span:first-child{font-size:10px}.gzo-metric strong{font-size:25px;margin-top:10px}.gzo-panel{border-radius:15px}.gzo-panel-head{padding:19px 15px 14px}.gzo-toolbar{padding:0 15px 14px}.gzo-tabs{width:100%}.gzo-tabs button{flex:1;justify-content:center}.gzo-filters{width:100%}.gzo-search{min-width:0}.gzo-filter select{max-width:118px}.gzo-list{padding:0 11px 15px}.gzo-order{margin-top:12px}.gzo-order-head{padding:13px}.gzo-order-grid{grid-template-columns:1fr;gap:14px;padding:14px}.gzo-items{padding:0 14px 14px}.gzo-order-bottom{padding:13px;flex-wrap:wrap}.gzo-whatsapp{flex:1}.gzo-alert{margin:12px 12px 0}.gzo-datepanel{padding:15px 12px}.gzo-datesummary{grid-template-columns:repeat(2,minmax(0,1fr))}.gzo-datetitle{grid-column:1/-1}.gzo-datesummary>div:not(:first-child){padding-left:9px}.gzo-datepanel-top{align-items:start}.gzo-mode{width:100%}.gzo-mode button{flex:1}}
  @media(max-width:350px){.gzo-metrics{grid-template-columns:1fr}.gzo-order-actions{width:100%}.gzo-whatsapp{width:100%}}
`;
