import { Router } from 'express';
import { createResourceController } from '../controllers/resourceController.js';
import { readCollection, withCollectionLock, writeCollection } from '../storage/jsonStorage.js';
import { analyseAstronaut } from '../services/insightEngine.js';
import { adherence, percentageChange } from '../services/calculations.js';
import { ok, fail, asyncHandler } from '../utils/http.js';
import { randomUUID } from 'node:crypto';

const router = Router();
const resources = {
  astronauts: 'astronauts', missions: 'missions', baselines: 'baselineAssessments', exercises: 'exerciseRecords',
  sensors: 'sensorMeasurements', performance: 'performanceAssessments', insights: 'insights', alerts: 'alerts',
  reports: 'reports', users: 'users', settings: 'settings'
};

router.get('/health', (_req, res) => ok(res, { status: 'healthy', storage: 'JSON file persistence', timestamp: new Date().toISOString() }, 'API is ready'));

router.get('/dashboard/summary', asyncHandler(async (req, res) => {
  const [astronauts, missions, exercises, alerts, performance, baselines] = await Promise.all([
    readCollection('astronauts'), readCollection('missions'), readCollection('exerciseRecords'), readCollection('alerts'), readCollection('performanceAssessments'), readCollection('baselineAssessments')
  ]);
  const scopedAstronauts = astronauts.filter((x) => (!req.query.astronautId || x.id === req.query.astronautId) && (!req.query.missionPhase || x.missionPhase === req.query.missionPhase));
  const scopedExercises = exercises.filter((x) => (!req.query.astronautId || x.astronautId === req.query.astronautId) && (!req.query.missionPhase || x.missionPhase === req.query.missionPhase));
  const scopedCompleted = scopedExercises.filter((x) => x.status === 'completed').length;
  const scopedPrescribed = scopedExercises.filter((x) => x.prescribed !== false).length;
  const scopedAlerts = alerts.filter((x) => (!req.query.astronautId || x.astronautId === req.query.astronautId) && (!req.query.missionPhase || x.missionPhase === req.query.missionPhase));
  const scopedInsights = (await readCollection('insights')).filter((x) => !req.query.astronautId || x.astronautId === req.query.astronautId);
  const summary = {
    totalAstronauts: scopedAstronauts.length,
    activeMissions: missions.filter((x) => x.status === 'active' && (!req.query.missionPhase || x.phase === req.query.missionPhase)).length,
    completedSessions: scopedCompleted,
    prescribedSessions: scopedPrescribed,
    adherence: adherence(scopedCompleted, scopedPrescribed),
    performanceRecords: performance.length,
    baselineAssessments: baselines.length,
    alertsRequiringReview: scopedAlerts.filter((x) => !['resolved', 'reviewed'].includes(x.status)).length,
    performanceChanges: scopedInsights.filter((x) => x.severity === 'attention').length,
    dataMode: 'fictional demonstration data'
  };
  return ok(res, summary);
}));

router.get('/dashboard/exercise-trends', asyncHandler(async (req, res) => {
  const exercises = await readCollection('exerciseRecords');
  const filtered = exercises.filter((x) => (!req.query.astronautId || x.astronautId === req.query.astronautId) && (!req.query.phase || x.missionPhase === req.query.phase));
  const days = Math.max(7, Math.min(90, Number(req.query.days) || 14));
  const rows = Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (days - i - 1));
    const key = d.toISOString().slice(0, 10);
    const items = filtered.filter((x) => String(x.date || '').slice(0, 10) === key);
    return { date: key, completed: items.filter((x) => x.status === 'completed').length, missed: items.filter((x) => x.status === 'missed').length, prescribed: items.filter((x) => x.prescribed !== false).length };
  });
  return ok(res, rows);
}));

router.get('/dashboard/performance-trends', asyncHandler(async (req, res) => {
  const records = await readCollection('performanceAssessments');
  const filtered = records.filter((x) => (!req.query.astronautId || x.astronautId === req.query.astronautId) && (!req.query.missionPhase || x.missionPhase === req.query.missionPhase)).sort((a, b) => new Date(a.date) - new Date(b.date));
  return ok(res, filtered);
}));

