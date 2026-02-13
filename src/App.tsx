import { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { 
  Wallet, Rocket, Calendar, Settings,
  CheckCircle2, Clock, Activity,
  TrendingUp, TrendingDown, Brain, Download,
  ShieldCheck, Zap, History, ChevronRight, AlertCircle,
  Cpu, ZapOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Types for better structure (TypeScript)
interface FinanceData {
  total_projected: number;
  current_billing: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
  value: number;
  progress: number;
  status: string;
}

interface MarketPrice {
  symbol: string;
  price: number;
  change_24h: number;
}

interface AppEvent {
  id: string;
  title: string;
  date: string;
  location: string;
  value: number;
}

interface SystemLog {
  id: string;
  message: string;
  type: string;
  created_at: string;
}

interface Task {
  id: string;
  project_id: string;
  title: string;
  is_completed: boolean;
}

function App() {
  const [activeTab, setActiveTab] = useState('finance');
  const [finances, setFinances] = useState<FinanceData>({ total_projected: 250000, current_billing: 50000 });
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [market, setMarket] = useState<MarketPrice[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'finance', label: 'Balanço', icon: Wallet },
    { id: 'projects', label: 'Projetos', icon: Rocket },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'system', label: 'Núcleo', icon: Settings },
  ];

  useEffect(() => {
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
    } catch (err) {
        console.error("Fetch Error:", err);
    } finally {
        setLoading(false);
    }
  };

  const aiInsight = useMemo(() => {
    const lastInsight = logs.find(l => l.type === 'insight');
    return lastInsight ? lastInsight.message.replace('🧠 AI Insight: ', '') : "Analisando fluxo de dados... Standby.";
  }, [logs]);

  const chartData = [
    { name: 'Jan', val: 0 },
    { name: 'Feb', val: 50000 },
    { name: 'Mar', val: 150000 },
    { name: 'Apr', val: 280000 },
    { name: 'May', val: finances.total_projected },
  ];

  const generateInvoice = (event: AppEvent) => {
    const doc = new jsPDF() as any;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(76, 201, 240);
    doc.text('NOTA DE HONORÁRIOS', 105, 30, { align: 'center' });
    
    doc.setDrawColor(76, 201, 240);
    doc.line(20, 35, 190, 35);

    doc.setTextColor(100);
    doc.setFontSize(10);
    doc.text(`Data de Emissão: ${new Date().toLocaleDateString('pt-PT')}`, 20, 45);
    doc.text(`Referência: INV-${Date.now()}`, 20, 50);
    
    const clientData = [
      ['DADOS DO PRESTADOR', ''],
      ['Nome', 'Elias Sebastião'],
      ['E-mail', 'eliasjoao.sebastiao@gmail.com'],
      ['', ''],
      ['DADOS DO CLIENTE', ''],
      ['Razão Social', 'ACELERADOR EMPRESARIAL - COMERCIO & SERVIÇOS, LDA'],
      ['NIF', '5001970658'],
      ['Morada', 'Condomínio Zeus, Luanda'],
      ['', ''],
      ['DETALHES DO SERVIÇO', ''],
      ['Evento', event.title],
      ['Data do Evento', new Date(event.date).toLocaleDateString('pt-PT')],
      ['Local', event.location || 'N/A'],
      ['VALOR TOTAL', `${event.value?.toLocaleString()} Kz`]
    ];

    doc.autoTable({
      startY: 60,
      body: clientData,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: { 0: { fontStyle: 'bold', width: 50 } }
    });

    doc.save(`Fatura_${event.title.replace(/\s/g, '_')}.pdf`);
  };

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    await supabase.from('tasks').update({ is_completed: !currentStatus }).eq('id', taskId);
  };

  const upcomingEvents = events.filter(ev => new Date(ev.date) >= new Date());
  const pastEvents = events.filter(ev => new Date(ev.date) < new Date());

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative px-5">
      <header className="pt-8 pb-4 flex justify-between items-center px-2">
        <div className="flex flex-col">
            <h1 className="text-accent text-xs tracking-[8px] font-light uppercase">Noile Xel</h1>
            <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">TS Core Online</span>
            </div>
        </div>
        <div className="text-right">
            <div className="text-[14px] font-mono font-bold">{new Date().toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit'})}</div>
            <div className="text-[8px] text-slate-500 uppercase font-mono">Luanda (GMT+1)</div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 scrollbar-hide pt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'finance' && (
            <motion.div key="fin" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-5">
              <div className="bg-accent/10 border border-accent/20 p-4 rounded-2xl flex items-start gap-3 shadow-lg shadow-accent/5">
                <Brain className="text-accent shrink-0" size={18} />
                <div className="flex flex-col gap-1">
                    <span className="text-[8px] font-bold text-accent uppercase tracking-widest">IA Strategic Insight</span>
                    <p className="text-[10px] leading-relaxed text-accent/90 italic">
                    "{aiInsight}"
                    </p>
                </div>
              </div>

              <div className="glass-card p-6 overflow-hidden relative border-t-2 border-accent/30">
                <div className="relative z-10">
                    <h2 className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Wallet size={12} /> Património Projectado
                    </h2>
                    <div className="text-4xl font-semibold mt-4 mb-2 flex items-baseline gap-2 font-mono tracking-tighter">
                    {finances.total_projected?.toLocaleString('pt-PT')} <span className="text-sm text-gold">Kz</span>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                        <p className="text-[9px] text-slate-500 font-mono uppercase">Liquidez Esperada (Q1)</p>
                        <span className="text-[10px] text-emerald-400 font-bold tracking-tighter flex items-center gap-1">
                            <TrendingUp size={10} /> +40% vs JAN
                        </span>
                    </div>
                </div>
                
                <div className="absolute inset-0 top-16 opacity-20 pointer-events-none">
                    <ResponsiveContainer width="100%" height={100}>
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#4cc9f0" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#4cc9f0" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <Area type="monotone" dataKey="val" stroke="#4cc9f0" fillOpacity={1} fill="url(#colorVal)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-2">
                {market.map(m => (
                  <div key={m.symbol} className="glass-card p-4 group hover:border-accent/40 transition-colors bg-gradient-to-br from-white/5 to-transparent">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] text-slate-400 font-bold tracking-tighter">{m.symbol}/EUR</span>
                      {m.change_24h > 0 ? <TrendingUp size={12} className="text-emerald-500" /> : <TrendingDown size={12} className="text-red-500" />}
                    </div>
                    <div className="text-xl font-mono font-bold mt-1 tracking-tighter">{m.price?.toLocaleString()}</div>
                    <div className={`text-[9px] font-bold ${m.change_24h > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                      {m.change_24h > 0 ? '+' : ''}{m.change_24h}%
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-card p-5">
                 <h2 className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">Breakdown Ativo</h2>
                 <div className="space-y-4">
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">Grupo Acelerador (5x)</span>
                        <span className="text-slate-100 font-mono">250.000 Kz</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] opacity-40">
                        <span className="text-slate-400 italic">Novos Projectos em Pipeline</span>
                        <span className="text-slate-100 font-mono">Standby</span>
                    </div>
                    <div className="pt-3 border-t border-white/10 flex justify-between items-center">
                        <span className="text-[9px] text-accent uppercase font-bold tracking-[2px]">Total Projectado</span>
                        <span className="text-gold font-mono text-sm font-bold">{finances.total_projected?.toLocaleString()} Kz</span>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div key="proj" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-5">
              {projects.map(p => (
                <div key={p.id} className={`glass-card p-6 relative overflow-hidden group ${p.name === 'Keimadura' ? 'border-l-4 border-keimadura' : 'border-l-4 border-accent'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        {p.name} {p.name === 'Keimadura' ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Zap size={14} className="text-gold animate-pulse" />}
                      </h2>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest leading-relaxed">{p.description}</p>
                    </div>
                  </div>

                  {p.name === 'Keimadura' ? (
                    <div className="space-y-4 mt-4">
                        <div className="flex gap-2">
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded-full font-bold">AUDIT OK</span>
                            <span className="text-[8px] bg-accent/10 text-accent border border-accent/20 px-2 py-1 rounded-full font-bold uppercase tracking-tighter">Sync Active</span>
                            <span className="text-[8px] bg-white/5 text-slate-400 border border-white/10 px-2 py-1 rounded-full font-bold">V.2.1</span>
                        </div>
                        <div className="flex gap-1 h-10 items-end opacity-40">
                            {[...Array(28)].map((_, i) => (
                                <div key={i} className="flex-1 bg-emerald-500 rounded-sm transition-all" style={{ height: `${Math.random() * 40 + 60}%`, opacity: Math.random() > 0.2 ? 1 : 0.1 }}></div>
                            ))}
                        </div>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-6">
                        <div className="flex justify-between items-center text-[8px] text-slate-500 uppercase tracking-widest mb-1 font-bold">
                            <span>Checklist Operacional</span>
                            <span>{tasks.filter(t => t.project_id === p.id && t.is_completed).length}/{tasks.filter(t => t.project_id === p.id).length}</span>
                        </div>
                        {tasks.filter(t => t.project_id === p.id).map(t => (
                        <div key={t.id} onClick={() => toggleTask(t.id, t.is_completed)} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5 cursor-pointer active:scale-95 transition-all hover:bg-white/10">
                            <div className="flex items-center gap-3">
                                {t.is_completed ? <ShieldCheck size={16} className="text-emerald-500" /> : <Clock size={16} className="text-slate-600" />}
                                <span className={`text-[11px] ${t.is_completed ? 'line-through text-slate-600 font-light' : 'text-slate-200'}`}>{t.title}</span>
                            </div>
                            <ChevronRight size={10} className="text-slate-700" />
                        </div>
                        ))}
                    </div>
                  )}

                  <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                    <div>
                        <span className="text-[8px] text-slate-500 uppercase font-bold tracking-tighter block mb-1">Contract Value</span>
                        <div className="text-lg font-mono text-gold font-bold">{p.value > 0 ? `${p.value?.toLocaleString()} Kz` : 'VALOR FIXO'}</div>
                    </div>
                    <button className="bg-accent text-black text-[9px] px-6 py-3 rounded-2xl font-black border border-accent/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-[2px] shadow-lg shadow-accent/20">Aceder Hub</button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'agenda' && (
            <motion.div key="age" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              
              <div className="glass-card p-6 border-t-4 border-red-500/50 bg-gradient-to-b from-red-500/5 to-transparent">
                <h2 className="text-[10px] text-red-400 uppercase tracking-widest flex items-center gap-2 mb-4 font-bold">
                  <AlertCircle size={12} /> Alertas de Acção Crítica
                </h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-[11px] text-slate-300 font-medium">Fatura Evento 10/02</span>
                    <span className="text-[8px] font-black text-red-500 bg-red-500/10 px-2 py-1 rounded-full border border-red-500/20 uppercase tracking-tighter">Liquidamento Pendente</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[11px] text-slate-300 font-medium">Visita Técnica (Margarida)</span>
                    <span className="text-[8px] font-black text-gold bg-gold/10 px-2 py-1 rounded-full border border-gold/20 uppercase tracking-tighter">Agendada: 25 FEV</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-2 font-bold"><Calendar size={12} /> Cronograma do Trimestre</h2>
                    <div className="flex gap-1">
                        <span className="w-1 h-1 rounded-full bg-accent"></span>
                        <span className="w-1 h-1 rounded-full bg-accent opacity-50"></span>
                        <span className="w-1 h-1 rounded-full bg-accent opacity-20"></span>
                    </div>
                </div>
                <div className="space-y-6">
                  {upcomingEvents.map((ev, i) => (
                    <div key={i} className="flex justify-between items-center group">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex flex-col items-center justify-center border border-white/10 group-hover:border-accent/40 group-hover:bg-accent/5 transition-all duration-500">
                            <span className="text-[9px] text-accent font-black uppercase tracking-tighter">{new Date(ev.date).toLocaleDateString('pt-PT', {month: 'short'})}</span>
                            <span className="text-xl font-black font-mono tracking-tighter">{new Date(ev.date).getDate()}</span>
                        </div>
                        <div>
                          <div className="text-[13px] font-bold tracking-tight text-slate-100 group-hover:text-accent transition-colors">{ev.title}</div>
                          <div className="text-[9px] text-slate-500 mt-1 uppercase tracking-[1px] font-mono flex items-center gap-1">
                              <Activity size={8} /> {ev.location}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[11px] font-mono font-bold text-gold">{ev.value > 0 ? `${ev.value?.toLocaleString()} Kz` : '---'}</span>
                        {ev.value > 0 && (
                            <button onClick={() => generateInvoice(ev)} className="p-3 bg-white/5 rounded-xl hover:bg-accent group-hover:scale-110 active:scale-95 transition-all shadow-xl hover:shadow-accent/20 group-hover:rotate-3">
                                <Download size={14} className="text-accent group-hover:text-black" />
                            </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6 bg-black/40 border-dashed border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><History size={40} /></div>
                <h2 className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-6 font-bold"><History size={12} /> Log de Actividade Passada</h2>
                <div className="space-y-4">
                  {pastEvents.map((ev, i) => (
                    <div key={i} className="flex justify-between items-center opacity-50 hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <CheckCircle2 size={14} className="text-emerald-500" />
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-slate-200">{ev.title}</div>
                          <div className="text-[9px] text-slate-500 font-mono">{new Date(ev.date).toLocaleDateString('pt-PT')}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">{ev.value?.toLocaleString()} Kz</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div key="sys" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="glass-card p-6 bg-black/95 font-mono relative overflow-hidden shadow-2xl border border-accent/20">
                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <span className="absolute inset-0 bg-accent rounded-full animate-ping opacity-20"></span>
                            <Cpu size={20} className="text-accent relative" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] text-accent uppercase font-black tracking-widest">Noile Xel Engine</span>
                            <span className="text-[7px] text-emerald-500 font-bold tracking-[3px]">STABLE KERNEL 2.6.5</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[8px] text-slate-600 font-bold">UPTIME</span>
                        <span className="text-[10px] text-slate-400">99.9%</span>
                    </div>
                </div>
                <div className="space-y-4 text-[9px] text-accent/60 leading-relaxed max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                  {logs.map(l => (
                    <div key={l.id} className="flex gap-3 border-l-2 border-accent/10 pl-3 py-1 hover:bg-white/[0.03] transition-colors rounded-r-lg">
                        <span className="text-slate-700 whitespace-nowrap">[{new Date(l.created_at).toLocaleTimeString('pt-PT', {hour:'2-digit', minute:'2-digit', second:'2-digit'})}]</span>
                        <span className={`${l.type === 'insight' ? 'text-gold italic font-medium' : 'text-accent/80'}`}>{l.message}</span>
                    </div>
                  ))}
                  <div className="flex gap-2 items-center text-emerald-500 mt-6 animate-pulse">
                      <Activity size={10} />
                      <span className="text-[8px] uppercase tracking-[4px] font-black">Scanning Global Node Cluster...</span>
                  </div>
                </div>
              </div>
              
              <div className="glass-card p-5 bg-gradient-to-br from-white/5 to-transparent">
                <h2 className="text-[10px] text-slate-400 uppercase tracking-widest mb-4 font-bold flex items-center gap-2"><ShieldCheck size={12} /> Configuração de Agente</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Model Provider</span>
                        <div className="text-[10px] font-bold">DeepMind Antigravity</div>
                    </div>
                    <div className="space-y-1 text-right">
                        <span className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Auth Layer</span>
                        <div className="text-[10px] font-bold text-accent">OAuth 2.1 Secured</div>
                    </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-8 left-6 right-6 glass-card p-4 flex justify-around items-center shadow-2xl shadow-black z-[2000] border-white/20">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-500 ${activeTab === tab.id ? 'text-accent -translate-y-4 scale-110' : 'text-slate-600'}`}
          >
            <tab.icon size={22} className={activeTab === tab.id ? 'drop-shadow-[0_0_12px_rgba(76,201,240,0.9)]' : 'grayscale opacity-60'} />
            <span className={`text-[7px] uppercase font-black tracking-widest ${activeTab === tab.id ? 'opacity-100' : 'opacity-0'}`}>{tab.label}</span>
          </button>
        ))}
      </nav>

      {loading && (
        <div className="absolute inset-0 bg-bg/95 backdrop-blur-3xl z-[3000] flex items-center justify-center">
          <div className="flex flex-col items-center gap-8">
            <div className="relative">
                <Cpu className="text-accent animate-spin-slow" size={60} />
                <div className="absolute inset-0 blur-2xl bg-accent/30 animate-pulse"></div>
            </div>
            <div className="flex flex-col items-center gap-2">
                <span className="text-[12px] text-accent font-mono tracking-[15px] animate-pulse uppercase font-black">Noile Core</span>
                <span className="text-[7px] text-slate-500 uppercase tracking-[4px]">Synthesizing Neural Matrix...</span>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

export default App;
