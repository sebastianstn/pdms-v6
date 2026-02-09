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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isLoading: true,
  login: () => { },
  logout: () => { },
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

export function AuthProvider({ children }: { children: ReactNode }) {
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
    window.location.href = getLogoutUrl();
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
