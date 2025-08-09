import React, { useState } from "react";
import { Loader2, CheckCircle2, Clock, Calendar } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { RadioGroup, RadioGroupItem } from "../../components/ui/radio-group";
import { Label } from "../../components/ui/label";

import {
  useClockIn,
  useClockOut,
  useTodayAttendance,
} from "../../hooks/useAttendance";

// Time Picker Component
const TimePicker = ({ value, onChange, label, disabled = false }) => {
  const formatTime = (date) => {
    if (!date) return { hour: '09', minute: '00', period: 'AM' };
    const d = new Date(date);
    let hour = d.getHours();
    const minute = d.getMinutes().toString().padStart(2, '0');
    const period = hour >= 12 ? 'PM' : 'AM';
    hour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return { hour: hour.toString().padStart(2, '0'), minute, period };
  };

  const timeData = formatTime(value);
  const [hour, setHour] = useState(timeData.hour);
  const [minute, setMinute] = useState(timeData.minute);
  const [period, setPeriod] = useState(timeData.period);

  const updateTime = (newHour, newMinute, newPeriod) => {
    const today = new Date();
    let hour24 = parseInt(newHour);
    
    if (newPeriod === 'PM' && hour24 !== 12) {
      hour24 += 12;
    } else if (newPeriod === 'AM' && hour24 === 12) {
      hour24 = 0;
    }
    
    const newTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hour24, parseInt(newMinute));
    onChange(newTime.toISOString());
  };

  const handleHourChange = (newHour) => {
    setHour(newHour);
    updateTime(newHour, minute, period);
  };

  const handleMinuteChange = (newMinute) => {
    setMinute(newMinute);
    updateTime(hour, newMinute, period);
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    updateTime(hour, minute, newPeriod);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center space-x-2 p-3 border rounded-lg bg-background">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center space-x-1">
          <select 
            value={hour} 
            onChange={(e) => handleHourChange(e.target.value)}
            disabled={disabled}
            className="px-2 py-1 text-center border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {Array.from({length: 12}, (_, i) => {
              const h = String(i + 1).padStart(2, '0');
              return <option key={h} value={h}>{h}</option>;
            })}
          </select>
          <span className="text-muted-foreground">:</span>
          <select 
            value={minute} 
            onChange={(e) => handleMinuteChange(e.target.value)}
            disabled={disabled}
            className="px-2 py-1 text-center border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {Array.from({length: 60}, (_, i) => {
              const m = String(i).padStart(2, '0');
              return <option key={m} value={m}>{m}</option>;
            })}
          </select>
          <select 
            value={period} 
            onChange={(e) => handlePeriodChange(e.target.value)}
            disabled={disabled}
            className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// Loading Skeleton Components
const AttendanceSkeleton = () => {
  return (
    <div className="container max-w-2xl py-8 mx-auto">
      <Card className="p-6 space-y-6 animate-pulse">
        <div className="text-center space-y-2">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto"></div>
          <div className="h-5 bg-gray-200 rounded w-64 mx-auto"></div>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col items-center rounded-md border-2 border-gray-200 p-4 space-y-2">
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
          <div className="h-20 bg-gray-200 rounded w-full"></div>
          <div className="h-10 bg-gray-200 rounded w-full"></div>
        </div>
      </Card>
    </div>
  );
};

