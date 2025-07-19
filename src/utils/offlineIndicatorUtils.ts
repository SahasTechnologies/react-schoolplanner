

export interface OfflineIndicatorOptions {
  effectiveMode: 'light' | 'dark';
  className?: string;
  showText?: boolean;
  size?: 'small' | 'medium' | 'large';
  offlineCachingEnabled?: boolean;
  onToggleOfflineCaching?: () => void;
}

export interface OfflineIndicatorInstance {
  element: HTMLElement;
  update: (options: OfflineIndicatorOptions) => void;
  destroy: () => void;
}

class OfflineIndicatorManager {
  private indicators: Map<string, OfflineIndicatorInstance> = new Map();

  createIndicator(id: string, options: OfflineIndicatorOptions): OfflineIndicatorInstance {
    const element = document.createElement('div');
    element.className = `offline-indicator ${options.className || ''}`;
    
    const instance: OfflineIndicatorInstance = {
      element,
      update: (newOptions: OfflineIndicatorOptions) => this.updateIndicator(id, newOptions),
      destroy: () => this.destroyIndicator(id)
    };

    this.updateIndicator(id, options);
    this.indicators.set(id, instance);
    
    return instance;
  }

  private updateIndicator(id: string, options: OfflineIndicatorOptions) {
    const instance = this.indicators.get(id);
    if (!instance) return;

    const { element } = instance;
    const isOnline = navigator.onLine;

    // Clear existing content
    element.innerHTML = '';

    // If online and offline caching is enabled, show "Run on WiFi" button
    if (isOnline && options.offlineCachingEnabled) {
      element.className = `flex items-center gap-2 ${options.className || ''}`;
      
      const wifiIcon = this.createWifiIcon(options.effectiveMode, options.size);
      element.appendChild(wifiIcon);

      if (options.showText) {
        const button = this.createRunningOnWifiButton(options);
        element.appendChild(button);
      }
    }
    // If actually offline, show offline indicator
    else if (!isOnline) {
      element.className = `flex items-center gap-2 ${options.className || ''}`;
      
      const wifiOffIcon = this.createWifiOffIcon(options.effectiveMode, options.size);
      element.appendChild(wifiOffIcon);

      if (options.showText) {
        const text = this.createOfflineText(options);
        element.appendChild(text);
      }
    }
    // If online and not in offline caching mode, hide the element
    else {
      element.style.display = 'none';
    }
  }

  private createWifiIcon(effectiveMode: 'light' | 'dark', size: string = 'medium'): HTMLElement {
    const icon = document.createElement('div');
    const iconSize = size === 'small' ? 16 : size === 'large' ? 20 : 18;
    const color = effectiveMode === 'light' ? '#059669' : '#34d399';
    
    icon.innerHTML = `
      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
        <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
        <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
        <line x1="12" y1="20" x2="12.01" y2="20"></line>
      </svg>
    `;
    
    return icon;
  }

  private createWifiOffIcon(effectiveMode: 'light' | 'dark', size: string = 'medium'): HTMLElement {
    const icon = document.createElement('div');
    const iconSize = size === 'small' ? 16 : size === 'large' ? 20 : 18;
    const color = effectiveMode === 'light' ? '#6b7280' : '#9ca3af';
    
    icon.innerHTML = `
      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
        <line x1="1" y1="1" x2="23" y2="23"></line>
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
        <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
        <line x1="12" y1="20" x2="12.01" y2="20"></line>
      </svg>
    `;
    
    return icon;
  }

  private createRunningOnWifiButton(options: OfflineIndicatorOptions): HTMLElement {
    const button = document.createElement('button');
    const sizeClasses: Record<string, string> = {
      small: 'text-xs',
      medium: 'text-sm',
      large: 'text-base'
    };
    
    const textColor = options.effectiveMode === 'light' 
      ? 'text-green-700 hover:text-green-800' 
      : 'text-green-300 hover:text-green-200';
    
    button.className = `font-medium ${sizeClasses[options.size || 'medium']} ${textColor} transition-colors duration-200`;
    button.textContent = 'Running on WiFi';
    
    if (options.onToggleOfflineCaching) {
      button.addEventListener('click', options.onToggleOfflineCaching);
    }
    
    return button;
  }

  private createOfflineText(options: OfflineIndicatorOptions): HTMLElement {
    const text = document.createElement('span');
    const sizeClasses: Record<string, string> = {
      small: 'text-xs',
      medium: 'text-sm',
      large: 'text-base'
    };
    
    const textColor = options.effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-300';
    
    text.className = `font-medium ${sizeClasses[options.size || 'medium']} ${textColor}`;
    text.textContent = 'Offline mode';
    
    return text;
  }

