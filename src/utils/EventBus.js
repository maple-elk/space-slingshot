/**
 * Decoupled EventBus for Space Slingshot
 * Emits semantic game events (COLLISION, LAUNCH, VICTORY, ENEMY_TURN, NEW_LEVEL)
 * allowing audio, particle effects, HUD readouts, and telemetry to react without coupling.
 */

export class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event 
   * @param {Function} callback 
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event 
   * @param {Function} callback 
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Emit an event to all subscribers
   * @param {string} event 
   * @param {any} payload 
   */
  emit(event, payload) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        try {
          callback(payload);
        } catch (err) {
          console.error(`Error in EventBus listener for event "${event}":`, err);
        }
      }
    }
  }

  /**
   * Clear all registered listeners
   */
  clear() {
    this.listeners.clear();
  }
}

// Default global event bus singleton
export const gameEvents = new EventBus();
