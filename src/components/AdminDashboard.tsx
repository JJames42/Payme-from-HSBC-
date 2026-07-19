import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Shield, Users, MessageSquare, AlertCircle, RefreshCw, CheckCircle2, Lock, Unlock, FileText, Ban, Trash2, ArrowUpRight } from 'lucide-react';
import { ChatSession, Agent, Transaction, Message } from '../types.ts';

interface AdminDashboardProps {
  onBackToHome: () => void;
}

export default function AdminDashboard({ onBackToHome }: AdminDashboardProps) {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('3'); // Default to Mei Ling Tse
  const [agentReply, setAgentReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

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
      setErrorText('Failed to refresh merchant console. Retrying...');
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 4000);
    return () => clearInterval(interval);
  }, [selectedChatId]);

  // Scroll active chat panel to bottom
  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChatId, chats]);

  const selectedChat = chats.find(c => c.id === selectedChatId) || null;
  const activeAgent = agents.find(a => a.id === selectedAgentId) || agents[0] || null;

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

  // Toggle attachment permissions for customer
  const handleToggleAttachments = async (chatId: string, currentAllowed: boolean) => {
    try {
      const res = await fetch(`/api/chats/${chatId}/toggle-attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowed: !currentAllowed })
      });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Resolve / close conversation
  const handleResolveChat = async (chatId: string) => {
    if (!window.confirm('Are you sure you want to resolve and archive this support conversation?')) {
      return;
    }
    try {
      const res = await fetch(`/api/chats/${chatId}/resolve`, { method: 'POST' });
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send an agent message to customer
  const handleSendAgentMessage = async (e: React.FormEvent) => {
    e.preventDefault();
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
      if (res.ok) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Issue audit action on a transaction (refund, hold release, dispute clear)
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col antialiased">
      {/* Dark Admin Title Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 z-10 shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBackToHome}
            className="flex items-center gap-1.5 text-xs bg-slate-850 hover:bg-slate-800 text-slate-300 font-bold px-4 py-2 rounded-full cursor-pointer transition-all border border-slate-700/50"
          >
            <ChevronLeft className="w-4 h-4 text-rose-500 stroke-[2.5]" />
            Exit Console
          </button>
          <div className="h-6 w-px bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-rose-500 animate-pulse" />
            <h1 className="text-sm font-black tracking-wider text-rose-500 uppercase">PayMe Operations Control</h1>
            <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-md border border-slate-700">
              paymebusinessllc.online
            </span>
          </div>
        </div>

        {/* Staging environment indicator */}
        <div className="flex items-center gap-4">
          {errorText && (
            <span className="text-xs text-amber-400 font-bold animate-pulse">{errorText}</span>
          )}
          <div className="bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            STAGING DATABASE CONNECTED
          </div>
        </div>
      </header>

      {/* Main split dashboard view */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Side: Support Channels & Queue */}
        <aside className="w-full lg:w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto">
          {/* Agent Selector */}
          <div className="p-4 border-b border-slate-850 bg-slate-900/50">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Assigned Agent Identity
            </label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full bg-slate-850 text-slate-200 border border-slate-850 rounded-xl px-3.5 py-2 text-xs font-bold outline-none focus:border-rose-500"
            >
              {agents.map((ag) => (
                <option key={ag.id} value={ag.id}>
                  👤 {ag.name} ({ag.description.split(' ')[0]})
                </option>
              ))}
            </select>
          </div>

          <div className="p-4 border-b border-slate-850 flex justify-between items-center bg-slate-900/30">
            <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
              <Users className="w-4 h-4 text-rose-500" />
              Service Channels
            </h2>
            <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded-full border border-slate-700/60">
              {chats.length} active
            </span>
          </div>

          {/* List of chat sessions */}
          <div className="flex-1 divide-y divide-slate-850">
            {chats.map((c) => {
              const isSelected = c.id === selectedChatId;
              const isPending = c.status === 'pending';
              const isResolved = c.status === 'resolved';
              const assignedAgent = agents.find(ag => ag.id === c.agentId);

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedChatId(c.id)}
                  className={`p-4 text-left cursor-pointer transition-all relative ${
                    isSelected ? 'bg-slate-850 border-l-4 border-rose-500' : 'hover:bg-slate-850/45'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <h3 className="text-xs font-extrabold text-slate-200 truncate max-w-[150px]">
                      {c.userName}
                    </h3>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                      isPending 
                        ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400 animate-pulse' 
                        : isResolved
                        ? 'bg-slate-800 border border-slate-700 text-slate-500'
                        : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <p className="text-[10.5px] text-slate-400 truncate max-w-[200px] mb-2 font-medium">
                    {c.selectedTopic || 'Welcome Lobby'}
                  </p>

                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-500">
                    <span>
                      {c.messages.length} messages · {c.language === 'hk' ? '繁中' : 'EN'}
                    </span>
                    <span className="truncate max-w-[100px]">
                      {assignedAgent ? `👤 ${assignedAgent.name.split(' ')[0]}` : 'Unassigned'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Center: Live Conversation Thread */}
        <main className="flex-1 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">
          {selectedChat ? (
            <>
              {/* Active Conversation Metadata Bar */}
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row justify-between sm:items-center gap-3 shrink-0">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-200">{selectedChat.userName}</h2>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span className="font-mono text-[10.5px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-750">
                      ID: {selectedChat.id}
                    </span>
                    · {selectedChat.userEmail || 'no-email@staging.com'}
                  </p>
                </div>

                {/* Status-specific action triggers */}
                <div className="flex items-center gap-2">
                  {selectedChat.status === 'pending' && (
                    <button
                      onClick={() => handleAcceptChat(selectedChat.id)}
                      className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-rose-950/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Accept & Assign {activeAgent?.name.split(' ')[0]}
                    </button>
                  )}

                  {selectedChat.status === 'active' && (
                    <>
                      <button
                        onClick={() => handleToggleAttachments(selectedChat.id, selectedChat.attachmentsAllowed)}
                        className={`px-3 py-2 text-xs font-bold rounded-xl transition-all border cursor-pointer flex items-center gap-1.5 ${
                          selectedChat.attachmentsAllowed
                            ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                            : 'bg-rose-950/30 border-rose-900/50 hover:bg-rose-950/50 text-rose-400'
                        }`}
                        title={selectedChat.attachmentsAllowed ? 'Disable Client Uploads' : 'Enable Client Uploads'}
                      >
                        {selectedChat.attachmentsAllowed ? (
                          <>
                            <Lock className="w-3.5 h-3.5 text-rose-400" />
                            Disable Uploads
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                            Enable Uploads
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleResolveChat(selectedChat.id)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Resolve Session
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Message Log lists */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/25">
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
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 border ${
                        isAgent 
                          ? 'bg-rose-500 text-white border-rose-400' 
                          : isBot 
                          ? 'bg-slate-800 text-slate-400 border-slate-700' 
                          : 'bg-slate-800 text-slate-200 border-slate-700'
                      }`}>
                        {isAgent ? 'A' : isBot ? 'B' : 'C'}
                      </div>

                      <div className={`flex flex-col space-y-1 ${isAgent ? 'items-end' : 'items-start'}`}>
                        <span className="text-[9.5px] text-slate-500 font-bold px-1 uppercase tracking-wider font-mono">
                          {isAgent 
                            ? msg.agentName || 'Support Agent' 
                            : isBot 
                            ? 'Lobby Bot' 
                            : 'Client Merchant'}
                        </span>

                        <div className={`rounded-2xl p-3.5 text-xs leading-relaxed border ${
                          isAgent 
                            ? 'bg-rose-500 text-white border-rose-400 rounded-tr-xs shadow-sm shadow-rose-950/20' 
                            : 'bg-slate-850 text-slate-200 border-slate-800 rounded-tl-xs'
                        }`}>
                          <p>{msg.text}</p>

                          {msg.attachment && (
                            <div className={`mt-3 p-2.5 rounded-xl border flex items-center gap-3 ${
                              isAgent 
                                ? 'bg-rose-600/40 border-rose-400 text-white' 
                                : 'bg-slate-900 border-slate-800 text-slate-300'
                            }`}>
                              <FileText className="w-8 h-8 text-rose-300 shrink-0" />
                              <div className="overflow-hidden flex-1">
                                <p className="text-[11px] font-bold truncate">{msg.attachment.name}</p>
                                <p className="text-[9px] opacity-75 font-mono">{msg.attachment.type}</p>
                              </div>
                              <a 
                                href={msg.attachment.data} 
                                download={msg.attachment.name}
                                className="text-[10px] font-bold underline px-2.5 py-1 rounded-lg bg-black/15 hover:bg-black/25 cursor-pointer transition-all"
                              >
                                Download Asset
                              </a>
                            </div>
                          )}
                        </div>

                        <span className="text-[9px] text-slate-500 font-mono px-1">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatMessagesEndRef} />
              </div>

              {/* Agent text entry bar */}
              {selectedChat.status === 'active' && (
                <div className="bg-slate-900/60 border-t border-slate-800 p-4 shrink-0">
                  <form onSubmit={handleSendAgentMessage} className="flex gap-2.5">
                    <input
                      type="text"
                      value={agentReply}
                      onChange={(e) => setAgentReply(e.target.value)}
                      placeholder={`Reply to customer as ${activeAgent?.name}...`}
                      className="flex-1 bg-slate-850 text-slate-100 rounded-xl px-4 py-3 text-xs border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!agentReply.trim()}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                        agentReply.trim()
                          ? 'bg-rose-500 hover:bg-rose-600 text-white font-extrabold'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-750'
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Send Reply</span>
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
                <h3 className="text-sm font-bold text-slate-300">No Support Session Selected</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Select an active support channel or accept an outstanding pending inquiry in the sidebar to review customer details and transaction histories.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar: Transaction Audit Trails & Settler */}
        <aside className="w-full lg:w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-2 shrink-0">
            <Shield className="w-4 h-4 text-rose-500" />
            <h2 className="text-xs font-black tracking-widest text-slate-400 uppercase">
              Transaction Settlement
            </h2>
          </div>

          <div className="p-4 space-y-6">
            {selectedChat ? (
              <>
                {/* Profile panel */}
                <div className="space-y-3 pb-6 border-b border-slate-800">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Customer Profile
                  </p>
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850/60 space-y-2.5 font-mono text-[10px] leading-snug">
                    <div className="flex justify-between">
                      <span className="text-slate-500">User:</span>
                      <span className="text-slate-300 font-bold truncate max-w-[140px]">{selectedChat.userName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Session ID:</span>
                      <span className="text-slate-400">{selectedChat.id.substring(0, 11)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Language:</span>
                      <span className="text-rose-400 uppercase font-bold">{selectedChat.language}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Node Status:</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        HTTPS ENCRYPTED
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transactions audit log */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                    <span>Transaction Records</span>
                    <span className="font-mono text-[9px] text-slate-400 bg-slate-850 px-1.5 py-0.5 rounded border border-slate-800">
                      {selectedChat.transactions.length} total
                    </span>
                  </p>

                  <div className="space-y-3">
                    {selectedChat.transactions.map((tx) => (
                      <div 
                        key={tx.id} 
                        className="bg-slate-950 rounded-2xl p-4 border border-slate-850 space-y-3.5 relative overflow-hidden"
                      >
                        {/* Transaction header */}
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 font-mono px-1.5 py-0.5 rounded-md font-bold">
                              {tx.id}
                            </span>
                            <p className="text-[9px] text-slate-500 font-mono mt-1">
                              {tx.date}
                            </p>
                          </div>
                          
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                            tx.status === 'completed'
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
                              : tx.status === 'pending_dispute'
                              ? 'bg-rose-950/40 text-rose-400 border-rose-500/20 animate-pulse'
                              : tx.status === 'held'
                              ? 'bg-amber-950/40 text-amber-400 border-amber-500/20'
                              : 'bg-slate-900 border-slate-800 text-slate-400'
                          } uppercase`}>
                            {tx.status.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Amount display */}
                        <div className="flex justify-between items-baseline border-b border-slate-900 pb-2.5">
                          <span className="text-[11px] text-slate-400 font-medium">Value (HKD):</span>
                          <span className="text-base font-black text-slate-100 font-mono">
                            HK$ {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* Staging notes */}
                        <div className="space-y-1">
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Internal audit notes</p>
                          <p className="text-[10px] text-slate-400 leading-normal bg-slate-900/60 p-2 rounded-lg border border-slate-900/40">
                            {tx.notes}
                          </p>
                        </div>

                        {/* Settlement Trigger Actions */}
                        {selectedChat.status === 'active' && (
                          <div className="pt-2 grid grid-cols-1 gap-1.5">
                            {tx.status !== 'refunded' && (
                              <button
                                onClick={() => handleTransactionAction(tx.id, 'refund')}
                                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2 px-3 rounded-xl text-[10px] text-center cursor-pointer transition-all flex items-center justify-center gap-1.5"
                              >
                                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                                <span>Issue Full Refund (Automated Notice)</span>
                              </button>
                            )}

                            {tx.status === 'held' && (
                              <button
                                onClick={() => handleTransactionAction(tx.id, 'release_hold')}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-3 rounded-xl text-[10px] text-center cursor-pointer transition-all flex items-center justify-center gap-1.5"
                              >
                                <Unlock className="w-3.5 h-3.5 shrink-0" />
                                <span>Verify Invoices & Release Hold</span>
                              </button>
                            )}

                            {tx.status === 'pending_dispute' && (
                              <button
                                onClick={() => handleTransactionAction(tx.id, 'verify_dispute')}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 px-3 rounded-xl text-[10px] text-center cursor-pointer transition-all flex items-center justify-center gap-1.5"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                <span>Manually Clear Dispute & Credit Funds</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 px-4 space-y-2">
                <AlertCircle className="w-6 h-6 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-400">No Session Selected</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Select a live support session in the channels tab to audit client transactions, resolve disputes, or authorize refunds.
                </p>
              </div>
            )}
          </div>
        </aside>

      </div>
    </div>
  );
}
