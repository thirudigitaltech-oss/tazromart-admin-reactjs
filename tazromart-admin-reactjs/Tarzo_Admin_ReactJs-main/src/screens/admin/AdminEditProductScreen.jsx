import React, { useState } from 'react';
import { ArrowLeft, Save, PencilLine, PackageCheck, ShieldCheck, AlertCircle } from 'lucide-react';
import { adminApi } from '../../utils/api';
import { useAdminNavigation, useAdminRoute } from '../../utils/navigation';
import ProductFormFields from './ProductFormFields';

const toText = (value) => value === null || value === undefined ? '' : String(value);

export default function AdminEditProductScreen() {
  const navigation = useAdminNavigation();
  const route = useAdminRoute();
  // Preserve the existing navigation-state contract from AdminProductsScreen.
  const product = route?.params?.product || {};
  const [form, setForm] = useState(() => ({
    name: product.name || '',
    price: toText(product.price),
    unit: product.unit || 'kg',
    description: product.description || '',
    image: product.image || '',
    stock: toText(product.stock),
    category: product.category || 'Fruits',
    is_active: product.is_active ?? true,
    original_price: toText(product.original_price),
    cost_price: toText(product.cost_price),
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const update = (key, value) => {
    setError('');
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (saving) return;
    if (product.id === undefined || product.id === null) {
      setError('Product information is unavailable. Return to Products and open Edit again.');
      return;
    }
    if (!form.name.trim() || form.price.trim() === '') {
      setError('Product name and selling price are required.');
      return;
    }
    if (!Number.isFinite(Number(form.price)) || Number(form.price) < 0 ||
        !Number.isFinite(Number(form.stock || 0)) || Number(form.stock || 0) < 0 ||
        (form.original_price !== '' && (!Number.isFinite(Number(form.original_price)) || Number(form.original_price) < 0)) ||
        (form.cost_price !== '' && (!Number.isFinite(Number(form.cost_price)) || Number(form.cost_price) < 0))) {
      setError('Enter valid non-negative numbers for prices and stock.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      // Same route and payload fields as the existing edit screen.
      await adminApi.put(`/products/${product.id}`, {
        ...form,
        price: parseFloat(form.price),
        stock: parseFloat(form.stock || '0'),
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      });
      window.alert('Product updated successfully.');
      navigation.goBack();
    } catch (requestError) {
      const detail = requestError?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Unable to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const missingProduct = product.id === undefined || product.id === null;

  return (
    <div className="gze-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .gze-root{--violet:#6D28D9;--ink:#28183D;--muted:#847A90;min-height:100vh;background:#F7F6FC;color:var(--ink);font-family:'Plus Jakarta Sans',Inter,system-ui,sans-serif}
        .gze-root *{box-sizing:border-box}
        .gze-top{background:#fff;border-bottom:1px solid #EBE5F2;position:sticky;top:0;z-index:10}
        .gze-top-inner{max-width:1060px;margin:auto;padding:17px 28px;display:flex;align-items:center;justify-content:space-between;gap:16px}
        .gze-back{width:43px;height:43px;display:grid;place-items:center;border:1px solid #E8E0F0;background:#FAF8FD;color:#6530B0;border-radius:12px;cursor:pointer;flex-shrink:0}
        .gze-title-line{display:flex;gap:14px;align-items:center;min-width:0}
        .gze-title-icon{width:45px;height:45px;display:grid;place-items:center;background:#F2E9FF;color:var(--violet);border-radius:14px;flex-shrink:0}
        .gze-eyebrow{font-size:10px;font-weight:800;letter-spacing:1.25px;color:#8D6EB4;text-transform:uppercase}
        .gze-h1{font-size:20px;line-height:1.2;letter-spacing:-.65px;margin:4px 0 0;font-weight:800}
        .gze-heading-sub{font-size:12px;color:var(--muted);margin:5px 0 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .gze-return{border:1px solid #E9E2F2;border-radius:10px;background:#fff;padding:11px 16px;font-family:inherit;font-size:12px;font-weight:800;color:#6F587F;cursor:pointer;white-space:nowrap}
        .gze-content{width:100%;max-width:1060px;padding:28px 28px 75px;margin:0 auto}
        .gze-intro{background:linear-gradient(115deg,#6528C4,#8749E8);color:#fff;padding:26px 29px;border-radius:20px;display:flex;align-items:center;justify-content:space-between;gap:20px;box-shadow:0 12px 27px rgba(102,43,193,.13);margin-bottom:25px;overflow:hidden;position:relative}
        .gze-intro:after{content:'';width:200px;height:200px;border:1px solid rgba(255,255,255,.14);border-radius:50%;position:absolute;right:-62px;top:-85px;pointer-events:none}
        .gze-intro-copy{position:relative;z-index:1;min-width:0}
        .gze-intro-cap{font-size:10px;letter-spacing:1.4px;font-weight:800;opacity:.8}
        .gze-intro h2{font-size:22px;letter-spacing:-.7px;line-height:1.3;margin:8px 0 7px;font-weight:800}
        .gze-intro p{font-size:12px;line-height:1.7;opacity:.85;margin:0;max-width:580px}
        .gze-intro-mark{background:rgba(255,255,255,.14);width:59px;height:59px;display:grid;place-items:center;border-radius:17px;flex-shrink:0}
        .gze-form{min-width:0}
        .gze-notice{border:1px solid #F5CAD2;background:#FFF4F5;color:#A6354D;border-radius:12px;padding:13px 15px;display:flex;align-items:flex-start;gap:9px;font-size:12px;font-weight:700;line-height:1.6;margin-bottom:17px}
        .gze-actionbar{margin-top:16px;padding:19px 21px;background:#fff;border:1px solid #E9E1F6;border-radius:17px;display:flex;align-items:center;justify-content:space-between;gap:16px;box-shadow:0 5px 24px rgba(62,27,109,.03)}
        .gze-save-hint{display:flex;align-items:center;gap:10px;color:#736782;font-size:12px;line-height:1.6;min-width:0}
        .gze-save-hint svg{color:#8B56D4;flex-shrink:0}
        .gze-save{display:flex;align-items:center;justify-content:center;gap:9px;border:0;background:linear-gradient(115deg,#7130D5,#5B21B6);color:#fff;border-radius:11px;padding:14px 21px;min-width:170px;min-height:47px;font:800 13px 'Plus Jakarta Sans',system-ui,sans-serif;box-shadow:0 7px 17px rgba(109,40,217,.2);cursor:pointer}
        .gze-save:disabled{opacity:.62;cursor:not-allowed}
        .gze-back:focus-visible,.gze-return:focus-visible,.gze-save:focus-visible{outline:3px solid #C3A5F5;outline-offset:3px}
        @media(max-width:700px){.gze-top-inner{padding:13px 15px}.gze-title-icon{width:38px;height:38px;border-radius:11px}.gze-h1{font-size:17px}.gze-back{width:38px;height:38px}.gze-return{display:none}.gze-content{padding:16px 12px 45px}.gze-intro{padding:21px 18px;border-radius:16px;margin-bottom:17px}.gze-intro h2{font-size:19px}.gze-intro-mark{display:none}.gze-actionbar{padding:15px;align-items:stretch;flex-direction:column}.gze-save{width:100%}}
        @media(max-width:360px){.gze-title-line{gap:9px}.gze-title-icon{display:none}.gze-h1{font-size:16px}}
        @media(prefers-reduced-motion:reduce){.gze-root *{scroll-behavior:auto;transition:none!important}}
      `}</style>
      <header className="gze-top">
        <div className="gze-top-inner">
          <div className="gze-title-line">
            <button className="gze-back" type="button" onClick={() => navigation.goBack()} title="Back to products" aria-label="Back to products"><ArrowLeft size={19}/></button>
            <span className="gze-title-icon"><PencilLine size={20}/></span>
            <div style={{minWidth:0}}>
              <div className="gze-eyebrow">Product Management</div>
              <h1 className="gze-h1">Edit Product</h1>
              <p className="gze-heading-sub">{product.name || 'Update product information'}</p>
            </div>
          </div>
          <button className="gze-return" type="button" onClick={() => navigation.goBack()}>Back to Products</button>
        </div>
      </header>
      <main className="gze-content">
        <div className="gze-intro">
          <div className="gze-intro-copy">
            <div className="gze-intro-cap">GRABZOMART / PRODUCT CATALOGUE</div>
            <h2>Refine every product detail.</h2>
            <p>Keep your catalogue accurate with clear pricing, inventory levels, images, and availability settings.</p>
          </div>
          <div className="gze-intro-mark"><PackageCheck size={30}/></div>
        </div>
        {missingProduct && <div className="gze-notice" role="alert"><AlertCircle size={18}/>Product data was not provided. Go back to the Products page and select Edit again.</div>}
        <form className="gze-form" onSubmit={handleSave}>
          <ProductFormFields form={form} update={update} accent="#6D28D9" />
          {error && <div className="gze-notice" role="alert"><AlertCircle size={18}/>{error}</div>}
          <div className="gze-actionbar">
            <div className="gze-save-hint"><ShieldCheck size={19}/><span>Changes are saved to your existing product record.</span></div>
            <button className="gze-save" type="submit" disabled={saving || missingProduct}><Save size={17}/>{saving ? 'Saving Changes…' : 'Save Changes'}</button>
          </div>
        </form>
      </main>
    </div>
  );
}
