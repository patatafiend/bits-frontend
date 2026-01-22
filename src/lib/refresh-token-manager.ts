import { SERVICES } from "./utils";

export class TokenRefreshManager {
  private refreshPromise: Promise<boolean> | null = null;
  private lastRefreshAttempt = 0;
  private readonly MIN_REFRESH_INTERVAL = 1000; // Prevent rapid successive refreshes

  async ensureValidToken(): Promise<boolean> {
    const exp = localStorage.getItem("exp");
    let expDate = new Date();

    if (exp && exp !== "") {
      expDate = new Date(exp);
    }

    // Token is still valid
    if (expDate.getTime() + 5 > new Date().getTime()) {
      console.log("Token is still valid, no need to refresh");
      return true;
    }

    // Prevent rapid successive refresh attempts
    const now = Date.now();
    if (now - this.lastRefreshAttempt < this.MIN_REFRESH_INTERVAL) {
      console.log("Refresh attempt too soon, waiting for existing refresh");
      return this.refreshPromise || Promise.resolve(false);
    }

    // If a refresh is already in progress, return that promise
    if (this.refreshPromise) {
      console.log("Token refresh already in progress, waiting...");
      return this.refreshPromise;
    }

    // Start a new refresh
    console.log("Starting token refresh");
    this.lastRefreshAttempt = now;
    this.refreshPromise = this.performRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      // Clear the promise after a short delay to allow reuse
      setTimeout(() => {
        this.refreshPromise = null;
      }, 100);
    }
  }

  private async performRefresh(): Promise<boolean> {
    try {
      const refreshRes = await fetch(SERVICES.backend + "/user/refresh_token", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-type": "application/json",
        },
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        if (refreshData.exp) {
          localStorage.setItem("exp", refreshData.exp);
          console.log("Token refreshed successfully");
          return true;
        }
      }

      console.warn("Token refresh failed: Invalid response");
      return false;
    } catch (error) {
      console.warn("Token refresh failed:", error);
      return false;
    }
  }

  // Optional: Clear the refresh state (useful for logout)
  reset() {
    this.refreshPromise = null;
    this.lastRefreshAttempt = 0;
  }
}
