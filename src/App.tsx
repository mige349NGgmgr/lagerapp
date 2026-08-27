import { useState, useEffect } from 'react';
import { 
  Package, 
  QrCode, 
  Plus, 
  Hash, 
  LayoutGrid, 
  List, 
  AlertTriangle, 
  ShoppingCart, 
  History as HistoryIcon, 
  Scale, 
  User as UserIcon, 
  LogOut, 
  ShieldCheck, 
  Moon,
  Sun,
  Settings
} from 'lucide-react';
import { Product, ViewTab, User } from './types';
import { api } from './api';
import { InventoryList } from './components/InventoryList';
import { Scanner } from './components/Scanner';
import { BarcodeGen } from './components/BarcodeGen';
import { ProductForm } from './components/ProductForm';
import { ShelfView } from './components/ShelfView';
import { LoginModal } from './components/LoginModal';
import { StockMovementModal } from './components/StockMovementModal';
import { WithdrawModal } from './components/WithdrawModal';
import { NewEanPromptModal } from './components/NewEanPromptModal';
import { HistoryView } from './components/HistoryView';
import { ReorderView } from './components/ReorderView';
import { ShippingCalculatorView } from './components/ShippingCalculatorView';
import { AdminSettingsView } from './components/AdminSettingsView';

export default function App() {
  const [activeTab, setActiveTab] = useState<ViewTab>('shelf');
  const [products, setProducts] = useState<Product[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('lager_current_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    // Default initial admin user
    return {
      id: 'usr_admin',
      username: 'admin',
      name: 'Administrator',
      role: 'admin',
      permissions: {
        canScanIn: true,
        canScanOut: true,
        canManageInventory: true,
        canDeleteProducts: true,
        canViewHistory: true,
        canExportData: true,
        canManageUsers: true,
        allowedTabs: ['shelf', 'list', 'scanner', 'reorder', 'shipping', 'history', 'generator', 'settings']
      }
    };
  });

  // Dark Mode State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('lager_dark_mode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('lager_dark_mode', darkMode ? 'true' : 'false');
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);
  
  // Modals & Sheets
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [defaultLocation, setDefaultLocation] = useState<{ letter: string; number: number } | null>(null);

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [movementProduct, setMovementProduct] = useState<Product | null>(null);
  const [movementInitialType, setMovementInitialType] = useState<'WITHDRAW' | 'ADD'>('WITHDRAW');
  const [withdrawProduct, setWithdrawProduct] = useState<Product | null>(null);
  const [newEanBarcode, setNewEanBarcode] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      const data = await api.getInventory();
      // Ensure data items have locationLetter, locationNumber and weightGrams
      const normalized = data.map(item => ({
        ...item,
        locationLetter: (item.locationLetter || (item as any).shelfLocation?.charAt(0) || 'A').toUpperCase(),
        locationNumber: item.locationNumber || parseInt((item as any).shelfLocation?.slice(1)) || 1,
        weightGrams: item.weightGrams ?? 0,
      }));
      setProducts(normalized);
    } catch (e) {
      console.error("Fehler beim Laden des Inventars:", e);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleSetUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('lager_current_user', JSON.stringify(user));
    // If current tab is not allowed for the new user, switch to first allowed tab
    const allowed = user.permissions?.allowedTabs || (user.role === 'admin' ? ['shelf', 'list', 'scanner', 'reorder', 'shipping', 'history', 'generator', 'settings'] : ['shelf', 'list', 'scanner', 'reorder', 'shipping', 'history', 'generator']);
    if (!allowed.includes(activeTab)) {
      setActiveTab(allowed[0] as ViewTab || 'shelf');
    }
  };

  // Scanning workflow
  const handleScan = (barcode: string) => {
    const cleanBarcode = barcode.trim();
    const existing = products.find(p => p.barcode === cleanBarcode);

    if (existing) {
      // Existing article scanned: directly open movement modal (withdraw/add with ticket)
      setMovementProduct(existing);
      setMovementInitialType('WITHDRAW');
    } else {
      // New EAN scanned: open the New EAN prompt (asks to add + choose shelf location)
      setNewEanBarcode(cleanBarcode);
    }
  };

  // Save new product from NewEanPromptModal
  const handleSaveFromPrompt = async (productData: Omit<Product, 'id'>, ticketNumber?: string) => {
    try {
      await api.addProduct(productData, currentUser, ticketNumber);
      await loadProducts();
      setNewEanBarcode(null);
    } catch (e) {
      console.error("Fehler beim Erstellen des neuen EAN-Artikels:", e);
    }
  };

  // Switch from Prompt to full form if requested
  const handleOpenFullFormFromPrompt = (barcode: string, initialInfo?: Partial<Product>) => {
    setNewEanBarcode(null);
    setEditingProduct(null);
    setScannedBarcode(barcode);
    if (initialInfo?.locationLetter && initialInfo?.locationNumber) {
      setDefaultLocation({ letter: initialInfo.locationLetter, number: initialInfo.locationNumber });
    } else {
      setDefaultLocation(null);
    }
    setIsFormOpen(true);
  };

  // Save from standard form
  const handleSaveProduct = async (productData: Omit<Product, 'id'>, ticketNumber?: string) => {
    try {
      if (editingProduct) {
        await api.updateProduct(editingProduct.id, productData, currentUser, ticketNumber);
      } else {
        await api.addProduct(productData, currentUser, ticketNumber);
      }
      await loadProducts();
      setIsFormOpen(false);
      setEditingProduct(null);
      setScannedBarcode('');
      setDefaultLocation(null);
    } catch (e) {
      console.error("Fehler beim Speichern:", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Produkt wirklich aus dem Lagerbestand löschen?")) {
      await api.deleteProduct(id, currentUser);
      await loadProducts();
    }
  };

  // Stock Movement with Ticket and User Logging
  const handleConfirmStockMovement = async (productId: string, delta: number, ticketNumber: string, notes: string) => {
    await api.recordStockMovement(productId, delta, currentUser, ticketNumber, notes);
    await loadProducts();
  };

  // Dedicated direct withdraw handler
  const handleConfirmWithdraw = async (productId: string, quantity: number, ticketNumber: string, notes: string) => {
    await api.recordStockMovement(productId, -Math.abs(quantity), currentUser, ticketNumber, notes || 'Direkt-Entnahme aus Lager');
    await loadProducts();
  };

  // Quick increment/decrement from shelf/list
  const handleQuickQuantityChange = async (productId: string, delta: number) => {
    const target = products.find(p => p.id === productId);
    if (!target) return;

    if (delta < 0) {
      // Opening prompt for ticket number as requested
      setWithdrawProduct(target);
      return;
    }

    // Optimistic UI update for addition
    const newQuantity = target.quantity + delta;
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, quantity: newQuantity } : p));

    try {
      await api.recordStockMovement(
        productId, 
        delta, 
        currentUser, 
        '', 
        'Schnell-Zubuchung (+1)'
      );
    } catch (e) {
      console.error("Fehler beim Aktualisieren der Menge:", e);
      await loadProducts(); // Revert on failure
    }
  };

  const handleOpenMovementModal = (product: Product, initialType: 'WITHDRAW' | 'ADD' = 'WITHDRAW') => {
    if (initialType === 'WITHDRAW') {
      setWithdrawProduct(product);
    } else {
      setMovementProduct(product);
      setMovementInitialType(initialType);
    }
  };

  const handleAddNewToLocation = (locationLetter: string, locationNumber: number) => {
    setEditingProduct(null);
    setScannedBarcode('');
    setDefaultLocation({ letter: locationLetter, number: locationNumber });
    setIsFormOpen(true);
  };

  const lowStockCount = products.filter(p => p.quantity <= p.minQuantity).length;

  // Allowed Tabs check
  const allowedTabs: ViewTab[] = currentUser?.permissions?.allowedTabs || (
    currentUser?.role === 'admin' 
      ? ['shelf', 'list', 'scanner', 'reorder', 'shipping', 'history', 'generator', 'settings']
      : ['shelf', 'list', 'scanner', 'reorder', 'shipping', 'history', 'generator']
  );

  const isTabAllowed = (t: ViewTab) => allowedTabs.includes(t);

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-900 flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top App Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between">
          {/* Logo & App Title */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight leading-none">
                Lager.App
              </h1>
              <span className="hidden sm:block text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                Regalverwaltung, Barcode & Versand
              </span>
            </div>
          </div>

          {/* Controls: Dark Mode, User Status Pill, Admin Settings & New Product Button */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Low stock badge */}
            {lowStockCount > 0 && isTabAllowed('reorder') && (
              <button
                type="button"
                onClick={() => setActiveTab('reorder')}
                className="flex items-center space-x-1 px-2 sm:px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold transition hover:bg-amber-100"
                title={`${lowStockCount} Artikel unter Mindestbestand`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="font-mono">{lowStockCount}</span>
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title={darkMode ? 'Heller Modus' : 'Dunkler Modus'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Pill / Switcher */}
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="flex items-center space-x-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-800 dark:text-slate-100 transition shadow-2xs"
              title="Benutzer wechseln / Anmelden"
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-bold shrink-0 ${
                currentUser?.role === 'admin' ? 'bg-purple-600' : 'bg-indigo-600'
              }`}>
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <span className="hidden sm:inline max-w-[100px] truncate">
                {currentUser?.name || 'Mitarbeiter'}
              </span>
              {currentUser?.role === 'admin' && (
                <span className="hidden md:inline text-[9px] px-1 py-0.2 bg-purple-200/80 dark:bg-purple-900/80 text-purple-900 dark:text-purple-200 rounded font-bold uppercase">
                  Admin
                </span>
              )}
            </button>

            {/* Neuer Artikel Button */}
            {(!currentUser?.permissions || currentUser.permissions.canManageInventory !== false) && (
              <button
                type="button"
                onClick={() => {
                  setEditingProduct(null);
                  setScannedBarcode('');
                  setDefaultLocation(null);
                  setIsFormOpen(true);
                }}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Neuer Artikel</span>
                <span className="sm:hidden">Neu</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Desktop Navigation Tabs */}
        <div className="hidden sm:flex max-w-6xl mx-auto px-6 space-x-1 border-t border-slate-100 dark:border-slate-700 overflow-x-auto no-scrollbar">
          {isTabAllowed('shelf') && (
            <button
              type="button"
              onClick={() => setActiveTab('shelf')}
              className={`flex items-center space-x-1.5 px-3.5 py-2.5 border-b-2 font-bold text-xs sm:text-sm transition whitespace-nowrap ${
                activeTab === 'shelf' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Regal (8×5)</span>
            </button>
          )}

          {isTabAllowed('list') && (
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`flex items-center space-x-1.5 px-3.5 py-2.5 border-b-2 font-bold text-xs sm:text-sm transition whitespace-nowrap ${
                activeTab === 'list' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Artikelliste</span>
            </button>
          )}

          {isTabAllowed('reorder') && (
            <button
              type="button"
              onClick={() => setActiveTab('reorder')}
              className={`flex items-center space-x-1.5 px-3.5 py-2.5 border-b-2 font-bold text-xs sm:text-sm transition whitespace-nowrap ${
                activeTab === 'reorder' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Nachbestell-Liste</span>
              {lowStockCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 font-bold">
                  {lowStockCount}
                </span>
              )}
            </button>
          )}

          {isTabAllowed('shipping') && (
            <button
              type="button"
              onClick={() => setActiveTab('shipping')}
              className={`flex items-center space-x-1.5 px-3.5 py-2.5 border-b-2 font-bold text-xs sm:text-sm transition whitespace-nowrap ${
                activeTab === 'shipping' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Scale className="w-4 h-4" />
              <span>Paket & Versand</span>
            </button>
          )}

          {isTabAllowed('history') && (
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-1.5 px-3.5 py-2.5 border-b-2 font-bold text-xs sm:text-sm transition whitespace-nowrap ${
                activeTab === 'history' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <HistoryIcon className="w-4 h-4" />
              <span>Verlauf & Protokoll</span>
            </button>
          )}

          {isTabAllowed('scanner') && (
            <button
              type="button"
              onClick={() => setActiveTab('scanner')}
              className={`flex items-center space-x-1.5 px-3.5 py-2.5 border-b-2 font-bold text-xs sm:text-sm transition whitespace-nowrap ${
                activeTab === 'scanner' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Scanner</span>
            </button>
          )}

          {isTabAllowed('generator') && (
            <button
              type="button"
              onClick={() => setActiveTab('generator')}
              className={`flex items-center space-x-1.5 px-3.5 py-2.5 border-b-2 font-bold text-xs sm:text-sm transition whitespace-nowrap ${
                activeTab === 'generator' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Hash className="w-4 h-4" />
              <span>Barcodes</span>
            </button>
          )}

          {isTabAllowed('settings') && (
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center space-x-1.5 px-3.5 py-2.5 border-b-2 font-bold text-xs sm:text-sm transition whitespace-nowrap ${
                activeTab === 'settings' ? 'border-purple-600 text-purple-600 dark:text-purple-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin-Rechte</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-6 pb-24 sm:pb-10 max-w-6xl mx-auto w-full">
        {activeTab === 'shelf' && isTabAllowed('shelf') && (
          <ShelfView 
            products={products}
            onEdit={(p) => {
              setEditingProduct(p);
              setDefaultLocation(null);
              setIsFormOpen(true);
            }}
            onAddNewToLocation={handleAddNewToLocation}
            onQuickQuantityChange={handleQuickQuantityChange}
            onOpenMovement={handleOpenMovementModal}
          />
        )}

        {activeTab === 'list' && isTabAllowed('list') && (
          <InventoryList 
            products={products} 
            currentUser={currentUser}
            onEdit={(p) => {
              setEditingProduct(p);
              setDefaultLocation(null);
              setIsFormOpen(true);
            }} 
            onDelete={handleDelete}
            onOpenMovement={handleOpenMovementModal}
            onQuickQuantityChange={handleQuickQuantityChange}
          />
        )}

        {activeTab === 'reorder' && isTabAllowed('reorder') && (
          <ReorderView 
            products={products} 
            onOpenQuickEdit={(p) => {
              setEditingProduct(p);
              setDefaultLocation(null);
              setIsFormOpen(true);
            }}
          />
        )}

        {activeTab === 'shipping' && isTabAllowed('shipping') && (
          <ShippingCalculatorView 
            products={products}
            currentUser={currentUser}
            onStockUpdated={loadProducts}
          />
        )}

        {activeTab === 'history' && isTabAllowed('history') && (
          <HistoryView currentUser={currentUser} />
        )}
        
        {activeTab === 'scanner' && isTabAllowed('scanner') && (
          <Scanner onScan={handleScan} />
        )}
        
        {activeTab === 'generator' && isTabAllowed('generator') && (
          <BarcodeGen />
        )}

        {activeTab === 'settings' && isTabAllowed('settings') && (
          <AdminSettingsView
            currentUser={currentUser}
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
            onSwitchUser={handleSetUser}
          />
        )}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 sm:hidden shadow-lg pb-[env(safe-area-inset-bottom,8px)]">
        <div className="flex items-center justify-around px-2 py-1.5">
          {isTabAllowed('shelf') && (
            <button
              type="button"
              onClick={() => setActiveTab('shelf')}
              className={`flex flex-col items-center justify-center min-w-[52px] py-1 px-1.5 rounded-xl transition ${
                activeTab === 'shelf'
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'shelf' ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''}`}>
                <LayoutGrid className={`w-5 h-5 ${activeTab === 'shelf' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 font-medium">Regal</span>
            </button>
          )}

          {isTabAllowed('list') && (
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`flex flex-col items-center justify-center min-w-[52px] py-1 px-1.5 rounded-xl transition ${
                activeTab === 'list'
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'list' ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''}`}>
                <List className={`w-5 h-5 ${activeTab === 'list' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 font-medium">Artikel</span>
            </button>
          )}

          {isTabAllowed('scanner') && (
            <button
              type="button"
              onClick={() => setActiveTab('scanner')}
              className="flex flex-col items-center justify-center min-w-[56px] py-0.5 px-1 rounded-xl transition group"
            >
              <div className={`w-10 h-10 -mt-3 rounded-2xl flex items-center justify-center shadow-md transition transform group-active:scale-95 ${
                activeTab === 'scanner' 
                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-950' 
                  : 'bg-indigo-600 text-white'
              }`}>
                <QrCode className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 ${
                activeTab === 'scanner' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400 font-medium'
              }`}>
                Scan
              </span>
            </button>
          )}

          {isTabAllowed('reorder') && (
            <button
              type="button"
              onClick={() => setActiveTab('reorder')}
              className={`relative flex flex-col items-center justify-center min-w-[52px] py-1 px-1.5 rounded-xl transition ${
                activeTab === 'reorder'
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'reorder' ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''}`}>
                <ShoppingCart className={`w-5 h-5 ${activeTab === 'reorder' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 font-medium">Bestellen</span>
              {lowStockCount > 0 && (
                <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>
          )}

          {isTabAllowed('shipping') && (
            <button
              type="button"
              onClick={() => setActiveTab('shipping')}
              className={`flex flex-col items-center justify-center min-w-[52px] py-1 px-1.5 rounded-xl transition ${
                activeTab === 'shipping'
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'shipping' ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''}`}>
                <Scale className={`w-5 h-5 ${activeTab === 'shipping' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 font-medium">Versand</span>
            </button>
          )}

          {isTabAllowed('history') && !isTabAllowed('settings') && (
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex flex-col items-center justify-center min-w-[52px] py-1 px-1.5 rounded-xl transition ${
                activeTab === 'history'
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'history' ? 'bg-indigo-50 dark:bg-indigo-950/60' : ''}`}>
                <HistoryIcon className={`w-5 h-5 ${activeTab === 'history' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 font-medium">Verlauf</span>
            </button>
          )}

          {isTabAllowed('settings') && (
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`flex flex-col items-center justify-center min-w-[52px] py-1 px-1.5 rounded-xl transition ${
                activeTab === 'settings'
                  ? 'text-purple-600 dark:text-purple-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === 'settings' ? 'bg-purple-50 dark:bg-purple-950/60' : ''}`}>
                <Settings className={`w-5 h-5 ${activeTab === 'settings' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 font-medium">Admin</span>
            </button>
          )}
        </div>
      </nav>

      {/* Modal: Login / User Switch */}
      {isLoginModalOpen && (
        <LoginModal
          currentUser={currentUser}
          onLogin={handleSetUser}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}

      {/* Modal: Dedicated Minus / Withdrawal with Ticket popup */}
      {withdrawProduct && currentUser && (
        <WithdrawModal
          product={withdrawProduct}
          user={currentUser}
          onConfirm={handleConfirmWithdraw}
          onClose={() => setWithdrawProduct(null)}
        />
      )}

      {/* Modal: Stock Movement (Full Zubuchen/Entnehmen modal) */}
      {movementProduct && currentUser && (
        <StockMovementModal
          product={movementProduct}
          user={currentUser}
          onConfirm={handleConfirmStockMovement}
          onClose={() => setMovementProduct(null)}
        />
      )}

      {/* Modal: New EAN Scanned (Shelf Picker & Quick Creation) */}
      {newEanBarcode && (
        <NewEanPromptModal
          scannedBarcode={newEanBarcode}
          currentUser={currentUser}
          onSaveNew={handleSaveFromPrompt}
          onOpenFullForm={handleOpenFullFormFromPrompt}
          onClose={() => setNewEanBarcode(null)}
        />
      )}

      {/* Modal: Product Form (Create / Edit) */}
      {isFormOpen && (
        <ProductForm 
          initialData={editingProduct} 
          scannedBarcode={scannedBarcode}
          defaultLocation={defaultLocation}
          onSave={handleSaveProduct} 
          onCancel={() => {
            setIsFormOpen(false);
            setEditingProduct(null);
            setScannedBarcode('');
            setDefaultLocation(null);
          }} 
        />
      )}
    </div>
  );
}

