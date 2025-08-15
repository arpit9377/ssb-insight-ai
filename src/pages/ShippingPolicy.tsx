import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Truck, Monitor, CheckCircle, Wifi } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ShippingPolicy = () => {
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
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Monitor className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Shipping Policy
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Understanding our delivery method for digital services.
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
            
            {/* Digital Service Notice */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span>Digital Service - No Physical Shipping</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700 font-medium">
                  PsychSir.ai is a completely digital platform. All our services are delivered electronically 
                  through the internet. No physical products are shipped or mailed.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wifi className="h-5 w-5 text-blue-600" />
                  <span>1. Digital Delivery Method</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p><strong>1.1 Instant Access:</strong></p>
                  <p>
                    Upon successful subscription activation, you gain immediate access to all PsychSir.ai services through:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Web browser at psychsir.ai</li>
                    <li>Your personal dashboard and account</li>
                    <li>All psychological test modules (PPDT, TAT, WAT, SRT)</li>
                    <li>AI-powered analysis and feedback systems</li>
                    <li>Progress tracking and analytics</li>
                  </ul>
                  
                  <p><strong>1.2 No Waiting Period:</strong></p>
                  <p>
                    Unlike physical products, our digital services are available immediately after payment confirmation. 
                    There are no shipping delays, delivery windows, or waiting periods.
                  </p>
                  
                  <p><strong>1.3 Global Accessibility:</strong></p>
                  <p>
                    Our services are accessible from anywhere in the world with an internet connection, 
                    eliminating geographical limitations and shipping restrictions.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Monitor className="h-5 w-5 text-purple-600" />
                  <span>2. Service Delivery Requirements</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p><strong>2.1 Technical Requirements:</strong></p>
                  <p>To access our services, you need:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>A stable internet connection</li>
                    <li>A modern web browser (Chrome, Firefox, Safari, Edge)</li>
                    <li>A device (computer, tablet, or smartphone)</li>
                    <li>An active email address for account management</li>
                  </ul>
                  
                  <p><strong>2.2 Account Creation:</strong></p>
                  <p>
                    Service delivery begins once you:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Create your PsychSir.ai account</li>
                    <li>Complete the payment process</li>
                    <li>Verify your email address (if required)</li>
                  </ul>
                  
                  <p><strong>2.3 Immediate Availability:</strong></p>
                  <p>
                    All features included in your subscription plan are immediately available upon activation.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Content Delivery and Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p><strong>3.1 Continuous Updates:</strong></p>
                  <p>
                    Our digital platform receives regular updates including:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>New test scenarios and questions</li>
                    <li>Enhanced AI analysis capabilities</li>
                    <li>Feature improvements and bug fixes</li>
                    <li>User interface enhancements</li>
                  </ul>
                  
                  <p><strong>3.2 Automatic Deployment:</strong></p>
                  <p>
                    All updates are deployed automatically to our platform. You don't need to download 
                    or install anything - simply refresh your browser to access the latest version.
                  </p>
                  
                  <p><strong>3.3 Data Synchronization:</strong></p>
                  <p>
                    Your progress, test results, and analytics are automatically synchronized across 
                    all your devices when you log into your account.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Service Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p><strong>4.1 24/7 Access:</strong></p>
                  <p>
                    Our digital services are available 24 hours a day, 7 days a week, allowing you 
                    to practice and prepare at your convenience.
                  </p>
                  
                  <p><strong>4.2 Scheduled Maintenance:</strong></p>
                  <p>
                    Occasional scheduled maintenance may temporarily limit access. We will notify 
                    users in advance of any planned downtime.
                  </p>
                  
                  <p><strong>4.3 Uptime Commitment:</strong></p>
                  <p>
                    We maintain a 99.9% uptime target and continuously monitor our systems to 
                    ensure reliable service delivery.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Access Issues and Support</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p><strong>5.1 Technical Support:</strong></p>
                  <p>
                    If you experience difficulties accessing our services:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Check your internet connection</li>
                    <li>Try refreshing your browser</li>
                    <li>Clear your browser cache and cookies</li>
                    <li>Contact our support team if issues persist</li>
                  </ul>
                  
                  <p><strong>5.2 Account Recovery:</strong></p>
                  <p>
                    If you lose access to your account:
                  </p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Use the "Forgot Password" feature on our login page</li>
                    <li>Contact support with your registered email address</li>
                    <li>Provide verification details as requested by our team</li>
                  </ul>
                  
                  <p><strong>5.3 Platform Compatibility:</strong></p>
                  <p>
                    Our platform is optimized for modern browsers. If you experience compatibility 
                    issues, we recommend updating to the latest browser version.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Digital Rights and Licenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p><strong>6.1 Service License:</strong></p>
                  <p>
                    Your subscription grants you a personal, non-transferable license to access 
                    and use our services for your individual test preparation needs.
                  </p>
                  
                  <p><strong>6.2 Usage Restrictions:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Services are for personal use only</li>
                    <li>Account sharing is not permitted</li>
                    <li>Commercial use requires separate agreement</li>
                    <li>Content redistribution is prohibited</li>
                  </ul>
                  
                  <p><strong>6.3 Content Ownership:</strong></p>
                  <p>
                    While you have a license to use our services, all content, including test materials, 
                    AI models, and analytics, remain the intellectual property of PsychSir.ai.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p>
                    For technical issues, access problems, or questions about our digital service delivery:
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p><strong>Technical Support:</strong> support@psychsir.ai</p>
                    <p><strong>General Inquiries:</strong> info@psychsir.ai</p>
                    <p><strong>Phone:</strong> +91 8319635728</p>
                    <p><strong>Support Hours:</strong> Monday-Friday, 9:00 AM - 6:00 PM IST</p>
                  </div>
                  <p className="text-sm text-gray-500 mt-4">
                    Our technical support team typically responds within 4-6 hours during business hours.
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

export default ShippingPolicy;