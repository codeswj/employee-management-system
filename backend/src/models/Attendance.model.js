// models/Attendance.model.js
import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      // normalize to midnight so each day is unique
      set: (d) => new Date(new Date(d).toDateString()),
    },
    status: {
      type: String,
      enum: ["Present", "Late", "Absent"],
      required: true,
    },
    clockIn: {
      type: Date,
      required: function() {
        return this.status !== 'Absent';
      }
    },
    clockOut: {
      type: Date,
      validate: {
        validator: function(clockOut) {
          if (!clockOut) return true; // clockOut is optional
          return !this.clockIn || clockOut > this.clockIn;
        },
        message: 'Clock out time must be after clock in time'
      }
    },
    totalHours: {
      type: Number,
      default: 0
    },
    regularHours: {
      type: Number,
      default: 0
    },
    overtimeHours: {
      type: Number,
      default: 0
    },
    isClockOutPending: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Calculate hours before saving
attendanceSchema.pre('save', function(next) {
  if (this.clockIn && this.clockOut) {
    const diffInMs = this.clockOut - this.clockIn;
    const totalHours = diffInMs / (1000 * 60 * 60); // Convert to hours
    
    this.totalHours = Math.round(totalHours * 100) / 100; // Round to 2 decimal places
    this.regularHours = Math.min(totalHours, 8); // Regular hours capped at 8
    this.overtimeHours = Math.max(0, totalHours - 8); // Anything above 8 is overtime
    this.isClockOutPending = false;
  } else if (this.clockIn) {
    this.isClockOutPending = true;
  }
  
  next();
});

// ensure one record per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model("Attendance", attendanceSchema);