
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TestTube, BarChart3, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTests: 0,
    activeSubscriptions: 0,
    revenue: 0,
  });
  const [users, setUsers] = useState([]);
  const [testImages, setTestImages] = useState([]);

  useEffect(() => {
    loadStats();
    loadUsers();
    loadTestImages();
  }, []);

  const loadStats = async () => {
    try {
      // Load user count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Load test responses count
      const { count: testCount } = await supabase
        .from('user_responses')
        .select('*', { count: 'exact', head: true });

      // Load active subscriptions
      const { count: subCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setStats({
        totalUsers: userCount || 0,
        totalTests: testCount || 0,
        activeSubscriptions: subCount || 0,
        revenue: (subCount || 0) * 499, // Approximate revenue
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (data) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadTestImages = async () => {
    try {
      const { data, error } = await supabase
        .from('test_images')
        .select('*')
        .order('test_type', { ascending: true });

      if (data) {
        setTestImages(data);
      }
    } catch (error) {
      console.error('Error loading test images:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your PsychSir.ai platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Completed</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.revenue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="tests">Test Materials</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Recent Users</CardTitle>
              <CardDescription>Latest user registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user: any) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{user.full_name || 'No name'}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        Joined: {new Date(user.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm font-medium capitalize">{user.subscription_status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tests">
          <Card>
            <CardHeader>
              <CardTitle>Test Materials</CardTitle>
              <CardDescription>Manage test images and prompts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button>Add New Test Image</Button>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testImages.map((image: any) => (
                    <div key={image.id} className="border rounded-lg p-4">
                      <img 
                        src={image.image_url} 
                        alt="Test" 
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                      <p className="font-medium">{image.test_type.toUpperCase()}</p>
                      <p className="text-sm text-gray-600">Sequence: {image.sequence_number}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Platform performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Analytics dashboard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Configure system settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="maxTests">Max Tests Per Day (Free Users)</Label>
                  <Input id="maxTests" type="number" defaultValue="3" />
                </div>
                <div>
                  <Label htmlFor="aiModel">AI Model</Label>
                  <Input id="aiModel" defaultValue="gpt-4" />
                </div>
                <Button>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
