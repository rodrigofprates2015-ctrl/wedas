import { createContext, useContext, useState } from "react";
import { useLocation } from "wouter";
import { useGetMe, useLogin, useLogout, setAuthTokenGetter } from "@workspace/api-client-react";
import type { LoginInput, User } from "@workspace/api-client-react";

setAuthTokenGetter(() => localStorage.getItem("wedas_token"));

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
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
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
