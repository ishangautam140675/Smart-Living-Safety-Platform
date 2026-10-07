/**
 * Cross-Tab Broadcast Channel & Event Hub
 * Enables instant multi-tab communication and rapid cache invalidation
 * without waiting for polling intervals.
 */

const CHANNEL_NAME = 'smart_living_sync_hub';

let channel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {
  channel = null;
}

const listeners = new Set();

if (channel) {
  channel.onmessage = (event) => {
    const data = event.data;
    listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (err) {
        console.error('Sync listener error:', err);
      }
    });
  };
}

// Fallback to localStorage 'storage' event for browsers or edge cases
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'smart_living_sync_event' && event.newValue) {
      try {
        const payload = JSON.parse(event.newValue);
        listeners.forEach((listener) => {
          try {
            listener(payload);
          } catch (err) {
            console.error('Storage sync listener error:', err);
          }
        });
      } catch {
        // ignore parse error
      }
    }
  });
}

export const syncHub = {
  /**
   * Broadcast an event across all open tabs immediately.
   * @param {string} module - e.g. 'RESIDENTS', 'PAYMENTS', 'COMPLAINTS', 'FOOD', 'VISITORS', 'ROOMS', 'INVENTORY'
   * @param {string} action - e.g. 'CREATED', 'UPDATED', 'DELETED', 'RATED'
   * @param {any} [payload] - optional metadata
   */
  emit(module, action, payload = {}) {
    const msg = {
      module,
      action,
      payload,
      timestamp: Date.now(),
      senderId: Math.random().toString(36).substring(2, 9),
    };

    if (channel) {
      try {
        channel.postMessage(msg);
      } catch (err) {
        console.warn('BroadcastChannel post error:', err);
      }
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('smart_living_sync_event', JSON.stringify(msg));
      } catch {
        // ignore storage error
      }
    }

    // Trigger local listeners as well
    listeners.forEach((listener) => {
      try {
        listener(msg);
      } catch (err) {
        console.error('Local listener error:', err);
      }
    });
  },

  /**
   * Subscribe to cross-tab events.
   * @param {(event: { module: string, action: string, payload: any, timestamp: number }) => void} callback
   * @returns {() => void} unsubscribe function
   */
  subscribe(callback) {
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  },
};
