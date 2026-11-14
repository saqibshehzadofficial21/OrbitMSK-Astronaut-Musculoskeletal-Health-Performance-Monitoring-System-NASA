import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Activity, Check, CircleCheck, Download, FileBarChart2, Play, Printer, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { resourceApi, dashboardApi, downloadCsv } from '../services/api';
import { dateLabel, numberLabel, phaseLabel, titleCase } from '../utils/format';
import PageHeader from '../components/PageHeader';
import CollectionPage from '../components/CollectionPage';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import { useGlobalFilters } from '../context/GlobalFiltersContext';

const today = new Date().toISOString().slice(0, 10);
const astronautSelect = { name: 'astronautId', label: 'Astronaut', type: 'select', required: true, options: [] };
const phaseSelect = { name: 'missionPhase', label: 'Mission phase', type: 'select', options: [{ value: 'preflight', label: 'Preflight' }, { value: 'in-flight', label: 'In-flight' }, { value: 'postflight', label: 'Postflight' }] };
const categoryOptions = ['Resistance training', 'Treadmill', 'Cycle ergometer', 'Functional exercise'].map((x) => ({ value: x, label: x }));
const equipmentOptions = ['ARED', 'Treadmill', 'CEVIS', 'ROCKY'].map((x) => ({ value: x, label: x }));

export function AstronautsPage() {
  const navigate = useNavigate();
  return <CollectionPage resource="astronauts" title="Astronauts" description="Manage fictional astronaut profiles, mission assignments and individual monitoring records." fields={[
    { name: 'name', label: 'Full name', required: true }, { name: 'mission', label: 'Mission name' }, { name: 'missionId', label: 'Mission ID' }, { name: 'role', label: 'Mission role' }, { name: 'missionStartDate', label: 'Mission start date', type: 'date' }, { name: 'missionEndDate', label: 'Mission end date', type: 'date' },
    phaseSelect, { name: 'status', label: 'Profile status', type: 'select', options: ['active', 'training', 'inactive'].map((x) => ({ value: x, label: titleCase(x) })) },
    { name: 'email', label: 'Demo email', type: 'email' }, { name: 'notes', label: 'Notes', type: 'textarea', full: true }
  ]} defaultValues={{ missionPhase: 'preflight', status: 'active' }} columns={[
    { key: 'id', label: 'Astronaut ID' }, { key: 'name', label: 'Astronaut' }, { key: 'mission', label: 'Mission' }, { key: 'missionPhase', label: 'Phase' }, { key: 'status', label: 'Status', badge: true }, { key: 'dataSource', label: 'Source' }
  ]} onView={(record) => navigate(`/astronauts/${record.id}`)} filters={[{ name: 'missionPhase', label: 'Mission phase', options: [{ value: 'preflight', label: 'Preflight' }, { value: 'in-flight', label: 'In-flight' }, { value: 'postflight', label: 'Postflight' }] }, { name: 'status', label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'training', label: 'Training' }, { value: 'inactive', label: 'Inactive' }] }]}/>
}

