import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Filter } from 'lucide-react';
import { ticketService } from '../../services/ticket.service';
import { Pagination as IPagination, Ticket } from '../../types';
import { TicketCard } from '../../components/tickets/TicketCard';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';

export const MyTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<IPagination>({ total: 0, page: 1, limit: 10, pages: 0 });
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchTickets = (page = 1) => {
    setLoading(true);
    setError('');

    ticketService
      .getMyTickets({
        page,
        limit: 10,
        status: statusFilter,
        priority: priorityFilter
      })
      .then((data) => {
        setTickets(data.tickets);
        setPagination(data.pagination);
      })
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Could not load your tickets.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Reported Issues</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track status, priority, and technician activity on your submitted tickets.
          </p>
        </div>
        <Link
          to="/student/create-ticket"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition shadow-xs shrink-0 self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Report New Issue</span>
        </Link>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <Filter className="h-4 w-4 text-slate-400" />
          <span>Filter Reports</span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      {/* Ticket List */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-white border border-red-200 rounded-xl p-6 text-center text-red-600 text-sm">
          {error}
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
          <p className="text-slate-500 text-sm">No tickets found matching your filter criteria.</p>
          {(statusFilter !== 'ALL' || priorityFilter !== 'ALL') && (
            <button
              onClick={() => {
                setStatusFilter('ALL');
                setPriorityFilter('ALL');
              }}
              className="mt-3 text-xs font-medium text-blue-600 hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {tickets.map((ticket) => (
              <TicketCard key={ticket._id} ticket={ticket} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between bg-white border border-slate-200/80 rounded-xl px-4 py-3 text-sm text-slate-600">
              <span>
                Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchTickets(pagination.page - 1)}
                  className="px-3 py-1 border border-slate-300 rounded-md text-xs font-medium disabled:opacity-40 hover:bg-slate-50"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.pages}
                  onClick={() => fetchTickets(pagination.page + 1)}
                  className="px-3 py-1 border border-slate-300 rounded-md text-xs font-medium disabled:opacity-40 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
