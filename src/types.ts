export interface Attachment {
  name: string;
  type: string;
  data: string; // Base64 data URL
}

export interface Message {
  id: string;
  sender: 'customer' | 'agent' | 'system' | 'bot';
  text: string;
  timestamp: string;
  attachment?: Attachment;
  agentName?: string;
}

export interface Transaction {
  id: string;
  date: string;
  amount: number; // HKD
  type: 'payment_received' | 'refund_sent' | 'disputed' | 'chargeback' | 'settlement';
  status: 'completed' | 'pending_dispute' | 'refunded' | 'held' | 'authorized';
  notes: string;
}

export interface ChatSession {
  id: string;
  userName: string;
  userEmail?: string;
  status: 'bot' | 'pending' | 'active' | 'resolved';
  language: 'en' | 'hk';
  createdAt: string;
  agentId?: string;
  attachmentsAllowed: boolean;
  messages: Message[];
  transactions: Transaction[];
  selectedTopic?: string;
}

export interface Agent {
  id: string;
  name: string;
  initials: string;
  region: string;
  activeTime: string;
  description: string;
  status: 'online' | 'offline' | 'idle';
  avatar: string;
}
