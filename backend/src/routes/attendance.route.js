import { Router } from "express";
import { adminRoute, protectRoute } from "../middleware/protectRoute.js";
import { Attendance } from "../models/Attendance.model.js";
import { Notification } from "../models/Notifications.model.js";
import converter from 'json-2-csv';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

const router = Router();

router.use(protectRoute);

// Clock in
router.post("/clock-in", async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { status, clockInTime } = req.body;

    if (!["Present", "Late", "Absent"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // For absent status, we don't need clockInTime
    if (status !== "Absent" && !clockInTime) {
      return res.status(400).json({ message: "Clock in time is required for Present/Late status" });
    }

    // normalize today to midnight UTC
    const today = new Date();
    const dateOnly = new Date(today.toDateString());

    // Check if already clocked in today
    const existingRecord = await Attendance.findOne({ 
      employee: employeeId, 
      date: dateOnly 
    });

    if (existingRecord) {
      return res.status(409).json({ message: "Already clocked in today" });
    }

    const attendanceData = {
      employee: employeeId,
      date: dateOnly,
      status,
    };

    // Add clockIn time if not absent
    if (status !== "Absent") {
      attendanceData.clockIn = new Date(clockInTime);
      attendanceData.isClockOutPending = true;
    }

    const attendance = new Attendance(attendanceData);
    await attendance.save();

    // Create notification
    await Notification.create({
      recipient: employeeId,
      sender: null,
      title: "Clock In Recorded",
      message: `You have clocked in as "${status}" at ${clockInTime ? new Date(clockInTime).toLocaleTimeString() : 'N/A'}.`,
      type: "attendance",
    });

    res.status(201).json({
      message: `Clocked in as ${status}`,
      attendance,
    });
  } catch (error) {
    console.error("Error clocking in:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Clock out
router.post("/clock-out", async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { clockOutTime } = req.body;

    if (!clockOutTime) {
      return res.status(400).json({ message: "Clock out time is required" });
    }

    const today = new Date();
    const dateOnly = new Date(today.toDateString());

    const attendance = await Attendance.findOne({ 
      employee: employeeId, 
      date: dateOnly 
    });

    if (!attendance) {
      return res.status(404).json({ message: "No clock-in record found for today" });
    }

    if (attendance.status === "Absent") {
      return res.status(400).json({ message: "Cannot clock out when marked as absent" });
    }

    if (attendance.clockOut) {
      return res.status(409).json({ message: "Already clocked out today" });
    }

    attendance.clockOut = new Date(clockOutTime);
    await attendance.save();

    // Create notification
    await Notification.create({
      recipient: employeeId,
      sender: null,
      title: "Clock Out Recorded",
      message: `You have clocked out at ${new Date(clockOutTime).toLocaleTimeString()}. Total hours: ${attendance.totalHours}h (Regular: ${attendance.regularHours}h, Overtime: ${attendance.overtimeHours}h).`,
      type: "attendance",
    });

    res.status(200).json({
      message: "Clocked out successfully",
      attendance,
    });
  } catch (error) {
    console.error("Error clocking out:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Legacy route for backward compatibility
router.post("/", async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { status, clockInTime } = req.body;

    if (!["Present", "Late", "Absent"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const today = new Date();
    const dateOnly = new Date(today.toDateString());

    const updated = await Attendance.findOneAndUpdate(
      { employee: employeeId, date: dateOnly },
      { 
        $set: { 
          status,
          ...(status !== "Absent" && clockInTime ? { clockIn: new Date(clockInTime) } : {})
        } 
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const notification = await Notification.create({
      recipient: employeeId,
      sender: null,
      title: "Attendance Recorded",
      message: `Your attendance for ${dateOnly.toDateString()} has been marked as "${status}".`,
      type: "attendance",
    });

    res.status(200).json({
      message: `Attendance marked as ${status}`,
      attendance: updated,
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    if (error.code === 11000) {
      return res.status(409).json({ message: "Attendance already recorded" });
    }
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get today's attendance
router.get("/today", async (req, res) => {
  try {
    const employeeId = req.user._id;
    const today = new Date();
    const dateOnly = new Date(today.toDateString());

    const attendance = await Attendance.findOne({
      employee: employeeId,
      date: dateOnly
    });

    res.status(200).json(attendance || {});
  } catch (error) {
    console.error("Error fetching today's attendance:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all attendance records for current user
router.get("/", async (req, res) => {
  try {
    const employeeId = req.user._id;
    const records = await Attendance.find({ employee: employeeId })
      .sort({ date: -1 })
      .select("date status clockIn clockOut totalHours regularHours overtimeHours isClockOutPending -_id");

    res.status(200).json({
      count: records.length,
      attendance: records,
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Admin routes
router.use(adminRoute);

// GET /api/attendance/admin-attendance
router.get("/admin-attendance", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const attendanceRecords = await Attendance.find(filter)
      .populate("employee", "fullName email")
      .sort({ date: -1 });

    res.status(200).json({ attendanceRecords });
  } catch (error) {
    console.error("Error fetching attendance records:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Export attendance
router.get('/attendance/export', async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate('employee', 'fullName email')
      .sort({ date: -1 })
      .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');

    worksheet.columns = [
      { header: 'Employee', key: 'employee', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Clock In', key: 'clockIn', width: 20 },
      { header: 'Clock Out', key: 'clockOut', width: 20 },
      { header: 'Total Hours', key: 'totalHours', width: 12 },
      { header: 'Regular Hours', key: 'regularHours', width: 15 },
      { header: 'Overtime Hours', key: 'overtimeHours', width: 15 },
    ];
    worksheet.getRow(1).font = { bold: true };

    const jsonResponse = [];
    records.forEach(r => {
      const row = {
        employee: `${r.employee.fullName}`,
        email: r.employee.email,
        date: r.date.toISOString().split('T')[0],
        status: r.status,
        clockIn: r.clockIn ? r.clockIn.toLocaleTimeString() : 'N/A',
        clockOut: r.clockOut ? r.clockOut.toLocaleTimeString() : 'N/A',
        totalHours: r.totalHours || 0,
        regularHours: r.regularHours || 0,
        overtimeHours: r.overtimeHours || 0
      };
      worksheet.addRow(row);
      jsonResponse.push(row);
    });

    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

    const filename = `attendance-${new Date().toISOString().split('T')[0]}.xlsx`;
    const filepath = path.join(exportDir, filename);
    await workbook.xlsx.writeFile(filepath);

    res.status(200).json({
      message: 'Attendance exported successfully',
      file: `/exports/${filename}`,
      records: jsonResponse
    });
  } catch (err) {
    console.error('Excel export failed:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

export { router as attendanceRoutes };