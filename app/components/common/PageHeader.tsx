import { Link } from '@remix-run/react';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backLink?: {
    to: string;
    text: string;
  };
  rightContent?: ReactNode;
}

export default function PageHeader({ 
  title, 
  subtitle, 
  backLink, 
  rightContent 
}: PageHeaderProps) {
  return (
    <header className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            {backLink && (
              <Link
                to={backLink.to}
                className="text-purple-600 hover:text-purple-700"
              >
                ← {backLink.text}
              </Link>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
              {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
            </div>
          </div>
          {rightContent && (
            <div className="text-sm text-gray-500">
              {rightContent}
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 