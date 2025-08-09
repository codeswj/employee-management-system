import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Mail, User, Calendar, Building } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "../../components/ui/avatar";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Skeleton } from "../../components/ui/skeleton";
import { useAuth } from "../../hooks/useAuth";

const ProfilePage = () => {
  const { data: authUser, isLoading } = useAuth();
  const [selectedImg, setSelectedImg] = useState(null);
  const queryClient = useQueryClient();

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData) => {
      const response = await fetch("/api/users/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });
      if (!response.ok) throw new Error("Failed to update profile");
      return response.json();
    },
    onSuccess: () => {
      // Invalidate auth query to refresh user data
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      updateProfileMutation.mutate({ profilePic: base64Image });
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Skeleton className="h-[200px] w-[400px]" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8 mx-auto px-4 sm:px-6 lg:px-8"> {/* Added mx-auto and more padding */}
      <Card className="w-full"> {/* Ensured card takes full width of its container */}
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Profile Information</CardTitle>
          <CardDescription>
            Manage your account settings and view profile details
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-32 h-32">
                <AvatarImage
                  src={selectedImg || authUser?.profilePic || "/avatar.png"}
                  alt={authUser?.fullName}
                />
                <AvatarFallback>
                  {authUser?.fullName?.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <Label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-background p-2 rounded-full cursor-pointer border hover:scale-105 transition-all"
              >
                <Camera className="w-5 h-5" />
                <Input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={updateProfileMutation.isPending}
                />
              </Label>
            </div>

            {updateProfileMutation.isPending && (
              <p className="text-muted-foreground text-sm">Uploading...</p>
            )}
          </div>

          {/* User Info Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </Label>
              <Card className="p-4">
                <p>{authUser?.fullName}</p>
              </Card>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Card className="p-4">
                <p>{authUser?.email}</p>
              </Card>
            </div>

            {authUser?.department && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Department
                </Label>
                <Card className="p-4">
                  <p>{authUser.department.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {authUser.department.description}
                  </p>
                </Card>
              </div>
            )}
          </div>

          {/* Account Info Section */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Member Since</span>
                <span className="text-muted-foreground">
                  {authUser?.createdAt && format(new Date(authUser.createdAt), "MMM dd, yyyy")}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Account Status</span>
                <span className="text-green-500">{authUser?.employeeStatus}</span>
              </div>

              <div className="flex justify-between items-center">
                <span>Role</span>
                <span className="text-muted-foreground capitalize">
                  {authUser?.role}
                </span>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;