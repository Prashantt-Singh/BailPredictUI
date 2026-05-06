import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-primary)] font-sans text-[var(--text-primary)] transition-colors duration-500 relative">
      <div className="animated-bg"></div>
      <Navbar />
      {/* pt-[80px] offsets the fixed navbar height so content is never hidden behind it */}
      <main className="flex-1 pt-[80px] relative z-10">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
