
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  Upload, Download, Trash2, Terminal, XCircle, Eraser, RefreshCw, ChevronDown, 
  Activity, Zap, Layers, PlayCircle, Info, BookOpen, HardDrive, AlertTriangle, 
  Loader2, Plus, Eye, Code, Type as TypeIcon, Settings2, Brackets, Wand2, 
  Search, ArrowRight, CornerDownLeft, X, FileDown, HelpCircle, StopCircle, Clock,
  Sliders, Home, Sparkles
} from 'lucide-react';
import { RowData, LogEntry, StepStatus, NLUData, VOCAB, NLUFrame, NLUFrameRole, GlobalConfig } from './types';
import * as Gemini from './services/geminiService';
import { CANONICAL_CSV } from './data/canonicalData';

const STORAGE_KEY = 'pipeliner_v5_storage';
const CONFIG_KEY = 'pipeliner_v5_config';

const PipelineIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <circle cx="4" cy="12" r="3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    <circle cx="21" cy="12" r="3" fill="currentColor" stroke="none" />
  </svg>
);

const parseDataContent = (text: string): string[][] => {
  const hasTabs = text.includes('\t');
  const separator = hasTabs ? '\t' : ',';
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i+1];
    if (inQuotes) {
      if (char === '"' && nextChar === '"') { currentField += '"'; i++; }
      else if (char === '"') inQuotes = false;
      else currentField += char;
    } else {
      if (char === '"') inQuotes = true;
      else if (char === separator) { currentRow.push(currentField); currentField = ''; }
      else if (char === '\n' || char === '\r') {
        currentRow.push(currentField);
        if (currentRow.some(f => f.trim() !== "")) rows.push(currentRow);
        currentRow = []; currentField = '';
        if (char === '\r' && nextChar === '\n') i++;
      } else currentField += char;
    }
  }
  if (currentField || currentRow.length > 0) { currentRow.push(currentField); rows.push(currentRow); }
  return rows;
};

