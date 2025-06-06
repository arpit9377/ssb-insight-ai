import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useAuth, useUser } from '@clerk/clerk-react';
import StatsCards from '@/components/admin/StatsCards';
import ImageUploadForm from '@/components/admin/ImageUploadForm';
import WordUploadForm from '@/components/admin/WordUploadForm';
import SituationUploadForm from '@/components/admin/SituationUploadForm';
import ContentManagement from '@/components/admin/ContentManagement';

const AdminDashboard = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTests: 0,
    activeSubscriptions: 0,
    revenue: 0,
    clerkUsers: 0,
  });
  const [users, setUsers] = useState([]);
  const [testImages, setTestImages] = useState([]);
  const [watWords, setWatWords] = useState([]);
  const [srtSituations, setSrtSituations] = useState([]);

  useEffect(() => {
    loadStats();
    loadUsers();
    loadTestImages();
    loadWatWords();
    loadSrtSituations();
    loadClerkUsers();
    createUserProfileIfNeeded();
  }, [user]);

  const createUserProfileIfNeeded = async () => {
    if (!user) return;

    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!existingProfile) {
        // Create new profile with proper user_id (not UUID format)
        const { error } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id, // Use Clerk user ID directly
            email: user.primaryEmailAddress?.emailAddress || '',
            full_name: user.fullName || '',
            subscription_status: 'free'
          });

        if (error) {
          console.error('Error creating user profile:', error);
        } else {
          console.log('User profile created successfully');
          loadStats(); // Refresh stats after creating profile
        }
      }
    } catch (error) {
      console.error('Error checking/creating user profile:', error);
    }
  };

  const loadClerkUsers = async () => {
    try {
      const token = await getToken();
      if (!token) {
        console.log('No token available, using fallback count');
        // Fallback: just use a basic count since we have at least one user (the current user)
        setStats(prev => ({ ...prev, clerkUsers: 1 }));
        return;
      }

      // Try to get user count from Clerk API
      const response = await fetch('https://api.clerk.com/v1/users?limit=1', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const totalCount = parseInt(response.headers.get('x-total-count') || '1');
        setStats(prev => ({ ...prev, clerkUsers: totalCount }));
      } else {
        console.log('Clerk API request failed, using fallback');
        setStats(prev => ({ ...prev, clerkUsers: 1 }));
      }
    } catch (error) {
      console.error('Error loading Clerk users:', error);
      // Fallback: use profile count or minimum of 1
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });
      setStats(prev => ({ ...prev, clerkUsers: Math.max(count || 0, 1) }));
    }
  };

  const loadStats = async () => {
    try {
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: testCount } = await supabase
        .from('user_responses')
        .select('*', { count: 'exact', head: true });

      const { count: subCount } = await supabase
        .from('subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setStats(prev => ({
        ...prev,
        totalUsers: userCount || 0,
        totalTests: testCount || 0,
        activeSubscriptions: subCount || 0,
        revenue: (subCount || 0) * 499,
      }));
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

  const loadWatWords = async () => {
    try {
      const { data, error } = await supabase
        .from('wat_words')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setWatWords(data);
      }
    } catch (error) {
      console.error('Error loading WAT words:', error);
    }
  };

  const loadSrtSituations = async () => {
    try {
      const { data, error } = await supabase
        .from('srt_situations')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setSrtSituations(data);
      }
    } catch (error) {
      console.error('Error loading SRT situations:', error);
    }
  };

  const refreshContent = () => {
    loadTestImages();
    loadWatWords();
    loadSrtSituations();
    loadStats();
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your PsychSir.ai platform</p>
      </div>

      <StatsCards stats={stats} />

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">Upload Materials</TabsTrigger>
          <TabsTrigger value="manage">Manage Content</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ImageUploadForm onImageUploaded={refreshContent} />
            <WordUploadForm onWordAdded={refreshContent} wordCount={watWords.length} />
            <SituationUploadForm onSituationAdded={refreshContent} situationCount={srtSituations.length} />
          </div>
        </TabsContent>

        <TabsContent value="manage">
          <ContentManagement 
            testImages={testImages}
            watWords={watWords}
            srtSituations={srtSituations}
            onContentDeleted={refreshContent}
          />
        </TabsContent>

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

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Platform performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Content Statistics</h3>
                  <p className="text-sm text-gray-600">PPDT Images: {testImages.filter(img => img.test_type === 'ppdt').length}</p>
                  <p className="text-sm text-gray-600">TAT Images: {testImages.filter(img => img.test_type === 'tat').length}</p>
                  <p className="text-sm text-gray-600">WAT Words: {watWords.length}</p>
                  <p className="text-sm text-gray-600">SRT Situations: {srtSituations.length}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">User Engagement</h3>
                  <p className="text-sm text-gray-600">Total Clerk Users: {stats.clerkUsers}</p>
                  <p className="text-sm text-gray-600">Profile Users: {stats.totalUsers}</p>
                  <p className="text-sm text-gray-600">Completion Rate: {stats.totalUsers > 0 ? Math.round((stats.totalTests / stats.totalUsers) * 100) : 0}%</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Revenue</h3>
                  <p className="text-sm text-gray-600">Active Subscriptions: {stats.activeSubscriptions}</p>
                  <p className="text-sm text-gray-600">Monthly Revenue: ₹{stats.revenue.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Conversion Rate: {stats.clerkUsers > 0 ? Math.round((stats.activeSubscriptions / stats.clerkUsers) * 100) : 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
