// hooks/useLeave.js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

// Custom hook for fetching leave types
export const useLeaveTypes = () => {
  return useQuery({
    queryKey: ["leaveTypes"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5005/api/leave", {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch leave types");
      }

      const data = await response.json();
      return data;
    },
  });
};

// Toggle (apply/remove) a leave request for the given leaveTypeId
export function useToggleLeave() {
  const queryClient = useQueryClient();

  const { mutate: toggleLeave, isLoading } = useMutation({
    mutationFn: async (leaveTypeId) => {
      const res = await fetch(
        `http://localhost:5005/api/leave/${leaveTypeId}`,
        {
          method: "POST",
          credentials: "include",
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to toggle leave request");
      }
      return data;
    },
    onSuccess: (payload) => {
      // Invalidate both leave-types list (to refresh badges) and user's own requests if you track them
      queryClient.invalidateQueries(["leaveTypes"]);
      queryClient.invalidateQueries(["myLeaves"]);
      
      // Show appropriate notification based on the action taken
      if (payload.action === "created") {
        toast.success(payload.message);
      } else if (payload.action === "removed") {
        toast.success("Leave request successfully canceled");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Could not update leave request");
    },
  });

  return { toggleLeave, isLoading };
}

// Custom hook for fetching user's leave requests (new hook)
export const useMyLeaveRequests = () => {
    return useQuery({
      queryKey: ["myLeaves"],
      queryFn: async () => {
        const response = await fetch("http://localhost:5005/api/leave/my-requests", {
          credentials: "include",
        });
  
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to fetch your leave requests");
        }
  
        const data = await response.json();
        return data;
      },
    });
  };

// NEW: Custom hook for creating a new leave type (admin only)
export function useCreateLeaveType() {
    const queryClient = useQueryClient();
  
    const { mutate: createLeaveType, isLoading } = useMutation({
      mutationFn: async (leaveData) => {
        const res = await fetch(
          "http://localhost:5005/api/admin-mangage-leave",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(leaveData),
            credentials: "include",
          }
        );
        
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to create leave type");
        }
        return data;
      },
      onSuccess: (payload) => {
        // Invalidate leave types to refresh the list
        queryClient.invalidateQueries(["leaveTypes"]);
        
        // Show success notification
        toast.success(payload.message || "Leave type created successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Could not create leave type");
      },
    });
  
    return { createLeaveType, isLoading };
  }

  // Add new hook to useLeave.js
export function useDeleteLeaveType() {
    const queryClient = useQueryClient();
  
    return useMutation({
      mutationFn: async (leaveId) => {
        const res = await fetch(`http://localhost:5005/api/admin-mangage-leave/${leaveId}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to delete leave');
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries(['leaveTypes']);
        toast.success('Leave type deleted successfully');
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to delete leave type');
      }
    });
  }