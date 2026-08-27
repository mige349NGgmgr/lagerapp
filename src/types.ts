export type UserRole = 'admin' | 'employee';

export type ViewTab = 'shelf' | 'list' | 'scanner' | 'history' | 'reorder' | 'shipping' | 'generator' | 'settings';

export interface UserPermissions {
  canScanIn: boolean;          // Einbuchen / Zubuchen (+)
  canScanOut: boolean;         // Ausbuchen / Entnehmen (-)
  canManageInventory: boolean; // Artikel anlegen & bearbeiten
  canDeleteProducts: boolean;  // Artikel löschen
  canViewHistory: boolean;     // Buchungsverlauf & Protokoll einsehen
  canExportData: boolean;      // CSV & Berichte exportieren
  canManageUsers: boolean;     // Benutzer- und Rechteverwaltung (Admin)
  // Window / Tab access permissions
  allowedTabs?: ViewTab[];     // Erlaubte Fenster/Tabs für den Mitarbeiter
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string;
  permissions?: UserPermissions;
  active?: boolean;
  department?: string;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  barcode: string;
  quantity: number;
  minQuantity: number;
  locationLetter: string; // A-H
  locationNumber: number; // 1-5
  weightGrams?: number; // Bruttogewicht pro Stück (inkl. Produktverpackung / OVP) in Gramm
  serialNumber?: string; // Seriennummer / Chargennummer
  category?: string;
  notes?: string;
}

export type HistoryAction = 'WITHDRAW' | 'ADD' | 'CREATE' | 'UPDATE' | 'DELETE';

export interface HistoryEntry {
  id: string;
  timestamp: string;
  userId: string;
  username: string;
  userFullName: string;
  userRole: UserRole;
  productId: string;
  productName: string;
  barcode: string;
  location: string;
  action: HistoryAction;
  quantityChanged: number;
  previousQuantity: number;
  newQuantity: number;
  ticketNumber?: string;
  weightGramsPerUnit?: number;
  totalWeightGrams?: number;
  notes?: string;
}

export interface EanLookupResult {
  success: boolean;
  name?: string;
  category?: string;
  weightGrams?: number;
  notes?: string;
  source?: string;
  message?: string;
  error?: string;
}

export type StockStatus = 'CRITICAL' | 'WARNING' | 'OK';

/**
 * Farb- und Schwellenwert-Logik:
 * - Wenn Wert < Mindestbestand: ROT (CRITICAL)
 * - Wenn Wert == Mindestbestand: ORANGE (WARNING)
 * - Wenn Wert > Mindestbestand: NORMAL / SCHWARZ (OK)
 */
export function getStockStatus(quantity: number, minQuantity: number): StockStatus {
  if (quantity < minQuantity) return 'CRITICAL'; // Unter Mindestbestand -> ROT
  if (quantity === minQuantity) return 'WARNING'; // Genau Mindestbestand (z.B. 15 bei Min 15) -> ORANGE
  return 'OK'; // Über Mindestbestand -> NORMAL / SCHWARZ
}


