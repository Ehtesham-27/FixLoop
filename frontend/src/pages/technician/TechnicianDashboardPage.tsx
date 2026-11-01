import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Play, MapPin, ArrowRight } from 'lucide-react';
import { ticketService } from '../../services/ticket.service';
import { Ticket, TicketStatus } from '../../types';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../constants';
import { formatDate } from '../../utils';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/feedback/Alert';
import { SlaBadge } from '../../components/sla/SlaBadge';
import { SlaCountdown } from '../../components/sla/SlaCountdown';

export const TechnicianDashboardPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  // Modal state for resolving tickets
  const [resolvingTicket, setResolvingTicket] = useState<Ticket | null>(null);
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [isSubmittingResolution, setIsSubmittingResolution] = useState<boolean>(false);

  const fetchAssigned = () => {
    setLoading(true);
    setError('');

    ticketService
      .getAssignedTickets({ limit: 50 })
      .then((data) => {
        setTickets(data.tickets);
      })
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          'Failed to load assigned work queue.';
        setError(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAssigned();
  }, []);

  const handleStartWork = async (ticketId: string) => {
    setActionError('');
    setActionSuccess('');

    try {
      await ticketService.updateStatus(ticketId, 'IN_PROGRESS' as TicketStatus);
      setActionSuccess('Ticket marked as IN PROGRESS. Work has commenced.');
      fetchAssigned();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to transition ticket to IN PROGRESS.';
      setActionError(msg);
    }
  };

  const handleOpenResolveModal = (ticket: Ticket) => {
    setResolvingTicket(ticket);
    setResolutionNote('');
    setActionError('');
  };

  const handleConfirmResolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTicket) return;

    if (!resolutionNote.trim() || resolutionNote.trim().length < 5) {
      setActionError('Resolution notes must be at least 5 characters explaining the repair.');
      return;
    }

    setIsSubmittingResolution(true);
    setActionError('');

    try {
      await ticketService.updateStatus(
        resolvingTicket._id,
        'RESOLVED' as TicketStatus,
        resolutionNote.trim()
      );
      setActionSuccess(`Ticket ${resolvingTicket.ticketCode || ''} marked as RESOLVED.`);
      setResolvingTicket(null);
      fetchAssigned();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to resolve ticket.';
      setActionError(msg);
    } finally {
      setIsSubmittingResolution(false);
    }
  };

  const activeQueue = tickets.filter((t) => t.status !== 'RESOLVED');
  const resolvedQueue = tickets.filter((t) => t.status === 'RESOLVED');
  const overdueCount = activeQueue.filter((t) => t.isOverdue).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Technician Work Queue
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Tasks assigned to you by administrators. Review SLA deadlines, begin repairs, and document resolution.
        </p>
      </div>

      {actionSuccess && <Alert type="success" message={actionSuccess} />}
      {actionError && <Alert type="error" message={actionError} />}

      {/* Overview metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Assigned
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{tickets.length}</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
            Active Tasks
          </span>
          <p className="text-2xl font-bold text-amber-600 mt-1">{activeQueue.length}</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
            Overdue (Breached)
          </span>
          <p className="text-2xl font-bold text-rose-600 mt-1">{overdueCount}</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 sm:p-5 shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Resolved
          </span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{resolvedQueue.length}</p>
        </div>
      </div>

      {/* Main active work list */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-3">Active Tasks ({activeQueue.length})</h2>

        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="bg-white border border-red-200 rounded-xl p-6 text-center text-red-600 text-sm">
            {error}
          </div>
        ) : activeQueue.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500 text-sm">
            No active maintenance tasks in your queue right now. Great job!
          </div>
        ) : (
          <div className="space-y-4">
            {activeQueue.map((ticket) => {
              const isOverdue = ticket.isOverdue;
              return (
                <div
                  key={ticket._id}
                  className={`bg-white border ${
                    isOverdue ? 'border-rose-300 ring-1 ring-rose-100' : 'border-slate-200/80'
                  } rounded-xl p-5 shadow-xs hover:border-slate-300 transition`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {ticket.ticketCode && (
                          <span className="text-xs font-mono font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                            {ticket.ticketCode}
                          </span>
                        )}
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
                      <Link
                        to={`/tickets/${ticket._id}`}
                        className="text-base font-bold text-slate-900 hover:text-blue-600 transition"
                      >
                        {ticket.title}
                      </Link>
                    </div>

                    {/* Actions according to lifecycle */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 pt-2 sm:pt-0">
                      {ticket.status === 'ASSIGNED' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleStartWork(ticket._id)}
                          className="gap-1.5"
                        >
                          <Play className="h-3.5 w-3.5" />
                          <span>Start Work</span>
                        </Button>
                      )}

                      {ticket.status === 'IN_PROGRESS' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenResolveModal(ticket)}
                          className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500 gap-1.5"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Resolve Ticket</span>
                        </Button>
                      )}

                      <Link
                        to={`/tickets/${ticket._id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900 px-2.5 py-1.5 border border-slate-300 rounded-md hover:bg-slate-50 transition"
                      >
                        <span>Details</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 mb-3">{ticket.description}</p>

                  <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100 gap-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{ticket.location || `${ticket.building || ''} - ${ticket.room || ''}`}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {ticket.dueAt && (
                        <SlaCountdown
                          dueAt={ticket.dueAt}
                          status={ticket.status}
                          resolvedAt={ticket.resolvedAt}
                        />
                      )}
                      <div className="flex items-center gap-1 text-slate-400">
                        <span>Reported: {formatDate(ticket.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Resolution Notes Modal */}
      {resolvingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div>
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Resolve Task
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                Document Resolution for {resolvingTicket.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Explain the repair actions taken before marking this ticket resolved.
              </p>
            </div>

            <form onSubmit={handleConfirmResolution} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" htmlFor="resNotes">
                  Mandatory Resolution Notes * (min 5 characters)
                </label>
                <textarea
                  id="resNotes"
                  rows={4}
                  required
                  minLength={5}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Replaced blown fuse and verified voltage. All outlets tested working."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setResolvingTicket(null)}
                  disabled={isSubmittingResolution}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSubmittingResolution}
                  className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
                >
                  Confirm & Mark Resolved
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
