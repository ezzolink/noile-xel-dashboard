import { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { 
  Wallet, Calendar, Settings,
  CheckCircle2, Clock, Activity,
  TrendingUp, TrendingDown, Brain, Download,
  ShieldCheck, Zap, History, ChevronRight, AlertCircle,
  Cpu, Target, Sparkles, Network, Lock, Eye, EyeOff, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Types
interface FinanceData { total_projected: number; current_billing: number; }
interface Project { id: string; name: string; description: string; value: number; progress: number; status: string; }
interface MarketPrice { symbol: string; price: number; change_24h: number; }
interface AppEvent { id: string; title: string; date: string; location: string; value: number; }
interface SystemLog { id: string; message: string; type: string; created_at: string; }
interface Task { id: string; project_id: string; title: string; is_completed: boolean; }
interface StrategicInsight { id: string; title: string; analysis: string; impact_score: number; category: string; }

function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [activeTab, setActiveTab] = useState('finance');
  const [finances, setFinances] = useState<FinanceData>({ total_projected: 250000, current_billing: 50000 });
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [market, setMarket] = useState<MarketPrice[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [insights, setInsights] = useState<StrategicInsight[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'finance', label: 'Balanço', icon: Wallet },
    { id: 'projects', label: 'Hub', icon: Network },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'system', label: 'Núcleo', icon: Settings },
  ];

  useEffect(() => {
    const savedAuth = localStorage.getItem('noile_auth');
    if (savedAuth === 'true') setIsLocked(false);
    
    fetchData();
    const sub = supabase.channel('pro-sync').on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData()).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
        const { data: fin } = await supabase.from('finances').select('*').single();
        if (fin) setFinances(fin);
        const { data: proj } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (proj) setProjects(proj);
        const { data: evs } = await supabase.from('events').select('*').order('date', { ascending: true });
        if (evs) setEvents(evs);
        const { data: lg } = await supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(20);
        if (lg) setLogs(lg);
        const { data: mk } = await supabase.from('market_prices').select('*');
        if (mk) setMarket(mk);
        const { data: tk } = await supabase.from('tasks').select('*');
        if (tk) setTasks(tk);
        const { data: ins } = await supabase.from('brain_insights').select('*').order('created_at', { ascending: false });
        if (ins) setInsights(ins);
    } catch (err) { console.error("Sync Error:", err); } finally { setLoading(false); }
  };

  const handleLogin = () => {
    if (password === 'noile2026') {
        setIsLocked(false);
        localStorage.setItem('noile_auth', 'true');
    } else {
        alert('Acesso Negado. Matriz Protegida.');
    }
  };

  const chartData = useMemo(() => [
    { name: 'Jan', val: 0 }, { name: 'Feb', val: 50000 }, { name: 'Mar', val: 150000 }, { name: 'Apr', val: 280000 }, { name: 'May', val: finances.total_projected }
  ], [finances.total_projected]);

  const generateInvoice = (event: AppEvent) => {
    const doc = new jsPDF() as any;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22); doc.setTextColor(76, 201, 240);
    doc.text('NOTA DE HONORÁRIOS', 105, 30, { align: 'center' });
    
    doc.setDrawColor(76, 201, 240); doc.line(20, 35, 190, 35);
    doc.setTextColor(100); doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-PT')}`, 20, 45);
    doc.text(`REF: INV-${Date.now()}`, 20, 50);
    const clientData = [
      ['DADOS DO PRESTADOR', 'Elias Sebastião'],
      ['CLIENTE', 'ACELERADOR EMPRESARIAL - COMERCIO & SERVIÇOS, LDA'],
      ['NIF', '5001970658'],
      ['SERVIÇO', event.title],
      ['TOTAL', `${event.value?.toLocaleString()} Kz`]
    ];
    doc.autoTable({ startY: 60, body: clientData, theme: 'plain', styles: { fontSize: 10 }, columnStyles: { 0: { fontStyle: 'bold', width: 50 } } });
    doc.save(`Fatura_${event.title.replace(/\s/g, '_')}.pdf`);
  };

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    await supabase.from('tasks').update({ is_completed: !currentStatus }).eq('id', taskId);
  };

  const upcomingEvents = events.filter(ev => new Date(ev.date) >= new Date());
  const pastEvents = events.filter(ev => new Date(ev.date) < new Date());

  if (isLocked) {
    return (
        <div className="flex flex-col h-screen bg-[#030308] items-center justify-center px-10">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center w-full">
                <div className="w-20 h-20 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(76,201,240,0.2)]">
                    <Lock className="text-accent" size={32} />
                </div>
                <h1 className="text-white text-lg font-black uppercase tracking-[5px] mb-2">Security Layer</h1>
                <p className="text-slate-500 text-[10px] uppercase tracking-widest mb-10">Neural Strategist Matrix</p>
                
                <div className="w-full relative">
                    <input 
                        type={showPass ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="IDENTIFIER_KEY"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 px-6 text-center text-accent font-mono tracking-[4px] outline-none focus:border-accent/40 transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    />
                    <button 
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-accent"
                    >
                        {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                </div>
                
                <button 
                    onClick={handleLogin}
                    className="w-full mt-6 bg-accent text-black font-black py-5 rounded-2xl uppercase tracking-[3px] text-xs shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                    Aceder Núcleo
                </button>
            </motion.div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative px-5 selection:bg-accent selection:text-black">
      <header className="pt-10 pb-6 flex justify-between items-center px-2">
        <div className="flex flex-col">
            <h1 className="text-accent text-xs tracking-[8px] font-extralight uppercase opacity-80">Noile Xel</h1>
            <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]"></span>
                <span className="text-[7px] text-slate-500 uppercase font-black tracking-[2px]">Neural Strategist Active</span>
            </div>
        </div>
        <div className="text-right flex flex-col">
            <span className="text-xl font-mono font-bold tracking-tighter">{new Date().toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'})}</span>
            <span className="text-[7px] text-slate-600 uppercase font-bold tracking-widest mt-0.5">Secure Session</span>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-36 scrollbar-hide pt-2">
        <AnimatePresence mode="wait">
          {activeTab === 'finance' && (
            <motion.div key="fin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              
              {/* IA BRAIN INSIGHTS */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-accent to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                <div className="relative bg-black border border-white/5 p-5 rounded-2xl flex items-start gap-4">
                    <div className="bg-accent/10 p-2 rounded-xl border border-accent/20">
                        <Brain className="text-accent" size={20} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[8px] font-black text-accent/60 uppercase tracking-[2px]">Strategic Simulation</span>
                        <p className="text-[11px] leading-relaxed text-slate-200 font-light italic">
                        "{insights[0]?.analysis || "Calculando trajectórias de capital e impacto de mercado..."}"
                        </p>
                    </div>
                </div>
              </div>

              <div className="glass-card p-7 relative overflow-hidden group border-white/10">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity"><Target size={80} /></div>
                <div className="relative z-10">
                    <h2 className="text-[9px] text-slate-500 uppercase font-bold tracking-[3px] flex items-center gap-2 mb-4">
                        <Sparkles size={10} className="text-gold" /> Projecção de Património
                    </h2>
                    <div className="text-5xl font-mono font-bold tracking-tighter text-white">
                        {finances.total_projected?.toLocaleString('pt-PT')} <span className="text-sm text-gold/60">Kz</span>
                    </div>
                    <div className="flex justify-between items-center mt-6">
                        <div className="flex flex-col">
                            <span className="text-[7px] text-slate-500 uppercase font-black">Escalabilidade Q1</span>
                            <span className="text-[10px] text-emerald-400 font-black tracking-tighter">+40.2% Growth</span>
                        </div>
                        <div className="h-8 w-24 opacity-40">
                             <ResponsiveContainer width="100%" height={100}>
                                <AreaChart data={chartData}>
                                    <Area type="monotone" dataKey="val" stroke="#4cc9f0" fill="#4cc9f0" fillOpacity={0.2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {market.map(m => (
                  <div key={m.symbol} className="glass-card p-5 border-white/5 hover:border-accent/30 transition-all active:scale-95 cursor-pointer">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">{m.symbol} <span className="text-slate-700">/ EUR</span></span>
                      {m.change_24h > 0 ? <TrendingUp size={10} className="text-emerald-500" /> : <TrendingDown size={10} className="text-red-500" />}
                    </div>
                    <div className="text-xl font-mono font-bold tracking-tighter text-slate-100">{m.price?.toLocaleString()}</div>
                    <span className={`text-[9px] font-black ${m.change_24h > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.change_24h > 0 ? '↑' : '↓'} {Math.abs(m.change_24h)}%
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div key="proj" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              
              <div className="px-2">
                 <h2 className="text-[9px] text-slate-500 uppercase font-black tracking-[4px] mb-6">Neural Project Hub</h2>
              </div>

              {projects.map(p => (
                <div key={p.id} className={`glass-card p-7 relative overflow-hidden group ${p.name === 'Keimadura' ? 'border-l-4 border-keimadura' : 'border-l-4 border-accent'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col">
                      <h2 className="text-xl font-bold flex items-center gap-3 text-slate-100">
                        {p.name} {p.name === 'Keimadura' ? <ShieldCheck size={18} className="text-keimadura" /> : <Zap size={16} className="text-gold" />}
                      </h2>
                      <p className="text-[8px] text-slate-500 uppercase font-bold tracking-widest mt-1.5 leading-relaxed">{p.description}</p>
                    </div>
                    <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${p.status === 'Sincronizado' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-gold/10 text-gold border border-gold/20'}`}>
                        {p.status}
                    </span>
                  </div>

                  {p.name === 'Keimadura' ? (
                    <div className="space-y-5">
                        <div className="flex gap-1.5 h-12 items-end">
                            {[...Array(32)].map((_, i) => (
                                <div key={i} className="flex-1 bg-emerald-500/60 rounded-full" style={{ height: `${Math.random() * 40 + 60}%`, opacity: Math.random() > 0.1 ? 1 : 0.05 }}></div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center text-[7px] text-slate-600 font-black uppercase tracking-[2px]">
                            <span>Integrity Scan: 100%</span>
                            <span>Node Cluster: Stable</span>
                        </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">
                            <span>Checklist de Desenvolvimento</span>
                            <span>{tasks.filter(t => t.project_id === p.id && t.is_completed).length}/{tasks.filter(t => t.project_id === p.id).length}</span>
                        </div>
                        {tasks.filter(t => t.project_id === p.id).map(t => (
                        <div key={t.id} onClick={() => toggleTask(t.id, t.is_completed)} className="flex items-center justify-between bg-white/[0.03] p-4 rounded-2xl border border-white/5 active:bg-white/10 transition-all group/task">
                            <div className="flex items-center gap-4">
                                {t.is_completed ? <CheckCircle2 size={16} className="text-emerald-500" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-700"></div>}
                                <span className={`text-xs ${t.is_completed ? 'line-through text-slate-600' : 'text-slate-300'}`}>{t.title}</span>
                            </div>
                            <ChevronRight size={12} className="text-slate-800 opacity-0 group-hover/task:opacity-100 transition-opacity" />
                        </div>
                        ))}
                    </div>
                  )}

                  <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                    <div className="text-lg font-mono text-gold font-black">{p.value > 0 ? `${p.value?.toLocaleString()} Kz` : '---'}</div>
                    <button className="bg-white/5 text-slate-300 text-[8px] px-6 py-3 rounded-2xl font-black border border-white/5 hover:bg-accent hover:text-black transition-all uppercase tracking-[2px]">Aceder Matrix</button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'agenda' && (
            <motion.div key="age" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              
              <div className="glass-card p-6 border-l-4 border-red-500 bg-gradient-to-r from-red-500/[0.03] to-transparent">
                <h2 className="text-[9px] text-red-500 uppercase font-black tracking-[3px] flex items-center gap-2 mb-5">
                  <AlertCircle size={12} /> Alertas de Protocolo
                </h2>
                <div className="space-y-4 font-mono text-[10px]">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Fatura Evento 10/02</span>
                    <span className="text-red-500 font-black uppercase tracking-tighter bg-red-500/10 px-2 py-1 rounded">Atrasado</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Visita Técnica (Margarida)</span>
                    <span className="text-gold font-black uppercase tracking-tighter bg-gold/10 px-2 py-1 rounded">25 FEV</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-7">
                <h2 className="text-[9px] text-slate-500 uppercase font-black tracking-[3px] mb-8">Roadmap Sequencial</h2>
                <div className="space-y-8">
                  {upcomingEvents.map((ev, i) => (
                    <div key={i} className="flex justify-between items-center group relative">
                      {i < upcomingEvents.length - 1 && <div className="absolute left-6 top-12 bottom-[-24px] w-px bg-white/5"></div>}
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 rounded-full bg-black border-2 border-white/5 flex flex-col items-center justify-center group-hover:border-accent group-hover:shadow-[0_0_15px_rgba(76,201,240,0.3)] transition-all duration-500">
                            <span className="text-[8px] text-accent font-black uppercase tracking-tighter">{new Date(ev.date).toLocaleDateString('pt-PT', {month: 'short'})}</span>
                            <span className="text-lg font-black font-mono tracking-tighter">{new Date(ev.date).getDate()}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="text-[13px] font-bold text-slate-100 group-hover:text-accent transition-colors tracking-tight">{ev.title}</div>
                          <div className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">{ev.location}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {ev.value > 0 && (
                            <button onClick={() => generateInvoice(ev)} className="p-3.5 bg-white/5 rounded-2xl hover:bg-accent group-hover:scale-110 transition-all text-accent hover:text-black shadow-xl">
                                <Download size={15} />
                            </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6 bg-black/50 border-dashed border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><History size={40} /></div>
                <h2 className="text-[9px] text-slate-600 uppercase font-black tracking-[3px] mb-6 flex items-center gap-2"><History size={12} /> Log de Histórico</h2>
                <div className="space-y-4">
                  {pastEvents.map((ev, i) => (
                    <div key={i} className="flex justify-between items-center opacity-40 hover:opacity-80 transition-opacity">
                      <div className="flex items-center gap-4 font-mono text-[10px]">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span className="text-slate-300">{ev.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{new Date(ev.date).toLocaleDateString('pt-PT')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div key="sys" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pt-4">
              <div className="glass-card p-7 bg-black shadow-2xl border-white/10 relative overflow-hidden border border-accent/10">
                <div className="absolute top-0 left-0 w-1 h-full bg-accent shadow-[0_0_15px_#4cc9f0]"></div>
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <span className="absolute inset-0 bg-accent rounded-full animate-ping opacity-20"></span>
                            <Cpu size={24} className="text-accent relative" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[12px] text-white font-black uppercase tracking-[3px]">Neural Monitor</span>
                            <span className="text-[8px] text-emerald-500 font-black tracking-[4px]">CORE.2.6.5-ONLINE</span>
                        </div>
                    </div>
                    <button 
                        onClick={() => { localStorage.removeItem('noile_auth'); window.location.reload(); }}
                        className="text-[8px] text-red-500 border border-red-500/20 px-3 py-1.5 rounded-full font-black uppercase hover:bg-red-500 hover:text-black transition-all"
                    >
                        Encerrar Sessão
                    </button>
                </div>
                <div className="space-y-4 text-[10px] font-mono text-accent/60 leading-relaxed max-h-96 overflow-y-auto pr-2 scrollbar-hide">
                  {logs.map(l => (
                    <div key={l.id} className="flex gap-4 border-l border-white/5 pl-4 py-2 hover:bg-white/[0.02] rounded-r-xl transition-all">
                        <span className="text-slate-800 text-[8px] whitespace-nowrap pt-0.5 font-bold">[{new Date(l.created_at).toLocaleTimeString()}]</span>
                        <span className={`${l.type === 'insight' ? 'text-gold italic font-bold' : l.type === 'error' ? 'text-red-500' : 'text-accent/80 font-light'}`}>{l.message}</span>
                    </div>
                  ))}
                  <div className="flex gap-3 items-center text-emerald-500 mt-6 opacity-30 animate-pulse">
                      <Activity size={10} />
                      <span className="text-[7px] uppercase tracking-[6px] font-black">Scanning Global Node Cluster</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 bg-gradient-to-br from-white/5 to-transparent border-white/10">
                <h2 className="text-[9px] text-slate-400 uppercase font-black tracking-[3px] mb-4 flex items-center gap-2 font-bold"><ShieldCheck size={12} /> Configuração Fiscal</h2>
                <div className="bg-black/60 p-5 rounded-2xl font-mono text-[10px] text-accent/80 border border-white/5 space-y-2 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12"><FileText size={40} /></div>
                    <p className="flex justify-between"><span>CLIENTE:</span> <span className="text-white font-bold">ACELERADOR EMPRESARIAL</span></p>
                    <p className="flex justify-between"><span>NIF:</span> <span className="text-white font-bold">5001970658</span></p>
                    <p className="flex justify-between"><span>MORADA:</span> <span className="text-white font-bold">CONDOMÍNIO ZEUS</span></p>
                    <div className="pt-2 border-t border-white/5 mt-2 flex justify-between">
                        <span>ESTADO:</span> <span className="text-emerald-500 font-black">REGISTADO</span>
                    </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-10 left-8 right-8 bg-black/80 backdrop-blur-3xl p-4 flex justify-around items-center rounded-[32px] border border-white/10 shadow-2xl shadow-black z-[2000]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1.5 transition-all duration-500 relative ${activeTab === tab.id ? 'text-accent -translate-y-2' : 'text-slate-600 hover:text-slate-400'}`}
          >
            {activeTab === 'finance' && tab.id === 'finance' && (
                <motion.div layoutId="nav-glow" className="absolute -inset-4 bg-accent/10 rounded-full blur-xl z-0"></motion.div>
            )}
            <tab.icon size={22} className={`z-10 relative transition-all duration-500 ${activeTab === tab.id ? 'drop-shadow-[0_0_10px_#4cc9f0] scale-110' : 'opacity-50 hover:opacity-100'}`} />
            <span className={`text-[7px] uppercase font-black tracking-[2px] z-10 relative ${activeTab === tab.id ? 'opacity-100' : 'opacity-0 h-0 w-0 overflow-hidden'}`}>{tab.label}</span>
          </button>
        ))}
      </nav>

      {loading && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-3xl z-[3000] flex flex-col items-center justify-center text-center">
            <div className="relative mb-10">
                <Cpu className="text-accent animate-spin-slow opacity-20" size={100} />
                <div className="absolute inset-0 flex items-center justify-center">
                    <Activity className="text-accent animate-pulse" size={40} />
                </div>
                <div className="absolute inset-0 blur-3xl bg-accent/20 animate-pulse"></div>
            </div>
            <span className="text-[12px] text-accent font-mono tracking-[15px] animate-pulse uppercase font-black">Noile Core</span>
            <span className="text-[8px] text-slate-500 uppercase tracking-[4px] mt-4 opacity-50">Calibrating Decision Matrix...</span>
        </div>
      )}
    </div>
  );
}

export default App;
