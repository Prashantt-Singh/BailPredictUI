import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Predict', path: '/predict' },
    { name: 'IPC Guide', path: '/ipc-guide' },
    { name: 'My Cases', path: '/my-cases' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 h-[64px]'
          : 'bg-transparent h-[80px]'
      }`}
    >
      <div className="max-w-6xl mx-auto h-full flex items-center justify-between px-6">

        {/* Logo */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-3 group"
        >
          <div className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${isScrolled ? 'bg-[#111]' : 'bg-[#111]'}`}>
            <div className="w-2.5 h-2.5 bg-[#C9A84C] rounded-sm rotate-45" />
          </div>
          <span className="text-[15px] font-black tracking-tight text-[#111]">
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
                    `relative text-[13px] font-black py-1 transition-colors duration-200 group ${
                      isActive ? 'text-black' : 'text-slate-800 hover:text-black'
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

        {/* Auth Actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <UserIcon size={14} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-700 hidden sm:inline">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                title="Logout"
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-5">
              <motion.button
                onClick={() => navigate('/login')}
                whileTap={{ 
                  scale: 0.95,
                  boxShadow: "0 0 15px 2px rgba(0,0,0,0.8)"
                }}
                className={`h-10 px-6 border-2 border-slate-900 text-[13px] font-black rounded-lg transition-all ${
                  location.pathname === '/login' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-transparent text-slate-900 hover:bg-slate-900 hover:text-white'
                }`}
              >
                Sign In
              </motion.button>
              <motion.button
                onClick={() => navigate('/signup')}
                whileTap={{ 
                  scale: 0.95,
                  boxShadow: "0 0 15px 2px rgba(0,0,0,0.8)"
                }}
                className={`h-10 px-6 border-2 border-slate-900 text-[13px] font-black rounded-lg transition-all ${
                  location.pathname === '/signup' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-transparent text-slate-900 hover:bg-slate-900 hover:text-white'
                }`}
              >
                Get Started
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
