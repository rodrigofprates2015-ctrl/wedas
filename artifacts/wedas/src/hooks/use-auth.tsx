import { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetMe, useLogin, useLogout } from "@workspace/api-client-react";
import type { LoginInput, User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<void>;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("wedas_token"));
  const [, setLocation] = useLocation();

  const { data: user, isLoading: isUserLoading, refetch } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
      queryKey: ["getMe", token],
    },
  });

  const loginMutation = useLogin();

  const login = async (data: LoginInput) => {
    try {
      const res = await loginMutation.mutateAsync({ data });
      localStorage.setItem("wedas_token", res.token);
      setToken(res.token);
      await refetch();
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("wedas_token");
    setToken(null);
    setLocation("/login");
  };

  useEffect(() => {
    // Intercept customFetch to inject token if available
    const originalFetch = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      let headers = new Headers(init?.headers);
      const currentToken = localStorage.getItem("wedas_token");
      if (currentToken) {
        headers.set("Authorization", `Bearer ${currentToken}`);
      }
      return originalFetch(input, { ...init, headers });
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading: isUserLoading,
        login,
        logout,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
