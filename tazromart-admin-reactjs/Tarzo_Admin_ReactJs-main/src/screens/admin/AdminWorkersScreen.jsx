import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  Plus,
  Phone,
  Trash2,
  MapPin,
  Search,
  RefreshCw,
  Users,
  CircleCheck,
  Bike,
  CircleOff,
  AlertCircle
} from 'lucide-react';

import AdminLayout from './AdminLayout';
import { adminApi } from '../../utils/api';
import { useAdminNavigation } from '../../utils/navigation';

const PRIMARY = '#7130D8';
const LOW = (value) => String(value == null ? '' : value).toLowerCase();

export default function AdminWorkersScreen() {
  const navigation = useAdminNavigation();
  const [workers, setWorkers] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [busyIds, setBusyIds] = useState([]);
  const requestSeq = useRef(0);
  const mounted = useRef(true);
  const actionIds = useRef(new Set());

  const load = useCallback(async (initial = false) => {
    const seq = ++requestSeq.current;
    if (initial) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const [workersResponse, zonesResponse] = await Promise.all([
        adminApi.get('/workers'),
        adminApi.get('/zones'),
      ]);
      if (!mounted.current || seq !== requestSeq.current) return;
      if (!Array.isArray(workersResponse.data) || !Array.isArray(zonesResponse.data)) {
        throw new Error('Unexpected workers or zones response');
      }
      setWorkers(workersResponse.data);
      setZones(zonesResponse.data);
    } catch (err) {
      if (!mounted.current || seq !== requestSeq.current) return;
      console.error('Failed to load delivery partners:', err);
      setError('Unable to load delivery partners. Check your connection and try again.');
    } finally {
      if (mounted.current && seq === requestSeq.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load(true);
    return () => {
      mounted.current = false;
      requestSeq.current += 1;
    };
  }, [load]);

  const runAction = async (workerId, operation) => {
    const key = String(workerId);
    if (actionIds.current.has(key)) return;
    actionIds.current.add(key);
    if (mounted.current) setBusyIds((ids) => [...ids, key]);
    try {
      await operation();
      await load();
    } catch (err) {
      console.error('Worker action failed:', err);
      if (mounted.current) window.alert(err?.response?.data?.detail || 'Unable to save. Please try again.');
    } finally {
      actionIds.current.delete(key);
      if (mounted.current) setBusyIds((ids) => ids.filter((id) => id !== key));
    }
  };

  const handleDelete = (worker) => {
    if (!window.confirm(`Delete ${worker.name || 'this delivery partner'}? This action cannot be undone.`)) return;
    runAction(worker.id, () => adminApi.delete(`/workers/${worker.id}`));
  };

  const handleZoneChange = (workerId, value) => {
    const zone_id = value === '' ? null : Number(value);
    if (zone_id !== null && !Number.isFinite(zone_id)) return;
    // Same API contract as the existing screen. UI updates only after server success.
    runAction(workerId, () => adminApi.put(`/workers/${workerId}/zone`, { zone_id }));
  };

  const onlineCount = workers.filter((w) => Boolean(w.is_active)).length;
  const busyCount = workers.filter((w) => Boolean(w.is_busy)).length;
  const offlineCount = workers.length - onlineCount;
  const zoneNames = useMemo(() => new Map(zones.map((z) => [String(z.id), z.name])), [zones]);
  const shown = useMemo(() => workers.filter((w) => {
    const matchesSearch = [w.name, w.phone, w.id, zoneNames.get(String(w.zone_id))]
      .some((v) => LOW(v).includes(LOW(search.trim())));
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'online' && Boolean(w.is_active))
      || (statusFilter === 'busy' && Boolean(w.is_busy))
      || (statusFilter === 'offline' && !w.is_active);
    const matchesZone = zoneFilter === 'all'
      || (zoneFilter === 'none' && (w.zone_id === null || w.zone_id === undefined || w.zone_id === ''))
      || (zoneFilter !== 'none' && String(w.zone_id) === zoneFilter);
    return matchesSearch && matchesStatus && matchesZone;
  }), [workers, search, statusFilter, zoneFilter, zoneNames]);

  return (
    <AdminLayout activeScreen="AdminWorkers" data-testid="admin-workers-screen">
      <style>{`
        .gzw * {box-sizing:border-box}
        .gzw {font-family:'Plus Jakarta Sans',Inter,system-ui,sans-serif;color:#251736;max-width:1500px;margin:0 auto}
        .gzw button,.gzw input,.gzw select {font:inherit}
        .gzw button:focus-visible,.gzw select:focus-visible,.gzw input:focus-visible{outline:3px solid #C3A6F8;outline-offset:2px}
        .gzw-top{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:25px}
        .gzw-kicker{font-size:11px;letter-spacing:1.6px;color:#873DE5;font-weight:800;text-transform:uppercase}
        .gzw-title{font-size:clamp(26px,2.8vw,36px);font-weight:850;letter-spacing:-1.2px;margin:7px 0 8px}
        .gzw-sub{margin:0;color:#82738E;font-size:13px;line-height:1.6}
        .gzw-actions{display:flex;gap:9px;flex-wrap:wrap}
        .gzw-btn{border-radius:12px;padding:12px 16px;display:inline-flex;align-items:center;justify-content:center;gap:8px;font-size:12px!important;font-weight:800!important;min-height:44px;cursor:pointer}
        .gzw-primary{color:white;background:linear-gradient(120deg,#8234E5,#6320C5);border:1px solid #6924C7;box-shadow:0 8px 22px #7830DA25}
        .gzw-secondary{background:#fff;border:1px solid #E9DDF9;color:#6230AE}
        .gzw-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:13px;margin-bottom:22px}
        .gzw-stat{background:white;border:1px solid #EAE1F5;border-radius:17px;padding:19px;display:flex;align-items:center;gap:13px;box-shadow:0 4px 17px #51258B08}
        .gzw-stat-icon{height:45px;width:45px;border-radius:13px;display:grid;place-items:center;flex-shrink:0}
        .gzw-stat-value{font-size:26px;font-weight:850;letter-spacing:-1px;font-variant-numeric:tabular-nums}
        .gzw-stat-label{font-size:12px;color:#8A7C95;margin-top:2px;font-weight:650}
        .gzw-toolbar{background:white;border:1px solid #EAE1F5;border-radius:17px;padding:14px;display:flex;gap:11px;align-items:center;flex-wrap:wrap;margin-bottom:19px}
        .gzw-search{flex:1 1 280px;display:flex;gap:10px;align-items:center;background:#FAF8FD;border:1px solid #EDE5F6;border-radius:11px;padding:0 12px;min-width:0}
        .gzw-search input{border:0;outline:0;min-width:0;width:100%;height:45px;background:transparent;color:#261636;font-size:13px}
        .gzw-filter{min-height:45px;flex:0 1 180px;min-width:135px;border:1px solid #EDE5F6;border-radius:11px;background:#FAF8FD;color:#40304E;padding:0 11px;font-size:12px!important;font-weight:700!important}
        .gzw-count{font-size:12px;color:#867692;font-weight:750;margin:0 0 14px}
        .gzw-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
        .gzw-card{background:#fff;border:1px solid #EAE1F5;border-radius:18px;padding:19px;box-shadow:0 5px 24px #5B28840A;min-width:0}
        .gzw-person{display:flex;align-items:flex-start;gap:12px;min-width:0}
        .gzw-avatar{width:47px;height:47px;flex-shrink:0;display:grid;place-items:center;border-radius:13px;background:#F0E5FF;color:#7932D4;font-size:19px;font-weight:850}
        .gzw-person-info{flex:1;min-width:0}.gzw-name{margin:0 0 6px;font-size:15px;font-weight:850;overflow-wrap:anywhere}
        .gzw-phone{font-size:12px;display:flex;align-items:center;gap:6px;color:#81718E;text-decoration:none;overflow-wrap:anywhere}
        .gzw-badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:15px}
        .gzw-pill{display:inline-flex;align-items:center;gap:5px;border-radius:7px;font-size:10px;font-weight:800;padding:6px 9px}
        .gzw-separator{border-top:1px solid #F0EAF5;margin:17px 0}
        .gzw-fieldlabel{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:800;color:#8C7E96;margin-bottom:9px}
        .gzw-bottom{display:flex;gap:10px;align-items:center}.gzw-zone{position:relative;flex:1;min-width:0}
        .gzw-zone select{width:100%;height:42px;background:#FAF8FD;border:1px solid #EAE1F5;border-radius:10px;color:#4C365D;font-size:12px;font-weight:750;padding:0 10px;min-width:0}
        .gzw-delete{height:42px;display:flex;align-items:center;gap:7px;border:1px solid #F5DCDD;background:#FFF5F6;color:#CE485C;border-radius:10px;padding:0 11px;font-size:12px!important;font-weight:800!important;cursor:pointer}
        .gzw-delete:disabled,.gzw-zone select:disabled,.gzw-btn:disabled{opacity:.55;cursor:wait}
        .gzw-notice{border:1px solid #F5D6DB;background:#FFF4F5;color:#96364B;padding:14px;border-radius:12px;margin-bottom:16px;font-size:13px}
        .gzw-empty{background:white;border:1px dashed #D9C7EB;border-radius:17px;text-align:center;padding:58px 20px;color:#806F8C}
        .gzw-empty strong{display:block;color:#34233E;font-size:17px;margin:12px 0 7px}
        @media(max-width:1250px){.gzw-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:900px){.gzw-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:640px){.gzw{padding:0 0 20px}.gzw-top{flex-direction:column;align-items:stretch}.gzw-actions{display:grid;grid-template-columns:1fr 1fr}.gzw-btn{width:100%;padding:10px}.gzw-stats{gap:9px}.gzw-stat{padding:13px;gap:9px}.gzw-stat-icon{width:37px;height:37px}.gzw-stat-value{font-size:21px}.gzw-stat-label{font-size:10px}.gzw-toolbar{padding:11px;gap:9px}.gzw-search{flex-basis:100%}.gzw-filter{flex:1 1 calc(50% - 8px);min-width:0}.gzw-grid{grid-template-columns:1fr;gap:12px}.gzw-card{padding:16px}.gzw-title{margin-top:5px}}
        @media(prefers-reduced-motion:reduce){.gzw *{scroll-behavior:auto!important;transition:none!important}}
      `}</style>
      <div className="gzw">
        <div className="gzw-top">
          <div><div className="gzw-kicker">WORKFORCE / DELIVERY OPERATIONS</div><h1 className="gzw-title" data-testid="header-title">Delivery Partners</h1><p className="gzw-sub">Manage delivery availability, service zones and your partner network.</p></div>
          <div className="gzw-actions">
            <button type="button" className="gzw-btn gzw-secondary" onClick={() => load()} disabled={refreshing || loading}><RefreshCw size={16}/> Refresh</button>
            <button type="button" className="gzw-btn gzw-primary" onClick={() => navigation.navigate('AdminAddWorker')} data-testid="add-worker-btn"><Plus size={17}/> Add Worker</button>
          </div>
        </div>
        <div className="gzw-stats">
          {[
            { label: 'Total Partners', value: workers.length, icon: Users, color: '#742DD4', bg: '#F1E5FF' },
            { label: 'Online', value: onlineCount, icon: CircleCheck, color: '#188C67', bg: '#E2F7ED' },
            { label: 'Busy', value: busyCount, icon: Bike, color: '#A96C18', bg: '#FFF2D9' },
            { label: 'Offline', value: offlineCount, icon: CircleOff, color: '#747989', bg: '#F0F1F5' },
          ].map((stat) => {
            const Icon = stat.icon;
            return <div key={stat.label} className="gzw-stat" data-testid={`stat-${stat.label.toLowerCase().split(' ')[0]}`}><div className="gzw-stat-icon" style={{background:stat.bg,color:stat.color}}><Icon size={21}/></div><div><div className="gzw-stat-value">{stat.value}</div><div className="gzw-stat-label">{stat.label}</div></div></div>;
          })}
        </div>
        <div className="gzw-toolbar">
          <label className="gzw-search"><Search size={18} color="#8B73A1"/><input aria-label="Search delivery partners" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, mobile, ID or zone…" /></label>
          <select className="gzw-filter" aria-label="Filter by availability" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option><option value="online">Online</option><option value="busy">Busy</option><option value="offline">Offline</option>
          </select>
          <select className="gzw-filter" aria-label="Filter by zone" value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value)}>
            <option value="all">All zones</option><option value="none">Unassigned</option>
            {zones.map((zone) => <option key={zone.id} value={String(zone.id)}>{zone.name}</option>)}
          </select>
        </div>
        {error && <div className="gzw-notice" role="alert"><AlertCircle size={15} style={{verticalAlign:'middle',marginRight:7}}/>{error}</div>}
        <div className="gzw-count">{loading ? 'Loading delivery partners…' : `${shown.length} of ${workers.length} delivery partners`}</div>
        {loading ? <div className="gzw-empty">Loading delivery partners…</div> : shown.length === 0 ? (
          <div className="gzw-empty" data-testid="empty-workers-state"><Users size={35} color={PRIMARY}/><strong>{workers.length ? 'No matching delivery partners' : 'No delivery partners yet'}</strong><span>{workers.length ? 'Try another search or filter.' : 'Add your first delivery partner to get started.'}</span></div>
        ) : (
          <div className="gzw-grid">
            {shown.map((w) => {
              const pending = busyIds.includes(String(w.id));
              const digits = String(w.phone || '').replace(/\D/g, '');
              return <article className="gzw-card" key={w.id} data-testid={`worker-card-${w.id}`}>
                <div className="gzw-person">
                  <div className="gzw-avatar">{(w.name || 'W').charAt(0).toUpperCase()}</div>
                  <div className="gzw-person-info"><h2 className="gzw-name" data-testid={`worker-name-${w.id}`}>{w.name || 'Unnamed partner'}</h2>
                    {digits ? <a className="gzw-phone" href={`tel:${digits}`}><Phone size={14}/> {w.phone}</a> : <div className="gzw-phone"><Phone size={14}/> No mobile number</div>}
                  </div>
                </div>
                <div className="gzw-badges">
                  {w.is_active ? <span className="gzw-pill" style={{background:'#E7F9EF',color:'#13845D'}} data-testid={`worker-online-${w.id}`}>● Online</span> : <span className="gzw-pill" style={{background:'#F1F2F5',color:'#777B88'}}>● Offline</span>}
                  {w.is_busy && <span className="gzw-pill" style={{background:'#FFF1D9',color:'#A46B14'}} data-testid={`worker-busy-${w.id}`}>● Busy</span>}
                </div>
                <div className="gzw-separator"/>
                <label className="gzw-fieldlabel" htmlFor={`worker-zone-${w.id}`}><MapPin size={13}/> ASSIGNED DELIVERY ZONE</label>
                <div className="gzw-bottom"><div className="gzw-zone"><select id={`worker-zone-${w.id}`} disabled={pending} value={w.zone_id ?? ''} onChange={(e) => handleZoneChange(w.id, e.target.value)} data-testid={`worker-zone-select-${w.id}`}><option value="">No zone assigned</option>{zones.map((z)=><option value={z.id} key={z.id}>{z.name}</option>)}</select></div><button className="gzw-delete" type="button" onClick={() => handleDelete(w)} disabled={pending} data-testid={`worker-delete-btn-${w.id}`}><Trash2 size={15}/> Delete</button></div>
              </article>;
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
