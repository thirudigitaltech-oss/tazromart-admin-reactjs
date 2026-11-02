import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { adminApi } from '../../utils/api';
import { useAdminNavigation } from '../../utils/navigation';
import ProductFormFields from './ProductFormFields';

export default function AdminAddProductScreen() {
  const navigation = useAdminNavigation();
  const [form, setForm] = useState({
    name: '', price: '', unit: 'kg', description: '', image: '',
    stock: '', category: 'Fruits', is_active: true, original_price: '', cost_price: '',
  });
  const [saving, setSaving] = useState(false);

  const [isMounted, setIsMounted] = useState(true);
  useEffect(() => {
    setIsMounted(true);
    return () => { setIsMounted(false); };
  }, []);

  const update = (key, val) => {
    if (isMounted) setForm((p) => ({ ...p, [key]: val }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.price) {
      window.alert('Name and Price required!');
      return;
    }
    if (isMounted) setSaving(true);
    try {
      await adminApi.post('/products', {
        ...form,
        price: parseFloat(form.price),
        stock: parseFloat(form.stock || '0'),
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      });
      window.alert('✅ Product added!');
      if (isMounted) navigation.goBack();
    } catch (e2) {
      window.alert(e2?.response?.data?.detail || 'Failed to add product');
    } finally { 
      if (isMounted) setSaving(false); 
    }
  };

  return (
    <div style={s.page} data-testid="admin-add-product-screen">
      <div style={s.container}>
        {/* Minimalist Top Back & Title Bar inside the card view */}
        <div style={s.topBar}>
          <button 
            style={s.backBtn} 
            onClick={() => navigation.goBack()}
            data-testid="back-button"
          >
            <ArrowLeft size={18} color="#7B2FF7" />
          </button>
          <div>
            <div style={s.screenTitle} data-testid="header-title">➕ Add Product</div>
            <div style={s.screenSub}>New product add cheyandi</div>
          </div>
        </div>

        <form onSubmit={handleSave} data-testid="add-product-form">
          <div style={s.card}>
            <ProductFormFields form={form} update={update} accent="#7B2FF7" data-testid="product-form-fields" />
            
            <button 
              type="submit" 
              style={{ ...s.saveBtn, ...(saving ? { opacity: 0.7 } : {}) }} 
              disabled={saving}
              data-testid="save-product-btn"
            >
              <span>{saving ? 'Saving…' : '💾 Save Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const s = {
  page: { 
    minHeight: '100vh', 
    background: '#EEEAF8', 
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: '24px 16px 60px 16px',
    boxSizing: 'border-box',
  },
  container: {
    maxWidth: 680,
    margin: '0 auto',
    width: '100%',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  backBtn: { 
    width: 38, 
    height: 38, 
    background: '#FFFFFF', 
    border: '1.5px solid #E8DFFC', 
    borderRadius: 12, 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(123,47,247,0.06)',
    flexShrink: 0,
  },
  screenTitle: { fontSize: 18, fontWeight: 900, color: '#0D0D1A', letterSpacing: '-0.3px' },
  screenSub: { fontSize: 12, color: '#888899', fontWeight: 600, marginTop: 2 },

  card: { 
    background: '#fff', 
    borderRadius: 24, 
    padding: '28px 24px', 
    boxShadow: '0 10px 35px rgba(123,47,247,0.08)', 
    border: '1.5px solid #E8DFFC',
    boxSizing: 'border-box'
  },
  
  saveBtn: { 
    width: '100%', 
    background: 'linear-gradient(135deg, #7B2FF7 0%, #5A1ED8 100%)', 
    border: 'none', 
    borderRadius: 14, 
    padding: '16px 0', 
    color: '#fff', 
    fontSize: 15, 
    fontWeight: 900, 
    cursor: 'pointer',
    boxShadow: '0 6px 20px rgba(123,47,247,0.3)',
    marginTop: 24,
    transition: 'all 0.2s ease'
  },
};
