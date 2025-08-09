// hooks/useDepartments.js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

// Custom hook for fetching all departments
export const useDepartments = () => {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5005/api/department/", {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch departments");
      }

      const data = await response.json();
      return data;
    },
  });
};

// Custom hook for creating a new department
export function useCreateDepartment() {
  const queryClient = useQueryClient();

  const { mutate: createDepartment, isLoading } = useMutation({
    mutationFn: async (departmentData) => {
      const res = await fetch(
        "http://localhost:5005/api/department/create-department",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(departmentData),
          credentials: "include",
        }
      );
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create department");
      }
      return data;
    },
    onSuccess: (payload) => {
      // Invalidate departments to refresh the list
      queryClient.invalidateQueries(["departments"]);
      
      // Show success notification
      toast.success(payload.message || "Department created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Could not create department");
    },
  });

  return { createDepartment, isLoading };
}

// Custom hook for deleting a department
export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (departmentId) => {
      const res = await fetch(`http://localhost:5005/api/department/${departmentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete department');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['departments']);
      toast.success('Department deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete department');
    }
  });
}