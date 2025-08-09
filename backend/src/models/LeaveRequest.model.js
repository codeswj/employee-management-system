import mongoose from "mongoose"
const leaveRequestSchema = new mongoose.Schema(
    {
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      leaveType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LeaveType",
        required: true,
      },
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
      numberOfDays: {
        type: Number,
        required: true,
      }, // Calculate this upon submission, and should be <= LeaveType.maxDays
      
      status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected", "Cancelled"],
        default: "Pending",
      },
      approver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
      },
      
      approvedDate: {
        type: Date,
      },
     
    },
    { timestamps: true }
  ); // timestamps adds createdAt, updatedAt
  export const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema);