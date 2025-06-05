
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, TestTube, BarChart3, Settings, Upload, Trash2, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTests: 0,
    activeSubscriptions: 0,
    revenue: 0,
  });
  const [users, setUsers] = useState([]);
  const [testImages, setTestImages] = useState([]);
  const [watWords, setWatWords] = useState([]);
  const [srtSituations, setSrtSituations] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Form states
  const [newImage, setNewImage] = useState({
    testType: 'ppdt',
    prompt: '',
    imageFile: null as File | null,
  });
  const [newWord, setNewWord] = useState('');
  const [newSituation, setNewSituation] = useState('');

  useEffect(() => {
    loadStats();
    loadUsers();
    loadTestImages();
    loadWatWords();
    loadSrtSituations();
  }, []);

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

      setStats({
        totalUsers: userCount || 0,
        totalTests: testCount || 0,
        activeSubscriptions: subCount || 0,
        revenue: (subCount || 0) * 499,
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

  const handleImageUpload = async () => {
    if (!newImage.imageFile || !newImage.prompt) {
      toast.error('Please select an image and enter a prompt');
      return;
    }

    setIsUploading(true);
    try {
      // Upload image to Supabase Storage
      const fileExt = newImage.imageFile.name.split('.').pop();
      const fileName = `${newImage.testType}_${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('test-images')
        .upload(fileName, newImage.imageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('test-images')
        .getPublicUrl(fileName);

      // Save to database
      const { error: dbError } = await supabase
        .from('test_images')
        .insert({
          test_type: newImage.testType,
          image_url: urlData.publicUrl,
          prompt: newImage.prompt,
          sequence_number: testImages.filter(img => img.test_type === newImage.testType).length + 1,
          is_active: true,
        });

      if (dbError) throw dbError;

      toast.success('Image uploaded successfully!');
      setNewImage({ testType: 'ppdt', prompt: '', imageFile: null });
      loadTestImages();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddWatWord = async () => {
    if (!newWord.trim()) {
      toast.error('Please enter a word');
      return;
    }

    try {
      const { error } = await supabase
        .from('wat_words')
        .insert({
          word: newWord.trim(),
          is_active: true,
        });

      if (error) throw error;

      toast.success('Word added successfully!');
      setNewWord('');
      loadWatWords();
    } catch (error) {
      console.error('Error adding word:', error);
      toast.error('Failed to add word');
    }
  };

  const handleAddSrtSituation = async () => {
    if (!newSituation.trim()) {
      toast.error('Please enter a situation');
      return;
    }

    try {
      const { error } = await supabase
        .from('srt_situations')
        .insert({
          situation: newSituation.trim(),
          is_active: true,
        });

      if (error) throw error;

      toast.success('Situation added successfully!');
      setNewSituation('');
      loadSrtSituations();
    } catch (error) {
      console.error('Error adding situation:', error);
      toast.error('Failed to add situation');
    }
  };

  const deleteTestImage = async (id: string) => {
    try {
      const { error } = await supabase
        .from('test_images')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Image deleted successfully!');
      loadTestImages();
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
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

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList>
          <TabsTrigger value="upload">Upload Materials</TabsTrigger>
          <TabsTrigger value="manage">Manage Content</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Image Upload for PPDT/TAT */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Test Images</CardTitle>
                <CardDescription>Add images for PPDT and TAT tests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="testType">Test Type</Label>
                  <Select value={newImage.testType} onValueChange={(value) => setNewImage({...newImage, testType: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ppdt">PPDT</SelectItem>
                      <SelectItem value="tat">TAT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="imageFile">Image File</Label>
                  <Input
                    id="imageFile"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewImage({...newImage, imageFile: e.target.files?.[0] || null})}
                  />
                </div>
                <div>
                  <Label htmlFor="prompt">Prompt/Description</Label>
                  <Textarea
                    id="prompt"
                    value={newImage.prompt}
                    onChange={(e) => setNewImage({...newImage, prompt: e.target.value})}
                    placeholder="Enter prompt or description for this image..."
                  />
                </div>
                <Button onClick={handleImageUpload} disabled={isUploading}>
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </Button>
              </CardContent>
            </Card>

            {/* WAT Words */}
            <Card>
              <CardHeader>
                <CardTitle>Add WAT Words</CardTitle>
                <CardDescription>Add words for Word Association Test</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="watWord">Word</Label>
                  <Input
                    id="watWord"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder="Enter a word..."
                  />
                </div>
                <Button onClick={handleAddWatWord}>
                  <Upload className="h-4 w-4 mr-2" />
                  Add Word
                </Button>
                <div className="text-sm text-gray-600">
                  Total WAT words: {watWords.length}
                </div>
              </CardContent>
            </Card>

            {/* SRT Situations */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Add SRT Situations</CardTitle>
                <CardDescription>Add situations for Situation Reaction Test</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="srtSituation">Situation</Label>
                  <Textarea
                    id="srtSituation"
                    value={newSituation}
                    onChange={(e) => setNewSituation(e.target.value)}
                    placeholder="Enter a situation scenario..."
                    rows={3}
                  />
                </div>
                <Button onClick={handleAddSrtSituation}>
                  <Upload className="h-4 w-4 mr-2" />
                  Add Situation
                </Button>
                <div className="text-sm text-gray-600">
                  Total SRT situations: {srtSituations.length}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="manage">
          <div className="space-y-6">
            {/* Test Images */}
            <Card>
              <CardHeader>
                <CardTitle>Test Images ({testImages.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testImages.map((image: any) => (
                    <div key={image.id} className="border rounded-lg p-4">
                      <img 
                        src={image.image_url} 
                        alt="Test" 
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                      <p className="font-medium">{image.test_type.toUpperCase()}</p>
                      <p className="text-sm text-gray-600 mb-2">{image.prompt}</p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteTestImage(image.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* WAT Words Table */}
            <Card>
              <CardHeader>
                <CardTitle>WAT Words ({watWords.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Word</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {watWords.slice(0, 10).map((word: any) => (
                      <TableRow key={word.id}>
                        <TableCell className="font-medium">{word.word}</TableCell>
                        <TableCell>{new Date(word.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
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
              <p className="text-gray-600">Analytics dashboard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
