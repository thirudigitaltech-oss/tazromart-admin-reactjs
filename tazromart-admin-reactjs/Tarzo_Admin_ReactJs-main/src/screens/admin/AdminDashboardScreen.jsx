import React, { useCallback, useEffect, useState } from 'react';
import {
  BaggageClaim, Clock3, CheckCircle2, Apple, Users, Bike,
  PlusCircle, UserPlus, Tag,  ArrowUpRight,
  ChevronRight, RefreshCw, ShoppingCart, Activity,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { adminApi } from '../../utils/api';
import { useAdminNavigation } from '../../utils/navigation';
import { palette, s } from './DashboardStyle';

const quickActions = [
  { screen: 'AdminOrders', icon: BaggageClaim, label: 'Manage Orders', color: '#6D28D9', bg: '#F3EAFF' },
  { screen: 'AdminProducts', icon: Apple, label: 'Product Catalogue', color: '#7C3AED', bg: '#F1EAFE' },
  { screen: 'AdminWorkers', icon: Users, label: 'Delivery Partners', color: '#C0801A', bg: '#FFF4DF' },
  { screen: 'AdminAddProduct', icon: PlusCircle, label: 'Add Product', color: '#6D28D9', bg: '#F3EAFF' },
  { screen: 'AdminAddWorker', icon: UserPlus, label: 'Add Worker', color: '#4678C8', bg: '#EAF1FF' },
  { screen: 'AdminOffers', icon: Tag, label: 'Manage Offers', color: '#BB5968', bg: '#FFF0F1' },
];

const formatNumber = (value) => Number(value || 0).toLocaleString('en-IN');

export default function AdminDashboardScreen() {
  const navigation = useAdminNavigation();
  const [stats, setStats] = useState({});
  const [oStats, setOStats] = useState({ total: 0, active: 0, delivered: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Preserves the original API endpoints and status classification.
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const [dashboardResult, ordersResult] = await Promise.allSettled([
      adminApi.get('/dashboard'),
      adminApi.get('/orders'),
    ]);

    if (dashboardResult.status === 'fulfilled') {
      setStats(dashboardResult.value.data || {});
    } else {
      const status = dashboardResult.reason?.response?.status;
      if (status === 401 || status === 403) {
        navigation.replace('AdminLogin');
        return;
      }
      setError('Some dashboard information could not be loaded. Please refresh.');
    }

    if (ordersResult.status === 'fulfilled') {
      const incoming = ordersResult.value.data;
      const all = Array.isArray(incoming) ? incoming : [];
      const active = all.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
      const delivered = all.filter(o => o.status === 'Delivered');
      const cancelled = all.filter(o => o.status === 'Cancelled');
      setOStats({ total: all.length, active: active.length, delivered: delivered.length, cancelled: cancelled.length });
    } else {
      setError('Some dashboard information could not be loaded. Please refresh.');
    }
    setLoading(false);
  }, [navigation]);

  useEffect(() => { load(); }, [load]);

  const metrics = [
    { label: 'Total Orders', value: oStats.total, icon: ShoppingCart, color: '#6D28D9', bg: '#F3EAFF', note: 'All recorded orders' },
    { label: 'Active Orders', value: oStats.active, icon: Clock3, color: '#C0801A', bg: '#FFF4DF', note: 'Currently in progress' },
    { label: 'Delivered Orders', value: oStats.delivered, icon: CheckCircle2, color: '#4678C8', bg: '#EAF1FF', note: 'Completed deliveries' },
    { label: 'Products', value: stats.total_products || 0, icon: Apple, color: '#7C3AED', bg: '#F1EAFE', note: 'Catalogue inventory' },
    { label: 'Online Workers', value: stats.online_workers || 0, icon: Users, color: '#6D28D9', bg: '#F3EAFF', note: 'Currently available online' },
    { label: 'Busy Workers', value: stats.busy_workers || 0, icon: Bike, color: '#BB5968', bg: '#FFF0F1', note: 'Currently occupied' },
  ];
  const completion = oStats.total ? Math.round((oStats.delivered / oStats.total) * 100) : 0;
  const segments = [
    { label: 'Delivered', value: oStats.delivered, color: '#6D28D9' },
    { label: 'Active', value: oStats.active, color: '#E0A12F' },
    { label: 'Cancelled', value: oStats.cancelled, color: '#D96F6F' },
  ];

  return (
    <AdminLayout activeScreen="AdminDashboard">
      <style>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");
        .gzm-dash * { box-sizing: border-box; } .gzm-dash{font-family:"Plus Jakarta Sans",Inter,system-ui,sans-serif;}
        .gzm-dash .gzm-stats { grid-template-columns: repeat(3,minmax(0,1fr)); }
        .gzm-dash .gzm-action:hover { border-color: #CBAAF8 !important; background:#FAF7FF !important; transform:translateY(-2px); }
        .gzm-dash .gzm-action:focus-visible, .gzm-dash .gzm-refresh:focus-visible { outline:3px solid #AA79EA;outline-offset:3px; }
        .gzm-dash .gzm-refresh { background:#fff;border:1px solid #E9E3F2;border-radius:9px;padding:7px 10px;color:#42584C;cursor:pointer;display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700; }
        @media(max-width:1150px){.gzm-dash .gzm-stats {grid-template-columns:repeat(2,minmax(0,1fr));}.gzm-dash .gzm-panels {grid-template-columns:1fr!important;}}
        @media(max-width:600px){.gzm-dash .gzm-stats {grid-template-columns:repeat(2,minmax(0,1fr));gap:10px!important;}.gzm-dash .gzm-stat {padding:14px!important;}.gzm-dash .gzm-value {font-size:26px!important;}.gzm-dash .gzm-banner {padding:23px 19px!important;border-radius:17px!important;}.gzm-dash .gzm-banner-mark {display:none!important;}.gzm-dash .gzm-panel {padding:17px!important;}.gzm-dash .gzm-actions {grid-template-columns:1fr!important;}}
        @media(max-width:360px){.gzm-dash .gzm-stats {grid-template-columns:1fr;}}
      `}</style>
      <div className="gzm-dash" style={s.page}>
        <header style={s.headingArea}>
          <div>
            <div style={s.eyebrow}>STORE OPERATIONS / OVERVIEW</div>
            <h1 style={s.title}>Dashboard overview</h1>
            <p style={s.subtitle}>A clearer view of your orders, fulfilment and delivery operations.</p>
          </div>
          <div style={s.livePill}><span style={s.liveDot} /> Operations overview</div>
        </header>

        <section className="gzm-banner" style={s.banner} aria-label="Dashboard introduction">
          <div style={s.bannerGlow} />
          <div style={s.bannerContent}>
            <div style={s.bannerKicker}>TAZRO / OPERATIONS HQ</div>
            <h2 style={s.bannerTitle}>Your store. In control.</h2>
            <p style={s.bannerText}>Manage grocery orders, inventory and delivery operations from one powerful workspace.</p>
          </div>
          <div className="gzm-banner-mark" style={s.bannerMark}><Apple size={42} strokeWidth={1.8} /></div>
        </section>

        <div style={s.sectionHead}>
          <h2 style={s.sectionTitle}>Key performance metrics</h2>
          <button className="gzm-refresh" type="button" onClick={load} disabled={loading} aria-label="Refresh dashboard metrics"><RefreshCw size={14} /> {loading ? 'Refreshing' : 'Refresh'}</button>
        </div>
        {error && <div style={s.error} role="alert">{error}</div>}
        {loading ? <div style={s.loading}>Loading your dashboard metrics…</div> : (
          <div className="gzm-stats" style={s.statsGrid}>
            {metrics.map(item => {
              const Icon = item.icon;
              return <div className="gzm-stat" key={item.label} style={s.stat}>
                <div style={s.statTop}><span style={s.statLabel}>{item.label}</span><span style={{...s.statIcon,background:item.bg}}><Icon size={21} color={item.color} strokeWidth={2} /></span></div>
                <div className="gzm-value" style={s.statValue}>{formatNumber(item.value)}</div>
                <div style={s.statFoot}>{item.note}</div>
              </div>;
            })}
          </div>
        )}

        <div className="gzm-panels" style={s.lowerGrid}>
          <section className="gzm-panel" style={s.panel}>
            <div style={s.panelTop}><div><h2 style={s.panelTitle}>Quick access</h2><p style={s.panelDesc}>Everything you need to run your store efficiently.</p></div><ArrowUpRight size={19} color="#789185" /></div>
            <div className="gzm-actions" style={s.actionGrid}>
              {quickActions.map(action => {
                const Icon = action.icon;
                return <button className="gzm-action" key={action.screen} type="button" style={s.action} onClick={() => navigation.navigate(action.screen)}>
                  <span style={s.actionLeft}><span style={{...s.actionIcon,background:action.bg}}><Icon size={19} color={action.color} /></span><span style={s.actionLabel}>{action.label}</span></span>
                  <ChevronRight size={16} color="#A69BB4" />
                </button>;
              })}
            </div>
          </section>
          <section className="gzm-panel" style={s.panel}>
            <div style={s.panelTop}><div><h2 style={s.panelTitle}>Order fulfilment</h2><p style={s.panelDesc}>Breakdown of all recorded orders.</p></div><Activity size={19} color={palette.primary} /></div>
            <div style={{display:'flex',alignItems:'baseline',gap:9,margin:'23px 0 5px'}}><span style={{fontSize:39,fontWeight:800,letterSpacing:'-1.5px'}}>{completion}%</span><span style={{fontSize:12,color:palette.muted}}>delivered</span></div>
            <div style={s.progressTrack} aria-label={`${completion}% orders delivered`}>
              {segments.map(seg => <span key={seg.label} style={{width:`${oStats.total ? (seg.value/oStats.total)*100 : 0}%`,background:seg.color}} />)}
            </div>
            {segments.map(seg => <div key={seg.label} style={s.statusRow}><span style={s.statusLabel}><span style={{...s.statusDot,background:seg.color}} />{seg.label}</span><span style={s.statusValue}>{formatNumber(seg.value)}</span></div>)}
            <div style={s.statusTotal}><span>Total orders</span><strong style={{color:palette.text}}>{formatNumber(oStats.total)}</strong></div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
