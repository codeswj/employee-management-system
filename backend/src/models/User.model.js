import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      min: 6,
    },
    profilePic: {
      type: String,
      default: "",
    },
    employeeStatus: {
      type: String,
      required: true,
      enum: ["Active", "On Leave", "Terminated"],
      default: "Active",
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["employee", "admin"],
      default: "employee",
    },
    position: {
      type: String,
      required: true,
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    leaveType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      default: null,
    },
    // NEW: Basic salary field
    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    // NEW: Bank details for salary processing
    bankDetails: {
      bankName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      branchCode: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);