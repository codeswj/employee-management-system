import { useTheme } from "../../components/theme-provider";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";
import { useLogout } from "../../hooks/useLogout";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";

// Import icons from Lucide React instead of various sources
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  DollarSign,
  Settings,
  LogOut,
  DoorOpen,
  Bell,
  HousePlug,
  User, // Added for Profile
  LineChart, // Added for Employee Dashboard (you might want a different icon)
} from "lucide-react";

// Import the notification hook
import { useUnreadNotificationCount } from "../../hooks/useNotifications";

const Sidebar = () => {
  const { setTheme, theme } = useTheme();
  const { logout, isLoading } = useLogout();
  const location = useLocation();
  const unreadCount = useUnreadNotificationCount();

  // Get auth user data
  const { data: authUser } = useQuery({
    queryKey: ["authUser"],
  });

  function handleLogout(event) {
    event.preventDefault();
    console.log("Logout button clicked");
    logout();
  }

  // Define all possible navigation items
  const allNavItems = [
     {
       icon: LayoutDashboard, // You might want a different icon for this
       label: "My Dashboard",
       path: "/employeedash",
       // If this dashboard is ONLY for employees, you could add:
       // showForRoles: ["employee"],
     },
    {
      icon: LayoutDashboard,
      label: "Admin Dashboard",
      path: "/",
      exact: true,
      // Add a property to control visibility based on role
      // For example, 'hideForRoles'
      hideForRoles: ["employee"], // Hide this item if the user's role is 'employee'
    },
    {
      icon: Users,
      label: "Employees",
      path: "/employees",
    },
    {
      icon: CalendarCheck,
      label: "Attendance",
      path: "/attendance",
    },
    {
      icon: DoorOpen,
      label: "Leave",
      path: "/leave",
    },
    {
      icon: HousePlug,
      label: "Departments",
      path: "/departments",
    },
    {
      icon: DollarSign,
      label: "Payroll processing",
      path: "/payroll",
    },
    {
      icon: Bell,
      label: "Notifications",
      path: "/notifications",
      badge: unreadCount > 0 ? unreadCount : null,
    },
    
  ];

  // Filter the navigation items based on the user's role
  const navItems = allNavItems.filter((item) => {
    // If authUser data is still loading or not available,
    // or if the item doesn't specify roles to hide for, show it by default.
    if (!authUser || !item.hideForRoles) {
      return true;
    }

    // Convert authUser.role to lowercase for case-insensitive comparison
    const userRole = authUser.role.toLowerCase();

    // If the item's 'hideForRoles' array includes the user's role, then hide it.
    // Otherwise, show it.
    return !item.hideForRoles.includes(userRole);
  });

  // Function to check if a nav item is active
  const isActive = (item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="bg-background w-64 h-screen flex-shrink-0 border-r border-border">
      <div className="flex flex-col h-full p-4">
        {/* Logo/Header */}
        <div className="mb-8">
          <Link to="/" className="flex items-center">
            <h1 className="text-xl font-bold text-primary">
              AEMS {authUser?.role === "admin" ? "Admin": "Employee"}
            </h1>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const active = isActive(item);
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium relative",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent text-foreground hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="flex-1">{item.label}</span>

                    {/* Notification Badge */}
                    {item.badge && (
                      <Badge
                        variant={active ? "secondary" : "destructive"}
                        className="ml-auto text-xs min-w-[1.25rem] h-5 flex items-center justify-center p-0"
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </Badge>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User profile and theme toggle */}
        <div className="mt-auto space-y-3">
          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full justify-start"
          >
            {theme === "dark" ? (
              <SunIcon className="h-4 w-4 mr-2" />
            ) : (
              <MoonIcon className="h-4 w-4 mr-2" />
            )}
            {theme === "dark" ? "Light" : "Dark"} Mode
          </Button>

          {/* User Profile */}
          {authUser && (
            <Link
              to="/profile"
              className="flex items-center gap-2 p-2 rounded-md hover:bg-accent"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={authUser?.profileImg || "/avatar-placeholder.png"}
                  alt={authUser?.fullName}
                />
                <AvatarFallback>
                  {authUser?.fullName?.charAt(0).toUpperCase() || "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {authUser?.fullName || "Admin"}
                </span>
                <span className="text-xs text-muted-foreground capitalize">
                  {authUser?.role || "User"}
                </span>
              </div>
            </Link>
          )}

          {/* Logout Button */}
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
            onClick={handleLogout}
            disabled={isLoading}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {isLoading ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
