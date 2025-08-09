// pages/notifications/NotificationPage.jsx
import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Loader2,
  Bell,
  AlertCircle,
  Mail,
  Clock,
  CheckCircle2,
  Send,
  Filter,
  Check,
} from "lucide-react";
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useSendNotification,
} from "../../hooks/useNotifications";
import { useAuth } from "../../hooks/useAuth";

// Send Notification Dialog Component (Admin only)
const SendNotificationDialog = ({ isOpen, onOpenChange }) => {
  const [formData, setFormData] = useState({
    recipients: "all",
    title: "",
    message: "",
    type: "system",
  });

  const { mutate: sendNotification, isLoading } = useSendNotification();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      return;
    }

    sendNotification(formData, {
      onSuccess: () => {
        setFormData({
          recipients: "all",
          title: "",
          message: "",
          type: "system",
        });
        onOpenChange(false);
      },
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Notification</DialogTitle>
          <DialogDescription>
            Send a notification to users in your organization.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipients">Recipients</Label>
            <Select 
              value={formData.recipients} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, recipients: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select recipients" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {/* You can add specific user selection here in the future */}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Notification Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="alert">Alert</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Notification title..."
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Your notification message..."
              value={formData.message}
              onChange={handleInputChange}
              rows={4}
              required
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Notification
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Notification Card Component
const NotificationCard = ({ notification }) => {
  const { mutate: markAsRead, isLoading } = useMarkNotificationRead();

  const handleMarkAsRead = () => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "system":
        return <Bell className="h-5 w-5 text-blue-500" />;
      case "announcement":
        return <Mail className="h-5 w-5 text-green-500" />;
      case "reminder":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "alert":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "system":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "announcement":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "reminder":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "alert":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <Card 
      className={`transition-all hover:shadow-md cursor-pointer ${
        !notification.isRead ? "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10" : ""
      }`}
      onClick={handleMarkAsRead}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getNotificationIcon(notification.type)}
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold">
                {notification.title}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                From: {notification.sender?.fullName || "System"}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge className={`text-xs ${getTypeColor(notification.type)}`}>
              {notification.type}
            </Badge>
            {!notification.isRead && (
              <Badge variant="secondary" className="text-xs">
                New
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-foreground mb-3">
          {notification.message}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {new Date(notification.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          
          {notification.isRead && (
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Read</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Skeleton Card Component for Loading State
const SkeletonNotificationCard = () => {
  return (
    <Card className="animate-pulse">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 bg-gray-200 rounded dark:bg-gray-700"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 dark:bg-gray-700"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 dark:bg-gray-700"></div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="h-5 bg-gray-200 rounded w-16 dark:bg-gray-700"></div>
            <div className="h-4 bg-gray-200 rounded w-8 dark:bg-gray-700"></div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-200 rounded w-full dark:bg-gray-700"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5 dark:bg-gray-700"></div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="h-3 bg-gray-200 rounded w-32 dark:bg-gray-700"></div>
          <div className="h-3 bg-gray-200 rounded w-12 dark:bg-gray-700"></div>
        </div>
      </CardContent>
    </Card>
  );
};

const NotificationPage = () => {
  const {
    data: notificationsData,
    isLoading,
    isError,
    error,
  } = useNotifications();
  
  const { mutate: markAllAsRead, isLoading: isMarkingAllRead } = useMarkAllNotificationsRead();
  const { data: authUser } = useAuth();
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState("all");

  const isAdmin = authUser?.role === "admin";

  const notifications = notificationsData?.notifications || [];
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Filter notifications based on selected type
  const filteredNotifications = filterType === "all" 
    ? notifications 
    : notifications.filter(n => n.type === filterType);

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <div className="mt-2 flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div className="h-5 bg-gray-200 rounded w-48 animate-pulse dark:bg-gray-700"></div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 bg-gray-200 rounded w-32 animate-pulse dark:bg-gray-700"></div>
            <div className="h-9 bg-gray-200 rounded w-40 animate-pulse dark:bg-gray-700"></div>
          </div>
        </div>

        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <SkeletonNotificationCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container max-w-4xl py-8 mx-auto">
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <span>{error?.message || "Failed to load notifications"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <span>
              {notifications.length} total notification{notifications.length !== 1 ? 's' : ''}
              {unreadCount > 0 && `, ${unreadCount} unread`}
            </span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          {/* Filter Dropdown */}
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="system">System</SelectItem>
              <SelectItem value="announcement">Announcements</SelectItem>
              <SelectItem value="reminder">Reminders</SelectItem>
              <SelectItem value="alert">Alerts</SelectItem>
            </SelectContent>
          </Select>

          {/* Mark All Read Button */}
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAllRead}
              className="flex items-center gap-2"
            >
              {isMarkingAllRead ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Mark All Read
            </Button>
          )}

          {/* Send Notification Button (Admin only) */}
          {isAdmin && (
            <Button 
              onClick={() => setIsSendDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send Notification
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification._id}
              notification={notification}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <Bell className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="text-gray-500 mb-2">
              {filterType === "all" 
                ? "No notifications yet" 
                : `No ${filterType} notifications`}
            </div>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              {filterType === "all" 
                ? "You'll see your notifications here when you receive them."
                : "Try selecting a different filter to see other notifications."}
            </p>
          </div>
        )}
      </div>

      {/* Send Notification Dialog */}
      {isAdmin && (
        <SendNotificationDialog 
          isOpen={isSendDialogOpen}
          onOpenChange={setIsSendDialogOpen}
        />
      )}
    </div>
  );
};

export default NotificationPage;