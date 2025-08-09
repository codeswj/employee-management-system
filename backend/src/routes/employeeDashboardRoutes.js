// routes/employeeDashboardRoutes.js

import { Router } from "express";
import { User } from "../models/User.model.js";
import { Department } from "../models/Department.model.js";
import { Attendance } from "../models/Attendance.model.js";
import { LeaveRequest } from "../models/LeaveRequest.model.js";
import { LeaveType } from "../models/LeaveType.model.js";
import { Payroll } from "../models/Payroll.model.js";
import { Notification } from "../models/Notifications.model.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = Router();

router.get("/dashboard-stats", protectRoute, async (req, res) => {
  try {
    const employeeId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfThisMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const startOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // 1. Today's Attendance Status
    const todayAttendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: startOfToday, $lt: endOfToday },
    });

    const attendanceStatus = {
      hasClocked: !!todayAttendance,
      status: todayAttendance?.status || "Not Recorded",
      clockIn: todayAttendance?.clockIn || null,
      clockOut: todayAttendance?.clockOut || null,
      totalHours: todayAttendance?.totalHours || 0,
      isClockOutPending: todayAttendance?.isClockOutPending || false,
    };

    // 2. This Month's Attendance Summary
    const monthlyAttendance = await Attendance.find({
      employee: employeeId,
      date: { $gte: startOfThisMonth, $lte: endOfThisMonth },
    });

    const monthlyStats = {
      totalDays: monthlyAttendance.length,
      presentDays: monthlyAttendance.filter(a => a.status === "Present").length,
      lateDays: monthlyAttendance.filter(a => a.status === "Late").length,
      absentDays: monthlyAttendance.filter(a => a.status === "Absent").length,
      totalHours: monthlyAttendance.reduce((sum, a) => sum + (a.totalHours || 0), 0),
      regularHours: monthlyAttendance.reduce((sum, a) => sum + (a.regularHours || 0), 0),
      overtimeHours: monthlyAttendance.reduce((sum, a) => sum + (a.overtimeHours || 0), 0),
    };

    // Calculate attendance rate for this month
    const workingDaysThisMonth = Math.min(today.getDate(), endOfThisMonth.getDate());
    const attendanceRate = workingDaysThisMonth > 0 
      ? ((monthlyStats.presentDays + monthlyStats.lateDays) / workingDaysThisMonth) * 100 
      : 0;

    // 3. Leave Requests Summary
    const leaveRequests = await LeaveRequest.find({
      employee: employeeId,
    }).populate('leaveType', 'name');

    const leaveStats = {
      totalRequests: leaveRequests.length,
      pendingRequests: leaveRequests.filter(lr => lr.status === "Pending").length,
      approvedRequests: leaveRequests.filter(lr => lr.status === "Approved").length,
      rejectedRequests: leaveRequests.filter(lr => lr.status === "Rejected").length,
      thisMonthRequests: leaveRequests.filter(lr => 
        lr.createdAt >= startOfThisMonth && lr.createdAt <= endOfThisMonth
      ).length,
    };

    // 4. Current Active Leave (if any)
    const currentDate = new Date();
    const activeLeave = await LeaveRequest.findOne({
      employee: employeeId,
      status: "Approved",
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate },
    }).populate('leaveType', 'name');

    // 5. Leave Balance (get available leave types and calculate remaining days)
    const leaveTypes = await LeaveType.find({});
    const leaveBalances = [];

    for (const leaveType of leaveTypes) {
      const usedDays = leaveRequests
        .filter(lr => 
          lr.leaveType.toString() === leaveType._id.toString() && 
          lr.status === "Approved" &&
          lr.createdAt.getFullYear() === today.getFullYear()
        )
        .reduce((sum, lr) => sum + lr.numberOfDays, 0);

      leaveBalances.push({
        leaveType: leaveType.name,
        maxDays: leaveType.maxDays,
        usedDays,
        remainingDays: leaveType.maxDays - usedDays,
      });
    }

    // 6. Recent Payroll Information
    const latestPayroll = await Payroll.findOne({
      employee: employeeId,
    }).sort({ 'payPeriod.year': -1, 'payPeriod.month': -1 });

    const payrollInfo = latestPayroll ? {
      month: latestPayroll.payPeriod.month,
      year: latestPayroll.payPeriod.year,
      netPay: latestPayroll.netPay,
      grossPay: latestPayroll.salaryBreakdown.grossPay,
      totalDeductions: latestPayroll.deductions.totalDeductions,
      status: latestPayroll.status,
      totalHoursWorked: latestPayroll.attendanceSummary.totalHoursWorked,
    } : null;

    // 7. Unread Notifications Count
    const unreadNotifications = await Notification.countDocuments({
      recipient: employeeId,
      isRead: false,
    });

    // 8. Recent Notifications (last 5)
    const recentNotifications = await Notification.find({
      recipient: employeeId,
    })
    .populate('sender', 'fullName')
    .sort({ createdAt: -1 })
    .limit(5);

    // 9. Employee Profile Summary
    const employee = await User.findById(employeeId)
      .populate('department', 'name')
      .select('fullName email position department basicSalary employeeStatus');

    // 10. Performance Metrics (compared to last month)
    const lastMonthAttendance = await Attendance.find({
      employee: employeeId,
      date: { $gte: startOfLastMonth, $lte: endOfLastMonth },
    });

    const lastMonthStats = {
      totalHours: lastMonthAttendance.reduce((sum, a) => sum + (a.totalHours || 0), 0),
      presentDays: lastMonthAttendance.filter(a => a.status === "Present").length,
    };

    const performanceComparison = {
      hoursChange: monthlyStats.totalHours - lastMonthStats.totalHours,
      attendanceChange: monthlyStats.presentDays - lastMonthStats.presentDays,
    };

    // 11. Upcoming Leave Requests
    const upcomingLeaves = await LeaveRequest.find({
      employee: employeeId,
      status: "Approved",
      startDate: { $gt: currentDate },
    })
    .populate('leaveType', 'name')
    .sort({ startDate: 1 })
    .limit(3);

    res.status(200).json({
      // Personal Information
      employee: {
        name: employee.fullName,
        email: employee.email,
        position: employee.position,
        department: employee.department.name,
        basicSalary: employee.basicSalary,
        employeeStatus: employee.employeeStatus,
      },

      // Today's Status
      todayAttendance: attendanceStatus,

      // Monthly Performance
      monthlyAttendance: {
        ...monthlyStats,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        workingDaysThisMonth,
      },

      // Leave Information
      leaveStats,
      activeLeave: activeLeave ? {
        leaveType: activeLeave.leaveType.name,
        startDate: activeLeave.startDate,
        endDate: activeLeave.endDate,
        numberOfDays: activeLeave.numberOfDays,
      } : null,
      leaveBalances,
      upcomingLeaves: upcomingLeaves.map(leave => ({
        leaveType: leave.leaveType.name,
        startDate: leave.startDate,
        endDate: leave.endDate,
        numberOfDays: leave.numberOfDays,
      })),

      // Payroll Information
      latestPayroll: payrollInfo,

      // Notifications
      unreadNotifications,
      recentNotifications: recentNotifications.map(notification => ({
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.isRead,
        sender: notification.sender?.fullName || 'System',
        createdAt: notification.createdAt,
      })),

      // Performance Comparison
      performanceComparison,

      // Quick Stats for Dashboard Cards
      quickStats: {
        totalWorkingDays: workingDaysThisMonth,
        daysWorked: monthlyStats.presentDays + monthlyStats.lateDays,
        hoursThisMonth: Math.round(monthlyStats.totalHours * 100) / 100,
        overtimeHours: Math.round(monthlyStats.overtimeHours * 100) / 100,
        pendingLeaveRequests: leaveStats.pendingRequests,
        unreadNotifications,
      },
    });

  } catch (error) {
    console.error(
      "An Error occurred in the employee dashboard-stats route:",
      error.message
    );
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
});

