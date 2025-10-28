import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Shield, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <img src="/lovable-uploads/d3dbc8a1-8206-42d0-8106-40fc4d962c94.png" alt="PsychSirAi Logo" className="h-8 w-8" />
              <h1 className="text-2xl font-bold text-gray-900">PsychSirAi</h1>
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
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Terms & Conditions
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Please read these terms and conditions carefully before using our service.
          </p>
          <p className="text-sm text-gray-500">
            Last updated: December 15, 2024
          </p>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                  <span>1. Acceptance of Terms</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="prose max-w-none">
                <p className="text-gray-600 mb-4">
                  By accessing and using PsychSirAi ("Service"), you accept and agree to be bound by the terms 
                  and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                </p>
                <p className="text-gray-600">
                  These Terms of Service constitute a legally binding agreement between you and PsychSirAi
                  regarding your use of our platform and services.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Description of Service</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  PsychSirAi provides AI-powered psychological test preparation services specifically designed 
                  for SSB (Services Selection Board) candidates. Our services include:
                </p>
                <ul className="list-disc pl-6 text-gray-600 space-y-2">
                  <li>PPDT (Picture Perception & Discussion Test) practice</li>
                  <li>TAT (Thematic Apperception Test) analysis</li>
                  <li>WAT (Word Association Test) training</li>
                  <li>SRT (Situation Reaction Test) scenarios</li>
                  <li>AI-powered feedback and trait analysis</li>
                  <li>Progress tracking and analytics</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. User Accounts and Registration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p>
                    <strong>3.1 Account Creation:</strong> To access our services, you must create an account by providing 
                    accurate and complete information.
                  </p>
                  <p>
                    <strong>3.2 Account Security:</strong> You are responsible for maintaining the confidentiality of 
                    your account credentials and for all activities that occur under your account.
                  </p>
                  <p>
                    <strong>3.3 Age Requirement:</strong> You must be at least 16 years old to use our services. 
                    If you are under 18, you must have parental consent.
                  </p>
                  <p>
                    <strong>3.4 Account Termination:</strong> We reserve the right to terminate accounts that 
                    violate these terms or engage in fraudulent activities.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Payment and Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p>
                    <strong>4.1 Subscription Plans:</strong> We offer various subscription plans with different 
                    features and pricing. All prices are in Indian Rupees (INR).
                  </p>
                  <p>
                    <strong>4.2 Payment Processing:</strong> Payments are processed securely through instamojo. 
                    We do not store your credit card information.
                  </p>
                  <p>
                    <strong>4.3 Billing Cycle:</strong> Subscriptions are billed monthly unless otherwise specified. 
                    Auto-renewal will occur unless cancelled.
                  </p>
                  <p>
                    <strong>4.4 Cancellation:</strong> You may cancel your subscription at any time. 
                    Cancellation will take effect at the end of your current billing period.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Acceptable Use Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p>You agree not to:</p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Use the service for any unlawful purpose or in violation of any laws</li>
                    <li>Share your account credentials with others</li>
                    <li>Attempt to reverse engineer, hack, or compromise our systems</li>
                    <li>Upload malicious content or attempt to spread malware</li>
                    <li>Use automated tools to access our service (bots, scrapers, etc.)</li>
                    <li>Violate the intellectual property rights of others</li>
                    <li>Engage in any activity that disrupts or interferes with our services</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Intellectual Property</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p>
                    <strong>6.1 Our Content:</strong> All content on PsychSirAi, including but not limited to text, 
                    graphics, logos, images, AI models, and software, is our property or licensed to us.
                  </p>
                  <p>
                    <strong>6.2 Your Content:</strong> You retain ownership of any content you create using our platform. 
                    However, you grant us a license to analyze and process your responses for service improvement.
                  </p>
                  <p>
                    <strong>6.3 Restrictions:</strong> You may not copy, modify, distribute, or create derivative 
                    works from our content without explicit permission.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Privacy and Data Protection</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p>
                    Your privacy is important to us. Our Privacy Policy explains how we collect, use, 
                    and protect your personal information. By using our service, you consent to our 
                    privacy practices as outlined in our Privacy Policy.
                  </p>
                  <p>
                    We implement appropriate security measures to protect your personal data against 
                    unauthorized access, alteration, disclosure, or destruction.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Service Availability and Modifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p>
                    <strong>8.1 Availability:</strong> We strive to maintain 99.9% uptime but do not guarantee 
                    uninterrupted service availability.
                  </p>
                  <p>
                    <strong>8.2 Modifications:</strong> We reserve the right to modify, suspend, or discontinue 
                    any part of our service at any time with reasonable notice.
                  </p>
                  <p>
                    <strong>8.3 Updates:</strong> We may update our terms of service periodically. 
                    Continued use of our service constitutes acceptance of updated terms.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p>
                    To the maximum extent permitted by law, PsychSirAi shall not be liable for any indirect, 
                    incidental, special, consequential, or punitive damages, including but not limited to 
                    loss of profits, data, or use.
                  </p>
                  <p>
                    Our total liability for any claims arising from your use of our service shall not exceed 
                    the amount you paid us in the twelve months preceding the claim.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Governing Law and Disputes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p>
                    These terms shall be governed by and construed in accordance with the laws of India. 
                    Any disputes arising from these terms or your use of our service shall be subject to 
                    the exclusive jurisdiction of the courts in Delhi, India.
                  </p>
                  <p>
                    Before pursuing legal action, we encourage you to contact us to resolve any disputes amicably.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>11. Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p>
                    If you have any questions about these Terms & Conditions, please contact us at:
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p><strong>Email:</strong> editkarde@gmail.com</p>
                    <p><strong>Address:</strong> Delhi, India</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Terms;