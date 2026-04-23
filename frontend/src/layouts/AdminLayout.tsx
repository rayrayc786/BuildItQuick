import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import AdminSidebar from '../features/admin/components/AdminSidebar';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname === '/admin';

  useEffect(() => {
    const handleToggle = () => setIsSidebarOpen(prev => !prev);
    window.addEventListener('toggle-admin-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-admin-sidebar', handleToggle);
  }, []);

  return (
    <div className={`admin-layout ${isSidebarOpen ? 'sidebar-open' : ''} ${isDashboard ? 'on-dashboard' : ''}`}>
      {!isDashboard && (
        <button 
          className="admin-sidebar-toggle" 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu size={20} />
        </button>
      )}
      <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
      {isSidebarOpen && <div className="admin-sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}
      <div className="admin-content-area">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminLayout;
