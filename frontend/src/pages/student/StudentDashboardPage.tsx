import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ArrowRight, AlertCircle, Wrench } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ticketService } from '../../services/ticket.service';
import { Ticket } from '../../types';
import { TicketCard } from '../../components/tickets/TicketCard';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    ticketService
      .getMyTickets({ limit: 5 })
      .then((data) => {
        if (isMounted) {
          setTickets(data.tickets);
          setTotalCount(data.pagination.total);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Unable to fetch your maintenance requests.';
          setError(msg);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome banner & report button */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 shadow-xs">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Campus Facility Portal
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
            Welcome back, {user?.name || 'Student'}
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            Spot a maintenance issue in classrooms, dormitories, or labs? Submit a report and track resolution in real-time.
          </p>
        </div>
        <Link
          to="/student/create-ticket"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-5 py-2.5 rounded-lg transition shadow-xs shrink-0 self-start sm:self-center"
        >
          <PlusCircle className="h-5 w-5" />
          <span>Report an Issue</span>
        </Link>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Your Total Reports
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-medium text-amber-600 uppercase tracking-wider">
            Active / In-Progress
          </span>
          <p className="text-2xl font-bold text-amber-600 mt-1">
            {tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS' || t.status === 'ASSIGNED').length}
          </p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
          <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">
            Resolved
          </span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {tickets.filter((t) => t.status === 'RESOLVED').length}
          </p>
        </div>
      </div>

      {/* Recent requests list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Your Recent Requests</h2>
          {totalCount > 5 && (
            <Link
              to="/student/my-tickets"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>View all ({totalCount})</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="bg-white border border-red-200 rounded-xl p-6 text-center text-red-600 text-sm">
            <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-10 text-center">
            <div className="bg-blue-50 text-blue-600 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <Wrench className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No maintenance requests yet</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
              Everything in working order? If you notice something broken, report it to maintenance staff.
            </p>
            <Link
              to="/student/create-ticket"
              className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition shadow-xs"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Submit your first report</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tickets.map((ticket) => (
              <TicketCard key={ticket._id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
