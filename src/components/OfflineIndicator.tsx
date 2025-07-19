import * as React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useNetworkStatus } from '../utils/networkUtils';

interface OfflineIndicatorProps {
  effectiveMode: 'light' | 'dark';
  className?: string;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
  offlineCachingEnabled?: boolean;
  onToggleOfflineCaching?: () => void;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ 
  effectiveMode, 
  className = '', 
  showText = true,
  size = 'medium',
  offlineCachingEnabled = false,
  onToggleOfflineCaching
}) => {
  const isOnline = useNetworkStatus();

  // If online and offline caching is enabled, show "Run on WiFi" button
  if (isOnline && offlineCachingEnabled) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Wifi 
          className={effectiveMode === 'light' ? 'text-blue-600' : 'text-blue-400'} 
          size={size === 'small' ? 16 : size === 'large' ? 20 : 18} 
        />
        {showText && (
          <button
            onClick={onToggleOfflineCaching}
            className={`font-medium ${size === 'small' ? 'text-xs' : size === 'large' ? 'text-base' : 'text-sm'} ${
              effectiveMode === 'light' 
                ? 'text-blue-700 hover:text-blue-800' 
                : 'text-blue-300 hover:text-blue-200'
            } transition-colors duration-200`}
          >
            Run on WiFi
          </button>
        )}
      </div>
    );
  }

  // If actually offline, show offline indicator
  if (!isOnline) {
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
          className={effectiveMode === 'light' ? 'text-gray-600' : 'text-gray-400'} 
          size={iconSizes[size]} 
        />
        {showText && (
          <span className={`font-medium ${sizeClasses[size]} ${effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
            Offline mode
          </span>
        )}
      </div>
    );
  }

  // If online and not in offline caching mode, don't show anything
  return null;
};

export default OfflineIndicator; 