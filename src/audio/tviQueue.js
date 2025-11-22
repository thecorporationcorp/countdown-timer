/**
 * TVI QUEUE - Anti-Overlap Audio Queue
 *
 * Manages speech queue to prevent overlapping announcements.
 * Implements priority system for critical messages.
 *
 * @module tviQueue
 */

// ============================================================================
// PRIORITY LEVELS
// ============================================================================

const PRIORITY = {
  LOW: 0,
  NORMAL: 1,
  HIGH: 2,
  CRITICAL: 3,
};

// ============================================================================
// QUEUE CLASS
// ============================================================================

class TVIQueue {
  constructor() {
    this.queue = [];
    this.maxSize = 10;
  }

  /**
   * Add item to queue
   * @param {object} item - Queue item with text, options, resolve, reject
   */
  add(item) {
    const priority = item.options?.priority ?? PRIORITY.NORMAL;

    // Remove lower priority items if at max size
    if (this.queue.length >= this.maxSize) {
      const lowestPriority = Math.min(...this.queue.map(i => i.priority ?? PRIORITY.NORMAL));
      if (priority > lowestPriority) {
        const index = this.queue.findIndex(i => (i.priority ?? PRIORITY.NORMAL) === lowestPriority);
        if (index !== -1) {
          const removed = this.queue.splice(index, 1)[0];
          removed.resolve?.(); // Resolve as skipped
        }
      } else {
        // Queue full, skip this item
        item.resolve?.();
        return;
      }
    }

    // Insert at correct position based on priority
    const insertIndex = this.queue.findIndex(
      (i) => (i.priority ?? PRIORITY.NORMAL) < priority
    );

    if (insertIndex === -1) {
      this.queue.push({ ...item, priority });
    } else {
      this.queue.splice(insertIndex, 0, { ...item, priority });
    }
  }

  /**
   * Get next item from queue
   * @returns {object|null}
   */
  next() {
    return this.queue.shift() || null;
  }

  /**
   * Clear all queued items
   */
  clear() {
    // Resolve all pending as skipped
    this.queue.forEach((item) => item.resolve?.());
    this.queue = [];
  }

  /**
   * Get current queue size
   * @returns {number}
   */
  size() {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   * @returns {boolean}
   */
  isEmpty() {
    return this.queue.length === 0;
  }

  /**
   * Remove items matching a filter
   * @param {function} predicate
   */
  remove(predicate) {
    const toRemove = this.queue.filter(predicate);
    toRemove.forEach((item) => item.resolve?.());
    this.queue = this.queue.filter((item) => !predicate(item));
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const tviQueue = new TVIQueue();
export { PRIORITY };
