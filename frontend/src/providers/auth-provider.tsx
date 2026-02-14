"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import {
  getLoginUrl,
  getLogoutUrl,
  getStoredToken,
  getStoredRefreshToken,
  saveTokens,
  clearTokens,
  refreshAccessToken,
  parseJwt,
  type JwtPayload,
} from "@/lib/auth";

interface User {
  sub: string;
  username: string;
  email: string;
  name: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  devLogin: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: () => { },
  logout: () => { },
  devLogin: () => { },
});

function jwtToUser(payload: JwtPayload): User {
  return {
    sub: payload.sub,
    username: payload.preferred_username || "user",
    email: payload.email || "",
    name: payload.name || payload.preferred_username || "Benutzer",
    roles: payload.realm_access?.roles || [],
  };
}

const IS_DEV_BYPASS = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === "true";
const DEV_LOGGED_OUT_KEY = "pdms_dev_logged_out";

const DEV_USER: User = {
  sub: "dev-user-0000-0000-000000000000",
  username: "dev-admin",
  email: "dev@pdms.local",
  name: "Dev Admin",
  roles: ["admin", "arzt", "pflege"],
};

/** Prüft ob im Dev-Modus ein Logout aktiv ist. */
function isDevLoggedOut(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(DEV_LOGGED_OUT_KEY) === "true";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialisierung ohne sessionStorage — SSR-sicher (verhindert Hydration-Mismatch)
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scheduleRefresh = useCallback((expiresIn: number) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    // Refresh 60s before expiry
    const refreshMs = Math.max((expiresIn - 60) * 1000, 10_000);
    refreshTimerRef.current = setTimeout(async () => {
      const rt = getStoredRefreshToken();
      if (!rt) return;
      try {
        const tokens = await refreshAccessToken(rt);
        setToken(tokens.access_token);
        saveTokens(tokens.access_token, tokens.refresh_token);
        const payload = parseJwt(tokens.access_token);
        setUser(jwtToUser(payload));
        scheduleRefresh(tokens.expires_in);
      } catch {
        clearTokens();
        setUser(null);
        setToken(null);
      }
    }, refreshMs);
  }, []);

  useEffect(() => {
    // Dev-Bypass: sofort als DEV_USER einloggen (nur Client-seitig)
    if (IS_DEV_BYPASS && !isDevLoggedOut()) {
      setUser(DEV_USER);
      setToken("dev-token");
      setIsLoading(false);
      return;
    }

    // Check for existing token on mount
    const storedToken = getStoredToken();
    if (storedToken) {
      try {
        const payload = parseJwt(storedToken);
        // Check if token is still valid (with 30s margin)
        if (payload.exp * 1000 > Date.now() + 30_000) {
          setUser(jwtToUser(payload));
          setToken(storedToken);
          const remaining = payload.exp - Math.floor(Date.now() / 1000);
          scheduleRefresh(remaining);
        } else {
          // Try refresh
          const rt = getStoredRefreshToken();
          if (rt) {
            refreshAccessToken(rt)
              .then((tokens) => {
                setToken(tokens.access_token);
                saveTokens(tokens.access_token, tokens.refresh_token);
                const p = parseJwt(tokens.access_token);
                setUser(jwtToUser(p));
                scheduleRefresh(tokens.expires_in);
              })
              .catch(() => clearTokens());
          } else {
            clearTokens();
          }
        }
      } catch {
        clearTokens();
      }
    }
    setIsLoading(false);

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, [scheduleRefresh]);

  const login = useCallback(async () => {
    const url = await getLoginUrl();
    window.location.href = url;
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    setToken(null);
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

    if (IS_DEV_BYPASS) {
      // Dev-Modus: Flag setzen und in den Keycloak-Login-Modus wechseln
      sessionStorage.setItem(DEV_LOGGED_OUT_KEY, "true");
      window.location.href = "/login?mode=keycloak";
    } else {
      window.location.href = getLogoutUrl();
    }
  }, []);

  /** Dev-Login: wird von der Login-Seite aufgerufen. */
  const devLogin = useCallback(() => {
    if (!IS_DEV_BYPASS) return;
    sessionStorage.removeItem(DEV_LOGGED_OUT_KEY);
    setUser(DEV_USER);
    setToken("dev-token");
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, devLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
