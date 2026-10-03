/**
 * Microsoft Clarity Analytics Service
 * Provides session recordings, heatmaps, and user interaction analytics.
 */

declare global {
  interface Window {
    clarity?: (...args: any[]) => void;
  }
}

const DEFAULT_PROJECT_ID = (import.meta as any).env?.VITE_CLARITY_PROJECT_ID || 'py18b8s0k6'; // Default / configurable Project ID

/**
 * Initializes Microsoft Clarity tracking script dynamically
 */
export const initClarity = (projectId: string = DEFAULT_PROJECT_ID): void => {
  if (typeof window === 'undefined') return;

  // Prevent duplicate script injections
  if (window.clarity) {
    console.log('[Microsoft Clarity] Already initialized');
    return;
  }

  try {
    (function (c: any, l: Document, a: string, r: string, i: string) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      const t = l.createElement(r) as HTMLScriptElement;
      t.async = true;
      t.src = `https://www.clarity.ms/tag/${i}`;
      const y = l.getElementsByTagName(r)[0];
      if (y && y.parentNode) {
        y.parentNode.insertBefore(t, y);
      }
    })(window, document, 'clarity', 'script', projectId);

    console.log(`🚀 [Microsoft Clarity] Successfully initialized with Project ID: ${projectId}`);
  } catch (err) {
    console.error('[Microsoft Clarity] Initialization error:', err);
  }
};

/**
 * Tag session with user identification for Clarity session recordings
 */
export const identifyClarityUser = (userId: string, customId?: string, sessionName?: string): void => {
  if (window.clarity) {
    window.clarity('identify', userId, customId, sessionName);
  }
};

/**
 * Set custom metadata tags for filtering sessions in Clarity Dashboard
 */
export const setClarityTag = (key: string, value: string | string[]): void => {
  if (window.clarity) {
    window.clarity('set', key, value);
  }
};

/**
 * Fire custom event in Microsoft Clarity
 */
export const trackClarityEvent = (eventName: string): void => {
  if (window.clarity) {
    window.clarity('event', eventName);
  }
};
