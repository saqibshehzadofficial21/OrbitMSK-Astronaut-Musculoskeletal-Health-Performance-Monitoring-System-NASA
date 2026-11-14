import { createContext, useContext, useMemo, useState } from 'react';
const GlobalFiltersContext = createContext(null);
export function GlobalFiltersProvider({ children }) {
  const [astronautId, setAstronautId] = useState('');
  const [missionPhase, setMissionPhase] = useState('');
  const value = useMemo(() => ({ astronautId, setAstronautId, missionPhase, setMissionPhase }), [astronautId, missionPhase]);
  return <GlobalFiltersContext.Provider value={value}>{children}</GlobalFiltersContext.Provider>;
}
export function useGlobalFilters() { return useContext(GlobalFiltersContext) || { astronautId: '', setAstronautId: () => {}, missionPhase: '', setMissionPhase: () => {} }; }