export function AstronautDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [astronaut, setAstronaut] = useState(null);
  const [datasets, setDatasets] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      try {
        const [a, b, e, p, s, i, al] = await Promise.all([
          resourceApi.get('astronauts', id), resourceApi.list('baselines', { astronautId: id }), resourceApi.list('exercises', { astronautId: id }),
          resourceApi.list('performance', { astronautId: id }), resourceApi.list('sensors', { astronautId: id }), resourceApi.list('insights', { astronautId: id }), resourceApi.list('alerts', { astronautId: id })
        ]);
        setAstronaut(a.data); setDatasets({ baselines: b.data || [], exercises: e.data || [], performance: p.data || [], sensors: s.data || [], insights: i.data || [], alerts: al.data || [] });
      } catch (e) { setError(e.message); } finally { setLoading(false); }
    })();
  }, [id]);
  if (loading) return <LoadingState/>;
  if (!astronaut) return <div className="empty-state"><h3>Astronaut profile unavailable</h3><p>{error || 'The requested profile could not be found.'}</p><button className="button button-secondary" onClick={() => navigate('/astronauts')}>Back to astronauts</button></div>;
  const metric = datasets.performance[0] || {};
  return <>
    <PageHeader eyebrow="ASTRONAUT PROFILE" title={astronaut.name} description={`${astronaut.id} · ${astronaut.mission || astronaut.missionId || 'Mission not assigned'} · ${phaseLabel(astronaut.missionPhase)}`} actions={<button className="button button-quiet" onClick={() => navigate('/astronauts')}>Back to roster</button>}/>
    <section className="profile-hero panel"><div className="profile-avatar">{astronaut.name.split(' ').map((x) => x[0]).join('').slice(0, 2)}</div><div className="profile-identity"><span className="eyebrow">MISSION PERSONNEL</span><h2>{astronaut.name}</h2><p>{astronaut.role || 'Mission crew'} · {astronaut.email || 'No demo email'}</p><div className="profile-tags"><StatusBadge value={astronaut.status}/><StatusBadge value={astronaut.missionPhase}/><span className="source-chip">{astronaut.dataSource || 'manual'}</span></div></div><div className="profile-highlight"><strong>{datasets.exercises.length}</strong><span>Exercise records</span></div><div className="profile-highlight"><strong>{datasets.alerts.filter((x) => !['resolved', 'reviewed'].includes(x.status)).length}</strong><span>Open alerts</span></div></section>
    <div className="metric-grid metric-grid-four">
      {[['Force production', metric.forceProduction, 'N'], ['Movement velocity', metric.movementVelocity, 'm/s'], ['Joint ROM', metric.jointRom, 'deg'], ['Movement consistency', metric.movementConsistency, '%']].map(([label, value, unit]) => <div className="metric-card compact-metric" key={label}><div className="metric-label">Latest {label}</div><div className="metric-value">{numberLabel(value)}<small>{unit}</small></div><div className="metric-note">Latest available assessment</div></div>)}
    </div>
    <div className="dashboard-grid dashboard-grid-bottom">
      <section className="panel"><div className="panel-title"><div><h3>Baseline assessments</h3><p>Individual reference measurements</p></div><span className="mini-count">{datasets.baselines.length}</span></div>{datasets.baselines.map((x) => <div className="detail-line" key={x.id}><strong>{dateLabel(x.date)}</strong><span>Force {numberLabel(x.forceProduction)} N · ROM {numberLabel(x.jointRom)}°</span><StatusBadge value={x.missionPhase}/></div>)}</section>
      <section className="panel"><div className="panel-title"><div><h3>Exercise history</h3><p>Recorded equipment sessions</p></div><span className="mini-count">{datasets.exercises.length}</span></div>{datasets.exercises.slice(0, 6).map((x) => <div className="detail-line" key={x.id}><strong>{x.equipment} · {x.category}</strong><span>{dateLabel(x.date)} · {x.durationMinutes || '—'} min</span><StatusBadge value={x.status}/></div>)}</section>
      <section className="panel"><div className="panel-title"><div><h3>Performance records</h3><p>Current and historical measurements</p></div><span className="mini-count">{datasets.performance.length}</span></div>{datasets.performance.slice(0, 6).map((x) => <div className="detail-line" key={x.id}><strong>{dateLabel(x.date)}</strong><span>Force {numberLabel(x.forceProduction)} N · Velocity {numberLabel(x.movementVelocity)} m/s</span><StatusBadge value={x.dataSource}/></div>)}</section>
      <section className="panel"><div className="panel-title"><div><h3>Sensor and alert activity</h3><p>Sensor records and review items</p></div><span className="mini-count">{datasets.sensors.length + datasets.alerts.length}</span></div>{datasets.alerts.slice(0, 5).map((x) => <div className="detail-line" key={x.id}><strong>{x.category}</strong><span>{x.description}</span><StatusBadge value={x.status}/></div>)}{!datasets.alerts.length && <div className="empty-inline">No alert records for this astronaut.</div>}</section>
    </div>
    <div className="disclaimer-line">Profile data is for demonstration only. Wearable measurements do not directly measure muscle mass or bone mineral density.</div>
  </>;
}

export function BaselinesPage() {
  return <CollectionPage resource="baselines" title="Baseline assessments" description="Capture individual preflight reference measurements for later comparisons." toolbarNote="Baseline values are astronaut-specific. Compare each current assessment only with that astronaut's own reference data." fields={[
    astronautSelect, { name: 'date', label: 'Assessment date', type: 'date', required: true }, phaseSelect,
    { name: 'forceProduction', label: 'Force production (N)', type: 'number' }, { name: 'movementVelocity', label: 'Movement velocity (m/s)', type: 'number' },
    { name: 'jointRom', label: 'Joint ROM (deg)', type: 'number' }, { name: 'movementConsistency', label: 'Movement consistency (%)', type: 'number' }, { name: 'functionalScore', label: 'Functional assessment score', type: 'number' },
    { name: 'notes', label: 'Assessment notes', type: 'textarea', full: true }
  ]} defaultValues={{ date: today, missionPhase: 'preflight' }} columns={[{ key: 'id', label: 'Record ID' }, { key: 'astronautId', label: 'Astronaut' }, { key: 'date', label: 'Assessment date' }, { key: 'forceProduction', label: 'Force (N)' }, { key: 'movementVelocity', label: 'Velocity (m/s)' }, { key: 'jointRom', label: 'ROM (deg)' }, { key: 'missionPhase', label: 'Phase' }, { key: 'dataSource', label: 'Source' }]} filters={[{ name: 'missionPhase', label: 'Phase', options: [{ value: 'preflight', label: 'Preflight' }, { value: 'in-flight', label: 'In-flight' }, { value: 'postflight', label: 'Postflight' }] }]}/>
}

