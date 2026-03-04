import { BACKEND } from "./utils";

export class TokenRefreshManager {
  private refreshPromise: Promise<boolean> | null = null;
  private lastRefreshAttempt = 0;
  private readonly MIN_REFRESH_INTERVAL = 1000; // Prevent rapid successive refreshes

  async ensureValidToken(): Promise<boolean> {
    if (this.refreshPromise) {
      console.log("Token refresh already in progress, waiting...");
      return this.refreshPromise;
    }

    const exp = localStorage.getItem("exp");

    if (exp && exp !== "") {
      const expDate = new Date(Number(exp) * 1000);
      if (expDate.getTime() - 5000 > Date.now()) {
        // refresh 5s BEFORE expiry
        console.log("Token is still valid, no need to refresh");
        return true;
      }
    }

    const now = Date.now();
    if (now - this.lastRefreshAttempt < this.MIN_REFRESH_INTERVAL) {
      console.log("Refresh attempt too soon, skipping");
      return false;
    }

    console.log("Starting token refresh");
    this.lastRefreshAttempt = now;
    this.refreshPromise = this.performRefresh();

    try {
      return await this.refreshPromise;
    } finally {
      setTimeout(() => {
        this.refreshPromise = null;
      }, 100);
    }
  }

  private async performRefresh(): Promise<boolean> {
    try {
      const refreshRes = await fetch(
        BACKEND.bits_backend + "/user/refresh_token",
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-type": "application/json",
          },
        },
      );

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
