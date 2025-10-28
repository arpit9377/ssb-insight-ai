
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, Crown, Upload, Phone, QrCode, Loader2, AlertCircle, CheckCircle, Star, Download } from 'lucide-react';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';

import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { testLimitService } from '@/services/testLimitService';
import { deviceFingerprintingService } from '@/services/deviceFingerprinting';
import { AppLayout } from '@/components/layout/AppLayout';

const Subscription = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userLimits, setUserLimits] = useState<any>(null);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
    email: user?.emailAddresses?.[0]?.emailAddress || '',
    phone: '',
    amount: '199',
    screenshot: null as File | null
  });

  React.useEffect(() => {
    if (user) {
      loadUserData();
      // Update form data when user changes
      setFormData(prev => ({
        ...prev,
        name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '',
        email: user?.emailAddresses?.[0]?.emailAddress || '',
      }));
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      // Get current test limits
      const limits = await testLimitService.getTestLimits(user.id);
      setUserLimits(limits);

      // Check for existing payment request (pending or rejected)
      const { data: existingRequest } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'rejected'])
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingRequest) {
        setPaymentRequest(existingRequest);
      }

      // Record device fingerprint
      await deviceFingerprintingService.recordFingerprint(user.id);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Payment submit started, user:', user?.id);
    console.log('Form data:', { ...formData, screenshot: formData.screenshot ? 'File selected' : 'No file' });
    
    if (!user || !formData.screenshot || !formData.name || !formData.email || !formData.phone) {
      toast({
        title: "Error",
        description: "Please fill all fields and upload payment screenshot",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Upload screenshot to Supabase storage
      const fileExt = formData.screenshot.name.split('.').pop();
      const fileName = `payment_${user.id}_${Date.now()}.${fileExt}`;
      
      console.log('Uploading file:', fileName);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('test-images')
        .upload(`payment-screenshots/${fileName}`, formData.screenshot);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const screenshotUrl = `https://katdnpqytskvsrweqtjn.supabase.co/storage/v1/object/public/test-images/${uploadData.path}`;
      console.log('File uploaded successfully:', screenshotUrl);

      // Create payment request with detailed logging
      const paymentData = {
        user_id: user.id,
        user_name: formData.name.trim(),
        user_email: formData.email.trim(),
        phone_number: formData.phone.trim(),
        amount_paid: parseInt(formData.amount),
        payment_screenshot_url: screenshotUrl,
        status: 'pending'
      };
      
      console.log('Inserting payment request:', paymentData);
      const { data: insertData, error: insertError } = await supabase
        .from('payment_requests')
        .insert(paymentData)
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log('Payment request created successfully:', insertData);

      toast({
        title: "Payment Request Submitted!",
        description: "Your payment will be verified within 1-2 hours. You'll receive an email confirmation once approved."
      });

      setShowPaymentForm(false);
      setFormData(prev => ({ ...prev, screenshot: null }));
      loadUserData(); // Refresh data
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit payment request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isCurrentlyPaid = userLimits?.subscription_type === 'paid';

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = '/lovable-uploads/11ba7e15-1b61-43f3-a9e4-acff7822456b.png';
    link.download = 'psychsirai-payment-qr-code.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <AppLayout 
        title="Subscription & Payment" 
        showBackButton={true}
        backTo="/dashboard"
      >
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 mb-4">
                <Crown className="h-6 w-6 text-blue-600" />
                Access Premium Features
              </CardTitle>
              <CardDescription>
                Please sign in or create an account to manage your subscription and access premium features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SignInButton mode="modal">
                <Button variant="outline" className="w-full">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button className="w-full">
                  Create Account
                </Button>
              </SignUpButton>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Subscription & Payment" 
      showBackButton={true}
      backTo="/dashboard"
    >
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white py-4 px-6 rounded-lg mb-6 mx-4 shadow-lg">
            <h2 className="text-2xl font-bold mb-2">🚀 Launch Offer - 80% OFF!</h2>
            <p className="text-lg">Premium Plan Just ₹199 (Was ₹999) - Limited Time Only!</p>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Join 10,000+ Future Officers
          </h1>
          <p className="text-xl text-gray-600">
            Master SSB Tests with AI-Powered Analysis & Expert Feedback
          </p>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-blue-600 font-bold text-2xl">10,000+</div>
              <div className="text-gray-600 text-sm">Successful Candidates</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-green-600 font-bold text-2xl">85%+</div>
              <div className="text-gray-600 text-sm">Success Rate</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md">
              <div className="text-purple-600 font-bold text-2xl">4.9★</div>
              <div className="text-gray-600 text-sm">User Rating</div>
            </div>
          </div>
        </div>

        {/* Current Status Card */}
        <Card className="mb-8 border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isCurrentlyPaid ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              Current Status: {isCurrentlyPaid ? 'Paid User' : 'Free User'}
            </CardTitle>
            {userLimits && (
              <CardDescription>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center">
                    <p className="font-medium">TAT Tests</p>
                    <p className="text-2xl font-bold text-blue-600">{userLimits.tat}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">PPDT Tests</p>
                    <p className="text-2xl font-bold text-green-600">{userLimits.ppdt}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">WAT Tests</p>
                    <p className="text-2xl font-bold text-purple-600">{userLimits.wat}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-medium">SRT Tests</p>
                    <p className="text-2xl font-bold text-orange-600">{userLimits.srt}</p>
                  </div>
                </div>
                {userLimits.subscription_expires_at && (
                  <p className="mt-2 text-sm text-gray-600">
                    Valid until: {new Date(userLimits.subscription_expires_at).toLocaleDateString()}
                  </p>
                )}
              </CardDescription>
            )}
          </CardHeader>
        </Card>

        {/* Payment Request Status */}
        {paymentRequest && (
          <Card className={`mb-8 ${
            paymentRequest.status === 'pending' 
              ? 'border-yellow-200 bg-yellow-50' 
              : 'border-red-200 bg-red-50'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                {paymentRequest.status === 'pending' ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                    <h3 className="font-semibold text-yellow-800">Payment Under Review</h3>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-red-800">Payment Request Rejected</h3>
                  </>
                )}
              </div>
              
              {paymentRequest.status === 'pending' ? (
                <div>
                  <p className="text-yellow-700">
                    Your payment request of ₹{paymentRequest.amount_paid} is being processed. 
                    You'll receive email confirmation within 1-2 hours once verified.
                  </p>
                  <p className="text-sm text-yellow-600 mt-1">
                    Submitted on: {new Date(paymentRequest.requested_at).toLocaleString()}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-red-700 mb-2">
                    Your payment request of ₹{paymentRequest.amount_paid} has been rejected.
                  </p>
                  {paymentRequest.admin_notes && (
                    <div className="bg-red-100 p-3 rounded mb-3">
                      <p className="font-medium text-red-800 mb-1">Rejection Reason:</p>
                      <p className="text-red-700 text-sm">{paymentRequest.admin_notes}</p>
                    </div>
                  )}
                  <p className="text-sm text-red-600 mb-3">
                    Processed on: {new Date(paymentRequest.processed_at).toLocaleString()}
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setPaymentRequest(null);
                      setShowPaymentForm(true);
                    }}
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    Submit New Payment Request
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Free Plan */}
          <Card className={`${!isCurrentlyPaid ? 'border-green-500 shadow-lg' : ''}`}>
            <CardHeader className="text-center">
              <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center mx-auto mb-4">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Free Plan</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-gray-900">₹0</span>
                <span className="text-gray-600">/forever</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>2 tests from each module (8 total)</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Basic AI feedback</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Progress tracking</span>
                </li>
              </ul>
              <Button 
                variant="outline" 
                className="w-full"
                disabled={!isCurrentlyPaid}
              >
                {!isCurrentlyPaid ? 'Current Plan' : 'Downgrade (Not Available)'}
              </Button>
            </CardContent>
          </Card>

          {/* Paid Plan */}
          <Card className={`border-blue-500 shadow-lg ${isCurrentlyPaid ? 'border-green-500' : ''}`}>
            <CardHeader className="text-center">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Recommended
                </span>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center mx-auto mb-4 mt-4">
                <Star className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Paid Access</CardTitle>
                <CardDescription>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <span className="text-2xl line-through text-gray-400">₹999</span>
                    <span className="text-4xl font-bold text-green-600">₹199</span>
                    <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">80% OFF</span>
                  </div>
                  <span className="text-gray-600">/30 days</span>
                  <div className="mt-3 p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                    <div className="text-green-800 text-center">
                      <p className="font-bold text-lg mb-1">🎉 Limited Time Launch Offer!</p>
                      <p className="text-sm">Join 10,000+ successful candidates at this special price</p>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-white/70 rounded p-1">
                          <p className="font-semibold">✓ 120 Tests</p>
                        </div>
                        <div className="bg-white/70 rounded p-1">
                          <p className="font-semibold">✓ AI Analysis</p>
                        </div>
                        <div className="bg-white/70 rounded p-1">
                          <p className="font-semibold">✓ Expert Tips</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span><strong>120 Premium Tests</strong> (30 each: TAT, PPDT, WAT, SRT)</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span><strong>Advanced AI Analysis</strong> - 15 personality traits</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span><strong>Officer-Like Qualities</strong> assessment</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span><strong>Expert Tips & Strategies</strong> for each test</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span><strong>Progress Analytics</strong> & improvement tracking</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span><strong>30-Day Access</strong> - Practice unlimited times</span>
                </li>
              </ul>
              <div className="bg-blue-50 p-3 rounded-lg mb-4 text-center">
                <p className="text-blue-800 text-sm font-medium">
                  💡 Average users see <strong>40% improvement</strong> in their test scores within 2 weeks!
                </p>
              </div>
              <Button 
                className="w-full"
                onClick={() => setShowPaymentForm(true)}
                disabled={isCurrentlyPaid || (paymentRequest && paymentRequest.status === 'pending')}
              >
                {isCurrentlyPaid 
                  ? 'Current Plan' 
                  : (paymentRequest && paymentRequest.status === 'pending') 
                    ? 'Payment Pending' 
                    : 'Upgrade Now'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Payment Form Modal */}
        {showPaymentForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Complete Your Payment
              </CardTitle>
              <CardDescription>
                Manual payment verification - Access will be granted within 1-2 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Payment Instructions */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Payment Instructions:</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-medium mb-2">Step 1: Make Payment</p>
                    <p className="text-sm text-gray-700 mb-3">Pay ₹199 to support app development & get premium access:</p>
                    
                    <div className="bg-gray-100 p-4 rounded text-center">
                      <p className="text-sm mb-3 font-medium">UPI QR Code - Pay ₹199</p>
                      <div className="mx-auto w-64 h-64 bg-white rounded-lg border shadow-sm overflow-hidden">
                        <img 
                          src="/lovable-uploads/11ba7e15-1b61-43f3-a9e4-acff7822456b.png" 
                          alt="PhonePe QR Code for ₹199 payment"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-2">Scan using any UPI app to pay ₹199</p>
                      <Button 
                        onClick={downloadQRCode}
                        variant="outline" 
                        size="sm" 
                        className="mt-3 gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download QR Code
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="font-medium mb-2">Step 2: Submit Proof</p>
                    <p className="text-sm text-gray-700">
                      Fill the form and upload payment screenshot for verification.
                      Access will be granted within 1-2 hours after verification.
                    </p>
                  </div>
                </div>

                {/* Payment Form */}
                <form onSubmit={handlePaymentSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="amount">Amount Paid</Label>
                    <Input
                      id="amount"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      required
                      readOnly
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="screenshot">Payment Screenshot *</Label>
                    <Input
                      id="screenshot"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({...formData, screenshot: e.target.files?.[0] || null})}
                      required
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Upload screenshot of successful payment transaction
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowPaymentForm(false)}
                      className="w-full sm:flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading || !formData.screenshot}
                      className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Submit for Verification
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center text-gray-600">
          <p className="mb-2">
            <strong>Manual Verification Process:</strong> Payment verification takes 1-2 hours during business hours.
          </p>
          <p className="text-sm mb-2">
            Your subscription helps us maintain servers, improve AI analysis, and create better test content for your success.
          </p>
          <p className="text-sm">
            For immediate assistance, contact us at editkarde@gmail.com
          </p>
        </div>
      </div>
    </div>
    </AppLayout>
  );
};

export default Subscription;
