
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  Upload, Download, Trash2, Terminal, RefreshCw, ChevronDown, 
  PlayCircle, BookOpen, Search, ArrowRight, FileDown, StopCircle, Sparkles, Sliders
} from 'lucide-react';
import { RowData, LogEntry, StepStatus, NLUData, GlobalConfig } from './types';
import * as Gemini from './services/geminiService';
import { CANONICAL_CSV } from './data/canonicalData';

const STORAGE_KEY = 'pipeliner_v9_storage';
const CONFIG_KEY = 'pipeliner_v9_config';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

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
        text: capitalize(parts[0]), 
        nlu: nlu,
        visualBlocks: (!parts[2] || parts[2] === '{empty}') ? undefined : parts[2], 
        prompt: (!parts[3] || parts[3] === '{empty}') ? undefined : parts[3], 
        svgCode: (!parts[4] || parts[4] === '{empty}') ? undefined : parts[4],
        status: (parts[4] && parts[4] !== '{empty}') ? 'completed' : 'idle',
        nluStatus: (rawNlu && rawNlu !== '{empty}' && typeof nlu === 'object') ? 'completed' : 'idle',
        visualStatus: (parts[2] && parts[2] !== '{empty}') ? 'completed' : 'idle',
        svgStatus: (parts[4] && parts[4] !== '{empty}') ? 'completed' : 'idle'
      } as RowData;
    }).filter((r): r is RowData => r !== null);
    setRows(prev => [...newRows, ...prev]);
    setViewMode('list');
    addLog('success', `Importación: ${newRows.length} registros capitalizados.`);
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

    const startTime = Date.now();
    try {
      let result: any;
      if (step === 'nlu') {
        result = await Gemini.generateNLU(row.text);
      } else if (step === 'visual') {
        // Validación profunda de NLU para evitar contaminación
        let nluData = typeof row.nlu === 'string' ? null : row.nlu;
        if (!nluData && typeof row.nlu === 'string') {
          try { nluData = JSON.parse(row.nlu); } catch(e) { /* fail */ }
        }
        if (!nluData || typeof nluData !== 'object' || !('frames' in nluData)) {
          addLog('error', "NLU corrupto o ausente. Reparando...");
          const repair = await Gemini.generateNLU(row.text);
          updateRow(index, { nlu: repair, nluStatus: 'completed' });
          nluData = repair;
        }
        result = await Gemini.generateVisualBlueprint(nluData as NLUData);
      } else if (step === 'svg') {
        if (!row.visualBlocks || !row.prompt) throw new Error("Faltan recursos visuales.");
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
      addLog('success', `${step.toUpperCase()} finalizado.`);
      return true;
    } catch (err: any) {
      updateRow(index, { [statusKey]: 'error' });
      addLog('error', `${step.toUpperCase()} Error: ${err.message}`);
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
    a.download = `pipeline_export_${new Date().getTime()}.tsv`;
    a.click();
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if(e.key === 'Enter') {
      const match = rows.find(r => r.text.toLowerCase() === searchValue.toLowerCase());
      if (match) {
        setViewMode('list'); setOpenRowId(match.id);
        setTimeout(() => rowRefs.current[match.id]?.scrollIntoView({ behavior:'smooth', block:'center' }), 100);
        setSearchValue('');
      } else if(searchValue.trim()) {
        const id = `U_${Date.now()}`;
        setRows([{id, text: capitalize(searchValue), status:'idle', nluStatus:'idle', visualStatus:'idle', svgStatus:'idle'}, ...rows]);
        setViewMode('list'); setSearchValue('');
        setTimeout(() => { setOpenRowId(id); rowRefs.current[id]?.scrollIntoView({ behavior:'smooth', block:'center' }); }, 150);
      }
    }
  };

  const suggestions = useMemo(() => searchValue ? rows.filter(r => r.text.toLowerCase().includes(searchValue.toLowerCase())).slice(0, 5) : [], [searchValue, rows]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-violet-950 selection:text-white">
      <header className="h-20 sticky top-0 bg-white border-b border-slate-200 z-40 flex items-center px-10 justify-between shadow-sm">
        <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setViewMode('home')}>
          <div className="bg-violet-950 p-3 text-white">
            <PipelineIcon size={28} />
          </div>
          <div>
            <h1 className="font-black uppercase tracking-tight text-2xl leading-none text-slate-900">PipeLiner <span className="text-violet-950">Architect.</span></h1>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">{rows.length} Registros</span>
          </div>
        </div>

        <div className="flex-1 max-w-2xl mx-12 relative">
          <div className={`flex items-center bg-slate-100 px-6 py-3 border-2 transition-all ${isSearching ? 'border-violet-950 bg-white ring-4 ring-slate-100' : 'border-transparent'}`}>
            <Search size={20} className="text-slate-400" />
            <input 
              ref={searchInputRef} value={searchValue} onFocus={() => setIsSearching(true)} onBlur={() => setTimeout(() => setIsSearching(false), 200)}
              onChange={(e) => setSearchValue(e.target.value)} onKeyDown={handleSearch}
              placeholder="¿Qué quieres proyectar?..." className="flex-1 bg-transparent border-none focus:ring-0 text-lg font-bold ml-4 placeholder:text-slate-300"
            />
          </div>
          {isSearching && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 shadow-2xl z-50 overflow-hidden">
              {suggestions.map(s => <div key={s.id} onClick={() => { setViewMode('list'); setOpenRowId(s.id); setTimeout(() => rowRefs.current[s.id]?.scrollIntoView({behavior:'smooth'}), 100); setSearchValue(''); }} className="p-4 hover:bg-violet-50 cursor-pointer text-sm font-bold flex items-center justify-between border-b last:border-0 border-slate-100"><span>{s.text}</span> <ArrowRight size={16} className="text-violet-300"/></div>)}
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {rows.length > 0 && <button onClick={exportTSV} className="bg-slate-900 text-white px-5 py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-black transition-all shadow-md active:scale-95"><Download size={14}/> TSV Export</button>}
          <button onClick={() => setShowConfig(!showConfig)} className={`p-3 border-2 transition-colors ${showConfig ? 'bg-violet-100 text-violet-950 border-violet-950' : 'hover:bg-slate-100 text-slate-400 border-transparent'}`}><Sliders size={20}/></button>
          <button onClick={() => setShowConsole(!showConsole)} className="p-3 hover:bg-slate-100 text-slate-400 border-2 border-transparent"><Terminal size={20}/></button>
        </div>
      </header>

      {showConfig && (
        <div className="bg-white border-b border-slate-200 px-10 py-8 animate-in slide-in-from-top duration-300">
          <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 items-end">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-[0.2em]">SVG Default Lang</label>
              <input type="text" value={config.lang} onChange={e => setConfig({...config, lang: e.target.value})} className="w-full text-xs border border-slate-200 px-4 py-2 outline-none focus:border-violet-950" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-[0.2em]">ViewBox Dimension</label>
              <input type="number" value={config.svgSize} onChange={e => setConfig({...config, svgSize: parseInt(e.target.value)})} className="w-full text-xs border border-slate-200 px-4 py-2 outline-none focus:border-violet-950" />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-[0.2em]">Metadata Signature</label>
              <div className="flex gap-2">
                <input type="text" value={config.author} onChange={e => setConfig({...config, author: e.target.value})} className="w-full text-xs border border-slate-200 px-4 py-2 outline-none focus:border-violet-950" placeholder="Autor" />
                <input type="text" value={config.license} onChange={e => setConfig({...config, license: e.target.value})} className="w-full text-xs border border-slate-200 px-4 py-2 outline-none focus:border-violet-950" placeholder="Licencia" />
              </div>
            </div>
            <div className="flex justify-end">
               <button onClick={() => setShowConfig(false)} className="text-[10px] font-black uppercase text-violet-950 bg-violet-50 px-6 py-3 hover:bg-violet-100 transition-all border border-violet-200 tracking-widest">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-10 max-w-7xl mx-auto w-full">
        {viewMode === 'home' ? (
          <div className="py-24 text-center space-y-16 max-w-5xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            <div className="space-y-4">
              <div className="inline-flex gap-4 bg-violet-950 text-white px-6 py-2 text-[10px] font-black uppercase tracking-[0.4em] shadow-lg">
                <Sparkles size={14}/> Semantic High Fidelity Engine
              </div>
              <h2 className="text-9xl font-black tracking-tighter text-slate-900 leading-none">
                PIPELINE <span className="text-violet-950">V9.</span>
              </h2>
              <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto leading-relaxed italic">
                Validación semántica estricta y flujos de cascada blindados. Accesibilidad nativa mediante capitalización inteligente.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-10 border border-slate-200 text-left space-y-4 shadow-xl hover:border-violet-950 transition-all group">
                <div className="text-amber-600"><FileDown size={32}/></div>
                <h3 className="font-black text-lg uppercase tracking-wider text-slate-900">Blueprint</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Carga TSV/CSV. Se capitalizará cada enunciado al vuelo.</p>
                <button onClick={() => { const content = "UTTERANCE\tNLU\tVISUAL-BLOCKS\tPROMPT\tSVG\nQuiero beber agua.\t{empty}\t{empty}\t{empty}\t{empty}"; const blob = new Blob([content], { type: 'text/tab-separated-values' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = "template.tsv"; a.click(); }} className="w-full py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">Template</button>
              </div>

              <div className="bg-white p-10 border border-slate-200 text-left space-y-4 shadow-xl hover:border-violet-950 transition-all group">
                <div className="text-emerald-600"><BookOpen size={32}/></div>
                <h3 className="font-black text-lg uppercase tracking-wider text-slate-900">Canon</h3>
                <p className="text-sm text-slate-500 leading-relaxed">Set de datos verificado. NLU pre-validado para cascada.</p>
                <button onClick={() => processContent(CANONICAL_CSV)} className="w-full py-3 bg-violet-50 text-violet-950 border border-violet-200 text-[10px] font-black uppercase tracking-widest shadow-sm">Load Canon</button>
              </div>

              <div className="bg-violet-950 p-10 text-left space-y-4 shadow-xl hover:bg-black transition-all group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="text-white"><Upload size={32}/></div>
                <h3 className="font-black text-lg uppercase tracking-wider text-white">Manual</h3>
                <p className="text-sm text-violet-200 leading-relaxed">Sube archivos personalizados. El sistema saneará el JSON.</p>
                <div className="text-[10px] font-black text-white bg-violet-800 px-6 py-3 text-center border border-violet-700 uppercase tracking-widest">Select File</div>
                <input ref={fileInputRef} type="file" className="hidden" onChange={e => e.target.files?.[0]?.text().then(processContent)}/>
              </div>
            </div>

            {rows.length > 0 && (
              <button onClick={() => setViewMode('list')} className="text-violet-950 font-black text-xs uppercase tracking-[0.3em] flex items-center gap-4 mx-auto hover:bg-violet-50 px-10 py-5 border-2 border-violet-950 transition-all">
                Abrir WorkBench ({rows.length}) <ArrowRight size={18}/>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-48 animate-in fade-in slide-in-from-bottom-8 duration-500">
            {rows.map((row, idx) => (
              <RowComponent 
                key={row.id} row={row} isOpen={openRowId === row.id} setIsOpen={v => setOpenRowId(v ? row.id : null)}
                onUpdate={u => updateRow(idx, u)} domRef={el => rowRefs.current[row.id] = el}
                onProcessStep={s => processStep(idx, s)} onStopStep={() => stopFlags.current[row.id] = true}
                onRunCascade={() => { processStep(idx, 'nlu').then(ok => ok && processStep(idx, 'visual').then(ok2 => ok2 && processStep(idx, 'svg'))); }}
                onDelete={() => { if(confirm("¿Eliminar registro?")) setRows(prev => prev.filter(r => r.id !== row.id)); }}
              />
            ))}
          </div>
        )}
      </main>

      {showConsole && (
        <div className="fixed bottom-0 inset-x-0 h-64 bg-slate-950 text-slate-400 mono text-[11px] p-6 z-50 border-t border-slate-800 overflow-auto shadow-2xl">
          <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-900 font-black tracking-widest text-[10px] uppercase">
            <span className="flex items-center gap-3"><Terminal size={14}/> Semantic Monitor</span> 
            <button onClick={() => setLogs([])} className="hover:text-white transition-colors">Flush Logs</button>
          </div>
          {logs.slice().reverse().map(l => (
            <div key={l.id} className="flex gap-4 leading-relaxed py-1 border-b border-slate-900 last:border-0">
              <span className="opacity-30">[{l.timestamp}]</span>
              <span className={`font-black w-16 text-center ${l.type === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>{l.type.toUpperCase()}</span>
              <span className="break-all">{l.message}</span>
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
    if (status === 'processing') return 'bg-orange-50/20 border-orange-300';
    if (status === 'completed') return 'bg-emerald-50/20 border-emerald-100';
    if (status === 'error') return 'bg-rose-50/20 border-rose-200';
    return 'bg-white border-slate-200';
  };

  return (
    <div ref={domRef} className={`border-2 transition-all duration-300 ${isOpen ? 'ring-8 ring-slate-100 shadow-3xl z-20 border-violet-950 translate-x-1' : 'hover:border-slate-300'} ${getBG(isOpen ? 'idle' : 'idle')}`}>
      <div className="p-5 flex items-center gap-8 cursor-pointer group" onClick={() => setIsOpen(!isOpen)}>
        <div className="flex-1 text-lg font-black text-slate-900 truncate leading-none uppercase tracking-tight">{row.text}</div>
        <div className="flex gap-2 shrink-0">
          <Badge label="NLU" status={row.nluStatus} />
          <Badge label="BLU" status={row.visualStatus} />
          <Badge label="PIC" status={row.svgStatus} />
        </div>
        <div className="w-14 h-14 bg-white border border-slate-100 flex items-center justify-center p-1 shadow-inner overflow-hidden shrink-0 transition-all group-hover:scale-110" 
             dangerouslySetInnerHTML={{ __html: (row.svgCode || '').includes('<svg') ? row.svgCode! : '' }} />
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all ml-2">
          <button onClick={e => { e.stopPropagation(); onRunCascade(); }} className="p-3 bg-violet-950 text-white shadow-xl hover:bg-black transition-all" title="Cascada"><PlayCircle size={18}/></button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-3 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all border border-rose-100" title="Delete"><Trash2 size={18}/></button>
        </div>
        <ChevronDown size={20} className={`text-slate-300 transition-transform duration-500 ${isOpen ? 'rotate-180 text-violet-950' : ''}`} />
      </div>

      {isOpen && (
        <div className="p-8 border-t border-slate-200 grid grid-cols-1 lg:grid-cols-3 gap-8 bg-slate-50/50 animate-in slide-in-from-top-2">
          <StepBox title="Semantic NLU" status={row.nluStatus} onAction={() => onProcessStep('nlu')} onStop={onStopStep} bg={getBG(row.nluStatus)}>
            <div className="h-full bg-white border border-slate-200 p-4 mono text-[11px] overflow-auto max-h-[450px] shadow-inner">
              <pre className="text-violet-900">{typeof row.nlu === 'object' ? JSON.stringify(row.nlu, null, 2) : (row.nlu || '// Empty buffer')}</pre>
            </div>
          </StepBox>
          <StepBox title="Visual Layout" status={row.visualStatus} onAction={() => onProcessStep('visual')} onStop={onStopStep} bg={getBG(row.visualStatus)}>
             <div className="space-y-4 flex flex-col h-full">
               <textarea value={row.visualBlocks || ''} onChange={e => onUpdate({visualBlocks: e.target.value})} className="flex-1 w-full bg-white border border-slate-200 p-4 text-xs font-bold outline-none focus:border-violet-950 resize-none shadow-inner" placeholder="Blocks & IDs..." />
               <textarea value={row.prompt || ''} onChange={e => onUpdate({prompt: e.target.value})} className="h-24 w-full bg-white border border-slate-200 p-4 text-[10px] italic text-slate-500 outline-none focus:border-violet-950 resize-none shadow-inner" placeholder="Drawing prompt..." />
             </div>
          </StepBox>
          <StepBox title="SVG Pictogram" status={row.svgStatus} onAction={() => onProcessStep('svg')} onStop={onStopStep} bg={getBG(row.svgStatus)}>
            <div className="space-y-4 flex flex-col h-full">
              <textarea value={row.svgCode || ''} onChange={e => onUpdate({svgCode: e.target.value})} className="flex-1 w-full bg-slate-950 text-emerald-500 border-none p-4 mono text-[10px] leading-relaxed resize-none shadow-2xl" placeholder="SVG XML..." />
              <div className="h-48 bg-white border border-slate-200 flex items-center justify-center overflow-hidden relative shadow-inner p-4 group/preview">
                 <div className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-full [&>svg]:max-w-full [&>svg]:max-h-full transition-all group-hover/preview:scale-105" 
                      dangerouslySetInnerHTML={{ __html: (row.svgCode || '').includes('<svg') ? row.svgCode! : '<div class="text-[10px] font-black text-slate-200 uppercase tracking-widest">Renderer Inactive</div>' }} />
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
      interval = window.setInterval(() => { setElapsed(prev => prev + 1); }, 1000);
    }
    return () => window.clearInterval(interval);
  }, [status]);

  return (
    <div className={`flex flex-col gap-4 min-h-[500px] transition-colors p-6 border ${bg}`}>
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</h4>
        <div className="flex items-center gap-3">
          {status === 'processing' ? (
            <>
              <span className="text-[10px] mono text-slate-400 font-bold opacity-60 animate-in fade-in duration-300">{elapsed}s</span>
              <button 
                onClick={onStop} 
                className="p-3 text-white shadow-xl hover:opacity-90 transition-all active:translate-y-1 animate-spectral" 
                title="Abort Session"
              >
                <StopCircle size={16}/>
              </button>
            </>
          ) : (
            <button onClick={onAction} className="p-3 bg-white border border-slate-200 hover:border-violet-950 text-slate-400 hover:text-violet-950 transition-all shadow-sm active:scale-95" title="Regenerate"><RefreshCw size={16}/></button>
          )}
        </div>
      </div>
      <div className="flex-1 relative">{children}</div>
    </div>
  );
};

const Badge: React.FC<{ label: string; status: StepStatus }> = ({ label, status }) => {
  const styles = {
    idle: 'bg-slate-50 text-slate-300 border-slate-100',
    processing: 'bg-orange-50 text-orange-600 animate-pulse border-orange-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    outdated: 'bg-amber-50 text-amber-800 border-amber-100',
    error: 'bg-rose-50 text-rose-700 border-rose-100'
  };
  return <div className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border transition-all ${styles[status]}`}>{label}</div>;
};

export default App;
