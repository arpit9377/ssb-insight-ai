import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Clock, MessageSquare, Users, Heart, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Footer } from '@/components/layout/Footer';

const Contact = () => {
  const navigate = useNavigate();

  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Support',
      value: 'editkarde@gmail.com',
      description: 'Send us your queries anytime - we respond within 24-48 hours'
    },
    {
      icon: MapPin,
      title: 'Headquarters',
      value: 'Delhi, India',
      description: 'Our main office and development center'
    },
    {
      icon: Clock,
      title: 'Response Time',
      value: '24-48 hours',
      description: 'Average response time for all support queries'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      value: '25+ Countries',
      description: 'Serving aspiring officers worldwide'
    }
  ];

  const supportChannels = [
    {
      icon: MessageSquare,
      title: 'General Support',
      description: 'For account issues, technical problems, or general questions about our platform.',
      action: 'Email Us',
      link: 'mailto:editkarde@gmail.com?subject=General Support'
    },
    {
      icon: Users,
      title: 'Join Our Community',
      description: 'Connect with fellow aspirants, share experiences, and get peer support.',
      action: 'Join Telegram',
      link: 'https://t.me/+SMwk9YpvS8Q5MTZl'
    },
    {
      icon: Heart,
      title: 'Follow Our Journey',
      description: 'Stay updated with tips, success stories, and platform updates.',
      action: 'Follow Instagram',
      link: 'https://www.instagram.com/psychsirai/'
    }
  ];

  const faqTopics = [
    {
      title: 'Account & Billing',
      questions: [
        'How do I upgrade my subscription?',
        'Can I get a refund?',
        'How to reset my password?'
      ]
    },
    {
      title: 'Tests & Features',
      questions: [
        'How accurate is the AI analysis?',
        'Can I retake tests?',
        'What devices are supported?'
      ]
    },
    {
      title: 'Technical Issues',
      questions: [
        'Test not loading properly',
        'Feedback not showing',
        'Login problems'
      ]
    }
  ];

  return (
    <AppLayout 
      title="Contact Us" 
      showBackButton={true}
      backTo="/"
    >
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        {/* Hero Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              We're Here to Help
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Have questions about PsychSirAi? Need technical support? Want to share feedback? 
              Our dedicated support team is here to assist you on your SSB preparation journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => window.open('mailto:editkarde@gmail.com', '_blank')} className="px-8 py-3">
                <Mail className="mr-2 h-5 w-5" />
                Email Support
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/faq')} className="px-8 py-3">
                View FAQ
              </Button>
            </div>
          </div>
        </section>

        {/* Contact Info */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {contactInfo.map((info, index) => {
                const IconComponent = info.icon;
                return (
                  <Card key={index} className="text-center hover:shadow-lg transition-shadow bg-white">
                    <CardHeader>
                      <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="h-8 w-8 text-blue-600" />
                      </div>
                      <CardTitle className="text-lg">{info.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-gray-900 mb-2">{info.value}</p>
                      <p className="text-gray-600 text-sm leading-relaxed">{info.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Support Channels */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Get in Touch</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Choose the best way to reach us based on your needs. We're committed to providing excellent support.
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {supportChannels.map((channel, index) => {
                const IconComponent = channel.icon;
                return (
                  <Card key={index} className="hover:shadow-xl transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-xl">{channel.title}</CardTitle>
                      <CardDescription className="text-gray-600 leading-relaxed">
                        {channel.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={() => window.open(channel.link, '_blank')} 
                        className="w-full"
                      >
                        {channel.action}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Preview */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Common Questions</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Before reaching out, check if your question is answered in our comprehensive FAQ section.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {faqTopics.map((topic, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow bg-white">
                  <CardHeader>
                    <CardTitle className="text-xl text-center">{topic.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {topic.questions.map((question, qIndex) => (
                        <li key={qIndex} className="text-gray-600 text-sm border-l-4 border-blue-200 pl-3">
                          {question}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      variant="outline" 
                      className="w-full mt-4" 
                      onClick={() => navigate('/faq')}
                    >
                      View All FAQs
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Office Hours & Support Promise */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-6">Our Support Promise</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">24-48h</div>
                <div className="text-blue-100">Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">99.9%</div>
                <div className="text-blue-100">Issue Resolution</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">4.8/5</div>
                <div className="text-blue-100">Support Rating</div>
              </div>
            </div>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              We're committed to providing excellent support to help you succeed in your SSB preparation. 
              Your success is our success.
            </p>
            <Button 
              size="lg" 
              variant="secondary" 
              onClick={() => window.open('mailto:editkarde@gmail.com?subject=Support Request', '_blank')} 
              className="px-8 py-3"
            >
              Contact Support Now
            </Button>
          </div>
        </section>
      </div>
      <Footer />
    </AppLayout>
  );
};

export default Contact;