import mongoose from "mongoose";

const leaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    }, // e.g., 'Annual Leave', 'Sick Leave'
    description: {
      type: String,
    },
    maxDays: { // Added maxDays
      type: Number,
      required: true,
      min:1
    },
    
    requiresApproval: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);
export const LeaveType = mongoose.model("LeaveType", leaveTypeSchema);