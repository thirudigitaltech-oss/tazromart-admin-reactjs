import React from 'react';
import { Package, IndianRupee, Boxes, Image as ImageIcon } from 'lucide-react';

// Keep category values and form field keys unchanged for backend compatibility.
const CATS = ['Fruits', 'Vegetables', 'Dry Fruits', 'Exotic', 'Other'];
const FIELDS = [
  { label: 'Product Name *', key: 'name', placeholder: 'e.g. Fresh Mango', group: 'basics' },
  { label: 'Price (₹) *', key: 'price', placeholder: 'e.g. 80', keyboard: 'number', group: 'pricing' },
  { label: 'Original Price (₹)', key: 'original_price', placeholder: 'e.g. 100', keyboard: 'number', group: 'pricing' },
  { label: 'Cost Price (₹)', key: 'cost_price', placeholder: 'e.g. 50 (purchase cost)', keyboard: 'number', group: 'pricing' },
  { label: 'Unit', key: 'unit', placeholder: 'e.g. kg', group: 'basics' },
  { label: 'Stock', key: 'stock', placeholder: 'e.g. 100', keyboard: 'number', group: 'inventory' },
  { label: 'Image URL', key: 'image', placeholder: 'https://...', group: 'media' },
  { label: 'Description', key: 'description', placeholder: 'Product description...', multiline: true, group: 'media' },
];
const GROUPS = [
  { id: 'basics', title: 'Product essentials', detail: 'Name, unit and how the product appears in your catalogue', Icon: Package },
  { id: 'pricing', title: 'Pricing', detail: 'Selling price, original price and purchase cost', Icon: IndianRupee },
  { id: 'inventory', title: 'Inventory', detail: 'Manage quantity available for orders', Icon: Boxes },
  { id: 'media', title: 'Product details', detail: 'Photo and description shown alongside the product', Icon: ImageIcon },
];

