import { Router } from "express";
import { adminRoute, protectRoute } from "../middleware/protectRoute.js";
import { Payroll } from "../models/Payroll.model.js";
import { User } from "../models/User.model.js";
import { Attendance } from "../models/Attendance.model.js";
import { Notification } from "../models/Notifications.model.js";
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';

const router = Router();
router.use(protectRoute);

// EMPLOYEE ROUTES - Real-time salary calculation

// Get current month salary projection based on hours worked so far
router.get("/current-month-projection", async (req, res) => {
  try {
    const employeeId = req.user._id;
    const employee = await User.findById(employeeId);
    
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Get current month's start and end dates
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);

    // Get attendance records for current month
    const attendanceRecords = await Attendance.find({
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate }
    });

    // Calculate hours worked so far
    const hoursWorked = attendanceRecords.reduce((total, record) => {
      return {
        regularHours: total.regularHours + (record.regularHours || 0),
        overtimeHours: total.overtimeHours + (record.overtimeHours || 0),
        totalHours: total.totalHours + (record.totalHours || 0)
      };
    }, { regularHours: 0, overtimeHours: 0, totalHours: 0 });

    // Calculate rates
    const hourlyRate = employee.basicSalary / 160; // Based on 160 hours per month
    const overtimeRate = hourlyRate * 1.5;

    // Calculate pay projections
    const regularPay = Math.min(hoursWorked.regularHours, 160) * hourlyRate;
    const overtimePay = Math.min(hoursWorked.overtimeHours, 40) * overtimeRate;
    const grossPay = regularPay + overtimePay;

    // Calculate deductions (simplified)
    const paye = calculatePAYE(grossPay);
    const nhif = calculateNHIF(grossPay);
    const nssf = Math.min(grossPay * 0.06, 1080);
    const totalDeductions = paye + nhif + nssf;
    const netPay = grossPay - totalDeductions;

    // Calculate what they would earn if they complete full month (160 hours)
    const remainingRegularHours = Math.max(0, 160 - hoursWorked.regularHours);
    const projectedFullMonthRegularPay = 160 * hourlyRate;
    const projectedFullMonthGrossPay = projectedFullMonthRegularPay + overtimePay;
    const projectedFullMonthDeductions = calculatePAYE(projectedFullMonthGrossPay) + 
                                        calculateNHIF(projectedFullMonthGrossPay) + 
                                        Math.min(projectedFullMonthGrossPay * 0.06, 1080);
    const projectedFullMonthNetPay = projectedFullMonthGrossPay - projectedFullMonthDeductions;

    const daysInMonth = endDate.getDate();
    const daysWorked = attendanceRecords.filter(r => r.status !== "Absent").length;
    
    res.status(200).json({
      currentMonth: `${currentMonth}/${currentYear}`,
      employee: {
        name: employee.fullName,
        basicSalary: employee.basicSalary,
        hourlyRate: Math.round(hourlyRate * 100) / 100,
        overtimeRate: Math.round(overtimeRate * 100) / 100
      },
      workingSummary: {
        daysInMonth,
        daysWorked,
        hoursWorked: hoursWorked.totalHours,
        regularHours: hoursWorked.regularHours,
        overtimeHours: hoursWorked.overtimeHours,
        remainingRegularHours
      },
      currentEarnings: {
        regularPay: Math.round(regularPay * 100) / 100,
        overtimePay: Math.round(overtimePay * 100) / 100,
        grossPay: Math.round(grossPay * 100) / 100,
        deductions: {
          paye: Math.round(paye),
          nhif: Math.round(nhif),
          nssf: Math.round(nssf),
          total: Math.round(totalDeductions)
        },
        netPay: Math.round(netPay * 100) / 100
      },
      projectedFullMonth: {
        regularPay: Math.round(projectedFullMonthRegularPay * 100) / 100,
        overtimePay: Math.round(overtimePay * 100) / 100,
        grossPay: Math.round(projectedFullMonthGrossPay * 100) / 100,
        deductions: {
          total: Math.round(projectedFullMonthDeductions)
        },
        netPay: Math.round(projectedFullMonthNetPay * 100) / 100
      }
    });

  } catch (error) {
    console.error("Error calculating salary projection:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get employee's payroll history
router.get("/my-payrolls", async (req, res) => {
  try {
    const employeeId = req.user._id;
    const { year, month } = req.query;
    
    const filter = { employee: employeeId };
    if (year && month) {
      filter['payPeriod.year'] = parseInt(year);
      filter['payPeriod.month'] = parseInt(month);
    }

    const payrolls = await Payroll.find(filter)
      .populate("processedBy", "fullName")
      .sort({ "payPeriod.year": -1, "payPeriod.month": -1 });

    res.status(200).json({
      count: payrolls.length,
      payrolls,
    });
  } catch (error) {
    console.error("Error fetching payroll records:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get specific payroll record
router.get("/my-payroll/:payrollId", async (req, res) => {
  try {
    const { payrollId } = req.params;
    const employeeId = req.user._id;

    const payroll = await Payroll.findOne({
      _id: payrollId,
      employee: employeeId
    }).populate("employee", "fullName email position department bankDetails")
     .populate("processedBy", "fullName");

    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    res.status(200).json(payroll);
  } catch (error) {
    console.error("Error fetching payroll record:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// ADMIN ROUTES
router.use(adminRoute);

// Generate payroll for all employees for a specific month
router.post("/generate", async (req, res) => {
  try {
    const { month, year } = req.body;
    const adminId = req.user._id;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    if (month < 1 || month > 12) {
      return res.status(400).json({ message: "Invalid month. Must be between 1-12" });
    }

    // Calculate pay period dates
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get all active employees
    const employees = await User.find({});

    if (employees.length === 0) {
      return res.status(404).json({ message: "No active employees found" });
    }

    const generatedPayrolls = [];
    const errors = [];

    for (const employee of employees) {
      try {
        // Check if payroll already exists
        const existingPayroll = await Payroll.findOne({
          employee: employee._id,
          'payPeriod.month': month,
          'payPeriod.year': year
        });

        if (existingPayroll) {
          errors.push(`Payroll already exists for ${employee.fullName} for ${month}/${year}`);
          continue;
        }

        // Get attendance data for the month
        const attendanceRecords = await Attendance.find({
          employee: employee._id,
          date: { $gte: startDate, $lte: endDate }
        });

        // Calculate attendance summary
        const attendanceSummary = attendanceRecords.reduce((summary, record) => {
          summary.totalHoursWorked += record.totalHours || 0;
          summary.regularHours += record.regularHours || 0;
          summary.overtimeHours += record.overtimeHours || 0;
          
          if (record.status === "Present") summary.daysPresent++;
          else if (record.status === "Late") summary.daysLate++;
          else if (record.status === "Absent") summary.daysAbsent++;
          
          return summary;
        }, {
          totalHoursWorked: 0,
          regularHours: 0,
          overtimeHours: 0,
          daysPresent: 0,
          daysLate: 0,
          daysAbsent: 0
        });

        // Create payroll record
        const payroll = new Payroll({
          employee: employee._id,
          payPeriod: {
            startDate,
            endDate,
            month,
            year
          },
          attendanceSummary,
          salaryBreakdown: {
            basicSalary: employee.basicSalary || 0
          },
          processedBy: adminId,
          processedDate: new Date(),
          status: "Processed"
        });

        await payroll.save();
        generatedPayrolls.push(payroll);

        // Create notification for employee
        await Notification.create({
          recipient: employee._id,
          sender: adminId,
          title: "Payroll Generated",
          message: `Your payroll for ${month}/${year} has been generated. Net pay: KES ${payroll.netPay.toLocaleString()}`,
          type: "payroll"
        });

      } catch (error) {
        console.error(`Error for employee ${employee.fullName}:`, error);
        errors.push(`Error generating payroll for ${employee.fullName}: ${error.message}`);
      }
    }

    res.status(201).json({
      message: `Generated payroll for ${generatedPayrolls.length} employees`,
      generated: generatedPayrolls.length,
      total_employees: employees.length,
      errors
    });

  } catch (error) {
    console.error("Error generating payroll:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Get all payroll records (Admin)
router.get("/all", async (req, res) => {
  try {
    const { year, month, status, employeeId } = req.query;
    
    const filter = {};
    if (year && month) {
      filter['payPeriod.year'] = parseInt(year);
      filter['payPeriod.month'] = parseInt(month);
    }
    if (status) filter.status = status;
    if (employeeId) filter.employee = employeeId;

    const payrolls = await Payroll.find(filter)
      .populate("employee", "fullName email position department")
      .populate("processedBy", "fullName")
      .sort({ "payPeriod.year": -1, "payPeriod.month": -1, createdAt: -1 });

    res.status(200).json({
      count: payrolls.length,
      payrolls
    });
  } catch (error) {
    console.error("Error fetching all payroll records:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Update payroll status
router.patch("/:payrollId/status", async (req, res) => {
  try {
    const { payrollId } = req.params;
    const { status } = req.body;
    const adminId = req.user._id;

    if (!["Draft", "Processed", "Paid", "Cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const payroll = await Payroll.findById(payrollId).populate("employee", "fullName");
    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    const oldStatus = payroll.status;
    payroll.status = status;

    if (status === "Paid" && oldStatus !== "Paid") {
      payroll.paidDate = new Date();
    }

    await payroll.save();

    // Create notification for employee
    await Notification.create({
      recipient: payroll.employee._id,
      sender: adminId,
      title: "Payroll Status Updated",
      message: `Your payroll status has been updated to "${status}"`,
      type: "payroll"
    });

    res.status(200).json({
      message: `Payroll status updated to ${status}`,
      payroll
    });
  } catch (error) {
    console.error("Error updating payroll status:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Export payroll records
router.get('/export', async (req, res) => {
  try {
    const { year, month } = req.query;
    
    const filter = {};
    if (year && month) {
      filter['payPeriod.year'] = parseInt(year);
      filter['payPeriod.month'] = parseInt(month);
    }

    const payrolls = await Payroll.find(filter)
      .populate('employee', 'fullName email position department')
      .sort({ 'payPeriod.year': -1, 'payPeriod.month': -1 })
      .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payroll');

    worksheet.columns = [
      { header: 'Employee', key: 'employee', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Position', key: 'position', width: 20 },
      { header: 'Month/Year', key: 'period', width: 15 },
      { header: 'Basic Salary', key: 'basicSalary', width: 15 },
      { header: 'Regular Hours', key: 'regularHours', width: 15 },
      { header: 'Overtime Hours', key: 'overtimeHours', width: 15 },
      { header: 'Regular Pay', key: 'regularPay', width: 15 },
      { header: 'Overtime Pay', key: 'overtimePay', width: 15 },
      { header: 'Gross Pay', key: 'grossPay', width: 15 },
      { header: 'PAYE', key: 'paye', width: 12 },
      { header: 'NHIF', key: 'nhif', width: 12 },
      { header: 'NSSF', key: 'nssf', width: 12 },
      { header: 'Total Deductions', key: 'totalDeductions', width: 15 },
      { header: 'Net Pay', key: 'netPay', width: 15 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    worksheet.getRow(1).font = { bold: true };

    payrolls.forEach(payroll => {
      worksheet.addRow({
        employee: payroll.employee.fullName,
        email: payroll.employee.email,
        position: payroll.employee.position,
        period: `${payroll.payPeriod.month}/${payroll.payPeriod.year}`,
        basicSalary: payroll.salaryBreakdown.basicSalary,
        regularHours: payroll.attendanceSummary.regularHours,
        overtimeHours: payroll.attendanceSummary.overtimeHours,
        regularPay: payroll.salaryBreakdown.regularPay,
        overtimePay: payroll.salaryBreakdown.overtimePay,
        grossPay: payroll.salaryBreakdown.grossPay,
        paye: payroll.deductions.paye,
        nhif: payroll.deductions.nhif,
        nssf: payroll.deductions.nssf,
        totalDeductions: payroll.deductions.totalDeductions,
        netPay: payroll.netPay,
        status: payroll.status
      });
    });

    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) fs.mkdirSync(exportDir);

    const filename = `payroll-${year || 'all'}-${month || 'months'}-${new Date().toISOString().split('T')[0]}.xlsx`;
    const filepath = path.join(exportDir, filename);
    await workbook.xlsx.writeFile(filepath);

    res.status(200).json({
      message: 'Payroll exported successfully',
      file: `/exports/${filename}`,
      recordsCount: payrolls.length
    });
  } catch (error) {
    console.error('Payroll export failed:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// Delete payroll record (Admin only)
router.delete("/:payrollId", async (req, res) => {
  try {
    const { payrollId } = req.params;

    const payroll = await Payroll.findById(payrollId).populate("employee", "fullName");
    if (!payroll) {
      return res.status(404).json({ message: "Payroll record not found" });
    }

    if (payroll.status === "Paid") {
      return res.status(400).json({ message: "Cannot delete paid payroll records" });
    }

    await Payroll.findByIdAndDelete(payrollId);

    res.status(200).json({
      message: `Payroll record for ${payroll.employee.fullName} deleted successfully`
    });
  } catch (error) {
    console.error("Error deleting payroll record:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Helper functions for tax calculations
function calculatePAYE(monthlyGross) {
  let tax = 0;
  
  if (monthlyGross <= 24000) {
    tax = monthlyGross * 0.10;
  } else if (monthlyGross <= 32333) {
    tax = 2400 + (monthlyGross - 24000) * 0.25;
  } else if (monthlyGross <= 500000) {
    tax = 2400 + 2083.25 + (monthlyGross - 32333) * 0.30;
  } else if (monthlyGross <= 800000) {
    tax = 2400 + 2083.25 + 140300.10 + (monthlyGross - 500000) * 0.325;
  } else {
    tax = 2400 + 2083.25 + 140300.10 + 97500 + (monthlyGross - 800000) * 0.35;
  }
  
  return Math.round(tax);
}

function calculateNHIF(monthlyGross) {
  if (monthlyGross < 6000) return 150;
  if (monthlyGross < 8000) return 300;
  if (monthlyGross < 12000) return 400;
  if (monthlyGross < 15000) return 500;
  if (monthlyGross < 20000) return 600;
  if (monthlyGross < 25000) return 750;
  if (monthlyGross < 30000) return 850;
  if (monthlyGross < 35000) return 900;
  if (monthlyGross < 40000) return 950;
  if (monthlyGross < 45000) return 1000;
  if (monthlyGross < 50000) return 1100;
  if (monthlyGross < 60000) return 1200;
  if (monthlyGross < 70000) return 1300;
  if (monthlyGross < 80000) return 1400;
  if (monthlyGross < 90000) return 1500;
  if (monthlyGross < 100000) return 1600;
  
  return 1700;
}

export { router as payrollRoutes };