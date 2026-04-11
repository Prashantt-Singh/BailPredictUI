import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, Scale, FileText, BarChart3, Users, Clock, Edit3, PieChart } from 'lucide-react';

const Sidebar: React.FC = () => {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Predict Bail', path: '/predict', icon: <Scale size={20} /> },
    { name: 'Cases', path: '/cases', icon: <FileText size={20} /> },
    { name: 'Bias Audit', path: '/audit', icon: <BarChart3 size={20} /> },
    { name: 'Judge Insights', path: '/insights', icon: <Users size={20} /> },
    { name: 'Timeline', path: '/timeline', icon: <Clock size={20} /> },
    { name: 'Argument Builder', path: '/argument', icon: <Edit3 size={20} /> },
    { name: 'Reports', path: '/reports', icon: <PieChart size={20} /> },
  ];

  return (
    <div className="w-[240px] h-screen bg-[#0a0f1e] border-r border-slate-800 flex flex-col relative z-20 flex-shrink-0">
      {/* Subtle Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>

      <div className="p-6 pb-2 relative z-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex items-center gap-2 group cursor-pointer"
        >
          <div className="w-2 h-2 rounded-full bg-accentBrand shadow-[0_0_8px_rgba(201,168,76,0.8)] animate-pulse"></div>
          <h1 className="text-2xl font-heading font-bold tracking-wide relative overflow-hidden flex items-center">
            <span className="text-accentBrand group-hover:text-[#e8c86d] transition-colors relative">
              Bail
              {/* Shimmer effect */}
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></span>
            </span>
            <span className="text-white">Predict</span>
          </h1>
        </motion.div>
      </div>
      
      <nav className="flex-1 px-3 mt-8 overflow-y-auto overflow-x-hidden relative z-10 custom-scrollbar">
        <ul className="space-y-1.5 focus:outline-none">
          {navItems.map((item, index) => (
            <motion.li 
              key={item.path}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * index }}
            >
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 relative group overflow-hidden ${
                    isActive
                      ? 'text-accentBrand bg-accentBrand/10 font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {/* Active Left Border & Glow */}
                    {isActive && (
                      <motion.div 
                        layoutId="activeNavBorder"
                        className="absolute left-0 top-0 bottom-0 w-1 bg-accentBrand shadow-[0_0_10px_rgba(201,168,76,0.6)]"
                      />
                    )}
                    
                    <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                      {item.icon}
                    </div>
                    <span className="relative z-10">{item.name}</span>
                    
                    {/* Hover Glow Background */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-accentBrand/10 to-transparent transition-opacity duration-300 pointer-events-none" />
                  </>
                )}
              </NavLink>
            </motion.li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center relative z-10 font-sans">
        © 2026 BailPredict
      </div>
      
      {/* Add shimmer keyframes inline for simplicity */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 4px;
        }
      `}} />
    </div>
  );
};

export default Sidebar;
