import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { 
  DollarSign, 
  Calendar, 
  Users, 
  TrendingUp, 
  Download, 
  Plus,
  Eye,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
// Date formatting utility
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
import toast from 'react-hot-toast';

// Custom hooks for API calls
const useAuthUser = () => {
  return useQuery({
    queryKey: ['authUser'],
    queryFn: async () => {
      const user = localStorage.getItem('authUser');
      return user ? JSON.parse(user) : null;
    }
  });
};

const useCurrentMonthProjection = () => {
  return useQuery({
    queryKey: ['currentMonthProjection'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5005/api/payroll-processing/current-month-projection', {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied');
        }
        throw new Error('Failed to fetch projection');
      }
      return response.json();
    },
    enabled: true,
    retry: 1
  });
};

const useMyPayrolls = (year, month) => {
  return useQuery({
    queryKey: ['myPayrolls', year, month],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (month) params.append('month', month);
      
      const response = await fetch(`http://localhost:5005/api/payroll-processing/my-payrolls?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied');
        }
        throw new Error('Failed to fetch payrolls');
      }
      return response.json();
    },
    enabled: true,
    retry: 1
  });
};

const useAllPayrolls = (year, month, status) => {
  return useQuery({
    queryKey: ['allPayrolls', year, month, status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (year) params.append('year', year);
      if (month) params.append('month', month);
      if (status) params.append('status', status);
      
      const response = await fetch(`http://localhost:5005/api/payroll-processing/all?${params}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Access denied - Admin privileges required');
        }
        throw new Error('Failed to fetch all payrolls');
      }
      return response.json();
    },
    enabled: true,
    retry: 1
  });
};

// Components
const StatusBadge = ({ status }) => {
  const variants = {
    Draft: { variant: 'secondary', icon: Clock },
    Processed: { variant: 'outline', icon: AlertCircle },
    Paid: { variant: 'default', icon: CheckCircle },
    Cancelled: { variant: 'destructive', icon: XCircle }
  };
  
  const { variant, icon: Icon } = variants[status] || variants.Draft;
  
  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {status}
    </Badge>
  );
};

