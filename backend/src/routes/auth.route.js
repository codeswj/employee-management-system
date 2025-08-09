import { Router } from "express";
import { User } from "../models/User.model.js";
import bcrypt from "bcrypt";
import { generateToken } from "../utils/generateTokenAndSetCookie.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).populate([
      { path: "department", select: "name description" },
      { path: "leaveType" }, // or .populate("leaveType") if you want all its fields
    ]);

    if (!user) return res.status(404).json({ message: "Email not found" });

    //if email existed
    const comparePassword = await bcrypt.compare(password, user.password);

    if (!comparePassword)
      return res
        .status(400)
        .json({ message: "Password didn't match our records" });

    //if all the checks are passed
    const token = await generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phoneNumber,
      profilePic: user.profilePic,
      department: user.department,
      employeeStatus: user.employeeStatus,
      leaveType: user.leaveType,
      role: user.role,
    });
  } catch (error) {
    console.log("An Error occured in the Login route:", error.message);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

router.post("/logout", async (req, res) => {
  try {
    res.cookie("token", "", { maxAge: 0 });
    res.status(200).json({ message: "Logout successfully" });
  } catch (error) {
    console.error("An error occurred in logout controller", error);
    return res.status(500).json({ error: error.message });
  }
});

//get the currently authenticated user
router.get("/me", protectRoute, async (req, res) => {
  try {
    return res.status(200).json({ success: true, user: req.user });
  } catch (error) {
    console.error("An error occurred in me controller", error);
    return res.status(500).json({ error: error.message });
  }
});
export { router as authRoutes };
