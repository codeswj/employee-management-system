import React from 'react';
import { 
  Clock, 
  Calendar, 
  User, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  XCircle, 
  Bell,
  DollarSign,
  BarChart3,
  AlertCircle,
  CalendarDays,
  Timer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { useEmployeeDashboardStats } from "../../hooks/useEmployeeDashboard";

const EmployeeDashboard = () => {
  // Fetch employee dashboard stats using custom hook
  const { data: dashboardData, isLoading, error } = useEmployeeDashboardStats();

  // Helper functions
  const formatTime = (timeString) => {
    if (!timeString) return 'Not recorded';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatHours = (hours) => {
    return hours ? `${hours.toFixed(1)}h` : '0h';
  };

  const getTrendIcon = (change) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'Present': 'text-green-600 bg-green-50',
      'Late': 'text-yellow-600 bg-yellow-50',
      'Absent': 'text-red-600 bg-red-50',
      'Not Recorded': 'text-gray-600 bg-gray-50'
    };
    return statusColors[status] || 'text-gray-600 bg-gray-50';
  };

  const getLeaveStatusColor = (status) => {
    const statusColors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Employee Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
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

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Employee Dashboard</h1>
        <Card className="border-red-200">
          <CardContent className="p-6">
            <p className="text-red-600">
              Error loading dashboard data: {error.message}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const {
    employee,
    todayAttendance,
    monthlyAttendance,
    leaveStats,
    activeLeave,
    leaveBalances,
    upcomingLeaves,
    latestPayroll,
    unreadNotifications,
    recentNotifications,
    performanceComparison,
    quickStats
  } = dashboardData;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Welcome back, {employee?.name}</h1>
        <p className="text-muted-foreground">
          {employee?.position} • {employee?.department}
        </p>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Today's Status */}
        <Card className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Status
            </CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold px-2 py-1 rounded-md ${getStatusColor(todayAttendance?.status)}`}>
              {todayAttendance?.status}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              In: {formatTime(todayAttendance?.clockIn)} | Out: {formatTime(todayAttendance?.clockOut)}
            </div>
            <div className="text-xs text-muted-foreground">
              Hours: {formatHours(todayAttendance?.totalHours)}
            </div>
          </CardContent>
        </Card>

        {/* This Month's Hours */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hours This Month
            </CardTitle>
            <Timer className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHours(quickStats?.hoursThisMonth)}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Regular: {formatHours(monthlyAttendance?.regularHours)} | 
              OT: {formatHours(quickStats?.overtimeHours)}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon(performanceComparison?.hoursChange)}
              <span className={performanceComparison?.hoursChange > 0 ? "text-green-600" : 
                             performanceComparison?.hoursChange < 0 ? "text-red-600" : ""}>
                {performanceComparison?.hoursChange > 0 ? '+' : ''}{performanceComparison?.hoursChange?.toFixed(1)}h from last month
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Attendance Rate
            </CardTitle>
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyAttendance?.attendanceRate?.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              {quickStats?.daysWorked}/{quickStats?.totalWorkingDays} days worked
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {getTrendIcon(performanceComparison?.attendanceChange)}
              <span className={performanceComparison?.attendanceChange > 0 ? "text-green-600" : 
                             performanceComparison?.attendanceChange < 0 ? "text-red-600" : ""}>
                {performanceComparison?.attendanceChange > 0 ? '+' : ''}{performanceComparison?.attendanceChange} days from last month
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Pending Leave Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Requests
            </CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quickStats?.pendingLeaveRequests}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Leave requests pending
            </div>
            <div className="text-xs text-muted-foreground">
              Total: {leaveStats?.totalRequests} requests
            </div>
          </CardContent>
        </Card>

        {/* Latest Payroll */}
        {latestPayroll && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Latest Payroll
              </CardTitle>
              <DollarSign className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${latestPayroll.netPay?.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {latestPayroll.month}/{latestPayroll.year}
              </div>
              <div className="text-xs text-muted-foreground">
                Status: {latestPayroll.status}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Notifications
            </CardTitle>
            <Bell className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadNotifications}</div>
            <div className="text-xs text-muted-foreground mt-1">
              Unread notifications
            </div>
            <div className="text-xs text-muted-foreground">
              {recentNotifications?.length} recent messages
            </div>
          </CardContent>
        </Card>

        {/* Active Leave */}
        {activeLeave && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">
                Currently On Leave
              </CardTitle>
              <CalendarDays className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-800">
                {activeLeave.leaveType}
              </div>
              <div className="text-xs text-green-700 mt-1">
                {formatDate(activeLeave.startDate)} - {formatDate(activeLeave.endDate)}
              </div>
              <div className="text-xs text-green-700">
                {activeLeave.numberOfDays} days
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Performance Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Summary
            </CardTitle>
            <User className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Present:</span>
                <span className="font-medium text-green-600">{monthlyAttendance?.presentDays}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Late:</span>
                <span className="font-medium text-yellow-600">{monthlyAttendance?.lateDays}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Absent:</span>
                <span className="font-medium text-red-600">{monthlyAttendance?.absentDays}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section - Tables and Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Balance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Leave Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaveBalances?.map((balance, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <div className="font-medium">{balance.leaveType}</div>
                    <div className="text-sm text-muted-foreground">
                      Used: {balance.usedDays}/{balance.maxDays} days
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {balance.remainingDays}
                    </div>
                    <div className="text-xs text-muted-foreground">remaining</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentNotifications?.length > 0 ? (
                recentNotifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`p-3 rounded-lg border ${!notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{notification.title}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {notification.message}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          From: {notification.sender} • {formatDate(notification.createdAt)}
                        </div>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No recent notifications
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Leaves */}
      {upcomingLeaves?.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Upcoming Approved Leaves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingLeaves.map((leave, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{leave.leaveType}</TableCell>
                      <TableCell>{formatDate(leave.startDate)}</TableCell>
                      <TableCell>{formatDate(leave.endDate)}</TableCell>
                      <TableCell>{leave.numberOfDays}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Approved
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EmployeeDashboard;