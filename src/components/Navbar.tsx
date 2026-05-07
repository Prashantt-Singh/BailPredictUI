import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/useAuth';
import { LogOut, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import { useTheme } from '../context/useTheme';
import { Moon, Sun } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.predict'), path: '/predict' },
    { name: t('nav.ipc_guide'), path: '/ipc-guide' },
    { name: t('nav.my_cases'), path: '/my-cases' },
    { name: t('nav.calendar'), path: '/calendar' },
    { name: t('nav.bail_map'), path: '/bail-map' }
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-[var(--bg-secondary)]/80 backdrop-blur-md shadow-sm border-b border-[var(--border-primary)] h-[64px]'
          : 'bg-transparent h-[80px]'
      }`}
    >
      <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between px-6">

        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 group -ml-12 hover:scale-105 transition-transform duration-500"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-[#C9A84C]/30 blur-xl rounded-full group-hover:bg-[#C9A84C]/50 transition-all duration-700 animate-pulse"></div>
            <img src="/logo.jpg" alt="BailPredict Logo" className="w-9 h-9 object-contain rounded-xl shadow-[0_0_20px_rgba(201,168,76,0.3)] border-2 border-[#C9A84C]/30 relative z-10 group-hover:rotate-[360deg] transition-all duration-1000" />
          </div>
          <span className="text-[22px] font-serif font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#C9A84C] via-[var(--text-primary)] to-[#C9A84C] bg-[length:200%_auto] animate-gradient drop-shadow-lg scale-y-110">
            BailPredict
          </span>
        </button>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center">
          <ul className="flex items-center gap-8">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `relative text-[15px] font-black py-1 transition-colors duration-200 group ${
                      isActive ? 'text-[var(--text-primary)]' : 'text-[var(--text-primary)] opacity-80 hover:opacity-100'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <motion.div
                      whileTap={{ 
                        textShadow: "0 0 8px rgba(0,0,0,0.3)",
                        scale: 0.95
                      }}
                      className="flex items-center justify-center"
                    >
                      {item.name}
                      <span
                        className={`absolute -bottom-0.5 left-0 h-[2px] bg-[#C9A84C] transition-all duration-300 ${
                          isActive ? 'w-full' : 'w-0 group-hover:w-full'
                        }`}
                      />
                    </motion.div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-[var(--bg-surface)] text-[var(--text-primary)] opacity-80 hover:opacity-100 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <LanguageSwitcher />
          
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[var(--bg-elevated)] border border-[#C9A84C]/20 shadow-sm hover:border-[#C9A84C]/40 transition-all group">
                <div className="w-7 h-7 rounded-lg bg-[var(--bg-primary)] flex items-center justify-center border border-[var(--border-subtle)] shadow-inner">
                  <UserIcon size={14} className="text-[#C9A84C]" />
                </div>
                <span className="text-sm font-black text-[var(--text-primary)] hidden sm:inline tracking-tight">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-all"
                title={t('nav.logout')}
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-5">
              <motion.button
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`h-11 px-8 text-[15px] font-black rounded-xl transition-all relative overflow-hidden border-2 ${
                  location.pathname === '/login' 
                    ? 'bg-[#C9A84C] text-black border-[#C9A84C] shadow-[0_0_20px_rgba(201,168,76,0.3)]' 
                    : 'bg-transparent text-[var(--text-primary)] border-[#C9A84C]/30 hover:border-[#C9A84C] hover:shadow-[0_0_15px_rgba(201,168,76,0.2)]'
                }`}
              >
                {t('nav.sign_in')}
              </motion.button>
              <motion.button
                onClick={() => navigate('/signup')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`h-11 px-8 text-[15px] font-black rounded-xl transition-all relative overflow-hidden border-2 ${
                  location.pathname === '/signup' 
                    ? 'bg-[#C9A84C] text-black border-[#C9A84C] shadow-[0_0_20px_rgba(201,168,76,0.3)]' 
                    : 'bg-[#C9A84C]/10 text-[#C9A84C] border-[#C9A84C]/40 hover:bg-[#C9A84C] hover:text-black hover:border-[#C9A84C]'
                }`}
              >
                {t('nav.get_started')}
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
