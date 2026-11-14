import { useEffect, useState } from 'react';
import { Activity, Users, ClipboardCheck, AlertTriangle, Orbit, RefreshCw, Dumbbell, Sparkles } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { dashboardApi, resourceApi } from '../services/api';
import { dateLabel, numberLabel, phaseLabel } from '../utils/format';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import { useGlobalFilters } from '../context/GlobalFiltersContext';

const shortDate = (date) => date ? new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';

function MetricCard({ label, value, note, icon: Icon, tone = 'blue', suffix }) {
  return <div className="metric-card"><div className={`metric-icon metric-${tone}`}><Icon size={19}/></div><div className="metric-label">{label}</div><div className="metric-value">{value ?? '—'}{suffix && <small>{suffix}</small>}</div><div className="metric-note">{note}</div></div>;
}

function PanelTitle({ title, subtitle, action }) { return <div className="panel-title"><div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>{action}</div>; }

export default function Dashboard() {
  const globalFilters = useGlobalFilters();
  const [summary, setSummary] = useState(null);
  const [exercise, setExercise] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [astronauts, setAstronauts] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const selectedPhase = globalFilters.missionPhase;
  const setSelectedPhase = globalFilters.setMissionPhase;
  const [insights, setInsights] = useState([]);
  const selectedAstronaut = globalFilters.astronautId;
  const setSelectedAstronaut = globalFilters.setAstronautId;
  const [days, setDays] = useState('14');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true); setError('');
    try {
      const [s, e, p, a, al, i] = await Promise.all([
        dashboardApi.summary({ astronautId: selectedAstronaut || undefined, missionPhase: selectedPhase || undefined }), dashboardApi.exerciseTrends({ days, astronautId: selectedAstronaut || undefined, phase: selectedPhase || undefined }),
        dashboardApi.performanceTrends({ astronautId: selectedAstronaut || undefined, missionPhase: selectedPhase || undefined }), resourceApi.list('astronauts'),
        resourceApi.list('alerts', { status: 'open' }), resourceApi.list('insights')
      ]);
      setSummary(s.data); setExercise(e.data || []); setPerformance(p.data || []); setAstronauts(a.data || []); setAlerts((al.data || []).slice(0, 5)); setInsights((i.data || []).slice(0, 4));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [days, selectedAstronaut, selectedPhase]);

  const latest = [...performance].sort((a, b) => new Date(b.date) - new Date(a.date));
  const force = latest.map((x) => ({ date: shortDate(x.date), force: x.forceProduction, velocity: x.movementVelocity }));
  const totalCompleted = summary?.completedSessions ?? 0;
  if (loading && !summary) return <><PageHeader title="Mission overview" description="A unified view of exercise countermeasures and musculoskeletal performance."/><LoadingState/></>;

  return <>
    <PageHeader eyebrow="MISSION CONTROL / OVERVIEW" title="Mission overview" description="Monitor exercise countermeasures, performance trends and changes from individual baselines." actions={<button className="button button-quiet" onClick={load}><RefreshCw size={16}/> Refresh data</button>}/>
    <div className="dashboard-toolbar"><div className="live-indicator"><span className="pulse-dot"/> LOCAL PROTOTYPE <span className="toolbar-divider"/> <span className="source-caption">Fictional demonstration data</span></div><div className="filter-inline"><label>ASTRONAUT<select value={selectedAstronaut} onChange={(e) => setSelectedAstronaut(e.target.value)}><option value="">All astronauts</option>{astronauts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label><label>PHASE<select value={selectedPhase} onChange={(e) => setSelectedPhase(e.target.value)}><option value="">All phases</option><option value="preflight">Preflight</option><option value="in-flight">In-flight</option><option value="postflight">Postflight</option></select></label><label>WINDOW<select value={days} onChange={(e) => setDays(e.target.value)}><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option><option value="60">60 days</option></select></label></div></div>
    {error && <div className="inline-error">{error}</div>}
    <div className="metric-grid">
      <MetricCard label="Total astronauts" value={summary?.totalAstronauts ?? 0} note="Profiles in this workspace" icon={Users}/>
      <MetricCard label="Active missions" value={summary?.activeMissions ?? 0} note="Mission records marked active" icon={Orbit} tone="cyan"/>
      <MetricCard label="Sessions completed" value={totalCompleted} note={`${summary?.prescribedSessions ?? 0} prescribed records`} icon={Dumbbell} tone="purple"/>
      <MetricCard label="Exercise adherence" value={summary?.adherence ?? '—'} suffix={summary?.adherence == null ? '' : '%'} note="Completed / prescribed sessions" icon={ClipboardCheck} tone="green"/>
      <MetricCard label="Performance changes" value={summary?.performanceChanges ?? 0} note="Attention-level rule results" icon={Activity} tone="amber"/>
      <MetricCard label="Alerts to review" value={summary?.alertsRequiringReview ?? 0} note="Unresolved alert records" icon={AlertTriangle} tone="red"/>
    </div>
    <div className="dashboard-grid dashboard-grid-main">
      <section className="panel chart-panel"><PanelTitle title="Exercise adherence activity" subtitle="Completed and missed records by day" action={<span className="chart-legend"><i className="legend-blue"/> Completed <i className="legend-red"/> Missed</span>}/>
        {exercise.length ? <ResponsiveContainer width="100%" height={260}><AreaChart data={exercise} margin={{ top: 10, right: 6, left: -18, bottom: 0 }}><defs><linearGradient id="completedFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4c8dff" stopOpacity={0.32}/><stop offset="100%" stopColor="#4c8dff" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#22314a" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="date" tickFormatter={shortDate} tick={{ fill: '#8290a8', fontSize: 11 }} axisLine={false} tickLine={false}/><YAxis allowDecimals={false} tick={{ fill: '#8290a8', fontSize: 11 }} axisLine={false} tickLine={false}/><Tooltip contentStyle={{ background: '#101a2d', border: '1px solid #293956', borderRadius: 10, color: '#e7edf9' }}/><Area type="monotone" dataKey="completed" stroke="#5b9bff" strokeWidth={2.5} fill="url(#completedFill)"/><Area type="monotone" dataKey="missed" stroke="#ff747c" strokeWidth={2} fill="transparent"/></AreaChart></ResponsiveContainer> : <div className="chart-empty">No exercise records in this date window.</div>}
      </section>
      <section className="panel chart-panel"><PanelTitle title="Force production trend" subtitle="Selected astronaut's recorded assessments" action={<span className="unit-tag">NEWTONS · N</span>}/>
        {force.length ? <ResponsiveContainer width="100%" height={260}><LineChart data={force} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}><CartesianGrid stroke="#22314a" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="date" tick={{ fill: '#8290a8', fontSize: 11 }} axisLine={false} tickLine={false}/><YAxis tick={{ fill: '#8290a8', fontSize: 11 }} axisLine={false} tickLine={false}/><Tooltip contentStyle={{ background: '#101a2d', border: '1px solid #293956', borderRadius: 10, color: '#e7edf9' }}/><Line type="monotone" dataKey="force" name="Force (N)" stroke="#55d6e8" strokeWidth={2.5} dot={{ r: 3, fill: '#55d6e8' }}/></LineChart></ResponsiveContainer> : <div className="chart-empty">No performance records available.</div>}
      </section>
    </div>
    <div className="dashboard-grid dashboard-grid-bottom">
      <section className="panel"><PanelTitle title="Astronaut roster" subtitle="Current profiles and mission phases"/><div className="compact-list">{astronauts.slice(0, 5).map((a) => <div className="roster-row" key={a.id}><div className="avatar">{a.name.split(' ').map((x) => x[0]).join('').slice(0, 2)}</div><div className="roster-main"><strong>{a.name}</strong><span>{a.mission || a.missionId || a.id}</span></div><div className="roster-state"><span>{phaseLabel(a.missionPhase)}</span><StatusBadge value={a.status}/></div></div>)}</div></section>
      <section className="panel"><PanelTitle title="Latest adaptive insights" subtitle="Rule-based baseline comparisons"/><div className="compact-list">{insights.length ? insights.map((item) => <div className="insight-row" key={item.id}><div className={`insight-mark ${item.severity === 'attention' ? 'mark-amber' : 'mark-cyan'}`}><Sparkles size={16}/></div><div className="insight-main"><strong>{item.metric}</strong><span>{item.astronautName || item.astronautId} · {item.explanation}</span></div><span className="insight-change">{item.percentageChange == null ? '—' : `${numberLabel(item.percentageChange)}%`}</span></div>) : <div className="empty-inline">No insights generated yet.</div>}</div></section>
      <section className="panel"><PanelTitle title="Alerts requiring review" subtitle="Latest open alert records"/><div className="compact-list">{alerts.length ? alerts.map((item) => <div className="alert-row" key={item.id}><div className={`alert-icon alert-${item.severity}`}><AlertTriangle size={16}/></div><div className="alert-main"><strong>{item.category}</strong><span>{item.astronautName || item.astronautId} · {item.metric || 'Review requested'}</span></div><div className="alert-meta"><StatusBadge value={item.status}/><small>{dateLabel(item.createdAt)}</small></div></div>) : <div className="empty-inline">No open alerts.</div>}</div></section>
    </div>
    <div className="disclaimer-line"><InfoIcon/> This prototype uses fictional demonstration records. It is not an official NASA system and does not provide medical diagnosis.</div>
  </>;
}
function InfoIcon() { return <span className="info-dot">i</span>; }
