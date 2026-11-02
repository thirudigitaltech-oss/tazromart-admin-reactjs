import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Trash2, MapPin, Search, RefreshCw, AlertCircle, Layers3, CheckCircle2, CircleOff, Radar, X } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { adminApi } from '../../utils/api';

const initialForm = { name: '', lat: '', lon: '', radius: '5000' };
const formatRadius = (meters) => {
  const n = Number(meters);
  if (!Number.isFinite(n)) return '—';
  return n >= 1000 ? `${(n / 1000).toLocaleString('en-IN', { maximumFractionDigits: 2 })} km` : `${n.toLocaleString('en-IN')} m`;
};

export default function AdminZonesScreen() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const requestNumber = useRef(0);
  const mounted = useRef(false);

  const loadZones = useCallback(async (initial = false) => {
    const request = ++requestNumber.current;
    if (initial) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await adminApi.get('/zones');
      if (!mounted.current || request !== requestNumber.current) return;
      setZones(Array.isArray(res.data) ? res.data : []);
      setError('');
    } catch (err) {
      if (mounted.current && request === requestNumber.current) {
        setError(err?.response?.data?.detail || 'Unable to load zones. Please try again.');
      }
    } finally {
      if (mounted.current && request === requestNumber.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    loadZones(true);
    return () => { mounted.current = false; requestNumber.current += 1; };
  }, [loadZones]);

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    if (saving) return;
    setError('');
    setSuccess('');
    const name = form.name.trim();
    const lat = Number(form.lat);
    const lon = Number(form.lon);
    const radius = form.radius.trim() === '' ? 5000 : Number(form.radius);
    if (!name || !form.lat.trim() || !form.lon.trim()) {
      setError('Zone name, latitude and longitude are required.');
      return;
    }
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lon) || lon < -180 || lon > 180) {
      setError('Enter valid coordinates: latitude −90 to 90 and longitude −180 to 180.');
      return;
    }
    if (!Number.isFinite(radius) || radius <= 0) {
      setError('Radius must be greater than zero.');
      return;
    }
    setSaving(true);
    try {
      await adminApi.post('/zones', {
        name,
        center_lat: lat,
        center_lon: lon,
        radius_meters: radius,
        is_active: true,
      });
      if (!mounted.current) return;
      setForm(initialForm);
      setSuccess('Delivery zone created successfully.');
      await loadZones();
    } catch (err) {
      if (mounted.current) setError(err?.response?.data?.detail || 'Unable to create zone. Please try again.');
    } finally {
      if (mounted.current) setSaving(false);
    }
  };

  const handleDelete = async (zone) => {
    if (deletingId !== null) return;
    if (!window.confirm(`Delete the delivery zone "${zone.name}"? This action cannot be undone.`)) return;
    setError('');
    setSuccess('');
    setDeletingId(zone.id);
    try {
      await adminApi.delete(`/zones/${zone.id}`);
      if (!mounted.current) return;
      setSuccess(`Zone "${zone.name}" deleted.`);
      await loadZones();
    } catch (err) {
      if (mounted.current) setError(err?.response?.data?.detail || 'Unable to delete zone. It may still be assigned to delivery partners.');
    } finally {
      if (mounted.current) setDeletingId(null);
    }
  };

  const filteredZones = zones.filter((z) => {
    const matchesText = `${z.name || ''} ${z.id ?? ''} ${z.center_lat ?? ''} ${z.center_lon ?? ''}`.toLowerCase().includes(search.trim().toLowerCase());
    const matchesFilter = filter === 'all' || (filter === 'active' ? Boolean(z.is_active) : !z.is_active);
    return matchesText && matchesFilter;
  });
  const activeCount = zones.filter((z) => z.is_active).length;
  const inactiveCount = zones.length - activeCount;

  return (
    <AdminLayout activeScreen="AdminZones" title="Zones">
      <style>{`
        .gz-zone-screen, .gz-zone-screen *{box-sizing:border-box}
        .gz-zone-screen{width:100%;max-width:1450px;margin:0 auto;color:#231635;font-family:'Plus Jakarta Sans','Inter',system-ui,sans-serif}
        .gz-zone-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:24px}
        .gz-zone-kicker{font-size:11px;text-transform:uppercase;letter-spacing:1.7px;color:#7B2FF7;font-weight:800}
        .gz-zone-h1{font-weight:850;font-size:clamp(25px,2.8vw,34px);letter-spacing:-1.2px;margin:7px 0 6px;line-height:1.12}
        .gz-zone-sub{color:#857A92;font-size:13px;line-height:1.7;margin:0}
        .gz-zone-refresh,.gz-zone-tab,.gz-zone-clear{font:inherit;cursor:pointer}
        .gz-zone-refresh{border:1px solid #E6DCEF;background:#fff;color:#6334A3;padding:11px 14px;display:inline-flex;align-items:center;gap:8px;border-radius:12px;font-weight:750;font-size:12px;white-space:nowrap}
        .gz-zone-refresh:disabled{opacity:.55;cursor:wait}
        .gz-zone-stats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:22px}
        .gz-zone-stat{background:#fff;border:1px solid #ECE4F5;border-radius:17px;padding:19px 20px;display:flex;align-items:center;gap:13px;box-shadow:0 3px 15px #34105405}
        .gz-zone-stat-icon{width:43px;height:43px;flex:0 0 43px;border-radius:13px;background:#F2E9FE;color:#7530CC;display:grid;place-items:center}
        .gz-zone-stat-num{font-weight:850;font-size:25px;line-height:1.1;letter-spacing:-.6px}
        .gz-zone-stat-label{font-size:12px;color:#81748D;margin-top:4px;font-weight:650}
        .gz-zone-panel{background:#fff;border:1px solid #ECE4F5;border-radius:20px;padding:23px;margin-bottom:20px;box-shadow:0 4px 20px #371A4E07}
        .gz-zone-panel-header{display:flex;align-items:center;gap:10px;margin-bottom:18px}
        .gz-zone-panel-icon{height:36px;width:36px;display:grid;place-items:center;border-radius:10px;background:#F3EAFF;color:#7330C7}
        .gz-zone-panel-title{font-size:17px;font-weight:830;letter-spacing:-.45px;margin:0}
        .gz-zone-panel-desc{font-size:12px;color:#8C8195;margin:4px 0 0}
        .gz-zone-form{display:grid;grid-template-columns:1.35fr 1fr 1fr 1fr auto;gap:12px;align-items:end}
        .gz-zone-field label{display:block;font-size:11px;font-weight:800;color:#53475E;margin-bottom:8px}
        .gz-zone-field input{width:100%;min-width:0;height:44px;padding:0 12px;border:1px solid #E7DBF1;background:#FCFAFF;border-radius:10px;color:#211331;font:inherit;font-size:13px;outline:none}
        .gz-zone-field input:focus,.gz-zone-search input:focus{border-color:#8B43D8;box-shadow:0 0 0 3px #7B2FF716}
        .gz-zone-add{min-height:44px;background:linear-gradient(135deg,#8236DC,#6120B5);color:#fff;border:0;padding:0 18px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;gap:7px;font-weight:800;font-size:13px;cursor:pointer;white-space:nowrap}
        .gz-zone-add:disabled{opacity:.6;cursor:wait}
        .gz-zone-message{display:flex;align-items:flex-start;gap:8px;padding:13px 14px;border-radius:11px;font-size:12px;font-weight:650;margin-bottom:18px;line-height:1.5}
        .gz-zone-error{background:#FFF0F2;color:#AB304E;border:1px solid #FFD6DF}
        .gz-zone-success{background:#EFFBF4;color:#16734A;border:1px solid #D5F1E0}
        .gz-zone-tools{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:18px}
        .gz-zone-search{display:flex;align-items:center;gap:9px;max-width:365px;width:100%;background:#FCFAFF;border:1px solid #E7DBF1;border-radius:11px;padding:0 13px;color:#836B99}
        .gz-zone-search input{width:100%;min-width:0;padding:12px 0;border:0;background:transparent;font:inherit;font-size:13px;outline:none}
        .gz-zone-tabs{display:flex;gap:6px;background:#F8F5FC;padding:4px;border-radius:11px;flex-shrink:0}
        .gz-zone-tab{border:0;background:transparent;border-radius:8px;padding:8px 13px;font-size:12px;font-weight:750;color:#776A85}
        .gz-zone-tab.active{background:#fff;color:#6D28D9;box-shadow:0 2px 7px #26143712}
        .gz-zone-tablewrap{width:100%;overflow-x:auto;border:1px solid #F0EAF5;border-radius:13px}
        .gz-zone-table{width:100%;border-collapse:collapse;text-align:left;min-width:700px}
        .gz-zone-table th{background:#FAF7FD;color:#857990;text-transform:uppercase;letter-spacing:.65px;font-size:10px;font-weight:800;padding:14px 16px;border-bottom:1px solid #EDE4F3}
        .gz-zone-table td{padding:16px;border-bottom:1px solid #F2ECF5;font-size:12px;color:#64556F}
        .gz-zone-table tr:last-child td{border-bottom:0}
        .gz-zone-name{font-weight:800;color:#261635;font-size:13px}
        .gz-zone-badge{display:inline-flex;align-items:center;gap:5px;border-radius:7px;font-size:11px;font-weight:780;padding:6px 9px;background:#ECF9F1;color:#16814F}
        .gz-zone-badge.off{background:#F2F0F5;color:#7F758B}
        .gz-zone-delete{background:#FFF1F3;border:1px solid #FFE0E4;border-radius:8px;color:#C33955;font-weight:750;font-size:11px;padding:8px 11px;display:inline-flex;align-items:center;gap:6px;cursor:pointer}
        .gz-zone-delete:disabled{opacity:.6;cursor:wait}
        .gz-zone-empty{text-align:center;padding:48px 15px;color:#857790;font-size:13px}
        .gz-zone-mobile-list{display:none}
        @media(max-width:1150px){.gz-zone-form{grid-template-columns:repeat(2,minmax(0,1fr))}.gz-zone-add{width:100%}}
        @media(max-width:740px){.gz-zone-heading{align-items:flex-start}.gz-zone-stats{gap:9px}.gz-zone-stat{padding:13px 11px;gap:8px}.gz-zone-stat-icon{width:33px;height:33px;flex-basis:33px;border-radius:10px}.gz-zone-stat-num{font-size:21px}.gz-zone-stat-label{font-size:10px}.gz-zone-panel{padding:17px 14px;border-radius:17px}.gz-zone-tools{flex-direction:column;align-items:stretch}.gz-zone-search{max-width:none}.gz-zone-tabs{width:100%}.gz-zone-tab{flex:1}.gz-zone-tablewrap{display:none}.gz-zone-mobile-list{display:grid;gap:11px}.gz-zone-mobile-card{border:1px solid #EDE4F3;border-radius:13px;padding:14px;background:#FCFAFF}.gz-zone-mobile-top{display:flex;justify-content:space-between;gap:9px;align-items:center}.gz-zone-mobile-meta{margin-top:12px;display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:11px;color:#8B7E97}.gz-zone-mobile-meta strong{display:block;color:#382744;margin-top:3px;font-size:12px}.gz-zone-mobile-bottom{display:flex;justify-content:flex-end;margin-top:13px;padding-top:12px;border-top:1px solid #EDE5F2}}
        @media(max-width:440px){.gz-zone-h1{font-size:26px}.gz-zone-form{grid-template-columns:1fr}.gz-zone-stats{grid-template-columns:repeat(3,minmax(0,1fr))}.gz-zone-stat{display:block;text-align:center}.gz-zone-stat-icon{margin:0 auto 7px}.gz-zone-heading{gap:8px}.gz-zone-refresh{padding:10px}.gz-zone-refresh span{display:none}}
        .gz-zone-screen button:focus-visible{outline:3px solid #A577E5;outline-offset:2px}
      `}</style>
      <div className="gz-zone-screen" data-testid="admin-zones-screen">
        <header className="gz-zone-heading">
          <div><div className="gz-zone-kicker">Delivery operations / Service areas</div><h1 className="gz-zone-h1" data-testid="header-title">Delivery Zones</h1><p className="gz-zone-sub">Configure service coverage and manage your delivery locations.</p></div>
          <button className="gz-zone-refresh" type="button" disabled={loading || refreshing} onClick={() => loadZones()}><RefreshCw size={15} /><span>{refreshing ? 'Refreshing…' : 'Refresh'}</span></button>
        </header>

        <div className="gz-zone-stats">
          {[{ label: 'Total Zones', value: zones.length, icon: Layers3 }, { label: 'Active Zones', value: activeCount, icon: CheckCircle2 }, { label: 'Inactive Zones', value: inactiveCount, icon: CircleOff }].map((metric) => {
            const Icon = metric.icon;
            return <div className="gz-zone-stat" key={metric.label}><div className="gz-zone-stat-icon"><Icon size={19} /></div><div><div className="gz-zone-stat-num">{metric.value}</div><div className="gz-zone-stat-label">{metric.label}</div></div></div>;
          })}
        </div>

        {error && <div className="gz-zone-message gz-zone-error" role="alert"><AlertCircle size={17} />{String(error)}<button type="button" aria-label="Dismiss error" onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 0, cursor: 'pointer', color: 'inherit' }}><X size={15} /></button></div>}
        {success && <div className="gz-zone-message gz-zone-success" role="status"><CheckCircle2 size={17} />{success}<button type="button" aria-label="Dismiss message" onClick={() => setSuccess('')} style={{ marginLeft: 'auto', background: 'none', border: 0, cursor: 'pointer', color: 'inherit' }}><X size={15} /></button></div>}

        <section className="gz-zone-panel">
          <div className="gz-zone-panel-header"><div className="gz-zone-panel-icon"><MapPin size={18} /></div><div><h2 className="gz-zone-panel-title">Create a delivery zone</h2><p className="gz-zone-panel-desc">Add a coverage area using its centre coordinates and radius.</p></div></div>
          <form className="gz-zone-form" onSubmit={handleCreate}>
            <div className="gz-zone-field"><label htmlFor="gz-zone-name">Zone name</label><input id="gz-zone-name" required value={form.name} onChange={(e) => updateField('name', e.target.value)} placeholder="e.g. Hyderabad Central" maxLength={120} /></div>
            <div className="gz-zone-field"><label htmlFor="gz-zone-lat">Latitude</label><input id="gz-zone-lat" required inputMode="decimal" value={form.lat} onChange={(e) => updateField('lat', e.target.value)} placeholder="17.3850" /></div>
            <div className="gz-zone-field"><label htmlFor="gz-zone-lon">Longitude</label><input id="gz-zone-lon" required inputMode="decimal" value={form.lon} onChange={(e) => updateField('lon', e.target.value)} placeholder="78.4867" /></div>
            <div className="gz-zone-field"><label htmlFor="gz-zone-radius">Radius (metres)</label><input id="gz-zone-radius" inputMode="decimal" value={form.radius} onChange={(e) => updateField('radius', e.target.value)} placeholder="5000" /></div>
            <button type="submit" className="gz-zone-add" disabled={saving}><Plus size={17}/>{saving ? 'Creating…' : 'Add Zone'}</button>
          </form>
        </section>

        <section className="gz-zone-panel">
          <div className="gz-zone-panel-header"><div className="gz-zone-panel-icon"><Radar size={18} /></div><div><h2 className="gz-zone-panel-title">Configured zones <span style={{ color: '#977FA8' }}>({zones.length})</span></h2><p className="gz-zone-panel-desc">Find, review or remove delivery zones.</p></div></div>
          <div className="gz-zone-tools">
            <label className="gz-zone-search"><Search size={17} /><input aria-label="Search zones" placeholder="Search by name, zone ID, coordinates…" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
            <div className="gz-zone-tabs" aria-label="Zone status filter">{[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }].map((option) => <button key={option.value} type="button" className={`gz-zone-tab ${filter === option.value ? 'active' : ''}`} onClick={() => setFilter(option.value)}>{option.label}</button>)}</div>
          </div>
          {loading ? <div className="gz-zone-empty">Loading delivery zones…</div> : filteredZones.length === 0 ? <div className="gz-zone-empty" data-testid="empty-zones-state">{zones.length === 0 ? 'No delivery zones configured yet.' : 'No zones match your search or filter.'}</div> : <>
            <div className="gz-zone-tablewrap"><table className="gz-zone-table"><thead><tr><th>Zone</th><th>Latitude</th><th>Longitude</th><th>Coverage</th><th>Status</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead><tbody>{filteredZones.map((z) => <tr key={z.id} data-testid={`zone-row-${z.id}`}><td><span className="gz-zone-name">{z.name}</span><div style={{ marginTop: 4, color: '#A39AAB', fontSize: 10 }}>ID: {z.id}</div></td><td>{z.center_lat ?? '—'}</td><td>{z.center_lon ?? '—'}</td><td>{formatRadius(z.radius_meters)}</td><td><span className={`gz-zone-badge ${z.is_active ? '' : 'off'}`}>{z.is_active ? 'Active' : 'Inactive'}</span></td><td style={{ textAlign: 'right' }}><button type="button" className="gz-zone-delete" disabled={deletingId !== null} onClick={() => handleDelete(z)} data-testid={`zone-delete-btn-${z.id}`}><Trash2 size={14}/>{deletingId === z.id ? 'Deleting…' : 'Delete'}</button></td></tr>)}</tbody></table></div>
            <div className="gz-zone-mobile-list">{filteredZones.map((z) => <div className="gz-zone-mobile-card" key={z.id}><div className="gz-zone-mobile-top"><div><div className="gz-zone-name">{z.name}</div><div style={{ fontSize: 10, color: '#97889E', marginTop: 4 }}>Zone ID #{z.id}</div></div><span className={`gz-zone-badge ${z.is_active ? '' : 'off'}`}>{z.is_active ? 'Active' : 'Inactive'}</span></div><div className="gz-zone-mobile-meta"><div>LATITUDE<strong>{z.center_lat ?? '—'}</strong></div><div>LONGITUDE<strong>{z.center_lon ?? '—'}</strong></div><div>COVERAGE<strong>{formatRadius(z.radius_meters)}</strong></div></div><div className="gz-zone-mobile-bottom"><button className="gz-zone-delete" type="button" disabled={deletingId !== null} onClick={() => handleDelete(z)} data-testid={`zone-delete-btn-${z.id}`}><Trash2 size={14}/>{deletingId === z.id ? 'Deleting…' : 'Delete zone'}</button></div></div>)}</div>
          </>}
        </section>
      </div>
    </AdminLayout>
  );
}
