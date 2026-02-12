import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { 
  Wallet, Rocket, Calendar, Settings, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Clock, AlertCircle, Activity, FileText, Plus,
  TrendingUp, TrendingDown, DollarSign, Brain, Bell, Download,
  LayoutDashboard, PieChart as PieIcon, ShieldCheck, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function App() {
  const [activeTab, setActiveTab] = useState('finance');
  const [finances, setFinances] = useState({ total_projected: 338000, current_billing: 50000 });
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [market, setMarket] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [tasks, setTasks] = useState([]);
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
    return () => supabase.removeChannel(sub);
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

        const { data: lg } = await supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(5);
        if (lg) setLogs(lg);

        const { data: mk } = await supabase.from('market_prices').select('*');
        if (mk) setMarket(mk);

        const { data: ex } = await supabase.from('expenses').select('*').order('date', { ascending: false });
        if (ex) setExpenses(ex);

        const { data: tk } = await supabase.from('tasks').select('*');
        if (tk) setTasks(tk);
    } catch (err) {
        console.error("Fetch Error:", err);
    } finally {
        setLoading(false);
    }
  };

  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + Number(e.amount), 0), [expenses]);
  const netProfit = (finances.total_projected || 0) - totalExpenses;

  const chartData = [
    { name: 'Jan', val: 0 },
    { name: 'Feb', val: 50000 },
    { name: 'Mar', val: 150000 },
    { name: 'Apr', val: 280000 },
    { name: 'May', val: netProfit },
  ];

  const generateInvoice = (event) => {
    const doc = new jsPDF();
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

    doc.setFontSize(8);
    doc.text('Esta nota de honorários serve como comprovativo de prestação de serviço técnico.', 105, 280, { align: 'center' });

    doc.save(`Fatura_${event.title.replace(/\s/g, '_')}.pdf`);
  };

  const toggleTask = async (taskId, currentStatus) => {
    await supabase.from('tasks').update({ is_completed: !currentStatus }).eq('id', taskId);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative px-5">
      <header className="pt-8 pb-4 flex justify-between items-center px-2">
        <div>
            <h1 className="text-accent text-xs tracking-[8px] font-light uppercase">Noile Xel</h1>
            <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[8px] text-slate-500 uppercase font-bold tracking-widest">Core Online</span>
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
                <p className="text-[10px] leading-relaxed text-accent/90">
                  "Elias, a SOL está em zona de suporte nos 67€. Estratégia de scalping sugerida se romper os 68.50€."
                </p>
              </div>

              <div className="glass-card p-6 overflow-hidden relative">
                <div className="relative z-10">
                    <h2 className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Wallet size={12} /> Projecção Financeira
                    </h2>
                    <div className="text-4xl font-semibold mt-4 mb-2 flex items-baseline gap-2">
                    {netProfit.toLocaleString('pt-PT')} <span className="text-sm text-gold font-mono">Kz</span>
                    </div>
                    <p className="text-[9px] text-slate-500 font-mono">LUCRO LÍQUIDO ESTIMADO</p>
                </div>
                
                <div className="absolute inset-0 top-16 opacity-30 pointer-events-none">
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
                  <div key={m.symbol} className="glass-card p-4 group hover:border-accent/40 transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] text-slate-400 font-bold tracking-tighter">{m.symbol}/EUR</span>
                      {m.change_24h > 0 ? <TrendingUp size={12} className="text-emerald-500" /> : <TrendingDown size={12} className="text-red-500" />}
                    </div>
                    <div className="text-lg font-mono font-bold mt-1 tracking-tighter">{m.price}</div>
                    <div className={`text-[9px] font-bold ${m.change_24h > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                      {m.change_24h > 0 ? '+' : ''}{m.change_24h}%
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-card p-5">
                 <h2 className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">Cashflow Stream</h2>
                 <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-300">Revenue (Projected)</span>
                        <span className="text-emerald-400 font-mono">+{finances.total_projected?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-300">Expenses</span>
                        <span className="text-red-400 font-mono">-{totalExpenses.toLocaleString()}</span>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div key="proj" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="space-y-5">
              {projects.map(p => (
                <div key={p.id} className="glass-card p-6 border-l-4 border-accent relative overflow-hidden group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        {p.name} <Zap size={14} className="text-gold animate-pulse" />
                      </h2>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest">{p.description}</p>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-mono text-gold bg-gold/10 px-2 py-1 rounded">15 DIAS</span>
                        <span className="text-[8px] text-slate-600 mt-1 uppercase font-bold">Priority: High</span>
                    </div>
                  </div>

                  <div className="space-y-3 mt-6">
                    <div className="flex justify-between items-center">
                         <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">Checklist Operacional</p>
                         <span className="text-[8px] text-accent font-mono">SYNC STATUS: OK</span>
                    </div>
                    {tasks.filter(t => t.project_id === p.id).map(t => (
                      <div key={t.id} onClick={() => toggleTask(t.id, t.is_completed)} className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5 cursor-pointer active:scale-95 transition-all">
                        <div className="flex items-center gap-3">
                            {t.is_completed ? <ShieldCheck size={16} className="text-emerald-500" /> : <Clock size={16} className="text-slate-600" />}
                            <span className={`text-xs ${t.is_completed ? 'line-through text-slate-600' : 'text-slate-300'}`}>{t.title}</span>
                        </div>
                        <ArrowUpRight size={12} className="text-slate-700 opacity-0 group-hover:opacity-100" />
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                    <div>
                        <div className="text-[8px] text-slate-500 uppercase tracking-tighter">Valor de Contrato</div>
                        <div className="text-lg font-mono text-gold font-bold">{p.value?.toLocaleString()} <span className="text-[10px]">Kz</span></div>
                    </div>
                    <button className="bg-accent/10 text-accent text-[10px] px-6 py-3 rounded-2xl font-bold border border-accent/20 hover:bg-accent hover:text-black transition-all">WORKSPACE ➔</button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'agenda' && (
            <motion.div key="age" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar size={12} /> Roadmap de Eventos</h2>
                    <span className="text-[9px] bg-red-500/10 text-red-500 px-2 py-1 rounded font-bold border border-red-500/10">1 FATURA ATRASADA</span>
                </div>
                <div className="space-y-6">
                  {events.map((ev, i) => (
                    <div key={i} className="flex justify-between items-center group">
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 flex flex-col items-center justify-center border border-white/10 group-hover:border-accent/40 transition-all">
                            <span className="text-[9px] text-accent font-bold uppercase">{new Date(ev.date).toLocaleDateString('pt-PT', {month: 'short'})}</span>
                            <span className="text-lg font-bold">{new Date(ev.date).getDate()}</span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold tracking-tight">{ev.title}</div>
                          <div className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">{ev.location}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-xs font-mono font-bold text-gold">{ev.value?.toLocaleString()} Kz</span>
                        <button onClick={() => generateInvoice(ev)} className="p-3 bg-white/5 rounded-xl hover:bg-accent group-hover:translate-x-1 transition-all">
                            <Download size={16} className="text-accent group-hover:text-black" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6 border-t-4 border-accent/20">
                <h2 className="text-[10px] text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Plus size={12} /> Centro Fiscal</h2>
                <div className="bg-black/80 p-5 rounded-2xl font-mono text-[9px] text-accent/80 border border-white/5 leading-loose">
                  <span className="text-slate-600">// CLIENT DATA FOR AUTO-FILL</span><br/>
                  NAME: ACELERADOR EMPRESARIAL LDA<br/>
                  NIF: 5001970658<br/>
                  ADDR: CONDOMÍNIO ZEUS, LUANDA
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div key="sys" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                  <div className="glass-card p-5">
                      <span className="text-[9px] text-slate-500 uppercase font-bold">Voz Neural</span>
                      <div className="text-xs font-semibold mt-2">George (ElevenLabs)</div>
                  </div>
                  <div className="glass-card p-5 text-right">
                      <span className="text-[9px] text-slate-500 uppercase font-bold">Engine</span>
                      <div className="text-xs font-semibold mt-2 text-accent">Gemini 3 Pro</div>
                  </div>
              </div>

              <div className="glass-card p-6 bg-black/95 font-mono relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                        <span className="text-[10px] text-accent uppercase tracking-tighter">Live Monitor</span>
                    </div>
                    <span className="text-[8px] text-slate-700">KERNEL V.2.5.0-STABLE</span>
                </div>
                <div className="space-y-3 text-[9px] text-accent/60 leading-relaxed max-h-48 overflow-y-auto pr-2 scrollbar-hide">
                  {logs.map(l => (
                    <p key={l.id} className="border-l border-accent/20 pl-3 py-1">{`> [${new Date(l.created_at).toLocaleTimeString()}] ${l.message}`}</p>
                  ))}
                  <p className="animate-pulse">{`> [SYNCING...]`}</p>
                </div>
              </div>

              <button onClick={() => fetchData()} className="w-full bg-white/5 border border-white/10 py-5 rounded-[28px] text-[10px] uppercase font-bold tracking-[5px] flex items-center justify-center gap-3 hover:bg-white/10 transition-all active:scale-95 shadow-xl">
                 <Activity size={14} className="text-accent" /> Manual Sync
              </button>
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
                <Activity className="text-accent animate-spin-slow" size={60} />
                <div className="absolute inset-0 blur-2xl bg-accent/30 animate-pulse"></div>
            </div>
            <div className="flex flex-col items-center gap-2">
                <span className="text-[12px] text-accent font-mono tracking-[12px] animate-pulse">NOILE-XEL</span>
                <span className="text-[8px] text-slate-500 uppercase tracking-[4px]">Initializing Engine...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
