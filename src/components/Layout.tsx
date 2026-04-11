import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FB] font-sans text-[#111]">
      <Navbar />
      {/* pt-[80px] offsets the fixed navbar height so content is never hidden behind it */}
      <main className="flex-1 pt-[80px]">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
