// pages/leavePage.jsx
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
import { Badge } from "../../components/ui/badge";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Loader2, Calendar, Clock, AlertCircle, Trash2, Plus } from "lucide-react";
import {
  useLeaveTypes,
  useToggleLeave,
  useMyLeaveRequests,
  useCreateLeaveType,
  useDeleteLeaveType,
} from "../../hooks/useLeave";
import { useAuth } from "../../hooks/useAuth";

// Create Leave Type Dialog Component
const CreateLeaveTypeDialog = ({ isOpen, onOpenChange }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    maxDays: "",
    requiresApproval: true,
  });

  const { createLeaveType, isLoading } = useCreateLeaveType();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all fields
    const requiredFields = ['name', 'description', 'maxDays'];
    const missingFields = requiredFields.filter(field => !formData[field].toString().trim());
    
    if (missingFields.length > 0) {
      return;
    }

    // Convert maxDays to number
    const submitData = {
      ...formData,
      maxDays: parseInt(formData.maxDays, 10),
    };

    createLeaveType(submitData, {
      onSuccess: () => {
        setFormData({
          name: "",
          description: "",
          maxDays: "",
          requiresApproval: true,
        });
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

  const handleRequiresApprovalChange = (value) => {
    setFormData(prev => ({
      ...prev,
      requiresApproval: value === "true"
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Leave Type</DialogTitle>
          <DialogDescription>
            Create a new leave type for your organization.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Leave Type Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g., Annual Leave, Sick Leave"
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
              placeholder="Describe when this leave type should be used..."
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxDays">Maximum Days</Label>
              <Input
                id="maxDays"
                name="maxDays"
                type="number"
                placeholder="30"
                min="1"
                max="365"
                value={formData.maxDays}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="requiresApproval">Approval Required</Label>
              <Select 
                value={formData.requiresApproval.toString()} 
                onValueChange={handleRequiresApprovalChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select approval type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Requires Approval</SelectItem>
                  <SelectItem value="false">Auto-approve</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                  Create Leave Type
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const LeaveTypeCard = ({ leave, activeRequests }) => {
  const { toggleLeave, isLoading } = useToggleLeave();
  const { mutate: deleteLeaveType, isLoading: isDeleting } = useDeleteLeaveType();
  const { data: authUser } = useAuth();
  const isAdmin = authUser?.role === "admin";

  const isApplied = Boolean(
    activeRequests?.some(
      (request) =>
        request.leaveType._id === leave._id &&
        ["Pending", "Approved"].includes(request.status)
    )
  );

  const handleToggleLeave = () => {
    toggleLeave(leave._id);
  };

  const handleDeleteLeave = () => {
    if (
      window.confirm(
        `Are you sure you want to delete the "${leave.name}" leave type?`
      )
    ) {
      deleteLeaveType(leave._id);
    }
  };

  return (
    <Card
      className="flex justify-between overflow-hidden transition-all hover:shadow-lg border-t-4 max-w-2xl"
      style={{ borderTopColor: getLeaveTypeColor(leave.name) }}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-bold">{leave.name}</CardTitle>
            <CardDescription className="mt-1 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Max {leave.maxDays} days</span>
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Badge
              variant={leave.requiresApproval ? "default" : "secondary"}
              className="shrink-0"
            >
              {leave.requiresApproval ? "Approval Needed" : "Auto-approve"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground leading-relaxed mb-2">
          {leave.description}
        </p>
        {isApplied && <Badge variant="outline">Applied</Badge>}
      </CardContent>

      <CardFooter className="bg-muted/50 pt-2 pb-2">
        <div className="w-full flex gap-2">
          <Button
            className="flex-1 cursor-pointer"
            variant={isApplied ? "destructive" : "default"}
            size="sm"
            onClick={handleToggleLeave}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isApplied ? (
              `Cancel ${leave.name}`
            ) : (
              `Apply for ${leave.name}`
            )}
          </Button>

          {isAdmin && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteLeave}
              disabled={isDeleting}
              className="cursor-pointer flex-shrink-0"
              title="Delete leave type"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

// Skeleton Card Component for Loading State
const SkeletonLeaveCard = () => {
  return (
    <Card className="overflow-hidden border-t-4 border-gray-200 animate-pulse">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="flex items-center gap-1">
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
          <div className="h-6 bg-gray-200 rounded-full w-24"></div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-4/5"></div>
        </div>
        <div className="h-5 bg-gray-200 rounded w-16"></div>
      </CardContent>

      <CardFooter className="bg-muted/50 pt-2 pb-2">
        <div className="w-full flex gap-2">
          <div className="flex-1 h-8 bg-gray-200 rounded"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
      </CardFooter>
    </Card>
  );
};

// Function to generate consistent colors based on leave type name
function getLeaveTypeColor(leaveName) {
  const colorMap = {
    "Annual Leave": "#22c55e",
    "Sick Leave": "#ef4444",
    "Maternity Leave": "#ec4899",
    "Paternity Leave": "#3b82f6",
    "Study Leave": "#8b5cf6",
    "Unpaid Leave": "#64748b",
    "Bereavement Leave": "#6b7280",
    "Work From Home": "#0ea5e9",
    "Compensatory Off": "#f97316",
  };
  return colorMap[leaveName] || "#6366f1";
}

const LeavePage = () => {
  const {
    data: leaveTypesData,
    isLoading: isLoadingTypes,
    isError: isTypesError,
    error: typesError,
  } = useLeaveTypes();
  const { data: myLeavesData, isLoading: isLoadingMyLeaves } = useMyLeaveRequests();
  const { data: authUser } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const isAdmin = authUser?.role === "admin";
  const isLoading = isLoadingTypes || isLoadingMyLeaves;

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Leave Types</h1>
            <div className="mt-2 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div className="h-5 bg-gray-200 rounded w-64 animate-pulse"></div>
            </div>
          </div>
          <div className="h-6 bg-gray-200 rounded-full w-32 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <SkeletonLeaveCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isTypesError) {
    return (
      <div className="container max-w-2xl py-8 mx-auto">
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5" />
          <span>{typesError.message || "Failed to load leave types"}</span>
        </div>
      </div>
    );
  }

  const activeRequests =
    myLeavesData?.leaveRequests?.filter((request) =>
      ["Pending", "Approved"].includes(request.status)
    ) || [];

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Types</h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span>
              {leaveTypesData?.count} types of leave available for your use
            </span>
          </p>
        </div>

        <div className="flex items-center gap-4">
          {activeRequests.length > 0 && (
            <Badge variant="secondary" className="py-1 px-2">
              {activeRequests.length} Active Request
              {activeRequests.length !== 1 ? "s" : ""}
            </Badge>
          )}

          {isAdmin && (
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Leave Type
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leaveTypesData?.leaveTypes?.map((leave) => (
          <LeaveTypeCard
            key={leave._id}
            leave={leave}
            activeRequests={activeRequests}
          />
        ))}
        
        {leaveTypesData?.leaveTypes?.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-500 mb-4">
              No leave types have been created yet.
            </div>
            {isAdmin && (
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                variant="outline"
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="h-4 w-4" />
                Create First Leave Type
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Create Leave Type Dialog */}
      <CreateLeaveTypeDialog 
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
};

export default LeavePage;