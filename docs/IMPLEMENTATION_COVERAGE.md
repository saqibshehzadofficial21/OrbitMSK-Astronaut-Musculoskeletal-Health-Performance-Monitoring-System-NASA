# Implementation coverage against the supplied brief

| Brief requirement | Prototype implementation |
|---|---|
| Astronaut profile and mission information | Astronaut CRUD, profile detail, mission identifier and phase fields |
| Individual baseline assessments | Baseline CRUD with force, movement velocity, ROM, consistency and functional score |
| Exercise countermeasures | Exercise CRUD, prescribed/completed status, duration, resistance, sets, repetitions, treadmill and cycle fields |
| ARED, treadmill, CEVIS and ROCKY records | Equipment selector and equipment-specific stored exercise record values |
| Exercise history and adherence | Stored records, filters, summary KPIs and equipment duration visualisation |
| IMU, force and pressure/insoles sensor types | Sensor measurement CRUD and seeded simulated sensor rows |
| Muscle performance indicators | Performance assessment CRUD and force/velocity trend charts with baseline comparisons |
| Adaptive insights | Deterministic baseline comparison and adherence analysis engine |
| Alert categories and review workflow | Alert CRUD, filters, mark reviewed action, status handling |
| Reports and history | Stored report snapshot, CSV download and browser print-to-PDF workflow |
| Preflight, in-flight, postflight | Shared global filter plus record-level mission phase |
| Data provenance | `dataSource` labels for simulated, manual, and rule-based records |
| Scientific limitations | UI and documentation disclaimers; no atrophy, osteoporosis, muscle-mass or BMD diagnosis claims |

## Explicit prototype limitations

- No live hardware connection to IMU, force, pressure/insoles, ARED, treadmill, CEVIS or ROCKY.
- No LLM API provider is connected; insights are rule-based and explainable.
- No production authentication or enforceable role-based access control.
- JSON files are local prototype persistence, not a production transactional data store.
- PDF output uses the browser's print dialog; CSV export is directly implemented.
- Supplied records are fictional demonstration data, not actual astronaut or NASA data.
