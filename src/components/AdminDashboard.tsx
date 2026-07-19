import { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, Shield, Users, MessageSquare, AlertCircle, RefreshCw, 
  CheckCircle2, Lock, Unlock, FileText, Ban, Trash2, ArrowUpRight, Search,
  TrendingUp, Settings, File, Phone, User, Mail, DollarSign, Clock, Send,
  Play, Pause, Download, Volume2, Plus, Sparkles, Filter, CheckCircle
} from 'lucide-react';
import { ChatSession, Agent, Transaction, Message, CaseInstruction } from '../types.ts';

interface AdminDashboardProps {
  onBackToHome: () => void;
}

export default function AdminDashboard({ onBackToHome }: AdminDashboardProps) {
  // Login State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [employeeId, setEmployeeId] = useState('HSBC-ADMIN-2026');
  const [securityPin, setSecurityPin] = useState('HSBC-2026');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard Data State
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('carmen-lee'); 
  const [agentReply, setAgentReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'active' | 'resolved'>('all');

  // Interactive builders State
  const [isAddingInstruction, setIsAddingInstruction] = useState(false);
  const [instTitle, setInstTitle] = useState('');
  const [instCategory, setInstCategory] = useState<'Identity Verification' | 'Refund Required' | 'Bank Review' | 'Document Required' | 'Additional Information'>('Identity Verification');
  const [instDesc, setInstDesc] = useState('');

  // Payment Builder State
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [payEnabled, setPayEnabled] = useState(false);
  const [payAmount, setPayAmount] = useState(0);
  const [payCurrency, setPayCurrency] = useState('HKD');
  const [payStatus, setPayStatus] = useState<'Awaiting Sender' | 'Awaiting Transfer' | 'Pending Confirmation' | 'Funds Pending' | 'Payment Pending' | 'Transfer Received' | 'Under Review' | 'Verification Complete'>('Awaiting Transfer');
  const [payRef, setPayRef] = useState('');
  const [payDeadline, setPayDeadline] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Internal & Private notes
  const [internalNotesText, setInternalNotesText] = useState('');
  
  // Quick reply templates
  const [selectedTemplate, setSelectedTemplate] = useState('');

  // Transfer Chat state
  const [transferTargetAgent, setTransferTargetAgent] = useState('');

  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Audio Playback States for Messages
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioCurrentTimes, setAudioCurrentTimes] = useState<Record<string, number>>({});
  const [audioDurations, setAudioDurations] = useState<Record<string, number>>({});
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (employeeId === 'HSBC-ADMIN-2026' && securityPin === 'HSBC-2026') {
      setIsAuthenticated(true);
      setLoginError(null);
    } else {
      setLoginError('Invalid Employee Security Credentials. Access Denied.');
    }
  };

  // Fetch chats and agents
  const fetchDashboardData = async () => {
    try {
      const chatsRes = await fetch('/api/chats');
      const agentsRes = await fetch('/api/agents');
      if (chatsRes.ok && agentsRes.ok) {
        const chatsData: ChatSession[] = await chatsRes.json();
        const agentsData: Agent[] = await agentsRes.json();
        setChats(chatsData);
        setAgents(agentsData);
        
        // Auto-select first chat if none is selected
        if (!selectedChatId && chatsData.length > 0) {
          setSelectedChatId(chatsData[0].id);
        }
        setErrorText(null);
      } else {
        throw new Error('Failed to load dashboard statistics.');
      }
    } catch (err) {
      console.error(err);
      setErrorText('Re-routing secure gateway sync...');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 3000);
    return () => clearInterval(interval);
  }, [selectedChatId, isAuthenticated]);

  // Load selected chat specific settings on load
  const selectedChat = chats.find(c => c.id === selectedChatId) || null;
  const activeAgent = agents.find(a => a.id === selectedAgentId) || agents[0] || null;

  useEffect(() => {
    if (selectedChat) {
      setPayEnabled(selectedChat.paymentConfig?.enabled || false);
      setPayAmount(selectedChat.paymentConfig?.amount || 0);
      setPayCurrency(selectedChat.paymentConfig?.currency || 'HKD');
      setPayStatus(selectedChat.paymentConfig?.status || 'Awaiting Transfer');
      setPayRef(selectedChat.paymentConfig?.reference || selectedChat.caseId);
      setPayDeadline(selectedChat.paymentConfig?.deadline || '');
      setPayNotes(selectedChat.paymentConfig?.notes || '');
      setInternalNotesText(selectedChat.internalNotes || '');
    }
  }, [selectedChat?.id]);

  // Scroll active chat panel to bottom
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChatId, chats, selectedChat?.agentTyping, selectedChat?.customerTyping]);

  // Accept a pending chat session and assign an agent
  const handleAcceptChat = async (chatId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/chats/${chatId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgentId })
      });
      if (!res.ok) throw new Error('Failed to assign agent');
      await fetchDashboardData();
    } catch (err) {
      alert('Failed to assign agent. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle lock status (prevent customer typing)
  const handleToggleLock = async () => {
    if (!selectedChat) return;
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isLocked: !selectedChat.isLocked })
      });
      if (res.ok) await fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle uploads & attachments allowed status
  const handleToggleUploads = async () => {
    if (!selectedChat) return;
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/toggle-uploads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          uploadsMuted: !selectedChat.uploadsMuted,
          attachmentsAllowed: selectedChat.uploadsMuted ? true : false,
          voiceNotesAllowed: selectedChat.uploadsMuted ? true : false
        })
      });
      if (res.ok) await fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Update Timeline Progress step
  const handleUpdateTimeline = async (step: number) => {
    if (!selectedChat) return;
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/timeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: step })
      });
      if (res.ok) await fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Add Custom document request instruction card
  const handleAddInstruction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChat || !instTitle.trim()) return;

    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/instructions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: instTitle,
          category: instCategory,
          description: instDesc
        })
      });
      if (res.ok) {
        setIsAddingInstruction(false);
        setInstTitle('');
        setInstDesc('');
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete document instruction card
  const handleDeleteInstruction = async (instId: string) => {
    if (!selectedChat) return;
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/instructions/${instId}`, {
        method: 'DELETE'
      });
      if (res.ok) await fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Submit collapsible custom payment parameters
  const handleSavePaymentConfig = async () => {
    if (!selectedChat) return;
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: payEnabled,
          amount: payAmount,
          currency: payCurrency,
          status: payStatus,
          reference: payRef,
          deadline: payDeadline,
          notes: payNotes
        })
      });
      if (res.ok) {
        setIsEditingPayment(false);
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Transfer Chat assignment to another agent
  const handleTransferAssignment = async () => {
    if (!selectedChat || !transferTargetAgent) return;
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: transferTargetAgent })
      });
      if (res.ok) {
        setTransferTargetAgent('');
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save internal notes
  const handleSaveInternalNotes = async () => {
    if (!selectedChat) return;
    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalNotes: internalNotesText })
      });
      if (res.ok) {
        alert('Internal Notes Saved.');
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Resolve and Archive chat
  const handleResolveChat = async (chatId: string) => {
    if (!window.confirm('Are you sure you want to mark this merchant case as RESOLVED and end active communications?')) {
      return;
    }
    try {
      const res = await fetch(`/api/chats/${chatId}/resolve`, { method: 'POST' });
      if (res.ok) await fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Send Admin/Agent message text
  const handleSendAgentMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!agentReply.trim() || !selectedChat || !activeAgent) return;

    const messageText = agentReply;
    setAgentReply('');

    try {
      const res = await fetch(`/api/chats/${selectedChat.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'agent',
          text: messageText,
          agentName: activeAgent.name
        })
      });
      if (res.ok) await fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Set agent typing simulator
  const handleTypingToggle = async (isTyping: boolean) => {
    if (!selectedChat) return;
    try {
      await fetch(`/api/chats/${selectedChat.id}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentTyping: isTyping })
      });
    } catch (e) {
      // non blocking
    }
  };

  // Template Quick Replies selector
  const handleTemplateSelect = (val: string) => {
    setSelectedTemplate(val);
    if (val === 'identity') {
      setAgentReply('To process your release, we require a clear copy of your identity proof. Please use the document upload feature below.');
    } else if (val === 'hold') {
      setAgentReply('This transaction of HK$500 is currently on hold for routine security audits. It has been routed to our clearance department.');
    } else if (val === 'resolved') {
      setAgentReply('Good news! The security hold on your funds has been successfully released. The funds will settle in your merchant balance within 2 hours.');
    } else if (val === 'bank') {
      setAgentReply('Our risks compliance team requested a business invoice or bank transaction record for secondary validation. Please upload it.');
    }
  };

  // Audit transaction releasing
  const handleTransactionAction = async (transactionId: string, action: 'refund' | 'release_hold' | 'verify_dispute') => {
    if (!selectedChat) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/chats/${selectedChat.id}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId, action })
      });
      if (!res.ok) throw new Error('Transaction action failed');
      await fetchDashboardData();
    } catch (err) {
      alert('Action failed. Check server logs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Audio Playback Helpers for recorded notes
  const handleAudioPlayPause = (msgId: string, audioUrl: string) => {
    let audio = audioElementsRef.current[msgId];
    
    if (!audio) {
      audio = new Audio(audioUrl);
      audioElementsRef.current[msgId] = audio;

      audio.addEventListener('timeupdate', () => {
        setAudioCurrentTimes(prev => ({ ...prev, [msgId]: audio.currentTime }));
      });
      audio.addEventListener('loadedmetadata', () => {
        setAudioDurations(prev => ({ ...prev, [msgId]: audio.duration }));
      });
      audio.addEventListener('ended', () => {
        setPlayingAudioId(null);
        setAudioCurrentTimes(prev => ({ ...prev, [msgId]: 0 }));
      });
    }

    if (playingAudioId === msgId) {
      audio.pause();
      setPlayingAudioId(null);
    } else {
      if (playingAudioId && audioElementsRef.current[playingAudioId]) {
        audioElementsRef.current[playingAudioId].pause();
      }
      audio.play();
      setPlayingAudioId(msgId);
    }
  };

  // Search and filter logic
  const filteredChats = chats.filter(c => {
    const matchesSearch = 
      c.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.userEmail && c.userEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.collectedInfo?.transactionId && c.collectedInfo.transactionId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.collectedInfo?.referenceNumber && c.collectedInfo.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'pending' && c.status === 'pending') ||
      (activeTab === 'active' && c.status === 'active') ||
      (activeTab === 'resolved' && c.status === 'resolved');

    return matchesSearch && matchesTab;
  });

  // Render Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans text-slate-100 antialiased">
        <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-radial-gradient from-rose-950/40 via-transparent to-transparent opacity-50" />
        
        <div className="relative z-10 w-full max-w-md bg-slate-900 border border-slate-800/80 p-8 rounded-2xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 bg-rose-950/40 text-rose-400 border border-rose-900/40 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5" /> HSBC Operations Console
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight pt-1">Operations Authorization</h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Authorized personnel only. Sessions are logged under the Hong Kong SVF-B002 banking protocol.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Employee Identification
              </label>
              <input 
                type="text" 
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-4 text-xs font-semibold focus:outline-none focus:border-rose-500 transition-colors"
                placeholder="e.g. HSBC-ADMIN-2026"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                Pin Code / Security Token
              </label>
              <input 
                type="password" 
                value={securityPin}
                onChange={(e) => setSecurityPin(e.target.value)}
                className="w-full h-11 bg-slate-950 border border-slate-800 rounded-xl px-4 text-xs font-semibold focus:outline-none focus:border-rose-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-400 font-medium text-center animate-pulse">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-lg shadow-rose-950/30"
            >
              Verify Credentials & Unlock
            </button>
          </form>

          <div className="border-t border-slate-800/60 pt-4.5 text-center text-[10px] text-slate-500 space-y-1">
            <p>© 2026 The Hongkong and Shanghai Banking Corporation Limited.</p>
            <p>Direct Connection Path: /admin/london-stie/2026</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased overflow-hidden">
      
      {/* HEADER BAR */}
      <header className="bg-slate-900 border-b border-slate-800/80 px-6 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-4 z-10 shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-[11px] bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold px-3.5 py-1.5 rounded-full cursor-pointer transition-all border border-slate-700/50"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-rose-500 stroke-[2.5]" />
            Exit Console
          </button>
          <div className="h-5 w-px bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-2.5">
            <Shield className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
            <h1 className="text-xs font-black tracking-widest text-rose-500 uppercase">PayMe Operations Control</h1>
            <span className="text-[9px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded border border-slate-700">
              london-stie-2026
            </span>
          </div>
        </div>

        {/* Live status indicators */}
        <div className="flex items-center gap-4">
          {errorText && (
            <span className="text-xs text-rose-400 font-bold animate-pulse">{errorText}</span>
          )}
          <div className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SECURE STAGING SYNC</span>
          </div>
        </div>
      </header>

      {/* WORKSPACE FRAME */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* SIDEBAR 1: Tickets Queue & Search */}
        <aside className="w-full lg:w-80 bg-slate-900 border-r border-slate-800/60 flex flex-col shrink-0 overflow-y-auto">
          
          {/* Active Agent Selector */}
          <div className="p-4 border-b border-slate-800/60 bg-slate-900/30">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Assigned Supervisor
            </label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full h-10 bg-slate-850 text-slate-200 border border-slate-800 rounded-xl px-3 text-xs font-semibold focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  👤 {ag.name} ({ag.department})
                </option>
              ))}
            </select>
          </div>

          {/* Search Field */}
          <div className="p-4 border-b border-slate-800/40 bg-slate-900/10">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search case, name, TXN, REF..."
                className="w-full h-9 bg-slate-950 rounded-lg pl-9 pr-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-rose-500 border border-slate-800/80"
              />
            </div>
          </div>

          {/* Inbox Filter Tabs */}
          <div className="px-4 py-2 border-b border-slate-800/40 bg-slate-950/20 flex gap-1 justify-between">
            {(['all', 'pending', 'active', 'resolved'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md transition-colors cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-rose-950/50 text-rose-400 border border-rose-900/30' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Channel list loop */}
          <div className="flex-1 divide-y divide-slate-850/60">
            {filteredChats.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-600">No channels match current query.</div>
            ) : (
              filteredChats.map((c) => {
                const isSelected = c.id === selectedChatId;
                const isPending = c.status === 'pending';
                const isResolved = c.status === 'resolved';
                const isBot = c.status === 'bot';
                const assignedAgent = agents.find(ag => ag.id === c.agentId);

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedChatId(c.id)}
                    className={`p-4 text-left cursor-pointer transition-all relative ${
                      isSelected ? 'bg-slate-850 border-l-4 border-rose-600' : 'hover:bg-slate-850/40'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <h3 className="text-xs font-bold text-slate-200 truncate max-w-[140px]">
                        {c.userName}
                      </h3>
                      <span className={`text-[8.5px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                        isPending 
                          ? 'bg-amber-950/40 border-amber-900/40 text-amber-400 animate-pulse' 
                          : isResolved
                          ? 'bg-slate-800/60 border-slate-700/60 text-slate-500'
                          : isBot
                          ? 'bg-blue-950/40 border-blue-900/40 text-blue-400'
                          : 'bg-emerald-950/40 border-emerald-900/40 text-emerald-400'
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    <p className="text-[10.5px] text-slate-400 truncate max-w-[200px] mb-2 font-medium">
                      {c.selectedTopic || 'Welcome Lobby Intake'}
                    </p>

                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                      <span>
                        {c.messages.length} messages · ID: {c.caseId.split('-').slice(-2).join('-')}
                      </span>
                      <span className="truncate max-w-[100px]">
                        {assignedAgent ? `👤 ${assignedAgent.name.split(' ')[0]}` : 'Unassigned'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* MIDDLE COLUMN: Selected Conversation Log */}
        <main className="flex-1 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">
          {selectedChat ? (
            <>
              {/* Active Ticket Header Info */}
              <div className="px-6 py-3.5 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shrink-0">
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-200 truncate">{selectedChat.userName}</h2>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5 truncate">
                    <span className="font-mono text-[10.5px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-400 border border-slate-800">
                      Case: {selectedChat.caseId}
                    </span>
                    <span className="text-slate-600">·</span>
                    <span className="truncate">{selectedChat.userEmail || 'No verified email'}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedChat.status === 'pending' && (
                    <button
                      onClick={() => handleAcceptChat(selectedChat.id)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-900/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Accept Case & Connect
                    </button>
                  )}

                  {selectedChat.status === 'active' && (
                    <button
                      onClick={() => handleResolveChat(selectedChat.id)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-emerald-950/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Resolve & Archive Case
                    </button>
                  )}
                </div>
              </div>

              {/* Chat timeline message viewport */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/25">
                
                {/* Collected Info Intakes Header Card */}
                {selectedChat.collectedInfo && (
                  <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-4 space-y-3 max-w-2xl mx-auto">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-950/30 px-2 py-0.5 rounded uppercase tracking-wider">
                        AI Intake Collection Record
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">Secure Audit Verified</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs leading-relaxed text-slate-300">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Registered Merchant</span>
                        <span className="font-semibold text-white">{selectedChat.collectedInfo.name || selectedChat.userName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Business Email</span>
                        <span className="font-semibold text-white">{selectedChat.collectedInfo.email || selectedChat.userEmail}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Transaction ID</span>
                        <span className="font-mono text-white text-[11px]">{selectedChat.collectedInfo.transactionId || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase">Reference Number</span>
                        <span className="font-mono text-white text-[11px]">{selectedChat.collectedInfo.referenceNumber || 'Not specified'}</span>
                      </div>
                    </div>

                    {selectedChat.collectedInfo.description && (
                      <div className="pt-2 border-t border-slate-800/60">
                        <span className="text-slate-500 block text-[10px] uppercase mb-0.5">Initial Problem Description</span>
                        <p className="text-xs text-slate-400 font-medium italic">"{selectedChat.collectedInfo.description}"</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Message list items */}
                {selectedChat.messages.map((msg) => {
                  const isAgent = msg.sender === 'agent';
                  const isBot = msg.sender === 'bot';
                  const isSystem = msg.sender === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center items-center py-2">
                        <div className="bg-slate-900 border border-slate-800 text-slate-500 text-[10px] font-mono px-4 py-1 rounded-full uppercase tracking-wider">
                          {msg.text}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex gap-3 items-start max-w-xl ${isAgent ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      {/* Avatar initial bubble */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 border ${
                        isAgent 
                          ? 'bg-rose-600 text-white border-rose-500' 
                          : isBot 
                          ? 'bg-slate-900 text-slate-400 border-slate-800' 
                          : 'bg-slate-800 text-slate-200 border-slate-750'
                      }`}>
                        {isAgent ? 'A' : isBot ? 'AI' : 'C'}
                      </div>

                      <div className={`flex flex-col space-y-1 ${isAgent ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-slate-500 font-bold px-1 uppercase tracking-wider font-mono">
                          {isAgent 
                            ? msg.agentName || 'Agent Operations' 
                            : isBot 
                            ? 'Lobby Onboarding Bot' 
                            : 'Client Merchant'}
                        </span>

                        <div className={`rounded-2xl p-3.5 text-xs leading-relaxed border ${
                          isAgent 
                            ? 'bg-rose-600 text-white border-rose-500 rounded-tr-none shadow-sm' 
                            : 'bg-slate-850 text-slate-200 border-slate-800 rounded-tl-none'
                        }`}>
                          <p className="whitespace-pre-line">{msg.text}</p>

                          {/* Voice attachment playback element */}
                          {msg.attachment && msg.attachment.type.startsWith('audio/') && (
                            <div className="mt-3 bg-slate-900 rounded-xl p-2.5 border border-slate-800 flex items-center gap-3 w-56 text-slate-200">
                              <button
                                type="button"
                                onClick={() => msg.attachment && handleAudioPlayPause(msg.id, msg.attachment.data)}
                                className="w-8 h-8 rounded-full bg-rose-600 flex items-center justify-center text-white shrink-0 hover:bg-rose-700 transition-colors"
                              >
                                {playingAudioId === msg.id ? <Pause className="w-4 h-4 fill-white text-white" /> : <Play className="w-4 h-4 fill-white text-white translate-x-0.5" />}
                              </button>
                              <div className="flex-1 min-w-0 text-left">
                                <div className="text-[10px] font-bold text-slate-300">Voice Note Record</div>
                                <div className="text-[9px] text-slate-500">
                                  {audioCurrentTimes[msg.id] 
                                    ? `${Math.floor(audioCurrentTimes[msg.id])}s / ${msg.attachment.duration || Math.floor(audioDurations[msg.id] || 0)}s`
                                    : `${msg.attachment.duration || '0'}s`}
                                </div>
                              </div>
                              <a 
                                href={msg.attachment.data} 
                                download={msg.attachment.name}
                                className="p-1 text-slate-400 hover:text-white"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}

                          {/* Document attachments download link */}
                          {msg.attachment && !msg.attachment.type.startsWith('audio/') && (
                            <div className="mt-3 bg-slate-900 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between gap-3 max-w-xs text-slate-300">
                              <div className="flex items-center gap-2 truncate min-w-0">
                                <FileText className="w-6 h-6 text-rose-500 shrink-0" />
                                <div className="truncate">
                                  <p className="text-[10px] font-bold truncate">{msg.attachment.name}</p>
                                  <p className="text-[8.5px] opacity-75">{msg.attachment.type.split('/')[1] || 'doc'}</p>
                                </div>
                              </div>
                              <a 
                                href={msg.attachment.data} 
                                download={msg.attachment.name}
                                className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded text-slate-200"
                              >
                                Download
                              </a>
                            </div>
                          )}
                        </div>

                        <span className="text-[9px] text-slate-600 font-mono px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {/* Client Live Typing status indicator */}
                {selectedChat.customerTyping && (
                  <div className="flex gap-3 mr-auto items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-slate-300 font-black">
                      C
                    </div>
                    <div className="bg-slate-850 p-3 rounded-full border border-slate-800 flex items-center gap-1">
                      <span className="w-1 h-1 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1 h-1 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1 h-1 bg-rose-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Message Composer Footer Area */}
              {selectedChat.status === 'active' && (
                <div className="bg-slate-900/60 border-t border-slate-800 p-4 shrink-0 space-y-3.5">
                  
                  {/* Template quick-reply selectors */}
                  <div className="flex flex-wrap gap-2 items-center text-[11px] text-slate-400">
                    <span className="text-slate-500 font-bold">Canned Replies:</span>
                    <select
                      value={selectedTemplate}
                      onChange={(e) => handleTemplateSelect(e.target.value)}
                      className="bg-slate-850 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-slate-300 outline-none focus:border-rose-500 cursor-pointer"
                    >
                      <option value="">-- Choose Template --</option>
                      <option value="identity">Request Identity Proof (BR / ID)</option>
                      <option value="hold">Explain Staging Security Hold</option>
                      <option value="resolved">Confirm Release Authorization</option>
                      <option value="bank">Request Invoice / Ledger Verification</option>
                    </select>

                    <button 
                      type="button" 
                      onClick={() => handleTypingToggle(true)}
                      className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors ml-auto underline"
                    >
                      Simulate "Typing..."
                    </button>
                  </div>

                  <form onSubmit={handleSendAgentMessage} className="flex gap-2.5">
                    <input
                      type="text"
                      value={agentReply}
                      onChange={(e) => { setAgentReply(e.target.value); if (e.target.value.length > 0) handleTypingToggle(true); }}
                      onBlur={() => handleTypingToggle(false)}
                      placeholder={`Reply to merchant as supervisor ${activeAgent?.name}...`}
                      className="flex-1 bg-slate-950 text-slate-100 rounded-xl px-4 py-3 text-xs border border-slate-800/80 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!agentReply.trim()}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        agentReply.trim()
                          ? 'bg-rose-600 hover:bg-rose-700 text-white font-extrabold'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-800/40'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Response</span>
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shadow-xl">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-sm font-bold text-slate-300">No active support ticket selected</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Choose a ticket from the left queue. Review customer files, collection logs and trigger payment settlement releases live.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* SIDEBAR 2: Enterprise Agent Control Suite */}
        <aside className="w-full lg:w-80 bg-slate-900 border-l border-slate-800/60 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2 shrink-0">
            <TrendingUp className="w-4 h-4 text-rose-500" />
            <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">
              Operations Control Suite
            </h2>
          </div>

          <div className="p-4 space-y-6">
            {selectedChat ? (
              <>
                {/* Section A: Customer Security Lock & Restrictions */}
                <div className="space-y-3.5 pb-6 border-b border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Security Restrictions
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={handleToggleLock}
                      className={`py-2 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition-all cursor-pointer ${
                        selectedChat.isLocked 
                          ? 'bg-red-950/40 border-red-500 text-red-400 hover:bg-red-950/60' 
                          : 'bg-slate-850 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                      title="Lock Customer Typing"
                    >
                      {selectedChat.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5 text-slate-500" />}
                      <span>{selectedChat.isLocked ? 'Locked' : 'Lock Customer'}</span>
                    </button>

                    <button
                      onClick={handleToggleUploads}
                      className={`py-2 rounded-xl border flex items-center justify-center gap-1.5 font-semibold transition-all cursor-pointer ${
                        selectedChat.uploadsMuted 
                          ? 'bg-red-950/40 border-red-500 text-red-400 hover:bg-red-950/60' 
                          : 'bg-slate-850 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                      title="Mute Client File/Voice Uploads"
                    >
                      <Ban className="w-3.5 h-3.5 text-rose-500" />
                      <span>{selectedChat.uploadsMuted ? 'Uploads Muted' : 'Mute Uploads'}</span>
                    </button>
                  </div>
                </div>

                {/* Section B: Case Progress Milestone Stepper */}
                <div className="space-y-3.5 pb-6 border-b border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Set Case Milestone
                  </p>
                  
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { step: 1, label: 'Received' },
                      { step: 2, label: 'Under Review' },
                      { step: 3, label: 'On Hold' },
                      { step: 4, label: 'Refund Verify' },
                      { step: 5, label: 'Pending Approval' },
                      { step: 6, label: 'Completed' }
                    ].map((st) => (
                      <button
                        key={st.step}
                        onClick={() => handleUpdateTimeline(st.step)}
                        className={`py-1.5 px-2 text-[10px] font-bold rounded-lg border text-left flex justify-between items-center cursor-pointer transition-colors ${
                          selectedChat.timelineProgress === st.step
                            ? 'bg-rose-950/40 border-rose-500 text-rose-400 font-extrabold'
                            : 'bg-slate-850/60 border-slate-850 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span>{st.label}</span>
                        {selectedChat.timelineProgress > st.step ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        ) : selectedChat.timelineProgress === st.step ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section C: Collapsible Payment request parameters */}
                <div className="space-y-3.5 pb-6 border-b border-slate-800">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Payment Gateway Request
                    </p>
                    <button
                      onClick={() => setIsEditingPayment(!isEditingPayment)}
                      className="text-[10.5px] text-rose-500 hover:underline font-semibold"
                    >
                      {isEditingPayment ? 'Collapse' : 'Configure'}
                    </button>
                  </div>

                  {/* Payment request detail overview */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status Enabled:</span>
                      <span className={payEnabled ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                        {payEnabled ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Target Value:</span>
                      <span className="font-mono text-slate-200">{payCurrency} {payAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Selected Label:</span>
                      <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-rose-400 rounded-full font-bold text-[9px]">
                        {payStatus}
                      </span>
                    </div>
                  </div>

                  {isEditingPayment && (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
                      <div className="flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          id="pay_active"
                          checked={payEnabled}
                          onChange={(e) => setPayEnabled(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-800 accent-rose-500"
                        />
                        <label htmlFor="pay_active" className="font-bold text-slate-300 cursor-pointer">
                          Activate Payment Box
                        </label>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-1 uppercase">Amount</label>
                          <input 
                            type="number" 
                            value={payAmount}
                            onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500 block mb-1 uppercase">Currency</label>
                          <input 
                            type="text" 
                            value={payCurrency}
                            onChange={(e) => setPayCurrency(e.target.value.toUpperCase())}
                            className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-bold text-xs text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1 uppercase">Compliance Status</label>
                        <select
                          value={payStatus}
                          onChange={(e: any) => setPayStatus(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-300"
                        >
                          <option value="Awaiting Sender">Awaiting Sender</option>
                          <option value="Awaiting Transfer">Awaiting Transfer</option>
                          <option value="Pending Confirmation">Pending Confirmation</option>
                          <option value="Funds Pending">Funds Pending</option>
                          <option value="Payment Pending">Payment Pending</option>
                          <option value="Transfer Received">Transfer Received</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Verification Complete">Verification Complete</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1 uppercase">Reference Tag</label>
                        <input 
                          type="text" 
                          value={payRef}
                          onChange={(e) => setPayRef(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 font-mono text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1 uppercase">Deadline</label>
                        <input 
                          type="text" 
                          value={payDeadline}
                          placeholder="2026-07-22 18:00"
                          onChange={(e) => setPayDeadline(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1 uppercase">Audit Notes</label>
                        <textarea 
                          rows={2}
                          value={payNotes}
                          placeholder="Verification fee details..."
                          onChange={(e) => setPayNotes(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white resize-none"
                        />
                      </div>

                      <button
                        onClick={handleSavePaymentConfig}
                        className="w-full h-8.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold transition-all text-xs cursor-pointer"
                      >
                        Publish Payment Rules
                      </button>
                    </div>
                  )}
                </div>

                {/* Section D: Add Custom Verification Document Requirement */}
                <div className="space-y-3.5 pb-6 border-b border-slate-800">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Verification Instructions
                    </p>
                    <button
                      onClick={() => setIsAddingInstruction(!isAddingInstruction)}
                      className="text-[10.5px] text-rose-500 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Request
                    </button>
                  </div>

                  {/* Active list cards */}
                  <div className="space-y-2 text-xs">
                    {selectedChat.instructions.length === 0 ? (
                      <p className="text-xs text-slate-600 italic">No custom instruction cards added yet.</p>
                    ) : (
                      selectedChat.instructions.map((ins) => (
                        <div key={ins.id} className="p-3 bg-slate-950 border border-slate-850 rounded-lg flex items-start justify-between gap-2.5">
                          <div>
                            <div className="text-[10px] font-bold text-rose-400 bg-rose-950/30 px-1.5 py-0.5 rounded border border-rose-900/30 inline-block mb-1">
                              {ins.category}
                            </div>
                            <div className="font-bold text-slate-200">{ins.title}</div>
                            <p className="text-[10.5px] text-slate-500 mt-0.5 leading-snug">{ins.description}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteInstruction(ins.id)}
                            className="p-1 hover:text-red-400 transition-colors"
                            title="Remove Request"
                          >
                            <Trash2 className="w-4 h-4 text-slate-600" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {isAddingInstruction && (
                    <form onSubmit={handleAddInstruction} className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-3 text-xs">
                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1 uppercase">Category</label>
                        <select
                          value={instCategory}
                          onChange={(e: any) => setInstCategory(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-slate-300"
                        >
                          <option value="Identity Verification">Identity Verification</option>
                          <option value="Refund Required">Refund Required</option>
                          <option value="Bank Review">Bank Review</option>
                          <option value="Document Required">Document Required</option>
                          <option value="Additional Information">Additional Information</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1 uppercase">Title</label>
                        <input 
                          type="text" 
                          value={instTitle}
                          placeholder="e.g., Upload Hong Kong HKID Card"
                          onChange={(e) => setInstTitle(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-[9px] text-slate-500 block mb-1 uppercase">Instruction Guidelines</label>
                        <textarea 
                          rows={2}
                          value={instDesc}
                          placeholder="Describe the instructions for document validation..."
                          onChange={(e) => setInstDesc(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white resize-none"
                          required
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingInstruction(false)}
                          className="flex-1 h-8 border border-slate-800 hover:bg-slate-900 rounded text-slate-400 text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="flex-1 h-8 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-xs"
                        >
                          Publish Instructions
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Section E: Live Transfer Cases to Multi Agents */}
                <div className="space-y-3.5 pb-6 border-b border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Transfer Case Assignment
                  </p>
                  
                  <div className="flex gap-2">
                    <select
                      value={transferTargetAgent}
                      onChange={(e) => setTransferTargetAgent(e.target.value)}
                      className="flex-1 h-9.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 text-xs text-slate-300 focus:outline-none"
                    >
                      <option value="">-- Choose Agent --</option>
                      {agents.filter(a => a.id !== selectedChat.agentId).map(ag => (
                        <option key={ag.id} value={ag.id}>
                          👤 {ag.name} ({ag.department} · {ag.status})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleTransferAssignment}
                      disabled={!transferTargetAgent}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                        transferTargetAgent 
                          ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer' 
                          : 'bg-slate-850 text-slate-600 cursor-not-allowed border border-slate-800/40'
                      }`}
                    >
                      Transfer
                    </button>
                  </div>
                </div>

                {/* Section F: Supervisor Internal Notes Pad */}
                <div className="space-y-3.5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Operations Notepad
                  </p>
                  <textarea 
                    rows={3}
                    value={internalNotesText}
                    onChange={(e) => setInternalNotesText(e.target.value)}
                    placeholder="Type private case tracking summaries, compliance alerts, or fraud reports..."
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl p-3 text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:border-rose-500 transition-colors resize-none font-sans"
                  />
                  <button
                    onClick={handleSaveInternalNotes}
                    className="w-full h-9 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-750/80 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Commit Internal Notes
                  </button>
                </div>
              </>
            ) : (
              <p className="text-xs text-slate-600 italic">Select a conversation thread to mount operations controls.</p>
            )}
          </div>
        </aside>

      </div>

    </div>
  );
}
