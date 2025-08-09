// routes/adminEmployeeRoutes.js (or create a new file like routes/dashboardRoutes.js)

import { Router } from "express";
import { User } from "../models/User.model.js";
import { Department } from "../models/Department.model.js";
import { Attendance } from "../models/Attendance.model.js";
import { LeaveRequest } from "../models/LeaveRequest.model.js"; // Import LeaveRequest model
import { adminRoute, protectRoute } from "../middleware/protectRoute.js";

const router = Router();

// ... (your existing register-employee, delete, get-all-users routes) ...

router.get("/dashboard-stats", protectRoute, adminRoute, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to beginning of today

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
    const startOfLastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of previous month

    // 1. Total Employees
    const totalEmployees = await User.countDocuments();
    const totalEmployeesLastMonth = await User.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
    });

    let totalEmployeesPercentageChange = 0;
    if (totalEmployeesLastMonth > 0) {
      totalEmployeesPercentageChange =
        ((totalEmployees - totalEmployeesLastMonth) / totalEmployeesLastMonth) *
        100;
    } else if (totalEmployees > 0) {
      totalEmployeesPercentageChange = 100; // All new employees this month
    }

    // 2. Present Today (Attendance)
    const presentTodayCount = await Attendance.countDocuments({
      date: { $gte: startOfToday, $lt: endOfToday },
      status: { $in: ["Present", "Late"] },
    });

    // For attendance rate, we consider all active employees not on leave as "expected"
    const totalExpectedToday = await User.countDocuments({
      employeeStatus: "Active", // Assuming only active employees are expected to be present
    });
    // You might want to refine this to exclude employees whose leave *starts* today.
    // For now, `employeeStatus: "Active"` means they are not on official extended leave.

    let attendanceRate = 0;
    if (totalExpectedToday > 0) {
      attendanceRate = (presentTodayCount / totalExpectedToday) * 100;
    }

    // 3. On Leave
    const onLeaveCount = await User.countDocuments({
      employeeStatus: "On Leave",
    });

    // For 'On Leave last month', we'll count active leave requests whose range overlaps with last month
    // This is a more robust way than just checking user's employeeStatus created last month.
    const activeLeavesLastMonth = await LeaveRequest.countDocuments({
      status: "Approved",
      startDate: { $lte: endOfLastMonth }, // Leave started before or during last month
      endDate: { $gte: startOfLastMonth }, // Leave ended after or during last month
    });

    let onLeavePercentageChange = 0;
    if (activeLeavesLastMonth > 0) {
      onLeavePercentageChange =
        ((onLeaveCount - activeLeavesLastMonth) / activeLeavesLastMonth) * 100;
    } else if (onLeaveCount > 0) {
      onLeavePercentageChange = 100; // All on leave are new this month
    }

    // 4. Number of Departments
    const totalDepartments = await Department.countDocuments();

    // 5. Number of Leave Requests
    const totalLeaveRequests = await LeaveRequest.countDocuments();
    const totalLeaveRequestsLastMonth = await LeaveRequest.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth },
    });

    let leaveRequestsPercentageChange = 0;
    if (totalLeaveRequestsLastMonth > 0) {
      leaveRequestsPercentageChange =
        ((totalLeaveRequests - totalLeaveRequestsLastMonth) /
          totalLeaveRequestsLastMonth) *
        100;
    } else if (totalLeaveRequests > 0) {
      leaveRequestsPercentageChange = 100;
    }

    res.status(200).json({
      totalEmployees,
      totalEmployeesPercentageChange,
      presentToday: presentTodayCount,
      attendanceRate,
      onLeave: onLeaveCount,
      onLeavePercentageChange,
      totalDepartments,
      totalLeaveRequests,
      leaveRequestsPercentageChange,
    });
  } catch (error) {
    console.error(
      "An Error occurred in the dashboard-stats route:",
      error.message
    );
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

export { router as adminDashboardRoute };
