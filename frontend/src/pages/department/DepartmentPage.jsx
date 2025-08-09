// pages/department/DepartmentPage.jsx
import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { 
  Loader2, 
  Building2, 
  Plus, 
  MoreHorizontal, 
  Trash2, 
  Edit3, 
  Users, 
  AlertCircle 
} from "lucide-react";
import { 
  useDepartments, 
  useCreateDepartment, 
  useDeleteDepartment 
} from "../../hooks/useDepartments";
import { useAuth } from "../../hooks/useAuth";

// Department Card Component
const DepartmentCard = ({ department }) => {
  const { mutate: deleteDepartment, isLoading: isDeleting } = useDeleteDepartment();
  const { data: authUser } = useAuth();
  const isAdmin = authUser?.role === "admin";

  const handleDeleteDepartment = () => {
    if (
      window.confirm(
        `Are you sure you want to delete the "${department.name}" department? This action cannot be undone.`
      )
    ) {
      deleteDepartment(department._id);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">{department.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 mt-1">
                <Users className="h-4 w-4" />
                <span>Active Department</span>
              </CardDescription>
            </div>
          </div>
          
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Department
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-600"
                  onClick={handleDeleteDepartment}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Department
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {department.description}
        </p>
      </CardContent>

      <CardFooter className="bg-muted/50 pt-3">
        <div className="flex items-center justify-between w-full">
          <Badge variant="outline" className="text-xs">
            Department ID: {department._id.slice(-6)}
          </Badge>
          <div className="text-xs text-muted-foreground">
            Created: {new Date(department.createdAt).toLocaleDateString()}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
};

// Create Department Dialog Component
const CreateDepartmentDialog = ({ isOpen, onOpenChange }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const { createDepartment, isLoading } = useCreateDepartment();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.description.trim()) {
      return;
    }

    createDepartment(formData, {
      onSuccess: () => {
        setFormData({ name: "", description: "" });
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Department</DialogTitle>
          <DialogDescription>
            Add a new department to your organization structure.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Department Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Human Resources"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Brief description of the department's role and responsibilities..."
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              required
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
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
                  Create Department
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Skeleton Card Component for Loading State
const SkeletonDepartmentCard = () => {
  return (
    <Card className="border-l-4 border-l-gray-200 animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-200 rounded-lg w-9 h-9"></div>
            <div>
              <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </CardContent>

      <CardFooter className="bg-muted/50 pt-3">
        <div className="flex items-center justify-between w-full">
          <div className="h-5 bg-gray-200 rounded w-24"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </CardFooter>
    </Card>
  );
};

// Main Department Page Component
const DepartmentPage = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const {
    data: departmentsData,
    isLoading,
    isError,
    error,
  } = useDepartments();
  
  const { data: authUser } = useAuth();
  const isAdmin = authUser?.role === "admin";

  // Filter departments based on search term
  const filteredDepartments = departmentsData?.departments?.filter(department =>
    department.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    department.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Loading state with skeleton cards
  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Department Management</h1>
            <div className="mt-2 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
          </div>
          <div className="h-10 bg-gray-200 rounded w-36 animate-pulse"></div>
        </div>

        {/* Search Bar Skeleton */}
        <div className="mb-6">
          <div className="h-10 bg-gray-200 rounded w-full max-w-md animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonDepartmentCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container max-w-2xl py-8 mx-auto">
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <span>{error.message || "Failed to load departments"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Department Management</h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <span>
              {departmentsData?.departments?.length || 0} departments in your organization
            </span>
          </p>
        </div>

        {isAdmin && (
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Department
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            type="text"
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((department) => (
          <DepartmentCard key={department._id} department={department} />
        ))}
      </div>

      {/* Empty State */}
      {filteredDepartments.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? "No departments found" : "No departments yet"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm 
              ? "Try adjusting your search terms" 
              : "Get started by creating your first department"
            }
          </p>
          {isAdmin && !searchTerm && (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Department
            </Button>
          )}
        </div>
      )}

      {/* Create Department Dialog */}
      <CreateDepartmentDialog 
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
};

export default DepartmentPage;