export function ExercisesPage() {
  const global = useGlobalFilters();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    setLoading(true);
    resourceApi.list('exercises', { astronautId: global.astronautId || undefined, missionPhase: global.missionPhase || undefined })
      .then((result) => setSessions(result.data || []))
      .catch((error) => setLoadError(error.message))
      .finally(() => setLoading(false));
  }, [global.astronautId, global.missionPhase]);
  const prescribed = sessions.filter((item) => item.prescribed !== false);
  const completed = prescribed.filter((item) => item.status === 'completed').length;
  const missed = prescribed.filter((item) => item.status === 'missed').length;
  const adherenceRate = prescribed.length ? Math.round((completed / prescribed.length) * 100) : null;
  const byEquipment = ['ARED', 'Treadmill', 'CEVIS', 'ROCKY'].map((equipment) => ({ equipment, minutes: sessions.filter((x) => x.equipment === equipment && x.status === 'completed').reduce((sum, x) => sum + (Number(x.durationMinutes) || 0), 0), sessions: sessions.filter((x) => x.equipment === equipment).length }));
  return <>
    <PageHeader eyebrow="COUNTERMEASURE TRACKING" title="Exercise countermeasures" description="Track prescribed and completed resistance, treadmill, cycle ergometer and functional exercise sessions."/>
    {loadError && <div className="inline-error">{loadError}</div>}
    <div className="notice notice-info">Equipment categories are record classifications only. This prototype does not imply live ARED, treadmill, CEVIS or ROCKY hardware connectivity.</div>
    {loading ? <LoadingState/> : <>
      <div className="metric-grid metric-grid-four">
        <div className="metric-card compact-metric"><div className="metric-label">Prescribed sessions</div><div className="metric-value">{prescribed.length}</div><div className="metric-note">Sessions marked as prescribed</div></div>
        <div className="metric-card compact-metric"><div className="metric-label">Completed sessions</div><div className="metric-value">{completed}</div><div className="metric-note">Completion records</div></div>
        <div className="metric-card compact-metric"><div className="metric-label">Adherence</div><div className="metric-value">{adherenceRate == null ? '—' : `${adherenceRate}`}<small>{adherenceRate == null ? '' : '%'}</small></div><div className="metric-note">Completed / prescribed</div></div>
        <div className="metric-card compact-metric"><div className="metric-label">Missed sessions</div><div className="metric-value">{missed}</div><div className="metric-note">Requires contextual review</div></div>
      </div>
      <div className="dashboard-grid dashboard-grid-main">
        <section className="panel chart-panel"><div className="panel-title"><div><h3>Completed exercise duration</h3><p>Total recorded minutes by equipment category</p></div><span className="unit-tag">MINUTES</span></div>
          <ResponsiveContainer width="100%" height={230}><BarChart data={byEquipment} margin={{ top: 8, right: 5, left: -18, bottom: 0 }}><CartesianGrid stroke="#22314a" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="equipment" tick={{ fill: '#8290a8', fontSize: 10 }} axisLine={false} tickLine={false}/><YAxis tick={{ fill: '#8290a8', fontSize: 10 }} axisLine={false} tickLine={false}/><Tooltip contentStyle={{ background: '#101a2d', border: '1px solid #293956', borderRadius: 10, color: '#e7edf9' }}/><Bar dataKey="minutes" fill="#4f91ff" radius={[5, 5, 0, 0]}/></BarChart></ResponsiveContainer>
        </section>
        <section className="panel chart-panel"><div className="panel-title"><div><h3>Equipment activity</h3><p>Stored exercise records by device category</p></div><span className="unit-tag">SESSIONS</span></div><div className="equipment-activity">{byEquipment.map((item) => <div className="equipment-row" key={item.equipment}><div><strong>{item.equipment}</strong><span>{item.sessions} records</span></div><div className="equipment-track"><i style={{ width: `${sessions.length ? (item.sessions / sessions.length) * 100 : 0}%` }}/></div></div>)}</div><p className="chart-footnote">These are stored exercise records; they do not represent live device telemetry.</p></section>
      </div>
    </>}
    <CollectionPage resource="exercises" title="Exercise session records" description="Create, edit, search and filter individual countermeasure records." fields={[
      astronautSelect, { name: 'date', label: 'Session date', type: 'date', required: true }, phaseSelect,
      { name: 'category', label: 'Exercise category', type: 'select', required: true, options: categoryOptions }, { name: 'equipment', label: 'Equipment', type: 'select', required: true, options: equipmentOptions },
      { name: 'resistance', label: 'Resistance', type: 'number', hint: 'Enter the recorded resistance value when applicable.' }, { name: 'workload', label: 'Cycle workload', type: 'number' },
      { name: 'speed', label: 'Treadmill speed', type: 'number' }, { name: 'harnessLoad', label: 'Harness loading', type: 'number' },
      { name: 'sets', label: 'Sets', type: 'number' }, { name: 'repetitions', label: 'Repetitions', type: 'number' }, { name: 'durationMinutes', label: 'Duration (minutes)', type: 'number' }, { name: 'distanceKm', label: 'Distance (km)', type: 'number' },
      { name: 'status', label: 'Session status', type: 'select', required: true, options: [{ value: 'completed', label: 'Completed' }, { value: 'missed', label: 'Missed' }, { value: 'partial', label: 'Partial' }] }, { name: 'prescribed', label: 'Prescribed session', type: 'checkbox', checkboxLabel: 'Count this as a prescribed session' },
      { name: 'notes', label: 'Notes', type: 'textarea', full: true }
    ]} defaultValues={{ date: today, missionPhase: 'in-flight', status: 'completed', prescribed: true }} columns={[{ key: 'date', label: 'Date' }, { key: 'astronautId', label: 'Astronaut' }, { key: 'equipment', label: 'Equipment' }, { key: 'category', label: 'Category' }, { key: 'durationMinutes', label: 'Duration (min)' }, { key: 'status', label: 'Status', badge: true }, { key: 'missionPhase', label: 'Phase' }]} filters={[{ name: 'equipment', label: 'Equipment', options: equipmentOptions }, { name: 'status', label: 'Status', options: [{ value: 'completed', label: 'Completed' }, { value: 'missed', label: 'Missed' }, { value: 'partial', label: 'Partial' }] }, { name: 'missionPhase', label: 'Phase', options: [{ value: 'preflight', label: 'Preflight' }, { value: 'in-flight', label: 'In-flight' }, { value: 'postflight', label: 'Postflight' }]}]}/>
  </>;
}

