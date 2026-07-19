import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Send, Paperclip, RefreshCw, Sparkles, Shield, MapPin, X, File, AlertCircle, HelpCircle } from 'lucide-react';
import { Message, ChatSession, Attachment } from '../types.ts';

interface LiveChatProps {
  onBackToHome: () => void;
  sessionId?: string;
}

export default function LiveChat({ onBackToHome, sessionId: propSessionId }: LiveChatProps) {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize or fetch the chat session
  useEffect(() => {
    const initChat = async () => {
      setLoading(true);
      try {
        let sid = propSessionId;
        if (!sid) {
          sid = localStorage.getItem('payme_chat_session_id') || undefined;
        }

        const res = await fetch('/api/chats/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: sid,
            language: 'en',
            userName: 'Retail Shopify Merchant',
            userEmail: 'merchant.retail@hknet.com'
          })
        });

        if (!res.ok) throw new Error('Failed to retrieve chat session');
        const data: ChatSession = await res.json();
        setSession(data);
        if (!propSessionId) {
          localStorage.setItem('payme_chat_session_id', data.id);
        }
        setErrorMessage(null);
      } catch (err: any) {
        setErrorMessage('Trouble connecting to the support server. Retrying...');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [propSessionId]);

  // Polling for updates (to receive agent replies in real time)
  useEffect(() => {
    if (!session) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/chats/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: session.id })
        });
        if (res.ok) {
          const data: ChatSession = await res.json();
          setSession(data);
        }
      } catch (err) {
        console.warn('Polling error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [session?.id]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session?.messages]);

  // Reset current session/ticket
  const handleNewTicket = async () => {
    if (!window.confirm('Are you sure you want to start a new support ticket? This will reset your current conversation.')) {
      return;
    }
    localStorage.removeItem('payme_chat_session_id');
    window.location.reload();
  };

  // Select support topic and transition to Human Queue
  const handleSelectTopic = async (topicEn: string, topicHk: string) => {
    if (!session) return;
    const isHk = session.language === 'hk';
    const selectedTopic = isHk ? topicHk : topicEn;

    try {
      setLoading(true);
      // Update session with topic and set status to 'pending' (human cue)
      let res = await fetch(`/api/chats/${session.id}/topic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: selectedTopic, status: 'pending' })
      });

      if (!res.ok) throw new Error('Failed to set topic');
      let updatedSession = await res.json();
      setSession(updatedSession);

      // Add user message indicating topic selection
      res = await fetch(`/api/chats/${session.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'customer',
          text: selectedTopic
        })
      });
      updatedSession = await res.json();

      // Bot reply matching the cue
      const botText = isHk
        ? '正在為您接通香港 PayMe Business 支援專員。請稍候，我們將立刻指派客戶經理與您接洽...'
        : 'Connecting you with our Hong Kong Customer Operations team. Please stay online, assigning a support agent to your case...';

      res = await fetch(`/api/chats/${session.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'bot',
          text: botText
        })
      });
      updatedSession = await res.json();
      setSession(updatedSession);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to connect to agent queue. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Language between English and Traditional Chinese
  const handleToggleLanguage = async (lang: 'en' | 'hk') => {
    if (!session) return;
    try {
      const res = await fetch(`/api/chats/${session.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'customer',
          text: lang === 'en' ? 'English' : '繁體中文'
        })
      });
      if (res.ok) {
        const updatedSession = await res.json();
        setSession({ ...updatedSession, language: lang });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send textual message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !session) return;

    const textToSend = inputMessage;
    setInputMessage('');

    try {
      const res = await fetch(`/api/chats/${session.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'customer',
          text: textToSend
        })
      });
      if (!res.ok) throw new Error('Failed to send message');
      const updatedSession = await res.json();
      setSession(updatedSession);
    } catch (err) {
      console.error(err);
      setErrorMessage('Failed to send message. Please try again.');
    }
  };

  // File uploading to Base64 Attachment
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !session) return;

    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      alert('File is too large. Maximum upload size is 10MB.');
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const attachment: Attachment = {
          name: file.name,
          type: file.type,
          data: base64Data
        };

        const res = await fetch(`/api/chats/${session.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: 'customer',
            text: `Uploaded attachment: ${file.name}`,
            attachment
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Failed to send attachment');
        }

        const updatedSession = await res.json();
        setSession(updatedSession);
      } catch (err: any) {
        alert(err.message || 'Failed to send attachment. Please try again.');
        console.error(err);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      alert('Failed to read file.');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  if (errorMessage && !session) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-4 animate-bounce" />
        <p className="text-sm font-bold text-slate-800 mb-2">{errorMessage}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Connection
        </button>
      </div>
    );
  }

  const isHk = session?.language === 'hk';

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col antialiased">
      {/* Premium Gradient Header */}
      <header className="bg-gradient-to-r from-rose-600 via-pink-500 to-rose-600 text-white shadow-md shrink-0">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBackToHome}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-wide">PayMe Customer Support</h1>
                <span className="text-[10px] bg-white/20 border border-white/30 text-white font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Sandbox Console
                </span>
              </div>
              <p className="text-xs text-rose-100 font-medium flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-white/80" />
                HK HQ (Queen's Road Central) · Active Desk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleNewTicket}
              className="px-3.5 py-1.5 bg-black/15 hover:bg-black/25 text-white border border-white/15 hover:border-white/30 font-bold rounded-xl text-[11px] transition-all cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              New Ticket
            </button>
          </div>
        </div>
      </header>

      {/* Main chat layout */}
      <main className="flex-1 max-w-4xl w-full mx-auto bg-white border-x border-slate-200/60 shadow-sm flex flex-col relative overflow-hidden">
        
        {/* Connection/Staging status banner */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-3.5 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="text-[11px] text-slate-500 font-mono tracking-wide">
              SESSION ID: <span className="font-bold text-slate-700">{session?.id.substring(0, 11)}</span>
            </p>
          </div>

          {session && session.status === 'bot' && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleToggleLanguage('en')}
                className={`text-[10px] font-black tracking-widest px-2.5 py-1 rounded-md border transition-all cursor-pointer uppercase ${
                  session.language === 'en'
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => handleToggleLanguage('hk')}
                className={`text-[10px] font-black tracking-widest px-2.5 py-1 rounded-md border transition-all cursor-pointer uppercase ${
                  session.language === 'hk'
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                繁中
              </button>
            </div>
          )}
        </div>

        {/* Message logs view */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/50">
          {session?.messages.map((msg) => {
            const isSelf = msg.sender === 'customer';
            const isSystem = msg.sender === 'system';
            const isBot = msg.sender === 'bot';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center items-center py-2 animate-fade-in">
                  <div className="bg-white/90 border border-slate-200/50 text-slate-500 text-[10.5px] font-bold px-4 py-1.5 rounded-full shadow-xs flex items-center gap-1.5 font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                    {msg.text}
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={msg.id} 
                className={`flex gap-3.5 items-start max-w-2xl ${isSelf ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar bubble */}
                <div className={`w-8.5 h-8.5 rounded-full flex items-center justify-center text-xs font-black shrink-0 border ${
                  isSelf 
                    ? 'bg-slate-800 text-slate-200 border-slate-700' 
                    : isBot 
                    ? 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white border-rose-300' 
                    : 'bg-rose-100 text-rose-700 border-rose-200'
                }`}>
                  {isSelf ? 'M' : isBot ? 'P' : 'S'}
                </div>

                <div className={`flex flex-col space-y-1 ${isSelf ? 'items-end' : 'items-start'}`}>
                  {/* Sender label */}
                  <span className="text-[10px] text-slate-400 font-bold px-1 font-mono uppercase tracking-wider">
                    {isSelf ? 'Merchant Client' : isBot ? 'PayMe Automated Bot' : msg.agentName || 'Operations Agent'}
                  </span>

                  {/* Bubble content */}
                  <div className={`rounded-2xl p-4 text-xs leading-relaxed border shadow-xs ${
                    isSelf 
                      ? 'bg-slate-800 text-slate-100 border-slate-700 rounded-tr-xs shadow-slate-200/10' 
                      : 'bg-white text-slate-800 border-slate-200/60 rounded-tl-xs'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>

                    {/* Attachment rendering */}
                    {msg.attachment && (
                      <div className={`mt-3 p-3 rounded-xl border flex items-center gap-3 ${
                        isSelf 
                          ? 'bg-slate-900/50 border-slate-700/60 text-slate-300' 
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        <File className="w-8 h-8 text-rose-500 shrink-0" />
                        <div className="overflow-hidden flex-1">
                          <p className="text-[11px] font-bold truncate">{msg.attachment.name}</p>
                          <p className="text-[9px] opacity-75 font-mono">{msg.attachment.type}</p>
                        </div>
                        <a 
                          href={msg.attachment.data} 
                          download={msg.attachment.name}
                          className="text-[10px] font-bold underline px-3 py-1.5 rounded-lg bg-black/5 hover:bg-black/10 cursor-pointer transition-all shrink-0"
                        >
                          Download
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span className="text-[9px] text-slate-400 font-mono px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Interactive Topic Selector for Bot Mode */}
          {session && session.status === 'bot' && (
            <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm max-w-md mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="text-center">
                <HelpCircle className="w-8 h-8 text-rose-500 mx-auto mb-2 animate-pulse" />
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  {isHk ? '請選擇服務部門' : 'Select Department'}
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  {isHk 
                    ? '請選擇您遇到的問題類別，以便我們為您分配最合適的服務專員。'
                    : 'Please select an option below so we can guide you to the correct department.'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2">
                <button
                  onClick={() => handleSelectTopic('💸 Transaction Disputes & Issues', '💸 交易爭議及問題')}
                  className="w-full text-left bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl px-4 py-3 text-xs font-bold transition-all cursor-pointer text-slate-700 hover:text-rose-600 flex justify-between items-center"
                >
                  <span>💸 {isHk ? '交易爭議及問題' : 'Transaction Disputes & Issues'}</span>
                  <span className="text-[9px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-md font-black uppercase">Active</span>
                </button>

                <button
                  onClick={() => handleSelectTopic('💬 Talk to a Human (Agent)', '💬 聯絡線上客服專員')}
                  className="w-full text-left bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl px-4 py-3 text-xs font-bold transition-all cursor-pointer text-slate-700 hover:text-rose-600 flex justify-between items-center"
                >
                  <span>💬 {isHk ? '聯絡線上客服專員' : 'Talk to a Human (Agent)'}</span>
                  <span className="text-[9px] bg-rose-100 text-rose-600 px-2 py-0.5 rounded-md font-black uppercase">Instant</span>
                </button>

                <button
                  onClick={() => handleSelectTopic('⚙️ Account Security & Access', '⚙️ 賬戶安全及存取權')}
                  className="w-full text-left bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl px-4 py-3 text-xs font-bold transition-all cursor-pointer text-slate-700 hover:text-rose-600 flex justify-between items-center"
                >
                  <span>⚙️ {isHk ? '賬戶安全及存取權' : 'Account Security & Access'}</span>
                  <span className="text-[9px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-md font-black uppercase">Secure</span>
                </button>

                <button
                  onClick={() => handleSelectTopic('📊 Business Settlement', '📊 商戶資金結算')}
                  className="w-full text-left bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl px-4 py-3 text-xs font-bold transition-all cursor-pointer text-slate-700 hover:text-rose-600 flex justify-between items-center"
                >
                  <span>📊 {isHk ? '商戶資金結算' : 'Business Settlement'}</span>
                  <span className="text-[9px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-md font-black uppercase">Billing</span>
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Reply text entry / attachment bar */}
        {session && session.status !== 'bot' && session.status !== 'resolved' && (
          <div className="bg-white border-t border-slate-200/60 p-4 shrink-0">
            <form onSubmit={handleSendMessage} className="space-y-3">
              <div className="flex gap-2.5 items-center">
                {/* File Attachment input */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload}
                  className="hidden" 
                  accept="image/*,application/pdf,.doc,.docx"
                  disabled={!session.attachmentsAllowed || isUploading}
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!session.attachmentsAllowed || isUploading}
                  className={`p-3 rounded-xl border transition-all cursor-pointer shrink-0 ${
                    !session.attachmentsAllowed 
                      ? 'bg-slate-50 border-slate-200 text-slate-300 cursor-not-allowed'
                      : 'bg-slate-100 border-slate-200 hover:bg-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                  title={session.attachmentsAllowed ? 'Add Attachment' : 'Attachments are disabled by the agent'}
                >
                  <Paperclip className={`w-4 h-4 ${isUploading ? 'animate-spin' : ''}`} />
                </button>

                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={
                    session.status === 'pending'
                      ? (isHk ? '正在排隊接通專員，請在此輸入您的詳細描述...' : 'Queuing up for support, type your issue details here...')
                      : (isHk ? '在此輸入您的回覆...' : 'Type your message to agent...')
                  }
                  className="flex-1 bg-slate-50 rounded-xl px-4 py-3 text-xs border border-slate-200 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className={`p-3 rounded-xl font-bold transition-all shrink-0 ${
                    inputMessage.trim() 
                      ? 'bg-rose-500 text-white cursor-pointer hover:bg-rose-600 shadow-sm' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Staging Info/Permissions status */}
              <div className="flex justify-between items-center text-[10px] text-slate-400 px-1 font-mono">
                <span>
                  {session.attachmentsAllowed 
                    ? '✓ attachments active (max 10mb)' 
                    : '✗ attachments disabled by operations agent'}
                </span>
                <span>
                  {session.status === 'pending' ? 'QUEUE POSITION: #1' : 'CONNECTED VIA HSBC ENCRYPTED DESK'}
                </span>
              </div>
            </form>
          </div>
        )}

        {/* Resolved view status */}
        {session && session.status === 'resolved' && (
          <div className="bg-slate-50 border-t border-slate-200/60 p-8 text-center shrink-0 space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 border border-rose-200 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <Shield className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-800">Support Session Completed</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                This transaction staging ticket has been successfully resolved, audited, and archived. Need further help?
              </p>
            </div>
            <button
              onClick={handleNewTicket}
              className="px-6 py-2.5 bg-[#DB0011] hover:bg-[#b8000e] text-white font-bold rounded-xl text-xs shadow-sm hover:shadow transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Open Another Ticket
            </button>
          </div>
        )}

      </main>
    </div>
  );
}
