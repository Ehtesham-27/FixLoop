import React from 'react';
import { SlaStatus } from '../../types';
import { SLA_STATUS_COLORS } from '../../constants';
import { CheckCircle2, AlertTriangle, AlertCircle, ShieldCheck, Clock } from 'lucide-react';

interface SlaBadgeProps {
  status?: SlaStatus;
  className?: string;
  showIcon?: boolean;
}

export const SlaBadge: React.FC<SlaBadgeProps> = ({
  status = 'ON_TRACK',
  className = '',
  showIcon = true
}) => {
  const getIcon = () => {
    switch (status) {
      case 'ON_TRACK':
        return <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />;
      case 'AT_RISK':
        return <AlertTriangle className="h-3 w-3 text-amber-600 shrink-0" />;
      case 'OVERDUE':
        return <AlertCircle className="h-3 w-3 text-rose-600 shrink-0" />;
      case 'RESOLVED_ON_TIME':
        return <ShieldCheck className="h-3 w-3 text-emerald-600 shrink-0" />;
      case 'RESOLVED_LATE':
        return <Clock className="h-3 w-3 text-rose-600 shrink-0" />;
      default:
        return null;
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'ON_TRACK':
        return 'ON TRACK';
      case 'AT_RISK':
        return 'AT RISK';
      case 'OVERDUE':
        return 'OVERDUE';
      case 'RESOLVED_ON_TIME':
        return 'RESOLVED ON TIME';
      case 'RESOLVED_LATE':
        return 'RESOLVED LATE';
      default:
        return status;
    }
  };

  const colorStyle = SLA_STATUS_COLORS[status] || SLA_STATUS_COLORS.ON_TRACK;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${colorStyle} ${className}`}
    >
      {showIcon && getIcon()}
      <span>{getLabel()}</span>
    </span>
  );
};