export function PerformancePage() {
  const global = useGlobalFilters();
  const [records, setRecords] = useState([]);
  const [baselines, setBaselines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  useEffect(() => {
    setLoading(true);
    Promise.all([
      resourceApi.list('performance', { astronautId: global.astronautId || undefined, missionPhase: global.missionPhase || undefined }),
      resourceApi.list('baselines', { astronautId: global.astronautId || undefined })
    ]).then(([performanceResult, baselineResult]) => { setRecords(performanceResult.data || []); setBaselines(baselineResult.data || []); })
      .catch((error) => setLoadError(error.message)).finally(() => setLoading(false));
  }, [global.astronautId, global.missionPhase]);
  const ordered = [...records].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = ordered[ordered.length - 1] || {};
  const baseline = [...baselines].sort((a, b) => new Date(a.date) - new Date(b.date))[0] || {};
  const compare = (key) => {
    const current = Number(latest[key]); const base = Number(baseline[key]);
    if (!Number.isFinite(current) || !Number.isFinite(base) || base === 0) return 'Baseline comparison unavailable';
    const delta = ((current - base) / Math.abs(base)) * 100;
    return `${delta > 0 ? '+' : ''}${delta.toFixed(1)}% vs baseline`;
  };
  const metrics = [['Force production', latest.forceProduction, 'N', 'forceProduction'], ['Movement velocity', latest.movementVelocity, 'm/s', 'movementVelocity'], ['Joint ROM', latest.jointRom, 'deg', 'jointRom'], ['Movement consistency', latest.movementConsistency, '%', 'movementConsistency']];
  return <>
    <PageHeader eyebrow="PHYSICAL PERFORMANCE" title="Muscle performance" description="Track measurable force, movement and functional performance indicators against an astronaut's individual baseline."/>
    <div className="notice notice-info">This module records measurable physical performance. It does not directly measure muscle mass and does not diagnose muscle atrophy.</div>
    {loadError && <div className="inline-error">{loadError}</div>}
    {loading ? <LoadingState/> : <>
      <div className="metric-grid metric-grid-four">{metrics.map(([label, value, unit, key]) => <div className="metric-card compact-metric" key={key}><div className="metric-label">Latest {label}</div><div className="metric-value">{numberLabel(value)}<small>{unit}</small></div><div className="metric-note">{compare(key)}</div></div>)}</div>
      <div className="dashboard-grid dashboard-grid-main">
        <section className="panel chart-panel"><div className="panel-title"><div><h3>Force production history</h3><p>Chronological assessment measurements</p></div><span className="unit-tag">NEWTONS · N</span></div>
          {ordered.length ? <ResponsiveContainer width="100%" height={230}><LineChart data={ordered} margin={{ top: 8, right: 7, left: -18, bottom: 0 }}><CartesianGrid stroke="#22314a" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="date" tickFormatter={(x) => new Date(x).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} tick={{ fill: '#8290a8', fontSize: 10 }} axisLine={false} tickLine={false}/><YAxis tick={{ fill: '#8290a8', fontSize: 10 }} axisLine={false} tickLine={false}/><Tooltip contentStyle={{ background: '#101a2d', border: '1px solid #293956', borderRadius: 10, color: '#e7edf9' }}/><Line type="monotone" dataKey="forceProduction" name="Force (N)" stroke="#55d6e8" strokeWidth={2.5} dot={{ r: 3, fill: '#55d6e8' }}/></LineChart></ResponsiveContainer> : <div className="chart-empty">No performance assessments available.</div>}
        </section>
        <section className="panel chart-panel"><div className="panel-title"><div><h3>Movement velocity history</h3><p>IMU-derived movement velocity records</p></div><span className="unit-tag">METRES / SECOND</span></div>
          {ordered.length ? <ResponsiveContainer width="100%" height={230}><LineChart data={ordered} margin={{ top: 8, right: 7, left: -18, bottom: 0 }}><CartesianGrid stroke="#22314a" strokeDasharray="3 5" vertical={false}/><XAxis dataKey="date" tickFormatter={(x) => new Date(x).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} tick={{ fill: '#8290a8', fontSize: 10 }} axisLine={false} tickLine={false}/><YAxis tick={{ fill: '#8290a8', fontSize: 10 }} axisLine={false} tickLine={false}/><Tooltip contentStyle={{ background: '#101a2d', border: '1px solid #293956', borderRadius: 10, color: '#e7edf9' }}/><Line type="monotone" dataKey="movementVelocity" name="Velocity (m/s)" stroke="#9b86ff" strokeWidth={2.5} dot={{ r: 3, fill: '#9b86ff' }}/></LineChart></ResponsiveContainer> : <div className="chart-empty">No performance assessments available.</div>}
        </section>
      </div>
      <div className="baseline-compare panel"><div><strong>Individual baseline</strong><span>{baseline.date ? `Reference assessment · ${dateLabel(baseline.date)}` : 'No baseline assessment available'}</span></div><div><strong>{numberLabel(baseline.forceProduction)} N</strong><span>Baseline force production</span></div><div><strong>{numberLabel(baseline.jointRom)}°</strong><span>Baseline joint ROM</span></div><div><strong>{numberLabel(baseline.movementVelocity)} m/s</strong><span>Baseline movement velocity</span></div></div>
    </>}
    <CollectionPage resource="performance" title="Performance assessment records" description="Create, update and review force, ROM, movement velocity and functional assessment records." fields={[
      astronautSelect, { name: 'date', label: 'Assessment date', type: 'date', required: true }, phaseSelect,
      { name: 'forceProduction', label: 'Force production (N)', type: 'number' }, { name: 'movementVelocity', label: 'Movement velocity (m/s)', type: 'number' },
      { name: 'jointRom', label: 'Joint ROM (deg)', type: 'number' }, { name: 'movementConsistency', label: 'Movement consistency (%)', type: 'number' }, { name: 'functionalScore', label: 'Functional assessment score', type: 'number' },
      { name: 'repetitionPerformance', label: 'Repetition performance', type: 'number' }, { name: 'notes', label: 'Notes', type: 'textarea', full: true }
    ]} defaultValues={{ date: today, missionPhase: 'in-flight' }} columns={[{ key: 'date', label: 'Date' }, { key: 'astronautId', label: 'Astronaut' }, { key: 'forceProduction', label: 'Force (N)' }, { key: 'movementVelocity', label: 'Velocity (m/s)' }, { key: 'jointRom', label: 'ROM (deg)' }, { key: 'movementConsistency', label: 'Consistency (%)' }, { key: 'missionPhase', label: 'Phase' }]} filters={[{ name: 'missionPhase', label: 'Phase', options: [{ value: 'preflight', label: 'Preflight' }, { value: 'in-flight', label: 'In-flight' }, { value: 'postflight', label: 'Postflight' }] }]}/>
  </>;
}

export function SensorsPage() {
  return <CollectionPage resource="sensors" title="Sensor data" description="Manage IMU, force and pressure/insoles measurement records." toolbarNote="Sensor records in this package are manually entered or simulated. No live hardware integration is configured." fields={[
    astronautSelect, { name: 'sensorType', label: 'Sensor type', type: 'select', required: true, options: [{ value: 'IMU', label: 'IMU' }, { value: 'Force', label: 'Force sensor' }, { value: 'Pressure/Insole', label: 'Pressure / insole' }] },
    { name: 'metric', label: 'Metric name', required: true }, { name: 'value', label: 'Measurement value', type: 'number', required: true }, { name: 'unit', label: 'Unit', required: true },
    { name: 'timestamp', label: 'Measurement date', type: 'datetime-local', required: true }, phaseSelect, { name: 'exerciseSessionId', label: 'Exercise session ID' }, { name: 'notes', label: 'Notes', type: 'textarea', full: true }
  ]} defaultValues={{ timestamp: new Date().toISOString().slice(0, 16), missionPhase: 'in-flight' }} columns={[{ key: 'timestamp', label: 'Timestamp' }, { key: 'astronautId', label: 'Astronaut' }, { key: 'sensorType', label: 'Sensor' }, { key: 'metric', label: 'Metric' }, { key: 'value', label: 'Value' }, { key: 'unit', label: 'Unit' }, { key: 'dataSource', label: 'Source' }]} filters={[{ name: 'sensorType', label: 'Sensor', options: [{ value: 'IMU', label: 'IMU' }, { value: 'Force', label: 'Force' }, { value: 'Pressure/Insole', label: 'Pressure / insole' }] }]}/>
}

export function InsightsPage() {
  const [astronauts, setAstronauts] = useState([]);
  const [selected, setSelected] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { resourceApi.list('astronauts').then((x) => { setAstronauts(x.data || []); if (x.data?.[0]) setSelected(x.data[0].id); }).catch((e) => setMessage(e.message)); }, []);
  const run = async () => { if (!selected) return; setBusy(true); setMessage(''); try { const result = await dashboardApi.analyse(selected); setMessage(`Analysis complete: ${result.data.insights.length} insight(s) created; ${result.data.alertsCreated} alert(s) added.`); } catch (e) { setMessage(e.message); } finally { setBusy(false); } };
  return <><PageHeader eyebrow="ANALYTICS ENGINE" title="Adaptive insights" description="Explainable, rule-based comparisons against each astronaut's own stored baseline." actions={<div className="header-actions"><select className="header-select" value={selected} onChange={(e) => setSelected(e.target.value)}>{astronauts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select><button className="button button-primary" onClick={run} disabled={busy || !selected}>{busy ? 'Analysing…' : <><Play size={16}/> Run analysis</>}</button></div>}/>
    <div className="notice notice-info"><Sparkles size={17}/> Analysis is local and rule-based. Thresholds are illustrative configuration values, not NASA-approved or clinical limits. Add a baseline and performance assessment before running analysis.</div>{message && <div className="notice notice-success">{message}</div>}
    <CollectionPage resource="insights" title="Generated insights" description="Recent measurement changes and their plain-language explanations." fields={[astronautSelect, { name: 'metric', label: 'Metric', required: true }, { name: 'baseline', label: 'Baseline', type: 'number' }, { name: 'current', label: 'Current', type: 'number' }, { name: 'unit', label: 'Unit' }, phaseSelect, { name: 'severity', label: 'Severity', type: 'select', options: [{ value: 'normal', label: 'Normal' }, { value: 'info', label: 'Info' }, { value: 'attention', label: 'Attention' }] }, { name: 'explanation', label: 'Explanation', type: 'textarea', full: true }, { name: 'suggestedAction', label: 'Suggested action', type: 'textarea', full: true }]} defaultValues={{ severity: 'info', status: 'new' }} columns={[{ key: 'createdAt', label: 'Generated' }, { key: 'astronautId', label: 'Astronaut' }, { key: 'metric', label: 'Metric' }, { key: 'percentageChange', label: 'Change', render: (r) => r.percentageChange == null ? '—' : `${numberLabel(r.percentageChange)}%` }, { key: 'severity', label: 'Severity', badge: true }, { key: 'dataSource', label: 'Source' }]} filters={[{ name: 'severity', label: 'Severity', options: [{ value: 'normal', label: 'Normal' }, { value: 'info', label: 'Info' }, { value: 'attention', label: 'Attention' }] }]}/>
  </>;
}

export function AlertsPage() {
  const actions = (record, reload) => <button className="icon-button small" title="Mark reviewed" onClick={async () => { await resourceApi.update('alerts', record.id, { status: record.status === 'resolved' ? 'open' : 'reviewed' }); reload(); }}><Check size={15}/></button>;
  return <CollectionPage resource="alerts" title="Alerts" description="Review performance changes, loading changes, adherence and functional assessment flags." actions={actions} fields={[
    astronautSelect, { name: 'category', label: 'Category', type: 'select', required: true, options: ['Performance change', 'Loading change', 'Exercise adherence', 'Functional change', 'Specialist review'].map((x) => ({ value: x, label: x })) },
    { name: 'severity', label: 'Severity', type: 'select', options: ['info', 'attention', 'critical'].map((x) => ({ value: x, label: titleCase(x) })) }, { name: 'metric', label: 'Metric' },
    { name: 'baseline', label: 'Baseline', type: 'number' }, { name: 'current', label: 'Current', type: 'number' }, phaseSelect, { name: 'status', label: 'Review status', type: 'select', options: ['open', 'acknowledged', 'reviewed', 'resolved'].map((x) => ({ value: x, label: titleCase(x) })) },
    { name: 'description', label: 'Description', type: 'textarea', full: true }
  ]} defaultValues={{ severity: 'info', status: 'open' }} columns={[{ key: 'createdAt', label: 'Created' }, { key: 'astronautId', label: 'Astronaut' }, { key: 'category', label: 'Category' }, { key: 'metric', label: 'Metric' }, { key: 'severity', label: 'Severity', badge: true }, { key: 'status', label: 'Review status', badge: true }]} filters={[{ name: 'severity', label: 'Severity', options: [{ value: 'info', label: 'Info' }, { value: 'attention', label: 'Attention' }, { value: 'critical', label: 'Critical' }] }, { name: 'status', label: 'Status', options: ['open', 'acknowledged', 'reviewed', 'resolved'].map((x) => ({ value: x, label: titleCase(x) })) }]}/>
}

export function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [astronauts, setAstronauts] = useState([]);
  const [astronautId, setAstronautId] = useState('');
  const [phase, setPhase] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const load = async () => { try { const [r, a] = await Promise.all([resourceApi.list('reports'), resourceApi.list('astronauts')]); setReports(r.data || []); setAstronauts(a.data || []); } catch (e) { setError(e.message); } };
  useEffect(() => { load(); }, []);
  const generate = async () => { setLoading(true); setError(''); try { await dashboardApi.generateReport({ astronautId: astronautId || undefined, phase: phase || undefined, from: from || undefined, to: to || undefined, title: 'Mission performance report' }); await load(); } catch (e) { setError(e.message); } finally { setLoading(false); } };
  return <><PageHeader eyebrow="REPORTING CENTRE" title="Reports & history" description="Generate mission-period summaries from persisted exercise, performance, sensor and alert records." actions={<button className="button button-primary" onClick={generate} disabled={loading}>{loading ? 'Generating…' : <><FileBarChart2 size={17}/> Generate report</>}</button>}/>
    <section className="panel report-builder"><div className="panel-title"><div><h3>Build a report</h3><p>Choose the scope and reporting period.</p></div><span className="unit-tag">STORED RECORDS ONLY</span></div><div className="report-filters"><label className="form-field"><span>Astronaut</span><select value={astronautId} onChange={(e) => setAstronautId(e.target.value)}><option value="">All astronauts</option>{astronauts.map((a) => <option value={a.id} key={a.id}>{a.name}</option>)}</select></label><label className="form-field"><span>Mission phase</span><select value={phase} onChange={(e) => setPhase(e.target.value)}><option value="">All phases</option><option value="preflight">Preflight</option><option value="in-flight">In-flight</option><option value="postflight">Postflight</option></select></label><label className="form-field"><span>From</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)}/></label><label className="form-field"><span>To</span><input type="date" value={to} onChange={(e) => setTo(e.target.value)}/></label></div>{error && <div className="inline-error">{error}</div>}</section>
    <section className="panel data-panel"><div className="panel-title"><div><h3>Generated reports</h3><p>Previously generated report snapshots.</p></div><button className="button button-quiet" onClick={load}><RefreshCw size={16}/> Refresh</button></div>{reports.length ? <div className="report-list">{reports.map((report) => <div className="report-item" key={report.id}><div className="report-file-icon"><FileBarChart2 size={21}/></div><div className="report-main"><strong>{report.title}</strong><span>{report.astronaut} · {report.missionPhase} · {dateLabel(report.generatedAt)}</span><small>{report.summary.exerciseRecords} exercise · {report.summary.performanceRecords} performance · {report.summary.sensorRecords} sensor records</small></div><div className="report-actions"><button className="button button-secondary" onClick={() => downloadCsv(report.id)}><Download size={15}/> CSV</button><button className="button button-quiet" onClick={() => { const w = window.open('', '_blank'); if (w) { w.document.write(`<pre style="font:13px monospace;white-space:pre-wrap">${JSON.stringify(report, null, 2).replaceAll('<', '&lt;')}</pre>`); w.document.close(); w.print(); } }}><Printer size={15}/> Print</button></div></div>)}</div> : <div className="empty-state"><div className="empty-icon"><FileBarChart2 size={22}/></div><h3>No reports generated</h3><p>Generate a report to save a snapshot of currently stored records.</p></div>}</section>
    <div className="disclaimer-line">CSV export is implemented. The Print action opens a printable report snapshot; choose “Save as PDF” in your browser's print dialog.</div>
  </>;
}

