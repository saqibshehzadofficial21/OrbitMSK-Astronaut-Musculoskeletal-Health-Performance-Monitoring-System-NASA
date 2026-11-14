import { LoaderCircle } from 'lucide-react';
export default function LoadingState({ label = 'Loading mission data…' }) { return <div className="loading-state"><LoaderCircle className="spin" size={22}/><span>{label}</span></div>; }
