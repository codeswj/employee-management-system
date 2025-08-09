import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function useLogin() {
  const queryClient = useQueryClient();
  
  const {
    mutate: login,
    isError,
    isLoading,
    error,
  } = useMutation({
    mutationFn: async ({ email, password }) => {
      console.log("Attempting to login with:", { email });
      
      try {
        const response = await fetch("http://localhost:5005/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        });
        
        console.log("Response status:", response.status);
        const data = await response.json();
        console.log("Response data:", data);
        
        // Handle specific error cases from backend
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(data.message || "Email not found");
          } else if (response.status === 400) {
            throw new Error(data.message || "Incorrect password");
          } else {
            throw new Error(data.message || `Login failed (${response.status})`);
          }
        }
        
        // Store user data in localStorage for persistence
        localStorage.setItem("authUser", JSON.stringify(data));
        
        return data;
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    
    onSuccess: (data) => {
      console.log("Login successful:", data);
      // Invalidate queries to refetch the authUser
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      toast.success("Login successful!");
      
      // Optional: Redirect after login
      // window.location.href = "/dashboard"; // Or use router for SPA navigation
    },
    
    onError: (error) => {
      // Display a more user-friendly error message
      toast.error(error.message || "Failed to login. Please try again.");
    },
  });
  
  return { login, isLoading, isError, error };
}