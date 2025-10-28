
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, MapPin, Briefcase, Settings, Shield, Target, Download, Trash2, Clock, Award } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';

interface ProfileData {
  full_name: string;
  age: string;
  education: string;
  background: string;
  phone_number: string;
  city: string;
  state: string;
  country: string;
  occupation: string;
  experience_years: string;
  career_goals: string;
  interests: string;
  linkedin_url: string;
  preferred_language: string;
  notification_email: boolean;
  notification_sms: boolean;
  data_sharing: boolean;
  public_profile: boolean;
  avatar_url?: string;
  target_exam?: string;
  preparation_level?: string;
  target_exam_date?: string;
  preferred_test_types?: string;
  updated_at?: string;
}

const Profile = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    age: '',
    education: '',
    background: '',
    phone_number: '',
    city: '',
    state: '',
    country: '',
    occupation: '',
    experience_years: '',
    career_goals: '',
    interests: '',
    linkedin_url: '',
    preferred_language: 'english',
    notification_email: true,
    notification_sms: false,
    data_sharing: false,
    public_profile: false,
    avatar_url: '',
    target_exam: '',
    preparation_level: '',
    target_exam_date: '',
    preferred_test_types: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  // Track changes for unsaved warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (data) {
        const profileData: ProfileData = {
          full_name: data.full_name || '',
          age: data.age?.toString() || '',
          education: data.education || '',
          background: data.background || '',
          phone_number: data.phone_number || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || '',
          occupation: data.occupation || '',
          experience_years: data.experience_years?.toString() || '',
          career_goals: data.career_goals || '',
          interests: data.interests || '',
          linkedin_url: data.linkedin_url || '',
          preferred_language: data.preferred_language || 'english',
          notification_email: data.notification_email ?? true,
          notification_sms: data.notification_sms ?? false,
          data_sharing: data.data_sharing ?? false,
          public_profile: data.public_profile ?? false,
          avatar_url: '',
          target_exam: (data as any).target_exam || '',
          preparation_level: (data as any).preparation_level || '',
          target_exam_date: (data as any).target_exam_date || '',
          preferred_test_types: (data as any).preferred_test_types || '',
          updated_at: data.updated_at
        };
        setProfile(profileData);
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const calculateProfileCompletion = (): number => {
    const fields = [
      profile.full_name,
      profile.age,
      profile.education,
      profile.phone_number,
      profile.city,
      profile.state,
      profile.country,
      profile.occupation,
      profile.background,
      profile.career_goals,
      profile.target_exam,
      profile.preparation_level,
      profile.target_exam_date,
      profile.preferred_test_types
    ];
    const filledFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };

  const validateForm = (): boolean => {
    if (!profile.full_name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Full name is required',
        variant: 'destructive'
      });
      return false;
    }

    if (profile.linkedin_url && !profile.linkedin_url.match(/^https?:\/\/.+/)) {
      toast({
        title: 'Validation Error',
        description: 'LinkedIn URL must be a valid URL',
        variant: 'destructive'
      });
      return false;
    }

    if (profile.phone_number && !profile.phone_number.match(/^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid phone number',
        variant: 'destructive'
      });
      return false;
    }

    return true;
  };

  const exportData = async () => {
    try {
      const { data: sessions } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('user_id', user?.id);

      const { data: analyses } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('user_id', user?.id);

      const exportData = {
        profile,
        test_sessions: sessions || [],
        ai_analyses: analyses || [],
        exported_at: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `psychsirai-data-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'Data Exported',
        description: 'Your data has been downloaded successfully'
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export data',
        variant: 'destructive'
      });
    }
  };

  const deleteAccount = async () => {
    try {
      // Delete user data
      await supabase.from('profiles').delete().eq('user_id', user?.id);
      await supabase.from('test_sessions').delete().eq('user_id', user?.id);
      await supabase.from('ai_analyses').delete().eq('user_id', user?.id);

      toast({
        title: 'Account Deleted',
        description: 'Your account and data have been permanently deleted'
      });

      // Sign out user
      window.location.href = '/';
    } catch (error) {
      toast({
        title: 'Deletion Failed',
        description: 'Failed to delete account. Please contact support.',
        variant: 'destructive'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      console.log('Current profile state before save:', profile);
      
      // Build the update object with existing fields
      const updateData: any = {
        user_id: user?.id,
        email: user?.primaryEmailAddress?.emailAddress || '',
        full_name: profile.full_name,
        age: parseInt(profile.age) || null,
        education: profile.education,
        background: profile.background,
        phone_number: profile.phone_number,
        city: profile.city,
        state: profile.state,
        country: profile.country,
        occupation: profile.occupation,
        experience_years: parseInt(profile.experience_years) || null,
        career_goals: profile.career_goals,
        interests: profile.interests,
        linkedin_url: profile.linkedin_url,
        preferred_language: profile.preferred_language,
        notification_email: profile.notification_email,
        notification_sms: profile.notification_sms,
        data_sharing: profile.data_sharing,
        public_profile: profile.public_profile,
        updated_at: new Date().toISOString(),
      };

      // Add new fields
      if (profile.target_exam) updateData.target_exam = profile.target_exam;
      if (profile.preparation_level) updateData.preparation_level = profile.preparation_level;
      if (profile.target_exam_date) updateData.target_exam_date = profile.target_exam_date;
      if (profile.preferred_test_types) updateData.preferred_test_types = profile.preferred_test_types;

      console.log('Data being sent to database:', updateData);

      const { error } = await supabase
        .from('profiles')
        .upsert(updateData, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // Clear unsaved changes state
      setHasUnsavedChanges(false);
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
      
      // Reload profile to get updated data
      await loadProfile();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileChange = (field: keyof ProfileData, value: any) => {
    console.log(`Field changed: ${field} = ${value}`);
    setProfile(prev => {
      const updated = { ...prev, [field]: value };
      console.log('Updated profile state:', updated);
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  return (
    <AppLayout 
      title="Profile" 
      showBackButton={true}
      backTo="/dashboard"
    >
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Completion Indicator */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium">Profile Completion</h3>
                <p className="text-xs text-muted-foreground">Complete your profile to get better insights</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{calculateProfileCompletion()}%</div>
                {profile.updated_at && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                    <Clock className="h-3 w-3" />
                    Updated {new Date(profile.updated_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <Progress value={calculateProfileCompletion()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-2xl font-bold">
                {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profile.full_name || 'User'}</h2>
              <p className="text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
              <div className="flex gap-2 mt-2 flex-wrap">
                {profile.occupation && <Badge variant="secondary"><Briefcase className="h-3 w-3 mr-1" />{profile.occupation}</Badge>}
                {profile.city && <Badge variant="outline"><MapPin className="h-3 w-3 mr-1" />{profile.city}</Badge>}
                {profile.target_exam && <Badge variant="default"><Target className="h-3 w-3 mr-1" />{profile.target_exam}</Badge>}
                {profile.preparation_level && <Badge><Award className="h-3 w-3 mr-1" />{profile.preparation_level}</Badge>}
              </div>
              {hasUnsavedChanges && (
                <p className="text-sm text-orange-600 mt-2 flex items-center gap-1">
                  <span className="h-2 w-2 bg-orange-600 rounded-full animate-pulse" />
                  You have unsaved changes
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="professional" className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Professional
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privacy
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Basic information about yourself to personalize your experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={profile.full_name}
                      onChange={(e) => handleProfileChange('full_name', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.primaryEmailAddress?.emailAddress || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={profile.age}
                      onChange={(e) => handleProfileChange('age', e.target.value)}
                      placeholder="Enter your age"
                      min="13"
                      max="100"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profile.phone_number}
                      onChange={(e) => handleProfileChange('phone_number', e.target.value)}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profile.city}
                      onChange={(e) => handleProfileChange('city', e.target.value)}
                      placeholder="Enter your city"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={profile.state}
                      onChange={(e) => handleProfileChange('state', e.target.value)}
                      placeholder="Enter your state"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={profile.country}
                      onChange={(e) => handleProfileChange('country', e.target.value)}
                      placeholder="Enter your country"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background">About Me</Label>
                  <Textarea
                    id="background"
                    value={profile.background}
                    onChange={(e) => handleProfileChange('background', e.target.value)}
                    placeholder="Tell us about yourself, your interests, and what motivates you..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="professional" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
                <CardDescription>
                  Career and educational background for better analysis insights
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="education">Education Level</Label>
                    <Select value={profile.education} onValueChange={(value) => handleProfileChange('education', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high-school">High School</SelectItem>
                        <SelectItem value="diploma">Diploma</SelectItem>
                        <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                        <SelectItem value="masters">Master's Degree</SelectItem>
                        <SelectItem value="phd">PhD/Doctorate</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="occupation">Current Occupation</Label>
                    <Input
                      id="occupation"
                      value={profile.occupation}
                      onChange={(e) => handleProfileChange('occupation', e.target.value)}
                      placeholder="e.g., Software Engineer, Student, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={profile.experience_years}
                      onChange={(e) => handleProfileChange('experience_years', e.target.value)}
                      placeholder="0"
                      min="0"
                      max="50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn Profile</Label>
                    <Input
                      id="linkedin"
                      value={profile.linkedin_url}
                      onChange={(e) => handleProfileChange('linkedin_url', e.target.value)}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goals">Career Goals</Label>
                  <Textarea
                    id="goals"
                    value={profile.career_goals}
                    onChange={(e) => handleProfileChange('career_goals', e.target.value)}
                    placeholder="Describe your career aspirations and goals..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interests">Skills & Interests</Label>
                  <Textarea
                    id="interests"
                    value={profile.interests}
                    onChange={(e) => handleProfileChange('interests', e.target.value)}
                    placeholder="List your key skills, hobbies, and interests..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* SSB Preparation Details */}
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  SSB Preparation Details
                </CardTitle>
                <CardDescription>
                  Help us personalize your test preparation experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="targetExam">Target Exam</Label>
                    <Select value={profile.target_exam} onValueChange={(value) => handleProfileChange('target_exam', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select target exam" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NDA">NDA (National Defence Academy)</SelectItem>
                        <SelectItem value="CDS">CDS (Combined Defence Services)</SelectItem>
                        <SelectItem value="AFCAT">AFCAT (Air Force Common Admission Test)</SelectItem>
                        <SelectItem value="TES">TES (Technical Entry Scheme)</SelectItem>
                        <SelectItem value="TGC">TGC (Technical Graduate Course)</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prepLevel">Preparation Level</Label>
                    <Select value={profile.preparation_level} onValueChange={(value) => handleProfileChange('preparation_level', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select preparation level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner - Just Started</SelectItem>
                        <SelectItem value="Intermediate">Intermediate - Some Practice</SelectItem>
                        <SelectItem value="Advanced">Advanced - Exam Ready</SelectItem>
                        <SelectItem value="Repeater">Repeater - Previous Attempt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="examDate">Target Exam Date</Label>
                    <Input
                      id="examDate"
                      type="date"
                      value={profile.target_exam_date}
                      onChange={(e) => handleProfileChange('target_exam_date', e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="testTypes">Preferred Test Types</Label>
                    <Input
                      id="testTypes"
                      value={profile.preferred_test_types}
                      onChange={(e) => handleProfileChange('preferred_test_types', e.target.value)}
                      placeholder="e.g., PPDT, TAT, WAT, SRT"
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    💡 <strong>Tip:</strong> Completing these details helps our AI provide more accurate and personalized feedback tailored to your specific exam and preparation level.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>App Preferences</CardTitle>
                <CardDescription>
                  Customize your experience and notification settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="language">Preferred Language</Label>
                  <Select value={profile.preferred_language} onValueChange={(value) => handleProfileChange('preferred_language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="hindi">Hindi</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                      <SelectItem value="french">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Notification Settings</h4>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive test results and progress updates
                      </p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={profile.notification_email}
                      onCheckedChange={(checked) => handleProfileChange('notification_email', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminders to take tests
                      </p>
                    </div>
                    <Switch
                      id="sms-notifications"
                      checked={profile.notification_sms}
                      onCheckedChange={(checked) => handleProfileChange('notification_sms', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Data Settings</CardTitle>
                <CardDescription>
                  Control how your data is used and shared
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="public-profile">Public Profile</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to see your profile and achievements
                    </p>
                  </div>
                  <Switch
                    id="public-profile"
                    checked={profile.public_profile}
                    onCheckedChange={(checked) => handleProfileChange('public_profile', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="data-sharing">Anonymous Data Sharing</Label>
                    <p className="text-sm text-muted-foreground">
                      Help improve our AI by sharing anonymized test data
                    </p>
                  </div>
                  <Switch
                    id="data-sharing"
                    checked={profile.data_sharing}
                    onCheckedChange={(checked) => handleProfileChange('data_sharing', checked)}
                  />
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Data Protection</h4>
                  <p className="text-xs text-muted-foreground">
                    Your personal information is encrypted and stored securely. We never share 
                    identifying information without your explicit consent. You can export or 
                    delete your data at any time using the options below.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card className="border-orange-200">
              <CardHeader>
                <CardTitle className="text-orange-800">Data Management</CardTitle>
                <CardDescription>
                  Export your data or permanently delete your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="font-medium">Export Your Data</h4>
                    <p className="text-sm text-muted-foreground">
                      Download all your profile data, test sessions, and AI analyses as JSON
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={exportData}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export Data
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50/50">
                  <div className="space-y-1">
                    <h4 className="font-medium text-red-800">Delete Account</h4>
                    <p className="text-sm text-red-600">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="destructive"
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete your account
                          and remove all your data from our servers, including:
                          <ul className="list-disc list-inside mt-2 space-y-1">
                            <li>Your profile information</li>
                            <li>All test sessions and responses</li>
                            <li>AI analyses and feedback</li>
                            <li>Progress tracking data</li>
                          </ul>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={deleteAccount}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Yes, Delete My Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-6">
          <Button type="submit" disabled={isLoading} size="lg">
            {isLoading ? 'Updating...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
    </AppLayout>
  );
};

export default Profile;
