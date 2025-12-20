import { X, CheckCircle, AlertCircle } from 'lucide-react';

type AlertProps = {
  type: 'success' | 'error';
  message: string;
  onClose?: () => void;
  className?: string;
};

export function Alert({ type, message, onClose, className = '' }: AlertProps) {
  const styles = {
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: <AlertCircle className="w-5 h-5 text-red-600" />,
    },
  };

  const currentStyle = styles[type];

  return (
    <div
      className={`flex items-start justify-between p-4 border rounded-lg ${currentStyle.container} ${className}`}
      role="alert"
    >
      <div className="flex items-start space-x-3">
        {currentStyle.icon}
        <p className="text-sm font-medium">{message}</p>
      </div>
      
      {onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close alert"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
