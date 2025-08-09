import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    payPeriod: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
      month: {
        type: Number,
        required: true,
        min: 1,
        max: 12,
      },
      year: {
        type: Number,
        required: true,
      },
    },
    // Attendance Summary
    attendanceSummary: {
      totalHoursWorked: {
        type: Number,
        default: 0,
      },
      regularHours: {
        type: Number,
        default: 0,
        max: 160, // Maximum 160 regular hours per month
      },
      overtimeHours: {
        type: Number,
        default: 0,
        max: 40, // Maximum 40 overtime hours per month to prevent overworking
      },
      daysPresent: {
        type: Number,
        default: 0,
      },
      daysLate: {
        type: Number,
        default: 0,
      },
      daysAbsent: {
        type: Number,
        default: 0,
      },
    },
    // Salary Breakdown
    salaryBreakdown: {
      basicSalary: {
        type: Number,
        required: true,
        min: 0,
      },
      hourlyRate: {
        type: Number,
        min: 0,
        default: 0,
      },
      overtimeRate: {
        type: Number,
        min: 0,
        default: 0,
      }, // 1.5x regular hourly rate
      regularPay: {
        type: Number,
        default: 0,
      },
      overtimePay: {
        type: Number,
        default: 0,
      },
      grossPay: {
        type: Number,
        default: 0,
      },
    },
    // Deductions
    deductions: {
      paye: {
        type: Number,
        default: 0,
      }, // Pay As You Earn tax
      nhif: {
        type: Number,
        default: 0,
      }, // National Hospital Insurance Fund
      nssf: {
        type: Number,
        default: 0,
      }, // National Social Security Fund
      totalDeductions: {
        type: Number,
        default: 0,
      },
    },
    // Final Pay
    netPay: {
      type: Number,
      default: 0,
    },
    // Status
    status: {
      type: String,
      enum: ["Draft", "Processed", "Paid", "Cancelled"],
      default: "Draft",
    },
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    processedDate: {
      type: Date,
    },
    paidDate: {
      type: Date,
    },
    // Payslip generation
    payslipGenerated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Calculate all payroll amounts before saving
// Calculate all payroll amounts before saving
payrollSchema.pre('save', function(next) {
  // Calculate hourly rate (assuming 160 hours per month for full salary)
  this.salaryBreakdown.hourlyRate = this.salaryBreakdown.basicSalary / 160;
  
  // Set overtime rate (1.5x regular rate)
  this.salaryBreakdown.overtimeRate = this.salaryBreakdown.hourlyRate * 1.5;
  
  // Calculate regular pay (capped at 160 hours)
  const regularHours = Math.min(this.attendanceSummary.regularHours, 160);
  this.salaryBreakdown.regularPay = regularHours * this.salaryBreakdown.hourlyRate;
  
  // Calculate overtime pay (capped at 40 hours)
  const overtimeHours = Math.min(this.attendanceSummary.overtimeHours, 40);
  this.salaryBreakdown.overtimePay = overtimeHours * this.salaryBreakdown.overtimeRate;
  
  // Calculate gross pay
  this.salaryBreakdown.grossPay = this.salaryBreakdown.regularPay + this.salaryBreakdown.overtimePay;
  
  // --- Guard against zero gross pay to avoid negative netPay ---
  if (this.salaryBreakdown.grossPay === 0) {
    this.deductions.paye = 0;
    this.deductions.nhif = 0;
    this.deductions.nssf = 0;
    this.deductions.totalDeductions = 0;
    this.netPay = 0;
    return next();
  }
  
  // Calculate PAYE (Progressive tax rates for Kenya)
  this.deductions.paye = this.calculatePAYE(this.salaryBreakdown.grossPay);
  
  // Calculate NHIF (Kenya rates)
  this.deductions.nhif = this.calculateNHIF(this.salaryBreakdown.grossPay);
  
  // Calculate NSSF (Kenya rates - 6% of gross pay, max KES 1,080)
  this.deductions.nssf = Math.min(this.salaryBreakdown.grossPay * 0.06, 1080);
  
  // Total deductions
  this.deductions.totalDeductions = this.deductions.paye + this.deductions.nhif + this.deductions.nssf;
  
  // Calculate net pay
  this.netPay = this.salaryBreakdown.grossPay - this.deductions.totalDeductions;
  
  next();
});


// PAYE calculation method (Kenya tax brackets)
payrollSchema.methods.calculatePAYE = function(grossPay) {
  const monthlyGross = grossPay;
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
};

// NHIF calculation method (Kenya rates)
payrollSchema.methods.calculateNHIF = function(grossPay) {
  const monthlyGross = grossPay;
  
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
  
  return 1700; // Maximum NHIF contribution
};

// Ensure one payroll record per employee per month
payrollSchema.index({ employee: 1, 'payPeriod.month': 1, 'payPeriod.year': 1 }, { unique: true });

// Index for efficient querying
payrollSchema.index({ status: 1, 'payPeriod.month': 1, 'payPeriod.year': 1 });

export const Payroll = mongoose.model("Payroll", payrollSchema);