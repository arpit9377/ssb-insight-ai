import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  DollarSign, 
  Shield,
  Eye,
  Search,
  Filter,
  Upload,
  ImageIcon
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { testLimitService } from '@/services/testLimitService';
import ContentManagement from '@/components/admin/ContentManagement';
import { AppLayout } from '@/components/layout/AppLayout';

const AdminDashboard = () => {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRevenue: 0
  });

  // Check if user is admin (you can modify this logic)
  const isAdmin = user?.primaryEmailAddress?.emailAddress === 'editkarde@gmail.com';

  useEffect(() => {
    if (isAdmin) {
      loadPaymentRequests();
      loadStats();
    }
  }, [isAdmin]);

  const loadPaymentRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      setPaymentRequests(data || []);
    } catch (error) {
      console.error('Error loading payment requests:', error);
      toast({
        title: "Error",
        description: "Failed to load payment requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('status, amount_paid');

      if (error) throw error;

      const newStats = {
        total: data?.length || 0,
        pending: data?.filter(r => r.status === 'pending').length || 0,
        approved: data?.filter(r => r.status === 'approved').length || 0,
        rejected: data?.filter(r => r.status === 'rejected').length || 0,
        totalRevenue: data?.filter(r => r.status === 'approved').reduce((sum, r) => sum + r.amount_paid, 0) || 0
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleApprovePayment = async (requestId: string, userId: string) => {
    setProcessingId(requestId);
    try {
      // Update payment request status
      const { error: updateError } = await supabase
        .from('payment_requests')
        .update({
          status: 'approved',
          processed_at: new Date().toISOString(),
          processed_by: user?.id,
          admin_notes: adminNotes
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Activate paid subscription for user
      const success = await testLimitService.activatePaidSubscription(userId);
      
      if (!success) {
        throw new Error('Failed to activate subscription');
      }

      toast({
        title: "Payment Approved",
        description: "User subscription has been activated successfully"
      });

      loadPaymentRequests();
      loadStats();
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error approving payment:', error);
      toast({
        title: "Error",
        description: "Failed to approve payment",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectPayment = async (requestId: string) => {
    console.log('Reject payment called with requestId:', requestId);
    console.log('Admin notes:', adminNotes);
    
    if (!adminNotes.trim()) {
      toast({
        title: "Error",
        description: "Please provide rejection reason in admin notes",
        variant: "destructive"
      });
      return;
    }

    setProcessingId(requestId);
    try {
      console.log('Updating payment request to rejected status...');
      const { error } = await supabase
        .from('payment_requests')
        .update({
          status: 'rejected',
          processed_at: new Date().toISOString(),
          processed_by: user?.id,
          admin_notes: adminNotes
        })
        .eq('id', requestId);

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      console.log('Payment request rejected successfully');
      toast({
        title: "Payment Rejected",
        description: "Payment request has been rejected successfully"
      });

      loadPaymentRequests();
      loadStats();
      setSelectedRequest(null);
      setAdminNotes('');
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: "Error",
        description: `Failed to reject payment: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = paymentRequests.filter(request => {
    const matchesSearch = searchTerm === '' || 
      request.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.phone_number.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (!isAdmin) {
    return (
      <AppLayout 
        title="Access Denied" 
        showBackButton={true}
        backTo="/dashboard"
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="text-center p-8">
              <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
              <p className="text-gray-600">You don't have admin permissions to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Admin Dashboard" 
      showBackButton={true}
      backTo="/dashboard"
    >
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage payment requests, user subscriptions, and test content</p>
        </div>

        <Tabs defaultValue="payments" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="payments">Payment Management</TabsTrigger>
            <TabsTrigger value="content">Content Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="payments" className="mt-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                      <p className="text-gray-600">Total Requests</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                      <p className="text-gray-600">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                      <p className="text-gray-600">Approved</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
                      <p className="text-gray-600">Rejected</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue}</p>
                      <p className="text-gray-600">Revenue</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="w-48">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Requests */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Requests List */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Payment Requests</h2>
                {loading ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p>Loading payment requests...</p>
                    </CardContent>
                  </Card>
                ) : filteredRequests.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-500">No payment requests found</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredRequests.map((request) => (
                    <Card key={request.id} className={`cursor-pointer hover:shadow-md transition-shadow ${selectedRequest?.id === request.id ? 'border-blue-500' : ''}`}>
                      <CardContent className="p-4" onClick={() => setSelectedRequest(request)}>
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">{request.user_name}</h3>
                            <p className="text-sm text-gray-600">{request.user_email}</p>
                            <p className="text-sm text-gray-600">{request.phone_number}</p>
                          </div>
                          <Badge variant={
                            request.status === 'approved' ? 'default' :
                            request.status === 'rejected' ? 'destructive' : 'secondary'
                          }>
                            {request.status}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">₹{request.amount_paid}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(request.requested_at).toLocaleDateString()}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Request Details */}
              <div className="lg:sticky lg:top-4">
                <h2 className="text-xl font-semibold mb-4">Request Details</h2>
                {selectedRequest ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Request #{selectedRequest.id.slice(0, 8)}</CardTitle>
                      <CardDescription>
                        Submitted on {new Date(selectedRequest.requested_at).toLocaleString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">User Information</h4>
                        <p><strong>Name:</strong> {selectedRequest.user_name}</p>
                        <p><strong>Email:</strong> {selectedRequest.user_email}</p>
                        <p><strong>Phone:</strong> {selectedRequest.phone_number}</p>
                        <p><strong>Amount:</strong> ₹{selectedRequest.amount_paid}</p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Payment Screenshot</h4>
                        <img 
                          src={selectedRequest.payment_screenshot_url} 
                          alt="Payment Screenshot"
                          className="w-full max-w-sm rounded-lg border"
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => window.open(selectedRequest.payment_screenshot_url, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Full Size
                        </Button>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Admin Notes</h4>
                        <Textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add notes about this payment request..."
                          rows={3}
                        />
                      </div>

                      {selectedRequest.status === 'pending' && (
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handleApprovePayment(selectedRequest.id, selectedRequest.user_id)}
                            disabled={processingId === selectedRequest.id}
                            className="flex-1"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => {
                              console.log('Reject button clicked');
                              console.log('Selected request ID:', selectedRequest.id);
                              console.log('User ID for auth:', user?.id);
                              handleRejectPayment(selectedRequest.id);
                            }}
                            disabled={processingId === selectedRequest.id}
                            className="flex-1"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}

                      {selectedRequest.status !== 'pending' && (
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="font-medium">Status: {selectedRequest.status}</p>
                          {selectedRequest.processed_at && (
                            <p className="text-sm text-gray-600">
                              Processed on: {new Date(selectedRequest.processed_at).toLocaleString()}
                            </p>
                          )}
                          {selectedRequest.admin_notes && (
                            <p className="text-sm mt-1">
                              <strong>Notes:</strong> {selectedRequest.admin_notes}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-gray-500">Select a payment request to view details</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="content" className="mt-6">
            <ContentManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </AppLayout>
  );
};

export default AdminDashboard;