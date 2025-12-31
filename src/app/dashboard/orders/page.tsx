'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import NewRequestModal from '@/components/orders/NewRequestModal';
import NewVendorModal from '@/components/orders/NewVendorModal';
import NewRepairModal from '@/components/orders/NewRepairModal';
import OrderCreationModal from '@/components/orders/OrderCreationModal';
import OrderDetailsModal from '@/components/orders/OrderDetailsModal';
import {
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Edit,
  Check,
  X,
  Settings
} from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  vendor: {
    id: string;
    name: string;
    orderingUrl?: string;
  };
  status: string;
  priority: string;
  totalAmount: number;
  expectedDelivery?: string;
  orderedBy: {
    firstName: string;
    lastName: string;
  };
  items: OrderItem[];
  createdAt: string;
}

interface OrderItem {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: {
    name: string;
    color?: string;
  };
}

interface OrderRequest {
  id: string;
  itemName: string;
  description?: string;
  quantity: number;
  urgency: string;
  status: string;
  requestedBy: {
    firstName: string;
    lastName: string;
  };
  category?: {
    name: string;
    color?: string;
  };
  vendor?: {
    name: string;
  };
  createdAt: string;
}

interface Vendor {
  id: string;
  name: string;
  category?: string;
  orderingUrl?: string;
  website?: string;
  isPreferred: boolean;
  contactEmail?: string;
  contactPhone?: string;
  _count: {
    orders: number;
    orderRequests: number;
  };
}

interface Analytics {
  summary: {
    totalOrders: number;
    totalRequests: number;
    totalSpending: number;
    averageOrderValue: number;
    deliveryPerformance: number;
  };
  monthlyTrends: Array<{
    month: string;
    orderCount: number;
    requestCount: number;
    totalSpent: number;
  }>;
  topItems: Array<{
    name: string;
    totalQuantity: number;
    totalSpent: number;
    orderCount: number;
    category: string;
  }>;
  restockSuggestions: Array<{
    name: string;
    avgDaysBetweenOrders: number;
    riskLevel: string;
    nextOrderSuggestion: string;
  }>;
}

interface TimelineEvent {
  id: string;
  type: string;
  message?: string;
  createdAt: string;
  createdBy?: { firstName: string; lastName: string };
  orderItem?: { id: string; itemName: string };
  order?: { orderNumber: string };
}

