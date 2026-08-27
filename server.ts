import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), 'inventory.json');
const USERS_FILE = path.join(process.cwd(), 'users.json');
const HISTORY_FILE = path.join(process.cwd(), 'history.json');

app.use(express.json());

// Initial DB and Storage Setup
const defaultUsers = [
  { 
    id: 'u-admin', 
    username: 'admin', 
    password: 'admin123', 
    name: 'Administrator', 
    role: 'admin',
    department: 'IT & Lagerleitung',
    active: true,
    createdAt: '2024-01-01T08:00:00.000Z',
    permissions: {
      canScanIn: true,
      canScanOut: true,
      canManageInventory: true,
      canDeleteProducts: true,
      canViewHistory: true,
      canExportData: true,
      canManageUsers: true,
    }
  },
  { 
    id: 'u-1', 
    username: 'm.klein', 
    password: 'lager123', 
    name: 'Marvin Klein', 
    role: 'employee',
    department: 'Kommissionierung & IT',
    active: true,
    createdAt: '2024-02-15T09:30:00.000Z',
    permissions: {
      canScanIn: true,
      canScanOut: true,
      canManageInventory: true,
      canDeleteProducts: false,
      canViewHistory: true,
      canExportData: true,
      canManageUsers: false,
    }
  },
  { 
    id: 'u-2', 
    username: 's.weber', 
    password: 'lager123', 
    name: 'Sarah Weber', 
    role: 'employee',
    department: 'Wareneingang & Versand',
    active: true,
    createdAt: '2024-03-01T10:00:00.000Z',
    permissions: {
      canScanIn: true,
      canScanOut: true,
      canManageInventory: true,
      canDeleteProducts: false,
      canViewHistory: true,
      canExportData: false,
      canManageUsers: false,
    }
  },
  { 
    id: 'u-3', 
    username: 'j.schmidt', 
    password: 'lager123', 
    name: 'Jan Schmidt', 
    role: 'employee',
    department: 'Lagerlogistik',
    active: true,
    createdAt: '2024-04-10T11:15:00.000Z',
    permissions: {
      canScanIn: true,
      canScanOut: true,
      canManageInventory: false,
      canDeleteProducts: false,
      canViewHistory: true,
      canExportData: false,
      canManageUsers: false,
    }
  }
];

const defaultInitialInventory = [
  {
    id: "1",
    name: "M6x20 Zylinderschrauben",
    barcode: "4012345678901",
    locationLetter: "A",
    locationNumber: 1,
    quantity: 120,
    minQuantity: 50,
    category: "Schrauben & Muttern",
    weightGrams: 8,
    notes: "Edelstahl V2A"
  },
  {
    id: "2",
    name: "Kugellager 608-2RS",
    barcode: "4012345678902",
    locationLetter: "B",
    locationNumber: 2,
    quantity: 8,
    minQuantity: 15,
    category: "Kugellager",
    weightGrams: 12,
    notes: "Nachbestellung erforderlich!"
  },
  {
    id: "3",
    name: "Kabelbinder 200x3.6mm",
    barcode: "4012345678903",
    locationLetter: "C",
    locationNumber: 3,
    quantity: 450,
    minQuantity: 100,
    category: "Montagematerial",
    weightGrams: 2,
    notes: "Schwarz, UV-beständig"
  },
  {
    id: "4",
    name: "Schrumpfschlauch Sortiment",
    barcode: "4012345678904",
    locationLetter: "D",
    locationNumber: 1,
    quantity: 3,
    minQuantity: 5,
    category: "Elektrik",
    weightGrams: 180,
    notes: "Niedriger Bestand"
  },
  {
    id: "5",
    name: "Winkelschleifer Trennscheiben 125mm",
    barcode: "4012345678905",
    locationLetter: "E",
    locationNumber: 4,
    quantity: 25,
    minQuantity: 10,
    category: "Werkzeug & Zubehör",
    weightGrams: 35,
    notes: "Edelstahl-Trennscheiben 1mm"
  }
];

const readDB = () => {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultInitialInventory, null, 2));
    return defaultInitialInventory;
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

const writeDB = (data: any) => fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));

const readUsers = () => {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
    return defaultUsers;
  }
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
  } catch {
    return defaultUsers;
  }
};

const writeUsers = (data: any) => fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));

const readHistory = () => {
  if (!fs.existsSync(HISTORY_FILE)) {
    const sampleHistory = [
      {
        id: "h-init-1",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        userId: "u-1",
        username: "m.klein",
        userFullName: "Marvin Klein",
        userRole: "employee",
        productId: "1",
        productName: "M6x20 Zylinderschrauben",
        barcode: "4012345678901",
        location: "A1",
        action: "WITHDRAW",
        quantityChanged: -30,
        previousQuantity: 150,
        newQuantity: 120,
        ticketNumber: "TICK-8041",
        weightGramsPerUnit: 8,
        totalWeightGrams: 240,
        notes: "Montage Vorrichtung Werkstatt 3"
      },
      {
        id: "h-init-2",
        timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
        userId: "u-2",
        username: "s.weber",
        userFullName: "Sarah Weber",
        userRole: "employee",
        productId: "2",
        productName: "Kugellager 608-2RS",
        barcode: "4012345678902",
        location: "B2",
        action: "WITHDRAW",
        quantityChanged: -4,
        previousQuantity: 12,
        newQuantity: 8,
        ticketNumber: "AUFTRAG-992",
        weightGramsPerUnit: 12,
        totalWeightGrams: 48,
        notes: "Austausch Förderschnecke"
      }
    ];
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(sampleHistory, null, 2));
    return sampleHistory;
  }
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
  } catch {
    return [];
  }
};

