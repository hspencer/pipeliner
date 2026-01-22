
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { 
  Upload, Download, Trash2, Terminal, RefreshCw, ChevronDown, 
  PlayCircle, BookOpen, Search, FileDown, StopCircle, Sparkles, Sliders,
  X, Code, Plus
} from 'lucide-react';
import { RowData, LogEntry, StepStatus, NLUData, GlobalConfig, VOCAB } from './types';
import * as Gemini from './services/geminiService';
import { CANONICAL_DATA } from './data/canonicalData';

const STORAGE_KEY = 'pipeliner_v14_storage';
const CONFIG_KEY = 'pipeliner_v14_config';

const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : "";

const PipelineIcon = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12" />
    <circle cx="4" cy="12" r="3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    <circle cx="21" cy="12" r="3" fill="currentColor" stroke="none" />
  </svg>
);

const App: React.FC = () => {
  const [rows, setRows] = useState<RowData[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [openRowId, setOpenRowId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'home' | 'list'>('home');
  const [config, setConfig] = useState<GlobalConfig>({ lang: 'es-ES', svgSize: 100, author: 'PictoNet', license: 'CC BY 4.0' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stopFlags = useRef<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedConfig = localStorage.getItem(CONFIG_KEY);
    if (saved) { try { const parsed = JSON.parse(saved); setRows(parsed); if(parsed.length > 0) setViewMode('list'); } catch(e){} }
    if (savedConfig) { try { setConfig(JSON.parse(savedConfig)); } catch(e){} }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  }, [rows, config]);

  const addLog = (type: 'info' | 'error' | 'success', message: string) => {
    setLogs(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), timestamp: new Date().toLocaleTimeString(), type, message }]);
  };

  const processContent = (text: string) => {
    try {
      const data = JSON.parse(text);
      const items = Array.isArray(data) ? data : [data];
      const newRows: RowData[] = items.map((item, i) => ({
        id: item.id || `R_${Date.now()}_${i}`,
        UTTERANCE: item.UTTERANCE || item.utterance || "",
        NLU: item.NLU || item.nlu,
        "VISUAL-BLOCKS": item["VISUAL-BLOCKS"] || item["visual-blocks"],
        PROMPT: item.PROMPT || item.prompt,
        SVG: item.SVG || item.svg,
        status: 'idle',
        nluStatus: (item.NLU || item.nlu) ? 'completed' : 'idle',
        visualStatus: (item["VISUAL-BLOCKS"] || item["visual-blocks"]) ? 'completed' : 'idle',
        svgStatus: (item.SVG || item.svg) ? 'completed' : 'idle'
      }));
      setRows(prev => [...prev, ...newRows]);
      setViewMode('list');
      addLog('success', `Importados ${newRows.length} registros desde JSON.`);
    } catch (e) {
      addLog('error', 'Error al procesar el archivo JSON. Asegúrate de que sea un array de objetos válido.');
    }
  };

  const downloadTemplate = () => {
    const template = [{
      UTTERANCE: "Quiero beber agua",
      NLU: {},
      "VISUAL-BLOCKS": "#person, #glass, #water_droplets",
      PROMPT: "Representación minimalista de una persona bebiendo de un vaso con gotas de agua.",
      SVG: ""
    }];
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "plantilla_pipeliner.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const cleanRows = rows.map(({ id, UTTERANCE, NLU, "VISUAL-BLOCKS": vb, PROMPT, SVG }) => ({
      id, UTTERANCE, NLU, "VISUAL-BLOCKS": vb, PROMPT, SVG
    }));
    const blob = new Blob([JSON.stringify(cleanRows, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeliner_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addLog('success', 'Proyecto exportado como JSON.');
  };

  const addNewRow = (textValue: string = "") => {
    const newId = `R_MANUAL_${Date.now()}`;
    const newEntry: RowData = {
      id: newId, 
      UTTERANCE: textValue || 'Nueva Unidad Semántica', 
      status: 'idle', nluStatus: 'idle', visualStatus: 'idle', svgStatus: 'idle'
    };
    setRows(prev => [newEntry, ...prev]);
    setViewMode('list');
    setOpenRowId(newId);
    setSearchValue('');
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
    
    updateRow(index, { [statusKey]: 'processing' });
    const startTime = Date.now();

    try {
      let result: any;
      if (step === 'nlu') result = await Gemini.generateNLU(row.UTTERANCE);
      else if (step === 'visual') {
        const nluObj = typeof row.NLU === 'string' ? JSON.parse(row.NLU) : row.NLU;
        result = await Gemini.generateVisualBlueprint(nluObj as NLUData, config.lang);
      } else if (step === 'svg') result = await Gemini.generateSVG(row["VISUAL-BLOCKS"] || "", row.PROMPT || "", row, config);

      if (stopFlags.current[row.id]) return false;

      const duration = (Date.now() - startTime) / 1000;
      updateRow(index, { 
        [statusKey]: 'completed', 
        [durationKey]: duration,
        ...(step === 'nlu' ? { NLU: result } : {}),
        ...(step === 'visual' ? { "VISUAL-BLOCKS": result["VISUAL-BLOCKS"], PROMPT: result.PROMPT } : {}),
        ...(step === 'svg' ? { SVG: result, status: 'completed' } : {})
      });
      addLog('success', `${step.toUpperCase()} completo: ${duration}s`);
      return true;
    } catch (err: any) {
      updateRow(index, { [statusKey]: 'error' });
      addLog('error', `${step.toUpperCase()} Error: ${err.message}`);
      return false;
    }
  };

  const filteredRows = useMemo(() => {
    if (!searchValue) return rows;
    const lowSearch = searchValue.toLowerCase();
    return rows.filter(r => r.UTTERANCE.toLowerCase().includes(lowSearch));
  }, [rows, searchValue]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-20 bg-white border-b border-slate-200 sticky top-0 z-50 flex items-center px-8 justify-between shadow-sm">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setViewMode('home')}>
          <div className="bg-violet-950 p-2.5 text-white"><PipelineIcon size={24} /></div>
          <div>
            <h1 className="font-bold uppercase tracking-tight text-xl text-slate-900 leading-none">PipeLiner</h1>
            <span className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">Semantic Workbench</span>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-8 relative">
          <div className={`flex items-center bg-slate-100 px-4 py-2 border-2 transition-all ${isSearching ? 'border-violet-950 bg-white shadow-lg' : 'border-transparent'}`}>
            <Search size={18} className="text-slate-400" />
            <input 
              value={searchValue} onFocus={() => setIsSearching(true)} onBlur={() => setTimeout(() => setIsSearching(false), 200)}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Intención comunicativa" className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold ml-2"
            />
          </div>
        </div>

        <div className="flex gap-2">
          {rows.length > 0 && <button onClick={exportJSON} className="p-2.5 hover:bg-slate-50 text-slate-400" title="Exportar Proyecto (JSON)"><Download size={18}/></button>}
          {rows.length > 0 && <button onClick={() => setViewMode('list')} className="p-2.5 hover:bg-slate-50 text-slate-400" title="Ver Workbench"><BookOpen size={18}/></button>}
          <button onClick={() => setShowConfig(!showConfig)} className="p-2.5 hover:bg-slate-50 text-slate-400" title="Ajustes Globales"><Sliders size={18}/></button>
          <button onClick={() => setShowConsole(!showConsole)} className="p-2.5 hover:bg-slate-50 text-slate-400" title="Monitor Semántico"><Terminal size={18}/></button>
        </div>
      </header>

      {showConfig && (
        <div className="bg-white border-b p-8 animate-in slide-in-from-top duration-200 shadow-xl">
          <div className="max-w-4xl mx-auto grid grid-cols-2 gap-8">
            <div>
              <label className="text-[10px] font-medium uppercase text-slate-400 block mb-2">Target Localization Context</label>
              <input type="text" value={config.lang} onChange={e => setConfig({...config, lang: e.target.value})} className="w-full text-xs border p-3 bg-slate-50 focus:bg-white transition-colors" />
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase text-slate-400 block mb-2">Project Metadata / Signature</label>
              <input type="text" value={config.author} onChange={e => setConfig({...config, author: e.target.value})} className="w-full text-xs border p-3 bg-slate-50 focus:bg-white transition-colors" />
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        {viewMode === 'home' ? (
          <div className="py-20 text-center space-y-16 animate-in fade-in zoom-in-95 duration-700">
            <div className="space-y-4">
               <div className="inline-flex gap-4 bg-violet-950 text-white px-6 py-2 text-[10px] font-medium uppercase tracking-[0.4em] shadow-lg">
                <Sparkles size={14}/> Semantic High Fidelity Engine
              </div>
              <h2 className="text-8xl font-black tracking-tighter text-slate-900 leading-none">PIPE<span className="text-violet-950">LINER.</span></h2>
              <p className="text-slate-400 text-xl font-medium max-w-2xl mx-auto leading-relaxed italic">
                Arquitectura de pictogramas basada en NLU MediaFranca. 
                Validación semántica estricta y visual blends controlados.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <div onClick={() => processContent(JSON.stringify(CANONICAL_DATA))} className="bg-white p-12 border border-slate-200 text-left space-y-6 shadow-xl hover:border-violet-950 transition-all cursor-pointer group hover:-translate-y-1">
                <div className="text-emerald-600 group-hover:scale-110 transition-transform"><BookOpen size={40}/></div>
                <h3 className="font-bold text-xl uppercase tracking-wider text-slate-900">Canon Dataset</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Carga el set de datos canónico de PictoNet desde JSON.</p>
              </div>

              <div onClick={() => fileInputRef.current?.click()} className="bg-violet-950 p-12 text-left space-y-6 shadow-xl hover:bg-black transition-all cursor-pointer group hover:-translate-y-1">
                <div className="text-white group-hover:scale-110 transition-transform"><Upload size={40}/></div>
                <h3 className="font-bold text-xl uppercase tracking-wider text-white">Import JSON</h3>
                <p className="text-xs text-violet-300 leading-relaxed font-medium">Carga un proyecto previo o una lista de enunciados en formato JSON.</p>
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={e => e.target.files?.[0]?.text().then(processContent)}/>
              </div>

              <div onClick={downloadTemplate} className="bg-slate-100 p-12 text-left space-y-6 shadow-xl hover:bg-slate-200 transition-all cursor-pointer group hover:-translate-y-1">
                <div className="text-slate-600 group-hover:scale-110 transition-transform"><Download size={40}/></div>
                <h3 className="font-bold text-xl uppercase tracking-wider text-slate-900">Template JSON</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">Descarga la estructura de claves transversal (UTTERANCE, NLU...).</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-64 animate-in fade-in slide-in-from-bottom-8 duration-500">
            {filteredRows.length === 0 && searchValue && (
              <div className="py-20 text-center border-2 border-dashed border-slate-200 flex flex-col items-center gap-6">
                <p className="text-slate-400 font-medium uppercase tracking-widest text-xs">No se encontraron resultados para "{searchValue}"</p>
                <button 
                  onClick={() => addNewRow(searchValue)}
                  className="flex items-center gap-2 bg-violet-950 text-white px-6 py-3 font-bold uppercase text-[10px] tracking-widest hover:bg-black transition-all shadow-lg"
                >
                  <Plus size={16}/> Crear Nueva Fila con "{searchValue}"
                </button>
              </div>
            )}
            {filteredRows.map((row) => {
              const globalIndex = rows.findIndex(r => r.id === row.id);
              return (
                <RowComponent 
                  key={row.id} row={row} isOpen={openRowId === row.id} setIsOpen={v => setOpenRowId(v ? row.id : null)}
                  onUpdate={u => updateRow(globalIndex, u)} onProcess={s => processStep(globalIndex, s)}
                  onStop={() => stopFlags.current[row.id] = true}
                  onCascade={() => processStep(globalIndex, 'nlu').then(ok => ok && processStep(globalIndex, 'visual').then(ok2 => ok2 && processStep(globalIndex, 'svg')))}
                  onDelete={() => setRows(prev => prev.filter(r => r.id !== row.id))}
                />
              );
            })}
          </div>
        )}
      </main>
      
      {showConsole && (
        <div className="fixed bottom-0 inset-x-0 h-64 bg-slate-950 text-slate-400 mono text-[10px] p-6 z-50 border-t border-slate-800 overflow-auto shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-900 font-medium tracking-widest uppercase">
            <span className="flex items-center gap-3"><Terminal size={14}/> Semantic Monitor Trace</span> 
            <button onClick={() => setLogs([])} className="hover:text-white transition-colors">Flush Logs</button>
          </div>
          {logs.slice().reverse().map(l => (
            <div key={l.id} className="flex gap-4 py-1 border-b border-slate-900 last:border-0 items-start">
              <span className="opacity-30 shrink-0">[{l.timestamp}]</span>
              <span className={`font-medium w-16 text-center shrink-0 ${l.type === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>{l.type.toUpperCase()}</span>
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
  onUpdate: (u: any) => void; onProcess: (s: any) => Promise<boolean>;
  onStop: () => void; onCascade: () => void; onDelete: () => void;
}> = ({ row, isOpen, setIsOpen, onUpdate, onProcess, onStop, onCascade, onDelete }) => {

  const handleDownloadSVG = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!row.SVG) return;
    const filename = row.UTTERANCE.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const blob = new Blob([row.SVG], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`border transition-all duration-300 ${isOpen ? 'ring-8 ring-slate-100 border-violet-950 bg-white' : 'hover:border-slate-300 bg-white shadow-sm'}`}>
      <div className="p-6 flex items-center gap-8 group">
        <div className="flex-1 utterance-title flex items-center gap-2">
           <input 
            type="text" value={row.UTTERANCE} onChange={e => onUpdate({ UTTERANCE: e.target.value })}
            className="w-full bg-transparent border-none outline-none focus:ring-0 utterance-title text-slate-900 uppercase font-light truncate"
            onClick={e => e.stopPropagation()}
           />
        </div>
        <div className="flex gap-2 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          <Badge label="NLU" status={row.nluStatus} />
          <Badge label="BLOCKS" status={row.visualStatus} />
          <Badge label="SVG" status={row.svgStatus} />
        </div>
        <div className="w-14 h-14 border bg-slate-50 flex items-center justify-center p-1 group-hover:scale-110 transition-transform cursor-pointer" onClick={() => setIsOpen(!isOpen)} dangerouslySetInnerHTML={{ __html: row.SVG || "" }} />
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={e => { e.stopPropagation(); onCascade(); }} className="p-3 bg-violet-950 text-white shadow-lg hover:bg-black transition-all"><PlayCircle size={18}/></button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-3 text-rose-300 hover:text-rose-600 transition-colors"><Trash2 size={18}/></button>
        </div>
        <ChevronDown onClick={() => setIsOpen(!isOpen)} size={20} className={`text-slate-300 transition-transform duration-500 cursor-pointer ${isOpen ? 'rotate-180 text-violet-950' : ''}`} />
      </div>

      {isOpen && (
        <div className="p-8 border-t bg-slate-50/30 grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in slide-in-from-top-2">
          <StepBox label="NLU (MediaFranca)" status={row.nluStatus} onRegen={() => onProcess('nlu')} onStop={onStop} duration={row.nluDuration}>
            <SmartNLUEditor data={row.NLU} onUpdate={val => onUpdate({ NLU: val })} />
          </StepBox>

          <StepBox label="BLOCKS & PROMPT" status={row.visualStatus} onRegen={() => onProcess('visual')} onStop={onStop} duration={row.visualDuration}>
             <div className="flex flex-col h-full gap-6">
                <div className="mb-2">
                  <label className="text-[10px] font-medium uppercase text-slate-400 block mb-2 tracking-widest">Fixed Visual Blocks</label>
                  <BlocksList value={row["VISUAL-BLOCKS"] || ""} onChange={val => onUpdate({ "VISUAL-BLOCKS": val })} />
                </div>
                <div className="flex-1 mt-6 border-t pt-6 border-slate-200">
                  <label className="text-[10px] font-medium uppercase text-slate-400 block mb-3 tracking-widest">Drawing Strategy (Prompt)</label>
                  <textarea 
                    value={row.PROMPT || ""} onChange={e => onUpdate({ PROMPT: e.target.value })} 
                    className="w-full h-full border-none p-0 text-lg font-light text-slate-700 outline-none focus:ring-0 bg-transparent resize-none leading-relaxed" 
                    placeholder="Describe the spatial strategy and visual blends..."
                  />
                </div>
             </div>
          </StepBox>

          <StepBox 
            label="SVG RENDERING" status={row.svgStatus} onRegen={() => onProcess('svg')} onStop={onStop} duration={row.svgDuration}
            actionNode={row.SVG && <button onClick={handleDownloadSVG} className="p-2 border hover:border-violet-950 text-slate-400 hover:text-violet-950 transition-all rounded-full flex items-center justify-center bg-white shadow-sm" title="Descargar SVG Final"><FileDown size={14}/></button>}
          >
            <div className="flex flex-col h-full gap-4">
              <div className="relative group/code">
                <textarea 
                  value={row.SVG || ""} onChange={e => onUpdate({ SVG: e.target.value })} 
                  className="w-full h-32 bg-white text-slate-600 p-4 mono text-[9px] resize-none border border-slate-200 outline-none shadow-sm focus:bg-white transition-colors"
                  placeholder="SVG Output..."
                />
                <Code className="absolute top-2 right-2 text-slate-200 opacity-20 group-hover/code:opacity-100 transition-opacity" size={14}/>
              </div>
              <div className="flex-1 border-2 border-slate-200 bg-white flex items-center justify-center p-4 shadow-inner relative overflow-hidden group/preview min-h-[250px]">
                 <div className="w-full h-full flex items-center justify-center transition-transform duration-500 group-hover/preview:scale-110" 
                      dangerouslySetInnerHTML={{ __html: (row.SVG || '').includes('<svg') ? row.SVG! : '<div class="text-[10px] text-slate-200 uppercase font-medium">Waiting for render...</div>' }} />
              </div>
            </div>
          </StepBox>
        </div>
      )}
    </div>
  );
};

const StepBox: React.FC<{ label: string; status: StepStatus; onRegen: () => void; onStop: () => void; duration?: number; children: React.ReactNode; actionNode?: React.ReactNode }> = ({ label, status, onRegen, onStop, duration, children, actionNode }) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    let interval: number;
    if (status === 'processing') {
      setElapsed(0);
      interval = window.setInterval(() => { setElapsed(prev => prev + 1); }, 1000);
    }
    return () => window.clearInterval(interval);
  }, [status]);

  const bg = status === 'processing' ? 'bg-orange-50/50' : status === 'completed' ? 'bg-white' : 'bg-slate-50/50';

  return (
    <div className={`flex flex-col gap-4 min-h-[500px] border p-6 transition-all shadow-sm ${bg}`}>
      <div className="flex items-center justify-between border-b pb-4 border-slate-100">
        <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-900">{label}</h3>
        <div className="flex items-center gap-3">
          {status === 'processing' ? (
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-mono font-medium text-orange-600 animate-pulse">{elapsed}s</span>
              <button onClick={onStop} className="p-2 bg-orange-600 text-white animate-spectral rounded-full"><StopCircle size={14}/></button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {duration && <span className="text-[10px] text-slate-400 font-mono font-medium">{duration.toFixed(1)}s</span>}
              {actionNode}
              <button onClick={onRegen} className="p-2 border hover:border-violet-950 text-slate-400 hover:text-violet-950 transition-all rounded-full"><RefreshCw size={14}/></button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-visible">{children}</div>
    </div>
  );
};

const SmartNLUEditor: React.FC<{ data: any; onUpdate: (v: any) => void }> = ({ data, onUpdate }) => {
  const nlu = useMemo(() => {
    if (typeof data === 'string') {
      try { return JSON.parse(data); } catch(e) { return { utterance: '', frames: [], visual_guidelines: {} }; }
    }
    return data || { utterance: '', frames: [], visual_guidelines: {} };
  }, [data]);
  
  const updateField = (path: string[], value: any) => {
    const next = { ...nlu };
    let current = next;
    for (let i = 0; i < path.length - 1; i++) { 
      if (!current[path[i]]) current[path[i]] = {};
      current = current[path[i]]; 
    }
    current[path[path.length - 1]] = value;
    onUpdate(next);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="nlu-key">Speech Act</label>
          <select 
            value={nlu.metadata?.speech_act || ''} 
            onChange={e => updateField(['metadata', 'speech_act'], e.target.value)} 
            className="w-full border p-2 text-xs font-medium bg-white mt-1 shadow-sm"
          >
             {VOCAB.speech_act.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div>
          <label className="nlu-key">Intent</label>
          <select 
            value={nlu.metadata?.intent || ''} 
            onChange={e => updateField(['metadata', 'intent'], e.target.value)} 
            className="w-full border p-2 text-xs font-medium bg-white mt-1 shadow-sm"
          >
             {VOCAB.intent.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>
      
      <div>
        <label className="nlu-key block mb-2">Visual Logic Strategy</label>
        <div className="bg-white border p-4 shadow-inner space-y-3">
          {Object.keys(nlu.visual_guidelines || {}).map(k => (
            <div key={k} className="flex flex-col">
              <span className="text-[8px] text-slate-400 uppercase font-medium mb-1">{k.replace('_', ' ')}</span>
              <input 
                value={nlu.visual_guidelines[k] || ""} 
                onChange={e => updateField(['visual_guidelines', k], e.target.value)}
                className="nlu-val border-b border-slate-100 outline-none focus:border-violet-300 py-1 bg-transparent"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <label className="nlu-key block mb-2">Frames (Semantic Units)</label>
        {nlu.frames?.map((frame: any, fIdx: number) => (
          <div key={fIdx} className="bg-slate-50 p-3 border mb-2 text-[10px] shadow-sm">
             <div className="font-medium text-slate-800 uppercase border-b border-slate-200 mb-2 pb-1 flex justify-between">
               <span>{frame.frame_name}</span>
               <span className="opacity-40">{frame.lexical_unit}</span>
             </div>
             {Object.entries(frame.roles || {}).map(([role, data]: [string, any]) => (
               <div key={role} className="flex gap-2 mb-1">
                 <span className="font-medium w-16 text-slate-500 shrink-0">{role}:</span>
                 <span className="text-slate-900 truncate">{data.surface} <span className="text-[8px] text-violet-400">[{data.type}]</span></span>
               </div>
             ))}
          </div>
        ))}
      </div>
    </div>
  );
};

const BlocksList: React.FC<{ value: string; onChange: (v: string) => void }> = ({ value, onChange }) => {
  const blocks = value.split(',').map(b => b.trim()).filter(b => b !== "");
  return (
    <div className="border p-4 min-h-[120px] bg-white shadow-inner flex flex-wrap content-start gap-2">
      {blocks.map((b, idx) => (
        <span key={idx} className="picto-chip group hover:border-violet-400 transition-colors">
          {b}
          <X onClick={() => onChange(blocks.filter((_, i) => i !== idx).join(', '))} size={12} className="cursor-pointer hover:text-rose-600 transition-colors" />
        </span>
      ))}
      <input 
        type="text" placeholder="+ Add Element ID" 
        onKeyDown={e => { if(e.key === 'Enter' && e.currentTarget.value) { onChange(value ? `${value}, ${e.currentTarget.value}` : e.currentTarget.value); e.currentTarget.value = ''; } }}
        className="text-[11px] font-medium text-violet-950 w-full bg-transparent outline-none mt-2 pt-2 border-t border-slate-100"
      />
    </div>
  );
};

const Badge: React.FC<{ label: string; status: StepStatus }> = ({ label, status }) => {
  const styles = {
    idle: 'bg-slate-100 text-slate-300 border-slate-200',
    processing: 'bg-orange-600 text-white animate-pulse border-orange-500',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    outdated: 'bg-amber-50 text-amber-800 border-amber-300',
    error: 'bg-rose-50 text-rose-700 border-rose-300'
  };
  return <div className={`px-2.5 py-0.5 text-[8px] font-medium uppercase tracking-widest border transition-all ${styles[status]}`}>{label}</div>;
};

export default App;
