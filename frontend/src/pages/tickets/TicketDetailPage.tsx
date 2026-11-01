import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  User,
  Building,
  Wrench,
  CheckCircle2,
  AlertCircle,
  History,
  SlidersHorizontal,
  X,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { ticketService } from '../../services/ticket.service';
import { adminService } from '../../services/admin.service';
import { Ticket, AuditLog, User as UserType, TicketPriority } from '../../types';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import { STATUS_COLORS, PRIORITY_COLORS } from '../../constants';
import { formatDate } from '../../utils';

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Technician action states
  const [resolving, setResolving] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionError, setActionError] = useState('');

  // Admin action states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [technicians, setTechnicians] = useState<UserType[]>([]);
  const [assigning, setAssigning] = useState(false);

  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority>('MEDIUM');
  const [updatingPriority, setUpdatingPriority] = useState(false);

  const loadTicketData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');

    try {
      const [ticketData, activityData] = await Promise.all([
        ticketService.getTicketById(id),
        ticketService.getTicketActivity(id)
      ]);

      if (ticketData) {
        setTicket(ticketData);
        setSelectedPriority(ticketData.priority);
      }
      if (activityData) {
        setActivity(activityData);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTicketData();
  }, [loadTicketData]);

  // Load technician list if current user is admin
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      adminService.getActiveTechnicians().then(setTechnicians).catch(() => {});
    }
  }, [user]);

  // Technician starts work: ASSIGNED -> IN_PROGRESS
  const handleStartWork = async () => {
    if (!ticket) return;
    setUpdatingStatus(true);
    setActionError('');

    try {
      await ticketService.updateStatus(ticket._id, 'IN_PROGRESS');
      await loadTicketData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setActionError(e.response?.data?.message || 'Failed to update ticket status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Technician resolves ticket: IN_PROGRESS -> RESOLVED
  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || resolutionNote.trim().length < 5) {
      setActionError('Resolution notes must be at least 5 characters');
      return;
    }

    setResolving(true);
    setActionError('');

    try {
      await ticketService.updateStatus(ticket._id, 'RESOLVED', resolutionNote.trim());
      setShowResolveModal(false);
      setResolutionNote('');
      await loadTicketData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setActionError(e.response?.data?.message || 'Failed to resolve ticket');
    } finally {
      setResolving(false);
    }
  };

  // Admin assigns technician
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !selectedTechId) return;

    setAssigning(true);
    setActionError('');

    try {
      await ticketService.assignTicket(ticket._id, selectedTechId);
      setShowAssignModal(false);
      setSelectedTechId('');
      await loadTicketData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setActionError(e.response?.data?.message || 'Failed to assign technician');
    } finally {
      setAssigning(false);
    }
  };

  // Admin updates priority
  const handlePrioritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !selectedPriority) return;

    setUpdatingPriority(true);
    setActionError('');

    try {
      await ticketService.updatePriority(ticket._id, selectedPriority);
      setShowPriorityModal(false);
      await loadTicketData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setActionError(e.response?.data?.message || 'Failed to update priority');
    } finally {
      setUpdatingPriority(false);
    }
  };

  const getCategoryName = () => {
    if (!ticket) return '';
    if (typeof ticket.category === 'object' && ticket.category !== null) {
      return ticket.category.name;
    }
    return String(ticket.category);
  };

  const getReporterDisplay = () => {
    if (!ticket) return '';
    if (typeof ticket.reportedBy === 'object' && ticket.reportedBy !== null) {
      return `${ticket.reportedBy.name} (${ticket.reportedBy.email})`;
    }
    return String(ticket.reportedBy || 'Unknown');
  };

  const getTechnicianDisplay = () => {
    if (!ticket || !ticket.assignedTo) return 'Unassigned';
    if (typeof ticket.assignedTo === 'object' && ticket.assignedTo !== null) {
      return `${ticket.assignedTo.name} (${ticket.assignedTo.email})`;
    }
    return String(ticket.assignedTo);
  };

  const isAssignedTechnician =
    user?.role === 'TECHNICIAN' &&
    ticket?.assignedTo &&
    ((typeof ticket.assignedTo === 'object' && ticket.assignedTo._id === user._id) ||
      ticket.assignedTo === user._id);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top back navigation and controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        {/* Admin Quick Action Buttons */}
        {user?.role === 'ADMIN' && ticket && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const currentTechId =
                  typeof ticket.assignedTo === 'object' && ticket.assignedTo
                    ? ticket.assignedTo._id
                    : typeof ticket.assignedTo === 'string'
                    ? ticket.assignedTo
                    : '';
                setSelectedTechId(currentTechId);
                setShowAssignModal(true);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 transition"
            >
              <Wrench className="h-3.5 w-3.5" />
              <span>{ticket.assignedTo ? 'Reassign' : 'Assign'}</span>
            </button>
            <button
              onClick={() => setShowPriorityModal(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-300 transition"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span>Priority</span>
            </button>
          </div>
        )}
      </div>

      {actionError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError('')} className="text-rose-500 hover:text-rose-700">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-600 text-sm">
          <AlertCircle className="h-8 w-8 text-rose-500 mx-auto mb-2" />
          <p className="font-semibold text-slate-800 mb-1">Ticket Details</p>
          <p className="text-slate-500">{error}</p>
        </div>
      ) : ticket ? (
        <div className="space-y-6">
          {/* Main Ticket Info Card */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 space-y-6 shadow-xs">
            {/* Header info */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {ticket.ticketCode && (
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                      {ticket.ticketCode}
                    </span>
                  )}
                  <span className="text-xs font-medium text-slate-400">
                    Category: <strong className="text-slate-700">{getCategoryName()}</strong>
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{ticket.title}</h1>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border ${PRIORITY_COLORS[ticket.priority]}`}
                >
                  {ticket.priority} Priority
                </span>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium border ${STATUS_COLORS[ticket.status]}`}
                >
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 bg-slate-50/60 p-4 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2.5">
                <Building className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  Location:{' '}
                  <strong className="text-slate-800">
                    {ticket.location || `${ticket.building || ''} - ${ticket.room || ''}`}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  Reported on: <strong className="text-slate-800">{formatDate(ticket.createdAt)}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <User className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  Reported by: <strong className="text-slate-800">{getReporterDisplay()}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Wrench className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  Technician: <strong className="text-slate-800">{getTechnicianDisplay()}</strong>
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2">Issue Description</h3>
              <div className="text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                {ticket.description}
              </div>
            </div>

            {/* Images (if any) */}
            {ticket.images && ticket.images.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">Attached Photos & Media</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ticket.images.map((att, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-200 rounded-lg p-3 bg-white flex items-center gap-3"
                    >
                      {att.mimeType && att.mimeType.startsWith('image/') ? (
                        <ImageIcon className="h-6 w-6 text-blue-500 shrink-0" />
                      ) : (
                        <FileText className="h-6 w-6 text-slate-400 shrink-0" />
                      )}
                      <div className="overflow-hidden">
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-medium text-blue-600 hover:underline truncate block"
                        >
                          {att.originalName}
                        </a>
                        <span className="text-[10px] text-slate-400">
                          {(att.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resolution Details */}
            {ticket.status === 'RESOLVED' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Resolution Completed</span>
                  {ticket.resolvedAt && (
                    <span className="text-xs text-emerald-700 font-normal">
                      on {formatDate(ticket.resolvedAt)}
                    </span>
                  )}
                </div>
                {ticket.resolutionNote && (
                  <p className="text-xs text-emerald-900 bg-white/70 p-3 rounded-lg border border-emerald-200/60 leading-relaxed">
                    {ticket.resolutionNote}
                  </p>
                )}
              </div>
            )}

            {/* Technician Workflow Action Bar */}
            {isAssignedTechnician && (
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-4 sm:p-6 rounded-b-xl">
                <div>
                  <span className="text-xs font-semibold text-slate-700">Assigned Technician Actions</span>
                  <p className="text-xs text-slate-500">Update ticket state as you perform campus maintenance.</p>
                </div>

                <div className="flex items-center gap-2">
                  {ticket.status === 'ASSIGNED' && (
                    <button
                      onClick={handleStartWork}
                      disabled={updatingStatus}
                      className="px-4 py-2 text-xs font-semibold bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition disabled:opacity-50"
                    >
                      {updatingStatus ? 'Updating...' : 'Start Work (In Progress)'}
                    </button>
                  )}

                  {ticket.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => setShowResolveModal(true)}
                      className="px-4 py-2 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                    >
                      Resolve Issue
                    </button>
                  )}

                  {ticket.status === 'RESOLVED' && (
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200">
                      Issue marked as Resolved
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Activity / Audit History Section */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <History className="h-5 w-5 text-slate-500" />
              <h2 className="text-base font-bold text-slate-900">Activity & Audit Timeline</h2>
            </div>

            {activity.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No activity entries recorded yet.</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {activity.map((entry) => {
                  const actor = entry.actorId;
                  const actorName = actor ? actor.name : 'System';
                  const actorRole = actor ? actor.role : '';

                  const formattedChange =
                    entry.oldValue && entry.newValue
                      ? `${String(entry.oldValue)} → ${String(entry.newValue)}`
                      : entry.newValue
                      ? String(entry.newValue)
                      : '';

                  return (
                    <div key={entry._id} className="relative">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[1.85rem] top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-slate-500 shadow-xs" />

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-semibold text-slate-800">{actorName}</span>
                          {actorRole && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {actorRole}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">{formatDate(entry.createdAt)}</span>
                        </div>

                        <p className="text-xs text-slate-600">
                          <span className="font-medium text-slate-700">
                            {entry.action.replace('_', ' ')}:
                          </span>{' '}
                          {entry.note || formattedChange}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Technician Resolution Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Resolve Ticket</h3>
              <button
                onClick={() => setShowResolveModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Provide mandatory resolution notes detailing how the campus issue was inspected and corrected.
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resolution Notes (Minimum 5 characters) *
                </label>
                <textarea
                  rows={4}
                  required
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="e.g. Replaced leaking drain pipe valve under sink. Tested water flow and verified zero leaks."
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving || resolutionNote.trim().length < 5}
                  className="px-4 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  {resolving ? 'Submitting...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Assign Technician</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Active Technician
                </label>
                <select
                  value={selectedTechId}
                  onChange={(e) => setSelectedTechId(e.target.value)}
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="">-- Choose technician --</option>
                  {technicians.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning || !selectedTechId}
                  className="px-4 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  {assigning ? 'Assigning...' : 'Assign Technician'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Priority Modal */}
      {showPriorityModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Update Ticket Priority</h3>
              <button
                onClick={() => setShowPriorityModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePrioritySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Priority Level
                </label>
                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value as TicketPriority)}
                  required
                  className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPriorityModal(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPriority}
                  className="px-4 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  {updatingPriority ? 'Updating...' : 'Save Priority'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
