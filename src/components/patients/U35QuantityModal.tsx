'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Clock, Info } from 'lucide-react';
import { toast } from 'sonner';

interface U35QuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (quantity: number) => Promise<void>;
  isLoading?: boolean;
}

export function U35QuantityModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}: U35QuantityModalProps) {
  const [quantity, setQuantity] = useState<number>(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity < 1) {
      toast.error('Please enter at least 1 unit of time');
      return;
    }

    if (quantity > 24) { // Max 2 hours seems reasonable
      toast.error('Maximum 24 units (2 hours) allowed');
      return;
    }

    try {
      await onConfirm(quantity);
      setQuantity(1); // Reset for next time
      onClose();
    } catch (error) {
      console.error('Error adding U35 procedure:', error);
      toast.error('Failed to add U35 procedure');
    }
  };

  const totalMinutes = quantity * 5;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-purple-600" />
            Add U35 Time Units
          </DialogTitle>
          <DialogDescription>
            This patient is under the Long-term Care Act (WLZ). Please specify the number of 5-minute units for the U35 code.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info card about U35 */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-purple-600 mt-0.5" />
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-600">U35</Badge>
                  <span className="text-sm font-medium text-purple-900">
                    Time rate dental care for WLZ patients
                  </span>
                </div>
                <p className="text-sm text-purple-700">
                  This code covers time-based care in 5-minute units at €19.93 per unit.
                  It's the only billable code for WLZ patients and should reflect the actual treatment time.
                </p>
              </div>
            </div>
          </div>

          {/* Quantity input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Number of 5-minute units *</Label>
            <Input
              id="quantity"
              type="number"
              min={1}
              max={24}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              placeholder="Enter number of units"
              className="text-center"
            />
            <div className="text-sm text-gray-600 text-center">
              {hours > 0 ? (
                <span>
                  {hours} hour{hours !== 1 ? 's' : ''} and {minutes} minute{minutes !== 1 ? 's' : ''}
                  ({totalMinutes} total minutes)
                </span>
              ) : (
                <span>{totalMinutes} minute{totalMinutes !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>

          {/* Cost calculation */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-800">Total Cost:</span>
              <span className="text-lg font-bold text-green-900">
                €{(quantity * 19.93).toFixed(2)}
              </span>
            </div>
            <div className="text-xs text-green-700 mt-1">
              {quantity} unit{quantity !== 1 ? 's' : ''} × €19.93 per unit
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || quantity < 1}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isLoading ? 'Adding...' : `Add U35 (${quantity} unit${quantity !== 1 ? 's' : ''})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 