export function SettingsPage() {
  const [setting, setSetting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { resourceApi.list('settings').then((r) => setSetting(r.data?.[0] || null)).catch((e) => setMessage(e.message)); }, []);
  const update = (key, value) => setSetting((old) => ({ ...old, analysisThresholds: { ...old.analysisThresholds, [key]: Number(value) } }));
  const save = async () => { if (!setting) return; setSaving(true); setMessage(''); try { await resourceApi.update('settings', setting.id, setting); setMessage('Settings saved to JSON storage.'); } catch (e) { setMessage(e.message); } finally { setSaving(false); } };
  if (!setting) return <><PageHeader title="System settings" description="Configure local prototype preferences and analysis conditions."/><LoadingState/></>;
  return <><PageHeader eyebrow="CONFIGURATION" title="System settings" description="Application preferences, data-source status and illustrative analysis conditions." actions={<button className="button button-primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save settings'}</button>}/>{message && <div className="notice notice-info">{message}</div>}
    <div className="settings-grid"><section className="panel settings-panel"><div className="panel-title"><div><h3>Analysis conditions</h3><p>Prototype-only comparison thresholds.</p></div><Activity size={19}/></div><div className="threshold-list">{[['forceProductionPercent', 'Force production change (%)'], ['movementVelocityPercent', 'Movement velocity change (%)'], ['jointRomPercent', 'Joint ROM change (%)'], ['adherencePercent', 'Exercise adherence minimum (%)']].map(([key, label]) => <label className="threshold-row" key={key}><span>{label}</span><input type="number" min="0" max="100" step="0.5" value={setting.analysisThresholds?.[key] ?? 8} onChange={(e) => update(key, e.target.value)}/></label>)}</div><div className="notice notice-warning"><ShieldAlert size={17}/> These values are illustrative software conditions only. They are not NASA-approved, clinically validated or medical decision thresholds.</div></section>
      <section className="panel settings-panel"><div className="panel-title"><div><h3>System status</h3><p>Local prototype configuration.</p></div><CircleCheck size={19} className="icon-green"/></div><div className="system-status-list"><div><span>Application</span><strong>OrbitMSK</strong></div><div><span>Storage engine</span><strong>Local JSON files</strong></div><div><span>Demo mode</span><StatusBadge value="enabled"/></div><div><span>Live sensor integration</span><StatusBadge value="not connected"/></div><div><span>AI provider</span><StatusBadge value="rule-based"/></div><div><span>NASA endorsement</span><StatusBadge value="not affiliated"/></div></div></section></div>
    <section className="panel settings-panel"><div className="panel-title"><div><h3>Data provenance</h3><p>How information is classified in this prototype.</p></div></div><div className="provenance-grid"><div><span className="source-chip source-sim">simulated</span><p>Fictional values for UI demonstration and testing.</p></div><div><span className="source-chip">manual</span><p>Records entered by an authorised prototype user.</p></div><div><span className="source-chip source-ai">rule-based</span><p>Software comparisons generated from stored records.</p></div><div><span className="source-chip source-ref">NASA reference</span><p>Reference material must be added from supplied and verified NASA resources separately.</p></div></div></section>
  </>;
}
