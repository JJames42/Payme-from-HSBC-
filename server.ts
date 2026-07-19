import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Middleware for JSON body parsing with large limit for base64 attachments
app.use(express.json({ limit: '20mb' }));

// 20+ Realistic Hong Kong Support Agents Database
const HK_AGENTS = [
  { id: 'carmen-lee', name: 'Carmen Lee', initials: 'CL', region: 'Hong Kong HQ', activeTime: 'Active now', description: 'Customer Support Specialist', status: 'online', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face', department: 'Customer Operations', currentChatCount: 1 },
  { id: 'james-chan', name: 'James Chan', initials: 'JC', region: 'Central & Western', activeTime: 'Active now', description: 'Senior Merchant Specialist', status: 'online', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face', department: 'Merchant Services', currentChatCount: 2 },
  { id: 'ka-hing-wong', name: 'Ka Hing Wong', initials: 'KH', region: 'Mong Kok', activeTime: 'Active 2s ago', description: 'Dispute Resolution Expert', status: 'busy', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', department: 'Risk & Compliance', currentChatCount: 4 },
  { id: 'mei-ling-tse', name: 'Mei Ling Tse', initials: 'ML', region: 'Causeway Bay', activeTime: 'Active 5s ago', description: 'Business Merchant Lead', status: 'online', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face', department: 'Customer Operations', currentChatCount: 0 },
  { id: 'anson-lau', name: 'Anson Lau', initials: 'AL', region: 'Tsim Sha Tsui', activeTime: 'Idle', description: 'Security & Integrity Analyst', status: 'away', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face', department: 'Risk & Compliance', currentChatCount: 1 },
  { id: 'chun-hei-ng', name: 'Chun Hei Ng', initials: 'CH', region: 'Shatin', activeTime: 'Active now', description: 'High-Value Accounts Support', status: 'online', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&h=150&fit=crop&crop=face', department: 'VIP Relations', currentChatCount: 2 },
  { id: 'siu-ming-leung', name: 'Siu Ming Leung', initials: 'SM', region: 'Wan Chai', activeTime: 'Active 10s ago', description: 'Chargeback Disputes Specialist', status: 'busy', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face', department: 'Risk & Compliance', currentChatCount: 3 },
  { id: 'hoi-yan-cheung', name: 'Hoi Yan Cheung', initials: 'HY', region: 'Sheung Wan', activeTime: 'Active now', description: 'API Integration Specialist', status: 'online', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', department: 'Technical Support', currentChatCount: 1 },
  { id: 'tak-shun-ho', name: 'Tak Shun Ho', initials: 'TS', region: 'Kwun Tong', activeTime: 'Idle', description: 'Senior POS Terminal Support', status: 'idle', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=face', department: 'Technical Support', currentChatCount: 0 },
  { id: 'wai-man-lee', name: 'Wai Man Lee', initials: 'WM', region: 'North Point', activeTime: 'Active now', description: 'Merchant Compliance Officer', status: 'online', avatar: 'https://images.unsplash.com/photo-1489980508314-941910ded1f4?w=150&h=150&fit=crop&crop=face', department: 'Risk & Compliance', currentChatCount: 2 },
  { id: 'yee-ting-mok', name: 'Yee Ting Mok', initials: 'YT', region: 'Kowloon Bay', activeTime: 'Active now', description: 'Risk Mitigation Specialist', status: 'online', avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150&h=150&fit=crop&crop=face', department: 'Risk & Compliance', currentChatCount: 1 },
  { id: 'raymond-wong', name: 'Raymond Wong', initials: 'RW', region: 'Kennedy Town', activeTime: 'Active 4m ago', description: 'Refund Specialist', status: 'online', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face', department: 'Merchant Services', currentChatCount: 0 },
  { id: 'tracy-ip', name: 'Tracy Ip', initials: 'TI', region: 'Tai Koo', activeTime: 'Away 10m ago', description: 'Compliance Auditor', status: 'away', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face', department: 'Risk & Compliance', currentChatCount: 0 },
  { id: 'kelvin-tang', name: 'Kelvin Tang', initials: 'KT', region: 'Tsing Yi', activeTime: 'Busy', description: 'Merchant Success Manager', status: 'busy', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face', department: 'VIP Relations', currentChatCount: 3 },
  { id: 'chloe-leung', name: 'Chloe Leung', initials: 'CL', region: 'Sai Wan Ho', activeTime: 'Active now', description: 'Senior Technical Consultant', status: 'online', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face', department: 'Technical Support', currentChatCount: 1 },
  { id: 'justin-tsang', name: 'Justin Tsang', initials: 'JT', region: 'Fanling', activeTime: 'Offline', description: 'Fraud Analyst', status: 'offline', avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=150&h=150&fit=crop&crop=face', department: 'Risk & Compliance', currentChatCount: 0 },
  { id: 'michelle-ng', name: 'Michelle Ng', initials: 'MN', region: 'Tseung Kwan O', activeTime: 'Active now', description: 'Live Support Supervisor', status: 'busy', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face', department: 'Customer Operations', currentChatCount: 1 },
  { id: 'jonathan-lam', name: 'Jonathan Lam', initials: 'JL', region: 'Yuen Long', activeTime: 'Active now', description: 'Integration Engineer', status: 'online', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face', department: 'Technical Support', currentChatCount: 1 },
  { id: 'natalie-sin', name: 'Natalie Sin', initials: 'NS', region: 'Kowloon Tong', activeTime: 'Offline', description: 'Dispute Advisor', status: 'offline', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face', department: 'Merchant Services', currentChatCount: 0 },
  { id: 'alan-kwok', name: 'Alan Kwok', initials: 'AK', region: 'Ap Lei Chau', activeTime: 'Active 12m ago', description: 'Operations Specialist', status: 'online', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face', department: 'Customer Operations', currentChatCount: 1 },
  { id: 'grace-ho', name: 'Grace Ho', initials: 'GH', region: 'Tuen Mun', activeTime: 'Active now', description: 'Payment Gateway Engineer', status: 'online', avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&h=150&fit=crop&crop=face', department: 'Technical Support', currentChatCount: 1 }
];

interface Attachment {
  name: string;
  type: string;
  data: string; // Base64 data URL
  duration?: number;
}

interface Message {
  id: string;
  sender: 'customer' | 'agent' | 'system' | 'bot';
  text: string;
  timestamp: string;
  attachment?: Attachment;
  agentName?: string;
  status?: 'delivered' | 'seen' | 'failed';
  isPinned?: boolean;
}

interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: 'payment_received' | 'refund_sent' | 'disputed' | 'chargeback' | 'settlement';
  status: 'completed' | 'pending_dispute' | 'refunded' | 'held' | 'authorized';
  notes: string;
}

interface CaseInstruction {
  id: string;
  title: string;
  category: 'Identity Verification' | 'Refund Required' | 'Bank Review' | 'Document Required' | 'Additional Information';
  status: 'pending' | 'completed';
  description: string;
}

interface CasePaymentConfig {
  enabled: boolean;
  amount: number;
  currency: string;
  status: 'Awaiting Sender' | 'Awaiting Transfer' | 'Pending Confirmation' | 'Funds Pending' | 'Payment Pending' | 'Transfer Received' | 'Under Review' | 'Verification Complete';
  reference: string;
  deadline: string;
  notes: string;
}

interface CollectedInfo {
  name?: string;
  email?: string;
  transactionId?: string;
  referenceNumber?: string;
  description?: string;
  fileAttached?: boolean;
  voiceAttached?: boolean;
}

interface ChatSession {
  id: string;
  caseId: string;
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

// Default initial database in case persistent file is empty/non-existent
const DEFAULT_SESSIONS: ChatSession[] = [
  {
    id: 'chat-active-1',
    caseId: 'PM-HK-20260718-000012',
    userName: 'Retail Shopify Merchant',
    userEmail: 'merchant.retail@hknet.com',
    status: 'active',
    language: 'en',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    agentId: 'carmen-lee',
    attachmentsAllowed: true,
    voiceNotesAllowed: true,
    selectedTopic: 'Payment Issues',
    timelineProgress: 3, // On Hold
    collectedInfo: {
      name: 'Retail Shopify Merchant',
      email: 'merchant.retail@hknet.com',
      transactionId: 'TXN-8820491',
      referenceNumber: 'REF-2026-A91',
      description: 'The buyer reported the amount deducted but funds hold status still active.'
    },
    aiState: 'transferred',
    paymentConfig: {
      enabled: true,
      amount: 250.00,
      currency: 'HKD',
      status: 'Under Review',
      reference: 'PM-HK-20240517-0012',
      deadline: '2026-07-22 18:00',
      notes: 'Collateral deposit payment for secondary HKD gateway clearance verification.'
    },
    instructions: [
      { id: 'inst-1', title: 'Submit HK Business Registry Copy', category: 'Identity Verification', status: 'pending', description: 'Please upload a PDF or high-resolution screenshot of your current valid Business Registration Certificate.' }
    ],
    isLocked: false,
    uploadsMuted: false,
    agentTyping: false,
    customerTyping: false,
    internalNotes: 'Merchant reported payment hold on HK$500. Under validation checks. Needs BR uploaded.',
    transactions: [
      { id: 'PM-HK-20240517-0012', date: '2026-07-18 10:30', amount: 500.00, type: 'payment_received', status: 'held', notes: 'Payment on hold for verification' }
    ],
    messages: [
      { id: 'm1', sender: 'customer', text: 'Hi, I need help with a failed payment. The amount was deducted but the recipient didn\'t receive it.', timestamp: new Date(Date.now() - 10 * 60000).toISOString(), status: 'seen' },
      { id: 'm2', sender: 'agent', text: 'Hello! I\'m Carmen, how can I assist you today?', timestamp: new Date(Date.now() - 9 * 60000).toISOString(), agentName: 'Carmen Lee', status: 'seen' },
      { id: 'm3', sender: 'customer', text: 'The transaction ID is T123456789. It was for HK$500.', timestamp: new Date(Date.now() - 8 * 60000).toISOString(), status: 'seen' },
      { id: 'm4', sender: 'agent', text: 'Thank you for the details. Let me check this for you.', timestamp: new Date(Date.now() - 7 * 60000).toISOString(), agentName: 'Carmen Lee', status: 'seen' },
      { id: 'm5', sender: 'agent', text: 'I\'ve checked your transaction. It\'s currently on hold for verification. No worries, your money is safe with us.', timestamp: new Date(Date.now() - 5 * 60000).toISOString(), agentName: 'Carmen Lee', status: 'seen' },
      { id: 'm6', sender: 'customer', text: 'Please let me know if you can provide any additional information so I can help resolve this faster.', timestamp: new Date(Date.now() - 3 * 60000).toISOString(), status: 'seen' },
      { id: 'm7', sender: 'agent', text: 'Sure. To proceed, we may need a bit more information from you.', timestamp: new Date(Date.now() - 2 * 60000).toISOString(), agentName: 'Carmen Lee', status: 'seen' },
      { id: 'm8', sender: 'agent', text: 'Could you please confirm if you\'ve received any notification from your bank regarding this transaction?', timestamp: new Date(Date.now() - 1 * 60000).toISOString(), agentName: 'Carmen Lee', status: 'seen' }
    ]
  },
  {
    id: 'chat-pending-1',
    caseId: 'PM-HK-20260719-000024',
    userName: 'Chow Chun Sing',
    userEmail: 'chunsing.c@gmail.com',
    status: 'pending',
    language: 'en',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    attachmentsAllowed: true,
    voiceNotesAllowed: true,
    selectedTopic: 'Transaction Verification',
    timelineProgress: 1, // Received
    collectedInfo: {
      name: 'Chow Chun Sing',
      email: 'chunsing.c@gmail.com',
      transactionId: 'TXN-88192',
      referenceNumber: 'REF-SING-99',
      description: 'My transaction of HK$1,540 is showing as HELD. Can you please unlock it? We have completed the shipment and I can provide the tracking number.'
    },
    aiState: 'transferred',
    paymentConfig: {
      enabled: false,
      amount: 0,
      currency: 'HKD',
      status: 'Awaiting Sender',
      reference: '',
      deadline: '',
      notes: ''
    },
    instructions: [],
    isLocked: false,
    uploadsMuted: false,
    agentTyping: false,
    customerTyping: false,
    transactions: [
      { id: 'TXN-88192', date: '2026-07-16 19:40', amount: 1540.00, type: 'payment_received', status: 'held', notes: 'Flagged for risk evaluation. Awaiting business invoice.' }
    ],
    messages: [
      { id: 'p1', sender: 'system', text: 'AI assistant collects information', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
      { id: 'p2', sender: 'customer', text: 'Hello, my transaction of HK$1,540 is showing as HELD. Can you please unlock it? We have completed the shipment and I can provide the tracking number.', timestamp: new Date(Date.now() - 2 * 60000).toISOString() }
    ]
  }
];

let chatSessions: ChatSession[] = [];
const SESSIONS_FILE = path.join(process.cwd(), 'chat-sessions.json');

function saveSessionsToDisk() {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(chatSessions, null, 2), 'utf8');
  } catch (err) {
    console.error('[Persistence] Error saving chat sessions to disk:', err);
  }
}

function loadSessionsFromDisk() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const fileData = fs.readFileSync(SESSIONS_FILE, 'utf8');
      chatSessions = JSON.parse(fileData);
      console.log(`[Persistence] Loaded ${chatSessions.length} chat sessions from local disk storage.`);
    } else {
      console.log('[Persistence] No chat-sessions.json found. Initializing with pre-populated tickets.');
      chatSessions = JSON.parse(JSON.stringify(DEFAULT_SESSIONS));
      saveSessionsToDisk();
    }
  } catch (err) {
    console.error('[Persistence] Error loading chat sessions from disk, fallback to defaults:', err);
    chatSessions = JSON.parse(JSON.stringify(DEFAULT_SESSIONS));
  }
}

// Perform initial database load on startup
loadSessionsFromDisk();

// Middleware to intercept writing operations and persist current state to disk
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    if (req.method !== 'GET') {
      // Save sessions whenever a modifying request is sent
      saveSessionsToDisk();
    }
    return originalJson.call(this, body);
  };
  next();
});

// Helper function to generate unique case ID
function generateCaseId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randNum = Math.floor(100000 + Math.random() * 900000);
  return `PM-HK-${dateStr}-${randNum}`;
}

// ----------------------
// API Routes (REST)
// ----------------------

// 1. Get HK Agents
app.get('/api/agents', (req, res) => {
  res.json(HK_AGENTS);
});

// 2. Get All Chat Sessions (for Admin)
app.get('/api/chats', (req, res) => {
  res.json(chatSessions);
});

// 3. Create or Locate Chat Session (for Customer)
app.post('/api/chats/create', (req, res) => {
  const { id, language, userName, userEmail, selectedTopic } = req.body;
  
  // Check if session already exists
  let session = chatSessions.find(s => s.id === id);
  
  if (!session) {
    const newId = id || `chat-${Math.random().toString(36).substring(2, 11)}`;
    session = {
      id: newId,
      caseId: generateCaseId(),
      userName: userName || 'Anonymous Merchant',
      userEmail: userEmail || '',
      status: 'bot',
      language: language || 'en',
      createdAt: new Date().toISOString(),
      attachmentsAllowed: true,
      voiceNotesAllowed: true,
      selectedTopic: selectedTopic || '',
      aiState: 'welcome',
      timelineProgress: 1, // Received
      paymentConfig: {
        enabled: false,
        amount: 250.00,
        currency: 'HKD',
        status: 'Awaiting Transfer',
        reference: '',
        deadline: '',
        notes: ''
      },
      instructions: [],
      isLocked: false,
      uploadsMuted: false,
      agentTyping: false,
      customerTyping: false,
      transactions: [],
      collectedInfo: {},
      messages: [
        {
          id: `msg-bot-welcome-${Date.now()}`,
          sender: 'bot',
          text: 'Welcome to PayMe Business LLC Help Center. I am your AI Support Assistant. Before I transfer you to a specialist, let\'s gather a few brief details. May I have your full name?',
          timestamp: new Date().toISOString(),
          status: 'delivered'
        }
      ]
    };
    chatSessions.push(session);
  }
  
  res.json(session);
});

// 4. Send Message (both Customer and Agent)
app.post('/api/chats/:id/messages', (req, res) => {
  const { id } = req.params;
  const { sender, text, attachment, agentName } = req.body;
  
  const session = chatSessions.find(s => s.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  // Check if customer chatting is locked or uploads muted
  if (sender === 'customer' && session.isLocked) {
    return res.status(403).json({ error: 'You have been temporarily muted from typing. Please wait for an agent.' });
  }

  if (sender === 'customer' && attachment && session.uploadsMuted) {
    return res.status(400).json({ error: 'File uploads are currently disabled by the agent.' });
  }

  const newMessage: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    sender,
    text: text || '',
    timestamp: new Date().toISOString(),
    attachment,
    agentName,
    status: 'delivered'
  };

  session.messages.push(newMessage);

  // If status is 'bot' or collecting info
  if (session.status === 'bot' && sender === 'customer' && text) {
    const userInput = text.trim();
    if (!session.collectedInfo) session.collectedInfo = {};
    
    if (session.aiState === 'welcome' || !session.aiState) {
      session.collectedInfo.name = userInput;
      session.userName = userInput;
      session.aiState = 'collect_email';
      session.messages.push({
        id: `msg-bot-${Date.now()}`,
        sender: 'bot',
        text: `Thank you, ${userInput}. What is your registered business email address?`,
        timestamp: new Date().toISOString(),
        status: 'delivered'
      });
    } else if (session.aiState === 'collect_email') {
      session.collectedInfo.email = userInput;
      session.userEmail = userInput;
      session.aiState = 'collect_topic';
      session.messages.push({
        id: `msg-bot-${Date.now()}`,
        sender: 'bot',
        text: `Got it. What category does your issue fall under? (e.g. Account Issues, Payment Issues, Refund Issues, Technical Support, etc.)`,
        timestamp: new Date().toISOString(),
        status: 'delivered'
      });
    } else if (session.aiState === 'collect_topic') {
      session.collectedInfo.description = userInput; // use as topic / short description
      session.selectedTopic = userInput;
      session.aiState = 'collect_details';
      session.messages.push({
        id: `msg-bot-${Date.now()}`,
        sender: 'bot',
        text: `Please provide your Transaction ID or Reference Number, and a brief description of what happened.`,
        timestamp: new Date().toISOString(),
        status: 'delivered'
      });
    } else if (session.aiState === 'collect_details') {
      // Regex or generic parse for reference/transaction
      const matchTxn = userInput.match(/(TXN-\d+|T\d+|PM-HK-\d+-\d+)/i);
      session.collectedInfo.transactionId = matchTxn ? matchTxn[0].toUpperCase() : 'Not provided';
      session.collectedInfo.referenceNumber = `REF-AI-${Math.floor(100 + Math.random() * 900)}`;
      session.collectedInfo.description = userInput;
      session.aiState = 'collect_finished';

      // Create synthetic transaction for simulation if needed
      if (session.transactions.length === 0) {
        session.transactions.push({
          id: matchTxn ? matchTxn[0].toUpperCase() : `PM-HK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-0012`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          amount: 500.00,
          type: 'payment_received',
          status: 'held',
          notes: 'Flagged for security hold verification'
        });
      }

      session.messages.push({
        id: `msg-bot-f-${Date.now()}`,
        sender: 'bot',
        text: `Perfect. I have registered your ticket.

Case ID: ${session.caseId}
Merchant: ${session.collectedInfo.name}
Email: ${session.collectedInfo.email}
Transaction ID: ${session.collectedInfo.transactionId}

Your case is now being transferred to a Support Specialist. Please hold while we assign an agent to connect.`,
        timestamp: new Date().toISOString(),
        status: 'delivered'
      });

      // Transfer to Human agent queue automatically
      session.status = 'pending';
      session.aiState = 'transferred';
    }
  }

  res.json(session);
});

// 5. Update Chat Status/Topic
app.post('/api/chats/:id/topic', (req, res) => {
  const { id } = req.params;
  const { topic, status, userName, userEmail } = req.body;

  const session = chatSessions.find(s => s.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  if (topic) session.selectedTopic = topic;
  if (status) session.status = status;
  if (userName) session.userName = userName;
  if (userEmail) session.userEmail = userEmail;

  res.json(session);
});

// 6. Admin Accept Chat & Assign Agent
app.post('/api/chats/:id/accept', (req, res) => {
  const { id } = req.params;
  const { agentId } = req.body;

  const session = chatSessions.find(s => s.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  const agent = HK_AGENTS.find(a => a.id === agentId);
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  session.status = 'active';
  session.agentId = agentId;
  session.timelineProgress = 2; // Under Review
  
  // Add system connection message
  session.messages.push({
    id: `sys-${Date.now()}`,
    sender: 'system',
    text: session.language === 'hk'
      ? `${agent.name} 已連接。`
      : `${agent.name} (Support Specialist) is now connected.`,
    timestamp: new Date().toISOString()
  });

  // Prompt message from the agent
  session.messages.push({
    id: `agent-init-${Date.now()}`,
    sender: 'agent',
    text: session.language === 'hk'
      ? `你好，我是 ${agent.name}。我已接管您的案件 ${session.caseId}。我現在會為您審查此筆交易，請隨時提供任何補充。`
      : `Hello, this is ${agent.name}. I have accepted your Case ${session.caseId} and am currently reviewing your details. I'll assist you step-by-step to get this resolved.`,
    timestamp: new Date().toISOString(),
    agentName: agent.name
  });

  res.json(session);
});

// 7. Toggle Customer Upload Restrictions (Mute/Unmute/Disable)
app.post('/api/chats/:id/toggle-uploads', (req, res) => {
  const { id } = req.params;
  const { uploadsMuted, attachmentsAllowed, voiceNotesAllowed } = req.body;

  const session = chatSessions.find(s => s.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  if (uploadsMuted !== undefined) session.uploadsMuted = uploadsMuted;
  if (attachmentsAllowed !== undefined) session.attachmentsAllowed = attachmentsAllowed;
  if (voiceNotesAllowed !== undefined) session.voiceNotesAllowed = voiceNotesAllowed;

  res.json(session);
});

// 8. Lock or Unlock Chat (prevent typing)
app.post('/api/chats/:id/lock', (req, res) => {
  const { id } = req.params;
  const { isLocked } = req.body;

  const session = chatSessions.find(s => s.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  session.isLocked = isLocked;

  // Append notification
  session.messages.push({
    id: `sys-lock-${Date.now()}`,
    sender: 'system',
    text: isLocked 
      ? 'System: Customer typing privileges have been temporarily locked by the administrator.'
      : 'System: Customer typing privileges have been unlocked.',
    timestamp: new Date().toISOString()
  });

  res.json(session);
});

// 9. Update Timeline Progress
app.post('/api/chats/:id/timeline', (req, res) => {
  const { id } = req.params;
  const { progress } = req.body; // number 1 - 6

  const session = chatSessions.find(s => s.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  session.timelineProgress = progress;

  const steps = [
    'Received',
    'Under Review',
    'On Hold',
    'Refund Verification',
    'Pending Approval',
    'Completed'
  ];

  session.messages.push({
    id: `sys-timeline-${Date.now()}`,
    sender: 'system',
    text: `System: Case progress status updated to "${steps[progress - 1]}".`,
    timestamp: new Date().toISOString()
  });

  res.json(session);
});

// 10. Update Case Payment Config (Amount, currency, reference, enable/disable)
app.post('/api/chats/:id/payment', (req, res) => {
  const { id } = req.params;
  const { enabled, amount, currency, status, reference, deadline, notes } = req.body;

  const session = chatSessions.find(s => s.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  if (!session.paymentConfig) {
    session.paymentConfig = {
      enabled: false,
      amount: 0,
      currency: 'HKD',
      status: 'Awaiting Transfer',
      reference: '',
      deadline: '',
      notes: ''
    };
  }

  if (enabled !== undefined) session.paymentConfig.enabled = enabled;
  if (amount !== undefined) session.paymentConfig.amount = amount;
  if (currency !== undefined) session.paymentConfig.currency = currency;
  if (status !== undefined) session.paymentConfig.status = status;
  if (reference !== undefined) session.paymentConfig.reference = reference;
  if (deadline !== undefined) session.paymentConfig.deadline = deadline;
  if (notes !== undefined) session.paymentConfig.notes = notes;

  session.messages.push({
    id: `sys-pay-${Date.now()}`,
    sender: 'system',
    text: enabled 
      ? `System: Payment request of ${currency} ${amount} has been enabled (Status: ${status}).`
      : `System: Payment request details have been updated or disabled.`,
    timestamp: new Date().toISOString()
  });

  res.json(session);
});

// 11. Add Custom Instruction Card (for verification/documents)
app.post('/api/chats/:id/instructions', (req, res) => {
  const { id } = req.params;
  const { title, category, description } = req.body;

  const session = chatSessions.find(s => s.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  const newInstruction: CaseInstruction = {
    id: `inst-${Date.now()}`,
    title: title || 'Identity Verification Needed',
    category: category || 'Identity Verification',
    status: 'pending',
    description: description || 'Please complete verification.'
  };

  session.instructions.push(newInstruction);

  session.messages.push({
    id: `sys-inst-${Date.now()}`,
    sender: 'system',
    text: `System: New instruction card added: "${title}" (${category}).`,
    timestamp: new Date().toISOString()
  });

  res.json(session);
});

// 12. Complete Custom Instruction Card
app.post('/api/chats/:id/instructions/:instId/complete', (req, res) => {
  const { id, instId } = req.params;

  const session = chatSessions.find(s => s.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  const inst = session.instructions.find(i => i.id === instId);
  if (inst) {
    inst.status = 'completed';
    session.messages.push({
      id: `sys-inst-c-${Date.now()}`,
      sender: 'system',
      text: `System: Requirement "${inst.title}" completed.`,
      timestamp: new Date().toISOString()
    });
  }

  res.json(session);
});

// 13. Delete Custom Instruction Card
app.delete('/api/chats/:id/instructions/:instId', (req, res) => {
  const { id, instId } = req.params;

  const session = chatSessions.find(s => s.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  session.instructions = session.instructions.filter(i => i.id !== instId);
  res.json(session);
});

// 14. Update Internal or Private Notes
app.post('/api/chats/:id/notes', (req, res) => {
  const { id } = req.params;
  const { internalNotes, privateNotes } = req.body;

  const session = chatSessions.find(s => s.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  if (internalNotes !== undefined) session.internalNotes = internalNotes;
  if (privateNotes !== undefined) session.privateNotes = privateNotes;

  res.json(session);
});

// 15. Transfer Chat to Another Agent
app.post('/api/chats/:id/transfer', (req, res) => {
  const { id } = req.params;
  const { agentId } = req.body;

  const session = chatSessions.find(s => s.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  const oldAgentId = session.agentId;
  const newAgent = HK_AGENTS.find(a => a.id === agentId);
  if (!newAgent) {
    return res.status(404).json({ error: 'Agent not found' });
  }

  session.agentId = agentId;

  // Add system transfer message
  session.messages.push({
    id: `sys-transfer-${Date.now()}`,
    sender: 'system',
    text: `System: Conversation transferred from ${HK_AGENTS.find(a => a.id === oldAgentId)?.name || 'Previous Agent'} to ${newAgent.name} (${newAgent.department}).`,
    timestamp: new Date().toISOString()
  });

  res.json(session);
});

// 16. Update Live Typing Status
app.post('/api/chats/:id/typing', (req, res) => {
  const { id } = req.params;
  const { agentTyping, customerTyping } = req.body;

  const session = chatSessions.find(s => s.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  if (agentTyping !== undefined) session.agentTyping = agentTyping;
  if (customerTyping !== undefined) session.customerTyping = customerTyping;

  res.json(session);
});

// 17. Resolve/Close Chat (for Admin)
app.post('/api/chats/:id/resolve', (req, res) => {
  const { id } = req.params;

  const session = chatSessions.find(s => s.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  session.status = 'resolved';
  session.timelineProgress = 6; // Completed
  
  session.messages.push({
    id: `sys-resolve-${Date.now()}`,
    sender: 'system',
    text: session.language === 'hk'
      ? '此對話已結束。感謝您聯絡 PayMe Business LLC 支援。'
      : 'This conversation has been marked as resolved and closed. Thank you for choosing PayMe Business LLC support.',
    timestamp: new Date().toISOString()
  });

  res.json(session);
});

// 18. Admin Action on a Transaction (Refund, Approve/Decline, Release Hold)
app.post('/api/chats/:id/transaction', (req, res) => {
  const { id } = req.params;
  const { transactionId, action } = req.body;

  const session = chatSessions.find(s => s.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  const tx = session.transactions.find(t => t.id === transactionId);
  if (!tx) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const agent = HK_AGENTS.find(a => a.id === session.agentId) || { name: 'Support System' };

  if (action === 'refund') {
    tx.status = 'refunded';
    tx.notes += ` [Refunded on ${new Date().toISOString().substring(0, 10)} by ${agent.name}]`;
    session.timelineProgress = 4; // Refund Verification
    
    // Auto message about refund
    session.messages.push({
      id: `txn-action-${Date.now()}`,
      sender: 'agent',
      text: session.language === 'hk'
        ? `我已為交易 ${transactionId} 辦理全額退款。款項 HK$ ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} 將在數個工作天內退回到付款帳戶。`
        : `I have successfully processed a full refund for transaction ${transactionId}. The amount of HK$ ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} will be credited back to the payer's account within a few business days.`,
      timestamp: new Date().toISOString(),
      agentName: agent.name
    });
  } else if (action === 'release_hold') {
    tx.status = 'completed';
    tx.notes += ` [Risk hold released on ${new Date().toISOString().substring(0, 10)} by ${agent.name}]`;
    session.timelineProgress = 6; // Completed
    
    session.messages.push({
      id: `txn-action-${Date.now()}`,
      sender: 'agent',
      text: session.language === 'hk'
        ? `好消息！我們的風險審查團隊已核實您的憑證，交易 ${transactionId} (HK$ ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}) 的扣留現已解除。資金已成功撥入您的商戶餘額。`
        : `Great news! Our risk verification team has verified your invoices, and the security hold on transaction ${transactionId} (HK$ ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}) has been released. The funds are now available in your merchant balance.`,
      timestamp: new Date().toISOString(),
      agentName: agent.name
    });
  } else if (action === 'verify_dispute') {
    tx.status = 'completed';
    tx.notes += ` [Dispute resolved & approved on ${new Date().toISOString().substring(0, 10)} by ${agent.name}]`;
    session.timelineProgress = 6; // Completed
    
    session.messages.push({
      id: `txn-action-${Date.now()}`,
      sender: 'agent',
      text: session.language === 'hk'
        ? `我們已手動入賬交易 ${transactionId}。HK$ ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} 已經確認到賬，您的商戶餘額已即時更新。非常抱歉造成您的不便！`
        : `We have manually reconciled and cleared transaction ${transactionId}. The HK$ ${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} has been confirmed, and your merchant balance is updated immediately. We sincerely apologize for the delay!`,
      timestamp: new Date().toISOString(),
      agentName: agent.name
    });
  }

  res.json(session);
});

// ----------------------
// Vite Middleware Configuration
// ----------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Mount Vite development server middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[PayMe Business Full-Stack Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
