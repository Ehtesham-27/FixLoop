import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ticketService } from '../../services/ticket.service';
import { Ticket } from '../../types';
import { TicketCard } from '../../components/tickets/TicketCard';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    ticketService
      .getMyTickets()
      .then((res) => {
        if (res.data) setTickets(res.data);
      })
      .catch(() => {
        // Expected during initial scaffold when backend endpoints are not populated yet
        setError('Unable to load recent requests. API is in scaffold stage.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Greeting and primary action */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name || 'Student'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Need something fixed on campus? Submit a maintenance report below.
          </p>
        </div>
        <Link
          to="/student/create-ticket"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg transition shadow-xs shrink-0"
        >
          <PlusCircle className="h-5 w-5" />
          <span>Report an Issue</span>
        </Link>
      </div>

      {/* Recent requests */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Your Recent Requests</h2>
          <Link
            to="/student/my-tickets"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            <span>View all</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center text-slate-500 text-sm">
            <AlertCircle className="h-6 w-6 text-slate-400 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center">
            <p className="text-slate-500 text-sm">No maintenance requests submitted yet.</p>
            <Link
              to="/student/create-ticket"
              className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
            >
              Submit your first report
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {tickets.slice(0, 5).map((ticket) => (
              <TicketCard key={ticket._id} ticket={ticket} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

