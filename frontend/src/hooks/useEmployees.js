import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function useGetAllEmployees() {
  const {
    data: employees,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      try {
        const response = await fetch("http://localhost:5005/api/admin-mangage-employee/", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch employees");
        }

        const data = await response.json();
        return data.users;
      } catch (error) {
        console.error("Error fetching employees:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    onError: (error) => {
      toast.error(error.message || "Failed to load employees.");
    },
  });

  return { employees: employees || [], isLoading, isError, error };
}

// Hook for getting a single employee by ID
export function useGetEmployee(employeeId) {
  const {
    data: employee,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: async () => {
      try {
        const response = await fetch(`http://localhost:5005/api/admin-mangage-employee/${employeeId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch employee");
        }

        const data = await response.json();
        return data.user;
      } catch (error) {
        console.error("Error fetching employee:", error);
        throw error;
      }
    },
    enabled: !!employeeId, // Only run query if employeeId is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    onError: (error) => {
      toast.error(error.message || "Failed to load employee details.");
    },
  });

  return { employee, isLoading, isError, error };
}

// Hook for creating a new employee
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  const { mutate: createEmployee, isLoading } = useMutation({
    mutationFn: async (employeeData) => {
      const res = await fetch(
        "http://localhost:5005/api/admin-mangage-employee/register-employee",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(employeeData),
          credentials: "include",
        }
      );
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to create employee");
      }
      return data;
    },
    onSuccess: (payload) => {
      // Invalidate and refetch employees list
      queryClient.invalidateQueries(["employees"]);
      queryClient.invalidateQueries(["departments"]); // Also refresh departments as employee count changed
      toast.success(payload.message || "Employee created successfully");
    },
    onError: (error) => {
      console.error("Create employee error:", error);
      toast.error(error.message || "Could not create employee");
    },
  });

  return { createEmployee, isLoading };
}

// Hook for updating an employee
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  const { mutate: updateEmployee, isLoading } = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await fetch(
        `http://localhost:5005/api/admin-mangage-employee/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
          credentials: "include",
        }
      );
      
      const responseData = await res.json();
      if (!res.ok) {
        throw new Error(responseData.message || "Failed to update employee");
      }
      return responseData;
    },
    onSuccess: (payload, { id }) => {
      // Invalidate multiple queries to ensure data consistency
      queryClient.invalidateQueries(["employees"]);
      queryClient.invalidateQueries(["employee", id]); // Refresh specific employee data
      queryClient.invalidateQueries(["departments"]); // Refresh departments if department changed
      toast.success(payload.message || "Employee updated successfully");
    },
    onError: (error) => {
      console.error("Update employee error:", error);
      toast.error(error.message || "Could not update employee");
    },
  });

  return { updateEmployee, isLoading };
}

// Hook for deleting an employee
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  const { mutate: deleteEmployee, isLoading } = useMutation({
    mutationFn: async (employeeId) => {
      const res = await fetch(
        `http://localhost:5005/api/admin-mangage-employee/${employeeId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete employee");
      }
      return data;
    },
    onSuccess: (payload, employeeId) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries(["employees"]);
      queryClient.removeQueries(["employee", employeeId]); // Remove specific employee from cache
      queryClient.invalidateQueries(["departments"]); // Refresh departments as employee count changed
      toast.success(payload.message || "Employee deleted successfully");
    },
    onError: (error) => {
      console.error("Delete employee error:", error);
      toast.error(error.message || "Could not delete employee");
    },
  });

  return { deleteEmployee, isLoading };
}

// Optional: Hook for bulk operations (if needed in the future)
export function useBulkEmployeeOperations() {
  const queryClient = useQueryClient();

  const { mutate: bulkUpdateEmployees, isLoading: isBulkUpdating } = useMutation({
    mutationFn: async ({ employeeIds, updateData }) => {
      const promises = employeeIds.map(id => 
        fetch(`http://localhost:5005/api/admin-mangage-employee/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
          credentials: "include",
        }).then(res => res.json())
      );
      
      const results = await Promise.all(promises);
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["employees"]);
      queryClient.invalidateQueries(["departments"]);
      toast.success("Bulk update completed successfully");
    },
    onError: (error) => {
      console.error("Bulk update error:", error);
      toast.error("Bulk update failed");
    },
  });

  const { mutate: bulkDeleteEmployees, isLoading: isBulkDeleting } = useMutation({
    mutationFn: async (employeeIds) => {
      const promises = employeeIds.map(id => 
        fetch(`http://localhost:5005/api/admin-mangage-employee/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }).then(res => res.json())
      );
      
      const results = await Promise.all(promises);
      return results;
    },
    onSuccess: (_, employeeIds) => {
      queryClient.invalidateQueries(["employees"]);
      employeeIds.forEach(id => queryClient.removeQueries(["employee", id]));
      queryClient.invalidateQueries(["departments"]);
      toast.success("Selected employees deleted successfully");
    },
    onError: (error) => {
      console.error("Bulk delete error:", error);
      toast.error("Bulk delete failed");
    },
  });

  return {
    bulkUpdateEmployees,
    bulkDeleteEmployees,
    isBulkUpdating,
    isBulkDeleting,
  };
}