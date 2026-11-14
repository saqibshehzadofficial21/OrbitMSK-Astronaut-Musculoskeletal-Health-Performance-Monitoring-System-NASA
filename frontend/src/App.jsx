import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  Activity, AlertTriangle, Bell, ChevronDown, ChevronLeft, ChevronRight, Command,
  Database, FileBarChart2, LayoutDashboard, Menu, Orbit, Search, Settings, Shield, Sparkles,
  Users, Dumbbell, X, Gauge, Moon, Sun
} from 'lucide-react';
import Dashboard from './pages/Dashboard.jsx';
import { AstronautsPage, AstronautDetailPage, BaselinesPage, ExercisesPage, PerformancePage, SensorsPage, InsightsPage, AlertsPage, ReportsPage, SettingsPage } from './pages/WorkspacePages.jsx';
import { GlobalFiltersProvider, useGlobalFilters } from './context/GlobalFiltersContext.jsx';
import { resourceApi } from './services/api.js';
import Toast from './components/Toast.jsx';
import { ThemeProvider, useTheme } from './context/ThemeContext.jsx';

const navigation = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { section: 'MISSION DATA' },
  { label: 'Astronauts', path: '/astronauts', icon: Users },
  { label: 'Baseline assessments', path: '/baselines', icon: Gauge },
  { label: 'Exercise countermeasures', path: '/exercises', icon: Dumbbell },
  { label: 'Muscle performance', path: '/performance', icon: Activity },
  { label: 'Sensor data', path: '/sensors', icon: Database },
  { section: 'INTELLIGENCE' },
  { label: 'Adaptive insights', path: '/insights', icon: Sparkles },
  { label: 'Alerts', path: '/alerts', icon: AlertTriangle, alert: true },
  { label: 'Reports & history', path: '/reports', icon: FileBarChart2 },
  { section: 'WORKSPACE' },
  { label: 'Settings', path: '/settings', icon: Settings }
];

function Topbar({ onMenu }) {
  const global = useGlobalFilters();
  const { theme, toggleTheme } = useTheme();
  const [astronauts, setAstronauts] = useState([]);
  const [alerts, setAlerts] = useState(0);
  const [search, setSearch] = useState('');
  useEffect(() => {
    resourceApi.list('astronauts').then((r) => setAstronauts(r.data || [])).catch(() => {});
    resourceApi.list('alerts', { status: 'open' }).then((r) => setAlerts((r.data || []).length)).catch(() => {});
  }, []);
  return <header className="topbar">
    <button className="mobile-menu icon-button" type="button" onClick={onMenu} aria-label="Open navigation" title="Open navigation"><Menu size={19}/></button>
    <div className="topbar-breadcrumb"><span>WORKSPACE</span><ChevronRight size={14}/><strong>Mission health</strong></div>
    <div className="topbar-spacer"/>
    <div className="topbar-search"><Search size={16}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search workspace" onKeyDown={(e) => { if (e.key === 'Enter' && search.trim()) window.location.href = `/astronauts?search=${encodeURIComponent(search)}`; }}/><kbd>⌘ K</kbd></div>
    <div className="topbar-divider"/>
    <label className="top-filter"><span>ASTRONAUT</span><select value={global.astronautId} onChange={(e) => global.setAstronautId(e.target.value)}><option value="">All</option>{astronauts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label>
    <label className="top-filter phase-top"><span>MISSION PHASE</span><select value={global.missionPhase} onChange={(e) => global.setMissionPhase(e.target.value)}><option value="">All phases</option><option value="preflight">Preflight</option><option value="in-flight">In-flight</option><option value="postflight">Postflight</option></select></label>
    <button className="theme-toggle" type="button" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'light'} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}><span className="theme-toggle-icon">{theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}</span><span className="theme-toggle-label">{theme === 'dark' ? 'Light' : 'Dark'}</span></button>
    <button className="icon-button notification-button" title={`${alerts} open alerts`} onClick={() => window.location.href = '/alerts'}><Bell size={18}/>{alerts > 0 && <i>{alerts}</i>}</button>
    <div className="topbar-user"><div className="user-avatar">DA</div><div><strong>Demo Admin</strong><span>Administrator</span></div><ChevronDown size={14}/></div>
  </header>;
}

