import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar';
import AdminTopbar from './components/AdminTopbar';

const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans selection:bg-black selection:text-white flex">
      {/* Sidebar Navigation */}
      <AdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Right Content Panel */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen max-w-full overflow-x-hidden">
        <AdminTopbar setMobileOpen={setMobileOpen} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 bg-neutral-50/60">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