const PayrollSummaryCards = ({ projection }) => {
  if (!projection) return null;
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Earnings</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">KES {projection.currentEarnings.netPay.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Net pay so far this month
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Hours Worked</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{projection.workingSummary.hoursWorked}</div>
          <p className="text-xs text-muted-foreground">
            {projection.workingSummary.regularHours} regular + {projection.workingSummary.overtimeHours} overtime
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Projected Full Month</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">KES {projection.projectedFullMonth.netPay.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            If you complete full month
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Days Worked</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{projection.workingSummary.daysWorked}</div>
          <p className="text-xs text-muted-foreground">
            Out of {projection.workingSummary.daysInMonth} days
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

const GeneratePayrollDialog = ({ onGenerate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!month || !year) {
      toast.error('Please select both month and year');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('http://localhost:5005/api/payroll-processing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ month: parseInt(month), year: parseInt(year) })
      });

      if (!response.ok) throw new Error('Failed to generate payroll');
      
      const data = await response.json();
      toast.success(data.message);
      setIsOpen(false);
      onGenerate();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Generate Payroll
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Payroll</DialogTitle>
          <DialogDescription>
            Generate payroll for all active employees for a specific month and year.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="month">Month</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              min="2020"
              max="2030"
            />
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? 'Generating...' : 'Generate Payroll'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PayrollDetailsDialog = ({ payroll, isOpen, onClose }) => {
  if (!payroll) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payroll Details</DialogTitle>
          <DialogDescription>
            {payroll.employee?.fullName || 'Employee'} - {payroll.payPeriod.month}/{payroll.payPeriod.year}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Employee Info */}
          <div>
            <h4 className="font-medium mb-2">Employee Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Name: {payroll.employee?.fullName}</div>
              <div>Position: {payroll.employee?.position}</div>
              <div>Email: {payroll.employee?.email}</div>
              <div>Status: <StatusBadge status={payroll.status} /></div>
            </div>
          </div>

          <Separator />

          {/* Attendance Summary */}
          <div>
            <h4 className="font-medium mb-2">Attendance Summary</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>Days Present: {payroll.attendanceSummary.daysPresent}</div>
              <div>Days Late: {payroll.attendanceSummary.daysLate}</div>
              <div>Days Absent: {payroll.attendanceSummary.daysAbsent}</div>
              <div>Regular Hours: {payroll.attendanceSummary.regularHours}</div>
              <div>Overtime Hours: {payroll.attendanceSummary.overtimeHours}</div>
              <div>Total Hours: {payroll.attendanceSummary.totalHoursWorked}</div>
            </div>
          </div>

          <Separator />

          {/* Salary Breakdown */}
          <div>
            <h4 className="font-medium mb-2">Salary Breakdown</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Basic Salary:</span>
                <span>KES {payroll.salaryBreakdown.basicSalary.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Regular Pay:</span>
                <span>KES {payroll.salaryBreakdown.regularPay.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Overtime Pay:</span>
                <span>KES {payroll.salaryBreakdown.overtimePay.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Gross Pay:</span>
                <span>KES {payroll.salaryBreakdown.grossPay.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Deductions */}
          <div>
            <h4 className="font-medium mb-2">Deductions</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>PAYE:</span>
                <span>KES {payroll.deductions.paye.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>NHIF:</span>
                <span>KES {payroll.deductions.nhif.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>NSSF:</span>
                <span>KES {payroll.deductions.nssf.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium text-red-600">
                <span>Total Deductions:</span>
                <span>KES {payroll.deductions.totalDeductions.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Net Pay */}
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Net Pay:</span>
              <span className="text-2xl font-bold text-green-600">
                KES {payroll.netPay.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const PayRollPage = () => {
  const { data: authUser } = useAuthUser();
  const isAdmin = authUser?.role === 'admin';
  
  // State for filters
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // API calls
  const { data: projection, refetch: refetchProjection } = useCurrentMonthProjection();
  const { data: myPayrolls, refetch: refetchMyPayrolls } = useMyPayrolls(
    selectedYear, 
    selectedMonth === 'all' ? null : selectedMonth
  );
  const { data: allPayrolls, refetch: refetchAllPayrolls } = useAllPayrolls(
    selectedYear, 
    selectedMonth === 'all' ? null : selectedMonth, 
    selectedStatus === 'all' ? null : selectedStatus
  );

  const handlePayrollGenerated = () => {
    refetchAllPayrolls();
    refetchMyPayrolls();
    refetchProjection();
  };

  const handleViewDetails = (payroll) => {
    setSelectedPayroll(payroll);
    setIsDetailsOpen(true);
  };

  const handleStatusUpdate = async (payrollId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5005/api/payroll-processing/${payrollId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      toast.success('Status updated successfully');
      refetchAllPayrolls();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedYear) params.append('year', selectedYear);
      if (selectedMonth && selectedMonth !== 'all') params.append('month', selectedMonth);
      
      const response = await fetch(`http://localhost:5005/api/payroll-processing/export?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Export failed');
      
      const data = await response.json();
      toast.success(data.message);
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!authUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground">
            {isAdmin ? 'Manage employee payroll and salary processing' : 'View your salary information and payroll history'}
          </p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <GeneratePayrollDialog onGenerate={handlePayrollGenerated} />
          </div>
        )}
      </div>

      {!isAdmin && projection && (
        <>
          {/* Employee Summary Cards */}
          <PayrollSummaryCards projection={projection} />
          
          {/* Employee Current Month Details */}
          <Card>
            <CardHeader>
              <CardTitle>Current Month Breakdown ({projection.currentMonth})</CardTitle>
              <CardDescription>Your salary breakdown for the current month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Current Earnings</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Regular Pay:</span>
                      <span>KES {projection.currentEarnings.regularPay.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overtime Pay:</span>
                      <span>KES {projection.currentEarnings.overtimePay.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Gross Pay:</span>
                      <span>KES {projection.currentEarnings.grossPay.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Total Deductions:</span>
                      <span>KES {projection.currentEarnings.deductions.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-green-600">
                      <span>Net Pay:</span>
                      <span>KES {projection.currentEarnings.netPay.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Projected Full Month</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Regular Pay:</span>
                      <span>KES {projection.projectedFullMonth.regularPay.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Overtime Pay:</span>
                      <span>KES {projection.projectedFullMonth.overtimePay.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Gross Pay:</span>
                      <span>KES {projection.projectedFullMonth.grossPay.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Total Deductions:</span>
                      <span>KES {projection.projectedFullMonth.deductions.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-green-600">
                      <span>Net Pay:</span>
                      <span>KES {projection.projectedFullMonth.netPay.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Year</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <Label>Month</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="All months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2024, i).toLocaleDateString('en-US', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {isAdmin && (
              <div className="flex-1">
                <Label>Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Processed">Processed</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payroll Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isAdmin ? 'All Payroll Records' : 'My Payroll History'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {isAdmin && <TableHead>Employee</TableHead>}
                <TableHead>Period</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Gross Pay</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(isAdmin ? allPayrolls?.payrolls : myPayrolls?.payrolls)?.map((payroll) => (
                <TableRow key={payroll._id}>
                  {isAdmin && (
                    <TableCell className="font-medium">
                      {payroll.employee?.fullName}
                    </TableCell>
                  )}
                  <TableCell>
                    {payroll.payPeriod.month}/{payroll.payPeriod.year}
                  </TableCell>
                  <TableCell>
                    KES {payroll.salaryBreakdown.basicSalary.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    KES {payroll.salaryBreakdown.grossPay.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    KES {payroll.deductions.totalDeductions.toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    KES {payroll.netPay.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={payroll.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(payroll)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {isAdmin && payroll.status !== 'Paid' && (
                        <Select
                          value={payroll.status}
                          onValueChange={(value) => handleStatusUpdate(payroll._id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Processed">Processed</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {!(isAdmin ? allPayrolls?.payrolls?.length : myPayrolls?.payrolls?.length) && (
            <div className="text-center py-8 text-muted-foreground">
              No payroll records found
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payroll Details Dialog */}
      <PayrollDetailsDialog
        payroll={selectedPayroll}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </div>
  );
};

export default PayRollPage;