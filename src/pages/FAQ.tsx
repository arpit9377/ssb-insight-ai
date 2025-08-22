import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HelpCircle, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FAQ = () => {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqs = [
    {
      category: "General",
      questions: [
        {
          question: "What is PsychSirAi?",
          answer: "PsychSirAi is an AI-powered platform designed for SSB (Services Selection Board) psychological test preparation. We provide comprehensive training for PPDT, TAT, WAT, and SRT tests with detailed AI feedback and analysis."
        },
        {
          question: "Who can use PsychSirAi?",
          answer: "Our platform is designed for anyone preparing for SSB interviews, including candidates for Indian Army, Navy, Air Force, and other defense services. It's suitable for NDA, CDS, AFCAT, and direct entry candidates."
        },
        {
          question: "How accurate is the AI feedback?",
          answer: "Our AI models are trained on thousands of successful SSB responses and validated by military psychologists. The feedback is designed to be highly accurate and aligned with actual SSB evaluation criteria."
        }
      ]
    },
    {
      category: "Features",
      questions: [
        {
          question: "What psychological tests are covered?",
          answer: "We cover all four major SSB psychological tests: PPDT (Picture Perception & Discussion Test), TAT (Thematic Apperception Test), WAT (Word Association Test), and SRT (Situation Reaction Test)."
        },
        {
          question: "How does the AI analysis work?",
          answer: "Our AI analyzes your responses for the 15 Officer Like Qualities (OLQs) including leadership, initiative, courage, determination, and more. It provides detailed feedback on your psychological traits and suggests areas for improvement."
        },
        {
          question: "Can I track my progress over time?",
          answer: "Yes! Our platform includes comprehensive progress tracking, performance analytics, trend analysis, and personalized improvement recommendations based on your test history."
        }
      ]
    },
    {
      category: "Subscription & Billing",
      questions: [
        {
          question: "What subscription plans are available?",
          answer: "We offer a 7-day free trial, Basic Plan (₹999/month), and Premium Plan (₹1,999/month). Each plan includes different features and levels of access to our services."
        },
        {
          question: "Can I cancel my subscription anytime?",
          answer: "Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period, and no future charges will be made."
        },
        {
          question: "Do you offer refunds?",
          answer: "Since our product is digital and provides immediate access, we do not offer refunds once purchased. However, we encourage using our free trial to evaluate the platform before subscribing."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit/debit cards, UPI, net banking, and digital wallets through our secure payment processor Cashfree."
        }
      ]
    },
    {
      category: "Technical Support",
      questions: [
        {
          question: "What are the system requirements?",
          answer: "You need a modern web browser (Chrome, Firefox, Safari, Edge), stable internet connection, and any device (computer, tablet, smartphone). No additional software installation is required."
        },
        {
          question: "Is my data secure?",
          answer: "Yes, we use enterprise-grade security including end-to-end encryption, secure data storage, and strict access controls. Your personal information and test data are protected according to our Privacy Policy."
        },
        {
          question: "Can I access the platform offline?",
          answer: "Our platform requires an internet connection for AI analysis and real-time feedback. However, you can download your test results and progress reports for offline review."
        },
        {
          question: "What if I face technical issues?",
          answer: "Our technical support team is available Monday-Friday, 9 AM-6 PM IST. Contact us at support@psychsirai.ai or +91 8319635728 for assistance."
        }
      ]
    },
    {
      category: "Test Preparation",
      questions: [
        {
          question: "How should I prepare using the platform?",
          answer: "Start with our free trial to familiarize yourself with the interface. Take regular practice tests, review AI feedback carefully, and focus on improving the OLQs highlighted in your analysis."
        },
        {
          question: "How long should I prepare before my SSB?",
          answer: "Preparation duration varies by individual, but we recommend at least 2-3 months of consistent practice. Our analytics will help you track your readiness and improvement over time."
        },
        {
          question: "Can I practice specific scenarios?",
          answer: "Yes, our platform includes a wide variety of scenarios for each test type. You can also access different difficulty levels and specific themes based on your preparation needs."
        },
        {
          question: "How often should I take practice tests?",
          answer: "We recommend taking practice tests 3-4 times per week, with regular review of AI feedback. Quality practice with proper analysis is more important than quantity."
        }
      ]
    }
  ];

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
            <HelpCircle className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Find answers to common questions about PsychSirAi and our SSB preparation services.
          </p>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {faqs.map((category, categoryIndex) => (
              <Card key={categoryIndex}>
                <CardHeader>
                  <CardTitle className="text-xl text-blue-600">
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.questions.map((faq, faqIndex) => {
                      const itemIndex = categoryIndex * 100 + faqIndex;
                      const isOpen = openItems.includes(itemIndex);
                      
                      return (
                        <Collapsible key={faqIndex}>
                          <CollapsibleTrigger
                            className="w-full text-left p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                            onClick={() => toggleItem(itemIndex)}
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900 pr-4">
                                {faq.question}
                              </h4>
                              {isOpen ? (
                                <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                              )}
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="px-4 pb-4">
                            <p className="text-gray-600 leading-relaxed">
                              {faq.answer}
                            </p>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Still Have Questions?
          </h3>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is here to help. 
            Get in touch and we'll get back to you as soon as possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/contact')}
              className="px-8"
            >
              Contact Support
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.open('mailto:support@psychsirai.ai')}
              className="px-8"
            >
              Email Us Directly
            </Button>
          </div>
          
          <div className="mt-12 bg-blue-50 rounded-lg p-6">
            <h4 className="font-semibold text-gray-900 mb-4">Quick Support Info</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-900">Email Support</p>
                <p>support@psychsirai.ai</p>
                <p>Response: 4-6 hours</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Phone Support</p>
                <p>+91 8319635728</p>
                <p>Mon-Fri, 9 AM - 6 PM IST</p>
              </div>
              <div>
                <p className="font-medium text-gray-900">Live Chat</p>
                <p>Available on website</p>
                <p>Mon-Fri, Business Hours</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <img src="/lovable-uploads/d3dbc8a1-8206-42d0-8106-40fc4d962c94.png" alt="PsychSirAi Logo" className="h-8 w-8" />
                <h3 className="text-2xl font-bold">PsychSirAi</h3>
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
            <p>&copy; 2024 PsychSirAi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FAQ;