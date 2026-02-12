import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { 
  Wallet, 
  Rocket, 
  Calendar, 
  Settings, 
  ArrowUpRight, 
  ArrowDownRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function App() {
  const [activeTab, setActiveTab] = useState('finance');
  const [finances, setFinances] = useState({ total_projected: 338000, current_billing: 50000 });
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const subscription = supabase
      .channel('any')
      .on('postgres_changes', { event: '*', schema: 'public' }, payload => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: fin } = await supabase.from('finances').select('*').single();
    if (fin) setFinances(fin);

    const { data: proj } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (proj) setProjects(proj);

    const { data: evs } = await supabase.from('events').select('*').order('date', { ascending: true });
    if (evs) setEvents(evs);

    const { data: lg } = await supabase.from('logs').select('*').order('created_at', { ascending: false }).limit(10);
    if (lg) setLogs(lg);
    
    setLoading(false);
  };

  const tabs = [
    { id: 'finance', label: 'Balanço', icon: Wallet },
    { id: 'projects', label: 'Projetos', icon: Rocket },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'system', label: 'Núcleo', icon: Settings },
  ];

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative px-5">
      <header className="pt-8 pb-4 text-center">
        <h1 className="text-accent text-sm tracking-[10px] font-light uppercase drop-shadow-[0_0_15px_rgba(76,201,240,0.5)]">
          Noile Xel Pro
        </h1>
        <div className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-widest">
          {new Date().toLocaleTimeString('pt-PT')} | Luanda
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32 scrollbar-hide pt-4">
        <AnimatePresence mode="wait">
          {activeTab === 'finance' && (
            <motion.div 
              key="finance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              <div className="glass-card p-6">
                <h2 className="text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Wallet size={12} /> Capital Projectado
                </h2>
                <div className="text-4xl font-semibold mt-4 mb-2 flex items-baseline gap-2">
                  {finances.total_projected?.toLocaleString('pt-PT')} <span className="text-lg text-gold font-mono">Kz</span>
                </div>
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-6">
                  <div 
                    className="h-full bg-gradient-to-r from-accent to-blue-500 transition-all duration-1000"
                    style={{ width: `${(finances.current_billing / finances.total_projected) * 100}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">Acelerador</span>
                  <span className="block text-xl font-semibold text-gold mt-1">250k</span>
                </div>
                <div className="glass-card p-5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">Piedade</span>
                  <span className="block text-xl font-semibold text-gold mt-1">88k</span>
                </div>
              </div>

              <div className="glass-card p-6">
                <h2 className="text-[10px] text-slate-400 uppercase tracking-widest">Market Status</h2>
                <div className="mt-4 space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-sm">Solana (SOL)</span>
                    <span className="text-sm font-mono text-gold">0.045 <span className="text-[10px] text-slate-500 ml-1">RECUPERANDO</span></span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm">Bitcoin (BTC)</span>
                    <span className="text-sm font-mono">56,567 <span className="text-[10px] text-slate-500 ml-1">EUR</span></span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'projects' && (
            <motion.div 
              key="projects"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              <div className="glass-card p-6 border-l-4 border-accent">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-semibold">Mãos da Daddy</h2>
                    <p className="text-xs text-slate-400 mt-1">Loja Digital PWA + Admin</p>
                  </div>
                  <span className="text-[10px] font-mono text-gold bg-gold/10 px-2 py-1 rounded">15 DIAS</span>
                </div>
                <div className="mt-6 flex gap-3">
                  <div className="flex-1 bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] text-slate-500 uppercase block">Valor</span>
                    <span className="text-sm font-mono text-gold">88.000 Kz</span>
                  </div>
                  <div className="flex-1 bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-[9px] text-slate-500 uppercase block">Progresso</span>
                    <span className="text-sm font-mono text-accent">10%</span>
                  </div>
                </div>
                <button className="w-full bg-accent text-black font-bold py-4 rounded-2xl mt-6 text-xs tracking-widest uppercase shadow-lg shadow-accent/20">
                  Aceder Workspace
                </button>
              </div>

              <div className="glass-card p-6 border-l-4 border-keimadura">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  Keimadura <CheckCircle2 size={16} className="text-success" />
                </h2>
                <div className="flex gap-2 mt-4">
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded-full font-bold">AUDIT OK</span>
                  <span className="text-[9px] bg-accent/10 text-accent border border-accent/20 px-2 py-1 rounded-full font-bold">SYNC ACTIVE</span>
                </div>
                <div className="mt-6 flex gap-1 h-8 items-end">
                  {[...Array(20)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`flex-1 rounded-sm bg-emerald-500 ${Math.random() > 0.2 ? 'opacity-100 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'opacity-20'}`}
                      style={{ height: `${Math.random() * 60 + 40}%` }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'agenda' && (
            <motion.div 
              key="agenda"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              <div className="glass-card p-6">
                <h2 className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">Próximos Eventos</h2>
                <div className="space-y-4">
                  {[
                    { title: 'Conexão Giants', date: '24 Fev', loc: 'Sala Master', val: '50k' },
                    { title: 'Workshop Acelere', date: '27 Fev', loc: 'Casa das Artes', val: '50k' },
                    { title: 'Day Training B2B', date: '13 Mar', loc: 'Luanda', val: '50k' },
                  ].map((ev, i) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                      <div>
                        <div className="text-sm font-semibold">{ev.title}</div>
                        <div className="text-[10px] text-slate-500 mt-1">{ev.date} | {ev.loc}</div>
                      </div>
                      <span className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-1 rounded">{ev.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-card p-6">
                <h2 className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">Dados de Faturação</h2>
                <div className="bg-black/40 p-4 rounded-xl font-mono text-[10px] text-accent border border-white/5 leading-relaxed">
                  CLIENTE: ACELERADOR EMPRESARIAL<br/>
                  NIF: 5001970658<br/>
                  DOMICÍLIO: CONDOMÍNIO ZEUS
                </div>
              </div>

              <div className="glass-card p-6">
                <h2 className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">Pendentes</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Fatura Evento 10/02</span>
                    <span className="text-[9px] font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded">ATRASADO</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Visita Técnica (Margarida)</span>
                    <span className="text-[9px] font-bold text-gold bg-gold/10 border border-gold/20 px-2 py-1 rounded">25 FEV</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'system' && (
            <motion.div 
              key="system"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-5"
            >
              <div className="glass-card p-6">
                <h2 className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">Noile Xel Core</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Status</span>
                    <span className="text-xs text-success font-bold">OPERACIONAL</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Motor</span>
                    <span className="text-xs">Gemini 3 Pro</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-slate-400">Voz</span>
                    <span className="text-xs">George (Neural)</span>
                  </div>
                </div>
              </div>

              <div className="glass-card p-6 bg-black/80">
                <h2 className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">Realtime Logs</h2>
                <div className="font-mono text-[9px] text-accent space-y-2 opacity-80">
                  <p className="">{`> [11:15] PWA Handshake Successful`}</p>
                  <p className="">{`> [11:18] Supabase Sync Active`}</p>
                  <p className="">{`> [11:25] React Component Mounted`}</p>
                  <p className="">{`> [11:30] Standing by for input...`}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-8 left-6 right-6 glass-card p-3 flex justify-around items-center shadow-2xl shadow-black">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === tab.id ? 'text-accent -translate-y-2' : 'text-slate-500'}`}
          >
            <tab.icon size={20} className={activeTab === tab.id ? 'drop-shadow-[0_0_8px_rgba(76,201,240,0.8)]' : 'grayscale'} />
            <span className="text-[8px] uppercase tracking-tighter">{tab.label}</span>
          </button>
        ))}
      </nav>

      {loading && (
        <div className="absolute inset-0 bg-bg/80 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Activity className="text-accent animate-pulse" size={40} />
            <span className="text-[10px] text-accent tracking-[5px] animate-pulse">SYNCING</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
