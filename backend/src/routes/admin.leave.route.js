import { Router } from "express";
import { adminRoute, protectRoute } from "../middleware/protectRoute.js";
import { LeaveType } from "../models/LeaveType.model.js";
import { User } from "../models/User.model.js";
import { LeaveRequest } from "../models/LeaveRequest.model.js";
import { Notification } from "../models/Notifications.model.js";

const router = Router();
router.use(protectRoute, adminRoute);

/**
 * GET /admin/leave
 * List all leave requests (for admin dashboard)
 */
router.get("/", async (req, res) => {
  try {
    const leaveRequests = await LeaveRequest.find({})
      .populate({
        path: "employee",
        select: "fullName email position department",
        populate: { path: "department", select: "name" },
      })
      .populate("leaveType", "name description maxDays")
      .sort({ createdAt: -1 });

    res.status(200).json({ leaveRequests });
  } catch (error) {
    console.error("Admin-get-all-leave-requests error:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * POST /admin/leave
 * Create a new leave type
 */
router.post("/", async (req, res) => {
  try {
    const { name, description, maxDays, requiresApproval = true } = req.body;

    if (!name || !description || !maxDays) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (await LeaveType.findOne({ name })) {
      return res.status(400).json({ message: "Leave already exists" });
    }

    const leave = await LeaveType.create({ name, description, maxDays, requiresApproval });

    // Notify admin
    await Notification.create({
      recipient: req.user._id,
      sender:    null,
      title:     "Leave Type Created",
      message:   `Leave type “${leave.name}” (${leave.maxDays} days) was created.`,
      type:      "system",
    });

    res.status(201).json({ message: "Leave created successfully", leave });
  } catch (error) {
    console.error("Create-leave-route error:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

/**
 * DELETE /admin/leave/:id
 * Delete a leave type (and unlink from users)
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id: leaveId } = req.params;
    const leaveType = await LeaveType.findById(leaveId);
    if (!leaveType) {
      return res.status(404).json({ message: "Leave type not found" });
    }

    // Unlink users who had this leaveType
    await User.updateMany({ leaveType: leaveId }, { $set: { leaveType: null } });

    // Delete it
    await LeaveType.findByIdAndDelete(leaveId);

    // Notify admin
    await Notification.create({
      recipient: req.user._id,
      sender:    null,
      title:     "Leave Type Deleted",
      message:   `Leave type “${leaveType.name}” was deleted.`,
      type:      "system",
    });

    res.status(200).json({ message: "Leave type deleted successfully" });
  } catch (error) {
    console.error("Delete-leave-route error:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

// Approve or reject a leave request
router.patch("/toggle-leave/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user._id;

    const leaveRequest = await LeaveRequest.findById(id).populate("employee", "fullName email employeeStatus");
    if (!leaveRequest) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    // Determine new status
    const newStatus = leaveRequest.status === "Approved" ? "Rejected" : "Approved";
    const approvedDate = newStatus === "Approved" ? new Date() : null;

    // Update leave request
    const updatedRequest = await LeaveRequest.findByIdAndUpdate(
      id,
      { status: newStatus, approver: adminId, approvedDate },
      { new: true }
    ).populate("employee", "fullName email");

    // 👇 Update employee's status accordingly
    if (newStatus === "Approved") {
      await User.findByIdAndUpdate(updatedRequest.employee._id, {
        employeeStatus: "On Leave",
      });
    } else if (newStatus === "Rejected") {
      await User.findByIdAndUpdate(updatedRequest.employee._id, {
        employeeStatus: "Active", // Optional: revert to Active
      });
    }

    // Notify the employee
    await Notification.create({
      recipient: updatedRequest.employee._id,
      sender: adminId,
      title: `Leave ${newStatus}`,
      message: `Your leave request (${updatedRequest.leaveType}) has been ${newStatus.toLowerCase()}.`,
      type: "leave",
    });

    res.status(200).json({
      message: `Leave ${newStatus.toLowerCase()} successfully`,
      leave: updatedRequest,
    });
  } catch (error) {
    console.error("Toggle-leave error:", error.message);
    res.status(500).json({ message: "Failed to toggle leave status", error: error.message });
  }
});


export { router as adminLeaveRoutes };
