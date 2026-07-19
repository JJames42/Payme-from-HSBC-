export interface Attachment {
  name: string;
  type: string;
  data: string; // Base64 data URL
  duration?: number; // for voice recordings
}

export interface Message {
  id: string;
  sender: 'customer' | 'agent' | 'system' | 'bot';
  text: string;
  timestamp: string;
  attachment?: Attachment;
  agentName?: string;
  status?: 'delivered' | 'seen' | 'failed';
  isPinned?: boolean;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number; // HKD
  type: 'payment_received' | 'refund_sent' | 'disputed' | 'chargeback' | 'settlement';
  status: 'completed' | 'pending_dispute' | 'refunded' | 'held' | 'authorized';
  notes: string;
}

export interface CaseInstruction {
  id: string;
  title: string;
  category: 'Identity Verification' | 'Refund Required' | 'Bank Review' | 'Document Required' | 'Additional Information';
  status: 'pending' | 'completed';
  description: string;
}

export interface CasePaymentConfig {
  enabled: boolean;
  amount: number;
  currency: string;
  status: 'Awaiting Sender' | 'Awaiting Transfer' | 'Pending Confirmation' | 'Funds Pending' | 'Payment Pending' | 'Transfer Received' | 'Under Review' | 'Verification Complete';
  reference: string;
  deadline: string;
  notes: string;
}

export interface CollectedInfo {
  name?: string;
  email?: string;
  transactionId?: string;
  referenceNumber?: string;
  description?: string;
  fileAttached?: boolean;
  voiceAttached?: boolean;
}

export interface ChatSession {
  id: string;
  caseId: string; // PM-HK-20260718-000001
  userName: string;
  userEmail?: string;
  status: 'bot' | 'pending' | 'active' | 'resolved';
  language: 'en' | 'hk';
  createdAt: string;
  agentId?: string;
  attachmentsAllowed: boolean;
  voiceNotesAllowed: boolean;
  messages: Message[];
  transactions: Transaction[];
  selectedTopic?: string;
  
  // Advanced fields
  collectedInfo?: CollectedInfo;
  aiState?: 'welcome' | 'collect_name' | 'collect_email' | 'collect_topic' | 'collect_details' | 'collect_finished' | 'transferred';
  timelineProgress: number; // 1 to 6 (Received, Under Review, On Hold, Refund Verification, Pending Approval, Completed)
  paymentConfig?: CasePaymentConfig;
  instructions: CaseInstruction[];
  isLocked?: boolean;
  uploadsMuted?: boolean;
  agentTyping?: boolean;
  customerTyping?: boolean;
  internalNotes?: string;
  privateNotes?: string;
}

export interface Agent {
  id: string;
  name: string;
  initials: string;
  region: string;
  activeTime: string;
  description: string;
  status: 'online' | 'offline' | 'idle' | 'busy' | 'away';
  avatar: string;
  department: string;
  currentChatCount: number;
}
