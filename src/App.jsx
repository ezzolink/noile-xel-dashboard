import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './lib/supabase';
import { 
  Wallet, Rocket, Calendar, Settings, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Clock, AlertCircle, Activity, FileText, Plus,
  TrendingUp, TrendingDown, DollarSign, Brain, Bell, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
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

  useEffect(() => {
    fetchData();
    const sub = supabase.channel('pro-sync').on('postgres_changes', { event: '*', schema: 'public' }, () => fetchData()).subscribe();
    return () => supabase.removeChannel(sub);
  }, []);

  const fetchData = async () => {
    setLoading(true);
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
    
    setLoading(false);
  };

  const totalExpenses = useMemo(() => expenses.reduce((sum, e) => sum + Number(e.amount), 0), [expenses]);
  const netProfit = finances.total_projected - totalExpenses;

  const generateInvoice = (event) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('NOTA DE HONORÁRIOS', 20, 20);
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString()}`, 20, 30);
    
    const clientData = [
      ['Prestador', 'Elias Sebastião'],
      ['Cliente', 'ACELERADOR EMPRESARIAL - COMERCIO & SERVIÇOS, LDA'],
      ['NIF Cliente', '5001970658'],
      ['Serviço', event.title],
      ['Valor', `${event.value?.toLocaleString()} Kz`]
    ];

    doc.autoTable({
      startY: 40,
      head: [['Campo', 'Informação']],
      body: clientData,
      theme: 'grid',
      headStyles: { fillColor: [76, 201, 240] }
    });

    doc.save(`Fatura_${event.title.replace(/\s/g, '_')}.pdf`);
  };

  const toggleTask = async (taskId, currentStatus) => {
    await supabase.from('tasks').update({ is_completed: !currentStatus }).eq('id', taskId);
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative px-5">
      <header className="pt-8 pb-4 text-center">
        <h1 className="text-accent text-sm tracking-[10px] font-light uppercase drop-shadow-[0_0_15px_rgba(76,201,240,0.5)]">
          Noile Xel Pro
        </h1>
        <div className="flex justify-center gap-4 mt-2">
            <div className="text-[9px] text-slate-500 font-mono uppercase flex items-center gap-1">
                <Clock size={10} /> {new Date().toLocaleTimeString('pt-PT')}
            </div>
            <div className="text-[9px] text-emerald-500 font-mono uppercase flex items-center gap-1">
                <Activity size={10} /> Live Sync
            </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 scrollbar-hide pt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'finance' && (
            <motion.div key="fin" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
              {/* AI INSIGHT */}
              <div className="bg-accent/10 border border-accent/20 p-4 rounded-2xl flex items-start gap-3">
                <Brain className="text-accent shrink-0" size={18} />
                <p className="text-[11px] leading-relaxed text-accent/90 italic">
                  "Elias, detectei que a fatura de 10/02 ainda não foi liquidada. Queres que gere o PDF de cobrança agora?"
                </p>
              </div>

              <div className="glass-card p-6">
                <h2 className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Wallet size={12} /> Balanço Geral (Cashflow)
                </h2>
                <div className="text-4xl font-semibold mt-4 mb-2 flex items-baseline gap-2">
                  {netProfit.toLocaleString('pt-PT')} <span className="text-sm text-gold">Kz</span>
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>BRUTO: {finances.total_projected?.toLocaleString()}</span>
                  <span className="text-red-400">DESPESAS: {totalExpenses.toLocaleString()}</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-6">
                  <div className="h-full bg-accent transition-all duration-1000" style={{ width: '45%' }} />
                </div>
              </div>

              {/* MARKET TREND */}
              <div className="grid grid-cols-2 gap-4">
                {market.map(m => (
                  <div key={m.symbol} className="glass-card p-4">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] text-slate-400 font-bold">{m.symbol}/EUR</span>
                      {m.change_24h > 0 ? <TrendingUp size={12} className="text-emerald-500" /> : <TrendingDown size={12} className="text-red-500" />}
                    </div>
                    <div className="text-lg font-mono font-bold mt-1">{m.price}</div>
                    <div className={`text-[9px] font-bold ${m.change_24h > 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                      {m.change_24h > 0 ? '+' : ''}{m.change_24h}%
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div key="proj" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
              {projects.map(p => (
                <div key={p.id} className="glass-card p-6 border-l-4 border-accent relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-lg font-semibold">{p.name}</h2>
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest">{p.description}</p>
                    </div>
                    <span className="badge badge-warn">15 DIAS</span>
                  </div>

                  {/* MINI KANBAN TASKS */}
                  <div className="space-y-2 mt-4">
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider mb-2">Checklist de Entrega</p>
                    {tasks.filter(t => t.project_id === p.id).map(t => (
                      <div key={t.id} onClick={() => toggleTask(t.id, t.is_completed)} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 cursor-pointer">
                        {t.is_completed ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Clock size={14} className="text-slate-600" />}
                        <span className={`text-xs ${t.is_completed ? 'line-through text-slate-600' : 'text-slate-300'}`}>{t.title}</span>
                      </div>
                    ))}
                    <button className="text-[9px] text-accent flex items-center gap-1 mt-2 opacity-60"><Plus size={10} /> Adicionar Tarefa</button>
                  </div>

                  <div className="mt-6 flex justify-between items-center">
                    <div className="text-sm font-mono text-gold">{p.value?.toLocaleString()} Kz</div>
                    <button className="bg-accent/10 text-accent text-[9px] px-4 py-2 rounded-full font-bold border border-accent/20">CONFIGURAR PWA</button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'agenda' && (
            <motion.div key="age" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
              <div className="glass-card p-6">
                <h2 className="text-[10px] text-slate-400 uppercase tracking-widest mb-6">Próximos Eventos & Faturas</h2>
                <div className="space-y-4">
                  {events.map((ev, i) => (
                    <div key={i} className="flex justify-between items-center py-4 border-b border-white/5 last:border-0 group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-accent/5 flex flex-col items-center justify-center border border-accent/10">
                            <span className="text-[8px] text-accent font-bold uppercase">{new Date(ev.date).toLocaleDateString('pt-PT', {month: 'short'})}</span>
                            <span className="text-sm font-bold">{new Date(ev.date).getDate()}</span>
                        </div>
                        <div>
                          <div className="text-sm font-semibold">{ev.title}</div>
                          <div className="text-[10px] text-slate-500">{ev.location}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-[10px] font-mono text-gold">{ev.value?.toLocaleString()} Kz</span>
                        <button onClick={() => generateInvoice(ev)} className="p-2 bg-white/5 rounded-lg hover:bg-accent/20 transition-colors">
                            <FileText size={14} className="text-accent" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div key="sys" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
              <div className="glass-card p-6">
                <h2 className="text-[10px] text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Bell size={12} className="text-accent" /> Central de Notificações PWA
                </h2>
                <button className="w-full bg-white/5 border border-white/10 py-4 rounded-2xl text-[10px] uppercase font-bold tracking-widest">
                    Activar Notificações Push
                </button>
              </div>

              <div className="glass-card p-6 bg-black/90 font-mono">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] text-accent uppercase tracking-tighter animate-pulse">Core-Logs Active</span>
                    <span className="text-[8px] text-slate-600">V.2.0.1</span>
                </div>
                <div className="space-y-2 text-[9px] text-accent/70 leading-relaxed">
                  {logs.map(l => (
                    <p key={l.id}>{`> [${new Date(l.created_at).toLocaleTimeString()}] ${l.message}`}</p>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-8 left-6 right-6 glass-card p-4 flex justify-around items-center shadow-2xl shadow-black z-[2000]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === tab.id ? 'text-accent -translate-y-2' : 'text-slate-500'}`}
          >
            <tab.icon size={22} className={activeTab === tab.id ? 'drop-shadow-[0_0_8px_rgba(76,201,240,0.8)]' : 'grayscale'} />
            <span className="text-[7px] uppercase font-bold">{tab.label}</span>
          </button>
        ))}
      </nav>

      {loading && (
        <div className="absolute inset-0 bg-bg/90 backdrop-blur-xl z-[3000] flex items-center justify-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
                <Activity className="text-accent animate-spin" size={48} />
                <div className="absolute inset-0 blur-lg bg-accent/20 animate-pulse"></div>
            </div>
            <span className="text-[10px] text-accent font-mono tracking-[10px] animate-pulse">CRYPT-SYNC</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
