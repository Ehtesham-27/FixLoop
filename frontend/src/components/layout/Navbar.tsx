import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Wrench, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-900 tracking-tight">
          <div className="bg-blue-600 text-white p-1.5 rounded-md">
            <Wrench className="h-5 w-5" />
          </div>
          <span>FixLoop</span>
        </Link>

        {user ? (
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
              <UserIcon className="h-4 w-4 text-slate-400" />
              <span className="font-medium text-slate-800">{user.name}</span>
              <span className="text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">
                {user.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-slate-800 p-1.5 rounded-md hover:bg-slate-100 transition"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-700 hover:text-blue-600 px-3 py-1.5 rounded transition"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-md transition shadow-xs"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

