
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  Upload, Download, Trash2, Terminal, XCircle, Eraser, RefreshCw, ChevronDown, 
  Activity, Zap, Layers, PlayCircle, Info, BookOpen, HardDrive, AlertTriangle, 
  Loader2, Plus, Eye, Code, Type as TypeIcon, Settings2, Brackets, Wand2, 
  Search, ArrowRight, CornerDownLeft, X, FileDown, HelpCircle, StopCircle, Clock
} from 'lucide-react';
import { RowData, LogEntry, StepStatus, NLUData, VOCAB, NLUFrame, NLUFrameRole } from './types';
import * as Gemini from './services/geminiService';
import { CANONICAL_CSV } from './data/canonicalData';

const STORAGE_KEY = 'picto_pipeline_v5_final';

const parseDataContent = (text: string): string[][] => {
  const hasTabs = text.includes('\t');
  const separator = hasTabs ? '\t' : ',';
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    if (inQuotes) {
      if (char === '"' && nextChar === '"') { currentField += '"'; i++; }
      else if (char === '"') inQuotes = false;
      else currentField += char;
    } else {
      if (char === '"') inQuotes = true;
      else if (char === separator) { currentRow.push(currentField.trim()); currentField = ''; }
      else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') i++; 
        currentRow.push(currentField.trim());
        if (currentRow.some(f => f !== "")) rows.push(currentRow);
        currentRow = []; currentField = '';
      } else currentField += char;
    }
  }
  if (currentField || currentRow.length > 0) { currentRow.push(currentField.trim()); rows.push(currentRow); }
  return rows;
};