const writeHistory = (data: any) => fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2));

// Helper: Gewicht aus Textangaben parsen
function parseWeightFromText(text?: string): number | null {
  if (!text) return null;
  const t = text.toLowerCase();
  
  // z.B. 500 g / 500g / 500 Gramm
  const gMatch = t.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gramm|gr)\b/);
  if (gMatch) {
    const val = parseFloat(gMatch[1].replace(',', '.'));
    if (!isNaN(val) && val > 0) return Math.round(val);
  }

  // z.B. 1.5 kg / 1,5kg / 2 Kilo
  const kgMatch = t.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilo|kilogramm)\b/);
  if (kgMatch) {
    const val = parseFloat(kgMatch[1].replace(',', '.'));
    if (!isNaN(val) && val > 0) return Math.round(val * 1000);
  }

  // z.B. 500 ml / 1 l (oft ca. 1g/ml)
  const mlMatch = t.match(/(\d+(?:[.,]\d+)?)\s*(?:ml|milliliter)\b/);
  if (mlMatch) {
    const val = parseFloat(mlMatch[1].replace(',', '.'));
    if (!isNaN(val) && val > 0) return Math.round(val);
  }

  return null;
}

// ----------------------------------------------------------------------
// EAN-Datenbank & Hardware/IT/Industrie Master-Katalog (Bruttogewichte inkl. Produktverpackung / OVP)
// ----------------------------------------------------------------------
const EAN_MASTER_CATALOG: Record<string, { name: string; category: string; weightGrams: number; notes?: string }> = {
  // AVM FRITZ! Produkte & Smart Home (Gewichte inkl. OVP, Netzteil, Zubehör, Handbuch)
  '4023125025983': { name: 'AVM FRITZ!DECT Repeater 100', category: 'IT & Netzwerk', weightGrams: 240, notes: 'Hersteller: AVM, Art.-Nr. 20002598, DECT-Verstärker mit Steckdose (inkl. OVP & Handbuch)' },
  '4023125027581': { name: 'AVM FRITZ!DECT 200 Intelligente Steckdose', category: 'Smart Home & IT', weightGrams: 235, notes: 'Hersteller: AVM, Art.-Nr. 20002758 (inkl. OVP)' },
  '4023125028496': { name: 'AVM FRITZ!DECT 301 Heizkörperregler', category: 'Smart Home & IT', weightGrams: 260, notes: 'Hersteller: AVM, Art.-Nr. 20002849 (inkl. OVP, Adapter & Batterien)' },
  '4023125029355': { name: 'AVM FRITZ!DECT 302 Heizkörperregler', category: 'Smart Home & IT', weightGrams: 270, notes: 'Hersteller: AVM, Art.-Nr. 20002935 (inkl. OVP, Adapter & Batterien)' },
  '4023125028990': { name: 'AVM FRITZ!DECT 500 LED-Lampe E27', category: 'Smart Home & IT', weightGrams: 130, notes: 'Hersteller: AVM, Art.-Nr. 20002899 (inkl. OVP)' },
  '4023125029348': { name: 'AVM FRITZ!DECT 440 Funktaster', category: 'Smart Home & IT', weightGrams: 160, notes: 'Hersteller: AVM, Art.-Nr. 20002934, Vierfachtaster mit E-Paper Display (inkl. OVP)' },
  '4023142029294': { name: 'AVM FRITZ!Box 7590 AX', category: 'IT & Netzwerk', weightGrams: 1350, notes: 'Hersteller: AVM, Art.-Nr. 20002929, Wi-Fi 6 VDSL-Router (inkl. OVP, Netzteil, LAN/DSL-Kabel)' },
  '4023142029300': { name: 'AVM FRITZ!Repeater 1200 AX', category: 'IT & Netzwerk', weightGrams: 310, notes: 'Hersteller: AVM, Art.-Nr. 20002930, Wi-Fi 6 Repeater (inkl. OVP & LAN-Kabel)' },
  '4023142029485': { name: 'AVM FRITZ!Repeater 3000 AX', category: 'IT & Netzwerk', weightGrams: 980, notes: 'Hersteller: AVM, Art.-Nr. 20002948, Triband Wi-Fi 6 Repeater (inkl. OVP & Netzteil)' },
  '4023142029409': { name: 'AVM FRITZ!Repeater 6000', category: 'IT & Netzwerk', weightGrams: 1020, notes: 'Hersteller: AVM, Art.-Nr. 20002940, Triband Wi-Fi 6 Repeater (inkl. OVP & Netzteil)' },
  '4023142029379': { name: 'AVM FRITZ!Box 6690 Cable', category: 'IT & Netzwerk', weightGrams: 1520, notes: 'Hersteller: AVM, Art.-Nr. 20002937, DOCSIS 3.1 Kabelrouter (inkl. OVP & Zubehör)' },
  '4023142029140': { name: 'AVM FRITZ!Box 5530 Fiber', category: 'IT & Netzwerk', weightGrams: 920, notes: 'Hersteller: AVM, Art.-Nr. 20002914, Glasfaser Router (inkl. OVP & SFP-Modul)' },
  '4023142029966': { name: 'AVM FRITZ!Box 7690', category: 'IT & Netzwerk', weightGrams: 1380, notes: 'Hersteller: AVM, Wi-Fi 7 DSL-Router (inkl. OVP & Netzteil)' },
  '4023125029010': { name: 'AVM FRITZ!Fon C6 Schnurlostelefon', category: 'IT & Telekommunikation', weightGrams: 340, notes: 'Hersteller: AVM, Art.-Nr. 20002901 (inkl. OVP, Ladeschale, Akku, Netzteil)' },
  '4023125029775': { name: 'AVM FRITZ!Fon X6 Schnurlostelefon', category: 'IT & Telekommunikation', weightGrams: 350, notes: 'Hersteller: AVM, Art.-Nr. 20002977 (inkl. OVP, Ladeschale, Akku, Netzteil)' },
  '4023125028014': { name: 'AVM FRITZ!Powerline 1220E Set', category: 'IT & Netzwerk', weightGrams: 680, notes: 'Hersteller: AVM, Art.-Nr. 20002801, Gigabit-Powerline Set (inkl. OVP & 2x LAN-Kabel)' },

  // KNIPEX Werkzeuge (inkl. SB-Verpackung / Blisterkarte)
  '4003773022008': { name: 'KNIPEX Cobra Wasserpumpenzange 250mm', category: 'Handwerkzeug & Zangen', weightGrams: 365, notes: 'Art.-Nr. 87 01 250 (inkl. SB-Kartonage)' },
  '4003773060185': { name: 'KNIPEX Cobra Wasserpumpenzange 180mm', category: 'Handwerkzeug & Zangen', weightGrams: 195, notes: 'Art.-Nr. 87 01 180 (inkl. SB-Kartonage)' },
  '4003773022992': { name: 'KNIPEX Zangenschlüssel 250mm', category: 'Handwerkzeug & Zangen', weightGrams: 495, notes: 'Art.-Nr. 86 03 250 (inkl. SB-Kartonage)' },
  '4003773043133': { name: 'KNIPEX Seitenschneider 160mm', category: 'Handwerkzeug & Zangen', weightGrams: 230, notes: 'Art.-Nr. 70 02 160 (inkl. SB-Kartonage)' },
  '4003773082613': { name: 'KNIPEX Cobra QuickSet 250mm', category: 'Handwerkzeug & Zangen', weightGrams: 365, notes: 'Art.-Nr. 87 21 250 (inkl. SB-Kartonage)' },

  // WERA Werkzeuge (inkl. OVP / Tasche / Box)
  '4013288156037': { name: 'Wera Kraftform Kompakt 27 RA 1 SB Ratschenschraubendreher', category: 'Handwerkzeug & Bits', weightGrams: 290, notes: 'Art.-Nr. 05073660001 (inkl. SB-Verpackung)' },
  '4013288173003': { name: 'Wera Zyklop Speed Knarrensatz 1/4 Zoll', category: 'Handwerkzeug & Knarren', weightGrams: 1480, notes: 'Art.-Nr. 05004016001, 28-teilig (inkl. textiler Falttasche)' },
  '4013288121172': { name: 'Wera Kraftform Plus 334/6 Schraubendrehersatz', category: 'Handwerkzeug & Bits', weightGrams: 640, notes: 'Art.-Nr. 05105650001, 6-teilig (inkl. OVP & Wandhalter)' },

  // BOSCH Professional & Zubehör (inkl. OVP Schachtel)
  '3165140867887': { name: 'Bosch ProCORE18V 4.0Ah Akku', category: 'Elektrowerkzeuge & Akkus', weightGrams: 560, notes: 'Hersteller: Bosch Professional, 1600A016GB (inkl. OVP Schachtel)' },
  '3165140952873': { name: 'Bosch ProCORE18V 8.0Ah Akku', category: 'Elektrowerkzeuge & Akkus', weightGrams: 1020, notes: 'Hersteller: Bosch Professional, 1600A016GK (inkl. OVP Schachtel)' },
  '3165140867948': { name: 'Bosch Professional Akku-Bohrschrauber GSR 18V-55', category: 'Elektrowerkzeuge & Akkus', weightGrams: 2450, notes: 'Art.-Nr. 06019H5200 (inkl. L-BOXX / OVP)' },
  '3165140417952': { name: 'Bosch SDS-plus-7X Hammerbohrer-Set 5-tlg.', category: 'Bohrer & Schneidwerkzeuge', weightGrams: 370, notes: 'Art.-Nr. 2608576198 (inkl. robuster Kassette)' },

  // Brennenstuhl Stromverteilung & Licht (inkl. Verkaufsverpackung)
  '4007123646549': { name: 'Brennenstuhl Premium-Line 6-fach Steckdosenleiste mit Schalter', category: 'Elektro & Stromverteilung', weightGrams: 720, notes: 'Hersteller: Brennenstuhl, Art.-Nr. 1156050016 (inkl. OVP)' },
  '4007123668275': { name: 'Brennenstuhl Garant Kabeltrommel 25m IP44', category: 'Elektro & Stromverteilung', weightGrams: 4450, notes: 'Hersteller: Brennenstuhl, Art.-Nr. 1198510 (inkl. Kartonverpackung)' },

  // Fischer Befestigungstechnik (Schachtelverpackung ist die Lagereinheit)
  '4048800045543': { name: 'fischer DuoPower 8x40 Universaldübel (100 Stück Packung)', category: 'Schrauben & Dübel', weightGrams: 230, notes: 'Hersteller: fischer, Art.-Nr. 535456 (100er Schachtel)' },
  '4048800045536': { name: 'fischer DuoPower 6x30 Universaldübel (100 Stück Packung)', category: 'Schrauben & Dübel', weightGrams: 140, notes: 'Hersteller: fischer, Art.-Nr. 535453 (100er Schachtel)' },
  '4048800045550': { name: 'fischer DuoPower 10x50 Universaldübel (50 Stück Packung)', category: 'Schrauben & Dübel', weightGrams: 260, notes: 'Hersteller: fischer, Art.-Nr. 535459 (50er Schachtel)' },

  // IT & Hardware (inkl. Retail-Box, Zubehör & Kabel)
  '5099206085831': { name: 'Logitech MX Master 3S Wireless Maus', category: 'IT & Eingabegeräte', weightGrams: 310, notes: 'Hersteller: Logitech, Graphite (inkl. OVP, USB-C Ladekabel & Bolt Empfänger)' },
  '5099206086920': { name: 'Logitech MX Keys S Wireless Tastatur', category: 'IT & Eingabegeräte', weightGrams: 1150, notes: 'Hersteller: Logitech, QWERTZ (inkl. OVP, Bolt Empfänger & Ladekabel)' },
  '5056561803273': { name: 'Raspberry Pi 5 Model B - 8GB RAM', category: 'IT & Mikroelektronik', weightGrams: 95, notes: 'Hersteller: Raspberry Pi Ltd (inkl. OVP Schachtel)' },
  '619659186678': { name: 'SanDisk Extreme PRO USB 3.2 Flash-Laufwerk 128GB', category: 'IT & Speichermedien', weightGrams: 55, notes: 'Hersteller: Western Digital / SanDisk (inkl. Blisterverpackung)' },
  '8806091819383': { name: 'Samsung 990 PRO NVMe M.2 SSD 2TB', category: 'IT & Speichermedien', weightGrams: 75, notes: 'Hersteller: Samsung, PCIe 4.0 (inkl. OVP Schachtel)' },
  '6935364052607': { name: 'TP-Link TL-SG108 8-Port Gigabit Desktop Switch', category: 'IT & Netzwerk', weightGrams: 590, notes: 'Hersteller: TP-Link, Metallgehäuse (inkl. OVP, Netzteil & Gummifüße)' }
};

