import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, User, Building } from 'lucide-react';
import { ticketService } from '../../services/ticket.service';
import { Ticket } from '../../types';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../constants';
import { formatDate } from '../../utils';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!id) return;
    ticketService
      .getTicketById(id)
      .then((res) => {
        if (res.data) setTicket(res.data);
      })
      .catch(() => {
        setError('Ticket details endpoint is in scaffold mode.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-600 text-sm">
          <p className="font-semibold text-slate-800 mb-1">Ticket Details Scaffold</p>
          <p className="text-slate-500">{error}</p>
        </div>
      ) : ticket ? (
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              {ticket.ticketCode && (
                <span className="text-xs font-mono font-medium text-slate-500 mr-2">
                  {ticket.ticketCode}
                </span>
              )}
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{ticket.title}</h1>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${PRIORITY_COLORS[ticket.priority]}`}>
                {ticket.priority}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${STATUS_COLORS[ticket.status]}`}>
                {ticket.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-slate-400" />
              <span>{ticket.building} - {ticket.room}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>Created: {formatDate(ticket.createdAt)}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-slate-400" />
              <span>Category: {ticket.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span>Location: {ticket.building}</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
              {ticket.description}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
};

