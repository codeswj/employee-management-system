// hooks/useAuth.js
import { useQuery } from "@tanstack/react-query";

export const useAuth = () => {
  return useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5005/api/auth/me", {
        credentials: "include", // Important!
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Auth failed");
      return data.user;
    },
  });
};