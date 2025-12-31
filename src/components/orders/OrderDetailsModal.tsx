import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Package } from 'lucide-react';

interface OrderItem {
  id: string;
  itemName: string;
  description?: string;
  quantity: number;
  quantityReceived: number;
  isReceived: boolean;
  receivedAt?: string;
  notes?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  vendor: {
    name: string;
  };
  status: string;
  items: OrderItem[];
}

interface TimelineEvent {
  id: string;
  type: string;
  message?: string;
  createdAt: string;
  createdBy?: { firstName: string; lastName: string };
  orderItem?: { id: string; itemName: string };
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  onStatusChange?: () => void;
}

export default function OrderDetailsModal({ isOpen, onClose, orderId, onStatusChange }: OrderDetailsModalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [itemUpdates, setItemUpdates] = useState<Record<string, { isReceived: boolean; quantityReceived: number; notes: string }>>({});
  const [saving, setSaving] = useState(false);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrder();
      fetchTimeline();
    }
  }, [isOpen, orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        // Initialize itemUpdates state
        const updates: Record<string, { isReceived: boolean; quantityReceived: number; notes: string }> = {};
        data.items.forEach((item: OrderItem) => {
          updates[item.id] = {
            isReceived: item.isReceived,
            quantityReceived: item.quantityReceived || 0,
            notes: item.notes || '',
          };
        });
        setItemUpdates(updates);
      }
    } catch (e) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    setTimelineLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/timeline`);
      if (res.ok) {
        setTimeline(await res.json());
      }
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleItemChange = (itemId: string, field: keyof typeof itemUpdates[string], value: any) => {
    setItemUpdates((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(itemUpdates).map(([itemId, update]) => ({
        itemId,
        ...update,
      }));
      const res = await fetch(`/api/orders/${orderId}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      if (res.ok) {
        fetchOrder();
        if (onStatusChange) onStatusChange();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'NOTE', message: newNote }),
      });
      if (res.ok) {
        setNewNote('');
        fetchTimeline();
      }
    } finally {
      setAddingNote(false);
    }
  };

  if (!isOpen || !order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Details: {order.orderNumber}
          </DialogTitle>
        </DialogHeader>
        <div className="mb-4">
          <span className="font-medium">Vendor:</span> {order.vendor.name}
          <Badge className="ml-2">{order.status}</Badge>
        </div>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div key={item.id} className="border rounded-lg p-3 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.itemName}</span>
                  {itemUpdates[item.id]?.isReceived ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div className="text-sm text-gray-600">{item.description}</div>
                <div className="text-xs text-gray-500">Ordered: {item.quantity}</div>
              </div>
              <div className="flex flex-col gap-2 min-w-[180px]">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={itemUpdates[item.id]?.isReceived || false}
                    onChange={(e) => handleItemChange(item.id, 'isReceived', e.target.checked)}
                  />
                  Received
                </label>
                <Input
                  type="number"
                  min={0}
                  max={item.quantity}
                  value={itemUpdates[item.id]?.quantityReceived || 0}
                  onChange={(e) => handleItemChange(item.id, 'quantityReceived', Number(e.target.value))}
                  disabled={!itemUpdates[item.id]?.isReceived}
                  placeholder="Qty received"
                />
                <Textarea
                  value={itemUpdates[item.id]?.notes || ''}
                  onChange={(e) => handleItemChange(item.id, 'notes', e.target.value)}
                  disabled={!itemUpdates[item.id]?.isReceived}
                  placeholder="Notes (optional)"
                  rows={2}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <h4 className="font-semibold mb-2">Order Timeline</h4>
          <div className="space-y-4 border-l-2 border-blue-200 pl-4">
            {timelineLoading ? (
              <div>Loading timeline...</div>
            ) : timeline.length === 0 ? (
              <div className="text-gray-500 text-sm">No events yet.</div>
            ) : (
              timeline.map(event => (
                <div key={event.id} className="relative">
                  <div className="absolute -left-5 top-1.5 w-3 h-3 rounded-full bg-blue-500"></div>
                  <div className="ml-2">
                    <div className="text-xs text-gray-400">{new Date(event.createdAt).toLocaleString()}</div>
                    <div className="text-sm">
                      <span className="font-medium">{event.type.replace(/_/g, ' ')}</span>
                      {event.orderItem && (
                        <span className="ml-2 text-blue-700">[{event.orderItem.itemName}]</span>
                      )}
                      {event.message && (
                        <span className="ml-2 text-gray-700">- {event.message}</span>
                      )}
                    </div>
                    {event.createdBy && (
                      <div className="text-xs text-gray-500">By {event.createdBy.firstName} {event.createdBy.lastName}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2 mt-4">
            <Textarea
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              placeholder="Add a note or issue to the timeline..."
              rows={2}
              className="flex-1"
            />
            <Button onClick={handleAddNote} disabled={addingNote || !newNote.trim()} className="bg-blue-600 hover:bg-blue-700 h-fit mt-1">
              {addingNote ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </div>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 