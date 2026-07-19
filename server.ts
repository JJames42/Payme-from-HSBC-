import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Middleware for JSON body parsing with large limit for base64 attachments
app.use(express.json({ limit: '20mb' }));

// Agent Database
const HK_AGENTS = [
  { id: '1', name: 'James Chan', initials: 'JC', region: 'Central & Western', activeTime: 'Active now', description: 'Senior Merchant Specialist', status: 'online', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
  { id: '2', name: 'Ka Hing Wong', initials: 'KH', region: 'Mong Kok', activeTime: 'Active 2s ago', description: 'Dispute Resolution Expert', status: 'online', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face' },
  { id: '3', name: 'Mei Ling Tse', initials: 'ML', region: 'Causeway Bay', activeTime: 'Active 5s ago', description: 'Business Merchant Lead', status: 'online', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face' },
  { id: '4', name: 'Anson Lau', initials: 'AL', region: 'Tsim Sha Tsui', activeTime: 'Idle', description: 'Security & Integrity Analyst', status: 'online', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face' },
  { id: '5', name: 'Chun Hei Ng', initials: 'CH', region: 'Shatin', activeTime: 'Active now', description: 'High-Value Accounts Support', status: 'online', avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&h=150&fit=crop&crop=face' },
  { id: '6', name: 'Siu Ming Leung', initials: 'SM', region: 'Wan Chai', activeTime: 'Active 10s ago', description: 'Chargeback Disputes Specialist', status: 'online', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&crop=face' },
  { id: '7', name: 'Hoi Yan Cheung', initials: 'HY', region: 'Sheung Wan', activeTime: 'Active now', description: 'API Integration Specialist', status: 'online', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face' },
  { id: '8', name: 'Tak Shun Ho', initials: 'TS', region: 'Kwun Tong', activeTime: 'Idle', description: 'Senior POS Terminal Support', status: 'online', avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&h=150&fit=crop&crop=face' },
  { id: '9', name: 'Wai Man Lee', initials: 'WM', region: 'North Point', activeTime: 'Active now', description: 'Merchant Compliance Officer', status: 'online', avatar: 'https://images.unsplash.com/photo-1489980508314-941910ded1f4?w=150&h=150&fit=crop&crop=face' },
  { id: '10', name: 'Yee Ting Mok', initials: 'YT', region: 'Kowloon Bay', activeTime: 'Active now', description: 'Risk Mitigation Specialist', status: 'online', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face' },
];

interface Attachment {
  name: string;
  type: string;
  data: string; // Base64 data URL
}

interface Message {
  id: string;
  sender: 'customer' | 'agent' | 'system' | 'bot';
  text: string;
  timestamp: string;
  attachment?: Attachment;
  agentName?: string;
}

interface Transaction {
  id: string;
  date: string;
  amount: number; // HKD
  type: 'payment_received' | 'refund_sent' | 'disputed' | 'chargeback' | 'settlement';
  status: 'completed' | 'pending_dispute' | 'refunded' | 'held' | 'authorized';
  notes: string;
}

interface ChatSession {
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

// In-Memory Database
let chatSessions: ChatSession[] = [
  // Pre-populated active chat
  {
    id: 'chat-active-1',
    userName: 'Wong S.M. (Shopify Merchant)',
    userEmail: 'smwong.retail@hknet.com',
    status: 'active',
    language: 'hk',
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    agentId: '3', // Mei Ling Tse
    attachmentsAllowed: true,
    selectedTopic: '💸 Transaction Disputes & Issues',
    transactions: [
      { id: 'TXN-99812', date: '2026-07-16 18:24', amount: 8200.00, type: 'payment_received', status: 'pending_dispute', notes: 'Customer claims payment succeeded but merchant dashboard showed failed.' },
      { id: 'TXN-99102', date: '2026-07-15 11:15', amount: 3450.00, type: 'payment_received', status: 'completed', notes: 'Standard POS transaction settlement' }
    ],
    messages: [
      { id: 'm1', sender: 'bot', text: '歡迎使用 PayMe Business LLC 支援服務。請選擇您的語言。 Welcome to PayMe Business LLC support.', timestamp: new Date(Date.now() - 30 * 60000).toISOString() },
      { id: 'm2', sender: 'customer', text: '繁體中文', timestamp: new Date(Date.now() - 29 * 60000).toISOString() },
      { id: 'm3', sender: 'bot', text: '請選擇您遇到的問題類別，以便我們為您分配最合適的服務專員。', timestamp: new Date(Date.now() - 29 * 60000).toISOString() },
      { id: 'm4', sender: 'customer', text: '💸 交易爭議及問題', timestamp: new Date(Date.now() - 28 * 60000).toISOString() },
      { id: 'm5', sender: 'bot', text: '正在為您接通香港 PayMe Business 支援專員。請稍候...', timestamp: new Date(Date.now() - 28 * 60000).toISOString() },
      { id: 'm6', sender: 'system', text: 'Mei Ling Tse 已連接。', timestamp: new Date(Date.now() - 27 * 60000).toISOString(), agentName: 'Mei Ling Tse' },
      { id: 'm7', sender: 'agent', text: '你好，我是 Mei Ling。看到您有關於交易 TXN-99812 的問題，請問有什麼我可以協助您的？', timestamp: new Date(Date.now() - 26 * 60000).toISOString(), agentName: 'Mei Ling Tse' },
      { id: 'm8', sender: 'customer', text: '你好！我的顧客在下午 18:24 支付了 HK$8,200.00，他的 App 已經顯示扣款成功，但是我的商戶後台仍然顯示「等待付款」。我上傳了他的付款截圖，請幫忙看看。', timestamp: new Date(Date.now() - 25 * 60000).toISOString() },
    ]
  },
  // Pre-populated pending chat
  {
    id: 'chat-pending-1',
    userName: 'Chow Chun Sing',
    userEmail: 'chunsing.c@gmail.com',
    status: 'pending',
    language: 'en',
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
    attachmentsAllowed: true,
    selectedTopic: '💬 Talk to a Human (Agent)',
    transactions: [
      { id: 'TXN-88192', date: '2026-07-16 19:40', amount: 1540.00, type: 'payment_received', status: 'held', notes: 'Flagged for risk evaluation. Awaiting business invoice.' }
    ],
    messages: [
      { id: 'p1', sender: 'bot', text: '歡迎使用 PayMe Business LLC 支援服務。請選擇您的語言。 Welcome to PayMe Business LLC support.', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
      { id: 'p2', sender: 'customer', text: 'English', timestamp: new Date(Date.now() - 4 * 60000).toISOString() },
      { id: 'p3', sender: 'bot', text: 'Please select an option below so we can guide you to the correct department.', timestamp: new Date(Date.now() - 4 * 60000).toISOString() },
      { id: 'p4', sender: 'customer', text: '💬 Talk to a Human (Agent)', timestamp: new Date(Date.now() - 3 * 60000).toISOString() },
      { id: 'p5', sender: 'bot', text: 'Understood. Connecting you with our Hong Kong Customer Operations team. Please stay online...', timestamp: new Date(Date.now() - 3 * 60000).toISOString() },
      { id: 'p6', sender: 'customer', text: 'Hello, my transaction of HK$1,540 is showing as HELD. Can you please unlock it? We have completed the shipment and I can provide the tracking number.', timestamp: new Date(Date.now() - 2 * 60000).toISOString() }
    ]
  }
];

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
      userName: userName || 'Anonymous Customer',
      userEmail: userEmail || '',
      status: 'bot',
      language: language || 'en',
      createdAt: new Date().toISOString(),
      attachmentsAllowed: true,
      selectedTopic: selectedTopic || '',
      transactions: [
        {
          id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          amount: parseFloat((Math.random() * 5000 + 100).toFixed(2)),
          type: 'payment_received',
          status: 'authorized',
          notes: 'Automatic diagnostic record created'
        }
      ],
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: language === 'hk' 
            ? '歡迎使用 PayMe Business LLC 支援服務。請選擇您的語言。 Welcome to PayMe Business LLC support.'
            : '歡迎使用 PayMe Business LLC 支援服務。請選擇您的語言。 Welcome to PayMe Business LLC support.',
          timestamp: new Date().toISOString()
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

  // If customer is sending, check if attachments are blocked when attachment is present
  if (sender === 'customer' && attachment && !session.attachmentsAllowed) {
    return res.status(400).json({ error: 'Attachments are currently disabled by the agent' });
  }

  const newMessage: Message = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    sender,
    text: text || '',
    timestamp: new Date().toISOString(),
    attachment,
    agentName
  };

  session.messages.push(newMessage);

  // If status is still 'bot' and user types, let's keep it ticking unless they chose 'human'
  if (session.status === 'bot' && text) {
    // If they say english/hk explicitly
    if (text === 'English' || text === '繁體中文') {
      session.language = text === 'English' ? 'en' : 'hk';
    }
  }

  // Update session topic or trigger routing if custom input
  res.json(session);
});

// 5. Update Chat Status/Topic (e.g., transition from bot selection to 'pending' human queue)
app.post('/api/chats/:id/topic', (req, res) => {
  const { id } = req.params;
  const { topic, status } = req.body;

  const session = chatSessions.find(s => s.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  if (topic) session.selectedTopic = topic;
  if (status) session.status = status;

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
  
  // Add system connection message
  session.messages.push({
    id: `sys-${Date.now()}`,
    sender: 'system',
    text: session.language === 'hk'
      ? `${agent.name} 已連接。`
      : `${agent.name} is now connected.`,
    timestamp: new Date().toISOString(),
    agentName: agent.name
  });

  // Prompt message from the agent
  session.messages.push({
    id: `agent-init-${Date.now()}`,
    sender: 'agent',
    text: session.language === 'hk'
      ? `你好，我是 ${agent.name} (${agent.description})。請問今天有甚麼交易或賬戶問題可以幫到您？`
      : `Hello, this is ${agent.name} (${agent.description}). How can I help you with your transactions or account today?`,
    timestamp: new Date().toISOString(),
    agentName: agent.name
  });

  res.json(session);
});

// 7. Toggle Customer Attachment Permissions (for Admin)
app.post('/api/chats/:id/toggle-attachments', (req, res) => {
  const { id } = req.params;
  const { allowed } = req.body;

  const session = chatSessions.find(s => s.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  session.attachmentsAllowed = allowed;
  
  // Add a system notice about attachment settings
  session.messages.push({
    id: `sys-attachment-${Date.now()}`,
    sender: 'system',
    text: session.language === 'hk'
      ? `系統提示：專員已${allowed ? '啟用' : '停用'}檔案傳送功能。`
      : `System: Agent has ${allowed ? 'enabled' : 'disabled'} attachment sharing.`,
    timestamp: new Date().toISOString()
  });

  res.json(session);
});

// 8. Resolve/Close Chat (for Admin)
app.post('/api/chats/:id/resolve', (req, res) => {
  const { id } = req.params;

  const session = chatSessions.find(s => s.id === id);
  if (!session) {
    return res.status(404).json({ error: 'Chat session not found' });
  }

  session.status = 'resolved';
  
  session.messages.push({
    id: `sys-resolve-${Date.now()}`,
    sender: 'system',
    text: session.language === 'hk'
      ? '此對話已結束。感謝您聯絡 PayMe Business LLC 支援。'
      : 'This conversation has been marked as resolved. Thank you for choosing PayMe Business LLC support.',
    timestamp: new Date().toISOString()
  });

  res.json(session);
});

// 9. Admin Action on a Transaction (Refund, Approve/Decline, Release Hold)
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
