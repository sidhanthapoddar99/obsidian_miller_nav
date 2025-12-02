/**
 * EventBus - Internal event system for MillerNav
 * Provides type-safe event emission and subscription
 */

import { MillerNavEvents } from '../types';

type EventCallback<T> = (data: T) => void;

export class EventBus {
  private listeners: Map<string, Set<EventCallback<unknown>>> = new Map();

  /**
   * Subscribe to an event
   */
  on<K extends keyof MillerNavEvents>(
    event: K,
    callback: EventCallback<MillerNavEvents[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as EventCallback<unknown>);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event
   */
  off<K extends keyof MillerNavEvents>(
    event: K,
    callback: EventCallback<MillerNavEvents[K]>
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback as EventCallback<unknown>);
    }
  }

  /**
   * Emit an event
   */
  emit<K extends keyof MillerNavEvents>(
    event: K,
    data: MillerNavEvents[K]
  ): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      for (const callback of eventListeners) {
        try {
          callback(data);
        } catch (error) {
          console.error(`MillerNav: Error in event listener for ${event}`, error);
        }
      }
    }
  }

  /**
   * Subscribe to an event once
   */
  once<K extends keyof MillerNavEvents>(
    event: K,
    callback: EventCallback<MillerNavEvents[K]>
  ): () => void {
    const wrapper: EventCallback<MillerNavEvents[K]> = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    return this.on(event, wrapper);
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event?: keyof MillerNavEvents): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get number of listeners for an event
   */
  listenerCount(event: keyof MillerNavEvents): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

// Singleton instance for the plugin
let eventBusInstance: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!eventBusInstance) {
    eventBusInstance = new EventBus();
  }
  return eventBusInstance;
}

export function resetEventBus(): void {
  if (eventBusInstance) {
    eventBusInstance.removeAllListeners();
    eventBusInstance = null;
  }
}
