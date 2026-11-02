import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  Plus, Pencil, Trash2, PackageSearch, PackagePlus, BarChart3, X,
  Search, AlertTriangle, Boxes, PackageCheck, RefreshCw,
  ChevronLeft, ChevronRight, SlidersHorizontal
} from 'lucide-react';
import AdminLayout from './AdminLayout';
import { adminApi } from '../../utils/api';
import { useAdminNavigation } from '../../utils/navigation';

// Visual warning only. Inventory operations remain entirely server-controlled.
const LOW_STOCK_THRESHOLD = 10;
const PAGE_SIZE = 24;
const money = (n) => Number.isFinite(Number(n)) ? Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0';
const stockOf = (p) => Number(p.stock) || 0;

export default function AdminProductsScreen() {
  const navigation = useAdminNavigation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [restockCost, setRestockCost] = useState('');
  const [restocking, setRestocking] = useState(false);
  const [busyDeleteId, setBusyDeleteId] = useState(null);
  const [message, setMessage] = useState('');
  const alive = useRef(true);
  const fetchSequence = useRef(0);

  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; fetchSequence.current += 1; };
  }, []);

  const load = useCallback(async () => {
    const requestId = ++fetchSequence.current;
    setLoading(true);
    setFetchError('');
    try {
      const response = await adminApi.get('/products');
      const data = response?.data;
      if (!Array.isArray(data)) throw new Error('Unexpected products response');
      if (alive.current && requestId === fetchSequence.current) setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
      if (alive.current && requestId === fetchSequence.current) {
        setFetchError('Products could not be loaded. Please retry.');
      }
    } finally {
      if (alive.current && requestId === fetchSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, stockFilter, category, sort]);

  const categories = useMemo(() => Array.from(new Set(products.map(p => String(p.category || 'General')))).sort((a,b) => a.localeCompare(b)), [products]);
  const counts = useMemo(() => ({
    total: products.length,
    available: products.filter(p => stockOf(p) > LOW_STOCK_THRESHOLD).length,
    low: products.filter(p => stockOf(p) > 0 && stockOf(p) <= LOW_STOCK_THRESHOLD).length,
    out: products.filter(p => stockOf(p) <= 0).length,
  }), [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    const matches = products.filter(p => {
      const stock = stockOf(p);
      const searchable = [p.name, p.category, p.id, p.unit].map(v => String(v ?? '')).join(' ').toLocaleLowerCase();
      if (q && !searchable.includes(q)) return false;
      if (category !== 'all' && String(p.category || 'General') !== category) return false;
      if (stockFilter === 'out' && stock > 0) return false;
      if (stockFilter === 'low' && !(stock > 0 && stock <= LOW_STOCK_THRESHOLD)) return false;
      if (stockFilter === 'available' && stock <= LOW_STOCK_THRESHOLD) return false;
      return true;
    });
    return matches.sort((a,b) => {
      if (sort === 'stock-low') return stockOf(a) - stockOf(b);
      if (sort === 'stock-high') return stockOf(b) - stockOf(a);
      if (sort === 'price-low') return Number(a.price || 0) - Number(b.price || 0);
      if (sort === 'price-high') return Number(b.price || 0) - Number(a.price || 0);
      return String(a.name || '').localeCompare(String(b.name || ''));
    });
  }, [products, search, category, stockFilter, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pages);
  const visibleProducts = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleDelete = async (p) => {
    if (busyDeleteId !== null || restocking) return;
    if (!window.confirm(`Delete “${p.name || 'this product'}”? This action cannot be undone.`)) return;
    setBusyDeleteId(p.id);
    setMessage('');
    try {
      await adminApi.delete(`/products/${p.id}`);
      if (alive.current) {
        setProducts(list => list.filter(item => item.id !== p.id));
        setMessage('Product deleted successfully.');
      }
    } catch (err) {
      console.error('Delete failed:', err);
      if (alive.current) setMessage(err?.response?.data?.detail || 'Delete failed. Please try again.');
    } finally {
      if (alive.current) setBusyDeleteId(null);
    }
  };

  const openRestock = (p) => {
    setRestockTarget(p);
    setRestockQty('');
    setRestockCost(p.cost_price != null ? String(p.cost_price) : '');
    setMessage('');
  };

  const submitRestock = async (event) => {
    event.preventDefault();
    if (restocking || !restockTarget) return;
    const qty = Number(restockQty);
    const cost = restockCost.trim() === '' ? null : Number(restockCost);
    if (!Number.isFinite(qty) || qty <= 0 || (cost !== null && (!Number.isFinite(cost) || cost < 0))) {
      setMessage('Enter a valid quantity and a non-negative cost price.');
      return;
    }
    setRestocking(true);
    setMessage('');
    try {
      await adminApi.post(`/products/${restockTarget.id}/restock`, { qty, cost_price: cost });
      if (alive.current) {
        setRestockTarget(null);
        setMessage('Stock added successfully.');
      }
      await load();
    } catch (err) {
      console.error('Restock failed:', err);
      if (alive.current) setMessage(err?.response?.data?.detail || 'Restock failed. Please retry.');
    } finally {
      if (alive.current) setRestocking(false);
    }
  };

  const clearFilters = () => { setSearch(''); setCategory('all'); setStockFilter('all'); setSort('name'); };

  return (
    <AdminLayout activeScreen="AdminProducts">
      <style>{`
        .gzm-products{font-family:'Plus Jakarta Sans','Inter',system-ui,sans-serif;color:#241436;max-width:1600px;margin:auto;min-width:0}
        .gzm-products *{box-sizing:border-box}.gzm-products button,.gzm-products input,.gzm-products select{font:inherit}
        .gzm-products button{cursor:pointer}.gzm-products button:disabled{cursor:not-allowed;opacity:.55}
        .gzm-products button:focus-visible,.gzm-products select:focus-visible,.gzm-products input:focus-visible{outline:3px solid #a78bfa;outline-offset:2px}
        .gzm-phead{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:22px}
        .gzm-phead h1{font-size:clamp(24px,2.6vw,34px);line-height:1.15;margin:3px 0 7px;letter-spacing:-1.1px;font-weight:850}
        .gzm-muted{color:#82758e;font-size:13px;margin:0}.gzm-overline{font-size:10px;letter-spacing:2px;color:#7437ca;font-weight:850}
        .gzm-head-actions{display:flex;gap:9px;flex-wrap:wrap}
        .gzm-btn{border:1px solid #e6dcef;background:white;color:#4c2a75;display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 15px;border-radius:12px;font-weight:750;font-size:12px;min-height:44px}
        .gzm-btn-primary{background:#742ce5;border-color:#742ce5;color:white;box-shadow:0 6px 15px #742ce52a}
        .gzm-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:21px}
        .gzm-stat{background:white;border:1px solid #ebe5f1;border-radius:17px;padding:19px;display:flex;gap:13px;align-items:center;min-width:0;box-shadow:0 5px 18px #32105a06}
        .gzm-stat-icon{width:44px;height:44px;display:grid;place-items:center;flex-shrink:0;border-radius:13px}
        .gzm-stat strong{display:block;font-size:27px;line-height:1.05;letter-spacing:-.7px}.gzm-stat span{font-size:11px;color:#80738c;font-weight:700;display:block;margin-top:7px}
        .gzm-filters{background:#fff;border:1px solid #ebe5f1;border-radius:17px;padding:16px;margin-bottom:19px;display:flex;flex-direction:column;gap:13px}
        .gzm-toolbar{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
        .gzm-search{flex:1;min-width:220px;display:flex;gap:9px;align-items:center;padding:0 13px;background:#faf8fe;border:1px solid #e7def1;border-radius:11px;color:#856e9e;min-height:45px}
        .gzm-search input{min-width:0;width:100%;border:0;outline:0;background:none;color:#271538;font-size:13px}
        .gzm-select{border:1px solid #e7def1;background:#faf8fe;color:#41245e;border-radius:11px;padding:0 11px;height:45px;font-size:12px;max-width:100%}
        .gzm-chips{display:flex;flex-wrap:wrap;gap:7px}.gzm-chip{border:1px solid #eadff4;background:#fff;color:#685374;border-radius:999px;padding:9px 13px;font-size:11px;font-weight:750;white-space:nowrap}.gzm-chip.active{background:#702dde;color:white;border-color:#702dde}
        .gzm-results{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:17px 0 13px}.gzm-results strong{font-size:14px}.gzm-results span{font-size:12px;color:#8c8095}
        .gzm-productgrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
        .gzm-pcard{min-width:0;background:white;border:1px solid #eae3f1;border-radius:17px;overflow:hidden;display:flex;flex-direction:column;transition:box-shadow .2s,transform .2s}
        .gzm-pcard:hover{box-shadow:0 12px 28px #51217c19;transform:translateY(-2px)}
        .gzm-picture{height:150px;background:#f9f7fc;position:relative;display:flex;align-items:center;justify-content:center;padding:18px}
        .gzm-picture img{width:100%;height:100%;object-fit:contain;display:block}
        .gzm-stockbadge{position:absolute;right:10px;top:10px;padding:5px 8px;border-radius:7px;font-size:10px;font-weight:800}
        .gzm-body{padding:15px;display:flex;flex:1;flex-direction:column;gap:6px;min-width:0}
        .gzm-category{color:#8a64ad;font-size:10px;font-weight:800;letter-spacing:.4px;text-transform:uppercase}
        .gzm-name{font-size:14px;font-weight:800;line-height:1.45;min-height:40px;overflow-wrap:anywhere}
        .gzm-price{font-size:18px;font-weight:850;color:#502184}.gzm-unit{font-size:11px;color:#8b8094;font-weight:600}
        .gzm-stockline{color:#82748c;font-size:11px;font-weight:650;margin:4px 0 6px}
        .gzm-cardactions{display:flex;gap:7px;margin-top:auto;padding-top:8px}.gzm-cardactions button{border:1px solid #eadff3;border-radius:9px;min-height:38px;display:flex;gap:5px;justify-content:center;align-items:center;background:#f7f0ff;color:#6730bc;font-size:11px;font-weight:800}
        .gzm-cardactions .gzm-mini{width:38px;flex-shrink:0;background:white}.gzm-cardactions .gzm-danger{color:#c54253;border-color:#f4d9df}
        .gzm-empty{padding:50px 20px;text-align:center;border:1px dashed #dbc6ed;border-radius:15px;background:white}
        .gzm-pager{display:flex;justify-content:center;align-items:center;gap:12px;margin:24px 0}.gzm-pager span{font-size:12px;color:#6e5c7e}
        .gzm-alert{padding:12px 15px;background:#f8efff;border:1px solid #e8d4ff;border-radius:10px;color:#522583;font-size:12px;margin-bottom:14px}
        .gzm-modalbg{position:fixed;inset:0;background:#180c2fb8;display:grid;place-items:center;z-index:1100;padding:15px}
        .gzm-modal{background:#fff;border-radius:19px;padding:24px;width:100%;max-width:430px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 70px #0005}
        .gzm-modal h2{font-size:19px;margin:0 0 9px}.gzm-modal label{display:block;font-weight:750;font-size:12px;margin:15px 0 7px}.gzm-modal input{display:block;width:100%;border:1px solid #e5dbee;border-radius:10px;padding:12px;color:#291839}
        @media(max-width:1180px){.gzm-productgrid{grid-template-columns:repeat(3,minmax(0,1fr))}.gzm-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:770px){.gzm-productgrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.gzm-picture{height:120px}.gzm-body{padding:12px}.gzm-stat{padding:15px}.gzm-filters{padding:12px}.gzm-toolbar{align-items:stretch}.gzm-search{min-width:100%}.gzm-select{flex:1;min-width:0}.gzm-name{font-size:12px}.gzm-cardactions button{min-height:37px}.gzm-cardactions .gzm-mini{width:34px}}
        @media(max-width:390px){.gzm-stat{gap:8px;padding:12px}.gzm-stat-icon{width:34px;height:34px}.gzm-stat strong{font-size:21px}.gzm-stat span{font-size:10px}.gzm-head-actions{width:100%}.gzm-head-actions .gzm-btn{flex:1}.gzm-picture{height:100px;padding:10px}.gzm-body{padding:9px}.gzm-price{font-size:15px}.gzm-productgrid{gap:8px}.gzm-chip{padding:8px 10px}}
      `}</style>
      <div className="gzm-products">
        <div className="gzm-phead">
          <div><div className="gzm-overline">INVENTORY MANAGEMENT</div><h1>Product catalogue</h1><p className="gzm-muted">Find products, monitor stock and manage your grocery inventory.</p></div>
          <div className="gzm-head-actions">
            <button type="button" className="gzm-btn" onClick={() => navigation.navigate('AdminStockReport')} data-testid="stock-report-btn"><BarChart3 size={17}/> Stock report</button>
            <button type="button" className="gzm-btn gzm-btn-primary" onClick={() => navigation.navigate('AdminAddProduct')} data-testid="add-product-btn"><Plus size={17}/> Add product</button>
          </div>
        </div>

        <div className="gzm-stats">
          {[
            {name:'Total products',value:counts.total,icon:Boxes,color:'#702dde',bg:'#f0e6ff',filter:'all'},
            {name:'In stock',value:counts.available,icon:PackageCheck,color:'#178a69',bg:'#e5f8f0',filter:'available'},
            {name:'Low stock',value:counts.low,icon:AlertTriangle,color:'#bd7c0e',bg:'#fff4d8',filter:'low'},
            {name:'Out of stock',value:counts.out,icon:PackageSearch,color:'#ca4457',bg:'#ffe9ec',filter:'out'},
          ].map(stat => {
            const Icon = stat.icon;
            return <button type="button" key={stat.name} onClick={() => setStockFilter(stat.filter)} className="gzm-stat" style={{textAlign:'left',cursor:'pointer',outline:stockFilter === stat.filter ? '2px solid #ccb1ef' : 'none'}}><div className="gzm-stat-icon" style={{background:stat.bg,color:stat.color}}><Icon size={21}/></div><div><strong>{stat.value}</strong><span>{stat.name}</span></div></button>;
          })}
        </div>

        {message && <div className="gzm-alert" role="status">{message}</div>}
        {fetchError && <div className="gzm-alert" role="alert">{fetchError} <button type="button" className="gzm-btn" style={{marginLeft:10}} onClick={load}>Retry</button></div>}

        <div className="gzm-filters">
          <div className="gzm-toolbar">
            <label className="gzm-search"><Search size={17}/><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search by name, product ID or category…" aria-label="Search products"/></label>
            <select className="gzm-select" value={category} onChange={e => setCategory(e.target.value)} aria-label="Filter by category"><option value="all">All categories</option>{categories.map(c => <option value={c} key={c}>{c}</option>)}</select>
            <select className="gzm-select" value={sort} onChange={e => setSort(e.target.value)} aria-label="Sort products"><option value="name">Name A–Z</option><option value="stock-low">Stock: low first</option><option value="stock-high">Stock: high first</option><option value="price-low">Price: low first</option><option value="price-high">Price: high first</option></select>
            <button type="button" className="gzm-btn" onClick={load} disabled={loading}><RefreshCw size={16}/>{loading?'Refreshing':'Refresh'}</button>
          </div>
          <div className="gzm-chips" aria-label="Stock filters">
            {[['all','All products'],['available','In stock'],['low','Low stock'],['out','Out of stock']].map(([value,label]) => <button type="button" key={value} onClick={()=>setStockFilter(value)} className={`gzm-chip ${stockFilter===value?'active':''}`}>{label}</button>)}
          </div>
        </div>

        <div className="gzm-results"><strong>{loading ? 'Loading products…' : `${filtered.length.toLocaleString('en-IN')} products found`}</strong><span>Low stock alert: 1–{LOW_STOCK_THRESHOLD} units</span></div>
        {loading ? <div className="gzm-empty" role="status">Loading products…</div> : (products.length === 0 && !fetchError) ? (
          <div className="gzm-empty" data-testid="empty-products-state"><PackageSearch size={36} color="#7437ca"/><h3>No products yet</h3><p>Add your first product to get started.</p><button className="gzm-btn gzm-btn-primary" onClick={()=>navigation.navigate('AdminAddProduct')} data-testid="add-first-product-btn"><Plus size={17}/> Add first product</button></div>
        ) : filtered.length === 0 ? (
          <div className="gzm-empty"><SlidersHorizontal size={33} color="#7437ca"/><h3>No matching products</h3><p>Try another search or clear your filters.</p><button type="button" className="gzm-btn" onClick={clearFilters}>Clear filters</button></div>
        ) : (
          <>
            <div className="gzm-productgrid">
              {visibleProducts.map(p => {
                const stock=stockOf(p);
                const out=stock<=0;
                const low=stock>0&&stock<=LOW_STOCK_THRESHOLD;
                return <article className="gzm-pcard" key={p.id} data-testid={`product-card-${p.id}`}>
                  <div className="gzm-picture"><img src={p.image || 'https://cdn-icons-png.flaticon.com/512/1625/1625028.png'} alt={p.name || 'Product'} loading="lazy" onError={e => {e.currentTarget.onerror=null;e.currentTarget.style.visibility='hidden';}}/>
                    {(out||low)&&<span className="gzm-stockbadge" style={{background:out?'#ffe8ed':'#fff1d5',color:out?'#bf3048':'#a06b08'}}>{out?'OUT OF STOCK':'LOW STOCK'}</span>}
                  </div>
                  <div className="gzm-body"><div className="gzm-category">{p.category || 'General'}</div><div className="gzm-name" title={p.name}>{p.name || 'Unnamed product'}</div><div className="gzm-price">₹{money(p.price)} <span className="gzm-unit">/ {p.unit || 'unit'}</span></div>
                    <div className="gzm-stockline">Available stock: <strong style={{color:out?'#bd3447':low?'#a06b08':'#23845a'}}>{p.stock ?? 0}</strong></div>
                    <div className="gzm-cardactions">
                      <button type="button" style={{flex:1}} data-testid={`restock-btn-${p.id}`} onClick={()=>openRestock(p)}><PackagePlus size={15}/> Restock</button>
                      <button type="button" className="gzm-mini" title="Edit product" aria-label={`Edit ${p.name}`} data-testid={`edit-btn-${p.id}`} onClick={()=>navigation.navigate('AdminEditProduct',{product:p})}><Pencil size={16}/></button>
                      <button type="button" className="gzm-mini gzm-danger" title="Delete product" aria-label={`Delete ${p.name}`} data-testid={`delete-btn-${p.id}`} disabled={busyDeleteId!==null} onClick={()=>handleDelete(p)}><Trash2 size={16}/></button>
                    </div>
                  </div>
                </article>;
              })}
            </div>
            {pages>1&&<div className="gzm-pager"><button className="gzm-btn" type="button" disabled={safePage===1} onClick={()=>setPage(p=>Math.max(1,p-1))}><ChevronLeft size={17}/> Previous</button><span>Page {safePage} of {pages}</span><button className="gzm-btn" type="button" disabled={safePage===pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>Next <ChevronRight size={17}/></button></div>}
          </>
        )}
      </div>

      {restockTarget && <div className="gzm-modalbg" onMouseDown={e=>{if(e.target===e.currentTarget&&!restocking)setRestockTarget(null);}} data-testid="restock-modal-overlay">
        <div className="gzm-modal" role="dialog" aria-modal="true" aria-labelledby="restock-heading">
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12}}><h2 id="restock-heading">Restock — {restockTarget.name}</h2><button type="button" className="gzm-btn" aria-label="Close restock" disabled={restocking} onClick={()=>setRestockTarget(null)} data-testid="close-modal-btn"><X size={18}/></button></div>
          <p className="gzm-muted">Current stock: <strong>{restockTarget.stock ?? 0} {restockTarget.unit || ''}</strong></p>
          <form onSubmit={submitRestock}>
            <label htmlFor="restock-qty">Add quantity *</label><input id="restock-qty" type="number" min="0.001" step="any" required autoFocus value={restockQty} onChange={e=>setRestockQty(e.target.value)} placeholder="e.g. 20" data-testid="restock-qty-input"/>
            <label htmlFor="restock-cost">Cost price / {restockTarget.unit || 'unit'} (₹)</label><input id="restock-cost" type="number" min="0" step="any" value={restockCost} onChange={e=>setRestockCost(e.target.value)} placeholder="Optional" data-testid="restock-cost-input"/>
            <button className="gzm-btn gzm-btn-primary" type="submit" disabled={restocking} style={{width:'100%',marginTop:20}} data-testid="submit-restock-btn">{restocking?'Adding stock…':'Add stock'}</button>
          </form>
        </div>
      </div>}
    </AdminLayout>
  );
}
