// hooks/useEmployeeDashboard.js
import { useQuery } from "@tanstack/react-query";

// Hook for fetching employee dashboard stats
export const useEmployeeDashboardStats = () => {
  return useQuery({
    queryKey: ["employeeDashboardStats"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5005/api/employee-dashboard/dashboard-stats", {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch employee dashboard stats");
      }

      const data = await response.json();
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  });
};

// Hook for fetching employee's recent attendance
export const useEmployeeRecentAttendance = (limit = 10) => {
  return useQuery({
    queryKey: ["employeeRecentAttendance", limit],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:5005/api/employee-dashboard/recent-attendance?limit=${limit}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch recent attendance");
      }

      const data = await response.json();
      return data;
    },
  });
};

// Hook for fetching employee's leave history
export const useEmployeeLeaveHistory = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ["employeeLeaveHistory", page, limit],
    queryFn: async () => {
      const response = await fetch(
        `http://localhost:5005/api/employee-dashboard/leave-history?page=${page}&limit=${limit}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch leave history");
      }

      const data = await response.json();
      return data;
    },
  });
};