"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useNotification } from '@/components/ui/sooner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash } from "lucide-react";

interface KnownAddress {
  label: string;
  description?: string;
  type: string;
  verified: boolean;
}

export default function KnownAddressesAdmin() {
  // Get the notification function at component level
  const showNotification = useNotification();
  
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [addresses, setAddresses] = useState<Record<string, KnownAddress>>({});
  const [loading, setLoading] = useState(false);
  
  // New address form state
  const [newAddress, setNewAddress] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newType, setNewType] = useState('other');
  const [newVerified, setNewVerified] = useState(false);
  
  // Edit mode
  const [editMode, setEditMode] = useState(false);
  
  // Authentication
  const login = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/known-addresses', {
        headers: {
          'Authorization': `Bearer ${password}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses);
        setAuthenticated(true);
        showNotification({
          type: "success", 
          message: "You're now logged into the admin panel"
        });
        
        // Store password in session
        sessionStorage.setItem('adminPassword', password);
      } else {
        showNotification({
          type: "error",
          message: "Invalid password"
        });
      }
    } catch {
      showNotification({
        type: "error",
        message: "Failed to authenticate"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Save new address
  const saveAddress = async () => {
    if (!newAddress || !newLabel || !newType) {
      showNotification({
        type: "error",
        message: "Please fill in all required fields"
      });
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/admin/known-addresses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${password}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: newAddress,
          data: {
            label: newLabel,
            description: newDescription,
            type: newType,
            verified: newVerified
          }
        })
      });
      
      if (response.ok) {
        // Update local state directly instead of refetching everything
        setAddresses(prev => ({
          ...prev,
          [newAddress]: {
            label: newLabel,
            description: newDescription,
            type: newType,
            verified: newVerified
          }
        }));
        
        // Show appropriate message
        showNotification({
          type: "success",
          message: editMode ? "Address updated successfully" : "Address added successfully"
        });
        
        // Reset form and exit edit mode
        setNewAddress('');
        setNewLabel('');
        setNewDescription('');
        setNewType('other');
        setNewVerified(false);
        setEditMode(false);
      } else {
        const data = await response.json();
        showNotification({
          type: "error",
          message: data.error || `Failed to ${editMode ? 'update' : 'add'} address`
        });
      }
    } catch {
      showNotification({
        type: "error",
        message: `Failed to ${editMode ? 'update' : 'add'} address`
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Edit existing address
  const editAddress = (address: string) => {
    const addressData = addresses[address];
    if (addressData) {
      setNewAddress(address);
      setNewLabel(addressData.label);
      setNewDescription(addressData.description || '');
      setNewType(addressData.type);
      setNewVerified(addressData.verified);
      setEditMode(true);
    }
  };
  
  // Cancel editing
  const cancelEdit = () => {
    setNewAddress('');
    setNewLabel('');
    setNewDescription('');
    setNewType('other');
    setNewVerified(false);
    setEditMode(false);
  };
  
  // Delete address
  const deleteAddress = async (address: string) => {
    if (!confirm(`Are you sure you want to delete the address "${address}"?`)) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/known-addresses?address=${address}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${password}`
        }
      });
      
      if (response.ok) {
        // Remove from local state
        const newAddresses = {...addresses};
        delete newAddresses[address];
        setAddresses(newAddresses);
        
        showNotification({
          type: "success",
          message: "Address deleted successfully"
        });
      } else {
        const data = await response.json();
        showNotification({
          type: "error",
          message: data.error || "Failed to delete address"
        });
      }
    } catch {
      showNotification({
        type: "error",
        message: "Failed to delete address"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Reload server
  const reloadServer = async () => {
    try {
      setLoading(true);
      showNotification({
        type: "info",
        message: "Reloading server to apply changes..."
      });
      
      // Add the authorization header
      await fetch('/api/admin/reload-server', { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${password}`
        }
      });
      
      setTimeout(() => {
        // Refresh the client after a short delay
        window.location.reload();
      }, 2000);
    } catch {
      showNotification({
        type: "error",
        message: "Failed to reload server"
      });
      setLoading(false);
    }
  };

  // Check for stored password and authenticate
  useEffect(() => {
    // Check if we have a stored password
    const storedPassword = sessionStorage.getItem('adminPassword');
    if (!storedPassword) {
      // If no password stored, redirect to login
      window.location.href = '/admin/login';
      return;
    }
    
    // Try to authenticate with stored password
    fetch('/api/admin/known-addresses', {
      headers: {
        'Authorization': `Bearer ${storedPassword}`
      }
    })
    .then(response => {
      if (response.ok) {
        return response.json().then(data => {
          setAddresses(data.addresses);
          setAuthenticated(true);
          setPassword(storedPassword);
        });
      } else {
        // Invalid stored password
        sessionStorage.removeItem('adminPassword');
        window.location.href = '/admin/login';
      }
    })
    .catch(error => {
      console.error('Error checking authentication:', error);
      window.location.href = '/admin/login';
    });
  }, []);
  
  if (!authenticated) {
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
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Known Addresses Admin</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{editMode ? 'Edit Address' : 'Add New Address'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">Address</label>
                <Input 
                  id="address"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="T..."
                  disabled={editMode} // This makes the address non-editable in edit mode
                  className={editMode ? "opacity-50" : ""} // Add visual cue that it's disabled
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="label" className="text-sm font-medium">Label</label>
                <Input 
                  id="label"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="Funding Address"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea 
                  id="description"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Optional description of this address"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="type" className="text-sm font-medium">Type</label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="developer">Developer</SelectItem>
                    <SelectItem value="exchange">Exchange</SelectItem>
                    <SelectItem value="funding">Funding</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="foundation">Foundation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="verified" 
                  checked={newVerified} 
                  onCheckedChange={(checked) => setNewVerified(!!checked)} 
                />
                <label htmlFor="verified" className="text-sm font-medium">Verified</label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            {editMode && (
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
            )}
            <Button onClick={saveAddress} disabled={loading}>
              {loading ? "Saving..." : (editMode ? "Update" : "Add")}
            </Button>
          </CardFooter>
        </Card>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Known Addresses</h2>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(addresses).map(([address, data]) => (
                  <TableRow key={address}>
                    <TableCell className="font-mono text-xs">
                      {address.substring(0, 8)}...{address.substring(address.length - 4)}
                    </TableCell>
                    <TableCell>{data.label}</TableCell>
                    <TableCell>{data.type}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => editAddress(address)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteAddress(address)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {Object.keys(addresses).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">
                      No known addresses yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
      
      <div className="mt-10">
        <Button 
          variant="outline" 
          onClick={reloadServer} 
          disabled={loading}
          className="ml-auto"
        >
          Reload Server
        </Button>
      </div>
    </div>
  );
}