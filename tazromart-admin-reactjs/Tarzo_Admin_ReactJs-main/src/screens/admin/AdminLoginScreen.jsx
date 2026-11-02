import React, { useRef, useState } from 'react';
import { Apple, ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, Headset } from 'lucide-react';
import { adminApi } from '../../utils/api';
import { useAdminNavigation } from '../../utils/navigation';

// Full replacement for src/screens/admin/AdminLoginScreen.jsx
// No external stylesheet or new dependency required.
export default function AdminLoginScreen() {
  const navigation = useAdminNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submitting = useRef(false);

  const submit = async (event) => {
    event.preventDefault();
    if (submitting.current) return;
    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }
    submitting.current = true;
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.post('/login', {
        email: email.trim(), password,
      });
      const token = response?.data?.token;
      if (!token) throw new Error('Login response has no token');
      if (remember) {
        localStorage.setItem('admin_token', token);
        sessionStorage.removeItem('admin_token');
      } else {
        sessionStorage.setItem('admin_token', token);
        localStorage.removeItem('admin_token');
      }
      navigation.replace('AdminDashboard');
    } catch (err) {
      console.error('Admin sign-in failed:', err);
      setError('Unable to sign in. Please check your credentials.');
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  const field = { display: 'flex', alignItems: 'center', gap: 11, border: '1px solid #E9E3F2', borderRadius: 12, padding: '0 14px', background: '#FBFAFF', marginTop: 8, marginBottom: 18 };
  const input = { flex: 1, minWidth: 0, width: '100%', border: 0, outline: 0, background: 'transparent', padding: '15px 0', fontSize: 14, color: '#231536' };
  const label = { display: 'block', fontWeight: 700, fontSize: 13, color: '#231536' };

  return (
    <main style={{ minHeight: '100vh', padding: '32px 16px', boxSizing: 'border-box', background: 'radial-gradient(circle at 15% 10%,#EADFFF 0,transparent 35%),linear-gradient(145deg,#F8F5FF,#FDFCFF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "Plus Jakarta Sans, Inter, system-ui, sans-serif" }}>
      <style>{`@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");`}</style>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 66, height: 66, margin: '0 auto 12px', display: 'grid', placeItems: 'center', borderRadius: 18, background: 'linear-gradient(135deg,#8B5CF6,#5B21B6)', boxShadow: '0 12px 25px #6D28D933' }}>
            <Apple size={31} color="white" />
          </div>
          <div style={{ color: '#231536', fontSize: 25, fontWeight: 800 }}><span style={{ color: '#6D28D9' }}>Tazro</span> Admin</div>
          <div style={{ color: '#728075', fontSize: 12, marginTop: 4 }}>Management Portal</div>
        </div>

        <form onSubmit={submit} style={{ background: '#FFFFFF', padding: '32px 28px', borderRadius: 24, border: '1px solid #E9E3F2', boxShadow: '0 24px 70px rgba(64,27,111,.1)' }}>
          <div style={{ display: 'flex', gap: 7, alignItems: 'center', color: '#6D28D9', fontSize: 11, fontWeight: 800, letterSpacing: 1.2 }}>
            <ShieldCheck size={15} /> SECURE ACCESS
          </div>
          <h1 style={{ fontSize: 27, lineHeight: 1.2, color: '#231536', margin: '16px 0 6px' }}>Welcome back</h1>
          <p style={{ margin: '0 0 24px', color: '#738078', fontSize: 13 }}>Sign in to manage your store</p>

          {error && (
            <div role="alert" style={{ display: 'flex', gap: 9, padding: 12, marginBottom: 17, borderRadius: 10, background: '#FFF0F0', color: '#B42318', fontSize: 12 }}>
              <AlertCircle size={17} style={{ flexShrink: 0 }} /> {error}
            </div>
          )}

          <label htmlFor="admin-email" style={label}>Email address</label>
          <div style={field}>
            <Mail size={18} color="#6D28D9" />
            <input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" autoComplete="username" required style={input} />
          </div>

          <label htmlFor="admin-password" style={label}>Password</label>
          <div style={field}>
            <Lock size={18} color="#6D28D9" />
            <input id="admin-password" type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required style={input} />
            <button type="button" aria-label={showPw ? 'Hide password' : 'Show password'} onClick={() => setShowPw((value) => !value)} style={{ border: 0, background: 'transparent', padding: 4, cursor: 'pointer' }}>
              {showPw ? <EyeOff size={18} color="#64748B" /> : <Eye size={18} color="#64748B" />}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 24, fontSize: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6F637A', cursor: 'pointer' }}>
              <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember me
            </label>
            <a href="#forgot" style={{ color: '#6D28D9', fontWeight: 700, textDecoration: 'none' }}>Forgot password?</a>
          </div>

          <button type="submit" disabled={loading} style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, border: 0, borderRadius: 12, background: 'linear-gradient(135deg,#8B5CF6,#5B21B6)', color: 'white', fontSize: 15, fontWeight: 800, cursor: loading ? 'wait' : 'pointer', opacity: loading ? .65 : 1 }}>
            {loading ? 'Signing in...' : <>Sign In <ArrowRight size={18} /></>}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 20, color: '#75837A', fontSize: 12 }}>
            <Headset size={14} /> Need help? Contact support
          </div>
        </form>
        <p style={{ textAlign: 'center', color: '#829188', fontSize: 11, marginTop: 22 }}>Secure admin access</p>
      </div>
    </main>
  );
}
// END OF COMPLETE AdminLoginScreen.jsx
