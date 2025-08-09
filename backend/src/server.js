import express from "express"
import cookieParser from "cookie-parser"
import cors from 'cors';
import  { configDotenv } from "dotenv"
import { authRoutes } from "./routes/auth.route.js"
import { connectToDB } from "./lib/db.js"
import { departmentRoutes } from "./routes/deparment.route.js"
import { adminEmployeeRoutes } from "./routes/admin.user.route.js";
import { adminLeaveRoutes } from "./routes/admin.leave.route.js";
import { leaveRoutes } from "./routes/leave.route.js";
import { attendanceRoutes } from "./routes/attendance.route.js";
import path from 'path';
import { adminDashboardRoute } from "./routes/admin.dashboard.route.js";
import { notificationRoutes } from "./routes/notifications.route.js";
import { payrollRoutes } from "./routes/payroll.route.js";
import { employeeDashboardRoute } from "./routes/employeeDashboardRoutes.js";
configDotenv()

const PORT = process.env.PORT || 5005

const app = express()
app.use(cors({
    origin: "http://localhost:5173",  // your Vite dev server
    credentials: true,                // allow cookies/auth headers
    methods: ["GET","POST","OPTIONS", "PUT","PATCH","DELETE"]
  })); 
app.use(cookieParser())


app.use(express.json())
app.use("/api/auth", authRoutes)
app.use("/api/department", departmentRoutes)
app.use("/api/admin-mangage-employee", adminEmployeeRoutes)
app.use("/api/admin-mangage-leave", adminLeaveRoutes)
app.use("/api/admin-dashboard", adminDashboardRoute)
app.use("/api/employee-dashboard", employeeDashboardRoute)
app.use("/api/leave", leaveRoutes)
app.use("/api/attendance", attendanceRoutes)
app.use("/api/notifications", notificationRoutes)
app.use("/api/payroll-processing", payrollRoutes)

app.use(
  '/exports',
  express.static(path.join(process.cwd(), 'exports'))
);
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    connectToDB()
})