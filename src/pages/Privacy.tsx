import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Shield, Eye, Lock, Database, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Privacy = () => {
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
            <Shield className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Privacy Policy
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-gray-500">
            Last updated: December 15, 2024
          </p>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  <span>1. Information We Collect</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p><strong>1.1 Personal Information:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Name, email address, and contact information</li>
                    <li>Account credentials and authentication data</li>
                    <li>Payment information (processed securely through Razorpay)</li>
                    <li>Profile information and preferences</li>
                  </ul>
                  
                  <p><strong>1.2 Test Data:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Your responses to psychological tests (PPDT, TAT, WAT, SRT)</li>
                    <li>Test performance metrics and analytics</li>
                    <li>Progress tracking data</li>
                    <li>AI-generated feedback and assessments</li>
                  </ul>
                  
                  <p><strong>1.3 Technical Information:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>IP address, browser type, and device information</li>
                    <li>Usage patterns and interaction data</li>
                    <li>Session information and timestamps</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="h-5 w-5 text-purple-600" />
                  <span>2. How We Use Your Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p><strong>2.1 Service Delivery:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Providing psychological test preparation services</li>
                    <li>Generating AI-powered feedback and analysis</li>
                    <li>Tracking your progress and performance</li>
                    <li>Personalizing your learning experience</li>
                  </ul>
                  
                  <p><strong>2.2 Service Improvement:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Improving our AI models and algorithms</li>
                    <li>Developing new features and services</li>
                    <li>Analyzing usage patterns to optimize performance</li>
                    <li>Conducting research to enhance test accuracy</li>
                  </ul>
                  
                  <p><strong>2.3 Communication:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Sending service updates and notifications</li>
                    <li>Responding to your inquiries and support requests</li>
                    <li>Providing educational content and tips</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-red-600" />
                  <span>3. Data Protection and Security</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p><strong>3.1 Security Measures:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>End-to-end encryption for data transmission</li>
                    <li>Secure database storage with access controls</li>
                    <li>Regular security audits and vulnerability assessments</li>
                    <li>Multi-factor authentication for account access</li>
                    <li>Regular backups and disaster recovery procedures</li>
                  </ul>
                  
                  <p><strong>3.2 Data Anonymization:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Test responses are anonymized for AI model training</li>
                    <li>Personal identifiers are removed from analytical datasets</li>
                    <li>Aggregate data is used for research and improvement</li>
                  </ul>
                  
                  <p><strong>3.3 Access Controls:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Strict employee access policies</li>
                    <li>Role-based permissions for data handling</li>
                    <li>Regular access reviews and audits</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Information Sharing and Disclosure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p><strong>4.1 We do not sell your personal information.</strong></p>
                  
                  <p><strong>4.2 Limited Sharing:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>With service providers (Supabase, Razorpay) under strict confidentiality agreements</li>
                    <li>Anonymized data with research partners for educational purposes</li>
                    <li>When required by law or legal process</li>
                    <li>To protect our rights, property, or safety</li>
                  </ul>
                  
                  <p><strong>4.3 Third-Party Services:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Supabase for database and authentication services</li>
                    <li>Razorpay for payment processing</li>
                    <li>Analytics tools for usage monitoring</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  <span>5. Your Rights and Choices</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p><strong>5.1 Access and Control:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>View and download your personal data</li>
                    <li>Update or correct your information</li>
                    <li>Delete your account and associated data</li>
                    <li>Control communication preferences</li>
                  </ul>
                  
                  <p><strong>5.2 Data Portability:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Export your test results and progress data</li>
                    <li>Download your account information in standard formats</li>
                  </ul>
                  
                  <p><strong>5.3 Opt-Out Options:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Disable data collection for service improvement</li>
                    <li>Opt out of marketing communications</li>
                    <li>Limit data sharing with research partners</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Cookies and Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p><strong>6.1 Cookies We Use:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Essential cookies for authentication and security</li>
                    <li>Performance cookies to improve service quality</li>
                    <li>Analytics cookies to understand usage patterns</li>
                  </ul>
                  
                  <p><strong>6.2 Cookie Management:</strong></p>
                  <p>You can control cookies through your browser settings. However, disabling essential cookies may affect service functionality.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Data Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p><strong>7.1 Retention Periods:</strong></p>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Account data: Retained while your account is active</li>
                    <li>Test data: Retained for 5 years for progress tracking</li>
                    <li>Payment data: Retained as required by law (7 years)</li>
                    <li>Analytics data: Anonymized and retained indefinitely</li>
                  </ul>
                  
                  <p><strong>7.2 Data Deletion:</strong></p>
                  <p>When you delete your account, we will remove your personal data within 30 days, except where retention is required by law.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. International Data Transfers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p>
                    Your data is primarily stored in India. If we transfer data internationally, 
                    we ensure appropriate safeguards are in place to protect your privacy rights.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Children's Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p>
                    Our service is intended for users 16 years and older. We do not knowingly collect 
                    personal information from children under 16. If you believe we have collected information 
                    from a child under 16, please contact us immediately.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Changes to This Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p>
                    We may update this Privacy Policy periodically. We will notify you of significant 
                    changes by email or through our platform. Your continued use of our service after 
                    changes constitutes acceptance of the updated policy.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>11. Contact Us</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-gray-600">
                  <p>
                    If you have any questions about this Privacy Policy or our data practices, please contact us:
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p><strong>Email:</strong> privacy@psychsir.ai</p>
                    <p><strong>Address:</strong> Bangalore, Karnataka, India</p>
                    <p><strong>Phone:</strong> +91 98765 43210</p>
                    <p><strong>Data Protection Officer:</strong> dpo@psychsir.ai</p>
                  </div>
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

export default Privacy;