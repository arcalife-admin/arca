import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface FluorideFlavor {
  id: string;
  name: string;
  color: string;
}

interface FluorideFlavorSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
}

export function FluorideFlavorSettingsModal({ isOpen, onClose, organizationId }: FluorideFlavorSettingsModalProps) {
  const [flavors, setFlavors] = useState<FluorideFlavor[]>([]);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#2196f3');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('#2196f3');

  useEffect(() => {
    if (isOpen) fetchFlavors();
  }, [isOpen]);

  const fetchFlavors = async () => {
    const res = await fetch(`/api/fluoride-flavors?organizationId=${organizationId}`);
    const data = await res.json();
    setFlavors(data);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    await fetch('/api/fluoride-flavors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, color: newColor, organizationId })
    });
    setNewName('');
    setNewColor('#2196f3');
    fetchFlavors();
  };

  const handleEdit = (flavor: FluorideFlavor) => {
    setEditingId(flavor.id);
    setEditingName(flavor.name);
    setEditingColor(flavor.color);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    await fetch(`/api/fluoride-flavors/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editingName, color: editingColor })
    });
    setEditingId(null);
    setEditingName('');
    setEditingColor('#2196f3');
    fetchFlavors();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/fluoride-flavors/${id}`, { method: 'DELETE' });
    fetchFlavors();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Fluoride Flavors</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2 items-end">
            <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Flavor name" className="w-40" />
            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="w-10 h-10 p-0 border-none" />
            <Button onClick={handleAdd} disabled={!newName.trim()}>Add</Button>
          </div>
          <div className="space-y-2">
            {flavors.map(f => (
              <div key={f.id} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full inline-block border" style={{ backgroundColor: f.color }} />
                {editingId === f.id ? (
                  <>
                    <Input value={editingName} onChange={e => setEditingName(e.target.value)} className="w-32" />
                    <input type="color" value={editingColor} onChange={e => setEditingColor(e.target.value)} className="w-10 h-10 p-0 border-none" />
                    <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <span className="w-32">{f.name}</span>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(f)}>Edit</Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(f.id)}>Delete</Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
export default FluorideFlavorSettingsModal; 