  destroyIndicator(id: string) {
    const instance = this.indicators.get(id);
    if (instance) {
      if (instance.element.parentNode) {
        instance.element.parentNode.removeChild(instance.element);
      }
      this.indicators.delete(id);
    }
  }

  // Method to update all indicators when network status changes
  updateAllIndicators() {
    this.indicators.forEach(() => {
      // We need to store the options somewhere to update them
      // For now, this is a placeholder - in a real implementation,
      // you'd store the options with each instance
    });
  }

  // Method to check if any indicators exist
  hasIndicators(): boolean {
    return this.indicators.size > 0;
  }

  // Method to get all indicator instances
  getAllIndicators(): OfflineIndicatorInstance[] {
    return Array.from(this.indicators.values());
  }
}

// Create singleton instance
const offlineIndicatorManager = new OfflineIndicatorManager();

// Export functions for easy use
export const createOfflineIndicator = (
  id: string,
  options: OfflineIndicatorOptions
): OfflineIndicatorInstance => {
  return offlineIndicatorManager.createIndicator(id, options);
};

export const updateOfflineIndicator = (
  id: string,
  options: OfflineIndicatorOptions
) => {
  const instance = offlineIndicatorManager.getAllIndicators().find(i => i.element.id === id);
  if (instance) {
    instance.update(options);
  }
};

export const destroyOfflineIndicator = (id: string) => {
  offlineIndicatorManager.destroyIndicator(id);
};

export const updateAllOfflineIndicators = () => {
  offlineIndicatorManager.updateAllIndicators();
};

// React hook for network status (if needed in React components)
export const useOfflineStatus = () => {
  return !navigator.onLine;
};

// Utility function to create offline indicator element
export const createOfflineIndicatorElement = (options: OfflineIndicatorOptions): HTMLElement => {
  const element = document.createElement('div');
  const isOnline = navigator.onLine;

  if (isOnline && options.offlineCachingEnabled) {
    element.className = `flex items-center gap-2 ${options.className || ''}`;
    
    const wifiIcon = document.createElement('div');
    const iconSize = options.size === 'small' ? 16 : options.size === 'large' ? 20 : 18;
    const color = options.effectiveMode === 'light' ? '#059669' : '#34d399';
    
    wifiIcon.innerHTML = `
      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
        <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
        <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
        <line x1="12" y1="20" x2="12.01" y2="20"></line>
      </svg>
    `;
    element.appendChild(wifiIcon);

    if (options.showText) {
      const button = document.createElement('button');
      const sizeClasses: Record<string, string> = {
        small: 'text-xs',
        medium: 'text-sm',
        large: 'text-base'
      };
      
      const textColor = options.effectiveMode === 'light' 
        ? 'text-green-700 hover:text-green-800' 
        : 'text-green-300 hover:text-green-200';
      
      button.className = `font-medium ${sizeClasses[options.size || 'medium']} ${textColor} transition-colors duration-200`;
      button.textContent = 'Running on WiFi';
      
      if (options.onToggleOfflineCaching) {
        button.addEventListener('click', options.onToggleOfflineCaching);
      }
      
      element.appendChild(button);
    }
  } else if (!isOnline) {
    element.className = `flex items-center gap-2 ${options.className || ''}`;
    
    const wifiOffIcon = document.createElement('div');
    const iconSize = options.size === 'small' ? 16 : options.size === 'large' ? 20 : 18;
    const color = options.effectiveMode === 'light' ? '#6b7280' : '#9ca3af';
    
    wifiOffIcon.innerHTML = `
      <svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
        <line x1="1" y1="1" x2="23" y2="23"></line>
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"></path>
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"></path>
        <path d="M10.71 5.05A16 16 0 0 1 22.58 9"></path>
        <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"></path>
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
        <line x1="12" y1="20" x2="12.01" y2="20"></line>
      </svg>
    `;
    element.appendChild(wifiOffIcon);

    if (options.showText) {
      const text = document.createElement('span');
      const sizeClasses: Record<string, string> = {
        small: 'text-xs',
        medium: 'text-sm',
        large: 'text-base'
      };
      
      const textColor = options.effectiveMode === 'light' ? 'text-gray-700' : 'text-gray-300';
      
      text.className = `font-medium ${sizeClasses[options.size || 'medium']} ${textColor}`;
      text.textContent = 'Offline mode';
      
      element.appendChild(text);
    }
  } else {
    element.style.display = 'none';
  }

  return element;
}; 