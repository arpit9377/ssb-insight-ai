
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Check, Crown, Upload, Phone, QrCode, Loader2, AlertCircle, CheckCircle, Star } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { testLimitService } from '@/services/testLimitService';
import { deviceFingerprintingService } from '@/services/deviceFingerprinting';

const Subscription = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userLimits, setUserLimits] = useState<any>(null);
  const [paymentRequest, setPaymentRequest] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: user?.firstName + ' ' + user?.lastName || '',
    email: user?.emailAddresses?.[0]?.emailAddress || '',
    phone: '',
    amount: '299',
    screenshot: null as File | null
  });

  React.useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      // Get current test limits
      const limits = await testLimitService.getTestLimits(user.id);
      setUserLimits(limits);

      // Check for existing payment request
      const { data: existingRequest } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false })
        .limit(1)
        .single();

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
    
    if (!user || !formData.screenshot) {
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
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('test-images')
        .upload(`payment-screenshots/${fileName}`, formData.screenshot);

      if (uploadError) throw uploadError;

      const screenshotUrl = `https://katdnpqytskvsrweqtjn.supabase.co/storage/v1/object/public/test-images/${uploadData.path}`;

      // Create payment request
      const { error } = await supabase
        .from('payment_requests')
        .insert({
          user_id: user.id,
          user_name: formData.name,
          user_email: formData.email,
          phone_number: formData.phone,
          amount_paid: parseInt(formData.amount),
          payment_screenshot_url: screenshotUrl,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Payment Request Submitted!",
        description: "Your payment will be verified within 1-2 hours. You'll receive an email confirmation once approved."
      });

      setShowPaymentForm(false);
      loadUserData(); // Refresh data
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit payment request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isCurrentlyPaid = userLimits?.subscription_type === 'paid';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Subscription & Payment
          </h1>
          <p className="text-xl text-gray-600">
            Get unlimited access to all psychological tests
          </p>
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

        {/* Pending Payment Request */}
        {paymentRequest && (
          <Card className="mb-8 border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-5 w-5 animate-spin text-yellow-600" />
                <h3 className="font-semibold text-yellow-800">Payment Under Review</h3>
              </div>
              <p className="text-yellow-700">
                Your payment request of ₹{paymentRequest.amount_paid} is being processed. 
                You'll receive email confirmation within 1-2 hours once verified.
              </p>
              <p className="text-sm text-yellow-600 mt-1">
                Submitted on: {new Date(paymentRequest.requested_at).toLocaleString()}
              </p>
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
                <span className="text-3xl font-bold text-gray-900">₹299</span>
                <span className="text-gray-600">/30 days</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>30 tests from each module (120 total)</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Detailed AI analysis & feedback</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Advanced progress tracking</span>
                </li>
                <li className="flex items-center space-x-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Personality insights</span>
                </li>
              </ul>
              <Button 
                className="w-full"
                onClick={() => setShowPaymentForm(true)}
                disabled={isCurrentlyPaid || !!paymentRequest}
              >
                {isCurrentlyPaid ? 'Current Plan' : paymentRequest ? 'Payment Pending' : 'Upgrade Now'}
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
                    <p className="text-sm text-gray-700 mb-3">Pay ₹299 using any of these methods:</p>
                    
                    <div className="bg-gray-100 p-4 rounded text-center">
                      <p className="text-sm mb-3 font-medium">UPI QR Code - Pay ₹299</p>
                      <div className="mx-auto w-64 h-64 bg-white rounded-lg border shadow-sm overflow-hidden">
                        <img 
                          src="/lovable-uploads/11ba7e15-1b61-43f3-a9e4-acff7822456b.png" 
                          alt="PhonePe QR Code for ₹299 payment"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-2">Scan using any UPI app to pay ₹299</p>
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
                  
                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowPaymentForm(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={loading}
                      className="flex-1"
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
          <p className="text-sm">
            For immediate assistance, contact us at support@psychsir.ai or WhatsApp: +91 9876543210
          </p>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
