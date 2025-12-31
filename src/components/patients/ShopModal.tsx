import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, Plus, Minus, ShoppingCart, Search, History, Euro, CreditCard, Banknote, CheckCircle, Loader2, Mail, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { ProductSettings } from './ProductSettings';
import { useRouter } from 'next/navigation';
import { Dialog as AlertDialog, DialogContent as AlertDialogContent, DialogHeader as AlertDialogHeader, DialogTitle as AlertDialogTitle, DialogFooter as AlertDialogFooter } from '@/components/ui/dialog';

interface Product {
  id: string;
  name: string;
  description?: string;
  defaultPrice: number;
  category?: string;
  isActive: boolean;
}

interface ShopPurchase {
  id: string;
  patientId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  notes?: string;
  isPaid: boolean;
  paymentMethod?: 'CASH' | 'CARD';
  paidAt?: string;
  product: Product;
  createdAt: string;
}

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  onPurchaseComplete: () => void;
}

interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

// Helper function to round amount for cash payments
function roundForCash(amount: number): number {
  return Math.round(amount * 20) / 20;
}

// Payment simulation component for shop purchases
function ShopPaymentSimulation({ paymentMethod, amount, onComplete }: {
  paymentMethod: 'CASH' | 'CARD';
  amount: number;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const simulationTime = paymentMethod === 'CARD' ? 2000 : 1500; // Shorter simulation
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (simulationTime / 100));
        if (newProgress >= 100) {
          clearInterval(interval);
          // Call onComplete immediately when done - no delay
          onComplete();
          return 100;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [paymentMethod, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      {paymentMethod === 'CARD' ? (
        <>
          <CreditCard className="w-16 h-16 text-blue-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Processing Card Payment</h3>
          <p className="text-gray-600 mb-4">Please follow the prompts on the card reader</p>
        </>
      ) : (
        <>
          <Banknote className="w-16 h-16 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Processing Cash Payment</h3>
          <p className="text-gray-600 mb-4">Counting cash received...</p>
        </>
      )}
      <div className="w-full max-w-xs">
        <div className="bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">{Math.round(progress)}% complete</p>
      </div>
    </div>
  );
}

export function ShopModal({ isOpen, onClose, patientId, onPurchaseComplete }: ShopModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<ShopPurchase[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showProductSettings, setShowProductSettings] = useState(false);
  const [showRecentPurchases, setShowRecentPurchases] = useState(false);

  // Search state - change to simpler approach
  const [showFilteredProducts, setShowFilteredProducts] = useState(false);

  // Use ref to store timeout ID for proper cleanup
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Payment state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentSimulation, setShowPaymentSimulation] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CARD');
  const [sendEmail, setSendEmail] = useState(false);
  const [shouldPrintInvoice, setShouldPrintInvoice] = useState(true);
  const [createdPurchases, setCreatedPurchases] = useState<any[]>([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const router = useRouter();

  // Load products and recent purchases
  useEffect(() => {
    if (isOpen) {
      loadProducts();
      loadRecentPurchases();
    }
  }, [isOpen, patientId]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  const loadProducts = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        setProducts(data.filter((p: Product) => p.isActive));
      }
    } catch (error) {
      console.error('Failed to load products:', error);
      toast.error('Failed to load products');
    }
  };

  const loadRecentPurchases = async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}/shop-purchases?limit=10`);
      if (response.ok) {
        const data = await response.json();
        setRecentPurchases(data);
      }
    } catch (error) {
      console.error('Failed to load recent purchases:', error);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addToCart = () => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    const price = customPrice ? parseFloat(customPrice) : selectedProduct.defaultPrice;
    if (isNaN(price) || price <= 0) {
      toast.error('Invalid price');
      return;
    }

    const existingItem = cart.find(item => item.product.id === selectedProduct.id);

    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === selectedProduct.id
          ? { ...item, quantity: item.quantity + quantity, notes: notes || item.notes }
          : item
      ));
    } else {
      setCart([...cart, {
        product: selectedProduct,
        quantity,
        unitPrice: price,
        notes
      }]);
    }

    // Reset form
    setSelectedProduct(null);
    setQuantity(1);
    setCustomPrice('');
    setNotes('');
    setSearchQuery('');
    toast.success(`Added ${selectedProduct.name} to cart`);
  };

  const updateCartItem = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(cart.map(item =>
      item.product.id === productId
        ? { ...item, quantity }
        : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const repeatPurchase = (purchase: ShopPurchase, customQuantity?: number) => {
    const existingItem = cart.find(item => item.product.id === purchase.productId);
    const quantityToAdd = customQuantity || purchase.quantity;

    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === purchase.productId
          ? { ...item, quantity: item.quantity + quantityToAdd }
          : item
      ));
    } else {
      setCart([...cart, {
        product: purchase.product,
        quantity: quantityToAdd,
        unitPrice: purchase.unitPrice,
        notes: purchase.notes
      }]);
    }

    toast.success(`Added ${quantityToAdd}x ${purchase.product.name} to cart`);
  };

  const repeatMultiplePurchases = (purchases: ShopPurchase[]) => {
    let addedCount = 0;

    purchases.forEach(purchase => {
      const existingItem = cart.find(item => item.product.id === purchase.productId);

      if (existingItem) {
        setCart(prev => prev.map(item =>
          item.product.id === purchase.productId
            ? { ...item, quantity: item.quantity + purchase.quantity }
            : item
        ));
      } else {
        setCart(prev => [...prev, {
          product: purchase.product,
          quantity: purchase.quantity,
          unitPrice: purchase.unitPrice,
          notes: purchase.notes
        }]);
      }
      addedCount++;
    });

    toast.success(`Added ${addedCount} items from previous order to cart`);
  };

  const quickAddToCart = (product: Product, quantity: number = 1) => {
    const existingItem = cart.find(item => item.product.id === product.id);

    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, {
        product,
        quantity,
        unitPrice: product.defaultPrice,
        notes: ''
      }]);
    }

    toast.success(`Quick added ${quantity}x ${product.name} to cart`);
  };

  // Group recent purchases by date for better organization
  const groupedRecentPurchases = recentPurchases.reduce((groups, purchase) => {
    const date = new Date(purchase.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(purchase);
    return groups;
  }, {} as Record<string, ShopPurchase[]>);

  // Get frequently purchased products (products bought more than once)
  const getFrequentlyPurchased = () => {
    const productCounts = recentPurchases.reduce((counts, purchase) => {
      const productId = purchase.productId;
      counts[productId] = {
        count: (counts[productId]?.count || 0) + 1,
        product: purchase.product,
        lastPurchase: purchase
      };
      return counts;
    }, {} as Record<string, { count: number; product: Product; lastPurchase: ShopPurchase }>);

    return Object.values(productCounts)
      .filter(item => item.count > 1)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 frequently purchased
  };

  const frequentlyPurchased = getFrequentlyPurchased();

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.quantity * item.unitPrice), 0);
  };

  // Helper function to reset all modal states
  const resetModalStates = () => {
    setCart([]);
    setSelectedProduct(null);
    setQuantity(1);
    setCustomPrice('');
    setNotes('');
    setSearchQuery('');
    setShowProductSettings(false);
    setShowRecentPurchases(false);
    setShowFilteredProducts(false);
    setShowPaymentModal(false);
    setShowPaymentSimulation(false);
    setCreatedPurchases([]);
    setPaymentMethod('CARD');
    setSendEmail(false);
    setShouldPrintInvoice(true);
  };

  const handleProceedToPayment = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    // Create shop purchases first
    try {
      const response = await fetch(`/api/patients/${patientId}/shop-purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchases: cart.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalAmount: item.quantity * item.unitPrice,
            notes: item.notes
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create shop purchases');
      }

      const result = await response.json();
      setCreatedPurchases(result.purchases);
      setShowPaymentModal(true);

    } catch (error) {
      console.error('Failed to create shop purchases:', error);
      toast.error('Failed to create shop purchases');
    }
  };

  const handlePayment = async () => {
    setShowPaymentSimulation(true);
  };

  const handlePaymentComplete = async () => {
    // Immediately close UI modals and reset
    setShowPaymentSimulation(false);
    setShowPaymentModal(false);
    setCart([]);
    setCreatedPurchases([]);
    resetModalStates();
    onClose();
    onPurchaseComplete();
    router.refresh();

    // Perform the backend payment call in background
    try {
      const response = await fetch(`/api/patients/${patientId}/shop-purchases/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseIds: createdPurchases.map(p => p.id),
          paymentMethod,
          sendEmail,
          printInvoice: shouldPrintInvoice,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Payment failed');
      }

      const result = await response.json();
      toast.success(result.message);
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed');
    }
  };

  const handleClose = () => {
    if (cart.length > 0) {
      setShowDiscardConfirm(true);
      return;
    }

    resetModalStates();
    onClose();
  };

  const discardCartAndClose = () => {
    resetModalStates();
    setShowDiscardConfirm(false);
    onClose();
  };

  // Add handler for product settings
  const handleProductsChanged = () => {
    loadProducts();
  };

  const finalAmount = paymentMethod === 'CASH' ? roundForCash(getTotalAmount()) : getTotalAmount();
  const cashRounding = paymentMethod === 'CASH' ? finalAmount - getTotalAmount() : 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Shop - Products & Supplies
              </DialogTitle>
              <DialogDescription>
                Purchase dental products and supplies for the patient
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRecentPurchases(!showRecentPurchases)}
              >
                <History className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProductSettings(true)}
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Product Selection */}
            <div className="space-y-4">
              <div>
                <Label>Search Products</Label>
                <div className="relative">
                  <Input
                    placeholder="Type to search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      // Clear any pending blur timeout
                      if (blurTimeoutRef.current) {
                        clearTimeout(blurTimeoutRef.current);
                        blurTimeoutRef.current = null;
                      }
                      setShowFilteredProducts(true);
                    }}
                    onBlur={() => {
                      // Clear any existing timeout first
                      if (blurTimeoutRef.current) {
                        clearTimeout(blurTimeoutRef.current);
                      }
                      // Delay hiding to allow product selection
                      blurTimeoutRef.current = setTimeout(() => {
                        setShowFilteredProducts(false);
                        blurTimeoutRef.current = null;
                      }, 200);
                    }}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />

                  {/* Always show dropdown when focused and there are products */}
                  {showFilteredProducts && filteredProducts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex justify-between items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent input blur
                            setSelectedProduct(product);
                            setCustomPrice('');
                            setShowFilteredProducts(false);
                            setSearchQuery(product.name);
                          }}
                        >
                          <div>
                            <div className="font-medium">{product.name}</div>
                            {product.description && (
                              <div className="text-xs text-gray-500">{product.description}</div>
                            )}
                            {product.category && (
                              <Badge variant="outline" className="text-xs mt-1">
                                {product.category}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm font-medium">
                            €{product.defaultPrice.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Show "no products found" when search has results but no matches */}
                  {showFilteredProducts && searchQuery && filteredProducts.length === 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg p-3">
                      <div className="text-gray-500 text-center">No products found</div>
                    </div>
                  )}
                </div>
              </div>

              {selectedProduct && (
                <Card className="p-4">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium">{selectedProduct.name}</h4>
                      {selectedProduct.description && (
                        <p className="text-sm text-gray-600">{selectedProduct.description}</p>
                      )}
                      {selectedProduct.category && (
                        <Badge variant="outline" className="mt-1">{selectedProduct.category}</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Quantity</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="text-center"
                            min="1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setQuantity(quantity + 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label>Unit Price (€)</Label>
                        <Input
                          type="number"
                          step={0.01}
                          placeholder={selectedProduct.defaultPrice.toFixed(2)}
                          value={customPrice}
                          onChange={(e) => setCustomPrice(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Notes (optional)</Label>
                      <Input
                        placeholder="Additional notes..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-lg font-semibold">
                        Total: €{(quantity * (customPrice ? parseFloat(customPrice) : selectedProduct.defaultPrice)).toFixed(2)}
                      </div>
                      <Button onClick={addToCart}>
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </Card>
              )}

              {showRecentPurchases && recentPurchases.length > 0 && (
                <div className="space-y-4">
                  {/* Frequently Purchased Section */}
                  {frequentlyPurchased.length > 0 && (
                    <Card className="p-4">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Frequently Purchased
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {frequentlyPurchased.map((item) => (
                          <div key={item.product.id} className="flex items-center justify-between p-2 bg-blue-50 rounded border">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{item.product.name}</div>
                              <div className="text-xs text-gray-600">
                                Purchased {item.count} times • €{item.product.defaultPrice.toFixed(2)}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => quickAddToCart(item.product, 1)}
                                className="text-xs"
                              >
                                Quick Add
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => repeatPurchase(item.lastPurchase)}
                                className="text-xs"
                              >
                                Repeat Last
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* Recent Purchases by Date */}
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Recent Purchases
                      </h4>
                      {Object.keys(groupedRecentPurchases).length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const firstDateGroup = Object.values(groupedRecentPurchases)[0];
                            if (firstDateGroup) {
                              repeatMultiplePurchases(firstDateGroup);
                            }
                          }}
                          className="text-xs"
                        >
                          Repeat Latest Order
                        </Button>
                      )}
                    </div>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {Object.entries(groupedRecentPurchases)
                        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                        .slice(0, 3) // Show only last 3 dates
                        .map(([date, purchases]) => (
                          <div key={date} className="border rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="font-medium text-sm text-gray-700">{date}</div>
                              <div className="flex gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {purchases.length} item{purchases.length > 1 ? 's' : ''}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => repeatMultiplePurchases(purchases)}
                                  className="text-xs h-6"
                                >
                                  Repeat All
                                </Button>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {purchases.slice(0, 3).map((purchase) => (
                                <div key={purchase.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{purchase.product.name}</div>
                                    <div className="text-xs text-gray-500">
                                      Qty: {purchase.quantity} × €{purchase.unitPrice.toFixed(2)} = €{purchase.totalAmount.toFixed(2)}
                                    </div>
                                  </div>
                                  <div className="flex gap-1">
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm" className="text-xs h-7">
                                          Repeat ▾
                                        </Button>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-48 p-2">
                                        <div className="space-y-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => repeatPurchase(purchase)}
                                            className="w-full justify-start text-xs"
                                          >
                                            Same quantity ({purchase.quantity})
                                          </Button>
                                          <div className="flex gap-1">
                                            <Input
                                              type="number"
                                              min="1"
                                              placeholder="Qty"
                                              className="h-7 text-xs"
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  const qty = parseInt((e.target as HTMLInputElement).value);
                                                  if (qty > 0) {
                                                    repeatPurchase(purchase, qty);
                                                    (e.target as HTMLInputElement).value = '';
                                                  }
                                                }
                                              }}
                                            />
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={(e) => {
                                                const input = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement);
                                                const qty = parseInt(input?.value || '1');
                                                if (qty > 0) {
                                                  repeatPurchase(purchase, qty);
                                                  if (input) input.value = '';
                                                }
                                              }}
                                              className="h-7 text-xs"
                                            >
                                              Add
                                            </Button>
                                          </div>
                                        </div>
                                      </PopoverContent>
                                    </Popover>
                                  </div>
                                </div>
                              ))}
                              {purchases.length > 3 && (
                                <div className="text-xs text-gray-500 text-center">
                                  +{purchases.length - 3} more items
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </Card>
                </div>
              )}
            </div>

            {/* Right Column: Shopping Cart */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Shopping Cart</h3>
                <Badge variant="outline">{cart.length} item(s)</Badge>
              </div>

              {cart.length === 0 ? (
                <Card className="p-8 text-center">
                  <ShoppingCart className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Your cart is empty</p>
                  <p className="text-sm text-gray-400">Add products to get started</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <Card key={item.product.id} className="p-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.product.name}</h4>
                            {item.notes && (
                              <p className="text-sm text-gray-600">{item.notes}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </Button>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartItem(item.product.id, item.quantity - 1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateCartItem(item.product.id, item.quantity + 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">
                              {item.quantity} × €{item.unitPrice.toFixed(2)}
                            </div>
                            <div className="font-medium">
                              €{(item.quantity * item.unitPrice).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total Amount:</span>
                      <span>€{getTotalAmount().toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {cart.length > 0 && (
              <Button onClick={handleProceedToPayment} className="bg-green-600 hover:bg-green-700">
                <Euro className="w-4 h-4 mr-2" />
                Proceed to Payment (€{getTotalAmount().toFixed(2)})
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Settings Modal */}
      <ProductSettings
        isOpen={showProductSettings}
        onClose={() => setShowProductSettings(false)}
        onProductsChanged={handleProductsChanged}
      />

      {/* Payment Modal for Shop Purchases */}
      <Dialog open={showPaymentModal} onOpenChange={(open) => !open && setShowPaymentModal(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment for Shop Purchases
            </DialogTitle>
            <DialogDescription>
              Complete payment for your selected products
            </DialogDescription>
          </DialogHeader>

          {showPaymentSimulation ? (
            <ShopPaymentSimulation
              paymentMethod={paymentMethod}
              amount={finalAmount}
              onComplete={handlePaymentComplete}
            />
          ) : (
            <div className="space-y-6">
              {/* Order Summary */}
              <div className="space-y-4">
                <h4 className="font-medium">Order Summary</h4>
                {(createdPurchases || []).map((purchase) => (
                  <div key={purchase.id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium">{purchase.product.name}</div>
                      <div className="text-sm text-gray-600">
                        {purchase.quantity} × €{purchase.unitPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="font-medium">
                      €{purchase.totalAmount.toFixed(2)}
                    </div>
                  </div>
                ))}

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>€{getTotalAmount().toFixed(2)}</span>
                  </div>
                  {paymentMethod === 'CASH' && cashRounding !== 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Cash rounding:</span>
                      <span>€{cashRounding.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span>€{finalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <Label>Payment Method</Label>
                <RadioGroup value={paymentMethod} onValueChange={(value: 'CASH' | 'CARD') => setPaymentMethod(value)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CARD" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Card Payment
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CASH" id="cash" />
                    <Label htmlFor="cash" className="flex items-center gap-2">
                      <Banknote className="w-4 h-4" />
                      Cash Payment
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Invoice Options */}
              <div className="space-y-3">
                <Label>Invoice Options</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="email"
                      checked={sendEmail}
                      onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                    />
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Send invoice via email
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="print"
                      checked={shouldPrintInvoice}
                      onCheckedChange={(checked) => setShouldPrintInvoice(checked as boolean)}
                    />
                    <Label htmlFor="print" className="flex items-center gap-2">
                      <Printer className="w-4 h-4" />
                      Print invoice
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!showPaymentSimulation && (
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handlePayment}
                className="bg-green-600 hover:bg-green-700"
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Process Payment (€{finalAmount.toFixed(2)})
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Discard cart confirmation */}
      <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard items in cart?</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-gray-600">
            You have items in your cart that will be removed if you close the shop. Are you sure you want to continue?
          </p>
          <AlertDialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDiscardConfirm(false)}>Keep shopping</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={discardCartAndClose}>Discard & Close</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
} 