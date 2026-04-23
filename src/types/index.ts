export type UserRole = 'ADMIN' | 'FINANCE' | 'SECTOR_LEAD';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  sector?: string;
}

export type Sector = 
  | 'Bilheteria'
  | 'Operação'
  | 'Estação'
  | 'Marketing'
  | 'Manutenção'
  | 'Financeiro';

export type PurchaseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

export interface PurchaseRequest {
  id: string;
  productName: string;
  description: string;
  amount: number;
  sector: Sector;
  requestedBy: string;
  date: string;
  status: PurchaseStatus;
  approvedBy?: string;
  paymentMethod: 'BOLETO' | 'PIX' | 'CREDIT_CARD';
  attachments: string[];
  dueDate?: string;
}

export interface Budget {
  sector: Sector;
  allocated: number;
  spent: number;
  period: string; // e.g., "2026-04"
}
