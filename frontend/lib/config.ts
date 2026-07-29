// Configuration utility for managing environment-specific settings

export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://preprod.css.cloud.ms2tech.fr/api/v1',
  },
  
  // Organizer Configuration
  organizer: {
    // Default organizer ID from environment
    defaultId: process.env.NEXT_PUBLIC_ORGANIZER_ID || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZER_ID || '',
    
    // Environment-specific organizer IDs
    devId: process.env.NEXT_PUBLIC_DEV_ORGANIZER_ID || '',
    prodId: process.env.NEXT_PUBLIC_PROD_ORGANIZER_ID || '',
    
    // Get the appropriate organizer ID based on environment
    getOrganizerId(): string {
      if (process.env.NODE_ENV === 'development' && this.devId) {
        return this.devId;
      }
      if (process.env.NODE_ENV === 'production' && this.prodId) {
        return this.prodId;
      }
      if (this.defaultId) {
        return this.defaultId;
      }
      // Fallback to forced organizer ID when no environment variable is found
      return 'e219c1e4-2f2e-4719-b2f9-c6ce4d2d8d2e';
    },
    
    // Check if we have a default organizer configured
    hasDefaultOrganizer(): boolean {
      return !!this.getOrganizerId();
    },
    
    // Get organizer info for display
    getOrganizerInfo(): { id: string; name: string } {
      const id = this.getOrganizerId();
      return {
        id,
        name: id ? `Organisateur (${id.slice(0, 8)}...)` : 'Aucun organisateur'
      };
    }
  },
  
  // Feature flags
  features: {
    // Enable organizer-specific views by default
    enableOrganizerFilter: true,
    
    // Show all plans by default (vs organizer-specific)
    showAllPlansByDefault: true,
  }
};

// Local storage keys for persistent data
export const STORAGE_KEYS = {
  SELECTED_ORGANIZER: 'entrix_selected_organizer',
  VIEW_MODE: 'entrix_plans_view_mode',
  LAST_FILTERS: 'entrix_plans_filters',
} as const;

// Local storage utility
export const storage = {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  },
  
  remove(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  }
}; 