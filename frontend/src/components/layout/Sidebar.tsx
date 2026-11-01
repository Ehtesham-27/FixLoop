import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, List, CheckSquare, Users, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.role;

  const getLinks = () => {
    switch (role) {
      case 'STUDENT':
        return [
          { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/student/create-ticket', label: 'Report Issue', icon: PlusCircle },
          { to: '/student/my-tickets', label: 'My Reports', icon: List }
        ];
      case 'TECHNICIAN':
        return [
          { to: '/technician/dashboard', label: 'Assigned Work', icon: CheckSquare }
        ];
      case 'ADMIN':
        return [
          { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
          { to: '/admin/tickets', label: 'All Tickets', icon: List },
          { to: '/admin/users', label: 'User Directory', icon: Users }
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0 min-h-[calc(100vh-4rem)] p-4">
      <div className="mb-4 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
        <Shield className="h-3.5 w-3.5 text-blue-500" />
        <span>{role} Portal</span>
      </div>
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