// Additional route to get employee's recent attendance history
router.get("/recent-attendance", protectRoute, async (req, res) => {
  try {
    const employeeId = req.user._id;
    const limit = parseInt(req.query.limit) || 10;

    const recentAttendance = await Attendance.find({
      employee: employeeId,
    })
    .sort({ date: -1 })
    .limit(limit);

    res.status(200).json({
      attendance: recentAttendance.map(record => ({
        date: record.date,
        status: record.status,
        clockIn: record.clockIn,
        clockOut: record.clockOut,
        totalHours: record.totalHours,
        overtimeHours: record.overtimeHours,
      })),
    });

  } catch (error) {
    console.error("Error fetching recent attendance:", error.message);
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
});

// Route to get employee's leave request history
router.get("/leave-history", protectRoute, async (req, res) => {
  try {
    const employeeId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const leaveRequests = await LeaveRequest.find({
      employee: employeeId,
    })
    .populate('leaveType', 'name')
    .populate('approver', 'fullName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const totalRequests = await LeaveRequest.countDocuments({
      employee: employeeId,
    });

    res.status(200).json({
      leaveRequests: leaveRequests.map(request => ({
        id: request._id,
        leaveType: request.leaveType.name,
        startDate: request.startDate,
        endDate: request.endDate,
        numberOfDays: request.numberOfDays,
        status: request.status,
        approver: request.approver?.fullName || null,
        approvedDate: request.approvedDate,
        createdAt: request.createdAt,
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalRequests / limit),
        totalRequests,
        hasNext: page < Math.ceil(totalRequests / limit),
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error("Error fetching leave history:", error.message);
    res.status(500).json({ 
      message: "Internal server error", 
      error: error.message 
    });
  }
});

export { router as employeeDashboardRoute };