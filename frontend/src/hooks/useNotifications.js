// hooks/useNotifications.js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

// Custom hook for fetching notifications
export const useNotifications = () => {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5005/api/notifications", {
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch notifications");
      }

      const data = await response.json();
      return data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });
};

// Hook for marking a single notification as read
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId) => {
      const response = await fetch(
        `http://localhost:5005/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to mark notification as read");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries(["notifications"]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to mark notification as read");
    },
  });
};

// Hook for marking all notifications as read
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(
        "http://localhost:5005/api/notifications/mark-all-read",
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to mark all notifications as read");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries(["notifications"]);
      toast.success(`${data.modifiedCount} notifications marked as read`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to mark all notifications as read");
    },
  });
};

// Hook for sending notifications (admin only)
export const useSendNotification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationData) => {
      const response = await fetch(
        "http://localhost:5005/api/notifications/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(notificationData),
          credentials: "include",
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send notification");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries(["notifications"]);
      toast.success(`Notification sent to ${data.recipientCount} users`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send notification");
    },
  });
};

// Hook to get unread notification count
export const useUnreadNotificationCount = () => {
  const { data: notificationsData } = useNotifications();
  
  const unreadCount = notificationsData?.notifications?.filter(
    notification => !notification.isRead
  ).length || 0;

  return unreadCount;
};