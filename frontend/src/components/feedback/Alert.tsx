import React from 'react';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

interface AlertProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  message: string;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  message,
  className = ''
}) => {
  const styles = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    error: 'bg-red-50 text-red-800 border-red-200'
  };

  const icons = {
    info: <Info className="h-5 w-5 text-blue-500 mr-2 shrink-0" />,
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 mr-2 shrink-0" />,
    warning: <AlertCircle className="h-5 w-5 text-amber-500 mr-2 shrink-0" />,
    error: <XCircle className="h-5 w-5 text-red-500 mr-2 shrink-0" />
  };

  return (
    <div className={`p-4 rounded-md border flex items-start text-sm ${styles[type]} ${className}`} role="alert">
      {icons[type]}
      <div>
        {title && <h5 className="font-semibold mb-0.5">{title}</h5>}
        <p>{message}</p>
      </div>
    </div>
  );
};

