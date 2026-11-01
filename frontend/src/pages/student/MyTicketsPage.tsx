import React, { useEffect, useState } from 'react';
import { ticketService } from '../../services/ticket.service';
import { Ticket } from '../../types';
import { TicketCard } from '../../components/tickets/TicketCard';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';

export const MyTicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    ticketService
      .getMyTickets()
      .then((res) => {
        if (res.data) setTickets(res.data);
      })
      .catch(() => {
        setError('Could not load tickets. (Backend endpoints are currently in scaffold stage)');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Reported Issues</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track current status and updates for your maintenance requests.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-slate-500 text-sm">
          {error}
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center text-slate-500 text-sm">
          No tickets found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tickets.map((ticket) => (
            <TicketCard key={ticket._id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
};