function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) {
  return <>
    {mobileOpen && <button className="mobile-overlay" onClick={() => setMobileOpen(false)} aria-label="Close navigation"/>}
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
      <div className="brand-row"><div className="brand-mark"><Orbit size={21}/><span/></div>{!collapsed && <div className="brand-copy"><strong>ORBIT<span>MSK</span></strong><small>MISSION HEALTH SYSTEM</small></div>}<button className="sidebar-collapse icon-button" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>{collapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}</button><button className="sidebar-close icon-button" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation" title="Close navigation"><X size={18}/></button></div>
      <div className="mission-chip"><span className="mission-chip-icon"><Command size={15}/></span>{!collapsed && <span>MISSION CONTROL <i>LOCAL</i></span>}</div>
      <nav className="sidebar-nav">{navigation.map((item, i) => item.section ? <div className="nav-section" key={item.section}>{!collapsed ? item.section : <span/>}</div> : <NavLink key={item.path} to={item.path} end={item.path === '/'} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`} title={collapsed ? item.label : undefined} onClick={() => setMobileOpen(false)}><item.icon size={18}/>{!collapsed && <span>{item.label}</span>}{!collapsed && item.alert && <em>•</em>}</NavLink>)}</nav>
      {!collapsed && <div className="sidebar-bottom"><div className="connection-card"><div className="connection-heading"><span className="pulse-dot"/> API CONNECTION</div><strong>Local environment</strong><small>JSON storage · Prototype</small></div><div className="sidebar-footer"><Shield size={14}/> Not an official NASA product</div></div>}
    </aside>
  </>;
}

function RouteTitle() {
  const location = useLocation();
  const map = { '/': 'Overview', '/astronauts': 'Astronauts', '/baselines': 'Baseline assessments', '/exercises': 'Exercise countermeasures', '/performance': 'Muscle performance', '/sensors': 'Sensor data', '/insights': 'Adaptive insights', '/alerts': 'Alerts', '/reports': 'Reports & history', '/settings': 'Settings' };
  if (location.pathname.startsWith('/astronauts/')) return 'Astronaut profile';
  return map[location.pathname] || 'Mission workspace';
}

function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const location = useLocation();
  useEffect(() => { document.title = `${RouteTitleName(location.pathname)} · OrbitMSK`; }, [location.pathname]);
  return <div className="app-shell">
    <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/>
    <div className={`main-shell ${collapsed ? 'main-expanded' : ''}`}>
      <Topbar onMenu={() => setMobileOpen(true)}/>
      <main className="main-content"><Routes>
        <Route path="/" element={<Dashboard/>}/>
        <Route path="/astronauts" element={<AstronautsPage/>}/>
        <Route path="/astronauts/:id" element={<AstronautDetailPage/>}/>
        <Route path="/baselines" element={<BaselinesPage/>}/>
        <Route path="/exercises" element={<ExercisesPage/>}/>
        <Route path="/performance" element={<PerformancePage/>}/>
        <Route path="/sensors" element={<SensorsPage/>}/>
        <Route path="/insights" element={<InsightsPage/>}/>
        <Route path="/alerts" element={<AlertsPage/>}/>
        <Route path="/reports" element={<ReportsPage/>}/>
        <Route path="/settings" element={<SettingsPage/>}/>
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes></main>
      <footer className="app-footer"><span>ORBITMSK <i>v1.0.0</i></span><span>ASTRONAUT MUSCULOSKELETAL MONITORING PROTOTYPE</span><span>LOCAL JSON DATA STORE</span></footer>
    </div>
    <Toast toast={toast} onClose={() => setToast(null)}/>
  </div>;
}
function RouteTitleName(path) { if (path === '/') return 'Overview'; if (path.startsWith('/astronauts/')) return 'Astronaut profile'; const label = navigation.find((item) => item.path === path)?.label; return label || 'Mission workspace'; }

export default function App() { return <ThemeProvider><GlobalFiltersProvider><AppShell/></GlobalFiltersProvider></ThemeProvider>; }
