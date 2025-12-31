import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

export interface FluorideFlavor {
  id: string;
  name: string;
  color: string;
}

interface FluorideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { jaws: string[]; flavor: FluorideFlavor }) => void;
  flavors: FluorideFlavor[];
  onOpenSettings: () => void;
}

export function FluorideModal({ isOpen, onClose, onSave, flavors, onOpenSettings }: FluorideModalProps) {
  const [selectedJaws, setSelectedJaws] = useState<string[]>(['upper', 'lower']);
  const [selectedFlavorId, setSelectedFlavorId] = useState<string>(flavors[0]?.id || '');

  useEffect(() => {
    if (isOpen && flavors.length > 0) {
      setSelectedFlavorId(flavors[0].id);
      setSelectedJaws(['upper', 'lower']);
    }
  }, [isOpen, flavors]);

  const handleJawToggle = (jaw: string) => {
    setSelectedJaws(jaws =>
      jaws.includes(jaw) ? jaws.filter(j => j !== jaw) : [...jaws, jaw]
    );
  };

  const selectedFlavor = flavors.find(f => f.id === selectedFlavorId) || flavors[0];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Fluoride (M40)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="font-medium mb-1">Select Jaw(s)</div>
            <div className="flex gap-4">
              <Button
                variant={selectedJaws.includes('upper') ? 'default' : 'outline'}
                onClick={() => handleJawToggle('upper')}
              >
                Upper Jaw
              </Button>
              <Button
                variant={selectedJaws.includes('lower') ? 'default' : 'outline'}
                onClick={() => handleJawToggle('lower')}
              >
                Lower Jaw
              </Button>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium">Flavor</span>
              <Button size="sm" variant="outline" onClick={onOpenSettings}>Flavors Settings</Button>
            </div>
            <Select value={selectedFlavorId} onValueChange={setSelectedFlavorId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {flavors.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full inline-block" style={{ backgroundColor: f.color }} />
                      {f.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => onSave({ jaws: selectedJaws, flavor: selectedFlavor })}
            disabled={selectedJaws.length === 0 || !selectedFlavor}
          >
            Add Fluoride
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default FluorideModal; 