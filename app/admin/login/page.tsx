"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotification } from '@/components/ui/sooner';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  // Get the notification function at component level
  const showNotification = useNotification();
  
  const login = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/known-addresses', {
        headers: {
          'Authorization': `Bearer ${password.trim()}`
        }
      });
      
      if (response.ok) {
        // Store password in session storage first
        sessionStorage.setItem('adminPassword', password);
        
        // Set a cookie that the middleware can check
        document.cookie = "adminAuthenticated=true; path=/; max-age=86400"; // 24 hours
        
        // Show notification
        showNotification({
          type: "success",
          message: "You're now logged into the admin panel"
        });
        
        // Add a small delay before redirect to ensure notification displays
        setTimeout(() => {
          // Use Next.js router for a client-side redirect
          router.push('/admin/known-addresses');
        }, 500);
      } else {
        showNotification({
          type: "error",
          message: "Invalid password"
        });
      }
    } catch (error) {
      showNotification({
        type: "error",
        message: "Failed to authenticate"
      });
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto max-w-md py-10">
      <Card>
        <CardHeader>
          <CardTitle>Admin Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">Password</label>
              <Input 
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                onKeyDown={(e) => e.key === 'Enter' && login()}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={login} disabled={loading}>
            {loading ? "Authenticating..." : "Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}