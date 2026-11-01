import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import { ticketService } from '../../services/ticket.service';
import { AdminOverview, SlaOverview, Ticket } from '../../types';
import { TicketCard } from '../../components/tickets/TicketCard';
import { LoadingSpinner } from '../../components/feedback/LoadingSpinner';
import {
  AlertCircle,
  ArrowRight,
  ClipboardList,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Wrench,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [slaOverview, setSlaOverview] = useState<SlaOverview | null>(null);
  const [openTickets, setOpenTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const [overviewData, slaData, ticketsRes] = await Promise.all([
        adminService.getOverview(),
        adminService.getSlaOverview(),
        ticketService.getAllTickets({ status: 'OPEN', limit: 6 })
      ]);

      if (overviewData) setOverview(overviewData);
      if (slaData) setSlaOverview(slaData);
      if (ticketsRes.tickets) setOpenTickets(ticketsRes.tickets);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setError(e.response?.data?.message || e.message || 'Failed to load administrator dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Maintenance Administration</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor campus issues, track SLA compliance, assign technicians, and ensure timely resolution.
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-rose-700 text-sm">
          <AlertCircle className="h-6 w-6 text-rose-500 mx-auto mb-2" />
          <p>{error}</p>
          <button
            onClick={() => loadData()}
            className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-md text-xs font-medium hover:bg-rose-700 transition"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* SLA Performance Overview Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  SLA & Resolution Tracking
                </h2>
                <p className="text-[11px] text-slate-400">
                  Target windows: Critical 2h, High 8h, Medium 24h, Low 72h
                </p>
              </div>
              <Link
                to="/admin/tickets?slaStatus=OVERDUE"
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1"
              >
                <span>View Overdue ({slaOverview?.overdue ?? 0})</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
              <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Active</span>
                  <ClipboardList className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {slaOverview?.totalUnresolved ?? 0}
                </p>
                <span className="text-[11px] text-slate-400">Unresolved tickets</span>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-emerald-600">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">On Track</span>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {slaOverview?.onTrack ?? 0}
                </p>
                <span className="text-[11px] text-emerald-600">&gt;20% SLA remaining</span>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-amber-600">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">At Risk</span>
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold text-amber-600 mt-1">
                  {slaOverview?.atRisk ?? 0}
                </p>
                <span className="text-[11px] text-amber-600">&le;20% SLA remaining</span>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-rose-600">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Overdue</span>
                  <AlertCircle className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold text-rose-600 mt-1">
                  {slaOverview?.overdue ?? 0}
                </p>
                <span className="text-[11px] text-rose-600">Past target deadline</span>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-blue-600">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Compliance</span>
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {slaOverview?.complianceRate ?? 100}%
                </p>
                <span className="text-[11px] text-slate-400">
                  {slaOverview?.resolvedOnTime ?? 0} on time / {slaOverview?.resolvedLate ?? 0} late
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Total</span>
                <ClipboardList className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {overview?.tickets.total ?? 0}
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center justify-between text-amber-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Open</span>
                <Clock className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {overview?.tickets.open ?? 0}
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center justify-between text-indigo-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Assigned</span>
                <Wrench className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-indigo-600 mt-1">
                {overview?.tickets.assigned ?? 0}
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center justify-between text-sky-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider">In Progress</span>
                <Clock className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-sky-600 mt-1">
                {overview?.tickets.inProgress ?? 0}
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center justify-between text-emerald-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Resolved</span>
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {overview?.tickets.resolved ?? 0}
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4">
              <div className="flex items-center justify-between text-rose-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Critical</span>
                <AlertTriangle className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                {overview?.tickets.critical ?? 0}
              </p>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-slate-400" />
                <span>
                  Active Technicians: <strong className="text-slate-900">{overview?.users.activeTechnicians ?? 0}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                <span>
                  Registered Students: <strong className="text-slate-900">{overview?.users.activeStudents ?? 0}</strong>
                </span>
              </div>
            </div>
            <Link
              to="/admin/users"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              <span>Manage User Directory</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Urgent Issues Section: Open tickets needing assignment */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Issues Requiring Technician Assignment</h2>
                <p className="text-xs text-slate-500 mt-0.5">Tickets with OPEN status that have not been assigned yet.</p>
              </div>
              <Link
                to="/admin/tickets"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <span>View all tickets</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {openTickets.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500 text-sm">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-medium text-slate-700">All caught up!</p>
                <p className="text-xs text-slate-400 mt-1">There are no open tickets waiting for technician assignment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {openTickets.map((t) => (
                  <TicketCard key={t._id} ticket={t} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
