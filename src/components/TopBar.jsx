import React from 'react';
import { useSidebar } from '../contexts/SidebarContext';
import { Menu, Bell, User, Database } from 'lucide-react';
import { useState } from 'react';
import BackupRestoreModal from './BackupRestoreModal';

const TopBar = () => {
  const { toggleSidebar } = useSidebar();
  const [showBackupModal, setShowBackupModal] = useState(false);

  return (
    <>
      <header className="bg-white border-b border-gray-200 px-6 py-4 print:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors relative">
            <Bell className="w-6 h-6" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">Admin</span>
          </div>
        </div>
      </div>
            <button 
              onClick={() => setShowBackupModal(true)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
              title="Backup & Restore"
            >
              <Database className="w-6 h-6" />
            </button>
            
      </header>
      
      {/* Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
      />
    </>
  );
};

export default TopBar;