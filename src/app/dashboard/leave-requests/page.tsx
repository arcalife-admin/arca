'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import {
  Button,
} from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Input,
} from '@/components/ui/input'
import {
  Label,
} from '@/components/ui/label'
import {
  Textarea,
} from '@/components/ui/textarea'
import {
  Badge,
} from '@/components/ui/badge'
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  MessageSquare,
  Eye,
  CalendarDays,
  Trash2,
  Edit,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import LeaveRequestForm from '@/components/leave/LeaveRequestForm'

interface LeaveRequest {
  id: string
  title: string
  description?: string
  leaveType: string
  startDate: string
  endDate: string
  isPartialDay: boolean
  startTime?: string
  endTime?: string
  totalDays: number
  status: string
  reviewComments?: string
  hasAlternative: boolean
  alternativeStartDate?: string
  alternativeEndDate?: string
  alternativeComments?: string
  alternativeAccepted?: boolean
  createdAt: string
  reviewedBy?: {
    id: string
    firstName: string
    lastName: string
  }
}

export default function UserLeaveRequestsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [detailsDialog, setDetailsDialog] = useState(false)
  const [alternativeDialog, setAlternativeDialog] = useState(false)
  const [responseComments, setResponseComments] = useState('')

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return

    if (!session?.user) {
      router.push('/login')
      return
    }

    fetchLeaveRequests()
  }, [session, status, router])

  const fetchLeaveRequests = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/leave-requests?view=user')
      if (response.ok) {
        const data = await response.json()
        setLeaveRequests(data.leaveRequests)
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error)
      toast({
        title: 'Error',
        description: 'Failed to load leave requests.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAlternativeResponse = async (leaveRequestId: string, action: 'ACCEPT' | 'REJECT') => {
    try {
      const response = await fetch('/api/leave-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaveRequestId,
          action: action === 'ACCEPT' ? 'ACCEPT_ALTERNATIVE' : 'REJECT_ALTERNATIVE',
          responseComments,
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Alternative proposal ${action.toLowerCase()}ed successfully.`,
        })
        fetchLeaveRequests()
        setAlternativeDialog(false)
        setSelectedRequest(null)
        setResponseComments('')
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to respond to alternative proposal.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error responding to alternative:', error)
      toast({
        title: 'Error',
        description: 'Failed to respond to alternative proposal. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleCancelRequest = async (leaveRequestId: string) => {
    try {
      const response = await fetch('/api/leave-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          leaveRequestId,
          action: 'CANCEL',
        }),
      })

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Leave request cancelled successfully.',
        })
        fetchLeaveRequests()
      } else {
        const error = await response.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to cancel leave request.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error cancelling request:', error)
      toast({
        title: 'Error',
        description: 'Failed to cancel leave request. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': case 'ALTERNATIVE_ACCEPTED': return 'bg-green-500'
      case 'DENIED': case 'ALTERNATIVE_REJECTED': case 'CANCELLED': return 'bg-red-500'
      case 'PENDING': case 'ALTERNATIVE_PROPOSED': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'APPROVED': case 'ALTERNATIVE_ACCEPTED': return 'default'
      case 'DENIED': case 'ALTERNATIVE_REJECTED': case 'CANCELLED': return 'destructive'
      case 'PENDING': case 'ALTERNATIVE_PROPOSED': return 'secondary'
      default: return 'outline'
    }
  }

  const formatLeaveType = (type: string) => {
    return type.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ')
  }

  const pendingRequests = leaveRequests.filter(req => req.status === 'PENDING')
  const approvedRequests = leaveRequests.filter(req => req.status === 'APPROVED' || req.status === 'ALTERNATIVE_ACCEPTED')
  const rejectedRequests = leaveRequests.filter(req => req.status === 'DENIED' || req.status === 'ALTERNATIVE_REJECTED' || req.status === 'CANCELLED')
  const alternativeRequests = leaveRequests.filter(req => req.status === 'ALTERNATIVE_PROPOSED')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Leave Requests</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your leave requests and view their status
          </p>
        </div>
        <LeaveRequestForm onSubmit={fetchLeaveRequests} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{leaveRequests.length}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingRequests.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{approvedRequests.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Need Response</p>
                <p className="text-2xl font-bold text-orange-600">{alternativeRequests.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alternative Proposals Alert */}
      {alternativeRequests.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {alternativeRequests.length} leave request{alternativeRequests.length !== 1 ? 's' : ''} with alternative proposals that require your response.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({leaveRequests.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingRequests.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approvedRequests.length})</TabsTrigger>
          <TabsTrigger value="alternatives">Alternatives ({alternativeRequests.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejectedRequests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <LeaveRequestsTable
            requests={leaveRequests}
            onViewDetails={(request) => {
              setSelectedRequest(request)
              setDetailsDialog(true)
            }}
            onRespondToAlternative={(request) => {
              setSelectedRequest(request)
              setAlternativeDialog(true)
            }}
            onCancel={handleCancelRequest}
            getStatusVariant={getStatusVariant}
            formatLeaveType={formatLeaveType}
            formatStatus={formatStatus}
          />
        </TabsContent>

        <TabsContent value="pending">
          <LeaveRequestsTable
            requests={pendingRequests}
            onViewDetails={(request) => {
              setSelectedRequest(request)
              setDetailsDialog(true)
            }}
            onRespondToAlternative={(request) => {
              setSelectedRequest(request)
              setAlternativeDialog(true)
            }}
            onCancel={handleCancelRequest}
            getStatusVariant={getStatusVariant}
            formatLeaveType={formatLeaveType}
            formatStatus={formatStatus}
          />
        </TabsContent>

        <TabsContent value="approved">
          <LeaveRequestsTable
            requests={approvedRequests}
            onViewDetails={(request) => {
              setSelectedRequest(request)
              setDetailsDialog(true)
            }}
            onRespondToAlternative={(request) => {
              setSelectedRequest(request)
              setAlternativeDialog(true)
            }}
            onCancel={handleCancelRequest}
            getStatusVariant={getStatusVariant}
            formatLeaveType={formatLeaveType}
            formatStatus={formatStatus}
          />
        </TabsContent>

        <TabsContent value="alternatives">
          <LeaveRequestsTable
            requests={alternativeRequests}
            onViewDetails={(request) => {
              setSelectedRequest(request)
              setDetailsDialog(true)
            }}
            onRespondToAlternative={(request) => {
              setSelectedRequest(request)
              setAlternativeDialog(true)
            }}
            onCancel={handleCancelRequest}
            getStatusVariant={getStatusVariant}
            formatLeaveType={formatLeaveType}
            formatStatus={formatStatus}
          />
        </TabsContent>

        <TabsContent value="rejected">
          <LeaveRequestsTable
            requests={rejectedRequests}
            onViewDetails={(request) => {
              setSelectedRequest(request)
              setDetailsDialog(true)
            }}
            onRespondToAlternative={(request) => {
              setSelectedRequest(request)
              setAlternativeDialog(true)
            }}
            onCancel={handleCancelRequest}
            getStatusVariant={getStatusVariant}
            formatLeaveType={formatLeaveType}
            formatStatus={formatStatus}
          />
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Leave Request Details</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">{selectedRequest.title}</h3>
                {selectedRequest.description && (
                  <p className="text-sm text-gray-500">{selectedRequest.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Leave Type</Label>
                  <p>{formatLeaveType(selectedRequest.leaveType)}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge variant={getStatusVariant(selectedRequest.status)}>
                    {formatStatus(selectedRequest.status)}
                  </Badge>
                </div>
                <div>
                  <Label>Start Date</Label>
                  <p>{new Date(selectedRequest.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>End Date</Label>
                  <p>{new Date(selectedRequest.endDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label>Duration</Label>
                  <p>{selectedRequest.totalDays} day{selectedRequest.totalDays !== 1 ? 's' : ''}</p>
                </div>
                <div>
                  <Label>Submitted</Label>
                  <p>{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedRequest.isPartialDay && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Label>Partial Day Time</Label>
                  <p>{selectedRequest.startTime} - {selectedRequest.endTime}</p>
                </div>
              )}

              {selectedRequest.reviewComments && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Label>Manager Comments</Label>
                  <p className="text-sm">{selectedRequest.reviewComments}</p>
                  {selectedRequest.reviewedBy && (
                    <p className="text-xs text-gray-500 mt-1">
                      - {selectedRequest.reviewedBy.firstName} {selectedRequest.reviewedBy.lastName}
                    </p>
                  )}
                </div>
              )}

              {selectedRequest.hasAlternative && (
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <Label>Alternative Proposal</Label>
                  <div className="text-sm space-y-1">
                    <p><strong>Dates:</strong> {new Date(selectedRequest.alternativeStartDate!).toLocaleDateString()} - {new Date(selectedRequest.alternativeEndDate!).toLocaleDateString()}</p>
                    {selectedRequest.alternativeComments && (
                      <p><strong>Comments:</strong> {selectedRequest.alternativeComments}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alternative Response Dialog */}
      <Dialog open={alternativeDialog} onOpenChange={setAlternativeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Respond to Alternative Proposal</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <h3 className="font-medium">Original Request</h3>
                <p className="text-sm">
                  {new Date(selectedRequest.startDate).toLocaleDateString()} - {new Date(selectedRequest.endDate).toLocaleDateString()}
                  ({selectedRequest.totalDays} days)
                </p>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg">
                <h3 className="font-medium">Alternative Proposal</h3>
                <p className="text-sm">
                  {new Date(selectedRequest.alternativeStartDate!).toLocaleDateString()} - {new Date(selectedRequest.alternativeEndDate!).toLocaleDateString()}
                </p>
                {selectedRequest.alternativeComments && (
                  <p className="text-sm mt-2"><strong>Manager's Notes:</strong> {selectedRequest.alternativeComments}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="response-comments">Your Response (Optional)</Label>
                <Textarea
                  id="response-comments"
                  value={responseComments}
                  onChange={(e) => setResponseComments(e.target.value)}
                  placeholder="Add any comments about your decision..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAlternativeDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedRequest) {
                  handleAlternativeResponse(selectedRequest.id, 'REJECT')
                }
              }}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject Alternative
            </Button>
            <Button
              onClick={() => {
                if (selectedRequest) {
                  handleAlternativeResponse(selectedRequest.id, 'ACCEPT')
                }
              }}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept Alternative
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Table component for reusability
interface LeaveRequestsTableProps {
  requests: LeaveRequest[]
  onViewDetails: (request: LeaveRequest) => void
  onRespondToAlternative: (request: LeaveRequest) => void
  onCancel: (id: string) => void
  getStatusVariant: (status: string) => any
  formatLeaveType: (type: string) => string
  formatStatus: (status: string) => string
}

function LeaveRequestsTable({
  requests,
  onViewDetails,
  onRespondToAlternative,
  onCancel,
  getStatusVariant,
  formatLeaveType,
  formatStatus
}: LeaveRequestsTableProps) {
  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No leave requests found.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request</TableHead>
              <TableHead>Leave Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{request.title}</p>
                    {request.description && (
                      <p className="text-sm text-gray-500 truncate max-w-[200px]">
                        {request.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {formatLeaveType(request.leaveType)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{new Date(request.startDate).toLocaleDateString()}</div>
                    <div className="text-gray-500">to {new Date(request.endDate).toLocaleDateString()}</div>
                    {request.isPartialDay && (
                      <div className="text-xs text-blue-600">
                        {request.startTime} - {request.endTime}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">{request.totalDays} day{request.totalDays !== 1 ? 's' : ''}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(request.status)}>
                    {formatStatus(request.status)}
                  </Badge>
                  {request.hasAlternative && request.status === 'ALTERNATIVE_PROPOSED' && (
                    <div className="text-xs text-orange-600 mt-1">
                      <AlertTriangle className="h-3 w-3 inline mr-1" />
                      Needs response
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewDetails(request)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {request.status === 'ALTERNATIVE_PROPOSED' && (
                      <Button
                        size="sm"
                        onClick={() => onRespondToAlternative(request)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    )}
                    {request.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onCancel(request.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
} 