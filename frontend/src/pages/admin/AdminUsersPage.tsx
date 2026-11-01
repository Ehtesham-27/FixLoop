import React, { useEffect, useState, useCallback } from 'react';
import { adminService } from '../../services/admin.service';
import { User, Pagination } from '../../types';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { formatDate } from '../../utils';
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Users,
  ShieldCheck,
  Wrench,
  GraduationCap
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 15, pages: 1 });
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const loadUsers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const data = await adminService.getUsers({
        page: currentPage,
        limit: 15,
        role: roleFilter,
        search: debouncedSearch
      });

      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Failed to load user directory');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, roleFilter, debouncedSearch]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldCheck className="h-3 w-3" />
            ADMIN
          </span>
        );
      case 'TECHNICIAN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Wrench className="h-3 w-3" />
            TECHNICIAN
          </span>
        );
      case 'STUDENT':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <GraduationCap className="h-3 w-3" />
            STUDENT
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campus User Directory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse campus members, view role designations, and inspect account statuses.
          </p>
        </div>
        <button
          onClick={() => loadUsers(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Role filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">All Roles</option>
              <option value="STUDENT">Students</option>
              <option value="TECHNICIAN">Technicians</option>
              <option value="ADMIN">Administrators</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-700 text-sm">
          <AlertCircle className="h-6 w-6 text-rose-500 mx-auto mb-2" />
          <p>{error}</p>
          <button
            onClick={() => loadUsers()}
            className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-md text-xs font-medium hover:bg-rose-700 transition"
          >
            Retry
          </button>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center text-slate-500 text-sm">
          <Users className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="font-medium text-slate-700">No users found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or role filter.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{u.name}</div>
                      <div className="text-slate-400 text-[11px]">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">{getRoleBadge(u.role)}</td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Pagination */}
          <div className="border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>
              Showing {users.length} of {pagination.total} users
            </span>

            {pagination.pages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 border border-slate-300 rounded bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition inline-flex items-center gap-1"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Previous
                </button>
                <span className="px-2 font-medium">
                  {currentPage} / {pagination.pages}
                </span>
                <button
                  disabled={currentPage >= pagination.pages}
                  onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                  className="px-2.5 py-1 border border-slate-300 rounded bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition inline-flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
