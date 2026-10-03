interface CacheEntry<T> {
  data: T;
  expiry: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get value from cache if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set value in cache with a TTL (Time-To-Live in seconds)
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    const expiry = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { data, expiry });
  }

  /**
   * Delete a specific cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching a prefix or substring pattern
   */
  invalidatePattern(pattern: string): number {
    let deletedCount = 0;
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  /**
   * Invalidate multiple patterns at once
   */
  invalidatePatterns(patterns: string[]): void {
    patterns.forEach((pattern) => this.invalidatePattern(pattern));
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get total number of active cached items
   */
  size(): number {
    // Purge expired keys first
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }
}

export const cacheService = new CacheService();
