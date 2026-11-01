import React, { useEffect, useState } from 'react';
import { ticketService } from '../../services/ticket.service';
import { Ticket } from '../../types';
import { TicketCard } from '../../components/tickets/TicketCard';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';

export const TechnicianDashboardPage: React.FC = () => {
  const [assignedTickets, setAssignedTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    ticketService
      .getAssignedTickets()
      .then((res) => {
        if (res.data) setAssignedTickets(res.data);
      })
      .catch(() => {
        setError('No assigned tickets loaded. (Backend endpoints are currently in scaffold stage)');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Technician Work Queue</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review and update status for tasks assigned to you.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-slate-500 text-sm">
          {error}
        </div>
      ) : assignedTickets.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-lg p-8 text-center text-slate-500 text-sm">
          No tasks currently assigned to your queue.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {assignedTickets.map((ticket) => (
            <TicketCard key={ticket._id} ticket={ticket} />
          ))}
        </div>
      )}
    </div>
  );
};

