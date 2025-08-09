// pages/login/LoginPage.tsx
import React, { useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "../../hooks/useLogin";

const LoginPage = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const { login, isLoading, isError, error } = useLogin()

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    login(form);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-4">
      <Card className="w-full max-w-md border shadow-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isError && (
              <p className="text-red-500 text-sm">{error?.message}</p>
            )}

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            <CardDescription className="text-xs text-muted-foreground flex items-center space-x-1">
              <span>⚠️</span>
              <span>
                Never share your password with anyone. We will never ask you for
                it.
              </span>
            </CardDescription>
          </CardContent>

          <CardFooter className="pt-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in…" : "Sign In"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default LoginPage;
