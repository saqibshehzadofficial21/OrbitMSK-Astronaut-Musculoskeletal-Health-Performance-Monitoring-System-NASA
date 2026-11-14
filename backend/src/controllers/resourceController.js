import { randomUUID } from 'node:crypto';
import { readCollection, writeCollection, withCollectionLock } from '../storage/jsonStorage.js';
import { ok, fail, asyncHandler } from '../utils/http.js';

const REQUIRED = {
  astronauts: ['name', 'missionPhase'], missions: ['name'], baselineAssessments: ['astronautId', 'date'],
  exerciseRecords: ['astronautId', 'date', 'category', 'equipment'], sensorMeasurements: ['astronautId', 'sensorType', 'metric', 'value'],
  performanceAssessments: ['astronautId', 'date'], insights: ['astronautId', 'metric'], alerts: ['astronautId', 'category', 'description'],
  reports: ['title'], users: ['name', 'role'], settings: []
};

function matches(record, query) {
  const search = String(query.search || '').toLowerCase();
  if (search) {
    const haystack = Object.values(record).filter((v) => typeof v === 'string' || typeof v === 'number').join(' ').toLowerCase();
    if (!haystack.includes(search)) return false;
  }
  for (const key of ['astronautId', 'missionPhase', 'category', 'equipment', 'status', 'severity', 'sensorType', 'dataSource']) {
    if (query[key] && String(record[key] || '').toLowerCase() !== String(query[key]).toLowerCase()) return false;
  }
  const date = new Date(record.date || record.timestamp || record.createdAt || 0);
  if (query.from && date < new Date(query.from)) return false;
  if (query.to && date > new Date(`${query.to}T23:59:59`)) return false;
  return true;
}

export function createResourceController(collection) {
  return {
    list: asyncHandler(async (req, res) => {
      let records = (await readCollection(collection)).filter((record) => matches(record, req.query));
      if (req.query.sort) {
        const key = String(req.query.sort).replace(/[^a-zA-Z0-9_]/g, '');
        const direction = req.query.order === 'asc' ? 1 : -1;
        records.sort((a, b) => String(a[key] ?? '').localeCompare(String(b[key] ?? ''), undefined, { numeric: true }) * direction);
      } else records.sort((a, b) => new Date(b.date || b.timestamp || b.createdAt || 0) - new Date(a.date || a.timestamp || a.createdAt || 0));
      const total = records.length;
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 200));
      records = records.slice((page - 1) * limit, page * limit);
      res.setHeader('X-Total-Count', String(total));
      return ok(res, records, 'Records retrieved', 200);
    }),
    get: asyncHandler(async (req, res) => {
      const record = (await readCollection(collection)).find((item) => item.id === req.params.id);
      return record ? ok(res, record) : fail(res, 'Record not found', 404);
    }),
    create: asyncHandler(async (req, res) => {
      const body = req.body || {};
      for (const key of REQUIRED[collection] || []) if (body[key] === undefined || body[key] === null || String(body[key]).trim() === '') return fail(res, `${key} is required`, 422);
      const record = { ...body, id: body.id || randomUUID(), createdAt: body.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() };
      await withCollectionLock(collection, async () => {
        const records = await readCollection(collection);
        if (records.some((item) => item.id === record.id)) throw Object.assign(new Error('Record ID already exists'), { status: 409 });
        await writeCollection(collection, [record, ...records]);
      });
      return ok(res, record, 'Record created successfully', 201);
    }),
    update: asyncHandler(async (req, res) => {
      let updated;
      await withCollectionLock(collection, async () => {
        const records = await readCollection(collection);
        const index = records.findIndex((item) => item.id === req.params.id);
        if (index < 0) return;
        updated = { ...records[index], ...(req.body || {}), id: records[index].id, updatedAt: new Date().toISOString() };
        records[index] = updated;
        await writeCollection(collection, records);
      });
      return updated ? ok(res, updated, 'Record updated successfully') : fail(res, 'Record not found', 404);
    }),
    remove: asyncHandler(async (req, res) => {
      let removed;
      await withCollectionLock(collection, async () => {
        const records = await readCollection(collection);
        const remaining = records.filter((item) => item.id !== req.params.id);
        if (remaining.length !== records.length) { removed = true; await writeCollection(collection, remaining); }
      });
      return removed ? ok(res, { id: req.params.id }, 'Record deleted successfully') : fail(res, 'Record not found', 404);
    })
  };
}
