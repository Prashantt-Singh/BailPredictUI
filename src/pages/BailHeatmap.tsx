import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, MapPin, Scale, X, Loader2, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import IndiaMap from '../components/IndiaMap';
import { supabase } from '../lib/supabase';
import { SEED_DATA, IPC_SECTIONS } from '../data/seedStatistics';
import type { BailStatisticRow } from '../data/seedStatistics';

const BailHeatmap: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<BailStatisticRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIpc, setSelectedIpc] = useState<string>('All Sections');
  
  // Selected state info
  const [selectedStateCode, setSelectedStateCode] = useState<string | null>(null);
  const [selectedStateName, setSelectedStateName] = useState<string>('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: dbData, error } = await supabase.from('bail_statistics').select('*');
      
      if (error || !dbData || dbData.length === 0) {
        console.warn('Using seed data for heatmap', error);
        setData(SEED_DATA);
      } else {
        setData(dbData as BailStatisticRow[]);
      }
    } catch {
      setData(SEED_DATA);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const timer = window.setTimeout(() => {
      void fetchData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchData]);

  const filteredData = useMemo(() => {
    if (selectedIpc === 'All Sections') return data;
    return data.filter(d => d.ipc_section === selectedIpc);
  }, [data, selectedIpc]);

  const stateAggregates = useMemo(() => {
    const agg: Record<string, { total: number; granted: number }> = {};
    filteredData.forEach(row => {
      if (!agg[row.state_code]) agg[row.state_code] = { total: 0, granted: 0 };
      agg[row.state_code].total += row.total_cases;
      agg[row.state_code].granted += row.granted_count;
    });

    const rates: Record<string, number> = {};
    Object.keys(agg).forEach(code => {
      rates[code] = agg[code].total > 0 
        ? Number(((agg[code].granted / agg[code].total) * 100).toFixed(1))
        : 0;
    });
    return rates;
  }, [filteredData]);

  const nationalAverage = useMemo(() => {
    let t = 0, g = 0;
    filteredData.forEach(r => { t += r.total_cases; g += r.granted_count; });
    return t > 0 ? (g / t) * 100 : 0;
  }, [filteredData]);

  const stateDetails = useMemo(() => {
    if (!selectedStateCode) return null;
    const stateRows = filteredData.filter(d => d.state_code === selectedStateCode);
    if (stateRows.length === 0) return null;

    let t = 0, g = 0;
    const courts: Record<string, { total: number, granted: number }> = {};
    const ipcs: Record<string, { total: number, granted: number }> = {};

    stateRows.forEach(r => {
      t += r.total_cases;
      g += r.granted_count;
      
      if (!courts[r.court_level]) courts[r.court_level] = { total: 0, granted: 0 };
      courts[r.court_level].total += r.total_cases;
      courts[r.court_level].granted += r.granted_count;

      if (!ipcs[r.ipc_section]) ipcs[r.ipc_section] = { total: 0, granted: 0 };
      ipcs[r.ipc_section].total += r.total_cases;
      ipcs[r.ipc_section].granted += r.granted_count;
    });

    const overallRate = t > 0 ? (g / t) * 100 : 0;
    
    const courtList = Object.keys(courts).map(c => ({
      name: c,
      rate: courts[c].total > 0 ? (courts[c].granted / courts[c].total) * 100 : 0,
      total: courts[c].total
    })).sort((a, b) => b.rate - a.rate);

    const ipcList = Object.keys(ipcs).map(i => ({
      name: i,
      rate: ipcs[i].total > 0 ? (ipcs[i].granted / ipcs[i].total) * 100 : 0,
      total: ipcs[i].total
    })).sort((a, b) => b.total - a.total).slice(0, 5);

    return { total: t, granted: g, rate: overallRate, courts: courtList, ipcs: ipcList };
  }, [selectedStateCode, filteredData]);

  const handleStateClick = (code: string, name: string) => {
    setSelectedStateCode(code);
    setSelectedStateName(name || code);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] w-full flex flex-col">
      
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-6 py-10 z-20">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-[#C9A84C] mb-4">
              <Map size={20} />
              <span className="text-[10px] font-black uppercase tracking-[4px]">{t('heatmap.header_label')}</span>
            </div>
            <h1 className="text-4xl font-serif font-black text-[var(--text-primary)] tracking-tight">
              {t('heatmap.title')}
            </h1>
            <p className="text-[var(--text-muted)] font-medium mt-2 max-w-2xl">
              {t('heatmap.subtitle')}
            </p>
          </div>
          
          <div className="flex flex-col gap-2 shrink-0">
            <label className="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">{t('heatmap.filter_label')}</label>
            <select 
              value={selectedIpc} 
              onChange={(e) => setSelectedIpc(e.target.value)}
              className="h-12 bg-[var(--bg-surface)] border border-[var(--border-primary)] text-[var(--text-primary)] rounded-xl px-4 text-sm font-bold focus:outline-none focus:border-[#C9A84C] focus:ring-1 focus:ring-[#C9A84C] transition-colors"
            >
              <option value="All Sections">{t('heatmap.all_sections')}</option>
              {IPC_SECTIONS.map(ipc => (
                <option key={ipc} value={ipc}>{ipc}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-[1400px] w-full mx-auto flex flex-col lg:flex-row relative">
        
        <div className="flex-1 relative min-h-[500px] lg:min-h-[700px] p-6 lg:p-12 flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center justify-center">
              <Loader2 size={40} className="text-[#C9A84C] animate-spin mb-4" />
              <p className="font-bold text-[var(--text-secondary)]">{t('heatmap.loading')}</p>
            </div>
          ) : (
            <IndiaMap 
              data={stateAggregates} 
              onStateClick={handleStateClick} 
              selectedStateCode={selectedStateCode} 
            />
          )}

          <div className="absolute bottom-6 left-6 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl p-4 shadow-xl z-10 hidden sm:block">
            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3">{t('heatmap.grant_rate')}</p>
            <div className="space-y-2">
              {[
                { color: '#ef4444', label: t('heatmap.legend_very_low') },
                { color: '#f97316', label: t('heatmap.legend_low') },
                { color: '#f59e0b', label: t('heatmap.legend_mod') },
                { color: '#22c55e', label: t('heatmap.legend_good') },
                { color: '#059669', label: t('heatmap.legend_high') },
              ].map((l, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: l.color }}></div>
                  <span className="text-xs font-bold text-[var(--text-secondary)]">{l.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-start gap-2">
              <AlertCircle size={12} className="text-[var(--text-muted)] mt-0.5 shrink-0" />
              <p className="text-[9px] text-[var(--text-muted)] font-medium leading-tight max-w-[160px]">
                {t('heatmap.disclaimer')}
              </p>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {selectedStateCode && stateDetails && (
            <motion.div
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:w-[450px] w-full bg-[var(--bg-secondary)] border-l border-[var(--border-subtle)] shadow-2xl flex flex-col z-30 fixed lg:static right-0 top-[180px] lg:top-0 bottom-0 h-auto lg:h-full overflow-y-auto"
            >
              <div className="sticky top-0 bg-[var(--bg-secondary)] border-b border-[var(--border-subtle)] p-6 z-10 flex justify-between items-start backdrop-blur-md bg-opacity-90">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={16} className="text-[#C9A84C]" />
                    <span className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">{selectedStateCode}</span>
                  </div>
                  <h2 className="text-3xl font-serif font-black text-[var(--text-primary)] leading-none">{selectedStateName}</h2>
                </div>
                <button 
                  onClick={() => setSelectedStateCode(null)}
                  className="w-8 h-8 rounded-full bg-[var(--bg-surface)] flex items-center justify-center text-[var(--text-secondary)] hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-8">
                <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-2xl p-6 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${stateDetails.rate >= 55 ? 'bg-emerald-500' : stateDetails.rate <= 40 ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">{t('heatmap.overall_rate')}</p>
                  <div className="flex items-end gap-3 mb-2">
                    <span className="text-5xl font-black text-[var(--text-primary)] leading-none">{stateDetails.rate.toFixed(1)}%</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-medium">
                    {t('heatmap.cases_analyzed', { count: stateDetails.total.toLocaleString() })}
                  </p>
                  
                  <div className="mt-4">
                    {stateDetails.rate >= nationalAverage ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-black border border-emerald-500/20">
                        <TrendingUp size={12} /> {t('heatmap.above_avg', { percent: (stateDetails.rate - nationalAverage).toFixed(1) })}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 text-red-500 text-xs font-black border border-red-500/20">
                        <TrendingDown size={12} /> {t('heatmap.below_avg', { percent: (nationalAverage - stateDetails.rate).toFixed(1) })}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest mb-5 flex items-center gap-2">
                    <Scale size={16} className="text-[#C9A84C]" /> {t('heatmap.court_breakdown')}
                  </h3>
                  <div className="space-y-4">
                    {stateDetails.courts.map((c, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span className="text-[var(--text-primary)]">{c.name}</span>
                          <span className={c.rate >= 55 ? 'text-emerald-500' : 'text-amber-500'}>{c.rate.toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full bg-[var(--bg-surface)] rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${c.rate}%` }}
                            transition={{ duration: 1, delay: 0.1 * i }}
                            className={`h-full rounded-full ${c.rate >= 55 ? 'bg-emerald-500' : c.rate <= 40 ? 'bg-red-500' : 'bg-amber-500'}`}
                          ></motion.div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedIpc === 'All Sections' && (
                  <div>
                    <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest mb-5">
                      {t('heatmap.high_volume')}
                    </h3>
                    <div className="bg-[var(--bg-primary)] border border-[var(--border-subtle)] rounded-xl overflow-hidden">
                      {stateDetails.ipcs.map((ipc, i) => {
                        const shortIpc = ipc.name.split('—')[0]?.replace('Section', '').trim() || ipc.name;
                        return (
                          <div key={i} className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-surface)] transition-colors">
                            <div>
                              <p className="text-sm font-bold text-[var(--text-primary)]">{shortIpc}</p>
                              <p className="text-xs text-[var(--text-muted)]">{ipc.total} {t('heatmap.cases')}</p>
                            </div>
                            <span className={`text-xs font-black px-2.5 py-1 rounded-md border ${ipc.rate >= 55 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                              {ipc.rate.toFixed(1)}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default BailHeatmap;