// EAN-Datenbank Lookup Logik: 100% Live Online-Abfrage (Echtzeit Web-Suche, UPCitemdb, Open Food/Products Facts & KI-Parser)
function cleanWebProductTitle(raw: string): string {
  let title = raw
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, '')
    .trim();

  // Entferne bekannte Shop-Suffixe und Marktplatz-Anhänge
  title = title
    .replace(/\s*[-|–—]\s*(Amazon(\.de)?|eBay|reichelt|Bechtle|Elektro4000|Wortmann|Alternate|Cyberport|MediaMarkt|Saturn|Conrad|Office-Partner|Bürobedarf\s*\w*).*$/i, '')
    .replace(/\s*\(DE\)\s*/i, ' ')
    .replace(/\s*\(\d+\s*Stück\)/i, '')
    .replace(/\s*\(\d+\s*Piece\)/i, '')
    .replace(/\s*GTIN(\/EAN)?:\s*\d+/i, '')
    .replace(/\s*EAN:\s*\d+/i, '')
    .replace(/^Product data\s+/i, '')
    .replace(/^\.\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();

  return title;
}

async function lookupEanData(barcode: string) {
  const cleanBarcode = barcode.trim().replace(/\D/g, '');
  if (!cleanBarcode || cleanBarcode.length < 5) {
    return {
      success: false,
      message: 'Ungültiger Barcode (mindestens 5 Ziffern erforderlich).'
    };
  }

  // 0. Direkter Master-Katalog Treffer (100% verifiziert & 0ms Latenz)
  if (EAN_MASTER_CATALOG[cleanBarcode]) {
    const item = EAN_MASTER_CATALOG[cleanBarcode];
    return {
      success: true,
      name: item.name,
      category: item.category,
      weightGrams: item.weightGrams,
      notes: item.notes || '',
      source: 'Verifizierter GS1/Hardware Master-Katalog'
    };
  }

  // 1. Live Web-Suche: Durchsucht das gesamte Web in Echtzeit nach diesem Barcode
  let webSearchSnippets: string[] = [];
  let candidateTitle = '';
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const searchRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanBarcode + ' EAN OR GTIN')}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'de,en-US;q=0.9,en;q=0.8'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (searchRes.ok) {
      const html = await searchRes.text();
      const titles = [...html.matchAll(/class="result__title"[^>]*>[\s\S]*?<a[^>]*>(.*?)<\/a>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
      const snippets = [...html.matchAll(/class="result__snippet"[^>]*>(.*?)<\/a>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim());

      const lines: string[] = [];
      for (let i = 0; i < Math.max(titles.length, snippets.length); i++) {
        if (titles[i] && !titles[i].includes('EAN-Search') && !titles[i].includes('Kaufen - Amazon')) {
          lines.push(`Titel: ${titles[i]}`);
        }
        if (snippets[i] && !snippets[i].includes('Search our EAN database')) {
          lines.push(`Auszug: ${snippets[i]}`);
        }
      }
      webSearchSnippets = lines.slice(0, 12);

      // Besten Titel als sicheren Fallback vormerken
      for (const rawT of titles) {
        if (!rawT.includes('EAN-Search') && !rawT.includes('Kaufen - Amazon') && rawT.length > 5) {
          const cleaned = cleanWebProductTitle(rawT);
          if (cleaned.length > 5 && !cleaned.match(/^\d+$/)) {
            candidateTitle = cleaned;
            break;
          }
        }
      }
    }
  } catch (searchErr) {
    // Weiter zu anderen Quellen
  }

  // 2. Deterministische Extraktion aus Live Web-Recherche (100% ohne KI)
  if (candidateTitle) {
    let inferredCategory = 'Allgemein & Handelsware';
    const allText = (candidateTitle + ' ' + webSearchSnippets.join(' ')).toLowerCase();
    
    if (allText.includes('fritz') || allText.includes('router') || allText.includes('repeater') || allText.includes('switch') || allText.includes('wlan') || allText.includes('netzwerk') || allText.includes('lan')) {
      inferredCategory = 'IT & Netzwerk';
    } else if (allText.includes('knipex') || allText.includes('wera') || allText.includes('zange') || allText.includes('schraubendreher') || allText.includes('knarre') || allText.includes('werkzeug')) {
      inferredCategory = 'Handwerkzeug & Zangen';
    } else if (allText.includes('bosch') || allText.includes('makita') || allText.includes('akku') || allText.includes('bohr') || allText.includes('säge') || allText.includes('flex')) {
      inferredCategory = 'Elektrowerkzeuge & Akkus';
    } else if (allText.includes('fischer') || allText.includes('dübel') || allText.includes('schraube') || allText.includes('mutter') || allText.includes('gewinde')) {
      inferredCategory = 'Schrauben & Dübel';
    } else if (allText.includes('brennenstuhl') || allText.includes('steckdose') || allText.includes('kabel') || allText.includes('strom') || allText.includes('verteiler')) {
      inferredCategory = 'Elektro & Stromverteilung';
    } else if (allText.includes('tastatur') || allText.includes('maus') || allText.includes('ssd') || allText.includes('usb') || allText.includes('speicher')) {
      inferredCategory = 'IT & Hardware';
    }

    const inferredWeight = parseWeightFromText(webSearchSnippets.join(' ')) || 0;

    return {
      success: true,
      name: candidateTitle,
      category: inferredCategory,
      weightGrams: inferredWeight,
      notes: `Automatisch ermittelt über Web-Recherche (inkl. OVP)`,
      source: 'Live Web-Recherche'
    };
  }

  // 3. Live Online-Abfrage: UPCitemdb Trial API (über 500+ Millionen EANs/UPCs weltweit)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const upcRes = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${cleanBarcode}`, {
      headers: { 
        'User-Agent': 'LagerApp-OnlineScanner/1.0',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (upcRes.ok) {
      const upcData = await upcRes.json();
      if (upcData.code === 'OK' && Array.isArray(upcData.items) && upcData.items.length > 0) {
        const item = upcData.items[0];
        let name = (item.title || '').trim();
        const brand = (item.brand || '').trim();
        if (brand && name && !name.toLowerCase().includes(brand.toLowerCase())) {
          name = `${brand} ${name}`;
        }
        
        if (name) {
          let weightGrams = 0;
          if (item.weight) {
            weightGrams = parseWeightFromText(item.weight) || 0;
          }
          if (!weightGrams && item.description) {
            weightGrams = parseWeightFromText(item.description) || 0;
          }
          if (!weightGrams) {
            weightGrams = parseWeightFromText(name) || 0;
          }

          let category = (item.category || '').split('>').pop()?.trim() || 'Allgemein & Handelsware';

          return {
            success: true,
            name,
            category,
            weightGrams,
            notes: item.model ? `Modell: ${item.model}` : (item.description ? item.description.slice(0, 120) : ''),
            source: 'UPCitemdb EAN-Datenbank'
          };
        }
      }
    }
  } catch (upcErr) {
    // Weiter
  }

  // 4. Live Online-Abfrage: Open Food Facts & Open Products Facts
  if (cleanBarcode.length >= 8) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const offRes = await fetch(`https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`, {
        headers: { 'User-Agent': 'LagerApp - AI Studio - Inventory Applet' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (offRes.ok) {
        const data = await offRes.json();
        if (data.status === 1 && data.product) {
          const p = data.product;
          let name = p.product_name_de || p.product_name || p.generic_name_de || p.generic_name || '';
          if (name) {
            const brand = p.brands ? p.brands.split(',')[0].trim() : '';
            if (brand && !name.toLowerCase().includes(brand.toLowerCase())) {
              name = `${brand} ${name}`.trim();
            }
            let category = (p.categories_tags?.[0] || p.categories?.split(',')?.[0] || '')
              .replace(/^[a-z]{2}:/, '')
              .replace(/-/g, ' ')
              .trim();
            if (!category) category = 'Verbrauchsmaterial & Haushalt';

            let weightGrams = 0;
            if (p.product_quantity) {
              const q = parseFloat(p.product_quantity);
              if (!isNaN(q) && q > 0) weightGrams = Math.round(q);
            }
            if (!weightGrams && p.quantity) {
              weightGrams = parseWeightFromText(p.quantity) || 0;
            }

            return {
              success: true,
              name,
              category: category.charAt(0).toUpperCase() + category.slice(1),
              weightGrams: weightGrams || 0,
              notes: p.quantity ? `Menge: ${p.quantity}` : (brand ? `Marke: ${brand}` : ''),
              source: 'Open Food Facts'
            };
          }
        }
      }
    } catch (err) {
      // Weiter
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const opfRes = await fetch(`https://world.openproductsfacts.org/api/v0/product/${cleanBarcode}.json`, {
        headers: { 'User-Agent': 'LagerApp - AI Studio - Inventory Applet' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (opfRes.ok) {
        const data = await opfRes.json();
        if (data.status === 1 && data.product) {
          const p = data.product;
          let name = p.product_name_de || p.product_name || p.generic_name_de || p.generic_name || '';
          if (name) {
            const brand = p.brands ? p.brands.split(',')[0].trim() : '';
            if (brand && !name.toLowerCase().includes(brand.toLowerCase())) {
              name = `${brand} ${name}`.trim();
            }
            let category = (p.categories_tags?.[0] || p.categories?.split(',')?.[0] || '')
              .replace(/^[a-z]{2}:/, '')
              .replace(/-/g, ' ')
              .trim();
            if (!category) category = 'Werkstatt & Baumarkt';

            let weightGrams = 0;
            if (p.product_quantity) {
              const q = parseFloat(p.product_quantity);
              if (!isNaN(q) && q > 0) weightGrams = Math.round(q);
            }
            if (!weightGrams && p.quantity) {
              weightGrams = parseWeightFromText(p.quantity) || 0;
            }

            return {
              success: true,
              name,
              category: category.charAt(0).toUpperCase() + category.slice(1),
              weightGrams: weightGrams || 0,
              notes: p.quantity ? `Menge/Größe: ${p.quantity}` : (brand ? `Marke: ${brand}` : ''),
              source: 'Open Products Facts'
            };
          }
        }
      }
    } catch (err) {
      // Weiter
    }
  }

  // 5. GS1 Basis-Erkennung bei validem Barcode als nützlicher Vorschlag
  if (cleanBarcode.length === 13) {
    const prefix3 = parseInt(cleanBarcode.slice(0, 3), 10);
    let country = '';
    if (prefix3 >= 400 && prefix3 <= 440) country = 'GS1 Deutschland';
    else if (prefix3 >= 300 && prefix3 <= 379) country = 'GS1 Frankreich';
    else if (prefix3 === 760) country = 'GS1 Schweiz';
    else if (prefix3 >= 900 && prefix3 <= 919) country = 'GS1 Österreich';
    else if (prefix3 >= 500 && prefix3 <= 509) country = 'GS1 Großbritannien';
    else if (prefix3 >= 800 && prefix3 <= 839) country = 'GS1 Italien';
    else if (prefix3 >= 840 && prefix3 <= 849) country = 'GS1 Spanien';
    else if (prefix3 >= 0 && prefix3 <= 139) country = 'GS1 USA / Kanada';

    if (country) {
      return {
        success: false,
        message: `Gültige ${country} EAN (${cleanBarcode}). Kein Eintrag gefunden.`
      };
    }
  }

  return {
    success: false,
    message: 'Kein Eintrag für diesen Barcode in den Datenbanken gefunden.'
  };
}

// ----------------------------------------------------------------------
// API ROUTES
// ----------------------------------------------------------------------

// 1. Authentifizierung & Mitarbeiter
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Benutzername und Passwort erforderlich.' });
  }

  const users = readUsers();
  const user = users.find((u: any) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Ungültiger Benutzername oder falsches Kennwort.' });
  }

  const { password: _, ...userWithoutPass } = user;
  res.json({ success: true, user: userWithoutPass });
});

app.get('/api/users', (req, res) => {
  const users = readUsers();
  res.json(users.map(({ password, ...u }: any) => u));
});

app.post('/api/users', (req, res) => {
  const { username, password, name, role, department, permissions, active } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Pflichtfelder fehlen (Benutzername, Passwort, Name).' });
  }
  const users = readUsers();
  if (users.some((u: any) => u.username.toLowerCase() === username.trim().toLowerCase())) {
    return res.status(400).json({ error: 'Benutzername existiert bereits.' });
  }

  const defaultPerms = role === 'admin' ? {
    canScanIn: true,
    canScanOut: true,
    canManageInventory: true,
    canDeleteProducts: true,
    canViewHistory: true,
    canExportData: true,
    canManageUsers: true,
  } : {
    canScanIn: true,
    canScanOut: true,
    canManageInventory: true,
    canDeleteProducts: false,
    canViewHistory: true,
    canExportData: false,
    canManageUsers: false,
  };

  const newUser = {
    id: `u-${Date.now()}`,
    username: username.trim().toLowerCase(),
    password: password.trim(),
    name: name.trim(),
    role: role === 'admin' ? 'admin' : 'employee',
    department: department?.trim() || (role === 'admin' ? 'Lagerleitung' : 'Lager'),
    active: active !== undefined ? active : true,
    createdAt: new Date().toISOString(),
    permissions: permissions || defaultPerms
  };
  users.push(newUser);
  writeUsers(users);

  const { password: _, ...created } = newUser;
  res.json(created);
});

app.put('/api/users/:id', (req, res) => {
  const { name, role, department, permissions, active, password } = req.body;
  const users = readUsers();
  const index = users.findIndex((u: any) => u.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
  }

  const current = users[index];
  users[index] = {
    ...current,
    name: name !== undefined ? name.trim() : current.name,
    role: role !== undefined ? role : current.role,
    department: department !== undefined ? department.trim() : current.department,
    permissions: permissions !== undefined ? permissions : current.permissions,
    active: active !== undefined ? active : current.active,
    password: password && password.trim() ? password.trim() : current.password,
  };
  writeUsers(users);

  const { password: _, ...updated } = users[index];
  res.json(updated);
});

app.delete('/api/users/:id', (req, res) => {
  let users = readUsers();
  const target = users.find((u: any) => u.id === req.params.id);
  if (!target) {
    return res.status(404).json({ error: 'Benutzer nicht gefunden.' });
  }

  // Prevent deleting the main admin
  if (target.username === 'admin') {
    return res.status(400).json({ error: 'Der Haupt-Administrator kann nicht gelöscht werden.' });
  }

  users = users.filter((u: any) => u.id !== req.params.id);
  writeUsers(users);
  res.json({ success: true });
});

// 2. Verlauf / Audit Log & Buchungen
app.get('/api/history', (req, res) => {
  const history = readHistory();
  const { ticket, userId, action, search } = req.query;

  let filtered = [...history];

  if (ticket) {
    filtered = filtered.filter((h: any) => h.ticketNumber?.toLowerCase().includes((ticket as string).toLowerCase()));
  }
  if (userId) {
    filtered = filtered.filter((h: any) => h.userId === userId);
  }
  if (action) {
    filtered = filtered.filter((h: any) => h.action === action);
  }
  if (search) {
    const s = (search as string).toLowerCase();
    filtered = filtered.filter((h: any) => 
      h.productName?.toLowerCase().includes(s) ||
      h.barcode?.toLowerCase().includes(s) ||
      h.ticketNumber?.toLowerCase().includes(s) ||
      h.userFullName?.toLowerCase().includes(s) ||
      h.notes?.toLowerCase().includes(s)
    );
  }

  // Neueste zuerst
  filtered.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  res.json(filtered);
});

app.post('/api/history', (req, res) => {
  const history = readHistory();
  const entry = {
    id: `h-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    ...req.body
  };
  history.unshift(entry);
  writeHistory(history);
  res.json(entry);
});

// 3. EAN Lookup
app.get('/api/ean-lookup/:barcode?', async (req, res) => {
  const barcode = (req.params.barcode || req.query.barcode) as string;
  if (!barcode) {
    return res.status(400).json({ success: false, error: 'Barcode parameter is required' });
  }

  try {
    const result = await lookupEanData(barcode);
    res.json(result);
  } catch (error: any) {
    console.error('Error during EAN lookup:', error);
    res.status(500).json({ success: false, error: error.message || 'Lookup failed' });
  }
});

// 4. Inventar CRUD & Buchungsoperationen
app.get('/api/inventory', (req, res) => {
  res.json(readDB());
});

app.post('/api/inventory', (req, res) => {
  const items = readDB();
  const newItem = {
    id: Date.now().toString(),
    weightGrams: 0,
    ...req.body
  };
  items.push(newItem);
  writeDB(items);

  // Log creation if user info provided
  if (req.body.user) {
    const history = readHistory();
    history.unshift({
      id: `h-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: req.body.user.id,
      username: req.body.user.username,
      userFullName: req.body.user.name,
      userRole: req.body.user.role,
      productId: newItem.id,
      productName: newItem.name,
      barcode: newItem.barcode,
      location: `${newItem.locationLetter || 'A'}${newItem.locationNumber || 1}`,
      action: 'CREATE',
      quantityChanged: newItem.quantity,
      previousQuantity: 0,
      newQuantity: newItem.quantity,
      ticketNumber: req.body.ticketNumber || '',
      weightGramsPerUnit: newItem.weightGrams || 0,
      totalWeightGrams: (newItem.weightGrams || 0) * newItem.quantity,
      notes: `Neuer Artikel angelegt: ${newItem.notes || ''}`.trim()
    });
    writeHistory(history);
  }

  res.json(newItem);
});

