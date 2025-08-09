import { Router } from "express";
import { adminRoute, protectRoute } from "../middleware/protectRoute.js";
import { Notification } from "../models/Notifications.model.js";
import { User } from "../models/User.model.js";

const router = Router();

router.use(protectRoute);

/**
 * GET /notifications
 * Get all notifications for the current user
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.user._id;
    
    const notifications = await Notification.find({ recipient: userId })
      .populate("sender", "fullName email")
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 notifications

    res.status(200).json({
      message: "Notifications retrieved successfully",
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error.message);
    res.status(500).json({ 
      message: "Failed to retrieve notifications", 
      error: error.message 
    });
  }
});


/**
 * PATCH /notifications/:id/read
 * Mark a specific notification as read
 */
router.patch("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    ).populate("sender", "fullName email");

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark notification as read error:", error.message);
    res.status(500).json({ 
      message: "Failed to mark notification as read", 
      error: error.message 
    });
  }
});

/**
 * PATCH /notifications/mark-all-read
 * Mark all notifications as read for the current user
 */
router.patch("/mark-all-read", async (req, res) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    res.status(200).json({
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error.message);
    res.status(500).json({ 
      message: "Failed to mark all notifications as read", 
      error: error.message 
    });
  }
});


/**
 * POST /notifications/send (Admin only)
 * Send a custom notification to specific users or all users
 */
router.post("/send", adminRoute, async (req, res) => {
  try {
    const { recipients, title, message, type = "system" } = req.body;
    const senderId = req.user._id;

    if (!title || !message) {
      return res.status(400).json({ 
        message: "Title and message are required" 
      });
    }

    let targetRecipients = [];

    if (recipients === "all") {
      // Send to all users except the sender
      const allUsers = await User.find({ _id: { $ne: senderId } }, "_id");
      targetRecipients = allUsers.map(user => user._id);
    } else if (Array.isArray(recipients)) {
      // Send to specific users
      targetRecipients = recipients;
    } else {
      return res.status(400).json({ 
        message: "Recipients must be 'all' or an array of user IDs" 
      });
    }

    if (targetRecipients.length === 0) {
      return res.status(400).json({ message: "No recipients found" });
    }

    // Create notifications for all recipients
    const notifications = targetRecipients.map(recipientId => ({
      recipient: recipientId,
      sender: senderId,
      title,
      message,
      type,
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({
      message: "Notifications sent successfully",
      recipientCount: targetRecipients.length,
    });
  } catch (error) {
    console.error("Send notification error:", error.message);
    res.status(500).json({ 
      message: "Failed to send notifications", 
      error: error.message 
    });
  }
});


export { router as notificationRoutes };