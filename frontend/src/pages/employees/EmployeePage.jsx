import React, { useState } from "react";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { ChevronDown, MoreHorizontal, Plus, Loader2, Users, Eye, Edit, Trash2, X } from "lucide-react";
import { useGetAllEmployees, useCreateEmployee, useDeleteEmployee, useUpdateEmployee, useGetEmployee } from "../../hooks/useEmployees.js";
import { useDepartments } from "../../hooks/useDepartments";
import { useAuth } from "../../hooks/useAuth";

// View Employee Dialog Component
const ViewEmployeeDialog = ({ employeeId, isOpen, onOpenChange }) => {
  const { employee, isLoading } = useGetEmployee(employeeId);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Employee Details</DialogTitle>
          <DialogDescription>
            View detailed information about the employee.
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : employee ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-semibold text-lg">
                {employee.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold">{employee.fullName}</h3>
                <p className="text-sm text-gray-600">{employee.position}</p>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-semibold mt-1 ${
                    employee.employeeStatus === "Active"
                      ? "bg-green-100 text-green-800"
                      : employee.employeeStatus === "On Leave"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {employee.employeeStatus}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">Email</Label>
                <p className="mt-1">{employee.email}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Phone Number</Label>
                <p className="mt-1">{employee.phoneNumber}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Department</Label>
                <p className="mt-1">{employee.department?.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Basic Salary</Label>
                <p className="mt-1 font-semibold">${employee.basicSalary?.toLocaleString()}</p>
              </div>
              <div className="col-span-2">
                <Label className="text-sm font-medium text-gray-500">Employee ID</Label>
                <p className="mt-1 font-mono text-sm">{employee._id}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Joined Date</Label>
                <p className="mt-1">{new Date(employee.createdAt).toLocaleDateString()}</p>
              </div>
              {employee.updatedAt && employee.updatedAt !== employee.createdAt && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                  <p className="mt-1">{new Date(employee.updatedAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Employee not found
          </div>
        )}
        
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Edit Employee Dialog Component
const EditEmployeeDialog = ({ employeeId, isOpen, onOpenChange }) => {
  const { employee, isLoading: fetchingEmployee } = useGetEmployee(employeeId);
  const { updateEmployee, isLoading: updating } = useUpdateEmployee();
  const { data: departmentsData } = useDepartments();
  
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    phoneNumber: "",
    position: "",
    departmentName: "",
    basicSalary: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // Update form data when employee data is loaded
  React.useEffect(() => {
    if (employee) {
      setFormData({
        email: employee.email || "",
        fullName: employee.fullName || "",
        phoneNumber: employee.phoneNumber || "",
        position: employee.position || "",
        departmentName: employee.department?.name || "",
        basicSalary: employee.basicSalary?.toString() || "",
      });
    }
  }, [employee]);

  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) errors.email = "Email is required";
    if (!formData.fullName.trim()) errors.fullName = "Full Name is required";
    if (!formData.phoneNumber.trim()) errors.phoneNumber = "Phone Number is required";
    if (!formData.position.trim()) errors.position = "Position is required";
    if (!formData.departmentName.trim()) errors.departmentName = "Department is required";
    if (formData.basicSalary === "" || isNaN(formData.basicSalary) || parseFloat(formData.basicSalary) < 0) {
      errors.basicSalary = "Basic Salary must be a positive number";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    updateEmployee(
      { id: employeeId, data: { ...formData, basicSalary: Number(formData.basicSalary) } },
      {
        onSuccess: () => {
          onOpenChange(false);
          setFormErrors({});
        },
      }
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setFormErrors(prev => ({
      ...prev,
      [name]: undefined
    }));
  };

  const handleDepartmentChange = (value) => {
    setFormData(prev => ({
      ...prev,
      departmentName: value
    }));
    setFormErrors(prev => ({
      ...prev,
      departmentName: undefined
    }));
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
          <DialogDescription>
            Update employee information.
          </DialogDescription>
        </DialogHeader>
        
        {fetchingEmployee ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : employee ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder="John Doe"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.fullName && <p className="text-red-500 text-sm">{formErrors.fullName}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john.doe@company.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  name="phoneNumber"
                  placeholder="+1234567890"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.phoneNumber && <p className="text-red-500 text-sm">{formErrors.phoneNumber}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  name="position"
                  placeholder="Software Engineer"
                  value={formData.position}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.position && <p className="text-red-500 text-sm">{formErrors.position}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={formData.departmentName} onValueChange={handleDepartmentChange} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentsData?.departments?.map((dept) => (
                      <SelectItem key={dept._id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.departmentName && <p className="text-red-500 text-sm">{formErrors.departmentName}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="basicSalary">Basic Salary</Label>
                <Input
                  id="basicSalary"
                  name="basicSalary"
                  type="number"
                  placeholder="e.g., 50000"
                  value={formData.basicSalary}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.basicSalary && <p className="text-red-500 text-sm">{formErrors.basicSalary}</p>}
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  onOpenChange(false);
                  setFormErrors({});
                }}
                disabled={updating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit className="mr-2 h-4 w-4" />
                    Update Employee
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Employee not found
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Delete Confirmation Dialog Component
const DeleteEmployeeDialog = ({ employee, isOpen, onOpenChange }) => {
  const { deleteEmployee, isLoading } = useDeleteEmployee();

  const handleDelete = () => {
    deleteEmployee(employee._id, {
      onSuccess: () => {
        onOpenChange(false);
      },
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Employee</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{employee?.fullName}</strong>? 
            This action cannot be undone and will remove all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Employee
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Create Employee Dialog Component
const CreateEmployeeDialog = ({ isOpen, onOpenChange }) => {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    password: "",
    phoneNumber: "",
    position: "",
    departmentName: "",
    basicSalary: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const { createEmployee, isLoading } = useCreateEmployee();
  const { data: departmentsData } = useDepartments();

  const validateForm = () => {
    const errors = {};
    if (!formData.email.trim()) errors.email = "Email is required";
    if (!formData.fullName.trim()) errors.fullName = "Full Name is required";
    if (!formData.password.trim()) errors.password = "Password is required";
    if (!formData.phoneNumber.trim()) errors.phoneNumber = "Phone Number is required";
    if (!formData.position.trim()) errors.position = "Position is required";
    if (!formData.departmentName.trim()) errors.departmentName = "Department is required";
    if (formData.basicSalary === "" || isNaN(formData.basicSalary) || parseFloat(formData.basicSalary) < 0) {
      errors.basicSalary = "Basic Salary must be a positive number";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    createEmployee(formData, {
      onSuccess: () => {
        setFormData({
          email: "",
          fullName: "",
          password: "",
          phoneNumber: "",
          position: "",
          departmentName: "",
          basicSalary: "",
        });
        setFormErrors({});
        onOpenChange(false);
      },
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setFormErrors(prev => ({
      ...prev,
      [name]: undefined
    }));
  };

  const handleDepartmentChange = (value) => {
    setFormData(prev => ({
      ...prev,
      departmentName: value
    }));
    setFormErrors(prev => ({
      ...prev,
      departmentName: undefined
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
          <DialogDescription>
            Register a new employee in your organization.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleInputChange}
                required
              />
              {formErrors.fullName && <p className="text-red-500 text-sm">{formErrors.fullName}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="john.doe@company.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                placeholder="+1234567890"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                required
              />
              {formErrors.phoneNumber && <p className="text-red-500 text-sm">{formErrors.phoneNumber}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
              {formErrors.password && <p className="text-red-500 text-sm">{formErrors.password}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                name="position"
                placeholder="Software Engineer"
                value={formData.position}
                onChange={handleInputChange}
                required
              />
              {formErrors.position && <p className="text-red-500 text-sm">{formErrors.position}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select value={formData.departmentName} onValueChange={handleDepartmentChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departmentsData?.departments?.map((dept) => (
                    <SelectItem key={dept._id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.departmentName && <p className="text-red-500 text-sm">{formErrors.departmentName}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="basicSalary">Basic Salary</Label>
            <Input
              id="basicSalary"
              name="basicSalary"
              type="number"
              placeholder="e.g., 50000"
              value={formData.basicSalary}
              onChange={handleInputChange}
              required
            />
            {formErrors.basicSalary && <p className="text-red-500 text-sm">{formErrors.basicSalary}</p>}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                onOpenChange(false);
                setFormErrors({});
                setFormData({
                  email: "",
                  fullName: "",
                  password: "",
                  phoneNumber: "",
                  position: "",
                  departmentName: "",
                  basicSalary: "",
                });
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Employee
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Skeleton Component for Loading State
const EmployeesTableSkeleton = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-2"></div>
          <div className="h-5 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>

      <div className="rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
              </TableHead>
              <TableHead>
                <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
              </TableHead>
              <TableHead>
                <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
              </TableHead>
              <TableHead>
                <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
              </TableHead>
              <TableHead>
                <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
              </TableHead>
              <TableHead>
                <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 8 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-40 animate-pulse"></div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded w-28 animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

const EmployeesPage = () => {
  const { employees, isLoading, isError, error } = useGetAllEmployees();
  const { data: authUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewEmployeeId, setViewEmployeeId] = useState(null);
  const [editEmployeeId, setEditEmployeeId] = useState(null);
  const [deleteEmployee, setDeleteEmployee] = useState(null);

  const isAdmin = authUser?.role === "admin";

  if (isLoading) {
    return <EmployeesTableSkeleton />;
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center h-full text-red-500">
        Error: {error.message}
      </div>
    );
  }

  // Filter employees based on search term, department, and status
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch = employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          employee.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = selectedDepartment === "All" || employee.department.name === selectedDepartment;
    const matchesStatus = selectedStatus === "All" || employee.employeeStatus === selectedStatus;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  // Extract unique departments for the filter dropdown
  const uniqueDepartments = [
    "All",
    ...new Set(employees.map((employee) => employee.department.name)),
  ];

  // Extract unique statuses for the filter dropdown
  const uniqueStatuses = [
    "All",
    ...new Set(employees.map((employee) => employee.employeeStatus)),
  ];

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Employee Management</h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span>{employees.length} employees in your organization</span>
          </p>
        </div>

        {isAdmin && (
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Search and Filter Section */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search employees..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </span>
        </div>

        {/* Department Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              {selectedDepartment} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {uniqueDepartments.map((dept) => (
              <DropdownMenuItem
                key={dept}
                onClick={() => setSelectedDepartment(dept)}
              >
                {dept}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              {selectedStatus} <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {uniqueStatuses.map((status) => (
              <DropdownMenuItem
                key={status}
                onClick={() => setSelectedStatus(status)}
              >
                {status}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Employee Table */}
      <div className="rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow key={employee._id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-semibold text-sm">
                      {employee.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium">{employee.fullName}</div>
                      <div className="text-sm text-gray-500">
                        {employee.email}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{employee.department.name}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>${employee.basicSalary?.toLocaleString()}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      employee.employeeStatus === "Active"
                        ? "bg-green-100 text-green-800"
                        : employee.employeeStatus === "On Leave"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {employee.employeeStatus}
                  </span>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setViewEmployeeId(employee._id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View employee
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuItem onClick={() => setEditEmployeeId(employee._id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit employee
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => setDeleteEmployee(employee)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete employee
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {filteredEmployees.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="text-gray-500">
                    {searchTerm || selectedDepartment !== "All" || selectedStatus !== "All" 
                      ? "No employees found matching your criteria." 
                      : "No employees yet."
                    }
                  </div>
                  {isAdmin && !searchTerm && selectedDepartment === "All" && selectedStatus === "All" && (
                    <Button 
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="mt-4"
                      variant="outline"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add First Employee
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <CreateEmployeeDialog 
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <ViewEmployeeDialog 
        employeeId={viewEmployeeId}
        isOpen={!!viewEmployeeId}
        onOpenChange={(open) => !open && setViewEmployeeId(null)}
      />

      <EditEmployeeDialog 
        employeeId={editEmployeeId}
        isOpen={!!editEmployeeId}
        onOpenChange={(open) => !open && setEditEmployeeId(null)}
      />

      <DeleteEmployeeDialog 
        employee={deleteEmployee}
        isOpen={!!deleteEmployee}
        onOpenChange={(open) => !open && setDeleteEmployee(null)}
      />
    </div>
  );
};

export default EmployeesPage;