const TIMELINE_EVENT_TYPES = [
  { value: 'CREATED', label: 'Order Created' },
  { value: 'DELIVERED', label: 'Order Delivered' },
  { value: 'COMPLETED', label: 'Order Completed' },
  { value: 'ITEM_RECEIVED', label: 'Item Received' },
  { value: 'NOTE', label: 'Note' },
  { value: 'ISSUE', label: 'Issue' },
  { value: 'ORDERED', label: 'Ordered' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'CONFIRMED', label: 'Confirmed' },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('requests');
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<OrderRequest[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [repairRequests, setRepairRequests] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showNewVendorModal, setShowNewVendorModal] = useState(false);
  const [showNewRepairModal, setShowNewRepairModal] = useState(false);
  const [showOrderCreationModal, setShowOrderCreationModal] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState<OrderRequest[]>([]);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showOrderQuickModal, setShowOrderQuickModal] = useState(false);
  const [quickOrderRequest, setQuickOrderRequest] = useState<OrderRequest | null>(null);
  const [quickOrderDelivery, setQuickOrderDelivery] = useState('');
  const [quickOrderUnknown, setQuickOrderUnknown] = useState(false);

  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelineFilter, setTimelineFilter] = useState<string[]>(['CREATED', 'DELIVERED']);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersRes, requestsRes, vendorsRes, analyticsRes, repairsRes, locationsRes, timelineRes] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/order-requests'),
        fetch('/api/vendors'),
        fetch('/api/orders/analytics'),
        fetch('/api/repair-requests'),
        fetch('/api/locations'),
        fetch('/api/orders/timeline'),
      ]);

      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (requestsRes.ok) setRequests(await requestsRes.json());
      if (vendorsRes.ok) setVendors(await vendorsRes.json());
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());
      if (repairsRes.ok) setRepairRequests(await repairsRes.json());
      if (locationsRes.ok) setLocations(await locationsRes.json());
      if (timelineRes.ok) setTimeline(await timelineRes.json());
    } catch (error) {
      console.error('Error loading orders data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/order-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, status: 'APPROVED' }),
      });

      if (response.ok) {
        loadData(); // Reload data to reflect changes
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to approve request'}`);
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await fetch('/api/order-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: requestId, status: 'CANCELLED' }),
      });

      if (response.ok) {
        loadData(); // Reload data to reflect changes
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to reject request'}`);
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('Failed to reject request');
    }
  };

  const handleCreateOrderFromRequests = (requests: OrderRequest[]) => {
    setSelectedRequests(requests);
    setShowOrderCreationModal(true);
  };

  const handleCompleteRequest = (requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (req) {
      setQuickOrderRequest(req);
      setShowOrderQuickModal(true);
      setQuickOrderDelivery('');
      setQuickOrderUnknown(false);
    }
  };

  const handleQuickOrderSubmit = async () => {
    if (!quickOrderRequest) return;
    setShowOrderQuickModal(false);
    // Create order for this request
    const orderData = {
      vendorId: vendors.find(v => v.name === quickOrderRequest.vendor?.name)?.id,
      items: [{
        itemName: quickOrderRequest.itemName,
        description: quickOrderRequest.description || '',
        quantity: quickOrderRequest.quantity,
        unitPrice: 0,
        categoryId: undefined,
        minimumStock: 1,
        maxStock: 10,
        location: 'Storage',
      }],
      priority: quickOrderRequest.urgency || 'NORMAL',
      expectedDelivery: quickOrderUnknown ? null : quickOrderDelivery,
      notes: '',
      requestIds: [quickOrderRequest.id],
    };
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (response.ok) {
      loadData();
    } else {
      const error = await response.json();
      alert(`Error: ${error.error || 'Failed to create order'}`);
    }
  };

  const handleUpdateRepairStatus = async (repairId: string, status: string) => {
    try {
      const response = await fetch('/api/repair-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: repairId, status }),
      });

      if (response.ok) {
        loadData(); // Reload data to reflect changes
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to update repair status'}`);
      }
    } catch (error) {
      console.error('Error updating repair status:', error);
      alert('Failed to update repair status');
    }
  };

  const getRepairStatusColor = (status: string) => {
    switch (status) {
      case 'REPORTED': return 'bg-gray-100 text-gray-800';
      case 'ACKNOWLEDGED': return 'bg-blue-100 text-blue-800';
      case 'SCHEDULED': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-orange-100 text-orange-800';
      case 'WAITING_PARTS': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'TESTED': return 'bg-emerald-100 text-emerald-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRepairUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'LOW': return 'bg-gray-100 text-gray-800';
      case 'NORMAL': return 'bg-blue-100 text-blue-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'EMERGENCY': return 'bg-red-500 text-white';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      ORDERED: 'bg-purple-100 text-purple-800',
      SHIPPED: 'bg-indigo-100 text-indigo-800',
      DELIVERED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      DRAFT: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyColor = (urgency: string) => {
    const colors: Record<string, string> = {
      URGENT: 'bg-red-100 text-red-800',
      HIGH: 'bg-orange-100 text-orange-800',
      NORMAL: 'bg-blue-100 text-blue-800',
      LOW: 'bg-gray-100 text-gray-800',
    };
    return colors[urgency] || 'bg-gray-100 text-gray-800';
  };

  const getRiskColor = (riskLevel: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[riskLevel] || 'bg-gray-100 text-gray-800';
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.requestedBy.firstName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.vendor.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleTimelineFilter = (type: string) => {
    setTimelineFilter(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const filteredTimeline = timeline.filter(ev => timelineFilter.includes(ev.type));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Orders Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage clinic supplies, equipment, and materials ordering
          </p>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => setShowNewRequestModal(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Request
        </Button>
      </div>

      {/* Summary Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Requests</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.totalRequests}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Spending</p>
                  <p className="text-2xl font-bold text-gray-900">€{analytics.summary.totalSpending.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">€{analytics.summary.averageOrderValue.toFixed(0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">On-Time Delivery</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.summary.deliveryPerformance}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Requests ({requests.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            Orders ({orders.filter(order => order.status !== 'DELIVERED' && order.status !== 'COMPLETED').length})
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Vendors ({vendors.length})
          </TabsTrigger>
          <TabsTrigger value="repairs" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Repairs
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>

        </TabsList>

        {/* Search and Filter Bar */}
        {(activeTab === 'requests' || activeTab === 'orders') && (
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="ORDERED">Ordered</option>
              <option value="SHIPPED">Shipped</option>
              <option value="DELIVERED">Delivered</option>
            </select>
          </div>
        )}

        <TabsContent value="requests" className="space-y-4">
          {/* Bulk Actions for Approved Requests */}
          {filteredRequests.filter(r => r.status === 'APPROVED').length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-blue-900">Create Order from Approved Requests</h4>
                  <p className="text-sm text-blue-700">
                    {filteredRequests.filter(r => r.status === 'APPROVED').length} approved request{filteredRequests.filter(r => r.status === 'APPROVED').length !== 1 ? 's' : ''} ready to be ordered
                  </p>
                </div>
                <Button
                  onClick={() => handleCreateOrderFromRequests(filteredRequests.filter(r => r.status === 'APPROVED'))}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Package className="h-4 w-4 mr-2" />
                  Create Order
                </Button>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            {filteredRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{request.itemName}</h3>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                      <Badge className={getUrgencyColor(request.urgency)}>
                        {request.urgency}
                      </Badge>
                      {request.category && (
                        <Badge variant="outline" style={{ borderColor: request.category.color }}>
                          {request.category.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Qty: {request.quantity}</span>
                      <span>Requested by: {request.requestedBy.firstName} {request.requestedBy.lastName}</span>
                      <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                      {request.vendor && <span>Vendor: {request.vendor.name}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {request.status === 'PENDING' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproveRequest(request.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejectRequest(request.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {request.status === 'APPROVED' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCompleteRequest(request.id)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Package className="h-4 w-4 mr-1" />
                        Mark Ordered
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="grid gap-4">
            {filteredOrders.map((order) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{order.orderNumber}</h3>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <Badge variant="outline">
                        {order.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                      <span className="font-medium">{order.vendor.name}</span>
                      <span>€{order.totalAmount.toFixed(2)}</span>
                      <span>{order.items.length} items</span>
                      {order.expectedDelivery && (
                        <span>Expected: {new Date(order.expectedDelivery).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      Ordered by: {order.orderedBy.firstName} {order.orderedBy.lastName} on {new Date(order.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {order.vendor.orderingUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={order.vendor.orderingUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Vendor Site
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => { setSelectedOrderId(order.id); setShowOrderDetailsModal(true); }}>
                      View Details
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Repairs Tab */}
        <TabsContent value="repairs" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Repair Requests</h3>
              <p className="text-sm text-gray-500">
                Track equipment repairs, maintenance, and service calls
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => window.location.href = '/dashboard/repair-settings'}
              >
                <Settings className="h-4 w-4 mr-2" />
                Repair Settings
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowNewRepairModal(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Report Issue
              </Button>
            </div>
          </div>

          {/* Repair Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Repairs</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {repairRequests.filter(r => ['REPORTED', 'ACKNOWLEDGED', 'SCHEDULED', 'IN_PROGRESS', 'WAITING_PARTS'].includes(r.status)).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently being handled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scheduled Today</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {repairRequests.filter(r =>
                    r.scheduledDate &&
                    new Date(r.scheduledDate).toDateString() === new Date().toDateString()
                  ).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Service visits today
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Urgent Issues</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {repairRequests.filter(r => ['URGENT', 'EMERGENCY'].includes(r.urgency)).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Require immediate attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">This Month</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {repairRequests.filter(r =>
                    r.completedAt &&
                    new Date(r.completedAt).getMonth() === new Date().getMonth()
                  ).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Completed repairs
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search repairs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Status</option>
              <option value="REPORTED">Reported</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Repair Requests List */}
          <div className="space-y-4">
            {repairRequests
              .filter(repair =>
                (statusFilter === 'all' || repair.status === statusFilter) &&
                (searchTerm === '' ||
                  repair.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  repair.location?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  repair.equipment?.name.toLowerCase().includes(searchTerm.toLowerCase())
                )
              )
              .map((repair) => (
                <Card key={repair.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{repair.title}</h4>
                        <Badge className={getRepairStatusColor(repair.status)}>
                          {repair.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getRepairUrgencyColor(repair.urgency)}>
                          {repair.urgency}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Location:</span> {repair.location?.name}
                        </div>
                        {repair.equipment && (
                          <div>
                            <span className="font-medium">Equipment:</span> {repair.equipment.name}
                          </div>
                        )}
                        {repair.contactPerson && (
                          <div>
                            <span className="font-medium">Contact:</span> {repair.contactPerson.name}
                          </div>
                        )}
                        {repair.scheduledDate && (
                          <div>
                            <span className="font-medium">Scheduled:</span> {new Date(repair.scheduledDate).toLocaleDateString()}
                            {repair.scheduledTime && ` at ${repair.scheduledTime}`}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Requested by:</span> {repair.requestedBy.firstName} {repair.requestedBy.lastName}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span> {new Date(repair.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      <p className="text-sm text-gray-700 mb-3">{repair.description}</p>

                      {repair.symptoms && repair.symptoms.length > 0 && (
                        <div className="mb-3">
                          <span className="text-sm font-medium text-gray-700">Symptoms: </span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {repair.symptoms.map((symptom: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {symptom}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {repair.workPerformed && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">Work Performed: </span>
                          <span className="text-sm text-gray-600">{repair.workPerformed}</span>
                        </div>
                      )}

                      {repair.cost && (
                        <div className="mb-2">
                          <span className="text-sm font-medium text-gray-700">Cost: </span>
                          <span className="text-sm text-gray-600">€{repair.cost.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      {repair.status === 'REPORTED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateRepairStatus(repair.id, 'ACKNOWLEDGED')}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Acknowledge
                        </Button>
                      )}
                      {repair.status === 'ACKNOWLEDGED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateRepairStatus(repair.id, 'SCHEDULED')}
                          className="text-yellow-600 hover:text-yellow-700"
                        >
                          Schedule
                        </Button>
                      )}
                      {repair.status === 'SCHEDULED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateRepairStatus(repair.id, 'IN_PROGRESS')}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          Start Work
                        </Button>
                      )}
                      {repair.status === 'IN_PROGRESS' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateRepairStatus(repair.id, 'COMPLETED')}
                          className="text-green-600 hover:text-green-700"
                        >
                          Complete
                        </Button>
                      )}
                      {repair.status === 'COMPLETED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateRepairStatus(repair.id, 'CLOSED')}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          Close
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

            {repairRequests.length === 0 && (
              <Card className="p-8 text-center">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No repair requests yet</h3>
                <p className="text-gray-500 mb-4">
                  Report equipment issues and track repairs to keep your clinic running smoothly.
                </p>
                <Button
                  onClick={() => setShowNewRepairModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Report First Issue
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <>
              {/* Restock Suggestions */}
              {analytics.restockSuggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      Smart Restock Suggestions
                    </CardTitle>
                    <CardDescription>
                      Items that may need restocking based on ordering patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analytics.restockSuggestions.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-gray-600">
                              Avg. {item.avgDaysBetweenOrders} days between orders
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getRiskColor(item.riskLevel)}>
                              {item.riskLevel} risk
                            </Badge>
                            <span className="text-sm text-gray-500">
                              Next: {new Date(item.nextOrderSuggestion).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top Items */}
              <Card>
                <CardHeader>
                  <CardTitle>Most Ordered Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.category}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">Qty: {item.totalQuantity}</p>
                          <p className="text-sm text-gray-600">€{item.totalSpent.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Order Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {TIMELINE_EVENT_TYPES.map(ev => (
                      <Button key={ev.value} size="sm" variant={timelineFilter.includes(ev.value) ? 'default' : 'outline'} onClick={() => toggleTimelineFilter(ev.value)}>
                        {ev.label}
                      </Button>
                    ))}
                  </div>
                  <div className="space-y-4 border-l-2 border-blue-200 pl-4 max-h-96 overflow-y-auto">
                    {filteredTimeline.length === 0 ? (
                      <div className="text-gray-500 text-sm">No events for selected filters.</div>
                    ) : (
                      filteredTimeline.map(event => (
                        <div key={event.id} className="relative">
                          <div className="absolute -left-5 top-1.5 w-3 h-3 rounded-full bg-blue-500"></div>
                          <div className="ml-2">
                            <div className="text-xs text-gray-400">{new Date(event.createdAt).toLocaleString()}</div>
                            <div className="text-sm">
                              <span className="font-medium">{event.type.replace(/_/g, ' ')}</span>
                              {event.order && (<span className="ml-2 text-blue-700">[{event.order.orderNumber}]</span>)}
                              {event.orderItem && (<span className="ml-2 text-purple-700">[{event.orderItem.itemName}]</span>)}
                              {event.message && (<span className="ml-2 text-gray-700">- {event.message}</span>)}
                            </div>
                            {event.createdBy && (<div className="text-xs text-gray-500">By {event.createdBy.firstName} {event.createdBy.lastName}</div>)}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="vendors" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Vendors</h3>
            <Button
              onClick={() => setShowNewVendorModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Vendor
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vendors.map((vendor) => (
              <motion.div
                key={vendor.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      {vendor.name}
                      {vendor.isPreferred && (
                        <Badge className="bg-yellow-100 text-yellow-800">Preferred</Badge>
                      )}
                    </h3>
                    {vendor.category && (
                      <p className="text-sm text-gray-600">{vendor.category}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Orders:</span>
                    <span>{vendor._count.orders}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Requests:</span>
                    <span>{vendor._count.orderRequests}</span>
                  </div>
                  {vendor.contactEmail && (
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="truncate ml-2">{vendor.contactEmail}</span>
                    </div>
                  )}
                  {vendor.contactPhone && (
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span>{vendor.contactPhone}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  {vendor.orderingUrl && (
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <a href={vendor.orderingUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Order
                      </a>
                    </Button>
                  )}
                  {vendor.website && (
                    <Button variant="outline" size="sm" asChild className="flex-1">
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Website
                      </a>
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <NewRequestModal
        isOpen={showNewRequestModal}
        onClose={() => setShowNewRequestModal(false)}
        onSuccess={loadData}
      />

      <NewVendorModal
        isOpen={showNewVendorModal}
        onClose={() => setShowNewVendorModal(false)}
        onSuccess={loadData}
      />

      <NewRepairModal
        isOpen={showNewRepairModal}
        onClose={() => setShowNewRepairModal(false)}
        onSuccess={loadData}
      />

      <OrderCreationModal
        isOpen={showOrderCreationModal}
        onClose={() => setShowOrderCreationModal(false)}
        onSuccess={loadData}
        selectedRequests={selectedRequests}
      />

      <OrderDetailsModal
        isOpen={showOrderDetailsModal}
        onClose={() => setShowOrderDetailsModal(false)}
        orderId={selectedOrderId}
        onStatusChange={loadData}
      />

      {/* Quick Order Modal */}
      {showOrderQuickModal && quickOrderRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold mb-2">Set Expected Delivery Date</h2>
            <p className="mb-4">For <span className="font-medium">{quickOrderRequest.itemName}</span></p>
            <div className="mb-4">
              <label className="flex items-center gap-2 mb-2">
                <input type="checkbox" checked={quickOrderUnknown} onChange={e => setQuickOrderUnknown(e.target.checked)} />
                I don't know the delivery date yet
              </label>
              {!quickOrderUnknown && (
                <input
                  type="date"
                  className="border rounded px-2 py-1 w-full"
                  value={quickOrderDelivery}
                  onChange={e => setQuickOrderDelivery(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowOrderQuickModal(false)}>Cancel</Button>
              <Button onClick={handleQuickOrderSubmit} disabled={!quickOrderUnknown && !quickOrderDelivery} className="bg-blue-600 hover:bg-blue-700">Create Order</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 