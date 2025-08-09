import { useState } from "react";
import { Button } from "./components/ui/button";
import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/login/LoginPage";
import Sidebar from "./components/sidebar/SideBar";
import { useAuth } from "./hooks/useAuth";
import { Toaster } from "react-hot-toast";
import ProfilePage from "./pages/profile/ProfilePage";
import AttendancePage from "./pages/attendance/AttendancePage";
import LeavePage from "./pages/leave/LeavePage";
import EmployeesPage from "./pages/employees/EmployeePage";
import NotificationPage from "./pages/notifications/NotificationPage";
import DepartmentPage from "./pages/department/DepartmentPage";
import PayRollPage from "./pages/payroll/PayRollPage";
import EmployeeDashboard from "./pages/employee-dashboard/EmployeeDashboard";
import EmploDashboardPage from "./pages/testssd/EmploDashboardPage";

function App() {
  const { data: authUser } = useAuth();
  console.log("authUser:", authUser);
  return (
    <div className="flex h-screen ">
      {authUser && <Sidebar />}

      {/* Main Content - starts after sidebar */}
      <div className="flex-1 overflow-auto ">
        <Routes>
          <Route
            path="/"
            element={authUser ? <HomePage /> : <Navigate to={"/login"} />}
          />
          <Route
            path="/login"
            element={!authUser ? <LoginPage /> : <Navigate to={"/employeedash"} />}
          />
          <Route
            path="/profile"
            element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
          />
          <Route
            path="/attendance"
            element={authUser ? <AttendancePage /> : <Navigate to="/login" />}
          />
          <Route
            path="/leave"
            element={authUser ? <LeavePage /> : <Navigate to="/login" />}
          />
          <Route
            path="/employees"
            element={authUser ? <EmployeesPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/notifications"
            element={authUser ? <NotificationPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/departments"
            element={authUser ? <DepartmentPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/payroll"
            element={authUser ? <PayRollPage /> : <Navigate to="/login" />}
          />
           <Route
            path="/dash"
            element={authUser ? <EmploDashboardPage /> : <Navigate to="/login" />}
          />         
          <Route
            path="/employeedash"
            element={authUser ? <EmployeeDashboard /> : <Navigate to="/login" />}
          />
        </Routes>
        <Toaster />
      </div>
    </div>
  );
}

export default App;
