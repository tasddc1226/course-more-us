interface ErrorMessageProps {
  message: string;
  variant?: 'error' | 'success' | 'warning';
  className?: string;
}

export default function ErrorMessage({ 
  message, 
  variant = 'error', 
  className = '' 
}: ErrorMessageProps) {
  const variantClasses = {
    error: 'text-red-500 bg-red-50 border-red-200',
    success: 'text-green-600 bg-green-50 border-green-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200'
  };

  return (
    <div className={`text-sm text-center py-2 px-4 rounded-lg border ${variantClasses[variant]} ${className}`}>
      {message}
    </div>
  );
} 