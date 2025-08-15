import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, CreditCard, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Refunds = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">PsychSir.ai</h1>
            </div>
            <div className="flex items-center space-x-6">
              <Button variant="ghost" onClick={() => navigate('/')}>Home</Button>
              <Button variant="ghost" onClick={() => navigate('/about')}>About</Button>
              <Button variant="ghost" onClick={() => navigate('/services')}>Services</Button>
              <Button variant="ghost" onClick={() => navigate('/pricing')}>Pricing</Button>
              <Button onClick={() => navigate('/dashboard')}>Get Started</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Refunds & Cancellation Policy
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Understanding our refund and cancellation policy for digital services.
          </p>
          <p className="text-sm text-gray-500">
            Last updated: December 15, 2024
          </p>
        </div>
      </section>

      {/* Policy Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            
            {/* Important Notice */}
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Important Notice</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-700 font-medium">
                  Since our product is digital and provides immediate access to AI-powered psychological test preparation services, 
                  we do not offer refunds once a subscription is purchased and activated.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span>1. No Refund Policy</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p><strong>1.1 Digital Nature of Services:</strong></p>
                  <p>
                    PsychSir.ai provides digital educational services that are delivered instantly upon subscription activation. 
                    Once you gain access to our AI-powered psychological test preparation platform, the service has been 
                    provided and cannot be "returned" in the traditional sense.
                  </p>
                  
                  <p><strong>1.2 Immediate Value Delivery:</strong></p>
                  <p>
                    Our services provide immediate value through:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Instant access to psychological test modules</li>
                    <li>Real-time AI feedback and analysis</li>
                    <li>Progress tracking and personalized insights</li>
                    <li>Comprehensive test preparation materials</li>
                  </ul>
                  
                  <p><strong>1.3 Free Trial Available:</strong></p>
                  <p>
                    We encourage all users to take advantage of our free trial period to evaluate our services 
                    before making a purchase decision.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span>2. Subscription Cancellation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p><strong>2.1 How to Cancel:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Log into your PsychSir.ai account</li>
                    <li>Go to Account Settings → Subscription</li>
                    <li>Click "Cancel Subscription"</li>
                    <li>Confirm your cancellation</li>
                  </ul>
                  
                  <p><strong>2.2 Cancellation Effects:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Your subscription will remain active until the end of your current billing period</li>
                    <li>You will continue to have access to all features until the subscription expires</li>
                    <li>No additional charges will be made after cancellation</li>
                    <li>Your progress data will be preserved for 90 days after cancellation</li>
                  </ul>
                  
                  <p><strong>2.3 No Cancellation Fees:</strong></p>
                  <p>We do not charge any cancellation fees. You can cancel your subscription at any time without penalty.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>3. Exceptional Circumstances</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p><strong>3.1 Technical Issues:</strong></p>
                  <p>
                    If you experience significant technical issues that prevent you from accessing our services, 
                    we will work with you to resolve the problem. In rare cases where we cannot provide a 
                    satisfactory solution, we may consider account credits or service extensions.
                  </p>
                  
                  <p><strong>3.2 Billing Errors:</strong></p>
                  <p>
                    If you believe you have been charged incorrectly due to a system error, please contact 
                    our support team within 7 days of the charge. We will investigate and rectify any 
                    genuine billing errors.
                  </p>
                  
                  <p><strong>3.3 Unauthorized Charges:</strong></p>
                  <p>
                    If you notice unauthorized charges on your account, please contact us immediately. 
                    We will investigate and take appropriate action to resolve the issue.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Subscription Modifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p><strong>4.1 Upgrading Your Plan:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>You can upgrade your subscription at any time</li>
                    <li>Upgrades take effect immediately</li>
                    <li>You will be charged the prorated difference for the current billing period</li>
                  </ul>
                  
                  <p><strong>4.2 Downgrading Your Plan:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Downgrades take effect at the start of your next billing cycle</li>
                    <li>You will continue to have access to your current plan features until then</li>
                    <li>No partial refunds are provided for downgrades</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Payment Failures and Account Suspension</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p><strong>5.1 Failed Payments:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>If a payment fails, we will attempt to charge your payment method up to 3 times</li>
                    <li>You will be notified of payment failures via email</li>
                    <li>Your account will be temporarily suspended if payment cannot be processed</li>
                  </ul>
                  
                  <p><strong>5.2 Account Reactivation:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Update your payment method to reactivate your account</li>
                    <li>Your progress data and settings will be preserved during suspension</li>
                    <li>Reactivation is immediate once payment is successful</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Data Retention After Cancellation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p><strong>6.1 Grace Period:</strong></p>
                  <p>
                    After subscription cancellation, your account data (including test results and progress) 
                    will be retained for 90 days. This allows you to reactivate your subscription without 
                    losing your progress.
                  </p>
                  
                  <p><strong>6.2 Data Export:</strong></p>
                  <p>
                    Before or within 90 days of cancellation, you can export your test results and progress 
                    data from your account settings.
                  </p>
                  
                  <p><strong>6.3 Data Deletion:</strong></p>
                  <p>
                    After 90 days of cancellation, your account data will be permanently deleted from our 
                    systems (excluding data required for legal compliance).
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Chargebacks and Disputes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p><strong>7.1 Contact Us First:</strong></p>
                  <p>
                    Before initiating a chargeback with your bank or credit card company, please contact 
                    our support team. We are committed to resolving any legitimate concerns directly 
                    and promptly.
                  </p>
                  
                  <p><strong>7.2 Chargeback Consequences:</strong></p>
                  <p>
                    Initiating a chargeback may result in immediate suspension of your account and 
                    access to our services while the dispute is resolved.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p>
                    For questions about billing, cancellation, or any concerns regarding your subscription:
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p><strong>Email:</strong> billing@psychsir.ai</p>
                    <p><strong>Support:</strong> support@psychsir.ai</p>
                    <p><strong>Phone:</strong> +91 8319635728</p>
                    <p><strong>Hours:</strong> Monday-Friday, 9:00 AM - 6:00 PM IST</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    We typically respond to billing inquiries within 24 hours during business days.
                  </p>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="h-8 w-8 text-blue-400" />
                <h3 className="text-2xl font-bold">PsychSir.ai</h3>
              </div>
              <p className="text-gray-400 max-w-md">
                Empowering future officers with AI-powered psychological test preparation
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <div className="space-y-2">
                <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto" onClick={() => navigate('/')}>Home</Button>
                <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto" onClick={() => navigate('/about')}>About</Button>
                <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto" onClick={() => navigate('/services')}>Services</Button>
                <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto" onClick={() => navigate('/pricing')}>Pricing</Button>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <div className="space-y-2">
                <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto" onClick={() => navigate('/terms')}>Terms & Conditions</Button>
                <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto" onClick={() => navigate('/privacy')}>Privacy Policy</Button>
                <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto" onClick={() => navigate('/refunds')}>Refunds</Button>
                <Button variant="link" className="text-gray-400 hover:text-white p-0 h-auto" onClick={() => navigate('/faq')}>FAQ</Button>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PsychSir.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Refunds;