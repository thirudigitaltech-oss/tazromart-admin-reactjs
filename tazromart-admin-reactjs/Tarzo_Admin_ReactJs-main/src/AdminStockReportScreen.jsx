import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { adminApi } from '../../utils/api';
import { useAdminNavigation } from '../../utils/navigation';

const RANGE_OPTIONS = [
  { label: '7 Days', value: 7 },
  { label: '30 Days', value: 30 },
  { label: '90 Days', value: 90 },
];

export default function AdminStockReportScreen() {
  const navigation = useAdminNavigation();
  const [days, setDays] = useState(30);
  const [data, setData] = useState({ days: [], overall: { investment: 0, revenue: 0, profit: 0 } });
  const [loading, setLoading] = useState(true);
  const [openDay, setOpenDay] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await adminApi.get('/stock-report', { params: { days } });
      setData(r.data);
      setOpenDay(r.data.days?.[0]?.date || null);
    } catch {
      window.alert('Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const fmt = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

  return (
    <div style={{ minHeight: '100vh', background: '#F8F9FA' }}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={() => navigation.goBack()}>
          <ArrowLeft size={20} color="#fff" />
        </button>
        <div>
          <div style={s.headerTitle}>📊 Stock Report</div>
          <div style={s.headerSub}>Day-wise sales, investment & profit</div>
        </div>
      </div>

      <div style={{ padding: 16, paddingBottom: 40, maxWidth: 720, margin: '0 auto' }}>

        <div style={s.rangeRow}>
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              style={{ ...s.rangeBtn, ...(days === opt.value ? s.rangeBtnActive : {}) }}
              onClick={() => setDays(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div style={s.overallGrid}>
          <div style={s.overallCard}>
            <div style={{ ...s.overallIcon, background: '#FEE2E2' }}><Wallet size={18} color="#EF4444" /></div>
            <div>
              <div style={s.overallLbl}>Investment</div>
              <div style={s.overallVal}>{fmt(data.overall?.investment)}</div>
            </div>
          </div>
          <div style={s.overallCard}>
            <div style={{ ...s.overallIcon, background: '#DBEAFE' }}><TrendingUp size={18} color="#3B82F6" /></div>
            <div>
              <div style={s.overallLbl}>Revenue</div>
              <div style={s.overallVal}>{fmt(data.overall?.revenue)}</div>
            </div>
          </div>
          <div style={s.overallCard}>
            <div style={{ ...s.overallIcon, background: '#DCFCE7' }}>
              {(data.overall?.profit ?? 0) >= 0
                ? <TrendingUp size={18} color="#22C55E" />
                : <TrendingDown size={18} color="#EF4444" />}
            </div>
            <div>
              <div style={s.overallLbl}>Profit</div>
              <div style={{ ...s.overallVal, color: (data.overall?.profit ?? 0) >= 0 ? '#22C55E' : '#EF4444' }}>
                {fmt(data.overall?.profit)}
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Loading…</div>
        ) : data.days.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 40 }}>📦</div>
            <div style={s.emptyTxt}>ఈ range లో stock movements ఏమీ లేవు</div>
          </div>
        ) : (
          data.days.map((day) => {
            const isOpen = openDay === day.date;
            return (
              <div key={day.date} style={s.dayCard}>
                <button style={s.dayHead} onClick={() => setOpenDay(isOpen ? null : day.date)}>
                  <div>
                    <div style={s.dayDate}>{day.date}</div>
                    <div style={s.daySummary}>
                      {day.products.length} product{day.products.length !== 1 ? 's' : ''} •
                      {' '}Profit: <span style={{ color: day.totals.profit >= 0 ? '#22C55E' : '#EF4444', fontWeight: 800 }}>
                        {fmt(day.totals.profit)}
                      </span>
                    </div>
                  </div>
                  {isOpen ? <ChevronUp size={18} color="#9CA3AF" /> : <ChevronDown size={18} color="#9CA3AF" />}
                </button>

                {isOpen && (
                  <div style={s.dayBody}>
                    <div style={s.tableWrap}>
                      <table style={s.table}>
                        <thead>
                          <tr>
                            <th style={s.th}>Product</th>
                            <th style={s.th}>Price</th>
                            <th style={s.th}>Sold</th>
                            <th style={s.th}>Restocked</th>
                            <th style={s.th}>Investment</th>
                            <th style={s.th}>Revenue</th>
                            <th style={s.th}>Profit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {day.products.map((p) => (
                            <tr key={p.product_id}>
                              <td style={s.td}><b>{p.name}</b></td>
                              <td style={s.td}>₹{p.price}</td>
                              <td style={s.td}>{p.sold_qty}</td>
                              <td style={s.td}>{p.restocked_qty}</td>
                              <td style={s.td}>{fmt(p.investment)}</td>
                              <td style={s.td}>{fmt(p.revenue)}</td>
                              <td style={{ ...s.td, color: p.profit >= 0 ? '#22C55E' : '#EF4444', fontWeight: 700 }}>
                                {fmt(p.profit)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td style={s.tfoot} colSpan={4}>Day Total</td>
                            <td style={s.tfoot}>{fmt(day.totals.investment)}</td>
                            <td style={s.tfoot}>{fmt(day.totals.revenue)}</td>
                            <td style={{ ...s.tfoot, color: day.totals.profit >= 0 ? '#22C55E' : '#EF4444' }}>
                              {fmt(day.totals.profit)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const s = {
  header: { background: '#8B5CF6', padding: '16px 16px', display: 'flex', alignItems: 'center', gap: 12 },
  backBtn: { width: 38, height: 38, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  headerTitle: { fontSize: 17, fontWeight: 900, color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.8)' },

  rangeRow: { display: 'flex', gap: 8, marginBottom: 16 },
  rangeBtn: { flex: 1, padding: '10px 0', borderRadius: 10, background: '#fff', border: '1px solid #E5E7EB', fontSize: 13, fontWeight: 700, color: '#6B7280', cursor: 'pointer' },
  rangeBtnActive: { background: '#8B5CF6', borderColor: '#8B5CF6', color: '#fff' },

  overallGrid: { display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' },
  overallCard: { flex: '1 1 150px', display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 14, padding: 14, boxShadow: '0 2px 6px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' },
  overallIcon: { width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  overallLbl: { fontSize: 10, color: '#6B7280', fontWeight: 700, textTransform: 'uppercase' },
  overallVal: { fontSize: 16, fontWeight: 800, color: '#111', marginTop: 2 },

  dayCard: { background: '#fff', borderRadius: 14, marginBottom: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6', overflow: 'hidden' },
  dayHead: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 14, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' },
  dayDate: { fontSize: 14, fontWeight: 800, color: '#111' },
  daySummary: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  dayBody: { padding: '0 14px 14px' },

  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12, whiteSpace: 'nowrap' },
  th: { textAlign: 'left', padding: '8px 10px', color: '#6B7280', fontWeight: 700, borderBottom: '1px solid #E5E7EB', fontSize: 11, textTransform: 'uppercase' },
  td: { padding: '8px 10px', color: '#111', borderBottom: '1px solid #F3F4F6' },
  tfoot: { padding: '10px', fontWeight: 800, color: '#111', borderTop: '2px solid #E5E7EB' },

  empty: { textAlign: 'center', padding: 40, background: '#fff', borderRadius: 14 },
  emptyTxt: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
};
