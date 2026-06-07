import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Package, Euro } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description?: string;
  defaultPrice: number;
  category?: string;
  isActive: boolean;
}

interface ProductSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onProductsChanged: () => void;
}

const PRODUCT_CATEGORIES = [
  'Îngrijire postoperatorie',
  'Îngrijire piele',
  'Îmbrăcăminte compresivă',
  'Accesorii',
  'Suplimente',
  'Consumabile medicale',
  'Altele',
];

export function ProductSettings({ isOpen, onClose, onProductsChanged }: ProductSettingsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultPrice: '',
    category: ''
  });

  // Load products
  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        toast.error('Încărcarea produselor a eșuat');
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Încărcarea produselor a eșuat');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      defaultPrice: '',
      category: ''
    });
    setEditingProduct(null);
  };

  const handleAddProduct = () => {
    resetForm();
    setShowAddModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description || '',
      defaultPrice: product.defaultPrice.toString(),
      category: product.category || ''
    });
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const handleSaveProduct = async () => {
    if (!formData.name.trim() || !formData.defaultPrice) {
      toast.error('Numele și prețul produsului sunt obligatorii');
      return;
    }

    const price = parseFloat(formData.defaultPrice);
    if (isNaN(price) || price < 0) {
      toast.error('Introduceți un preț valid');
      return;
    }

    try {
      setLoading(true);

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        defaultPrice: price,
        category: formData.category || null
      };

      let response;

      if (editingProduct) {
        // Update existing product
        response = await fetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
      } else {
        // Create new product
        response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData)
        });
      }

      if (response.ok) {
        toast.success(editingProduct ? 'Produsul a fost actualizat cu succes' : 'Produsul a fost creat cu succes');
        setShowAddModal(false);
        resetForm();
        loadProducts();
        onProductsChanged();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Salvarea produsului a eșuat');
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      toast.error('Salvarea produsului a eșuat');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Sigur doriți să ștergeți „${product.name}"?`)) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Produsul a fost șters cu succes');
        loadProducts();
        onProductsChanged();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Ștergerea produsului a eșuat');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Ștergerea produsului a eșuat');
    } finally {
      setLoading(false);
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: product.name,
          description: product.description,
          defaultPrice: product.defaultPrice,
          category: product.category,
          isActive: !product.isActive
        })
      });

      if (response.ok) {
        toast.success(product.isActive ? 'Produsul a fost dezactivat' : 'Produsul a fost activat');
        loadProducts();
        onProductsChanged();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Actualizarea stării produsului a eșuat');
      }
    } catch (error) {
      console.error('Failed to update product status:', error);
      toast.error('Actualizarea stării produsului a eșuat');
    }
  };

  const groupedProducts = products.reduce((acc, product) => {
    const category = product.category || 'Necategorizat';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Gestionare produse
            </DialogTitle>
            <DialogDescription>
              Gestionați produsele disponibile în magazin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {products.length} produse în total ({products.filter(p => p.isActive).length} active)
              </div>
              <Button onClick={handleAddProduct} disabled={loading}>
                <Plus className="w-4 h-4 mr-2" />
                Adaugă produs
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                  <div key={category}>
                    <h3 className="text-lg font-medium mb-3 text-gray-900">{category}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryProducts.map((product) => (
                        <Card key={product.id} className={`p-4 ${!product.isActive ? 'opacity-60' : ''}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{product.name}</h4>
                                <Badge
                                  variant={product.isActive ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {product.isActive ? 'Activ' : 'Inactiv'}
                                </Badge>
                              </div>
                              {product.description && (
                                <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <Euro className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-green-600">
                                  €{product.defaultPrice.toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleProductStatus(product)}
                                className={product.isActive ? 'text-orange-600' : 'text-green-600'}
                              >
                                {product.isActive ? 'Dezactivează' : 'Activează'}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteProduct(product)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}

                {products.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Nu au fost găsite produse</p>
                    <p className="text-sm">Adăugați primul produs pentru a începe</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Închide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Product Modal */}
      <Dialog open={showAddModal} onOpenChange={() => {
        setShowAddModal(false);
        resetForm();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Editare produs' : 'Adăugare produs nou'}
            </DialogTitle>
            <DialogDescription>
              {editingProduct ? 'Actualizați informațiile produsului' : 'Adăugați un produs nou în magazin'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nume produs *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="ex. Cremă pentru cicatrici"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="defaultPrice">Preț implicit (€) *</Label>
              <Input
                id="defaultPrice"
                type="number"
                step={0.01}
                min={0}
                value={formData.defaultPrice}
                onChange={(e) => setFormData({ ...formData, defaultPrice: e.target.value })}
                placeholder="0.00"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category">Categorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selectați o categorie" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Descriere</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descriere opțională a produsului..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              Anulare
            </Button>
            <Button onClick={handleSaveProduct} disabled={loading}>
              {loading ? 'Se salvează...' : editingProduct ? 'Actualizează produsul' : 'Adaugă produs'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 