import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Wrench } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 font-bold text-2xl text-slate-900 tracking-tight">
          <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">
            <Wrench className="h-6 w-6" />
          </div>
          <span>FixLoop</span>
        </Link>
        <p className="mt-2 text-sm text-slate-500">
          Campus Maintenance & Issue Management
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xs border border-slate-200/80 rounded-xl sm:px-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

