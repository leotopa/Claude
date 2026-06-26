export type UserRole = 'CLIENT' | 'ESTABLISHMENT'
export type SubscriptionPlan = 'STARTER' | 'GROWTH' | 'ENTERPRISE'
export type SubscriptionStatus = 'ACTIVE' | 'INACTIVE' | 'TRIAL' | 'CANCELLED'
export type ReceiptStatus = 'OPEN' | 'SPLIT_IN_PROGRESS' | 'CLOSED'
export type SplitGroupStatus = 'COLLECTING' | 'COMPLETED'
export type SplitMemberStatus = 'PENDING' | 'PAID'

export interface ReceiptItemData {
  id?: string
  name: string
  price: number
  quantity: number
}

export interface ReceiptWithRelations {
  id: string
  establishmentId: string
  clientId: string | null
  totalAmount: number
  subtotal: number
  tax: number
  gratuity: number
  items: ReceiptItemData[]
  date: Date
  status: ReceiptStatus
  nfcTransactionId: string | null
  qrCode: string | null
  createdAt: Date
  establishment: {
    id: string
    name: string
    address: string
  }
  client?: {
    id: string
    name: string
    email: string
  } | null
  splitGroup?: SplitGroupWithMembers | null
}

export interface SplitGroupWithMembers {
  id: string
  receiptId: string
  hostUserId: string
  totalAmount: number
  amountCollected: number
  status: SplitGroupStatus
  shareCode: string
  createdAt: Date
  splitMembers: SplitMember[]
}

export interface SplitMember {
  id: string
  splitGroupId: string
  name: string
  email: string | null
  amountOwed: number
  amountPaid: number
  status: SplitMemberStatus
  paymentMethod: string | null
  paidAt: Date | null
  stripePaymentIntentId: string | null
  selectedItems: ReceiptItemData[] | null
}

export interface EstablishmentStats {
  todayReceipts: number
  monthReceipts: number
  todayRevenue: number
  monthRevenue: number
  activeSplits: number
}

export interface ClientStats {
  totalSpentMonth: number
  receiptCount: number
  topCategory: string
}
