import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ticketService } from '../../services/ticket.service';
import { Ticket } from '../../types';
import { TicketCard } from '../../components/tickets/TicketCard';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { AlertCircle, ArrowRight } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    ticketService
      .getAllTickets()
      .then((res) => {
        if (res.data) setTickets(res.data);
      })
      .catch(() => {
        setError('API in scaffold mode. Data will populate once business routes are implemented.');
      })
      .finally(() => setLoading(false));
  }, []);

  const openTickets = tickets.filter((t) => t.status === 'OPEN');
  const criticalTickets = tickets.filter((t) => t.priority === 'CRITICAL');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Maintenance Administration</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor campus issues, assign technician staff, and ensure timely resolution.
        </p>
      </div>

      {/* High-level status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Reported</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{tickets.length}</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">Pending Assignment (Open)</span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{openTickets.length}</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">Critical Priority</span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{criticalTickets.length}</p>
        </div>
      </div>

      {/* Urgent issues section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900">Issues Requiring Immediate Action</h2>
          <Link
            to="/admin/tickets"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
          >
            <span>All tickets</span>
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
        ) : openTickets.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center text-slate-500 text-sm">
            No open tickets pending assignment.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {openTickets.map((t) => (
              <TicketCard key={t._id} ticket={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