const AttendancePage = () => {
  const {
    todayAttendance,
    isLoadingToday,
  } = useTodayAttendance();

  const {
    clockIn,
    isClockingIn,
  } = useClockIn();

  const {
    clockOut,
    isClockingOut,
  } = useClockOut();

  const [status, setStatus] = useState("");
  const [clockInTime, setClockInTime] = useState("");
  const [clockOutTime, setClockOutTime] = useState("");

  // Set current time as default
  React.useEffect(() => {
    const now = new Date();
    setClockInTime(now.toISOString());
    setClockOutTime(now.toISOString());
  }, []);

  const handleClockIn = (e) => {
    e.preventDefault();
    if (status && clockInTime) {
      clockIn({ status, clockInTime });
    }
  };

  const handleClockOut = (e) => {
    e.preventDefault();
    if (clockOutTime) {
      clockOut(clockOutTime);
    }
  };

  // Enhanced loading state
  if (isLoadingToday) {
    return <AttendanceSkeleton />;
  }

  // Check if user has clocked in but not out yet
  const hasActiveClockIn = todayAttendance?.clockIn && !todayAttendance?.clockOut && todayAttendance?.status !== 'Absent';
  
  // Check if user has completed attendance for the day
  const hasCompletedAttendance = todayAttendance?.clockOut || todayAttendance?.status === 'Absent';

  // Clock out view
  if (hasActiveClockIn) {
    const clockInTime = new Date(todayAttendance.clockIn);
    const now = new Date();
    const hoursWorked = ((now - clockInTime) / (1000 * 60 * 60)).toFixed(1);

    return (
      <div className="container max-w-2xl py-8 mx-auto">
        <Card className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <Clock className="h-16 w-16 text-blue-500 mx-auto" />
            <h1 className="text-2xl font-bold">Clock Out</h1>
            <p className="text-muted-foreground">
              You clocked in as <span className="font-semibold text-primary">{todayAttendance.status}</span> at{" "}
              {new Date(clockInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
            <p className="text-sm text-muted-foreground">
              Hours worked so far: <span className="font-semibold">{hoursWorked}h</span>
              {hoursWorked > 8 && <span className="text-amber-600"> (Overtime: {(hoursWorked - 8).toFixed(1)}h)</span>}
            </p>
          </div>

          <div onSubmit={handleClockOut} className="space-y-6">
            <TimePicker
              value={clockOutTime}
              onChange={setClockOutTime}
              label="Clock Out Time"
            />

            <Button 
              type="button" 
              onClick={handleClockOut}
              className="w-full" 
              disabled={!clockOutTime || isClockingOut}
              size="lg"
            >
              {isClockingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clocking Out...
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Clock Out
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Completed attendance view
  if (hasCompletedAttendance) {
    const totalHours = todayAttendance.totalHours || 0;
    const overtimeHours = todayAttendance.overtimeHours || 0;

    return (
      <div className="container max-w-2xl py-8 mx-auto">
        <Card className="p-6 space-y-6 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold">Attendance Complete!</h1>
          
          {todayAttendance.status === 'Absent' ? (
            <p>You've marked yourself as <span className="font-semibold text-red-600">Absent</span> today.</p>
          ) : (
            <div className="space-y-2">
              <p>
                You worked as <span className="font-semibold text-primary">{todayAttendance.status}</span> today.
              </p>
              {todayAttendance.clockIn && (
                <p className="text-sm text-muted-foreground">
                  Clocked in: {new Date(todayAttendance.clockIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              )}
              {todayAttendance.clockOut && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Clocked out: {new Date(todayAttendance.clockOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                  <div className="pt-2 space-y-1">
                    <p className="font-semibold">Total Hours: {totalHours}h</p>
                    {overtimeHours > 0 && (
                      <p className="text-sm text-amber-600">
                        Overtime: {overtimeHours}h
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
          
          <p className="text-sm text-muted-foreground">
            Come back tomorrow to mark your attendance!
          </p>
        </Card>
      </div>
    );
  }

  // Clock in view (initial state)
  return (
    <div className="container max-w-2xl py-8 mx-auto">
      <Card className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <Calendar className="h-16 w-16 text-primary mx-auto" />
          <h1 className="text-2xl font-bold">Clock In</h1>
          <p className="text-muted-foreground">
            Select your status and clock in for today
          </p>
          <p className="text-xs text-muted-foreground">
            Standard work day: 8 hours • Overtime applies after 8 hours
          </p>
        </div>

        <div onSubmit={handleClockIn} className="space-y-6">
          <div className="space-y-4">
            <Label className="text-sm font-medium">Attendance Status</Label>
            <RadioGroup
              value={status}
              onValueChange={setStatus}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              {/* Present */}
              <div>
                <RadioGroupItem
                  value="Present"
                  id="present"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="present"
                  className="flex flex-col items-center rounded-md border-2 border-muted p-4 hover:bg-accent hover:border-green-300 peer-checked:border-green-500 peer-checked:bg-green-50 cursor-pointer transition-all"
                >
                  <span className="text-2xl mb-2">✅</span>
                  <span className="font-semibold">Present</span>
                </Label>
              </div>

              {/* Late */}
              <div>
                <RadioGroupItem value="Late" id="late" className="peer sr-only" />
                <Label
                  htmlFor="late"
                  className="flex flex-col items-center rounded-md border-2 border-muted p-4 hover:bg-accent hover:border-yellow-300 peer-checked:border-yellow-500 peer-checked:bg-yellow-50 cursor-pointer transition-all"
                >
                  <span className="text-2xl mb-2">⏰</span>
                  <span className="font-semibold">Late</span>
                </Label>
              </div>

              {/* Absent */}
              <div>
                <RadioGroupItem
                  value="Absent"
                  id="absent"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="absent"
                  className="flex flex-col items-center rounded-md border-2 border-muted p-4 hover:bg-accent hover:border-red-300 peer-checked:border-red-500 peer-checked:bg-red-50 cursor-pointer transition-all"
                >
                  <span className="text-2xl mb-2">❌</span>
                  <span className="font-semibold">Absent</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Show time picker only if not absent */}
          {status && status !== "Absent" && (
            <TimePicker
              value={clockInTime}
              onChange={setClockInTime}
              label="Clock In Time"
            />
          )}

          <Button 
            type="button" 
            onClick={handleClockIn}
            className="w-full" 
            disabled={!status || isClockingIn || (status !== "Absent" && !clockInTime)}
            size="lg"
          >
            {isClockingIn ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Clocking In...
              </>
            ) : (
              <>
                <Clock className="mr-2 h-4 w-4" />
                Clock In
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AttendancePage;