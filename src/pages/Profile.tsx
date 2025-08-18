
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, MapPin, Briefcase, Settings, Bell, Shield, Target } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';

const Profile = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [profile, setProfile] = useState({
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
    public_profile: false
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          age: data.age?.toString() || '',
          education: data.education || '',
          background: data.background || '',
          phone_number: data.phone_number || '',
          city: (data as any).city || '',
          state: (data as any).state || '',
          country: (data as any).country || '',
          occupation: (data as any).occupation || '',
          experience_years: (data as any).experience_years?.toString() || '',
          career_goals: (data as any).career_goals || '',
          interests: (data as any).interests || '',
          linkedin_url: (data as any).linkedin_url || '',
          preferred_language: (data as any).preferred_language || 'english',
          notification_email: (data as any).notification_email ?? true,
          notification_sms: (data as any).notification_sms ?? false,
          data_sharing: (data as any).data_sharing ?? false,
          public_profile: (data as any).public_profile ?? false
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
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
        });

      if (error) throw error;

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
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

  return (
    <AppLayout 
      title="Profile" 
      showBackButton={true}
      backTo="/dashboard"
    >
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src="" alt={profile.full_name} />
              <AvatarFallback className="text-lg">
                {profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profile.full_name || 'User'}</h2>
              <p className="text-muted-foreground">{user?.primaryEmailAddress?.emailAddress}</p>
              <div className="flex gap-2 mt-2">
                {profile.occupation && <Badge variant="secondary">{profile.occupation}</Badge>}
                {profile.city && <Badge variant="outline">{profile.city}</Badge>}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
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
        
        <form onSubmit={handleSubmit}>
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
                      onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
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
                      onChange={(e) => setProfile({ ...profile, age: e.target.value })}
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
                      onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
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
                      onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                      placeholder="Enter your city"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={profile.state}
                      onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                      placeholder="Enter your state"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={profile.country}
                      onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                      placeholder="Enter your country"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background">About Me</Label>
                  <Textarea
                    id="background"
                    value={profile.background}
                    onChange={(e) => setProfile({ ...profile, background: e.target.value })}
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
                    <Select value={profile.education} onValueChange={(value) => setProfile({ ...profile, education: value })}>
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
                      onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                      placeholder="e.g., Software Engineer, Student, etc."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={profile.experience_years}
                      onChange={(e) => setProfile({ ...profile, experience_years: e.target.value })}
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
                      onChange={(e) => setProfile({ ...profile, linkedin_url: e.target.value })}
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="goals">Career Goals</Label>
                  <Textarea
                    id="goals"
                    value={profile.career_goals}
                    onChange={(e) => setProfile({ ...profile, career_goals: e.target.value })}
                    placeholder="Describe your career aspirations and goals..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interests">Skills & Interests</Label>
                  <Textarea
                    id="interests"
                    value={profile.interests}
                    onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                    placeholder="List your key skills, hobbies, and interests..."
                    rows={3}
                  />
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
                  <Select value={profile.preferred_language} onValueChange={(value) => setProfile({ ...profile, preferred_language: value })}>
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
                      onCheckedChange={(checked) => setProfile({ ...profile, notification_email: checked })}
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
                      onCheckedChange={(checked) => setProfile({ ...profile, notification_sms: checked })}
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
                    onCheckedChange={(checked) => setProfile({ ...profile, public_profile: checked })}
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
                    onCheckedChange={(checked) => setProfile({ ...profile, data_sharing: checked })}
                  />
                </div>

                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Data Protection</h4>
                  <p className="text-xs text-muted-foreground">
                    Your personal information is encrypted and stored securely. We never share 
                    identifying information without your explicit consent. You can export or 
                    delete your data at any time by contacting support.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <div className="flex justify-end pt-6">
            <Button type="submit" disabled={isLoading} size="lg">
              {isLoading ? 'Updating...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Tabs>
    </div>
    </AppLayout>
  );
};

export default Profile;