const App: React.FC = () => {
  const [rows, setRows] = useState<RowData[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<'home' | 'list'>('home');
  
  const [config, setConfig] = useState<GlobalConfig>({
    lang: 'es-ES',
    svgSize: 100,
    author: 'PictoNet Team',
    license: 'CC BY 4.0'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const stopFlags = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedConfig = localStorage.getItem(CONFIG_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setRows(parsed);
          if (parsed.length > 0) setViewMode('list');
        }
      } catch (e) { console.error("Load rows error", e); }
    }
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsed }));
      } catch (e) { console.error("Load config error", e); }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    }
  }, [rows, config, isLoaded]);

  const addLog = (type: 'info' | 'error' | 'success', message: string) => {
    setLogs(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toLocaleTimeString(), type, message }]);
  };

  const processContent = (text: string) => {
    const data = parseDataContent(text);
    if (data.length < 1) return;
    const startIdx = data[0][0].toUpperCase().includes('UTTERANCE') ? 1 : 0;
    const newRows: RowData[] = data.slice(startIdx).map((parts, i) => {
      if (!parts[0]) return null;
      let nlu: any;
      let rawNlu = parts[1]?.trim() || '';
      if (rawNlu && rawNlu !== '{empty}') {
        try { nlu = JSON.parse(rawNlu); } catch(e) { nlu = rawNlu; }
      }
      return {
        id: `R_${Date.now()}_${i}`, 
        text: parts[0], 
        nlu: nlu,
        visualBlocks: (!parts[2] || parts[2] === '{empty}') ? undefined : parts[2], 
        prompt: (!parts[3] || parts[3] === '{empty}') ? undefined : parts[3], 
        svgCode: (!parts[4] || parts[4] === '{empty}') ? undefined : parts[4],
        status: (parts[4] && parts[4] !== '{empty}') ? 'completed' : 'idle',
        nluStatus: (rawNlu && rawNlu !== '{empty}') ? 'completed' : 'idle',
        visualStatus: (parts[2] && parts[2] !== '{empty}') ? 'completed' : 'idle',
        svgStatus: (parts[4] && parts[4] !== '{empty}') ? 'completed' : 'idle'
      } as RowData;
    }).filter((r): r is RowData => r !== null);
    setRows(prev => [...newRows, ...prev]);
    setViewMode('list');
    addLog('success', `Importación exitosa de ${newRows.length} filas.`);
  };

  const updateRow = (index: number, updates: Partial<RowData>) => {
    setRows(prev => {
      const updated = [...prev];
      if (!updated[index]) return prev;
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  };

  const processStep = async (index: number, step: 'nlu' | 'visual' | 'svg'): Promise<boolean> => {
    const row = rows[index];
    if (!row) return false;
    stopFlags.current[row.id] = false;
    const statusKey = `${step}Status` as keyof RowData;
    const durationKey = `${step}Duration` as keyof RowData;
    setRows(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [statusKey]: 'processing' };
      return next;
    });
    addLog('info', `Ejecutando ${step.toUpperCase()} para: "${row.text}"`);
    const startTime = Date.now();
    try {
      let result: any;
      if (step === 'nlu') result = await Gemini.generateNLU(row.text);
      else if (step === 'visual') {
        const nluData = typeof row.nlu === 'string' ? JSON.parse(row.nlu) : row.nlu;
        if (!nluData) throw new Error("NLU ausente");
        result = await Gemini.generateVisualBlueprint(nluData as NLUData);
      } else if (step === 'svg') {
        if (!row.visualBlocks || !row.prompt) throw new Error("Faltan Bloques Visuales o Prompt.");
        result = await Gemini.generateSVG(row.visualBlocks, row.prompt, row, config);
      }
      if (stopFlags.current[row.id]) {
        updateRow(index, { [statusKey]: 'idle' });
        return false;
      }
      const duration = (Date.now() - startTime) / 1000;
      updateRow(index, { 
        [statusKey]: 'completed', 
        [durationKey]: duration,
        ...(step === 'nlu' ? { nlu: result } : {}),
        ...(step === 'visual' ? { visualBlocks: result.visualBlocks, prompt: result.prompt } : {}),
        ...(step === 'svg' ? { svgCode: result, status: 'completed' } : {})
      });
      addLog('success', `${step.toUpperCase()} terminado en ${duration.toFixed(1)}s`);
      return true;
    } catch (err: any) {
      updateRow(index, { [statusKey]: 'error' });
      addLog('error', `Error: ${err.message || "Fallo inesperado"}`);
      return false;
    }
  };

  const exportTSV = () => {
    const headers = ["UTTERANCE", "NLU", "VISUAL-BLOCKS", "PROMPT", "SVG"];
    const wrap = (val: any) => {
      let s = typeof val === 'object' ? JSON.stringify(val) : (val || '{empty}');
      if (s.includes('\t') || s.includes('\n') || s.includes('"')) {
        s = '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };
    const content = rows.map(r => [
      wrap(r.text), wrap(r.nlu), wrap(r.visualBlocks), wrap(r.prompt), wrap(r.svgCode)
    ].join('\t')).join('\n');
    const blob = new Blob([headers.join('\t') + '\n' + content], { type: 'text/tab-separated-values' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pipeliner_full_export_${new Date().toISOString().slice(0,10)}.tsv`;
    a.click();
  };

  const downloadTemplate = () => {
    const content = "UTTERANCE\tNLU\tVISUAL-BLOCKS\tPROMPT\tSVG\nQuiero beber agua.\t{empty}\t{empty}\t{empty}\t{empty}";
    const blob = new Blob([content], { type: 'text/tab-separated-values' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = "pipeliner_template.tsv"; a.click();
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if(e.key === 'Enter') {
      const match = rows.find(r => r.text.toLowerCase() === searchValue.toLowerCase());
      if (match) {
        setViewMode('list');
        setOpenRowId(match.id);
        setTimeout(() => rowRefs.current[match.id]?.scrollIntoView({ behavior:'smooth', block:'center' }), 100);
        setSearchValue('');
      } else if(searchValue.trim()) {
        const id = `U_${Date.now()}`;
        const newRow: RowData = {id, text: searchValue, status:'idle', nluStatus:'idle', visualStatus:'idle', svgStatus:'idle'};
        setRows([newRow, ...rows]);
        setViewMode('list');
        setSearchValue('');
        setTimeout(() => {
          setOpenRowId(id);
          rowRefs.current[id]?.scrollIntoView({ behavior:'smooth', block:'center' });
        }, 150);
      }
    }
  };

  const suggestions = useMemo(() => searchValue ? rows.filter(r => r.text.toLowerCase().includes(searchValue.toLowerCase())).slice(0, 5) : [], [searchValue, rows]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="h-14 sticky top-0 bg-white/95 backdrop-blur-sm border-b z-40 flex items-center px-6 justify-between shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setViewMode('home')}>
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <PipelineIcon size={20} />
          </div>
          <div>
            <h1 className="font-black uppercase tracking-tight text-lg leading-none text-slate-900">PipeLiner <span className="text-indigo-600">v1.2</span></h1>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">{rows.length} Filas Cargadas</span>
          </div>
        </div>

        <div className="flex-1 max-w-lg mx-8 relative">
          <div className={`flex items-center bg-slate-100 rounded-lg px-4 py-1.5 border-2 transition-all ${isSearching ? 'border-indigo-400 bg-white ring-2 ring-indigo-50' : 'border-transparent'}`}>
            <Search size={16} className="text-slate-400" />
            <input 
              ref={searchInputRef} value={searchValue} onFocus={() => setIsSearching(true)} onBlur={() => setTimeout(() => setIsSearching(false), 200)}
              onChange={(e) => setSearchValue(e.target.value)} onKeyDown={handleSearch}
              placeholder="Buscar frase o crear nueva..." className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-semibold ml-3"
            />
          </div>
          {isSearching && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-2xl z-50 overflow-hidden border-indigo-100">
              {suggestions.map(s => <div key={s.id} onClick={() => { setViewMode('list'); setOpenRowId(s.id); setTimeout(() => rowRefs.current[s.id]?.scrollIntoView({behavior:'smooth'}), 100); setSearchValue(''); }} className="p-3 hover:bg-indigo-50 cursor-pointer text-sm font-bold flex items-center justify-between border-b last:border-0"><span>{s.text}</span> <ArrowRight size={14} className="text-indigo-300"/></div>)}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {rows.length > 0 && <button onClick={exportTSV} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md active:scale-95"><Download size={14}/> Exportar TSV</button>}
          <button onClick={() => setShowConfig(!showConfig)} className={`p-2 rounded-lg transition-colors ${showConfig ? 'bg-indigo-100 text-indigo-600 border-indigo-200 border' : 'hover:bg-slate-100 text-slate-400 border border-transparent'}`}><Sliders size={18}/></button>
          <button onClick={() => setShowConsole(!showConsole)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 border border-transparent"><Terminal size={18}/></button>
        </div>
      </header>

      {showConfig && (
        <div className="bg-white border-b px-6 py-4 animate-in slide-in-from-top duration-200">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 items-end">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Idioma SVG</label>
              <input type="text" value={config.lang} onChange={e => setConfig({...config, lang: e.target.value})} className="w-full text-sm border-2 border-slate-100 rounded-lg px-3 py-2 outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">ViewBox Canvas</label>
              <input type="number" value={config.svgSize} onChange={e => setConfig({...config, svgSize: parseInt(e.target.value)})} className="w-full text-sm border-2 border-slate-100 rounded-lg px-3 py-2 outline-none focus:border-indigo-400" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Metadata Copyright</label>
              <div className="flex gap-2">
                <input type="text" value={config.author} onChange={e => setConfig({...config, author: e.target.value})} className="w-full text-sm border-2 border-slate-100 rounded-lg px-3 py-2 outline-none focus:border-indigo-400" placeholder="Autor" />
                <input type="text" value={config.license} onChange={e => setConfig({...config, license: e.target.value})} className="w-full text-sm border-2 border-slate-100 rounded-lg px-3 py-2 outline-none focus:border-indigo-400" placeholder="Licencia" />
              </div>
            </div>
            <div className="flex justify-end pb-1">
               <button onClick={() => setShowConfig(false)} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-all">Guardar y Ocultar</button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {viewMode === 'home' ? (
          <div className="py-16 text-center space-y-12 max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="space-y-4">
              <div className="inline-flex gap-3 bg-indigo-50 text-indigo-600 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-indigo-100 animate-bounce shadow-sm">
                <Sparkles size={14}/> Semantic & Pictographic Engine
              </div>
              <h2 className="text-7xl font-black tracking-tighter text-slate-900 leading-none">
                PipeLiner <span className="text-indigo-600">Architect.</span>
              </h2>
              <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                Transformamos lenguaje natural en esquemas NLU de alta fidelidad y pictogramas SVG semánticos en segundos.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-8 rounded-2xl border-2 border-slate-100 text-left space-y-4 shadow-xl hover:border-indigo-200 transition-all group">
                <div className="bg-amber-50 text-amber-600 p-3 rounded-xl w-fit group-hover:scale-110 transition-transform"><FileDown size={24}/></div>
                <h3 className="font-bold text-lg text-slate-800">Estructura NLU</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Define frames, lexical units y roles semánticos bajo el estándar MediaFranca.</p>
                <button onClick={downloadTemplate} className="w-full py-3 bg-slate-900 text-white hover:bg-indigo-600 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95">Descargar Plantilla TSV</button>
              </div>

              <div className="bg-white p-8 rounded-2xl border-2 border-slate-100 text-left space-y-4 shadow-xl hover:border-indigo-200 transition-all group">
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl w-fit group-hover:scale-110 transition-transform"><BookOpen size={24}/></div>
                <h3 className="font-bold text-lg text-slate-800">Dataset Canónico</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Carga instantáneamente 500 frases pre-configuradas para probar la potencia del motor.</p>
                <button onClick={() => processContent(CANONICAL_CSV)} className="w-full py-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all border border-indigo-100 active:scale-95">Cargar Muestrario</button>
              </div>

              <div className="bg-indigo-600 p-8 rounded-2xl text-left space-y-4 shadow-2xl hover:bg-indigo-700 transition-all group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="bg-white/20 text-white p-3 rounded-xl w-fit group-hover:-translate-y-1 transition-transform"><Upload size={24}/></div>
                <h3 className="font-bold text-lg text-white">Importar Propio</h3>
                <p className="text-sm text-indigo-100 leading-relaxed">Sube tus propios archivos TSV o CSV estructurados para iniciar el pipeline.</p>
                <div className="text-xs font-black text-white bg-indigo-500 px-4 py-2 rounded-lg text-center">Seleccionar Archivo</div>
                <input ref={fileInputRef} type="file" className="hidden" onChange={e => e.target.files?.[0]?.text().then(processContent)}/>
              </div>
            </div>

            {rows.length > 0 && (
              <button onClick={() => setViewMode('list')} className="text-indigo-600 font-bold flex items-center gap-2 mx-auto hover:underline bg-white px-6 py-3 rounded-full border shadow-sm">
                Volver al listado activo ({rows.length} filas) <ArrowRight size={16}/>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3 pb-32 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {rows.map((row, idx) => (
              <RowComponent 
                key={row.id} row={row} isOpen={openRowId === row.id} setIsOpen={v => setOpenRowId(v ? row.id : null)}
                onUpdate={u => updateRow(idx, u)} domRef={el => rowRefs.current[row.id] = el}
                onProcessStep={s => processStep(idx, s)} onStopStep={() => stopFlags.current[row.id] = true}
                onRunCascade={() => { processStep(idx, 'nlu').then(ok => ok && processStep(idx, 'visual').then(ok2 => ok2 && processStep(idx, 'svg'))); }}
                onDelete={() => { if(confirm("¿Eliminar fila permanentemente?")) setRows(prev => prev.filter(r => r.id !== row.id)); }}
              />
            ))}
          </div>
        )}
      </main>

      {showConsole && (
        <div className="fixed bottom-0 inset-x-0 h-48 bg-slate-950 text-indigo-300 font-mono text-[11px] p-4 z-50 border-t-2 border-white/10 overflow-auto shadow-2xl">
          <div className="flex justify-between items-center mb-2 pb-2 border-b border-white/10 uppercase tracking-[0.2em] text-slate-500 font-black">
            <span className="flex items-center gap-3"><Terminal size={14}/> System Trace Output</span> 
            <button onClick={() => setLogs([])} className="hover:text-rose-400 text-[10px] bg-white/5 px-3 py-1 rounded-md">FLUSH BUFFER</button>
          </div>
          {logs.slice().reverse().map(l => (
            <div key={l.id} className="flex gap-4 leading-relaxed py-1 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 rounded transition-colors">
              <span className="opacity-30 shrink-0">[{l.timestamp}]</span>
              <span className={`font-black shrink-0 w-12 ${l.type === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>{l.type.toUpperCase()}</span>
              <span className="break-all text-slate-300">{l.message}</span>
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
    if (status === 'processing') return 'bg-indigo-50/30 border-indigo-200 animate-pulse';
    if (status === 'completed') return 'bg-emerald-50/20 border-emerald-100';
    if (status === 'outdated') return 'bg-amber-50/40 border-amber-200';
    if (status === 'error') return 'bg-rose-50/40 border-rose-200';
    return 'bg-white border-slate-200 shadow-sm';
  };

  return (
    <div ref={domRef} className={`rounded-xl border-2 transition-all ${isOpen ? 'ring-4 ring-indigo-500/10 shadow-2xl z-20 translate-x-1' : 'hover:border-indigo-300 hover:shadow-md'} ${getBG(isOpen ? 'idle' : 'idle')}`}>
      <div className="p-4 flex items-center gap-6 cursor-pointer group" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex-1 text-base font-bold text-slate-800 truncate px-1">{row.text}</div>
        <div className="flex gap-2 shrink-0">
          <Badge label="NLU" status={row.nluStatus} />
          <Badge label="BLU" status={row.visualStatus} />
          <Badge label="PIC" status={row.svgStatus} />
        </div>
        <div className="w-12 h-12 bg-white border-2 border-slate-50 rounded-xl flex items-center justify-center p-1 shadow-inner overflow-hidden shrink-0 transition-transform group-hover:scale-125 group-hover:rotate-3" 
             dangerouslySetInnerHTML={{ __html: (row.svgCode || '').includes('<svg') ? row.svgCode! : '' }} />
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all ml-2">
          <button onClick={e => { e.stopPropagation(); onRunCascade(); }} className="p-2 bg-indigo-600 text-white rounded-lg shadow-lg active:scale-90 hover:bg-indigo-700" title="Correr Pipeline Completo"><PlayCircle size={18}/></button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg active:scale-90 transition-all" title="Eliminar"><Trash2 size={18}/></button>
        </div>
        <ChevronDown size={18} className={`text-slate-300 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="p-5 border-t-2 border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-50/40 rounded-b-xl animate-in slide-in-from-top-2 duration-200">
          <StepBox title="1. NLU Schema" status={row.nluStatus} onAction={() => onProcessStep('nlu')} onStop={onStopStep} bg={getBG(row.nluStatus)}>
            <div className="h-full bg-white rounded-xl border-2 border-slate-100 p-4 font-mono text-[11px] overflow-auto max-h-[400px] leading-relaxed shadow-inner">
              <pre className="text-indigo-800">{typeof row.nlu === 'object' ? JSON.stringify(row.nlu, null, 2) : (row.nlu || '// Sin datos NLU')}</pre>
            </div>
          </StepBox>
          <StepBox title="2. Bloques Visuales" status={row.visualStatus} onAction={() => onProcessStep('visual')} onStop={onStopStep} bg={getBG(row.visualStatus)}>
             <div className="space-y-4 flex flex-col h-full">
               <textarea value={row.visualBlocks || ''} onChange={e => onUpdate({visualBlocks: e.target.value})} className="flex-1 w-full bg-white border-2 border-slate-100 rounded-xl p-4 text-sm font-bold outline-none focus:border-indigo-400 resize-none shadow-inner" placeholder="Ejem: #human_head, #bed_base..." />
               <textarea value={row.prompt || ''} onChange={e => onUpdate({prompt: e.target.value})} className="h-24 w-full bg-white border-2 border-slate-100 rounded-xl p-4 text-xs italic text-slate-500 outline-none focus:border-indigo-400 resize-none shadow-inner" placeholder="Describir estrategia de dibujo..." />
             </div>
          </StepBox>
          <StepBox title="3. Pictogram" status={row.svgStatus} onAction={() => onProcessStep('svg')} onStop={onStopStep} bg={getBG(row.svgStatus)}>
            <div className="space-y-4 flex flex-col h-full">
              <textarea value={row.svgCode || ''} onChange={e => onUpdate({svgCode: e.target.value})} className="flex-1 w-full bg-slate-900 text-emerald-400 border-none rounded-xl p-4 text-[10px] font-mono leading-relaxed resize-none shadow-2xl" placeholder="Código SVG generado..." />
              <div className="h-40 bg-white border-2 border-slate-100 rounded-xl flex items-center justify-center overflow-hidden relative shadow-inner p-2 group/preview">
                 <div className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full transition-all group-hover/preview:scale-105" 
                      dangerouslySetInnerHTML={{ __html: (row.svgCode || '').includes('<svg') ? row.svgCode! : '<div class="text-xs font-black text-slate-200 uppercase tracking-widest">Esperando Render</div>' }} />
                 <div className="absolute top-2 right-2 bg-slate-900/50 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/preview:opacity-100 transition-opacity">Preview 1:1</div>
              </div>
            </div>
          </StepBox>
        </div>
      )}
    </div>
  );
};

const StepBox: React.FC<{ title: string; status: StepStatus; onAction: () => void; onStop: () => void; children: React.ReactNode; bg: string }> = ({ title, status, onAction, onStop, children, bg }) => (
  <div className={`flex flex-col gap-4 min-h-[450px] transition-colors p-5 rounded-2xl border-2 ${bg}`}>
    <div className="flex items-center justify-between px-1">
      <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500">{title}</h4>
      <div className="flex gap-2">
        {status === 'processing' ? (
          <button onClick={onStop} className="p-2 bg-rose-500 text-white rounded-lg shadow-md hover:bg-rose-600 transition-colors" title="Abortar"><StopCircle size={16}/></button>
        ) : (
          <button onClick={onAction} className="p-2 bg-white border-2 border-slate-100 hover:border-indigo-400 hover:text-indigo-600 rounded-lg shadow-sm transition-all active:scale-95" title="Regenerar"><RefreshCw size={16}/></button>
        )}
      </div>
    </div>
    <div className="flex-1 relative">{children}</div>
  </div>
);

const Badge: React.FC<{ label: string; status: StepStatus }> = ({ label, status }) => {
  const styles = {
    idle: 'bg-slate-100 text-slate-400 border-transparent',
    processing: 'bg-indigo-100 text-indigo-600 animate-pulse border-indigo-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    outdated: 'bg-amber-100 text-amber-800 border-amber-200',
    error: 'bg-rose-100 text-rose-700 border-rose-200'
  };
  return <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border-2 transition-all ${styles[status]}`}>{label}</div>;
};

export default App;