export default function ProductFormFields({ form, update, accent = '#7B2FF7' }) {
  const selectedAccent = typeof accent === 'string' && accent.trim() ? accent : '#7B2FF7';
  const previewUrl = typeof form?.image === 'string' && /^https?:\/\//i.test(form.image.trim()) ? form.image.trim() : '';
  const currentStock = Number(form?.stock);
  return (
    <div className="gz-product-form">
      <style>{`
        .gz-product-form{--gz-purple:#7B2FF7;--gz-ink:#211735;--gz-muted:#786F88;color:var(--gz-ink);font-family:inherit;min-width:0}
        .gz-product-form *{box-sizing:border-box}
        .gz-product-form .gz-section{margin:0 0 18px;padding:23px 24px;background:#fff;border:1px solid #E9E1F6;border-radius:19px;box-shadow:0 5px 26px rgba(62,27,109,.035)}
        .gz-product-form .gz-heading{display:flex;gap:12px;align-items:center;margin-bottom:22px}
        .gz-product-form .gz-heading-icon{width:39px;height:39px;border-radius:12px;background:#F4EAFF;color:#7029CF;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .gz-product-form .gz-section-title{font-size:16px;line-height:1.3;font-weight:800;letter-spacing:-.35px;margin:0;color:#26163E}
        .gz-product-form .gz-section-desc{font-size:12px;color:#867D92;margin:3px 0 0;line-height:1.5}
        .gz-product-form .gz-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:17px 18px}
        .gz-product-form .gz-field{min-width:0}
        .gz-product-form .gz-wide{grid-column:1/-1}
        .gz-product-form .gz-label{display:block;font-size:12px;font-weight:750;color:#3F3353;margin-bottom:8px}
        .gz-product-form .gz-input{display:block;width:100%;min-width:0;border:1.5px solid #E6DFF0;background:#FCFBFE;color:#231832;border-radius:11px;padding:13px 14px;min-height:46px;font-size:14px;line-height:1.4;font-family:inherit;outline:none;transition:border-color .15s,box-shadow .15s,background .15s}
        .gz-product-form .gz-input:focus-visible{border-color:#8B5CF6;box-shadow:0 0 0 4px rgba(123,47,247,.12);background:#fff}
        .gz-product-form .gz-input::placeholder{color:#A29AAA}
        .gz-product-form .gz-textarea{min-height:104px;resize:vertical}
        .gz-product-form .gz-category-grid{display:flex;flex-wrap:wrap;gap:9px}
        .gz-product-form .gz-chip{border:1.5px solid #E7DDF3;background:#FBF9FE;color:#635274;border-radius:10px;padding:10px 15px;min-height:41px;font-size:12px;font-weight:750;cursor:pointer;transition:transform .15s,border-color .15s}
        .gz-product-form .gz-chip:hover{transform:translateY(-1px);border-color:#A987D8}
        .gz-product-form .gz-chip:focus-visible,.gz-product-form .gz-switch:focus-visible{outline:3px solid #C7AAFC;outline-offset:3px}
        .gz-product-form .gz-inline-note{margin:10px 0 0;font-size:11px;color:#95899D}
        .gz-product-form .gz-availability{display:flex;align-items:center;justify-content:space-between;gap:16px;padding-top:20px;margin-top:20px;border-top:1px solid #F0EBF7}
        .gz-product-form .gz-available-title{font-size:13px;font-weight:800;color:#2C2040}
        .gz-product-form .gz-available-sub{font-size:11px;color:#887E95;margin-top:4px;line-height:1.5}
        .gz-product-form .gz-switch{border:1px solid transparent;border-radius:99px;color:#fff;padding:10px 16px;font-size:12px;font-weight:800;min-width:112px;cursor:pointer;flex-shrink:0}
        .gz-product-form .gz-image-preview{display:flex;align-items:center;gap:13px;margin-top:12px;background:#FBF9FE;border:1px dashed #DCD0EF;border-radius:12px;padding:10px}
        .gz-product-form .gz-image-preview img{width:64px;height:64px;object-fit:contain;border-radius:9px;background:#fff}
        .gz-product-form .gz-image-caption{font-size:11px;color:#8B8096;line-height:1.5}
        @media(max-width:680px){.gz-product-form .gz-section{padding:18px 15px;border-radius:15px}.gz-product-form .gz-fields{grid-template-columns:minmax(0,1fr);gap:15px}.gz-product-form .gz-heading{margin-bottom:18px}.gz-product-form .gz-section-title{font-size:15px}.gz-product-form .gz-chip{padding:10px 12px}.gz-product-form .gz-availability{align-items:flex-start}.gz-product-form .gz-switch{min-width:102px}}
        @media(prefers-reduced-motion:reduce){.gz-product-form *{transition:none!important}}
      `}</style>

      {GROUPS.map(({ id, title, detail, Icon }) => (
        <section className="gz-section" key={id} aria-label={title}>
          <div className="gz-heading">
            <div className="gz-heading-icon"><Icon size={19} aria-hidden="true" /></div>
            <div><h3 className="gz-section-title">{title}</h3><p className="gz-section-desc">{detail}</p></div>
          </div>
          <div className="gz-fields">
            {FIELDS.filter((field) => field.group === id).map((field) => {
              const fieldId = `gz-product-${field.key}`;
              return (
                <div className={`gz-field ${field.key === 'image' || field.multiline ? 'gz-wide' : ''}`} key={field.key}>
                  <label htmlFor={fieldId} className="gz-label">{field.label}</label>
                  {field.multiline ? (
                    <textarea id={fieldId} className="gz-input gz-textarea" placeholder={field.placeholder} value={form?.[field.key] ?? ''} onChange={(e) => update(field.key, e.target.value)} />
                  ) : (
                    <input id={fieldId} className="gz-input" type={field.keyboard === 'number' ? 'number' : 'text'} min={field.keyboard === 'number' ? 0 : undefined} step={field.keyboard === 'number' ? 'any' : undefined} placeholder={field.placeholder} value={form?.[field.key] ?? ''} onChange={(e) => update(field.key, e.target.value)} />
                  )}
                  {field.key === 'stock' && Number.isFinite(currentStock) && form?.stock !== '' && form?.stock != null && currentStock <= 0 && <p className="gz-inline-note">No stock available. Enter a positive quantity to make inventory available.</p>}
                  {field.key === 'image' && previewUrl && <div className="gz-image-preview"><img src={previewUrl} alt="Product preview" onError={(e) => { e.currentTarget.style.display = 'none'; }} /><span className="gz-image-caption">Image preview from the URL provided. This does not upload a file.</span></div>}
                </div>
              );
            })}
          </div>
          {id === 'basics' && (
            <div style={{ marginTop: 19 }}>
              <label className="gz-label">Category</label>
              <div className="gz-category-grid" role="group" aria-label="Product category">
                {CATS.map((c) => {
                  const active = form?.category === c;
                  return <button type="button" className="gz-chip" key={c} aria-pressed={active} onClick={() => update('category', c)} style={active ? { background: selectedAccent, borderColor: selectedAccent, color: '#fff' } : undefined}>{c}</button>;
                })}
              </div>
            </div>
          )}
          {id === 'inventory' && (
            <div className="gz-availability">
              <div><div className="gz-available-title">Product availability</div><div className="gz-available-sub">Control whether this product is active in the catalogue</div></div>
              <button type="button" role="switch" aria-checked={!!form?.is_active} className="gz-switch" onClick={() => update('is_active', !form?.is_active)} style={{ background: form?.is_active ? selectedAccent : '#8D8795' }}>
                {form?.is_active ? '✓ Active' : 'Inactive'}
              </button>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
