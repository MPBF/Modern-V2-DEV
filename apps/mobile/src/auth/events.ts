// Lightweight pub/sub used by the API client to notify the AuthContext when
// a token refresh fails (so the UI can flip to logged-out without races).

type Listener = () => void;

class AuthEventEmitter {
  private listeners = new Set<Listener>();

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit() {
    for (const l of this.listeners) {
      try { l(); } catch { /* swallow */ }
    }
  }
}

export const authForcedLogout = new AuthEventEmitter();
