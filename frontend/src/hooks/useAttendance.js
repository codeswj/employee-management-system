// frontend/src/hooks/useAttendance.js

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

// Hook to clock in
export function useClockIn() {
  const queryClient = useQueryClient();

  const {
    mutate: clockIn,
    isLoading: isClockingIn,
    isError: isClockInError,
    error: clockInError,
  } = useMutation({
    mutationFn: async ({ status, clockInTime }) => {
      const response = await fetch("http://localhost:5005/api/attendance/clock-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, clockInTime }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to clock in");
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["attendance"]);
      queryClient.invalidateQueries(["todayAttendance"]);
      toast.success(data.message || "Clocked in successfully!");
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to clock in");
    },
  });

  return { clockIn, isClockingIn, isClockInError, clockInError };
}

// Hook to clock out
export function useClockOut() {
  const queryClient = useQueryClient();

  const {
    mutate: clockOut,
    isLoading: isClockingOut,
    isError: isClockOutError,
    error: clockOutError,
  } = useMutation({
    mutationFn: async (clockOutTime) => {
      const response = await fetch("http://localhost:5005/api/attendance/clock-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ clockOutTime }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to clock out");
      }
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["attendance"]);
      queryClient.invalidateQueries(["todayAttendance"]);
      toast.success(data.message || "Clocked out successfully!");
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to clock out");
    },
  });

  return { clockOut, isClockingOut, isClockOutError, clockOutError };
}

// Hook to mark attendance (legacy support)
export function useMarkAttendance() {
  const queryClient = useQueryClient();

  const {
    mutate: markAttendance,
    isLoading: isMarking,
    isError: isMarkError,
    error: markError,
  } = useMutation({
    mutationFn: async (status) => {
      const response = await fetch("http://localhost:5005/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to mark attendance");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["attendance"]);
      queryClient.invalidateQueries(["todayAttendance"]);
      toast.success("Attendance marked successfully!");
    },
    onError: (error) => {
      toast.error(error.message ?? "Failed to mark attendance");
    },
  });

  return { markAttendance, isMarking, isMarkError, markError };
}

// Hook to fetch today's attendance
export function useTodayAttendance() {
  const {
    data,
    isLoading: isLoadingToday,
    isError: isTodayError,
    error: todayError,
  } = useQuery({
    queryKey: ["todayAttendance"],
    queryFn: async () => {
      const response = await fetch(
        "http://localhost:5005/api/attendance/today",
        { credentials: "include" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch today's attendance");
      }
      return data;
    },
  });

  return { todayAttendance: data, isLoadingToday, isTodayError, todayError };
}

// Hook to fetch all attendance records
export function useAttendanceHistory() {
  const {
    data,
    isLoading: isLoadingHistory,
    isError: isHistoryError,
    error: historyError,
  } = useQuery({
    queryKey: ["attendance"],
    queryFn: async () => {
      const response = await fetch(
        "http://localhost:5005/api/attendance",
        { credentials: "include" }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch attendance history");
      }
      return data;
    },
  });

  return { 
    attendanceHistory: data?.attendance || [], 
    totalRecords: data?.count || 0,
    isLoadingHistory, 
    isHistoryError, 
    historyError 
  };
}