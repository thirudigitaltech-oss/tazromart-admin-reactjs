import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard, ShoppingBag, Apple, Users, Tag,
  UsersRound, LogOut, MapPin, Search, Bell, Menu, ChevronRight,
} from 'lucide-react';
import { useAdminNavigation } from '../../utils/navigation';
import { getSocket } from '../../utils/socket';

const NAV_ITEMS = [
  { screen: 'AdminDashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { screen: 'AdminOrders', icon: ShoppingBag, label: 'Orders' },
  { screen: 'AdminProducts', icon: Apple, label: 'Products' },
  { screen: 'AdminWorkers', icon: Users, label: 'Workers' },
  { screen: 'AdminZones', icon: MapPin, label: 'Zones' },
  { screen: 'AdminOffers', icon: Tag, label: 'Offers' },
  { screen: 'AdminCRM', icon: UsersRound, label: 'CRM' },
];

export default function AdminLayout({ children, activeScreen, title }) {
  const navigation = useAdminNavigation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Keep new-order socket notifications unchanged.
  useEffect(() => {
    let socket;
    const orderHandler = (data) => {
      const open = window.confirm(`🛒 New Order!\nCustomer: ${data.user}\nTotal: ₹${data.total}\n\nView Orders?`);
      if (open) navigation.navigate('AdminOrders');
    };
    try {
      socket = getSocket();
      if (socket) {
        socket.on('new_order_alert', orderHandler);
      }
    } catch (e) { console.log('Socket setup error:', e); }
    return () => {
      if (socket) {
        socket.off('new_order_alert', orderHandler);
      }
    };
  }, [navigation]);

  const logout = () => {
    localStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_token');
    navigation.replace('AdminLogin');
  };

  const pageTitle = NAV_ITEMS.find(n => n.screen === activeScreen)?.label || title || 'Dashboard';
  const go = (screen) => { navigation.navigate(screen); setMenuOpen(false); };
  const nav = NAV_ITEMS.map(item => {
    const Icon = item.icon;
    const active = activeScreen === item.screen;
    return <button type="button" key={item.screen} className={`gza-navlink ${active ? 'gza-selected' : ''}`} onClick={() => go(item.screen)} aria-current={active ? 'page' : undefined}>
      <Icon size={18} strokeWidth={active ? 2.3 : 1.9} /><span>{item.label}</span>{active && <ChevronRight size={15} className="gza-chevron" />}
    </button>;
  });

  return <div className="gza-shell">
    <style>{`
      @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");
      .gza-shell {--gza-green:#6D28D9;--gza-text:#231536;--gza-muted:#81758D;--gza-border:#E9E3F2;display:flex;min-height:100vh;background:#F7F6FC;color:var(--gza-text);font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
      .gza-shell *{box-sizing:border-box}.gza-sidebar{width:248px;flex-shrink:0;background:#fff;border-right:1px solid var(--gza-border);min-height:100vh;display:flex;flex-direction:column;position:sticky;top:0;height:100vh}
      .gza-brand{height:88px;padding:22px 20px;display:flex;align-items:center;gap:11px;border-bottom:1px solid #F1EDF6}
      .gza-logo{width:44px;height:44px;border-radius:13px;background:#6D28D9;color:#fff;display:grid;place-items:center;box-shadow:0 6px 15px #6D28D925;flex-shrink:0}
      .gza-brandname{font-weight:850;font-size:17px;letter-spacing:-.5px}.gza-brandsub{font-size:10px;color:#91869B;margin-top:3px;letter-spacing:.7px;text-transform:uppercase;font-weight:650}
      .gza-nav{display:flex;flex-direction:column;gap:5px;padding:27px 13px;overflow:auto;flex:1}.gza-navcap{font-size:10px;letter-spacing:1.3px;text-transform:uppercase;font-weight:800;color:#AA9FBA;margin:0 13px 14px}
      .gza-navlink{width:100%;display:flex;align-items:center;gap:13px;padding:12px 14px;border:0;border-radius:10px;background:transparent;color:#687A70;cursor:pointer;text-align:left;font-size:13px;font-weight:650;font-family:inherit;min-height:44px;transition:background .17s,color .17s}
      .gza-navlink:hover{background:#F8F4FF;color:#6D28D9}.gza-navlink.gza-selected{background:#F3EAFF;color:#6D28D9;font-weight:800}.gza-chevron{margin-left:auto}
      .gza-foot{border-top:1px solid var(--gza-border);padding:18px 20px;display:flex;gap:11px;align-items:center}.gza-avatar{width:38px;height:38px;border-radius:11px;background:#F3EAFF;color:#6D28D9;display:grid;place-items:center;font-size:15px;font-weight:800}.gza-footname{font-size:12px;font-weight:800}.gza-footrole{font-size:11px;color:#91869B;margin-top:3px}
      .gza-main{flex:1;min-width:0}.gza-topbar{height:76px;padding:0 32px;display:flex;align-items:center;justify-content:space-between;gap:20px;background:#fff;border-bottom:1px solid var(--gza-border);position:sticky;top:0;z-index:20}
      .gza-titlerow{display:flex;align-items:center;gap:12px}.gza-pagetitle{font-size:17px;font-weight:800;letter-spacing:-.35px}.gza-search{width:min(350px,34vw);border:1px solid var(--gza-border);border-radius:11px;display:flex;align-items:center;gap:9px;background:#F9F7FC;padding:11px 12px;color:#8B9991}.gza-search input{border:0;outline:0;background:transparent;width:100%;font-size:12px;color:#62556E;cursor:pointer}
      .gza-topactions{display:flex;align-items:center;gap:11px}.gza-iconbtn{width:38px;height:38px;border:1px solid var(--gza-border);border-radius:10px;background:#fff;display:grid;place-items:center;color:#64796B;cursor:default}.gza-logout{display:flex;align-items:center;gap:7px;background:#fff;border:1px solid #F1D9D8;border-radius:10px;padding:10px 12px;color:#BC4C4C;font-size:12px;font-weight:800;cursor:pointer}
      .gza-content{padding:30px 32px 55px;min-height:calc(100vh - 76px)}.gza-menubtn,.gza-shade,.gza-mobilebrand{display:none}
      @media(max-width:1000px){.gza-sidebar{width:208px}.gza-topbar{padding:0 20px}.gza-content{padding:24px 20px 50px}.gza-search{display:none}}
      /* Purple Studio — visual system only. Existing navigation and sockets unchanged. */
      .gza-shell{--gza-green:#6D28D9;--gza-text:#231536;--gza-muted:#84778F;--gza-border:#EAE4F2;font-family:'Plus Jakarta Sans',Inter,system-ui,sans-serif;background:#F7F6FC}
      .gza-sidebar{width:264px;border-color:#ECE6F3;box-shadow:4px 0 22px rgba(45,20,76,.025)}
      .gza-brand{height:96px;padding:24px 22px}
      .gza-logo{background:linear-gradient(145deg,#8B5CF6,#5B21B6);box-shadow:0 8px 20px rgba(109,40,217,.22);border-radius:15px}
      .gza-brandname{font-size:19px;font-weight:800;color:#28183C;letter-spacing:-.7px}
      .gza-nav{gap:7px;padding:30px 15px}.gza-navcap{color:#A398AF}
      .gza-navlink{min-height:47px;font-size:13px;font-weight:700;border-radius:12px;color:#766B84}
      .gza-navlink:hover{background:#F6F1FF;color:#6D28D9}.gza-navlink.gza-selected{background:#F0E8FF;color:#6421C5;box-shadow:inset 3px 0 0 #7735E5}
      .gza-topbar{height:84px;padding:0 36px}.gza-pagetitle{font-size:19px;font-weight:800;color:#241335}
      .gza-search{background:#FAF8FE;border-color:#EDE6F4;max-width:370px}.gza-search input{font-family:inherit}
      .gza-iconbtn{color:#7B6692;border-color:#E9E2F0}.gza-logout{font-family:inherit}
      .gza-content{padding:32px 36px 60px}.gza-avatar{background:#EFE6FF;color:#6523C8}
      @media(max-width:1000px){.gza-sidebar{width:218px}.gza-content{padding:24px 22px 48px}.gza-topbar{padding:0 22px}}
      @media(max-width:740px){.gza-sidebar{width:min(300px,88vw)}.gza-topbar{height:68px;padding:0 16px}.gza-content{padding:17px 13px 42px}.gza-pagetitle{font-size:16px}}
      @media(max-width:740px){.gza-sidebar{position:fixed;left:0;top:0;bottom:0;width:min(290px,85vw);height:100dvh;z-index:55;transform:translateX(-105%);transition:transform .25s}.gza-sidebar.gza-open{transform:translateX(0)}.gza-shade.gza-show{display:block;position:fixed;inset:0;background:#091A13A3;z-index:50}.gza-menubtn{display:grid;place-items:center;background:#fff;border:1px solid var(--gza-border);border-radius:10px;width:39px;height:39px;color:#6D28D9;cursor:pointer}.gza-topbar{height:66px;padding:0 15px}.gza-pagetitle{font-size:15px}.gza-content{padding:20px 14px 45px;min-height:calc(100vh - 66px)}.gza-logout{padding:9px}.gza-logout span{display:none}.gza-iconbtn{display:none}}
    `}</style>
    <div className={`gza-shade ${menuOpen ? 'gza-show' : ''}`} onClick={() => setMenuOpen(false)} />
    <aside className={`gza-sidebar ${menuOpen ? 'gza-open' : ''}`}>
      <div className="gza-brand"><div className="gza-logo"><Apple size={24} strokeWidth={2.2}/></div><div><div className="gza-brandname">Tazro</div><div className="gza-brandsub">Management Console</div></div></div>
      <nav className="gza-nav" aria-label="Admin navigation"><div className="gza-navcap">Workspace</div>{nav}</nav>
      <div className="gza-foot"><div className="gza-avatar">A</div><div><div className="gza-footname">Super Admin</div><div className="gza-footrole">Administrator</div></div></div>
    </aside>
    <div className="gza-main">
      <header className="gza-topbar">
        <div className="gza-titlerow"><button type="button" className="gza-menubtn" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={21}/></button><span className="gza-pagetitle">{pageTitle}</span></div>
        <div className="gza-search"><Search size={16}/><input placeholder="Find orders and customers…" aria-label="Go to orders" readOnly onClick={() => go('AdminOrders')}/></div>
        <div className="gza-topactions"><span className="gza-iconbtn" aria-label="Notifications"><Bell size={18}/></span><button type="button" className="gza-logout" onClick={logout}><LogOut size={16}/><span>Logout</span></button></div>
      </header>
      <main className="gza-content">{children}</main>
    </div>
  </div>;
}
