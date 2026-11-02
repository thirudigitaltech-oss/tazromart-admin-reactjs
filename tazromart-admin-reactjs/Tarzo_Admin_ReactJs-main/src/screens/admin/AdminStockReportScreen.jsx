import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, ChevronDown, ChevronUp, TrendingUp, TrendingDown,
  Wallet, CalendarDays, RefreshCw, Search, Package, BarChart3,
  IndianRupee, AlertCircle, X,
} from 'lucide-react';
import { adminApi } from '../../utils/api';
import { useAdminNavigation } from '../../utils/navigation';

// UI-only redesign: /stock-report, days query and returned report fields are unchanged.
const RANGE_OPTIONS = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
];
const currency = (value) => {
  const n = Number(value);
  return `₹${(Number.isFinite(n) ? n : 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};
const qty = (value) => {
  const n = Number(value);
  return (Number.isFinite(n) ? n : 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
};
const safeText = (value) => String(value ?? '');

export default function AdminStockReportScreen() {
  const navigation = useAdminNavigation();
  const [days, setDays] = useState(30);
  const [data, setData] = useState({ days: [], overall: { investment: 0, revenue: 0, profit: 0 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDay, setOpenDay] = useState(null);
  const [search, setSearch] = useState('');
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError('');
    try {
      const response = await adminApi.get('/stock-report', { params: { days } });
      if (id !== requestId.current) return;
      const result = response?.data || {};
      const validDays = Array.isArray(result.days) ? result.days : [];
      setData({ days: validDays, overall: result.overall || { investment: 0, revenue: 0, profit: 0 } });
      setOpenDay(validDays[0]?.date ?? null);
    } catch (err) {
      if (id !== requestId.current) return;
      console.error('Stock report request failed:', err);
      setError('Unable to load stock report. Please check your connection and try again.');
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
    return () => { requestId.current += 1; };
  }, [load]);

  const overall = data.overall || {};
  const filteredDays = data.days.map((day) => ({
    ...day,
    products: (Array.isArray(day.products) ? day.products : []).filter((p) =>
      safeText(p.name).toLowerCase().includes(search.trim().toLowerCase()) ||
      safeText(p.product_id).toLowerCase().includes(search.trim().toLowerCase())
    ),
  })).filter((day) => !search.trim() || day.products.length > 0);
  const isProfit = Number(overall.profit || 0) >= 0;

  return (
    <div className="gzsr-root">
      <style>{styles}</style>
      <div className="gzsr-container">
        <header className="gzsr-header">
          <div className="gzsr-heading">
            <button type="button" className="gzsr-back" onClick={() => navigation.goBack()} aria-label="Go back"><ArrowLeft size={19} /></button>
            <div>
              <div className="gzsr-eyebrow">INVENTORY / ANALYTICS</div>
              <h1>Stock &amp; Financial Report</h1>
              <p>Explore stock movements, revenue and margins — day by day.</p>
            </div>
          </div>
          <div className="gzsr-header-actions">
            <button type="button" className="gzsr-refresh" onClick={load} disabled={loading}><RefreshCw size={16} /> {loading ? 'Refreshing…' : 'Refresh'}</button>
            <div className="gzsr-ranges" role="group" aria-label="Report date range">
              {RANGE_OPTIONS.map((option) => (
                <button type="button" key={option.value} aria-pressed={days === option.value} className={days === option.value ? 'active' : ''} onClick={() => setDays(option.value)}>{option.label}</button>
              ))}
            </div>
          </div>
        </header>

        <section className="gzsr-hero" aria-label="Report overview">
          <div className="gzsr-hero-glow" />
          <div className="gzsr-hero-body">
            <div className="gzsr-hero-kicker"><span className="gzsr-spark" /> BUSINESS INTELLIGENCE</div>
            <h2>Know your numbers.<br /><span>Grow with confidence.</span></h2>
            <p>Financial insights and stock activity across the last {days} days.</p>
          </div>
          <div className="gzsr-hero-mark"><BarChart3 size={76} strokeWidth={1.15} /></div>
        </section>

        <div className="gzsr-summary-title"><div><h2>Performance overview</h2><p>Values provided by your existing report API</p></div><span className="gzsr-period"><CalendarDays size={15} /> Last {days} days</span></div>
        <section className="gzsr-metrics" aria-label="Financial summary">
          <article className="gzsr-metric"><div className="gzsr-metric-top"><span>Total Investment</span><i className="gzsr-metric-icon lavender"><Wallet size={22}/></i></div><strong>{currency(overall.investment)}</strong><small>Stock investment</small></article>
          <article className="gzsr-metric"><div className="gzsr-metric-top"><span>Total Revenue</span><i className="gzsr-metric-icon blue"><IndianRupee size={22}/></i></div><strong>{currency(overall.revenue)}</strong><small>Reported revenue</small></article>
          <article className="gzsr-metric"><div className="gzsr-metric-top"><span>Net Profit / Loss</span><i className={`gzsr-metric-icon ${isProfit ? 'green' : 'red'}`}>{isProfit ? <TrendingUp size={22}/> : <TrendingDown size={22}/>}</i></div><strong className={isProfit ? 'gzsr-positive' : 'gzsr-negative'}>{currency(overall.profit)}</strong><small>As calculated by the backend</small></article>
        </section>

        <section className="gzsr-reports">
          <div className="gzsr-reports-top"><div><h2>Daily stock breakdown</h2><p>Open a date to inspect individual product movements.</p></div><div className="gzsr-search"><Search size={17}/><input aria-label="Search report products" placeholder="Search product or ID" value={search} onChange={(e) => setSearch(e.target.value)}/>{search && <button type="button" aria-label="Clear search" onClick={() => setSearch('')}><X size={15}/></button>}</div></div>
          {error && <div className="gzsr-error" role="alert"><AlertCircle size={18}/><span>{error}</span><button type="button" onClick={load}>Retry</button></div>}
          {loading ? <div className="gzsr-state">Loading stock report…</div> : !error && filteredDays.length === 0 ? <div className="gzsr-state"><Package size={34}/><strong>{search ? 'No matching products' : 'No stock movements found'}</strong><span>{search ? 'Try a different product name or ID.' : 'There are no recorded movements for this range.'}</span></div> : !error && (
            <div className="gzsr-days">
              {filteredDays.map((day) => {
                const expanded = search.trim() ? true : openDay === day.date;
                const totals = day.totals || {};
                const dayProfit = Number(totals.profit || 0) >= 0;
                return <article className="gzsr-day" key={day.date}>
                  <button type="button" className="gzsr-day-head" onClick={() => setOpenDay(expanded && !search ? null : day.date)} aria-expanded={expanded}>
                    <span className="gzsr-day-left"><span className="gzsr-date-icon"><CalendarDays size={19}/></span><span><strong>{day.date}</strong><small>{day.products.length} product{day.products.length === 1 ? '' : 's'} shown</small></span></span>
                    <span className="gzsr-day-right"><span><small>DAY PROFIT / LOSS</small><b className={dayProfit ? 'gzsr-positive' : 'gzsr-negative'}>{currency(totals.profit)}</b></span>{expanded ? <ChevronUp size={19}/> : <ChevronDown size={19}/>}</span>
                  </button>
                  {expanded && <div className="gzsr-day-body">
                    <div className="gzsr-table-scroll"><table><thead><tr><th>Product</th><th>Unit Price</th><th>Sold Qty</th><th>Restocked</th><th>Investment</th><th>Revenue</th><th>Profit / Loss</th></tr></thead><tbody>
                      {day.products.map((p, index) => <tr key={`${p.product_id ?? p.name}-${index}`}><td className="gzsr-product"><strong>{p.name || 'Unnamed product'}</strong><small>ID: {p.product_id ?? '—'}</small></td><td>{currency(p.price)}</td><td><span className="gzsr-qty">{qty(p.sold_qty)}</span></td><td><span className="gzsr-restock">{qty(p.restocked_qty)}</span></td><td>{currency(p.investment)}</td><td>{currency(p.revenue)}</td><td className={Number(p.profit || 0) >= 0 ? 'gzsr-positive' : 'gzsr-negative'}>{currency(p.profit)}</td></tr>)}
                    </tbody><tfoot><tr><td colSpan={4}>Day totals (all products)</td><td>{currency(totals.investment)}</td><td>{currency(totals.revenue)}</td><td className={dayProfit ? 'gzsr-positive' : 'gzsr-negative'}>{currency(totals.profit)}</td></tr></tfoot></table></div>
                    <div className="gzsr-mobile-products">{day.products.map((p, index) => <div className="gzsr-mobile-product" key={`${p.product_id ?? p.name}-${index}`}><div className="gzsr-mobile-product-head"><strong>{p.name || 'Unnamed product'}</strong><b className={Number(p.profit || 0) >= 0 ? 'gzsr-positive' : 'gzsr-negative'}>{currency(p.profit)}</b></div><div className="gzsr-mobile-meta">ID: {p.product_id ?? '—'} · Price: {currency(p.price)}</div><div className="gzsr-mobile-grid"><span>Sold <b>{qty(p.sold_qty)}</b></span><span>Restocked <b>{qty(p.restocked_qty)}</b></span><span>Investment <b>{currency(p.investment)}</b></span><span>Revenue <b>{currency(p.revenue)}</b></span></div></div>)}<div className="gzsr-mobile-totals"><strong>Day totals (all products)</strong><div>Investment <b>{currency(totals.investment)}</b></div><div>Revenue <b>{currency(totals.revenue)}</b></div><div>Profit / Loss <b>{currency(totals.profit)}</b></div></div></div>
                  </div>}
                </article>;
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const styles = `
.gzsr-root{background:#F7F5FC;min-height:100vh;color:#251837;font-family:'Plus Jakarta Sans',Inter,system-ui,-apple-system,sans-serif;box-sizing:border-box}.gzsr-root *{box-sizing:border-box}.gzsr-container{max-width:1440px;margin:0 auto;padding:29px clamp(15px,2.5vw,38px) 80px}
.gzsr-header,.gzsr-heading,.gzsr-header-actions,.gzsr-summary-title,.gzsr-reports-top,.gzsr-day-head,.gzsr-day-left,.gzsr-day-right{display:flex;align-items:center}.gzsr-header{justify-content:space-between;gap:20px;margin-bottom:24px}.gzsr-heading{gap:14px;min-width:0}.gzsr-back{width:44px;height:44px;flex-shrink:0;background:#fff;border:1px solid #E7DEF2;color:#6D28D9;border-radius:13px;display:grid;place-items:center;cursor:pointer}.gzsr-eyebrow{font-size:10px;letter-spacing:1.6px;color:#8B5DB7;font-weight:800}.gzsr-heading h1{font-size:clamp(22px,2.4vw,32px);letter-spacing:-1.1px;margin:5px 0;font-weight:850;line-height:1.2}.gzsr-heading p,.gzsr-summary-title p,.gzsr-reports-top p{margin:0;color:#897E97;font-size:12px;line-height:1.6}.gzsr-header-actions{gap:10px}.gzsr-refresh,.gzsr-ranges{background:#fff;border:1px solid #E6DFF0;border-radius:12px}.gzsr-refresh{display:flex;align-items:center;gap:7px;color:#674188;cursor:pointer;padding:11px 13px;font-size:12px;font-weight:750}.gzsr-refresh:disabled{opacity:.6;cursor:wait}.gzsr-ranges{display:flex;padding:4px;gap:3px}.gzsr-ranges button{white-space:nowrap;border:0;background:transparent;padding:9px 13px;font-size:12px;color:#776887;border-radius:9px;font-weight:750;cursor:pointer}.gzsr-ranges button.active{background:#702DD0;color:#fff;box-shadow:0 3px 10px #6426BD35}
.gzsr-hero{position:relative;background:linear-gradient(113deg,#36105F 0%,#6324AA 66%,#8D48D3 100%);border-radius:23px;padding:31px 38px;overflow:hidden;color:#fff;min-height:177px;display:flex;justify-content:space-between;align-items:center}.gzsr-hero-glow{position:absolute;inset:auto -35px -135px auto;width:390px;height:320px;background:#BE8BFF66;filter:blur(65px);border-radius:50%}.gzsr-hero-body{position:relative;z-index:2}.gzsr-hero-kicker{font-size:10px;letter-spacing:1.7px;font-weight:800;color:#E1C9FA;display:flex;align-items:center;gap:8px}.gzsr-spark{height:7px;width:7px;border-radius:50%;background:#B5FFDA}.gzsr-hero h2{font-size:clamp(24px,3vw,39px);line-height:1.17;letter-spacing:-1.4px;margin:12px 0;font-weight:850}.gzsr-hero h2 span{color:#E5C9FF}.gzsr-hero p{font-size:13px;color:#EFE1FF;margin:0}.gzsr-hero-mark{position:relative;color:#E4C3FF66;margin-right:55px}
.gzsr-summary-title{justify-content:space-between;margin:27px 0 13px;gap:10px}.gzsr-summary-title h2,.gzsr-reports-top h2{margin:0 0 5px;font-size:18px;letter-spacing:-.45px}.gzsr-period{display:flex;align-items:center;gap:7px;background:#EDE3FB;color:#6A2AAD;border-radius:20px;padding:8px 12px;font-size:11px;font-weight:800;white-space:nowrap}.gzsr-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px}.gzsr-metric{background:#fff;border:1px solid #E8E1F0;border-radius:18px;box-shadow:0 5px 25px #3B175A09;padding:21px 23px;min-width:0}.gzsr-metric-top{display:flex;align-items:flex-start;justify-content:space-between;gap:8px}.gzsr-metric-top>span{font-size:12px;color:#786C83;font-weight:750}.gzsr-metric-icon{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font-style:normal;flex-shrink:0}.gzsr-metric-icon.lavender{background:#EFE4FF;color:#762DD2}.gzsr-metric-icon.blue{background:#EAF1FF;color:#3B72D0}.gzsr-metric-icon.green{background:#E9F7EE;color:#17965F}.gzsr-metric-icon.red{background:#FFECEF;color:#D43C59}.gzsr-metric>strong{display:block;margin:7px 0 6px;font-size:clamp(22px,2.5vw,32px);letter-spacing:-.9px;overflow-wrap:anywhere}.gzsr-metric>small{color:#9A90A3;font-size:11px}.gzsr-positive{color:#168657!important}.gzsr-negative{color:#D34452!important}
.gzsr-reports{margin-top:29px}.gzsr-reports-top{justify-content:space-between;gap:15px;flex-wrap:wrap;margin-bottom:14px}.gzsr-search{width:min(100%,310px);height:43px;display:flex;align-items:center;gap:8px;border:1px solid #E6DFF0;border-radius:12px;background:#fff;padding:0 12px;color:#957FA6}.gzsr-search input{width:100%;min-width:0;background:transparent;border:0;outline:0;font-size:12px;color:#352446}.gzsr-search button{background:transparent;border:0;color:#9A87A7;cursor:pointer}.gzsr-days{display:flex;flex-direction:column;gap:12px}.gzsr-day{background:#fff;border-radius:16px;border:1px solid #E8E1F0;box-shadow:0 3px 15px #2F15480A;overflow:hidden}.gzsr-day-head{width:100%;justify-content:space-between;text-align:left;background:#fff;border:0;cursor:pointer;padding:17px 20px;gap:12px}.gzsr-day-left{gap:12px;min-width:0}.gzsr-date-icon{display:grid;place-items:center;flex-shrink:0;width:42px;height:42px;border-radius:12px;background:#F0E7FB;color:#752ED0}.gzsr-day-left strong{display:block;font-size:14px}.gzsr-day-left small{display:block;color:#8F8597;font-size:11px;margin-top:5px}.gzsr-day-right{gap:20px;color:#7B6990;flex-shrink:0}.gzsr-day-right span{text-align:right}.gzsr-day-right small{font-size:9px;color:#93899C;font-weight:800;letter-spacing:.7px;display:block}.gzsr-day-right b{font-size:15px;display:block;margin-top:4px}.gzsr-day-body{border-top:1px solid #EDE6F4;padding:0 19px 18px}.gzsr-table-scroll{overflow-x:auto}.gzsr-table-scroll table{width:100%;border-collapse:collapse;white-space:nowrap;text-align:left;font-size:12px}.gzsr-table-scroll th{font-size:10px;letter-spacing:.5px;text-transform:uppercase;color:#84778E;background:#FAF8FD;font-weight:800}.gzsr-table-scroll td,.gzsr-table-scroll th{padding:14px 12px;border-bottom:1px solid #F1ECF6}.gzsr-table-scroll td{color:#4B3D59}.gzsr-table-scroll td.gzsr-positive,.gzsr-table-scroll td.gzsr-negative{font-weight:800}.gzsr-product strong{font-size:12px;display:block;color:#33223F}.gzsr-product small{color:#9B91A3;display:block;font-size:10px;margin-top:4px}.gzsr-table-scroll tfoot{background:#F5EFFC;font-weight:800}.gzsr-table-scroll tfoot td{font-weight:800}.gzsr-qty,.gzsr-restock{border-radius:8px;padding:5px 9px;background:#EAF0FF;color:#426BBB;font-weight:800}.gzsr-restock{background:#F0E5FF;color:#742FC0}.gzsr-state{padding:60px 20px;background:#fff;border:1px dashed #DDD0EB;border-radius:18px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:10px;text-align:center;color:#82728F;font-size:13px}.gzsr-state strong{color:#463354}.gzsr-error{padding:13px 16px;margin-bottom:12px;border:1px solid #F6C8D0;background:#FFF0F2;color:#A52842;display:flex;align-items:center;gap:10px;border-radius:12px;font-size:12px}.gzsr-error button{margin-left:auto;padding:7px 12px;border:1px solid #E2A5B0;background:white;color:#A52842;border-radius:8px;cursor:pointer;font-weight:700}.gzsr-mobile-products{display:none}.gzsr-root button:focus-visible,.gzsr-root input:focus-visible{outline:3px solid #BE90F9;outline-offset:2px}
@media(max-width:1080px){.gzsr-header{align-items:flex-start;flex-direction:column}.gzsr-header-actions{width:100%;justify-content:space-between}.gzsr-metric{padding:17px}}
@media(max-width:690px){.gzsr-container{padding:18px 13px 55px}.gzsr-heading h1{font-size:23px}.gzsr-heading p{font-size:11px}.gzsr-header{margin-bottom:17px}.gzsr-header-actions{flex-wrap:wrap;gap:9px}.gzsr-ranges{flex:1;justify-content:space-around}.gzsr-ranges button{flex:1;padding:10px 7px}.gzsr-hero{padding:24px 21px;border-radius:18px;min-height:155px}.gzsr-hero h2{font-size:26px}.gzsr-hero-mark{display:none}.gzsr-hero p{font-size:11px;line-height:1.6}.gzsr-summary-title h2,.gzsr-reports-top h2{font-size:16px}.gzsr-metrics{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.gzsr-metric{padding:13px 12px;border-radius:14px}.gzsr-metric:nth-child(3){grid-column:span 2}.gzsr-metric-icon{width:34px;height:34px}.gzsr-metric-top>span{font-size:10px}.gzsr-metric>strong{font-size:22px}.gzsr-metric>small{font-size:10px}.gzsr-period{font-size:10px;padding:7px 9px}.gzsr-reports-top{align-items:stretch}.gzsr-search{max-width:none;width:100%}.gzsr-day-head{padding:13px 12px}.gzsr-date-icon{width:37px;height:37px}.gzsr-day-right{gap:9px}.gzsr-day-right b{font-size:13px}.gzsr-day-right small{font-size:8px}.gzsr-day-left strong{font-size:12px}.gzsr-day-body{padding:0 12px 12px}.gzsr-table-scroll{display:none}.gzsr-mobile-products{display:flex;flex-direction:column;gap:10px;padding-top:10px}.gzsr-mobile-product{border:1px solid #EEE7F5;border-radius:12px;padding:12px}.gzsr-mobile-product-head{display:flex;justify-content:space-between;gap:8px;font-size:12px}.gzsr-mobile-meta{font-size:10px;color:#978B9E;margin:5px 0 11px}.gzsr-mobile-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.gzsr-mobile-grid span{font-size:10px;color:#8B8094;background:#FAF8FC;padding:8px;border-radius:8px}.gzsr-mobile-grid b{display:block;margin-top:4px;color:#392C46;font-size:12px}.gzsr-mobile-totals{background:#F3ECFB;border-radius:10px;padding:12px;display:grid;gap:8px;font-size:11px}.gzsr-mobile-totals>div{display:flex;justify-content:space-between;gap:10px}.gzsr-mobile-totals strong{margin-bottom:3px}}
@media(max-width:390px){.gzsr-heading h1{font-size:20px}.gzsr-ranges button{font-size:10px}.gzsr-metric>strong{font-size:19px}}
`;
