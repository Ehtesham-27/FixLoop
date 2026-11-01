import React from 'react';

export const AdminUsersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Directory</h1>
        <p className="text-sm text-slate-500 mt-1">
          Campus account administration and role assignments.
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl p-8 text-center text-slate-500 text-sm">
        <p className="font-medium text-slate-700">User management scaffold</p>
        <p className="mt-1">User directory and account status controls will be integrated in Phase 5.</p>
      </div>
    </div>
  );
};

