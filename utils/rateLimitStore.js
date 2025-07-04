export class RateLimitStore {
    constructor() {
      this.clients = new Map();
      this.resetTime = 24 * 60 * 60 * 1000; // 24 hours
      
      // Clean up old entries every hour
      setInterval(() => this.cleanup(), 60 * 60 * 1000);
    }
  
    async increment(key) {
      const now = Date.now();
      const client = this.clients.get(key) || { count: 0, resetTime: now + this.resetTime };
      
      // Reset if time window has passed
      if (now > client.resetTime) {
        client.count = 0;
        client.resetTime = now + this.resetTime;
      }
      
      client.count++;
      this.clients.set(key, client);
      
      return {
        totalHits: client.count,
        resetTime: new Date(client.resetTime)
      };
    }
  
    async decrement(key) {
      const client = this.clients.get(key);
      if (client && client.count > 0) {
        client.count--;
        this.clients.set(key, client);
      }
    }
  
    async resetKey(key) {
      this.clients.delete(key);
    }
  
    cleanup() {
      const now = Date.now();
      for (const [key, client] of this.clients.entries()) {
        if (now > client.resetTime) {
          this.clients.delete(key);
        }
      }
    }
  }