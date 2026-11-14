import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Pencil, Trash2, RefreshCw, SlidersHorizontal, Eye, Download } from 'lucide-react';
import { resourceApi } from '../services/api';
import { dateLabel, numberLabel, phaseLabel, titleCase } from '../utils/format';
import PageHeader from './PageHeader';
import Modal from './Modal';
import StatusBadge from './StatusBadge';
import LoadingState from './LoadingState';
import { useGlobalFilters } from '../context/GlobalFiltersContext';

function displayValue(value, field) {
  if (value === null || value === undefined || value === '') return '—';
  if (field === 'date' || field === 'timestamp' || field === 'createdAt') return dateLabel(value);
  if (field === 'missionPhase') return phaseLabel(value);
  if (typeof value === 'number') return numberLabel(value, 2);
  return String(value);
}

export default function CollectionPage({ resource, title, description, eyebrow, fields, columns, defaultValues = {}, filters = [], actions = null, emptyText, onView, toolbarNote }) {
  const globalFilters = useGlobalFilters();
  const [records, setRecords] = useState([]);
  const [astronauts, setAstronauts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(() => new URLSearchParams(window.location.search).get('search') || '');
  const [filterValues, setFilterValues] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const load = async () => {
    setLoading(true); setError('');
    try {
      const params = { search, ...(globalFilters.astronautId ? { astronautId: globalFilters.astronautId } : {}), ...(globalFilters.missionPhase ? { missionPhase: globalFilters.missionPhase } : {}) };
      Object.entries(filterValues).forEach(([key, value]) => { if (value) params[key] = value; else if (key in params) delete params[key]; });
      Object.keys(params).forEach((key) => { if (!params[key]) delete params[key]; });
      const [result, astronautResult] = await Promise.all([
        resourceApi.list(resource, params), resourceApi.list('astronauts')
      ]);
      setRecords(result.data || []);
      setAstronauts(astronautResult.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [resource, search, JSON.stringify(filterValues), globalFilters.astronautId, globalFilters.missionPhase]);

  const resolvedFields = useMemo(() => fields.map((field) => field.name === 'astronautId' ? { ...field, options: astronauts.map((a) => ({ value: a.id, label: `${a.name} (${a.id})` })) } : field), [fields, astronauts]);

  const openCreate = () => { setEditing(null); setForm({ ...defaultValues, dataSource: 'manual' }); setModalOpen(true); };
  const openEdit = (record) => { setEditing(record); setForm({ ...record }); setModalOpen(true); };
  const updateForm = (name, value) => setForm((old) => ({ ...old, [name]: value }));

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form };
      resolvedFields.forEach((field) => {
        if (field.type === 'number') payload[field.name] = payload[field.name] === '' || payload[field.name] === undefined ? null : Number(payload[field.name]);
      });
      if (editing) await resourceApi.update(resource, editing.id, payload);
      else await resourceApi.create(resource, payload);
      setModalOpen(false); await load();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const remove = async (record) => {
    if (!window.confirm(`Delete this ${title.toLowerCase()} record? This cannot be undone.`)) return;
    try { await resourceApi.remove(resource, record.id); await load(); }
    catch (e) { setError(e.message); }
  };

  return <>
    <PageHeader eyebrow={eyebrow} title={title} description={description} actions={<button className="button button-primary" onClick={openCreate}><Plus size={17}/> Add record</button>} />
    {toolbarNote && <div className="notice notice-info">{toolbarNote}</div>}
    <section className="panel data-panel">
      <div className="table-toolbar">
        <div className="search-wrap"><Search size={17}/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${title.toLowerCase()}…`} /></div>
        <div className="toolbar-right">
          {filters.map((filter) => <label className="filter-control" key={filter.name}><span>{filter.label}</span><select value={filterValues[filter.name] || ''} onChange={(e) => setFilterValues((old) => ({ ...old, [filter.name]: e.target.value }))}><option value="">All</option>{filter.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>)}
          <button className="button button-quiet" onClick={load} title="Refresh"><RefreshCw size={16}/></button>
        </div>
      </div>
      {error && <div className="inline-error">{error}</div>}
      {loading ? <LoadingState/> : records.length === 0 ? <div className="empty-state"><div className="empty-icon"><SlidersHorizontal size={22}/></div><h3>No records found</h3><p>{emptyText || 'Try adjusting your search or filters, or add a new record.'}</p><button className="button button-secondary" onClick={openCreate}><Plus size={16}/> Add first record</button></div> : <div className="table-scroll"><table className="data-table"><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}<th className="action-col">Actions</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}>{columns.map((column) => <td key={column.key}>{column.badge ? <StatusBadge value={record[column.key] || 'unknown'}/> : column.render ? column.render(record) : displayValue(record[column.key], column.key)}</td>)}<td><div className="row-actions">{onView && <button className="icon-button small" onClick={() => onView(record)} aria-label="View"><Eye size={15}/></button>}<button className="icon-button small" onClick={() => openEdit(record)} aria-label="Edit"><Pencil size={15}/></button><button className="icon-button small danger-hover" onClick={() => remove(record)} aria-label="Delete"><Trash2 size={15}/></button>{actions?.(record, load)}</div></td></tr>)}</tbody></table></div>}
      <footer className="table-footer"><span>{records.length} records shown</span><span className="source-note">Record source is retained per item; demonstration values are labelled.</span></footer>
    </section>
    {modalOpen && <Modal title={`${editing ? 'Edit' : 'Add'} ${title.replace(/s$/, '')}`} onClose={() => setModalOpen(false)} wide>
      <form className="record-form" onSubmit={save}>
        <div className="form-grid">{resolvedFields.map((field) => <label className={`form-field ${field.full ? 'field-full' : ''}`} key={field.name}><span>{field.label}{field.required && <b> *</b>}</span>
          {field.type === 'select' ? <select required={field.required} value={form[field.name] ?? field.value ?? ''} onChange={(e) => updateForm(field.name, e.target.value)}><option value="">Select {field.label.toLowerCase()}</option>{(field.options || []).map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
            : field.type === 'textarea' ? <textarea rows="3" value={form[field.name] ?? ''} onChange={(e) => updateForm(field.name, e.target.value)} placeholder={field.placeholder || ''}/>
            : field.type === 'checkbox' ? <span className="checkbox-control"><input type="checkbox" checked={Boolean(form[field.name])} onChange={(e) => updateForm(field.name, e.target.checked)}/><span>{field.checkboxLabel || 'Enabled'}</span></span>
            : <input type={field.type || 'text'} required={field.required} min={field.min} step={field.step || (field.type === 'number' ? 'any' : undefined)} value={form[field.name] ?? ''} onChange={(e) => updateForm(field.name, e.target.value)} placeholder={field.placeholder || ''}/>}
          {field.hint && <small>{field.hint}</small>}
        </label>)}</div>
        <div className="form-footer"><span className="form-hint">Fields marked * are required. This prototype stores records in local JSON files.</span><button type="button" className="button button-quiet" onClick={() => setModalOpen(false)}>Cancel</button><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create record'}</button></div>
      </form>
    </Modal>}
  </>;
}
