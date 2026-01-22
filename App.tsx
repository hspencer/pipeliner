
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  Upload, Download, Trash2, Terminal, RefreshCw, ChevronDown, 
  PlayCircle, BookOpen, Search, ArrowRight, FileDown, StopCircle, Sparkles, Sliders
} from 'lucide-react';
import { RowData, LogEntry, StepStatus, NLUData, GlobalConfig } from './types';
import * as Gemini from './services/geminiService';
import { CANONICAL_CSV } from './data/canonicalData';

const STORAGE_KEY = 'pipeliner_v7_storage';
const CONFIG_KEY = 'pipeliner_v7_config';

const PipelineIcon = ({ size = 24 }: { size?: number }) => (
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-violet-200 selection:text-violet-950">
      <header className="h-20 sticky top-0 bg-white border-b z-40 flex items-center px-10 justify-between shadow-sm">
        <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setViewMode('home')}>
          <div className="bg-violet-950 p-3 rounded-md text-white">
            <PipelineIcon size={28} />
          </div>
          <div>
            <h1 className="font-black uppercase tracking-tight text-2xl leading-none text-slate-900">PipeLiner <span className="text-violet-950">v1.2</span></h1>
            <span className="text-xs text-slate-400 font-mono tracking-widest uppercase">{rows.length} Filas Cargadas</span>
          </div>
        </div>

        <div className="flex-1 max-w-2xl mx-12 relative">
          <div className={`flex items-center bg-slate-100 rounded-md px-6 py-3 border-2 transition-all ${isSearching ? 'border-violet-950 bg-white ring-4 ring-violet-50' : 'border-transparent'}`}>
            <Search size={20} className="text-slate-400" />
            <input 
              ref={searchInputRef} value={searchValue} onFocus={() => setIsSearching(true)} onBlur={() => setTimeout(() => setIsSearching(false), 200)}
              onChange={(e) => setSearchValue(e.target.value)} onKeyDown={handleSearch}
              placeholder="Buscar o crear nueva frase..." className="flex-1 bg-transparent border-none focus:ring-0 text-lg font-semibold ml-4"
            />
          </div>
          {isSearching && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-md shadow-2xl z-50 overflow-hidden border-violet-100">
              {suggestions.map(s => <div key={s.id} onClick={() => { setViewMode('list'); setOpenRowId(s.id); setTimeout(() => rowRefs.current[s.id]?.scrollIntoView({behavior:'smooth'}), 100); setSearchValue(''); }} className="p-4 hover:bg-violet-50 cursor-pointer text-base font-bold flex items-center justify-between border-b last:border-0"><span>{s.text}</span> <ArrowRight size={18} className="text-violet-300"/></div>)}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          {rows.length > 0 && <button onClick={exportTSV} className="bg-slate-900 text-white px-6 py-3 rounded-md text-sm font-bold flex items-center gap-3 hover:bg-slate-800 transition-all active:scale-95 shadow-md"><Download size={18}/> Exportar</button>}
          <button onClick={() => setShowConfig(!showConfig)} className={`p-3 rounded-md transition-colors border-2 ${showConfig ? 'bg-violet-100 text-violet-950 border-violet-950' : 'hover:bg-slate-100 text-slate-400 border-transparent'}`}><Sliders size={24}/></button>
          <button onClick={() => setShowConsole(!showConsole)} className="p-3 hover:bg-slate-100 rounded-md text-slate-400 border-2 border-transparent"><Terminal size={24}/></button>
        </div>
      </header>

      {showConfig && (
        <div className="bg-white border-b px-10 py-8 animate-in slide-in-from-top duration-300 shadow-inner">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 items-end">
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">Idioma SVG</label>
              <input type="text" value={config.lang} onChange={e => setConfig({...config, lang: e.target.value})} className="w-full text-base border-2 border-slate-100 rounded-md px-4 py-3 outline-none focus:border-violet-950" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">ViewBox Canvas</label>
              <input type="number" value={config.svgSize} onChange={e => setConfig({...config, svgSize: parseInt(e.target.value)})} className="w-full text-base border-2 border-slate-100 rounded-md px-4 py-3 outline-none focus:border-violet-950" />
            </div>
            <div>
              <label className="block text-xs font-black uppercase text-slate-400 mb-3 tracking-widest">Copyright Metadata</label>
              <div className="flex gap-4">
                <input type="text" value={config.author} onChange={e => setConfig({...config, author: e.target.value})} className="w-full text-base border-2 border-slate-100 rounded-md px-4 py-3 outline-none focus:border-violet-950" placeholder="Autor" />
                <input type="text" value={config.license} onChange={e => setConfig({...config, license: e.target.value})} className="w-full text-base border-2 border-slate-100 rounded-md px-4 py-3 outline-none focus:border-violet-950" placeholder="Licencia" />
              </div>
            </div>
            <div className="flex justify-end">
               <button onClick={() => setShowConfig(false)} className="text-sm font-bold text-violet-950 bg-violet-50 px-8 py-4 rounded-md hover:bg-violet-100 transition-all border border-violet-200">Guardar Cambios</button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-10 max-w-7xl mx-auto w-full">
        {viewMode === 'home' ? (
          <div className="py-24 text-center space-y-16 max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="space-y-6">
              <div className="inline-flex gap-4 bg-violet-50 text-violet-950 px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.25em] border border-violet-200 shadow-sm">
                <Sparkles size={18}/> Semantic Pictogram Engine
              </div>
              <h2 className="text-8xl font-black tracking-tighter text-slate-900 leading-none">
                PipeLiner <span className="text-violet-950">Architect.</span>
              </h2>
              <p className="text-slate-500 text-2xl font-medium max-w-3xl mx-auto leading-relaxed">
                Transformación de lenguaje natural a esquemas NLU MediaFranca y pictogramas SVG semánticos de alta fidelidad.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-10 rounded-md border-2 border-slate-100 text-left space-y-6 shadow-xl hover:border-violet-200 transition-all group">
                <div className="bg-amber-50 text-amber-600 p-4 rounded-md w-fit group-hover:scale-110 transition-transform"><FileDown size={32}/></div>
                <h3 className="font-bold text-2xl text-slate-800">Estructura NLU</h3>
                <p className="text-base text-slate-500 leading-relaxed">Define frames y roles semánticos bajo el estándar MediaFranca.</p>
                <button onClick={() => { const content = "UTTERANCE\tNLU\tVISUAL-BLOCKS\tPROMPT\tSVG\nQuiero beber agua.\t{empty}\t{empty}\t{empty}\t{empty}"; const blob = new Blob([content], { type: 'text/tab-separated-values' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = "pipeliner_template.tsv"; a.click(); }} className="w-full py-4 bg-slate-900 text-white hover:bg-violet-900 rounded-md text-sm font-black transition-all shadow-lg active:scale-95">Descargar Plantilla</button>
              </div>

              <div className="bg-white p-10 rounded-md border-2 border-slate-100 text-left space-y-6 shadow-xl hover:border-violet-200 transition-all group">
                <div className="bg-emerald-50 text-emerald-600 p-4 rounded-md w-fit group-hover:scale-110 transition-transform"><BookOpen size={32}/></div>
                <h3 className="font-bold text-2xl text-slate-800">Dataset Canónico</h3>
                <p className="text-base text-slate-500 leading-relaxed">Carga frases pre-configuradas para probar la potencia del motor.</p>
                <button onClick={() => processContent(CANONICAL_CSV)} className="w-full py-4 bg-violet-50 text-violet-950 hover:bg-violet-950 hover:text-white rounded-md text-sm font-black flex items-center justify-center gap-3 transition-all border border-violet-200 active:scale-95 shadow-md">Cargar Muestrario</button>
              </div>

              <div className="bg-violet-950 p-10 rounded-md text-left space-y-6 shadow-xl hover:bg-black transition-all group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="bg-white/20 text-white p-4 rounded-md w-fit group-hover:-translate-y-1 transition-transform"><Upload size={32}/></div>
                <h3 className="font-bold text-2xl text-white">Importar Propio</h3>
                <p className="text-base text-violet-100 leading-relaxed">Sube tus propios archivos TSV o CSV estructurados para iniciar el pipeline.</p>
                <div className="text-sm font-black text-white bg-violet-900 px-6 py-3 rounded-md text-center shadow-inner">Seleccionar Archivo</div>
                <input ref={fileInputRef} type="file" className="hidden" onChange={e => e.target.files?.[0]?.text().then(processContent)}/>
              </div>
            </div>

            {rows.length > 0 && (
              <button onClick={() => setViewMode('list')} className="text-violet-950 font-black text-lg flex items-center gap-3 mx-auto hover:underline bg-white px-10 py-5 rounded-full border shadow-lg transition-all active:scale-95">
                Volver al listado activo ({rows.length} frases) <ArrowRight size={20}/>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-6 pb-48 animate-in fade-in slide-in-from-bottom-8 duration-500">
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
        <div className="fixed bottom-0 inset-x-0 h-64 bg-slate-950 text-violet-200 font-mono text-[13px] p-6 z-50 border-t-4 border-white/10 overflow-auto shadow-2xl">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10 uppercase tracking-[0.3em] text-slate-500 font-black">
            <span className="flex items-center gap-4 text-sm"><Terminal size={18}/> System Trace Console</span> 
            <button onClick={() => setLogs([])} className="hover:text-rose-400 text-xs bg-white/5 px-6 py-2 rounded-md border border-white/5">FLUSH BUFFER</button>
          </div>
          {logs.slice().reverse().map(l => (
            <div key={l.id} className="flex gap-6 leading-relaxed py-2 border-b border-white/5 last:border-0 hover:bg-white/5 px-4 rounded-md transition-colors">
              <span className="opacity-40 shrink-0">[{l.timestamp}]</span>
              <span className={`font-black shrink-0 w-20 text-center ${l.type === 'error' ? 'text-rose-500' : 'text-emerald-500'}`}>{l.type.toUpperCase()}</span>
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
    if (status === 'processing') return 'bg-violet-50/50 border-violet-200 animate-pulse';
    if (status === 'completed') return 'bg-emerald-50/30 border-emerald-100';
    if (status === 'outdated') return 'bg-amber-50/60 border-amber-200';
    if (status === 'error') return 'bg-rose-50/60 border-rose-200';
    return 'bg-white border-slate-200 shadow-sm';
  };

  return (
    <div ref={domRef} className={`rounded-md border-2 transition-all duration-300 ${isOpen ? 'ring-8 ring-violet-950/5 shadow-3xl z-20 translate-x-2' : 'hover:border-violet-300 hover:shadow-xl'} ${getBG(isOpen ? 'idle' : 'idle')}`}>
      <div className="p-6 flex items-center gap-10 cursor-pointer group" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex-1 text-xl font-bold text-slate-800 truncate px-2 leading-tight">{row.text}</div>
        <div className="flex gap-4 shrink-0">
          <Badge label="NLU" status={row.nluStatus} />
          <Badge label="BLU" status={row.visualStatus} />
          <Badge label="PIC" status={row.svgStatus} />
        </div>
        <div className="w-16 h-16 bg-white border-2 border-slate-50 rounded-md flex items-center justify-center p-1 shadow-inner overflow-hidden shrink-0 transition-transform group-hover:scale-125 group-hover:rotate-6 shadow-md" 
             dangerouslySetInnerHTML={{ __html: (row.svgCode || '').includes('<svg') ? row.svgCode! : '' }} />
        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all ml-4">
          <button onClick={e => { e.stopPropagation(); onRunCascade(); }} className="p-3 bg-violet-950 text-white rounded-md shadow-xl active:scale-90 hover:bg-black transition-all" title="Correr Pipeline"><PlayCircle size={24}/></button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-3 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-md active:scale-90 transition-all border border-rose-100" title="Eliminar"><Trash2 size={24}/></button>
        </div>
        <ChevronDown size={24} className={`text-slate-300 transition-transform duration-500 ${isOpen ? 'rotate-180 text-violet-950' : ''}`} />
      </div>

      {isOpen && (
        <div className="p-8 border-t-2 border-slate-100 grid grid-cols-1 lg:grid-cols-3 gap-10 bg-slate-50/50 rounded-b-md animate-in slide-in-from-top-4 duration-300">
          <StepBox title="1. NLU Schema" status={row.nluStatus} onAction={() => onProcessStep('nlu')} onStop={onStopStep} bg={getBG(row.nluStatus)}>
            <div className="h-full bg-white rounded-md border-2 border-slate-100 p-6 font-mono text-[13px] overflow-auto max-h-[500px] leading-relaxed shadow-inner">
              <pre className="text-violet-950">{typeof row.nlu === 'object' ? JSON.stringify(row.nlu, null, 2) : (row.nlu || '// Sin datos NLU')}</pre>
            </div>
          </StepBox>
          <StepBox title="2. Visual Blueprint" status={row.visualStatus} onAction={() => onProcessStep('visual')} onStop={onStopStep} bg={getBG(row.visualStatus)}>
             <div className="space-y-6 flex flex-col h-full">
               <textarea value={row.visualBlocks || ''} onChange={e => onUpdate({visualBlocks: e.target.value})} className="flex-1 w-full bg-white border-2 border-slate-100 rounded-md p-6 text-base font-bold outline-none focus:border-violet-950 resize-none shadow-inner" placeholder="Ejem: #human_head, #bed_base..." />
               <textarea value={row.prompt || ''} onChange={e => onUpdate({prompt: e.target.value})} className="h-32 w-full bg-white border-2 border-slate-100 rounded-md p-6 text-sm italic text-slate-500 outline-none focus:border-violet-950 resize-none shadow-inner" placeholder="Estrategia de dibujo..." />
             </div>
          </StepBox>
          <StepBox title="3. Semantic Pictogram" status={row.svgStatus} onAction={() => onProcessStep('svg')} onStop={onStopStep} bg={getBG(row.svgStatus)}>
            <div className="space-y-6 flex flex-col h-full">
              <textarea value={row.svgCode || ''} onChange={e => onUpdate({svgCode: e.target.value})} className="flex-1 w-full bg-slate-950 text-emerald-400 border-none rounded-md p-6 text-[12px] font-mono leading-relaxed resize-none shadow-2xl" placeholder="SVG code..." />
              <div className="h-56 bg-white border-2 border-slate-100 rounded-md flex items-center justify-center overflow-hidden relative shadow-inner p-4 group/preview">
                 <div className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full transition-all group-hover/preview:scale-110" 
                      dangerouslySetInnerHTML={{ __html: (row.svgCode || '').includes('<svg') ? row.svgCode! : '<div class="text-sm font-black text-slate-200 uppercase tracking-[0.2em]">Esperando Render</div>' }} />
                 <div className="absolute top-4 right-4 bg-slate-900/70 text-white text-[10px] px-3 py-1.5 rounded-md opacity-0 group-hover/preview:opacity-100 transition-opacity backdrop-blur-sm">Picto Preview</div>
              </div>
            </div>
          </StepBox>
        </div>
      )}
    </div>
  );
};

const StepBox: React.FC<{ title: string; status: StepStatus; onAction: () => void; onStop: () => void; children: React.ReactNode; bg: string }> = ({ title, status, onAction, onStop, children, bg }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval: number;
    if (status === 'processing') {
      setElapsed(0);
      interval = window.setInterval(() => {
        setElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => window.clearInterval(interval);
  }, [status]);

  return (
    <div className={`flex flex-col gap-6 min-h-[550px] transition-colors p-8 rounded-md border-2 ${bg} shadow-sm`}>
      <div className="flex items-center justify-between px-2">
        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">{title}</h4>
        <div className="flex items-center gap-3">
          {status === 'processing' ? (
            <>
              <span className="text-xs font-mono text-slate-400 font-black opacity-60 animate-in fade-in duration-300">{elapsed}s</span>
              <button 
                onClick={onStop} 
                className="p-3 text-white rounded-md shadow-xl hover:opacity-95 transition-all border-b-4 border-orange-800 active:border-b-0 active:translate-y-1 animate-generative" 
                title="Abortar"
              >
                <StopCircle size={20}/>
              </button>
            </>
          ) : (
            <button onClick={onAction} className="p-3 bg-white border-2 border-slate-100 hover:border-violet-950 hover:text-violet-950 rounded-md shadow-lg transition-all active:scale-95 active:shadow-sm" title="Regenerar"><RefreshCw size={20}/></button>
          )}
        </div>
      </div>
      <div className="flex-1 relative">{children}</div>
    </div>
  );
};

const Badge: React.FC<{ label: string; status: StepStatus }> = ({ label, status }) => {
  const styles = {
    idle: 'bg-slate-100 text-slate-400 border-transparent',
    processing: 'bg-orange-100 text-orange-600 animate-pulse border-orange-200',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    outdated: 'bg-amber-100 text-amber-800 border-amber-200',
    error: 'bg-rose-100 text-rose-700 border-rose-200'
  };
  return <div className={`px-4 py-2 rounded-md text-[12px] font-black uppercase tracking-widest border-2 transition-all ${styles[status]}`}>{label}</div>;
};

export default App;
