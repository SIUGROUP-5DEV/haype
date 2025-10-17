import React from 'react';
import { Outlet } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const Layout = () => {
  const { isOpen, closeSidebar } = useSidebar();

  const handleOverlayClick = () => {
    closeSidebar();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isOpen ? 'lg:ml-64' : 'ml-0'
      }`}>
        <TopBar />
        
        <main className="flex-1 overflow-auto p-6 print:p-0">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Mobile overlay - closes sidebar when clicked */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-30"
          onClick={handleOverlayClick}
        />
      )}
    </div>
  );
};

export default Layout;