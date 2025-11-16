"use client";
import { useState, useEffect } from "react";

export function useSession() {
  const [session, setSession] = useState({
    user: null,
    isLoggedIn: false,
    isLoading: true,
  });

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const response = await fetch("/api/auth/session");
      const data = await response.json();
      setSession({
        user: data.user,
        isLoggedIn: data.isLoggedIn,
        isLoading: false,
      });
    } catch (error) {
      console.error("Error fetching session:", error);
      setSession({
        user: null,
        isLoggedIn: false,
        isLoading: false,
      });
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setSession({
        user: null,
        isLoggedIn: false,
        isLoading: false,
      });
      window.location.href = "/sign-in";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return {
    ...session,
    refetch: fetchSession,
    logout,
  };
}
