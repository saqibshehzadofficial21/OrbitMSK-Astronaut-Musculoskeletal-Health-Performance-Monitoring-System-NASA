const now = new Date().toISOString();
const ago = (days) => new Date(Date.now() - days * 86400000).toISOString();

export const seed = {
  astronauts: [
    { id: 'AST-001', name: 'Alex Morgan', missionId: 'MIS-ISS-26', mission: 'Expedition 74', role: 'Flight Engineer', missionPhase: 'in-flight', status: 'active', email: 'alex.morgan@example.test', notes: 'Fictional demonstration profile.', createdAt: ago(45), updatedAt: now, dataSource: 'simulated' },
    { id: 'AST-002', name: 'Jordan Lee', missionId: 'MIS-ISS-26', mission: 'Expedition 74', role: 'Mission Specialist', missionPhase: 'in-flight', status: 'active', email: 'jordan.lee@example.test', notes: 'Fictional demonstration profile.', createdAt: ago(40), updatedAt: now, dataSource: 'simulated' },
    { id: 'AST-003', name: 'Taylor Rivera', missionId: 'MIS-LUNAR-27', mission: 'Lunar Analog 2027', role: 'Commander', missionPhase: 'preflight', status: 'training', email: 'taylor.rivera@example.test', notes: 'Fictional demonstration profile.', createdAt: ago(20), updatedAt: now, dataSource: 'simulated' }
  ],
  missions: [
    { id: 'MIS-ISS-26', name: 'Expedition 74', code: 'ISS-74', phase: 'in-flight', startDate: ago(60), endDate: ago(-120), status: 'active', dataSource: 'simulated' },
    { id: 'MIS-LUNAR-27', name: 'Lunar Analog 2027', code: 'LUNA-27', phase: 'preflight', startDate: ago(-15), endDate: ago(-180), status: 'planned', dataSource: 'simulated' }
  ],
  baselineAssessments: [
    { id: 'BASE-001', astronautId: 'AST-001', date: ago(55), missionPhase: 'preflight', forceProduction: 120, forceUnit: 'N', movementVelocity: 1.5, velocityUnit: 'm/s', jointRom: 112, romUnit: 'deg', movementConsistency: 94, functionalScore: 88, notes: 'Fictional baseline example.', dataSource: 'simulated' },
    { id: 'BASE-002', astronautId: 'AST-002', date: ago(50), missionPhase: 'preflight', forceProduction: 116, forceUnit: 'N', movementVelocity: 1.42, velocityUnit: 'm/s', jointRom: 110, romUnit: 'deg', movementConsistency: 92, functionalScore: 86, notes: 'Fictional baseline example.', dataSource: 'simulated' },
    { id: 'BASE-003', astronautId: 'AST-003', date: ago(10), missionPhase: 'preflight', forceProduction: 124, forceUnit: 'N', movementVelocity: 1.54, velocityUnit: 'm/s', jointRom: 114, romUnit: 'deg', movementConsistency: 95, functionalScore: 91, notes: 'Fictional baseline example.', dataSource: 'simulated' }
  ],
  exerciseRecords: Array.from({ length: 18 }, (_, i) => {
    const a = i % 2 === 0 ? 'AST-001' : 'AST-002';
    const type = ['Resistance training', 'Treadmill', 'Cycle ergometer', 'Functional exercise'][i % 4];
    return { id: `EX-${String(i + 1).padStart(3, '0')}`, astronautId: a, date: ago(17 - i), category: type, equipment: ['ARED', 'Treadmill', 'CEVIS', 'ROCKY'][i % 4], resistance: type === 'Resistance training' ? 65 + (i % 5) * 5 : null, workload: type === 'Cycle ergometer' ? 110 + (i % 4) * 10 : null, speed: type === 'Treadmill' ? 4.2 + (i % 3) * 0.2 : null, sets: type === 'Resistance training' ? 3 : null, repetitions: type === 'Resistance training' ? 10 + (i % 4) : 12, durationMinutes: 25 + (i % 4) * 5, distanceKm: type === 'Cycle ergometer' ? 8 + (i % 3) : null, harnessLoad: type === 'Treadmill' ? 70 + (i % 3) * 5 : null, status: i % 6 === 0 ? 'missed' : 'completed', prescribed: true, missionPhase: a === 'AST-001' ? 'in-flight' : 'in-flight', notes: 'Fictional demonstration exercise record.', dataSource: 'simulated', createdAt: ago(17 - i) };
  }),
  sensorMeasurements: Array.from({ length: 24 }, (_, i) => ({ id: `SNS-${String(i + 1).padStart(3, '0')}`, astronautId: i % 2 ? 'AST-001' : 'AST-002', sensorType: ['IMU', 'Force', 'Pressure/Insole'][i % 3], metric: ['movementVelocity', 'forceProduction', 'pressureDistribution'][i % 3], value: [1.3 + (i % 5) * 0.04, 108 + (i % 6) * 2, 42 + (i % 8) * 1.3][i % 3], unit: ['m/s', 'N', 'kPa'][i % 3], timestamp: ago(23 - i), exerciseSessionId: `EX-${String((i % 18) + 1).padStart(3, '0')}`, missionPhase: 'in-flight', dataSource: 'simulated', notes: 'Simulated sensor demonstration reading.' })),
  performanceAssessments: [
    ...Array.from({ length: 8 }, (_, i) => ({ id: `PERF-A-${i + 1}`, astronautId: 'AST-001', date: ago(48 - i * 6), missionPhase: i === 0 ? 'preflight' : 'in-flight', forceProduction: [120, 119, 117, 116, 114, 112, 110, 108][i], movementVelocity: [1.5, 1.48, 1.47, 1.45, 1.44, 1.42, 1.4, 1.38][i], jointRom: [112, 112, 111, 111, 110, 109, 108, 108][i], movementConsistency: [94, 94, 93, 92, 92, 91, 90, 90][i], functionalScore: [88, 88, 87, 87, 86, 85, 85, 84][i], dataSource: 'simulated', notes: 'Fictional longitudinal demonstration data.' })),
    ...Array.from({ length: 5 }, (_, i) => ({ id: `PERF-B-${i + 1}`, astronautId: 'AST-002', date: ago(35 - i * 7), missionPhase: i === 0 ? 'preflight' : 'in-flight', forceProduction: 116 + i, movementVelocity: 1.42 + i * 0.01, jointRom: 110 + i * 0.5, movementConsistency: 92 + i * 0.3, functionalScore: 86 + i * 0.4, dataSource: 'simulated', notes: 'Fictional longitudinal demonstration data.' }))
  ],
  insights: [
    { id: 'INS-001', astronautId: 'AST-001', metric: 'Force production', baseline: 120, current: 108, unit: 'N', difference: -12, percentageChange: -10, severity: 'attention', missionPhase: 'in-flight', explanation: 'The latest fictional demonstration measurement is 10% below the stored individual baseline. Review the measurement history and context.', suggestedAction: 'Consider review by an authorised specialist if the change persists.', status: 'new', missionPhase: 'in-flight', createdAt: ago(1), dataSource: 'rule-based' }
  ],
  alerts: [
    { id: 'ALT-001', astronautId: 'AST-001', category: 'Performance change', severity: 'attention', metric: 'Force production', baseline: 120, current: 108, difference: -12, description: 'Demonstration alert: force production differs from the stored baseline. This is not a diagnosis.', status: 'open', missionPhase: 'in-flight', createdAt: ago(1), dataSource: 'rule-based' },
    { id: 'ALT-002', astronautId: 'AST-002', category: 'Exercise adherence', severity: 'info', metric: 'Completed sessions', baseline: null, current: 8, difference: null, description: 'One or more prescribed demonstration sessions have not been marked completed.', status: 'acknowledged', missionPhase: 'in-flight', createdAt: ago(2), dataSource: 'rule-based' }
  ],
  reports: [],
  users: [{ id: 'USR-001', name: 'Demo Administrator', role: 'Administrator', email: 'admin@example.test', dataSource: 'simulated' }],
  settings: [{ id: 'system', appName: 'OrbitMSK', demoMode: true, analysisThresholds: { forceProductionPercent: 8, movementVelocityPercent: 8, jointRomPercent: 8, adherencePercent: 80 }, thresholdNote: 'Illustrative prototype thresholds only; not NASA-approved or clinical limits.', notifications: true, updatedAt: now }],
  auditLogs: []
};
