import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Download, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface CaseHearing {
  id: string;
  ipc_section: string;
  offense: string;
  court: string;
  hearing_date: string;
}

const HearingCalendar: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [hearings, setHearings] = useState<CaseHearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchHearings();
    }
  }, [user]);

  const fetchHearings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cases')
      .select('id, ipc_section, offense, hearing_date, court')
      .not('hearing_date', 'is', null)
      .eq('user_id', user?.id);

    if (!error && data) {
      setHearings(data as CaseHearing[]);
    }
    setLoading(false);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthNames = [
    t('calendar.months.jan'), t('calendar.months.feb'), t('calendar.months.mar'), 
    t('calendar.months.apr'), t('calendar.months.may'), t('calendar.months.jun'), 
    t('calendar.months.jul'), t('calendar.months.aug'), t('calendar.months.sep'), 
    t('calendar.months.oct'), t('calendar.months.nov'), t('calendar.months.dec')
  ];
  
  const dayNames = [
    t('calendar.days.sun'), t('calendar.days.mon'), t('calendar.days.tue'), 
    t('calendar.days.wed'), t('calendar.days.thu'), t('calendar.days.fri'), t('calendar.days.sat')
  ];

  // Helper to format date as YYYY-MM-DD for comparison
  const formatDate = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  // Group hearings by date string
  const hearingsByDate = useMemo(() => {
    const map = new Map<string, CaseHearing[]>();
    hearings.forEach(h => {
      const dateStr = h.hearing_date.split('T')[0]; // Extract YYYY-MM-DD
      if (!map.has(dateStr)) map.set(dateStr, []);
      map.get(dateStr)!.push(h);
    });
    return map;
  }, [hearings]);

  const getHearingStatusColor = (hearingDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const hearing = new Date(hearingDateStr);
    const diffDays = Math.ceil((hearing.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-primary)]';
    if (diffDays <= 2) return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50';
    if (diffDays <= 5) return 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-900/50';
    return 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900/50';
  };

  const exportCalendar = () => {
    if (hearings.length === 0) return;
    setIsExporting(true);
    
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//BailPredict//Hearing Calendar//EN\n";
    
    hearings.forEach(h => {
      const date = new Date(h.hearing_date);
      // Format as YYYYMMDDTHHMMSSZ (using UTC, though for all-day events just YYYYMMDD is better)
      const dateString = date.toISOString().replace(/[-:]/g, '').split('.')[0] + "Z";
      
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `DTSTART:${dateString}\n`;
      icsContent += `DTEND:${dateString}\n`;
      icsContent += `SUMMARY:Hearing: ${h.offense} (${h.ipc_section})\n`;
      icsContent += `DESCRIPTION:Court: ${h.court}\\nTracked via BailPredict.\n`;
      icsContent += `LOCATION:${h.court}\n`;
      icsContent += "END:VEVENT\n";
    });
    
    icsContent += "END:VCALENDAR";
    
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `BailPredict_Hearings_${currentDate.getFullYear()}_${currentDate.getMonth()+1}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => setIsExporting(false), 2000);
  };

  // Generate calendar grid cells
  const renderCalendarDays = () => {
    const cells = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const currentDay = today.getDate();

    // Empty cells before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push(<div key={`empty-${i}`} className="min-h-[120px] bg-[var(--bg-surface)] opacity-30 border border-[var(--border-subtle)] rounded-xl" />);
    }

    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(year, month, d);
      const dayHearings = hearingsByDate.get(dateStr) || [];
      const isToday = isCurrentMonth && d === currentDay;

      cells.push(
        <div 
          key={d} 
          className={`min-h-[120px] p-2 border border-[var(--border-subtle)] rounded-xl transition-colors ${
            isToday ? 'bg-[var(--gold)]/5 ring-1 ring-[var(--gold)]' : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-surface)]'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <span className={`text-sm font-black w-7 h-7 flex items-center justify-center rounded-full ${
              isToday ? 'bg-[var(--gold)] text-black' : 'text-[var(--text-primary)]'
            }`}>
              {d}
            </span>
            {dayHearings.length > 0 && (
              <span className="text-[10px] font-black bg-[var(--bg-surface)] px-1.5 py-0.5 rounded text-[var(--text-muted)]">
                {dayHearings.length}
              </span>
            )}
          </div>
          
          <div className="flex flex-col gap-1.5 mt-2">
            {dayHearings.map(hearing => (
              <motion.button
                key={hearing.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/case/${hearing.id}`)}
                className={`text-left p-1.5 rounded-lg border text-[10px] leading-tight transition-all hover:scale-[1.02] active:scale-[0.98] ${getHearingStatusColor(hearing.hearing_date)}`}
              >
                <div className="font-bold truncate">{hearing.offense}</div>
                <div className="opacity-80 truncate">{hearing.court}</div>
              </motion.button>
            ))}
          </div>
        </div>
      );
    }
    
    return cells;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-16">
      
      {/* HEADER */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-6 py-10">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 text-[#C9A84C] mb-4">
              <CalendarIcon size={20} />
              <span className="text-[10px] font-black uppercase tracking-[4px]">{t('calendar.title')}</span>
            </div>
            <h1 className="text-4xl font-serif font-black text-[var(--text-primary)] tracking-tight">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h1>
            <p className="text-[var(--text-muted)] font-medium mt-2">{t('calendar.subtitle')}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-lg overflow-hidden">
              <button onClick={prevMonth} className="p-3 hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => setCurrentDate(new Date())} 
                className="px-4 py-3 font-bold text-sm text-[var(--text-primary)] border-l border-r border-[var(--border-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
              >
                Today
              </button>
              <button onClick={nextMonth} className="p-3 hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <ChevronRight size={20} />
              </button>
            </div>
            
            <button
              onClick={exportCalendar}
              disabled={hearings.length === 0 || isExporting}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${
                isExporting 
                  ? 'bg-emerald-600 text-white' 
                  : hearings.length === 0
                    ? 'bg-[var(--bg-surface)] text-[var(--text-muted)] cursor-not-allowed opacity-50'
                    : 'bg-[#C9A84C] text-black hover:bg-[#b5953e] active:scale-[0.98] shadow-lg shadow-[#C9A84C]/20'
              }`}
            >
              {isExporting ? <CheckCircle2 size={18} /> : <Download size={18} />}
              {isExporting ? t('calendar.exported') : t('calendar.export')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)]">
            <div className="w-8 h-8 border-4 border-[#C9A84C] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="font-bold">Loading calendar...</p>
          </div>
        ) : (
          <div className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-2xl shadow-sm overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              {dayNames.map((day) => (
                <div key={day} className="py-3 text-center text-[11px] font-black uppercase tracking-wider text-[var(--text-secondary)]">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Grid */}
            <div className="p-4 grid grid-cols-7 gap-2">
              {renderCalendarDays()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HearingCalendar;
