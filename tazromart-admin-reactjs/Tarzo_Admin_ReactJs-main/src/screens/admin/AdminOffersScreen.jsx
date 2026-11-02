import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Tag, ChevronDown, ChevronUp, Send, Trash2, Ticket, Percent,
  IndianRupee, FileText, ShoppingCart, Gift, Copy, Search,
  RefreshCw, AlertCircle, CheckCircle2, Sparkles,
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { adminApi } from '../../utils/api';

const EMPTY_FORM = {
  title: '', description: '', code: '', discount_type: 'percent',
  discount_value: '', min_order: '', max_discount: '',
};
const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const apiError = (error, fallback) => {
  const detail = error?.response?.data?.detail;
  return typeof detail === 'string' ? detail : fallback;
};

function InputField({ label, icon: Icon, value, onChange, placeholder, type = 'text', required, min, max, step }) {
  return (
    <label className="gzo-field">
      <span className="gzo-label">{label}{required && <span className="gzo-required"> *</span>}</span>
      <span className="gzo-input-wrap">
        {Icon && <Icon size={18} strokeWidth={1.9} className="gzo-field-icon" />}
        <input
          className="gzo-input" type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} required={required} min={min} max={max} step={step}
        />
      </span>
    </label>
  );
}

export default function AdminOffersScreen() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formOpen, setFormOpen] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState('');
  const mounted = useRef(true);
  const savingRef = useRef(false);
  const deletingRef = useRef(false);
  const requestId = useRef(0);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setFetchError('');
    try {
      const result = await adminApi.get('/offers');
      if (mounted.current && id === requestId.current) {
        setOffers(Array.isArray(result.data) ? result.data : []);
      }
    } catch (error) {
      if (mounted.current && id === requestId.current) {
        setFetchError(apiError(error, 'Could not load offers. Please retry.'));
      }
    } finally {
      if (mounted.current && id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load();
    return () => { mounted.current = false; requestId.current += 1; };
  }, [load]);

  const filteredOffers = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    if (!q) return offers;
    return offers.filter((item) =>
      [item.code, item.title, item.description].some((value) =>
        String(value ?? '').toLocaleLowerCase().includes(q)));
  }, [offers, search]);

  const createOffer = async (event) => {
    event.preventDefault();
    if (savingRef.current) return;
    const title = form.title.trim();
    const code = form.code.trim().toUpperCase();
    const discount = Number(form.discount_value);
    const minOrder = form.min_order.trim() === '' ? 0 : Number(form.min_order);
    const maxDiscount = form.max_discount.trim() === '' ? 0 : Number(form.max_discount);

    if (!title || !code || !form.discount_value.trim() || !Number.isFinite(discount) || discount <= 0 ||
        (form.discount_type === 'percent' && discount > 100) ||
        !Number.isFinite(minOrder) || minOrder < 0 || !Number.isFinite(maxDiscount) || maxDiscount < 0) {
      setActionError('Please enter a valid title, coupon code and discount. Percentage discounts must be 1–100; amounts cannot be negative.');
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setActionError('');
    setSuccess('');
    try {
      const result = await adminApi.post('/offers', {
        title, description: form.description.trim(), code,
        discount_type: form.discount_type, discount_value: discount,
        min_order: minOrder, max_discount: maxDiscount,
      });
      if (!mounted.current) return;
      const notified = result?.data?.notified;
      setSuccess(typeof notified === 'number'
        ? `Offer created successfully. Backend reports ${notified} user notifications.`
        : 'Offer created successfully.');
      setForm(EMPTY_FORM);
      await load();
    } catch (error) {
      if (mounted.current) setActionError(apiError(error, 'Offer creation failed. Please try again.'));
    } finally {
      savingRef.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  const deleteOffer = async (item) => {
    if (deletingRef.current || !window.confirm(`Delete offer ${item.code || item.title}?`)) return;
    deletingRef.current = true;
    setDeletingId(item.id);
    setActionError('');
    setSuccess('');
    try {
      await adminApi.delete(`/offers/${item.id}`);
      if (!mounted.current) return;
      setSuccess('Offer deleted successfully.');
      await load();
    } catch (error) {
      if (mounted.current) setActionError(apiError(error, 'Failed to delete offer.'));
    } finally {
      deletingRef.current = false;
      if (mounted.current) setDeletingId(null);
    }
  };

  const copyCode = async (value) => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(String(value));
      if (mounted.current) setCopiedCode(String(value));
    } catch {
      if (mounted.current) setActionError('Could not copy automatically. Please select the code and copy it.');
    }
  };

  const discountLabel = (offer) => offer.discount_type === 'percent'
    ? `${offer.discount_value}% OFF` : `${money(offer.discount_value)} OFF`;

  return (
    <AdminLayout activeScreen="AdminOffers">
      <style>{`
        .gzo-page{font-family:'Plus Jakarta Sans',Inter,system-ui,sans-serif;color:#241434;max-width:1380px;margin:0 auto;padding:8px 0 48px;min-width:0}
        .gzo-page *{box-sizing:border-box}
        .gzo-heading{display:flex;justify-content:space-between;align-items:center;gap:18px;flex-wrap:wrap;margin-bottom:23px}
        .gzo-eyebrow{font-size:11px;font-weight:800;letter-spacing:1.4px;color:#7C3AED;text-transform:uppercase;margin-bottom:6px}
        .gzo-title{font-size:clamp(26px,2.8vw,36px);font-weight:850;letter-spacing:-1.1px;margin:0;line-height:1.16}
        .gzo-muted{margin:8px 0 0;color:#81778E;font-size:13px;line-height:1.6}
        .gzo-action{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:1px solid #E5D9F8;color:#5620A6;background:#fff;border-radius:12px;padding:11px 15px;font-weight:750;font-size:12px;cursor:pointer;min-height:42px}
        .gzo-action:disabled,.gzo-primary:disabled,.gzo-delete:disabled{opacity:.55;cursor:not-allowed}
        .gzo-dashboard{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(0,.88fr);gap:20px;align-items:start}
        .gzo-panel{background:#fff;border:1px solid #E9E1F3;border-radius:22px;box-shadow:0 8px 30px rgba(47,22,84,.035);overflow:hidden;min-width:0}
        .gzo-panel-top{padding:22px 24px;background:linear-gradient(105deg,#F6F0FF,#fff);border-bottom:1px solid #EEE6F7;display:flex;align-items:center;justify-content:space-between;gap:14px}
        .gzo-panel-title{display:flex;gap:12px;align-items:center;min-width:0}.gzo-panel-title h2{margin:0;font-size:17px;font-weight:850;letter-spacing:-.4px}.gzo-panel-title p{margin:4px 0 0;font-size:11px;color:#867992;line-height:1.5}
        .gzo-purple-icon{width:42px;height:42px;border-radius:13px;background:#752AD4;color:#fff;display:grid;place-items:center;flex-shrink:0}
        .gzo-form{padding:24px;display:grid;gap:18px}
        .gzo-two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
        .gzo-field{display:flex;flex-direction:column;min-width:0}.gzo-label{font-size:11px;font-weight:800;color:#50445C;margin-bottom:9px;letter-spacing:.25px}.gzo-required{color:#7C3AED}
        .gzo-input-wrap{border:1px solid #E4DDED;background:#FCFAFE;border-radius:12px;min-height:47px;display:flex;align-items:center;padding:0 13px;gap:10px;min-width:0;transition:border-color .2s,box-shadow .2s}
        .gzo-input-wrap:focus-within{border-color:#9B65E5;box-shadow:0 0 0 3px #7C3AED16}.gzo-field-icon{flex-shrink:0;color:#9156D9}
        .gzo-input{width:100%;min-width:0;min-height:45px;border:0;outline:0;background:transparent;color:#29183D;font:600 13px inherit;font-size:13px;font-weight:600}
        .gzo-type-row{display:grid;grid-template-columns:1fr 1fr;gap:10px}.gzo-type{display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border:1px solid #E4DDED;background:#fff;border-radius:12px;font-size:13px;font-weight:800;color:#63546F;cursor:pointer}.gzo-type.selected{background:#EEE2FF;border-color:#8D4DDF;color:#6C25C7}
        .gzo-preview{padding:17px;border:1px dashed #BE96ED;border-radius:14px;background:#F7F0FF;display:flex;gap:10px;justify-content:space-between;align-items:center;flex-wrap:wrap}.gzo-preview strong{letter-spacing:1px;color:#6020B9;font-size:14px}.gzo-preview span{font-size:12px;color:#6839A2;font-weight:800}
        .gzo-primary{width:100%;border:0;background:linear-gradient(100deg,#7B2FF7,#5A1ED8);color:white;border-radius:13px;padding:15px;font-size:13px;font-weight:850;display:flex;align-items:center;justify-content:center;gap:9px;cursor:pointer;box-shadow:0 7px 18px #7B2FF72A}
        .gzo-list-body{padding:20px}.gzo-search{display:flex;align-items:center;gap:9px;border:1px solid #E4DDED;background:#FCFAFE;padding:0 14px;border-radius:12px;min-height:46px;margin-bottom:16px;color:#8954C9}.gzo-search input{border:0;background:transparent;outline:0;width:100%;min-width:0;font-size:13px;color:#241434}
        .gzo-card{border:1px solid #E9E1F3;border-radius:16px;padding:17px;margin-bottom:11px;background:#fff}.gzo-card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.gzo-coupon{display:inline-block;padding:6px 9px;border:1px solid #E9D5FF;background:#F4EAFF;border-radius:7px;font-size:11px;font-weight:850;color:#6D28D9;letter-spacing:.65px;overflow-wrap:anywhere}.gzo-offer-title{font-size:15px;font-weight:850;margin:10px 0 4px;overflow-wrap:anywhere}.gzo-discount{font-size:18px;font-weight:850;color:#732DD2;white-space:nowrap}
        .gzo-card-note{font-size:12px;color:#877C91;line-height:1.5;margin:5px 0}.gzo-card-footer{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-top:14px;padding-top:12px;border-top:1px solid #F1EAF8}.gzo-small{border:1px solid #E7D9F6;background:#fff;border-radius:9px;color:#6934A5;padding:8px 11px;display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:800;cursor:pointer}.gzo-delete{border:1px solid #F7DADA;background:#FFF6F6;color:#BA3D4A;border-radius:9px;padding:8px 11px;display:flex;gap:6px;align-items:center;font-size:11px;font-weight:800;cursor:pointer}
        .gzo-message{display:flex;gap:9px;align-items:flex-start;border-radius:12px;padding:12px 14px;font-size:12px;font-weight:700;margin-bottom:16px;line-height:1.6;overflow-wrap:anywhere}.gzo-error{background:#FFF1F3;border:1px solid #F4CAD2;color:#AD3548}.gzo-success{background:#ECFBF3;border:1px solid #C8EAD7;color:#146A45}.gzo-empty{text-align:center;padding:40px 15px;color:#81778E;font-size:13px}.gzo-info{margin-top:16px;padding:12px 14px;color:#755E91;font-size:11px;line-height:1.6;background:#F8F3FF;border-radius:12px}
        .gzo-action:focus-visible,.gzo-primary:focus-visible,.gzo-delete:focus-visible,.gzo-small:focus-visible,.gzo-type:focus-visible{outline:3px solid #BA91EB;outline-offset:2px}
        @media(max-width:1100px){.gzo-dashboard{grid-template-columns:1fr}}
        @media(max-width:600px){.gzo-page{padding:0 0 30px}.gzo-heading{margin-bottom:16px}.gzo-title{font-size:26px}.gzo-panel{border-radius:16px}.gzo-panel-top{padding:16px}.gzo-form{padding:16px;gap:14px}.gzo-two{grid-template-columns:1fr;gap:14px}.gzo-list-body{padding:14px}.gzo-discount{font-size:16px}}
      `}</style>
      <div className="gzo-page" data-testid="admin-offers-screen">
        <header className="gzo-heading">
          <div><div className="gzo-eyebrow">PROMOTIONS / MANAGEMENT</div><h1 className="gzo-title" data-testid="header-title">Offers & Coupons</h1><p className="gzo-muted">Launch promotions and manage customer coupon codes in one place.</p></div>
          <button type="button" className="gzo-action" onClick={load} disabled={loading}><RefreshCw size={15} /> {loading ? 'Refreshing…' : 'Refresh offers'}</button>
        </header>
        {actionError && <div className="gzo-message gzo-error" role="alert"><AlertCircle size={17} />{actionError}</div>}
        {success && <div className="gzo-message gzo-success" role="status"><CheckCircle2 size={17} />{success}</div>}
        <div className="gzo-dashboard">
          <section className="gzo-panel">
            <div className="gzo-panel-top">
              <div className="gzo-panel-title"><span className="gzo-purple-icon"><Sparkles size={20} /></span><div><h2>Create new offer</h2><p>Set up a coupon and notify customers through your existing backend.</p></div></div>
              <button className="gzo-action" type="button" onClick={() => setFormOpen((v) => !v)} aria-expanded={formOpen}>{formOpen ? <ChevronUp size={17}/> : <ChevronDown size={17}/>}</button>
            </div>
            {formOpen && <form className="gzo-form" onSubmit={createOffer}>
              <div className="gzo-two">
                <InputField label="Offer title" required icon={Tag} value={form.title} onChange={(v) => update('title', v)} placeholder="Weekend special" />
                <InputField label="Description" icon={FileText} value={form.description} onChange={(v) => update('description', v)} placeholder="Save more on your basket" />
              </div>
              <InputField label="Coupon code" required icon={Ticket} value={form.code} onChange={(v) => update('code', v.toUpperCase())} placeholder="SAVE20" />
              <div className="gzo-field"><span className="gzo-label">DISCOUNT TYPE</span><div className="gzo-type-row">
                <button type="button" className={`gzo-type ${form.discount_type === 'percent' ? 'selected' : ''}`} onClick={() => update('discount_type', 'percent')}><Percent size={17} /> Percentage</button>
                <button type="button" className={`gzo-type ${form.discount_type === 'flat' ? 'selected' : ''}`} onClick={() => update('discount_type', 'flat')}><IndianRupee size={17} /> Flat amount</button>
              </div></div>
              <div className="gzo-two">
                <InputField label={form.discount_type === 'percent' ? 'Discount (%)' : 'Discount amount (₹)'} required icon={form.discount_type === 'percent' ? Percent : IndianRupee} value={form.discount_value} onChange={(v) => update('discount_value', v)} placeholder={form.discount_type === 'percent' ? '20' : '50'} type="number" min="0.01" max={form.discount_type === 'percent' ? '100' : undefined} step="any" />
                <InputField label="Minimum order (₹)" icon={ShoppingCart} value={form.min_order} onChange={(v) => update('min_order', v)} placeholder="0" type="number" min="0" step="any" />
              </div>
              <InputField label="Maximum discount (₹)" icon={Gift} value={form.max_discount} onChange={(v) => update('max_discount', v)} placeholder="0" type="number" min="0" step="any" />
              {form.code.trim() && form.discount_value.trim() && <div className="gzo-preview"><strong>{form.code.trim().toUpperCase()}</strong><span>{form.discount_type === 'percent' ? `${form.discount_value}% OFF` : `${money(form.discount_value)} OFF`}</span></div>}
              <button className="gzo-primary" type="submit" disabled={saving}><Send size={17} />{saving ? 'Creating offer…' : 'Create & Notify Users'}</button>
            </form>}
          </section>
          <section className="gzo-panel">
            <div className="gzo-panel-top"><div className="gzo-panel-title"><span className="gzo-purple-icon"><Ticket size={20}/></span><div><h2>Available offers ({offers.length})</h2><p>Search, copy and remove your promotions.</p></div></div></div>
            <div className="gzo-list-body">
              <label className="gzo-search"><Search size={17}/><input type="search" placeholder="Search by title or coupon code" aria-label="Search offers" value={search} onChange={(e) => setSearch(e.target.value)}/></label>
              {fetchError && <div className="gzo-message gzo-error" role="alert"><AlertCircle size={17}/>{fetchError}</div>}
              {loading ? <div className="gzo-empty">Loading offers…</div> : filteredOffers.length === 0 ? <div className="gzo-empty">{search.trim() ? 'No matching offers found.' : 'No offers yet. Create your first coupon.'}</div> : filteredOffers.map((offer) => (
                <article key={offer.id} className="gzo-card" data-testid={`offer-card-${offer.id}`}>
                  <div className="gzo-card-top"><div style={{minWidth:0}}><span className="gzo-coupon">{offer.code || 'NO CODE'}</span><div className="gzo-offer-title" data-testid={`offer-title-${offer.id}`}>{offer.title || 'Untitled offer'}</div></div><strong className="gzo-discount">{discountLabel(offer)}</strong></div>
                  {offer.description && <p className="gzo-card-note">{offer.description}</p>}
                  <p className="gzo-card-note">Minimum order: {money(offer.min_order)}{Number(offer.max_discount) > 0 && ` · Max discount: ${money(offer.max_discount)}`}</p>
                  <div className="gzo-card-footer"><button type="button" className="gzo-small" onClick={() => copyCode(offer.code)}><Copy size={14}/>{copiedCode === String(offer.code) ? 'Copied' : 'Copy code'}</button><button type="button" className="gzo-delete" data-testid={`offer-delete-btn-${offer.id}`} disabled={deletingId !== null} onClick={() => deleteOffer(offer)}><Trash2 size={14}/>{deletingId === offer.id ? 'Deleting…' : 'Delete'}</button></div>
                </article>
              ))}
              <div className="gzo-info">Offer creation uses your existing backend notification flow. The page shows the recipient count only when the API returns it.</div>
            </div>
          </section>
        </div>
      </div>
    </AdminLayout>
  );
}
