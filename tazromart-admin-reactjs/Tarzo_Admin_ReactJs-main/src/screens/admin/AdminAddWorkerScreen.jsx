import React, { useRef, useState } from 'react';
import { ArrowLeft, UserPlus, UserRound, Phone, LockKeyhole, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { adminApi } from '../../utils/api';
import { useAdminNavigation } from '../../utils/navigation';

export default function AdminAddWorkerScreen() {
  const navigation = useAdminNavigation();
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const submittingRef = useRef(false);

  const update = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (error) setError('');
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (submittingRef.current) return;
    const name = form.name.trim();
    const phone = form.phone.trim();
    const password = form.password;
    if (!name || !phone || !password.trim()) {
      setError('Full name, phone number, and password are required.');
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    submittingRef.current = true;
    setSaving(true);
    setError('');
    try {
      // Preserve the existing endpoint and three-field request body.
      await adminApi.post('/workers', { name, phone, password });
      window.alert('Delivery partner added successfully.');
      navigation.goBack();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Could not add this delivery partner. Please try again.');
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="gzw-page" data-testid="admin-add-worker-screen">
      <style>{`
        .gzw-page{--p:#7133D7;--ink:#251738;--muted:#827890;--line:#E9E1F2;min-height:100vh;background:#F7F5FC;font-family:'Plus Jakarta Sans',Inter,system-ui,sans-serif;color:var(--ink);box-sizing:border-box}
        .gzw-page *{box-sizing:border-box}
        .gzw-page button,.gzw-page input{font:inherit}
        .gzw-header{background:#fff;border-bottom:1px solid var(--line)}
        .gzw-header-inner{max-width:1080px;padding:27px 26px;margin:auto;display:flex;align-items:center;gap:16px}
        .gzw-back{width:43px;height:43px;flex-shrink:0;border-radius:13px;background:#F6F0FF;border:1px solid #E7D8FA;color:var(--p);display:grid;place-items:center;cursor:pointer}
        .gzw-kicker{font-size:10px;letter-spacing:1.3px;color:#8C6CB7;font-weight:800;text-transform:uppercase;margin:0 0 4px}
        .gzw-title{font-size:25px;letter-spacing:-.9px;line-height:1.2;margin:0;font-weight:800}
        .gzw-sub{font-size:13px;color:var(--muted);margin:6px 0 0;line-height:1.5}
        .gzw-main{max-width:1080px;margin:auto;padding:28px 26px 70px;display:grid;grid-template-columns:minmax(0,1.55fr) minmax(260px,1fr);gap:22px;align-items:start}
        .gzw-card{background:#fff;border:1px solid var(--line);border-radius:19px;box-shadow:0 7px 25px rgba(54,20,94,.045);min-width:0;overflow:hidden}
        .gzw-card-head{display:flex;align-items:center;gap:12px;padding:24px 25px 21px;border-bottom:1px solid #F0EBF7}
        .gzw-icon{display:grid;place-items:center;background:#F1E9FF;color:var(--p);border-radius:12px;width:42px;height:42px;flex-shrink:0}
        .gzw-card-title{font-size:16px;font-weight:800;letter-spacing:-.3px;margin:0}
        .gzw-card-sub{font-size:12px;color:var(--muted);margin:4px 0 0;line-height:1.55}
        .gzw-form{padding:25px;display:grid;gap:20px}
        .gzw-field{display:grid;gap:9px;min-width:0}
        .gzw-label{font-size:12px;font-weight:750;color:#403451}
        .gzw-control{display:flex;align-items:center;gap:12px;background:#FCFBFE;border:1.5px solid #E7DFF1;border-radius:12px;padding:0 13px;min-height:51px;transition:box-shadow .15s,border-color .15s}
        .gzw-control:focus-within{border-color:#9A6BE4;box-shadow:0 0 0 4px rgba(113,51,215,.09);background:white}
        .gzw-control-icon{flex-shrink:0;color:#907AA7}
        .gzw-input{min-width:0;width:100%;border:0;background:transparent;outline:0;color:var(--ink);font-size:13px;font-weight:600;padding:14px 0}
        .gzw-input::placeholder{color:#A69CAF;font-weight:500}
        .gzw-eye{border:0;background:transparent;color:#776487;cursor:pointer;padding:8px;display:grid;place-items:center;flex-shrink:0}
        .gzw-hint{font-size:11px;line-height:1.5;color:#908599;margin:0}
        .gzw-error{display:flex;align-items:flex-start;gap:9px;color:#B42336;background:#FFF1F3;border:1px solid #FFD9E0;border-radius:11px;padding:11px 13px;font-size:12px;font-weight:650;line-height:1.5}
        .gzw-error svg{flex-shrink:0}
        .gzw-actions{display:flex;gap:11px;border-top:1px solid #F1EDF6;padding-top:20px;margin-top:2px}
        .gzw-save{flex:1;display:flex;align-items:center;justify-content:center;gap:9px;border:0;background:linear-gradient(120deg,#8C4EF0,#6328C1);color:#fff;border-radius:12px;min-height:49px;font-size:13px;font-weight:800;cursor:pointer;box-shadow:0 8px 20px rgba(110,48,203,.18)}
        .gzw-save:disabled{opacity:.65;cursor:not-allowed;box-shadow:none}
        .gzw-cancel{border:1px solid #E7DFF1;color:#5F536D;background:#fff;border-radius:12px;padding:0 19px;font-size:12px;font-weight:750;cursor:pointer}
        .gzw-side{padding:24px}
        .gzw-side-title{font-size:15px;font-weight:800;margin:12px 0 8px}
        .gzw-side-desc{font-size:12px;color:var(--muted);line-height:1.75;margin:0 0 20px}
        .gzw-note{display:flex;gap:10px;align-items:flex-start;margin:15px 0;font-size:12px;line-height:1.65;color:#594C68}
        .gzw-note svg{color:#31A178;flex-shrink:0;margin-top:2px}
        .gzw-footnote{margin-top:20px;background:#F8F3FF;border:1px solid #EDE0FC;border-radius:12px;padding:13px;color:#6E4A9B;font-size:11px;line-height:1.6}
        .gzw-page button:focus-visible{outline:3px solid #C4A5F3;outline-offset:3px}
        @media(max-width:790px){.gzw-main{grid-template-columns:1fr}.gzw-side{display:block}}
        @media(max-width:520px){.gzw-header-inner{padding:18px 15px;gap:12px}.gzw-title{font-size:20px}.gzw-sub{font-size:12px}.gzw-main{padding:17px 12px 44px;gap:14px}.gzw-card{border-radius:16px}.gzw-card-head{padding:19px 17px}.gzw-form{padding:19px 16px;gap:17px}.gzw-actions{flex-direction:column}.gzw-cancel{min-height:45px;order:2}.gzw-save{min-height:49px}}
        @media(prefers-reduced-motion:reduce){.gzw-page *{transition:none!important}}
      `}</style>
      <header className="gzw-header">
        <div className="gzw-header-inner">
          <button type="button" className="gzw-back" onClick={() => navigation.goBack()} aria-label="Go back" data-testid="back-button"><ArrowLeft size={19}/></button>
          <div><p className="gzw-kicker">Delivery operations / Team management</p><h1 className="gzw-title" data-testid="header-title">Add Delivery Partner</h1><p className="gzw-sub">Create a secure account for a new member of your delivery team.</p></div>
        </div>
      </header>
      <main className="gzw-main">
        <section className="gzw-card" aria-label="Delivery partner details">
          <div className="gzw-card-head"><span className="gzw-icon"><UserPlus size={21}/></span><div><h2 className="gzw-card-title">Partner information</h2><p className="gzw-card-sub">Enter the details required to create a delivery partner account.</p></div></div>
          <form onSubmit={handleSave} className="gzw-form" data-testid="add-worker-form">
            <div className="gzw-field"><label htmlFor="gzw-name" className="gzw-label">Full name *</label><div className="gzw-control"><UserRound size={17} className="gzw-control-icon"/><input id="gzw-name" className="gzw-input" value={form.name} onChange={e=>update('name',e.target.value)} placeholder="e.g. Ravi Kumar" autoComplete="name" required maxLength={120} data-testid="worker-name-input"/></div></div>
            <div className="gzw-field"><label htmlFor="gzw-phone" className="gzw-label">Mobile number *</label><div className="gzw-control"><Phone size={17} className="gzw-control-icon"/><input id="gzw-phone" className="gzw-input" type="tel" inputMode="numeric" value={form.phone} onChange={e=>update('phone',e.target.value)} placeholder="10-digit mobile number" autoComplete="tel-national" required maxLength={10} data-testid="worker-phone-input"/></div><p className="gzw-hint">Used by the delivery partner to sign in.</p></div>
            <div className="gzw-field"><label htmlFor="gzw-password" className="gzw-label">Password *</label><div className="gzw-control"><LockKeyhole size={17} className="gzw-control-icon"/><input id="gzw-password" className="gzw-input" type={showPassword?'text':'password'} value={form.password} onChange={e=>update('password',e.target.value)} placeholder="Create a secure password" autoComplete="new-password" required data-testid="worker-password-input"/><button className="gzw-eye" type="button" aria-label={showPassword?'Hide password':'Show password'} onClick={()=>setShowPassword(v=>!v)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div><p className="gzw-hint">Use a unique password. Server-side password rules also apply.</p></div>
            {error && <div className="gzw-error" role="alert"><AlertCircle size={17}/><span>{error}</span></div>}
            <div className="gzw-actions"><button type="button" className="gzw-cancel" onClick={()=>navigation.goBack()} disabled={saving}>Cancel</button><button type="submit" className="gzw-save" disabled={saving} data-testid="save-worker-btn"><UserPlus size={17}/>{saving?'Creating account…':'Create Delivery Partner'}</button></div>
          </form>
        </section>
        <aside className="gzw-card gzw-side" aria-label="Account information"><span className="gzw-icon"><ShieldCheck size={21}/></span><h2 className="gzw-side-title">Account setup</h2><p className="gzw-side-desc">Once created, the delivery partner can use their registered phone number and password to sign in.</p><div className="gzw-note"><CheckCircle2 size={17}/><span>Verify the mobile number before creating the account.</span></div><div className="gzw-note"><CheckCircle2 size={17}/><span>Share login details securely with the intended partner.</span></div><div className="gzw-note"><CheckCircle2 size={17}/><span>Manage partner availability and delivery zones from the Workers dashboard.</span></div><div className="gzw-footnote">Account creation uses your existing backend. The server must enforce authentication, authorization, and password storage security.</div></aside>
      </main>
    </div>
  );
}
