import React, { useEffect, useState } from 'react';
import { TicketStatus } from '../../types';
import { Clock, AlertCircle } from 'lucide-react';

interface SlaCountdownProps {
  dueAt?: string;
  status: TicketStatus;
  resolvedAt?: string | null;
  className?: string;
  showIcon?: boolean;
}

export const SlaCountdown: React.FC<SlaCountdownProps> = ({
  dueAt,
  status,
  resolvedAt,
  className = '',
  showIcon = true
}) => {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    // If ticket is already resolved or no due date is provided, do not run interval
    if (status === 'RESOLVED' || !dueAt) {
      return;
    }

    // Update countdown every 60 seconds
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    // Re-synchronize when browser tab regains focus
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setNow(Date.now());
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [dueAt, status]);

  if (!dueAt) {
    return null;
  }

  const dueTime = new Date(dueAt).getTime();
  if (isNaN(dueTime)) {
    return null;
  }

  const formatDuration = (ms: number): string => {
    const totalMinutes = Math.floor(Math.max(0, ms) / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${Math.max(1, minutes)}m`;
  };

  // For resolved tickets
  if (status === 'RESOLVED') {
    if (resolvedAt) {
      const resolvedTime = new Date(resolvedAt).getTime();
      const diff = dueTime - resolvedTime;
      if (diff >= 0) {
        return (
          <span className={`inline-flex items-center gap-1 text-emerald-600 font-medium ${className}`}>
            {showIcon && <Clock className="h-3 w-3 shrink-0" />}
            <span>Resolved on time</span>
          </span>
        );
      } else {
        return (
          <span className={`inline-flex items-center gap-1 text-rose-600 font-medium ${className}`}>
            {showIcon && <AlertCircle className="h-3 w-3 shrink-0" />}
            <span>Resolved {formatDuration(Math.abs(diff))} late</span>
          </span>
        );
      }
    }
    return (
      <span className={`inline-flex items-center gap-1 text-slate-500 ${className}`}>
        {showIcon && <Clock className="h-3 w-3 shrink-0" />}
        <span>Resolved</span>
      </span>
    );
  }

  // For active tickets
  const remainingMs = dueTime - now;

  if (remainingMs < 0) {
    return (
      <span className={`inline-flex items-center gap-1 text-rose-600 font-semibold ${className}`}>
        {showIcon && <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
        <span>Overdue by {formatDuration(Math.abs(remainingMs))}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 text-slate-600 font-medium ${className}`}>
      {showIcon && <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />}
      <span>{formatDuration(remainingMs)} remaining</span>
    </span>
  );
};
