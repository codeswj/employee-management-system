import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function useToggleLeave() {
  const queryClient = useQueryClient();
  
  const {
    mutate: toggleLeave,
    isLoading,
    isError,
    error,
  } = useMutation({
    mutationFn: async ({ leaveId }) => {
      console.log("Attempting to toggle leave with ID:", leaveId);
      
      try {
        const response = await fetch(`http://localhost:5005/api/admin-mangage-leave/toggle-leave/${leaveId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        
        console.log("Response status:", response.status);
        const data = await response.json();
        console.log("Response data:", data);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error(data.message || "Leave request not found");
          } else if (response.status === 500) {
            throw new Error(data.message || "Failed to update leave status");
          } else {
            throw new Error(data.message || `Request failed (${response.status})`);
          }
        }
        
        return data;
      } catch (error) {
        console.error("Toggle leave error:", error);
        throw error;
      }
    },
    
    onSuccess: (data) => {
      console.log("Leave status updated successfully:", data);
      
      // Invalidate and refetch leave requests
      queryClient.invalidateQueries({ queryKey: ["leaveRequests"] });
      
      // Also invalidate dashboard stats as they might change
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      
      // Show success message
      toast.success(data.message || "Leave status updated successfully!");
    },
    
    onError: (error) => {
      console.error("Failed to update leave status:", error);
      toast.error(error.message || "Failed to update leave status. Please try again.");
    },
  });
  
  return { toggleLeave, isLoading, isError, error };
}