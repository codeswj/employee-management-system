import { Router } from "express";
import { Department } from "../models/Department.model.js";
import { User } from "../models/User.model.js";
import { Notification } from "../models/Notifications.model.js";
import { adminRoute, protectRoute } from "../middleware/protectRoute.js";

const router = Router();

router.get("/", protectRoute, async (req, res) => {
  try {
    const departments = await Department.find({});
    res.status(200).json({ departments });
  } catch (error) {
    console.error("Get-departments error:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

router.post("/create-department", protectRoute, adminRoute, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !description)
      return res.status(400).json({ message: "All fields are required" });

    if (await Department.findOne({ name }))
      return res.status(400).json({ message: "Department already exists" });

    const department = await Department.create({ name, description });

    // Notify the admin or system user
    await Notification.create({
      recipient: req.user._id,      // or broadcast to all admins if you prefer
      sender:    null,
      title:     "Department Created",
      message:   `Department “${department.name}” was created successfully.`,
      type:      "system",
    });

    res.status(201).json({ message: "Department created successfully", department });
  } catch (error) {
    console.error("Create-department error:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

router.delete("/:id", protectRoute, adminRoute, async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findById(id);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    // Unlink all users in this department
    await User.updateMany({ department: id }, { $set: { department: null } });

    // Delete the department
    await Department.findByIdAndDelete(id);

    // Notify
    await Notification.create({
      recipient: req.user._id,
      sender:    null,
      title:     "Department Deleted",
      message:   `Department “${department.name}” was deleted.`,
      type:      "system",
    });

    res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Delete-department error:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

export { router as departmentRoutes };
