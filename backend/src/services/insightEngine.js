import { readCollection, withCollectionLock, writeCollection } from '../storage/jsonStorage.js';
import { percentageChange, adherence } from './calculations.js';
import { randomUUID } from 'node:crypto';

const METRICS = [
  { key: 'forceProduction', label: 'Force production', unit: 'N', thresholdKey: 'forceProductionPercent' },
  { key: 'movementVelocity', label: 'Movement velocity', unit: 'm/s', thresholdKey: 'movementVelocityPercent' },
  { key: 'jointRom', label: 'Joint ROM', unit: 'deg', thresholdKey: 'jointRomPercent' }
];

export async function analyseAstronaut(astronautId) {
  const [astronauts, baselines, performance, exercises, settings] = await Promise.all([
    readCollection('astronauts'), readCollection('baselineAssessments'), readCollection('performanceAssessments'), readCollection('exerciseRecords'), readCollection('settings')
  ]);
  const astronaut = astronauts.find((item) => item.id === astronautId);
  if (!astronaut) throw Object.assign(new Error('Astronaut not found'), { status: 404 });
  const baseline = baselines.filter((item) => item.astronautId === astronautId).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  if (!baseline) throw Object.assign(new Error('A baseline assessment is required before analysis'), { status: 400 });
  const current = performance.filter((item) => item.astronautId === astronautId).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  if (!current) throw Object.assign(new Error('A performance assessment is required before analysis'), { status: 400 });
  const threshold = settings[0]?.analysisThresholds || {};
  const insights = [];
  for (const metric of METRICS) {
    const baselineValue = Number(baseline[metric.key]);
    const currentValue = Number(current[metric.key]);
    const change = percentageChange(currentValue, baselineValue);
    if (change === null) continue;
    const limit = Number(threshold[metric.thresholdKey] ?? 8);
    if (Math.abs(change) >= limit) {
      insights.push({
        id: randomUUID(), astronautId, astronautName: astronaut.name, missionPhase: current.missionPhase, metric: metric.label, baseline: baselineValue,
        current: currentValue, unit: metric.unit, difference: Number((currentValue - baselineValue).toFixed(2)),
        percentageChange: change, severity: change < 0 ? 'attention' : 'info',
        explanation: `The latest recorded ${metric.label.toLowerCase()} value is ${Math.abs(change)}% ${change < 0 ? 'below' : 'above'} the stored individual baseline. This is a measurement comparison, not a diagnosis.`,
        suggestedAction: 'Review the measurement history, collection context, and data quality. Consider authorised specialist review if the change persists.',
        status: 'new', createdAt: new Date().toISOString(), dataSource: 'rule-based',
        thresholdNote: 'Illustrative configurable prototype logic; not a NASA-approved or clinical threshold.'
      });
    }
  }
  const astronautExercises = exercises.filter((item) => item.astronautId === astronautId && item.prescribed !== false);
  const completed = astronautExercises.filter((item) => item.status === 'completed').length;
  const rate = adherence(completed, astronautExercises.length);
  const adherenceLimit = Number(threshold.adherencePercent ?? 80);
  if (rate !== null && rate < adherenceLimit) {
    insights.push({ id: randomUUID(), astronautId, astronautName: astronaut.name, missionPhase: current.missionPhase, metric: 'Exercise adherence', baseline: adherenceLimit, current: rate, unit: '%', difference: Number((rate - adherenceLimit).toFixed(1)), percentageChange: null, severity: 'attention', explanation: `Recorded exercise completion is ${rate}% across ${astronautExercises.length} prescribed demonstration records.`, suggestedAction: 'Review the prescribed and completed session records with the relevant specialist.', status: 'new', createdAt: new Date().toISOString(), dataSource: 'rule-based', thresholdNote: 'Illustrative configurable prototype logic; not a NASA-approved or clinical threshold.' });
  }
  if (!insights.length) insights.push({ id: randomUUID(), astronautId, astronautName: astronaut.name, missionPhase: current.missionPhase, metric: 'No configured changes detected', baseline: null, current: null, unit: '', difference: null, percentageChange: null, severity: 'normal', explanation: 'No measurements crossed the currently configured demonstration conditions. This does not establish that all measurements are clinically normal.', suggestedAction: 'Continue reviewing recorded measurements and data quality.', status: 'new', createdAt: new Date().toISOString(), dataSource: 'rule-based' });

  await withCollectionLock('insights', async () => {
    const existing = await readCollection('insights');
    await writeCollection('insights', [...insights, ...existing]);
  });
  const alertRecords = insights.filter((item) => item.severity === 'attention').map((item) => ({
    id: randomUUID(), astronautId, astronautName: astronaut.name, missionPhase: current.missionPhase, category: item.metric === 'Exercise adherence' ? 'Exercise adherence' : 'Performance change',
    severity: item.severity, metric: item.metric, baseline: item.baseline, current: item.current, difference: item.difference,
    description: item.explanation, status: 'open', createdAt: new Date().toISOString(), dataSource: 'rule-based', thresholdNote: item.thresholdNote
  }));
  if (alertRecords.length) await withCollectionLock('alerts', async () => {
    const existing = await readCollection('alerts');
    await writeCollection('alerts', [...alertRecords, ...existing]);
  });
  return { astronaut, baseline, current, insights, alertsCreated: alertRecords.length };
}
