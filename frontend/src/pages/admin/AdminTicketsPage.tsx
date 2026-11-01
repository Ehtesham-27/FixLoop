import React, { useEffect, useState, useCallback } from 'react';
import { ticketService } from '../../services/ticket.service';
import { adminService } from '../../services/admin.service';
import { categoryService } from '../../services/category.service';
import { Ticket, Pagination, User, Category, TicketPriority } from '../../types';
import { TicketCard } from '../../components/tickets/TicketCard';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import {
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Wrench,
  SlidersHorizontal,
  X
} from 'lucide-react';

export const AdminTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ total: 0, page: 1, limit: 10, pages: 1 });
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [categories, setCategories] = useState<Category[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Modals for quick admin actions
  const [selectedTicketForAssign, setSelectedTicketForAssign] = useState<Ticket | null>(null);
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('');
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');

  const [selectedTicketForPriority, setSelectedTicketForPriority] = useState<Ticket | null>(null);
  const [newPriority, setNewPriority] = useState<TicketPriority>('MEDIUM');
  const [updatingPriority, setUpdatingPriority] = useState(false);
  const [priorityError, setPriorityError] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load categories and technicians once
  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(() => {});
    adminService.getActiveTechnicians().then(setTechnicians).catch(() => {});
  }, []);

  const loadTickets = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await ticketService.getAllTickets({
        page: currentPage,
        limit: 10,
        status: statusFilter,
        priority: priorityFilter,
        category: categoryFilter,
        search: debouncedSearch
      });

      if (res.tickets) setTickets(res.tickets);
      if (res.pagination) setPagination(res.pagination);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, statusFilter, priorityFilter, categoryFilter, debouncedSearch]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketForAssign || !selectedTechnicianId) return;

    setAssigning(true);
    setAssignError('');

    try {
      await ticketService.assignTicket(selectedTicketForAssign._id, selectedTechnicianId);
      setSelectedTicketForAssign(null);
      setSelectedTechnicianId('');
      loadTickets(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setAssignError(e.response?.data?.message || 'Failed to assign technician');
    } finally {
      setAssigning(false);
    }
  };

  const handlePrioritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketForPriority || !newPriority) return;

    setUpdatingPriority(true);
    setPriorityError('');

    try {
      await ticketService.updatePriority(selectedTicketForPriority._id, newPriority);
      setSelectedTicketForPriority(null);
      loadTickets(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setPriorityError(e.response?.data?.message || 'Failed to update priority');
    } finally {
      setUpdatingPriority(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campus Tickets</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage, filter, triage priority, and assign maintenance personnel across campus.
          </p>
        </div>
        <button
          onClick={() => loadTickets(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, building, room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open (Unassigned)</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>

          {/* Priority filter */}
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          {/* Category filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs border border-slate-300 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-700 text-sm">
          <AlertCircle className="h-6 w-6 text-rose-500 mx-auto mb-2" />
          <p>{error}</p>
          <button
            onClick={() => loadTickets()}
            className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-md text-xs font-medium hover:bg-rose-700 transition"
          >
            Retry
          </button>
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center text-slate-500 text-sm">
          <AlertCircle className="h-8 w-8 text-slate-400 mx-auto mb-2" />
          <p className="font-medium text-slate-700">No tickets found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search keywords.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Showing {tickets.length} of {pagination.total} tickets
            </span>
            <span>
              Page {pagination.page} of {pagination.pages || 1}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="relative group">
                <TicketCard ticket={ticket} />
                {/* Admin Quick Action Bar overlaid or below */}
                <div className="mt-2 flex flex-wrap items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => {
                      setSelectedTicketForAssign(ticket);
                      const currentTechId =
                        typeof ticket.assignedTo === 'object' && ticket.assignedTo
                          ? ticket.assignedTo._id
                          : typeof ticket.assignedTo === 'string'
                          ? ticket.assignedTo
                          : '';
                      setSelectedTechnicianId(currentTechId);
                      setAssignError('');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 font-medium transition"
                  >
                    <Wrench className="h-3.5 w-3.5" />
                    <span>{ticket.assignedTo ? 'Reassign Technician' : 'Assign Technician'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedTicketForPriority(ticket);
                      setNewPriority(ticket.priority);
                      setPriorityError('');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 font-medium transition"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    <span>Change Priority</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-md bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition inline-flex items-center gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>
              <span className="text-xs text-slate-600 px-2 font-medium">
                {currentPage} / {pagination.pages}
              </span>
              <button
                disabled={currentPage >= pagination.pages}
                onClick={() => setCurrentPage((p) => Math.min(pagination.pages, p + 1))}
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-md bg-white text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition inline-flex items-center gap-1"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Technician Assignment Modal */}
      {selectedTicketForAssign && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Assign Technician</h3>
              <button
                onClick={() => setSelectedTicketForAssign(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Ticket: <strong className="text-slate-800">{selectedTicketForAssign.ticketCode || selectedTicketForAssign._id}</strong> —{' '}
              {selectedTicketForAssign.title}
            </p>

            {assignError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg">
                {assignError}
              </div>
            )}

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Active Technician
                </label>
                <select
                  value={selectedTechnicianId}
                  onChange={(e) => setSelectedTechnicianId(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">-- Choose a technician --</option>
                  {technicians.map((tech) => (
                    <option key={tech._id} value={tech._id}>
                      {tech.name} ({tech.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicketForAssign(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning || !selectedTechnicianId}
                  className="px-4 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  {assigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Priority Change Modal */}
      {selectedTicketForPriority && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Change Ticket Priority</h3>
              <button
                onClick={() => setSelectedTicketForPriority(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Ticket: <strong className="text-slate-800">{selectedTicketForPriority.ticketCode || selectedTicketForPriority._id}</strong> —{' '}
              {selectedTicketForPriority.title}
            </p>

            {priorityError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-lg">
                {priorityError}
              </div>
            )}

            <form onSubmit={handlePrioritySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Priority Level
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicketForPriority(null)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPriority}
                  className="px-4 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  {updatingPriority ? 'Updating...' : 'Update Priority'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
