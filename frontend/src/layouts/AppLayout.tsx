import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { useAuth } from '../hooks/useAuth';
import { LayoutDashboard, PlusCircle, List, CheckSquare } from 'lucide-react';

export const AppLayout: React.FC = () => {
  const { user } = useAuth();

  const getMobileLinks = () => {
    if (!user) return [];
    if (user.role === 'STUDENT') {
      return [
        { to: '/student/dashboard', label: 'Home', icon: LayoutDashboard },
        { to: '/student/create-ticket', label: 'Report', icon: PlusCircle },
        { to: '/student/my-tickets', label: 'My Tickets', icon: List }
      ];
    }
    if (user.role === 'TECHNICIAN') {
      return [
        { to: '/technician/dashboard', label: 'Assigned', icon: CheckSquare }
      ];
    }
    if (user.role === 'ADMIN') {
      return [
        { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
        { to: '/admin/tickets', label: 'Tickets', icon: List }
      ];
    }
    return [];
  };

  const mobileLinks = getMobileLinks();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-16 md:pb-0">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      {mobileLinks.length > 0 && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex justify-around items-center z-30 shadow-lg">
          {mobileLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 text-xs font-medium ${
                    isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="h-5 w-5 mb-0.5" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>
      )}
    </div>
  );
};

