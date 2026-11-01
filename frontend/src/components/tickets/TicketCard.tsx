import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import { Ticket } from '../../types';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../constants';
import { formatDate } from '../../utils';

export const TicketCard: React.FC<{ ticket: Ticket }> = ({ ticket }) => {
  return (
    <div className="bg-white border border-slate-200/80 rounded-lg p-5 hover:border-slate-300 hover:shadow-xs transition">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          {ticket.ticketCode && (
            <span className="text-xs font-mono text-slate-500 font-medium mr-2">
              {ticket.ticketCode}
            </span>
          )}
          <Link
            to={`/tickets/${ticket._id}`}
            className="text-base font-semibold text-slate-900 hover:text-blue-600 transition"
          >
            {ticket.title}
          </Link>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
              PRIORITY_COLORS[ticket.priority]
            }`}
          >
            {ticket.priority}
          </span>
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${
              STATUS_COLORS[ticket.status]
            }`}
          >
            {ticket.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      <p className="text-sm text-slate-600 line-clamp-2 mb-4">
        {ticket.description}
      </p>

      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 gap-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          <span>{ticket.building} - {ticket.room}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          <span>{formatDate(ticket.createdAt)}</span>
        </div>
      </div>
    </div>
  );
};