router.post('/insights/analyse', asyncHandler(async (req, res) => {
  if (!req.body?.astronautId) return fail(res, 'astronautId is required', 422);
  const result = await analyseAstronaut(req.body.astronautId);
  return ok(res, result, 'Rule-based analysis completed', 201);
}));

router.post('/reports/generate', asyncHandler(async (req, res) => {
  const { astronautId, from, to, phase, title } = req.body || {};
  const [astronauts, exercises, performance, sensors, alerts, insights, baselines] = await Promise.all([
    readCollection('astronauts'), readCollection('exerciseRecords'), readCollection('performanceAssessments'), readCollection('sensorMeasurements'), readCollection('alerts'), readCollection('insights'), readCollection('baselineAssessments')
  ]);
  const inScope = (record) => (!astronautId || record.astronautId === astronautId) && (!phase || record.missionPhase === phase) && (!from || new Date(record.date || record.timestamp || record.createdAt) >= new Date(from)) && (!to || new Date(record.date || record.timestamp || record.createdAt) <= new Date(`${to}T23:59:59`));
  const report = {
    id: randomUUID(), title: title || 'Astronaut performance summary', astronautId: astronautId || 'all', astronaut: astronauts.find((x) => x.id === astronautId)?.name || 'All astronauts',
    period: { from: from || null, to: to || null }, missionPhase: phase || 'all', generatedAt: new Date().toISOString(),
    summary: { exerciseRecords: exercises.filter(inScope).length, performanceRecords: performance.filter(inScope).length, sensorRecords: sensors.filter(inScope).length, alerts: alerts.filter(inScope).length, insights: insights.filter(inScope).length },
    exercises: exercises.filter(inScope), performance: performance.filter(inScope), sensors: sensors.filter(inScope), alerts: alerts.filter(inScope), insights: insights.filter(inScope), baselines: baselines.filter((x) => !astronautId || x.astronautId === astronautId),
    dataNote: 'This report may contain fictional simulated demonstration data. Verify each record dataSource before operational use.', dataSource: 'generated-from-stored-records'
  };
  await withCollectionLock('reports', async () => { const records = await readCollection('reports'); await writeCollection('reports', [report, ...records]); });
  return ok(res, report, 'Report generated successfully', 201);
}));

router.get('/reports/:id/export', asyncHandler(async (req, res) => {
  const report = (await readCollection('reports')).find((x) => x.id === req.params.id);
  if (!report) return fail(res, 'Report not found', 404);
  const format = String(req.query.format || 'json').toLowerCase();
  if (format === 'json') return ok(res, report);
  if (format !== 'csv') return fail(res, 'Supported export formats: json, csv', 422);
  const rows = [
    ['section', 'id', 'astronautId', 'date', 'metricOrCategory', 'value', 'unit', 'dataSource'],
    ...report.exercises.map((x) => ['exercise', x.id, x.astronautId, x.date, x.category, x.durationMinutes, 'minutes', x.dataSource]),
    ...report.performance.map((x) => ['performance', x.id, x.astronautId, x.date, 'forceProduction', x.forceProduction, 'N', x.dataSource]),
    ...report.sensors.map((x) => ['sensor', x.id, x.astronautId, x.timestamp, x.metric, x.value, x.unit, x.dataSource]),
    ...report.alerts.map((x) => ['alert', x.id, x.astronautId, x.createdAt, x.category, x.severity, '', x.dataSource])
  ];
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="report-${report.id}.csv"`);
  return res.send(csv);
}));

for (const [route, collection] of Object.entries(resources)) {
  const controller = createResourceController(collection);
  router.get(`/${route}`, controller.list);
  router.get(`/${route}/:id`, controller.get);
  router.post(`/${route}`, controller.create);
  router.put(`/${route}/:id`, controller.update);
  router.delete(`/${route}/:id`, controller.remove);
}

export default router;
