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
        className={effectiveMode === 'light' ? 'text-green-600' : 'text-green-400'} 
        size={size === 'small' ? 16 : size === 'large' ? 20 : 18} 
      />
        {showText && (
          <button
            onClick={onToggleOfflineCaching}
            className={`font-medium ${size === 'small' ? 'text-xs' : size === 'large' ? 'text-base' : 'text-sm'} ${
              effectiveMode === 'light' 
                ? 'text-green-700 hover:text-green-800' 
                : 'text-green-300 hover:text-green-200'
            } transition-colors duration-200`}
          >
            Running on WiFi
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