import React, { useEffect, useState, useCallback } from 'react';
import { User, Wrench, CalendarClock } from 'lucide-react';
import AdminLayout from './AdminLayout';
import WhatsAppIcon from '../../components/WhatsAppIcon';
import { adminApi } from '../../utils/api';
import { useAdminNavigation } from '../../utils/navigation';

const STATUS_COLOR = {
  Pending:   '#fd9644',
  Confirmed: '#3498db',
  Assigned:  '#3498db',
  Ongoing:   '#a55eea',
  Completed: '#20bf6b',
  Cancelled: '#ef4444',
};

export default function AdminBookingsScreen() {
  const navigation = useAdminNavigation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await adminApi.get('/bookings');
      setBookings(r.data || []);
    } catch {
      navigation.replace('AdminLogin');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { load(); }, [load]);

  const sendWhatsAppMessage = (b) => {
    if (!b?.user?.phone) { window.alert('User phone number not available!'); return; }
    const message = `Hello ${b.user.name || 'Sir/Madam'},

✅ *Your Booking is Confirmed!*

*Booking ID:* #${b.id}
*Service:* ${b.service?.title || 'N/A'}
*Date:* ${b.date || '---'}
*Time:* ${b.time || '---'}
*Status:* ${b.status}

Thank you for choosing us! Our team will reach you soon.`;

    const phone = b.user.phone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const stats = [
    { label: 'Total', value: bookings.length, color: '#6366f1' },
    { label: 'Pending', value: bookings.filter((b) => b.status === 'Pending').length, color: '#fd9644' },
    { label: 'Ongoing', value: bookings.filter((b) => b.status === 'Ongoing' || b.status === 'Assigned').length, color: '#a55eea' },
    { label: 'Completed', value: bookings.filter((b) => b.status === 'Completed').length, color: '#20bf6b' },
  ];

  return (
    <AdminLayout activeScreen="AdminBookings">
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>Loading…</div>
      ) : (
        <div style={{ padding: 16, paddingBottom: 40 }}>
          <div style={s.pageHeader}>
            <div style={s.pageTitle}>📅 All Bookings</div>
            <div style={s.livePill}>
              <div style={s.liveDot} />
              <span style={s.liveTxt}>LIVE</span>
            </div>
          </div>

          <div style={s.statsGrid}>
            {stats.map((st) => (
              <div key={st.label} style={{ ...s.statCard, borderLeftColor: st.color }}>
                <div style={s.statVal}>{st.value}</div>
                <div style={s.statLbl}>{st.label}</div>
              </div>
            ))}
          </div>

          {bookings.length === 0 ? (
            <div style={s.empty}>
              <div style={{ fontSize: 40 }}>📭</div>
              <div style={s.emptyTxt}>No bookings yet</div>
            </div>
          ) : bookings.map((b) => (
            <div key={b.id} style={s.card}>
              <div style={s.cardHeader}>
                <div style={s.idBadge}><span style={s.idTxt}>#{b.id}</span></div>
                <div style={{ ...s.statusPill, background: STATUS_COLOR[b.status] || '#94a3b8' }}>
                  <span style={s.statusTxt}>{b.status}</span>
                </div>
              </div>

              <div style={s.row}>
                <Wrench size={14} color="#6B7280" />
                <span style={s.val}>{b.service?.title || 'N/A'}</span>
                {b.service?.price != null && <span style={s.phone}>₹{b.service.price}</span>}
              </div>

              <div style={s.row}>
                <CalendarClock size={14} color="#6B7280" />
                <span style={s.val}>{b.date || '—'} {b.time ? `• ${b.time}` : ''}</span>
              </div>

              <div style={s.row}>
                <User size={14} color="#6B7280" />
                <span style={s.val}>{b.user?.name || 'Unknown'}</span>
                <span style={s.phone}>{b.user?.phone}</span>
              </div>

              <div style={s.row}>
                <User size={14} color="#6B7280" />
                {b.worker
                  ? <span style={{ ...s.val, color: '#6366f1' }}>🛵 {b.worker?.name}</span>
                  : <span style={{ ...s.val, color: '#9CA3AF', fontStyle: 'italic' }}>Not assigned</span>}
              </div>

              <button style={s.whatsappButton} onClick={() => sendWhatsAppMessage(b)}>
                <WhatsAppIcon size={20} />
                <span style={s.whatsappButtonText}>Send WhatsApp Message</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

const s = {
  pageHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  pageTitle: { fontSize: 18, fontWeight: 800, color: '#111' },
  livePill: { display: 'flex', alignItems: 'center', gap: 5, background: '#ECFDF5', borderRadius: 99, padding: '4px 10px' },
  liveDot: { width: 7, height: 7, borderRadius: 99, background: '#10b981' },
  liveTxt: { fontSize: 10, fontWeight: 700, color: '#10b981' },
  statsGrid: { display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { width: 'calc(47% - 5px)', background: '#fff', borderRadius: 12, padding: 14, borderLeft: '4px solid', boxShadow: '0 2px 6px rgba(0,0,0,0.05)', boxSizing: 'border-box' },
  statVal: { fontSize: 24, fontWeight: 900, color: '#111' },
  statLbl: { fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginTop: 2 },
  card: { background: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, justifyContent: 'space-between' },
  idBadge: { background: '#F1F5F9', borderRadius: 7, padding: '4px 9px' },
  idTxt: { fontSize: 12, fontWeight: 800, color: '#334155' },
  statusPill: { borderRadius: 99, padding: '4px 10px' },
  statusTxt: { fontSize: 10, fontWeight: 800, color: '#fff', textTransform: 'uppercase' },
  row: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  val: { fontSize: 13, fontWeight: 600, color: '#111' },
  phone: { fontSize: 12, color: '#64748B', marginLeft: 4 },
  whatsappButton: { background: '#25D366', border: 'none', marginTop: 12, padding: '12px 0', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', cursor: 'pointer' },
  whatsappButtonText: { color: '#fff', fontSize: 15, fontWeight: 700 },
  empty: { textAlign: 'center', padding: 40, background: '#fff', borderRadius: 14 },
  emptyTxt: { fontSize: 15, color: '#9CA3AF', marginTop: 8 },
};
