import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Tag } from 'lucide-react';
import { Ticket } from '../../types';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../constants';
import { formatDate } from '../../utils';
import { SlaBadge } from '../sla/SlaBadge';
import { SlaCountdown } from '../sla/SlaCountdown';

export const TicketCard: React.FC<{ ticket: Ticket }> = ({ ticket }) => {
  const categoryName =
    typeof ticket.category === 'object' && ticket.category !== null
      ? ticket.category.name
      : ticket.category || 'General';

  const locationText =
    ticket.location || (ticket.building ? `${ticket.building} - ${ticket.room || ''}` : 'Campus');

  const isCardOverdue = ticket.isOverdue && ticket.status !== 'RESOLVED';

  return (
    <div
      className={`bg-white border ${
        isCardOverdue ? 'border-rose-300 ring-1 ring-rose-100' : 'border-slate-200/80'
      } rounded-lg p-5 hover:border-slate-300 hover:shadow-xs transition`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {ticket.ticketCode && (
              <span className="text-xs font-mono text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
                {ticket.ticketCode}
              </span>
            )}
            <span className="inline-flex items-center text-xs text-slate-500 gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
              <Tag className="h-3 w-3 text-slate-400" />
              <span>{categoryName}</span>
            </span>
          </div>
          <Link
            to={`/tickets/${ticket._id}`}
            className="text-base font-semibold text-slate-900 hover:text-blue-600 transition truncate block"
          >
            {ticket.title}
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 shrink-0 justify-end">
          {ticket.slaStatus && <SlaBadge status={ticket.slaStatus} />}
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

      <p className="text-sm text-slate-600 line-clamp-2 mb-4">{ticket.description}</p>

      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 gap-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate max-w-[250px]">{locationText}</span>
        </div>
        <div className="flex items-center gap-3">
          {ticket.dueAt && (
            <SlaCountdown
              dueAt={ticket.dueAt}
              status={ticket.status}
              resolvedAt={ticket.resolvedAt}
            />
          )}
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>{formatDate(ticket.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
