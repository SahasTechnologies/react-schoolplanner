import * as React from 'react';
import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../utils/networkUtils';

interface OfflineIndicatorProps {
  effectiveMode: 'light' | 'dark';
  colors: any;
  className?: string;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  effectiveMode, 
  colors, 
  className = '', 
  showText = true,
  size = 'medium' 
}) => {
  const isOnline = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  const sizeClasses: Record<string, string> = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  const iconSizes: Record<string, number> = {
    small: 16,
    medium: 18,
    large: 20
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <WifiOff 
        className={effectiveMode === 'light' ? 'text-orange-600' : 'text-orange-400'} 
        size={iconSizes[size]} 
      />
      {showText && (
        <span className={`font-medium ${sizeClasses[size]} ${effectiveMode === 'light' ? 'text-orange-700' : 'text-orange-300'}`}>
          Offline mode
        </span>
      )}
    </div>
  );
};

export default OfflineIndicator; 