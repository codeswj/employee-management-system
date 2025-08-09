import { Router } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/User.model.js";
import { Department } from "../models/Department.model.js";
import { Notification } from "../models/Notifications.model.js";
import { adminRoute, protectRoute } from "../middleware/protectRoute.js";

const router = Router();

router.post(
  "/register-employee",
  protectRoute,
  adminRoute,
  async (req, res) => {
    try {
      const {
        email,
        fullName,
        password,
        phoneNumber,
        position,
        departmentName,
        basicSalary // Added basicSalary to destructuring
      } = req.body;

      if (
        !email ||
        !fullName ||
        !password ||
        !phoneNumber ||
        !position ||
        !departmentName ||
        basicSalary === undefined // Check for basicSalary
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Validate basic salary
      if (isNaN(basicSalary) || parseFloat(basicSalary) < 0) {
        return res.status(400).json({ message: "Basic salary must be a positive number" });
      }

      if (await User.findOne({ email })) {
        return res.status(400).json({ message: "Email is already taken" });
      }

      const department = await Department.findOne({ name: departmentName });
      if (!department) {
        return res.status(404).json({ message: "Department not found" });
      }

      const hashed = await bcrypt.hash(password, 10);
      const user = await User.create({
        email,
        fullName,
        phoneNumber,
        position,
        department: department._id,
        password: hashed,
        basicSalary: Number(basicSalary) // Ensure it's stored as a number
      });

      // Add to department.employees
      department.employees.push(user._id);
      await department.save();

      // 1️⃣ Notify the new employee
      await Notification.create({
        recipient: user._id,
        sender:    null,
        title:     "Welcome Aboard!",
        message:   `Hi ${user.fullName}, your account has been set up in ${department.name}.`,
        type:      "system",
      });

      // 2️⃣ Notify the admin who created the account
      await Notification.create({
        recipient: req.user._id,
        sender:    user._id,
        title:     "New Employee Registered",
        message:   `${user.fullName} has been added to ${department.name}.`,
        type:      "system",
      });

      res.status(201).json({
        message: "Employee registered successfully",
        user: {
          _id: user._id,
          email: user.email,
          fullName: user.fullName,
          position: user.position,
          department: department.name,
          basicSalary: user.basicSalary,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Register-employee error:", error.message);
      res
        .status(500)
        .json({ message: "Internal server error", error: error.message });
    }
  }
);

router.delete("/:id", protectRoute, adminRoute, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove from department if needed
    if (user.department) {
      await Department.findByIdAndUpdate(user.department, {
        $pull: { employees: user._id },
      });
    }

    // 1️⃣ Notify the deleted user (their notifications still reference them)
    await Notification.create({
      recipient: user._id,
      sender:    null,
      title:     "Account Deleted",
      message:   `Your account (${user.fullName}) has been removed by an administrator.`,
      type:      "system",
    });

    // 2️⃣ Notify the admin who performed the deletion
    await Notification.create({
      recipient: req.user._id,
      sender:    user._id,
      title:     "Employee Deleted",
      message:   `${user.fullName} has been removed from the system.`,
      type:      "system",
    });

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete-employee error:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

router.get("/", protectRoute, async (req, res) => {
  try {
    const users = await User.find({})
      .select("-password") // Exclude password but include basicSalary and all other fields
      .populate("department", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ users });
  } catch (error) {
    console.error("Get-all-users error:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// New route to get a single employee by ID
router.get("/:id", protectRoute, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
      .select("-password")
      .populate("department", "name");

    if (!user) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Get-employee error:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Add this route to your existing adminEmployeeRoutes

router.put("/:id", protectRoute, adminRoute, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      email,
      fullName,
      phoneNumber,
      position,
      departmentName,
      basicSalary
    } = req.body;

    // Find the employee
    const employee = await User.findById(id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    // Validate basic salary if provided
    if (basicSalary !== undefined && basicSalary < 0) {
      return res.status(400).json({ message: "Basic salary must be a positive number" });
    }

    // Check if email is already taken by another user
    if (email && email !== employee.email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({ message: "Email is already taken" });
      }
    }

    // Handle department change
    let departmentId = employee.department;
    if (departmentName && departmentName !== employee.department?.name) {
      const newDepartment = await Department.findOne({ name: departmentName });
      if (!newDepartment) {
        return res.status(404).json({ message: "Department not found" });
      }

      // Remove employee from old department
      if (employee.department) {
        await Department.findByIdAndUpdate(employee.department, {
          $pull: { employees: employee._id },
        });
      }

      // Add employee to new department
      newDepartment.employees.push(employee._id);
      await newDepartment.save();
      
      departmentId = newDepartment._id;
    }

    // Update employee data
    const updateData = {};
    if (email) updateData.email = email;
    if (fullName) updateData.fullName = fullName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (position) updateData.position = position;
    if (departmentId) updateData.department = departmentId;
    if (basicSalary !== undefined) updateData.basicSalary = Number(basicSalary);

    const updatedEmployee = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("department", "name");

    // Create notification for the updated employee
    await Notification.create({
      recipient: updatedEmployee._id,
      sender: null,
      title: "Profile Updated",
      message: `Your profile information has been updated by an administrator.`,
      type: "system",
    });

    // Create notification for the admin who updated the employee
    await Notification.create({
      recipient: req.user._id,
      sender: updatedEmployee._id,
      title: "Employee Updated",
      message: `${updatedEmployee.fullName}'s profile has been updated successfully.`,
      type: "system",
    });

    res.status(200).json({
      message: "Employee updated successfully",
      employee: {
        _id: updatedEmployee._id,
        email: updatedEmployee.email,
        fullName: updatedEmployee.fullName,
        phoneNumber: updatedEmployee.phoneNumber,
        position: updatedEmployee.position,
        department: updatedEmployee.department,
        basicSalary: updatedEmployee.basicSalary,
        employeeStatus: updatedEmployee.employeeStatus,
        createdAt: updatedEmployee.createdAt,
        updatedAt: updatedEmployee.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update-employee error:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});
export { router as adminEmployeeRoutes };