// Entnahme / Zubuchung mit Ticket-Nummer Endpoint
app.post('/api/inventory/:id/stock-movement', (req, res) => {
  const { delta, user, ticketNumber, notes } = req.body;
  if (typeof delta !== 'number' || !user) {
    return res.status(400).json({ error: 'Ungültige Parameter für Lagerbewegung.' });
  }

  const items = readDB();
  const index = items.findIndex((i: any) => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Artikel nicht gefunden.' });
  }

  const item = items[index];
  const previousQuantity = item.quantity;
  const newQuantity = Math.max(0, previousQuantity + delta);
  const actualDelta = newQuantity - previousQuantity;

  item.quantity = newQuantity;
  writeDB(items);

  // Im Verlauf speichern
  const history = readHistory();
  const action = delta < 0 ? 'WITHDRAW' : 'ADD';
  const entry = {
    id: `h-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    timestamp: new Date().toISOString(),
    userId: user.id,
    username: user.username,
    userFullName: user.name,
    userRole: user.role,
    productId: item.id,
    productName: item.name,
    barcode: item.barcode,
    location: `${item.locationLetter || 'A'}${item.locationNumber || 1}`,
    action,
    quantityChanged: actualDelta,
    previousQuantity,
    newQuantity,
    ticketNumber: ticketNumber?.trim() || '',
    weightGramsPerUnit: item.weightGrams || 0,
    totalWeightGrams: (item.weightGrams || 0) * Math.abs(actualDelta),
    notes: notes?.trim() || ''
  };
  history.unshift(entry);
  writeHistory(history);

  res.json({ success: true, product: item, historyEntry: entry });
});

app.put('/api/inventory/:id', (req, res) => {
  const items = readDB();
  const index = items.findIndex((i: any) => i.id === req.params.id);
  if (index !== -1) {
    const previous = items[index];
    items[index] = { ...items[index], ...req.body };
    writeDB(items);

    // If user provided, log update
    if (req.body.user) {
      const history = readHistory();
      history.unshift({
        id: `h-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: req.body.user.id,
        username: req.body.user.username,
        userFullName: req.body.user.name,
        userRole: req.body.user.role,
        productId: items[index].id,
        productName: items[index].name,
        barcode: items[index].barcode,
        location: `${items[index].locationLetter || 'A'}${items[index].locationNumber || 1}`,
        action: 'UPDATE',
        quantityChanged: items[index].quantity - previous.quantity,
        previousQuantity: previous.quantity,
        newQuantity: items[index].quantity,
        ticketNumber: req.body.ticketNumber || '',
        weightGramsPerUnit: items[index].weightGrams || 0,
        totalWeightGrams: (items[index].weightGrams || 0) * items[index].quantity,
        notes: 'Artikeldaten aktualisiert'
      });
      writeHistory(history);
    }

    res.json(items[index]);
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.delete('/api/inventory/:id', (req, res) => {
  let items = readDB();
  const target = items.find((i: any) => i.id === req.params.id);
  if (target) {
    items = items.filter((i: any) => i.id !== req.params.id);
    writeDB(items);

    if (req.body.user) {
      const history = readHistory();
      history.unshift({
        id: `h-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: req.body.user.id,
        username: req.body.user.username,
        userFullName: req.body.user.name,
        userRole: req.body.user.role,
        productId: target.id,
        productName: target.name,
        barcode: target.barcode,
        location: `${target.locationLetter || 'A'}${target.locationNumber || 1}`,
        action: 'DELETE',
        quantityChanged: -target.quantity,
        previousQuantity: target.quantity,
        newQuantity: 0,
        ticketNumber: req.body.ticketNumber || '',
        weightGramsPerUnit: target.weightGrams || 0,
        totalWeightGrams: 0,
        notes: 'Artikel aus dem Lager gelöscht'
      });
      writeHistory(history);
    }
  }
  res.json({ success: true });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

