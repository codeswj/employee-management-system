// hooks/useLogout.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const {
    mutate: logout,
    isLoading,
    isError,
    error,
  } = useMutation({
    mutationFn: async () => {
      const res = await fetch("http://localhost:5005/api/auth/logout", {
        method: "POST",
        credentials: "include", // send cookies
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Logout failed");
      return data;
    },
    onSuccess: () => {
       // Immediately set authUser to null
       queryClient.setQueryData(["authUser"], null);
       // Optionally invalidate the authUser query to refetch if necessary
       queryClient.invalidateQueries(["authUser"]);
      // 2) show a toast
      toast.success("Logged out successfully");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  return { logout, isLoading, isError, error };
}
