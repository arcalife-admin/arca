'use client'

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TimelineEvent {
  id: string;
  type: string;
  message?: string;
  createdAt: string;
  createdBy?: { firstName: string; lastName: string };
  orderItem?: { id: string; itemName: string };
  orderId: string;
  order?: { orderNumber: string };
}

const EVENT_TYPES = [
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

export default function AnalyticsPage() {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string[]>(['CREATED', 'DELIVERED']);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders/timeline');
      if (res.ok) {
        setTimeline(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredTimeline = timeline.filter(event => filter.includes(event.type));

  const toggleFilter = (type: string) => {
    setFilter(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="space-y-8">
      {/* ...existing analytics UI... */}
      <Card>
        <CardHeader>
          <CardTitle>Order Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4 flex-wrap">
            {EVENT_TYPES.map(ev => (
              <Button
                key={ev.value}
                size="sm"
                variant={filter.includes(ev.value) ? 'default' : 'outline'}
                onClick={() => toggleFilter(ev.value)}
              >
                {ev.label}
              </Button>
            ))}
          </div>
          <div className="space-y-4 border-l-2 border-blue-200 pl-4">
            {loading ? (
              <div>Loading timeline...</div>
            ) : filteredTimeline.length === 0 ? (
              <div className="text-gray-500 text-sm">No events for selected filters.</div>
            ) : (
              filteredTimeline.map(event => (
                <div key={event.id} className="relative">
                  <div className="absolute -left-5 top-1.5 w-3 h-3 rounded-full bg-blue-500"></div>
                  <div className="ml-2">
                    <div className="text-xs text-gray-400">{new Date(event.createdAt).toLocaleString()}</div>
                    <div className="text-sm">
                      <span className="font-medium">{event.type.replace(/_/g, ' ')}</span>
                      {event.order && (
                        <span className="ml-2 text-blue-700">[{event.order.orderNumber}]</span>
                      )}
                      {event.orderItem && (
                        <span className="ml-2 text-purple-700">[{event.orderItem.itemName}]</span>
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
        </CardContent>
      </Card>
    </div>
  );
} 