const App: React.FC = () => {
  const [rows, setRows] = useState<RowData[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const stopFlags = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) setRows(parsed); } catch (e) {}
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
  }, [rows, isLoaded]);

  const addLog = (type: 'info' | 'error' | 'success', message: string) => {
    setLogs(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toLocaleTimeString(), type, message }]);
  };

  const processContent = (text: string) => {
    const data = parseDataContent(text);
    if (data.length < 1) return;
    const startIdx = data[0][0].toUpperCase().includes('UTTERANCE') ? 1 : 0;
    const newRows: RowData[] = data.slice(startIdx).map((parts, i) => {
      const clean = (v: string) => (!v || v === '{empty}') ? undefined : v;
      if (!parts[0]) return null;
      let nlu: any; try { nlu = parts[1] ? JSON.parse(parts[1]) : undefined; } catch(e){}
      return {
        id: `R_${Date.now()}_${i}`, text: parts[0], nlu: nlu || parts[1],
        visualBlocks: clean(parts[2]), prompt: clean(parts[3]), svgCode: clean(parts[4]),
        status: clean(parts[4]) ? 'completed' : 'idle',
        nluStatus: parts[1] ? 'completed' : 'idle',
        visualStatus: parts[2] ? 'completed' : 'idle',
        svgStatus: parts[4] ? 'completed' : 'idle'
      } as RowData;
    }).filter((r): r is RowData => r !== null);
    setRows(prev => [...newRows, ...prev]);
    addLog('success', `Cargadas ${newRows.length} filas.`);
  };

  const updateRow = (index: number, updates: Partial<RowData>) => {
    setRows(prev => {
      const updated = [...prev];
      if (!updated[index]) return prev;
      const old = updated[index];
      let nextRow = { ...old, ...updates };
      if (updates.nlu !== undefined) { 
        nextRow.isManualNlu = true; 
        if (nextRow.visualStatus === 'completed') nextRow.visualStatus = 'outdated';
        if (nextRow.svgStatus === 'completed') nextRow.svgStatus = 'outdated';
      }
      if (updates.visualBlocks !== undefined || updates.prompt !== undefined) {
        nextRow.isManualVisual = true;
        if (nextRow.svgStatus === 'completed') nextRow.svgStatus = 'outdated';
      }
      if (updates.svgCode !== undefined) nextRow.isManualSvg = true;
      updated[index] = nextRow;
      return updated;
    });
  };

  const stopStep = (rowId: string) => {
    stopFlags.current[rowId] = true;
    addLog('info', `Petición de parada para fila ${rowId.substring(rowId.length-4)}`);
  };

  const processStep = async (index: number, step: 'nlu' | 'visual' | 'svg'): Promise<boolean> => {
    const row = rows[index];
    if (!row) return false;
    stopFlags.current[row.id] = false;
    const statusKey = `${step}Status` as keyof RowData;
    const durationKey = `${step}Duration` as keyof RowData;
    updateRow(index, { [statusKey]: 'processing' as StepStatus });
    addLog('info', `Iniciando ${step.toUpperCase()} para: "${row.text}"`);
    
    const startTime = Date.now();
    try {
      let result: any;
      if (step === 'nlu') result = await Gemini.generateNLU(row.text);
      else if (step === 'visual') result = await Gemini.generateVisualBlueprint(typeof row.nlu === 'string' ? JSON.parse(row.nlu) : row.nlu as NLUData);
      else if (step === 'svg') result = await Gemini.generateSVG(row.visualBlocks || '', row.prompt || '', row.text);

      if (stopFlags.current[row.id]) {
        updateRow(index, { [statusKey]: 'idle' });
        addLog('info', `Proceso ${step} detenido por el usuario.`);
        return false;
      }

      const duration = (Date.now() - startTime) / 1000;
      const updates: any = { [statusKey]: 'completed', [durationKey]: duration };
      if (step === 'nlu') updates.nlu = result;
      else if (step === 'visual') { updates.visualBlocks = result.visualBlocks; updates.prompt = result.prompt; }
      else if (step === 'svg') { updates.svgCode = result; updates.status = 'completed'; }
      
      updateRow(index, updates);
      addLog('success', `${step.toUpperCase()} finalizado en ${duration.toFixed(1)}s`);
      return true;
    } catch (err) {
      updateRow(index, { [statusKey]: 'error' });
      addLog('error', `Error en ${step}: ${err}`);
      return false;
    }
  };

  const downloadTemplate = () => {
    const content = "UTTERANCE\tNLU\tVISUAL-BLOCKS\tPROMPT\tSVG\nQuiero beber agua.\t{empty}\t{empty}\t{empty}\t{empty}";
    const blob = new Blob([content], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = "picto_template.tsv"; a.click();
  };

  const exportTSV = () => {
    const headers = ["UTTERANCE", "NLU", "VISUAL-BLOCKS", "PROMPT", "SVG"];
    const content = rows.map(r => [r.text, JSON.stringify(r.nlu || {}), r.visualBlocks || '', r.prompt || '', r.svgCode || ''].join('\t')).join('\n');
    const blob = new Blob([headers.join('\t') + '\n' + content], { type: 'text/tab-separated-values' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = `picto_export_${Date.now()}.tsv`; a.click();
  };

  const suggestions = useMemo(() => searchValue ? rows.filter(r => r.text.toLowerCase().includes(searchValue.toLowerCase())).slice(0, 5) : [], [searchValue, rows]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="h-16 sticky top-0 bg-white/80 backdrop-blur-md border-b z-40 flex items-center px-6 justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg"><Layers size={20} /></div>
          <div>
            <h1 className="font-black uppercase tracking-tight text-lg">Pictolabs <span className="text-indigo-600">v3.5</span></h1>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">{rows.length} Filas</span>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-8 relative">
          <div className={`flex items-center bg-slate-100 rounded-2xl px-4 py-2 border-2 transition-all ${isSearching ? 'border-indigo-400 bg-white ring-4 ring-indigo-50' : 'border-transparent'}`}>
            <Search size={16} className="text-slate-400" />
            <input 
              ref={searchInputRef} value={searchValue} onFocus={() => setIsSearching(true)} onBlur={() => setTimeout(() => setIsSearching(false), 200)}
              onChange={(e) => setSearchValue(e.target.value)} onKeyDown={(e) => {
                if(e.key === 'Enter') {
                  const match = rows.find(r => r.text.toLowerCase() === searchValue.toLowerCase());
                  if (match) { setOpenRowId(match.id); rowRefs.current[match.id]?.scrollIntoView({ behavior:'smooth', block:'center' }); setSearchValue(''); }
                  else if(searchValue.trim()){ const id=`U_${Date.now()}`; setRows([{id, text:searchValue, status:'idle', nluStatus:'idle', visualStatus:'idle', svgStatus:'idle'}, ...rows]); setSearchValue(''); setTimeout(()=>setOpenRowId(id), 200); }
                }
              }}
              placeholder="Buscar o crear..." className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold ml-3"
            />
          </div>
          {isSearching && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-2xl shadow-2xl z-50">
              {suggestions.map(s => <div key={s.id} onClick={() => { setOpenRowId(s.id); rowRefs.current[s.id]?.scrollIntoView({behavior:'smooth'}); setSearchValue(''); }} className="p-3 hover:bg-indigo-50 cursor-pointer text-sm font-bold flex items-center justify-between"><span>{s.text}</span> <ArrowRight size={14} className="text-indigo-400"/></div>)}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={exportTSV} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"><Download size={14}/> TSV</button>
          <button onClick={() => setShowConsole(!showConsole)} className="p-2.5 hover:bg-slate-100 rounded-xl"><Terminal size={18}/></button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {rows.length === 0 ? (
          <div className="py-20 text-center space-y-12 max-w-4xl mx-auto">
            <div className="space-y-4">
              <div className="inline-flex gap-2 bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100"><Wand2 size={12}/> AI Pipeline v3.5</div>
              <h2 className="text-7xl font-black tracking-tighter leading-[0.85]">Diseña lo <span className="text-indigo-600 italic">Invisible.</span></h2>
              <p className="text-slate-400 text-lg">Arquitectura de pictogramas semánticos. Usa el buscador o el dataset canónico.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border text-left space-y-4">
                <HelpCircle className="text-amber-500" size={32}/>
                <h3 className="font-bold">Esquema 5 Columnas</h3>
                <p className="text-xs text-slate-400 leading-relaxed">UTTERANCE, NLU, VISUAL-BLOCKS, PROMPT, SVG. Flujo lineal y robusto.</p>
                <button onClick={downloadTemplate} className="w-full py-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-[10px] font-black flex items-center justify-center gap-2"><FileDown size={14}/> Plantilla</button>
              </div>
              <button onClick={() => processContent(CANONICAL_CSV)} className="bg-white p-8 rounded-[2.5rem] border text-left space-y-4 hover:shadow-xl transition-all group">
                <div className="bg-indigo-50 text-indigo-600 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all"><BookOpen size={24}/></div>
                <h3 className="font-bold">Dataset Canónico</h3>
                <p className="text-xs text-slate-400">Carga las 500 filas originales listas para procesar.</p>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-600 text-white p-8 rounded-[2.5rem] space-y-4 hover:bg-indigo-700 transition-all text-left">
                <Upload size={32}/>
                <h3 className="font-bold text-xl">Importar TSV</h3>
                <p className="text-xs opacity-70">Sube tus archivos de Google Sheets.</p>
                <input ref={fileInputRef} type="file" className="hidden" onChange={e => e.target.files?.[0] && e.target.files[0].text().then(processContent)}/>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 pb-40">
            {rows.map((row, idx) => (
              <RowComponent 
                key={row.id} row={row} isOpen={openRowId === row.id} setIsOpen={v => setOpenRowId(v ? row.id : null)}
                onUpdate={u => updateRow(idx, u)} domRef={el => rowRefs.current[row.id] = el}
                onProcessStep={s => processStep(idx, s)} onStopStep={() => stopStep(row.id)}
                onRunCascade={() => {
                  processStep(idx, 'nlu').then(ok => ok && processStep(idx, 'visual').then(ok2 => ok2 && processStep(idx, 'svg')));
                }}
                onDelete={() => { if(confirm("¿Borrar permanentemente?")) setRows(prev => prev.filter(r => r.id !== row.id)); }}
              />
            ))}
          </div>
        )}
      </main>

      {showConsole && (
        <div className="fixed bottom-0 inset-x-0 h-64 bg-slate-950 text-indigo-300 font-mono text-[10px] p-6 z-50 border-t overflow-auto shadow-2xl">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/10 uppercase tracking-widest text-slate-500 font-black">
            <span>Traceback Console</span> <button onClick={() => setLogs([])}>Flush</button>
          </div>
          {logs.slice().reverse().map(l => (
            <div key={l.id} className="flex gap-4 mb-1">
              <span className="opacity-40 shrink-0">[{l.timestamp}]</span>
              <span className={`font-black shrink-0 w-16 ${l.type === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>{l.type.toUpperCase()}</span>
              <span>{l.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const RowComponent: React.FC<{
  row: RowData; isOpen: boolean; setIsOpen: (v: boolean) => void; 
  onUpdate: (u: any) => void; domRef: (el: any) => void;
  onProcessStep: (s: any) => Promise<boolean>; onStopStep: () => void;
  onRunCascade: () => void; onDelete: () => void;
}> = ({ row, isOpen, setIsOpen, onUpdate, domRef, onProcessStep, onStopStep, onRunCascade, onDelete }) => {
  
  const getBG = (status: StepStatus) => {
    if (status === 'processing') return 'bg-indigo-50/50 border-indigo-200 animate-pulse';
    if (status === 'completed') return 'bg-emerald-50/50 border-emerald-100';
    if (status === 'outdated') return 'bg-amber-50 border-amber-300';
    if (status === 'error') return 'bg-rose-50 border-rose-200';
    return 'bg-slate-50 border-slate-200';
  };

  return (
    <div ref={domRef} className={`bg-white border rounded-[2rem] transition-all ${isOpen ? 'ring-4 ring-indigo-500/10 shadow-2xl z-20' : 'hover:border-indigo-300'}`}>
      <div className="p-6 flex items-center gap-8 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <span className="text-[10px] font-mono text-slate-300 tabular-nums w-12">{row.id.substring(row.id.length-4)}</span>
        <div className="flex-1 text-lg font-black text-slate-900 truncate">{row.text}</div>
        <div className="flex gap-2">
          <Badge label="NLU" status={row.nluStatus} duration={row.nluDuration} />
          <Badge label="BLU" status={row.visualStatus} duration={row.visualDuration} />
          <Badge label="SVG" status={row.svgStatus} duration={row.svgDuration} />
        </div>
        <div className="w-16 h-16 bg-white border rounded-xl flex items-center justify-center p-2 shadow-inner" dangerouslySetInnerHTML={{ __html: row.svgCode || '' }} />
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={e => { e.stopPropagation(); onRunCascade(); }} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg active:scale-95"><PlayCircle size={20}/></button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl active:scale-95 transition-colors"><Trash2 size={20}/></button>
        </div>
        <ChevronDown size={20} className={`text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="p-8 border-t grid grid-cols-3 gap-8 bg-slate-50/30 rounded-b-[2rem]">
          <StepBox title="1. NLU" status={row.nluStatus} duration={row.nluDuration} onAction={() => onProcessStep('nlu')} onStop={onStopStep} bg={getBG(row.nluStatus)}>
            <div className="h-full bg-white rounded-2xl border p-4 font-mono text-[10px] overflow-auto max-h-[400px]">
              <pre>{JSON.stringify(row.nlu, null, 2)}</pre>
            </div>
          </StepBox>
          <StepBox title="2. Visual Blueprint" status={row.visualStatus} duration={row.visualDuration} onAction={() => onProcessStep('visual')} onStop={onStopStep} bg={getBG(row.visualStatus)}>
             <div className="space-y-4 flex flex-col h-full">
               <textarea value={row.visualBlocks} onChange={e => onUpdate({visualBlocks: e.target.value})} className="flex-1 w-full bg-white border rounded-2xl p-4 text-[11px] font-bold focus:ring-4 focus:ring-indigo-100 outline-none" placeholder="VISUAL-BLOCKS IDs" />
               <textarea value={row.prompt} onChange={e => onUpdate({prompt: e.target.value})} className="h-24 w-full bg-white border rounded-2xl p-4 text-[10px] italic text-slate-500 focus:ring-4 focus:ring-indigo-100 outline-none" placeholder="PROMPT" />
             </div>
          </StepBox>
          <StepBox title="3. SVG Coder" status={row.svgStatus} duration={row.svgDuration} onAction={() => onProcessStep('svg')} onStop={onStopStep} bg={getBG(row.svgStatus)}>
            <div className="space-y-4 flex flex-col h-full">
              <textarea value={row.svgCode} onChange={e => onUpdate({svgCode: e.target.value})} className="flex-1 w-full bg-slate-900 text-emerald-400 border-none rounded-2xl p-4 text-[10px] font-mono leading-relaxed" placeholder="<svg>..." />
              <div className="h-32 bg-white border rounded-2xl flex items-center justify-center p-4 shadow-inner" dangerouslySetInnerHTML={{ __html: row.svgCode || '<div class="text-slate-200 uppercase font-black tracking-widest text-[10px]">Preview</div>' }} />
            </div>
          </StepBox>
        </div>
      )}
    </div>
  );
};

const StepBox: React.FC<{ title: string; status: StepStatus; duration?: number; onAction: () => void; onStop: () => void; children: React.ReactNode; bg: string }> = ({ title, status, duration, onAction, onStop, children, bg }) => (
  <div className={`flex flex-col gap-4 min-h-[500px] transition-colors p-6 rounded-[2rem] border-2 ${bg}`}>
    <div className="flex items-center justify-between">
      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
        {title} {duration && <span className="text-indigo-400 flex items-center gap-1 font-mono"><Clock size={10}/>{duration.toFixed(1)}s</span>}
      </h4>
      {status === 'processing' ? (
        <button onClick={onStop} className="p-2 bg-rose-500 text-white rounded-lg animate-pulse"><StopCircle size={16}/></button>
      ) : (
        <button onClick={onAction} className="p-2 bg-white border hover:border-indigo-500 hover:text-indigo-600 rounded-lg shadow-sm transition-all active:scale-90"><RefreshCw size={16}/></button>
      )}
    </div>
    <div className="flex-1 relative">{children}</div>
  </div>
);

const Badge: React.FC<{ label: string; status: StepStatus; duration?: number }> = ({ label, status, duration }) => {
  const styles = {
    idle: 'bg-slate-100 text-slate-400',
    processing: 'bg-indigo-100 text-indigo-600 animate-pulse',
    completed: 'bg-emerald-100 text-emerald-700',
    outdated: 'bg-amber-100 text-amber-700',
    error: 'bg-rose-100 text-rose-600'
  };
  return (
    <div className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1 border border-black/5 ${styles[status]}`}>
      {label} {duration && <span>{duration.toFixed(0)}s</span>}
    </div>
  );
};

export default App;
