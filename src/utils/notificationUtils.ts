export type NotificationType = 'success' | 'error' | 'info';

interface NotificationOptions {
  type: NotificationType;
  title: string;
  message: string;
  duration?: number; // in milliseconds, 0 for no auto-close
  effectiveMode: 'light' | 'dark';
  colors: any;
}

interface NotificationItem extends NotificationOptions {
  id: string;
  element: HTMLElement;
  progressElement?: HTMLElement;
  progressBar?: HTMLElement;
  isExiting: boolean;
}

class NotificationManager {
  private notifications: NotificationItem[] = [];
  private container!: HTMLElement;

  constructor() {
    this.createContainer();
  }

  private createContainer() {
    this.container = document.createElement('div');
    this.container.id = 'notification-container';
    this.container.style.cssText = `
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 1000;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
    document.body.appendChild(this.container);
  }

  private createNotificationElement(options: NotificationOptions): HTMLElement {
    const notification = document.createElement('div');
    
    // Extract background and border colors from the colors object
    const containerClass = options.colors.container || (options.effectiveMode === 'light' ? 'bg-white' : 'bg-gray-800');
    const borderClass = options.colors.border || (options.effectiveMode === 'light' ? 'border-gray-300' : 'border-gray-700');
    
    // Convert Tailwind classes to actual colors
    const backgroundColor = this.getColorFromClass(containerClass, options.effectiveMode);
    const borderColor = this.getColorFromClass(borderClass, options.effectiveMode);
    
    notification.style.cssText = `
      background: ${backgroundColor};
      border: 1px solid ${borderColor};
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      max-width: 320px;
      width: 320px;
      pointer-events: auto;
      transform: translateX(100%);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      margin-bottom: 0;
    `;

    const iconColor = this.getIconColor(options.type, options.effectiveMode);
    const icon = this.getIcon(options.type, iconColor);

    notification.innerHTML = `
      <div style="padding: 16px;">
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <div style="flex-shrink: 0; margin-top: 2px;">
            ${icon}
          </div>
          <div style="flex: 1; min-width: 0;">
            <h4 style="
              font-weight: 600; 
              font-size: 14px; 
              margin: 0 0 4px 0;
              color: ${this.getTextColor(options.colors, options.effectiveMode, 'primary')};
            ">${options.title}</h4>
            <p style="
              font-size: 14px; 
              margin: 0;
              color: ${this.getTextColor(options.colors, options.effectiveMode, 'secondary')};
            ">${options.message}</p>
          </div>
          <button class="notification-close" style="
            flex-shrink: 0;
            background: none;
            border: none;
            cursor: pointer;
            color: ${this.getTextColor(options.colors, options.effectiveMode, 'muted')};
            transition: color 0.2s;
            padding: 0;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      ${options.duration && options.duration > 0 ? `
        <div style="
          height: 4px;
          background: ${this.getTextColor(options.colors, options.effectiveMode, 'muted')};
          border-radius: 0 0 8px 8px;
          overflow: hidden;
        ">
          <div class="notification-progress" style="
            height: 100%;
            background: ${this.getProgressColor(options.type, options.effectiveMode)};
            width: 100%;
            transition: width 0.1s linear;
          "></div>
        </div>
      ` : ''}
    `;

    // Add close button functionality
    const closeBtn = notification.querySelector('.notification-close') as HTMLElement;
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        // We'll set the id when we create the notification
        const notificationId = notification.getAttribute('data-notification-id');
        if (notificationId) {
          this.removeNotification(notificationId);
        }
      });
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.color = this.getTextColor(options.colors, options.effectiveMode, 'primary');
      });
      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.color = this.getTextColor(options.colors, options.effectiveMode, 'muted');
      });
    }

    return notification;
  }

  private getIcon(type: NotificationType, color: string): string {
    const iconSize = 20;
    switch (type) {
      case 'success':
        return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22,4 12,14.01 9,11.01"></polyline>
        </svg>`;
      case 'error':
        return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>`;
      case 'info':
      default:
        return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>`;
    }
  }

  private getIconColor(type: NotificationType, effectiveMode: 'light' | 'dark'): string {
    switch (type) {
      case 'success':
        return effectiveMode === 'light' ? '#059669' : '#34d399';
      case 'error':
        return effectiveMode === 'light' ? '#dc2626' : '#f87171';
      case 'info':
      default:
        return effectiveMode === 'light' ? '#2563eb' : '#60a5fa';
    }
  }

  private getProgressColor(type: NotificationType, effectiveMode: 'light' | 'dark'): string {
    switch (type) {
      case 'success':
        return effectiveMode === 'light' ? '#059669' : '#34d399';
      case 'error':
        return effectiveMode === 'light' ? '#dc2626' : '#f87171';
      case 'info':
      default:
        return effectiveMode === 'light' ? '#2563eb' : '#60a5fa';
    }
  }

  private getColorFromClass(className: string, effectiveMode: 'light' | 'dark'): string {
    // 1) Support arbitrary Tailwind colors like bg-[#123456] or border-[#123456]
    const arbitrary = className.match(/^(bg|border)-\[(#[0-9a-fA-F]{6,8})\]$/);
    if (arbitrary) {
      return arbitrary[2];
    }

    // 2) Try to resolve via computed styles by creating a temporary element
    try {
      const el = document.createElement('div');
      el.style.position = 'absolute';
      el.style.visibility = 'hidden';
      el.style.pointerEvents = 'none';
      el.className = className;
      document.body.appendChild(el);
      const styles = getComputedStyle(el);
      const isBorder = className.startsWith('border-');
      const value = isBorder ? (styles.borderTopColor || styles.borderColor) : styles.backgroundColor;
      document.body.removeChild(el);
      if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') {
        return value;
      }
    } catch {}

    // 3) Fallback for a few common classes and mode defaults
    const colorMap: { [key: string]: string } = {
      'bg-white': '#ffffff',
      'bg-gray-50': '#f9fafb',
      'bg-gray-100': '#f3f4f6',
      'bg-gray-200': '#e5e7eb',
      'bg-gray-800': '#1f2937',
      'bg-gray-900': '#111827',
      'bg-gray-950': '#030712',
      'border-gray-300': '#d1d5db',
      'border-gray-700': '#374151',
      'border-gray-800': '#1f2937',
    };
    return colorMap[className] || (effectiveMode === 'light' ? '#ffffff' : '#1f2937');
  }

  private getTextColor(colors: any, effectiveMode: 'light' | 'dark', type: 'primary' | 'secondary' | 'muted'): string {
    // Try to extract color from text class
    const textClass = colors.text || (effectiveMode === 'light' ? 'text-black' : 'text-white');
    
    const textColorMap: { [key: string]: string } = {
      'text-black': '#000000',
      'text-white': '#ffffff',
      'text-gray-900': '#111827',
      'text-gray-800': '#1f2937',
      'text-gray-700': '#374151',
      'text-gray-600': '#4b5563',
      'text-gray-500': '#6b7280',
      'text-gray-400': '#9ca3af',
      'text-gray-300': '#d1d5db',
      'text-slate-900': '#0f172a',
      'text-slate-800': '#1e293b',
      'text-slate-700': '#334155',
      'text-slate-600': '#475569',
      'text-slate-500': '#64748b',
      'text-slate-400': '#94a3b8',
    };

    const baseColor = textColorMap[textClass] || (effectiveMode === 'light' ? '#000000' : '#ffffff');
    
    switch (type) {
      case 'primary':
        return baseColor;
      case 'secondary':
        return effectiveMode === 'light' ? '#374151' : '#d1d5db';
      case 'muted':
        return effectiveMode === 'light' ? '#6b7280' : '#9ca3af';
      default:
        return baseColor;
    }
  }

  show(options: NotificationOptions): string {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const element = this.createNotificationElement(options);
    
    // Set the notification id on the element for close button functionality
    element.setAttribute('data-notification-id', id);
    
    const notification: NotificationItem = {
      ...options,
      id,
      element,
      isExiting: false,
    };

    // Add to container
    this.container.appendChild(element);
    this.notifications.push(notification);

    // Trigger slide-in animation from left
    requestAnimationFrame(() => {
      element.style.transform = 'translateX(0)';
      element.style.opacity = '1';
    });

    // Setup progress bar if duration is set
    if (options.duration && options.duration > 0) {
      const progressBar = element.querySelector('.notification-progress') as HTMLElement;
      if (progressBar) {
        notification.progressBar = progressBar;
        this.startProgress(notification);
      }
    }

    return id;
  }

  private startProgress(notification: NotificationItem) {
    if (!notification.progressBar || !notification.duration) return;

    const startTime = Date.now();
    const endTime = startTime + notification.duration;

    const updateProgress = () => {
      if (notification.isExiting) return;

      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const newProgress = (remaining / notification.duration!) * 100;
      
      if (newProgress <= 0) {
        this.removeNotification(notification.id);
      } else {
        notification.progressBar!.style.width = `${newProgress}%`;
        requestAnimationFrame(updateProgress);
      }
    };

    requestAnimationFrame(updateProgress);
  }

  removeNotification(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) return;

    notification.isExiting = true;
    
    // Slide out to the right
    notification.element.style.transform = 'translateX(100%)';
    notification.element.style.opacity = '0';

    // After the exit animation, remove the element and update positions
    setTimeout(() => {
      if (notification.element.parentNode) {
        notification.element.parentNode.removeChild(notification.element);
      }
      this.notifications = this.notifications.filter(n => n.id !== id);
      
      // Animate remaining notifications to slide up
      this.animateRemainingNotifications();
    }, 300);
  }

  private animateRemainingNotifications() {
    // Get all notification elements in the container
    const notificationElements = Array.from(this.container.children) as HTMLElement[];
    
    // Animate each notification to its new position
    notificationElements.forEach((element, index) => {
      const targetTransform = `translateY(${index * (320 + 8)}px)`; // 320px width + 8px gap
      element.style.transform = targetTransform;
    });
  }

  clearAll() {
    this.notifications.forEach(notification => {
      this.removeNotification(notification.id);
    });
  }
}

// Create singleton instance
const notificationManager = new NotificationManager();

// Export functions for easy use
export const showNotification = (
  type: NotificationType,
  title: string,
  message: string,
  options: { duration?: number; effectiveMode: 'light' | 'dark'; colors: any }
): string => {
  return notificationManager.show({
    type,
    title,
    message,
    duration: options.duration ?? 5000,
    effectiveMode: options.effectiveMode,
    colors: options.colors,
  });
};

export const showSuccess = (
  title: string,
  message: string,
  options: { duration?: number; effectiveMode: 'light' | 'dark'; colors: any }
): string => {
  return showNotification('success', title, message, options);
};

export const showError = (
  title: string,
  message: string,
  options: { duration?: number; effectiveMode: 'light' | 'dark'; colors: any }
): string => {
  return showNotification('error', title, message, options);
};

export const showInfo = (
  title: string,
  message: string,
  options: { duration?: number; effectiveMode: 'light' | 'dark'; colors: any }
): string => {
  return showNotification('info', title, message, options);
};

export const removeNotification = (id: string) => {
  notificationManager.removeNotification(id);
};

export const clearAllNotifications = () => {
  notificationManager.clearAll();
}; 