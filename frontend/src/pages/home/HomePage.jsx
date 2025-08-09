import React, { useState } from 'react';
import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, Calendar, Building2, FileText, TrendingUp, TrendingDown, MoreHorizontal, Check, X, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Button } from "../../components/ui/button";
import { useToggleLeave } from '../../hooks/useToggleLeave'; // Import the hook

const HomePage = () => {
  // Initialize the toggle leave hook
  const { toggleLeave, isLoading: isToggling } = useToggleLeave();

  // Fetch dashboard stats
  const { data: dashboardStats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5005/api/admin-dashboard/dashboard-stats", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }

      return response.json();
    },
  });

  // Fetch leave requests
  const { data: leaveRequestsData, isLoading: leaveLoading, error: leaveError } = useQuery({
    queryKey: ["leaveRequests"],
    queryFn: async () => {
      const response = await fetch("http://localhost:5005/api/admin-mangage-leave/", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch leave requests");
      }

      return response.json();
    },
  });

  // Handle approve/reject actions
  const handleToggleLeave = (leaveId) => {
    toggleLeave({ leaveId });
  };

  // Helper function to format percentage change
  const formatPercentageChange = (change) => {
    if (change === 0) return "No change";
    const isPositive = change > 0;
    return `${isPositive ? '+' : ''}${change.toFixed(1)}% from last month`;
  };

  // Helper function to get trend icon
  const getTrendIcon = (change) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper function to get status badge styling
  const getStatusBadge = (status) => {
    const statusStyles = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800'
    };
    
    return statusStyles[status] || 'bg-gray-100 text-gray-800';
  };

  if (statsLoading || leaveLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (statsError || leaveError) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <Card className="border-red-200">
          <CardContent className="p-6">
            <p className="text-red-600">
              Error loading dashboard data: {statsError?.message || leaveError?.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const leaveRequests = leaveRequestsData?.leaveRequests || [];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Employees Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Employees
            </CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalEmployees || 0}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              {getTrendIcon(dashboardStats?.totalEmployeesPercentageChange)}
              <span className={dashboardStats?.totalEmployeesPercentageChange > 0 ? "text-green-600" : 
                             dashboardStats?.totalEmployeesPercentageChange < 0 ? "text-red-600" : ""}>
                {formatPercentageChange(dashboardStats?.totalEmployeesPercentageChange || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Present Today Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Present Today
            </CardTitle>
            <UserCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.presentToday || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {dashboardStats?.attendanceRate?.toFixed(1) || 0}% attendance rate
            </div>
            <div className="text-xs text-muted-foreground">
              No change
            </div>
          </CardContent>
        </Card>

        {/* On Leave Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              On Leave
            </CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.onLeave || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {((dashboardStats?.onLeave || 0) / (dashboardStats?.totalEmployees || 1) * 100).toFixed(1)}% of workforce
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon(dashboardStats?.onLeavePercentageChange)}
              <span className={dashboardStats?.onLeavePercentageChange > 0 ? "text-green-600" : 
                             dashboardStats?.onLeavePercentageChange < 0 ? "text-red-600" : ""}>
                {formatPercentageChange(dashboardStats?.onLeavePercentageChange || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Total Departments Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Departments
            </CardTitle>
            <Building2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalDepartments || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Active departments
            </div>
            <div className="text-xs text-muted-foreground">
              No change
            </div>
          </CardContent>
        </Card>

        {/* Leave Requests Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leave Requests
            </CardTitle>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats?.totalLeaveRequests || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Total requests
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon(dashboardStats?.leaveRequestsPercentageChange)}
              <span className={dashboardStats?.leaveRequestsPercentageChange > 0 ? "text-green-600" : 
                             dashboardStats?.leaveRequestsPercentageChange < 0 ? "text-red-600" : ""}>
                {formatPercentageChange(dashboardStats?.leaveRequestsPercentageChange || 0)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Rate Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Attendance Rate
            </CardTitle>
            <UserCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardStats?.attendanceRate?.toFixed(1) || 0}%
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Today's performance
            </div>
            <div className="text-xs text-muted-foreground">
              No change
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Recent Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveRequests.map((request) => (
                  <TableRow key={request._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-semibold text-sm">
                          {request.employee.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium">{request.employee.fullName}</div>
                          <div className="text-sm text-gray-500">
                            {request.employee.email}
                          </div>
                          <div className="text-xs text-gray-400">
                            {request.employee.department?.name || 'No Department'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{request.leaveType.name}</div>
                        <div className="text-xs text-gray-500">
                          Max: {request.leaveType.maxDays} days
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(request.startDate)}</TableCell>
                    <TableCell>{formatDate(request.endDate)}</TableCell>
                    <TableCell>
                      <span className="font-medium">{request.numberOfDays}</span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(request.status)}`}
                      >
                        {request.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            disabled={isToggling}
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {request.status === 'Pending' && (
                            <>
                              <DropdownMenuItem 
                                className="text-green-600 focus:text-green-600"
                                onClick={() => handleToggleLeave(request._id)}
                                disabled={isToggling}
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600 focus:text-red-600"
                                onClick={() => handleToggleLeave(request._id)}
                                disabled={isToggling}
                              >
                                <X className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {request.status !== 'Pending' && (
                            <DropdownMenuItem 
                              className="text-blue-600 focus:text-blue-600"
                              onClick={() => handleToggleLeave(request._id)}
                              disabled={isToggling}
                            >
                              {request.status === 'Approved' ? (
                                <>
                                  <X className="h-4 w-4 mr-2" />
                                  Change to Rejected
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  Change to Approved
                                </>
                              )}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {leaveRequests.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No leave requests found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HomePage;