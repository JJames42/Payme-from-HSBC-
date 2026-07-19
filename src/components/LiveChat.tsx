import { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, ChevronUp, Send, Paperclip, Shield, FileText, CheckCircle2, 
  HelpCircle, Lock, Menu, CheckCheck, MoreHorizontal, Plus, Mic, Play, Pause, 
  Download, RefreshCw, AlertCircle, File, Image as ImageIcon, Volume2, Globe, Clock, Sparkles, X,
  ChevronLeft, ChevronRight, User, DollarSign, ArrowLeftRight, Headphones
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Message, ChatSession, Attachment, CaseInstruction } from '../types.ts';

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
  const [activeTab, setActiveTab] = useState<'chat' | 'details'>('chat');
  
  // Header and Collapsible banner state
  const [isCasePanelExpanded, setIsCasePanelExpanded] = useState(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Bot-Flow local states
  const [botStep, setBotStep] = useState<number>(-1); // -1: Welcome/Support Dashboard, 0: Name, 1: Email, 2: Category, 3: Details, 4: Transferring
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formTxnId, setFormTxnId] = useState('');
  const [formRefNum, setFormRefNum] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [onboardingFiles, setOnboardingFiles] = useState<{name: string, type: string, data: string}[]>([]);

  // Recording State Machine
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordPaused, setIsRecordPaused] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [recordedBase64, setRecordedBase64] = useState<string | null>(null);
  const [liveWaveform, setLiveWaveform] = useState<number[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<any>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(0);

  // Audio Playback States for Messages
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioCurrentTimes, setAudioCurrentTimes] = useState<Record<string, number>>({});
  const [audioDurations, setAudioDurations] = useState<Record<string, number>>({});
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});

  // Initialize and check current URL path
  useEffect(() => {
    const initChat = async () => {
      setLoading(true);
      try {
        let sid = propSessionId;
        if (!sid) {
          sid = localStorage.getItem('payme_chat_session_id') || `chat-${Math.random().toString(36).substring(2, 11)}`;
        }

        const res = await fetch('/api/chats/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: sid,
            language: 'en',
            userName: formName || 'Retail Shopify Merchant',
            userEmail: formEmail || 'merchant.retail@hknet.com'
          })
        });

        if (!res.ok) throw new Error('Failed to retrieve chat session');
        const data: ChatSession = await res.json();
        setSession(data);
        localStorage.setItem('payme_chat_session_id', data.id);
        
        // Match local bot step with server state
        if (data.status === 'bot') {
          if (data.collectedInfo?.name) {
            setFormName(data.collectedInfo.name);
            if (data.collectedInfo?.email) {
              setFormEmail(data.collectedInfo.email);
              if (data.selectedTopic) {
                setFormCategory(data.selectedTopic);
                setBotStep(3); // Details
              } else {
                setBotStep(2); // Category
              }
            } else {
              setBotStep(1); // Email
            }
          } else {
            setBotStep(-1); // Welcome Dashboard
          }
        } else if (data.status === 'pending') {
          setBotStep(4); // Transferring
        }

        setErrorMessage(null);
      } catch (err: any) {
        setErrorMessage('Connecting to secure gateway. Re-routing...');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    initChat();
  }, [propSessionId]);

  // Real-time synchronization polling (3s interval)
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
          
          // Sync bot steps with server state
          if (data.status === 'pending') {
            setBotStep(4);
          }
        }
      } catch (err) {
        console.warn('Real-time synchronization failure:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [session?.id]);

  // Auto-scroll to latest messages (non-intrusive)
  useEffect(() => {
    if (!session) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const currentLength = session.messages?.length || 0;
    const prevLength = prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = currentLength;

    // Check if there are actually new messages
    const hasNewMessage = currentLength > prevLength;

    if (hasNewMessage) {
      const lastMessage = session.messages?.[currentLength - 1];
      const isSentByMe = lastMessage?.sender === 'customer';
      
      // Calculate how close the user is to the bottom
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 250;
      
      // Scroll if it's the customer's own message, they were already near the bottom, or it is the first load
      if (isSentByMe || isNearBottom || prevLength === 0) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (session.agentTyping) {
      // Scroll if the agent is typing and we are near the bottom
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 250;
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (prevLength === 0) {
      // First load scroll to bottom
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [session?.messages, session?.agentTyping, botStep]);

  // Audio Playback Helpers
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
      // Pause any currently playing audio
      if (playingAudioId && audioElementsRef.current[playingAudioId]) {
        audioElementsRef.current[playingAudioId].pause();
      }
      audio.play();
      setPlayingAudioId(msgId);
    }
  };

  // Live Sound Recording Functionality
  const startRecording = async () => {
    try {
      if (session?.voiceNotesAllowed === false) {
        alert('Voice messages are currently disabled by the agent.');
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsRecording(true);
      setIsRecordPaused(false);
      setRecordDuration(0);
      audioChunksRef.current = [];

      // Set up Audio Analyser for dynamic waveform drawing
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      
      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      // Start media recorder
      const options = { mimeType: 'audio/webm' };
      let recorder;
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }
      
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordingBlob(audioBlob);
        
        const reader = new FileReader();
        reader.onloadend = () => {
          setRecordedBase64(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        
        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());
        if (audioCtx.state !== 'closed') audioCtx.close();
      };

      recorder.start(200);

      // Duration counter
      durationIntervalRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);

      // Canvas dynamic visualization loop
      visualizeRecording();
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const visualizeRecording = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!isRecording) return;
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 1.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;
        ctx.fillStyle = `rgba(219, 0, 17, ${0.4 + (barHeight / 120)})`; // Red color matching HSBC brand
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        ctx.fillRect(x, 0, barWidth, barHeight); // symmetrical wave
        x += barWidth + 2;
      }
    };

    draw();
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.pause();
      setIsRecordPaused(true);
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.resume();
      setIsRecordPaused(false);
      durationIntervalRef.current = setInterval(() => {
        setRecordDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecordingAndSend = async (sendImmediately: boolean = true) => {
    setIsRecording(false);
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    if (sendImmediately) {
      // We will wait briefly for reader to complete, then send
      setTimeout(async () => {
        if (recordedBase64 && session) {
          sendVoiceMessage(recordedBase64, recordDuration);
        }
      }, 600);
    }
  };

  const sendVoiceMessage = async (base64: string, durationSec: number) => {
    if (!session) return;
    try {
      const voiceAttachment: Attachment = {
        name: `voice-note-${Date.now()}.webm`,
        type: 'audio/webm',
        data: base64,
        duration: durationSec
      };

      const res = await fetch(`/api/chats/${session.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'customer',
          text: `Voice Note (${durationSec}s)`,
          attachment: voiceAttachment
        })
      });

      if (res.ok) {
        const updated = await res.json();
        setSession(updated);
        setRecordedBase64(null);
        setRecordingBlob(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Complete Bot Steps and Hand off to Specialist
  const handleNextBotStep = async () => {
    if (!session) return;

    if (botStep === 0) {
      if (!formName.trim()) {
        alert('Please enter your name to proceed.');
        return;
      }
      setBotStep(1);
    } else if (botStep === 1) {
      if (!formEmail.trim() || !formEmail.includes('@')) {
        alert('Please enter a valid registered business email.');
        return;
      }
      if (formCategory) {
        setBotStep(3); // Skip category selection if already selected from welcome screen
      } else {
        setBotStep(2);
      }
    } else if (botStep === 2) {
      if (!formCategory) {
        alert('Please select an issue category.');
        return;
      }
      setBotStep(3);
    } else if (botStep === 3) {
      if (!formDesc.trim()) {
        alert('Please provide a brief description of the issue.');
        return;
      }
      
      setBotStep(4); // Animated loading progress

      try {
        // Post details to backend
        const summaryText = `[AI Verification Intake]
Topic: ${formCategory}
Name: ${formName}
Email: ${formEmail}
Transaction ID: ${formTxnId || 'None Provided'}
Reference No: ${formRefNum || 'None Provided'}
Description: ${formDesc}`;

        // Create case status update on server
        await fetch(`/api/chats/${session.id}/topic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: formCategory,
            userName: formName,
            userEmail: formEmail,
            status: 'pending' // queue
          })
        });

        // Send messages
        await fetch(`/api/chats/${session.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: 'customer',
            text: summaryText
          })
        });

        // Trigger bot connection notice
        const res = await fetch(`/api/chats/${session.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sender: 'bot',
            text: 'Your case details have been successfully verified. Your case is now being transferred to an HSBC support specialist. Please wait...'
          })
        });

        if (res.ok) {
          const updated = await res.json();
          setSession(updated);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Text message submission
  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || !session) return;
    if (session.isLocked) return;

    const text = inputMessage;
    setInputMessage('');

    // Set optimistic customerTyping off
    triggerTypingStatus(false);

    try {
      const res = await fetch(`/api/chats/${session.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'customer',
          text
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send');
      }

      const updated = await res.json();
      setSession(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to send message.');
    }
  };

  // Trigger Typing Statuses
  const triggerTypingStatus = async (isTyping: boolean) => {
    if (!session) return;
    try {
      await fetch(`/api/chats/${session.id}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerTyping: isTyping })
      });
    } catch (e) {
      // non-blocking
    }
  };

  // Handle Payment "I Have Paid" Submission
  const handleIHavePaid = async () => {
    if (!session || isSubmittingPayment) return;
    setIsSubmittingPayment(true);
    try {
      // 1. Update payment status on the server
      const payRes = await fetch(`/api/chats/${session.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'Paid',
          notes: 'Customer submitted payment confirmation via Case Center.'
        })
      });
      
      if (!payRes.ok) throw new Error('Payment confirmation failed');

      // 2. Post a chat message from the customer
      const msgRes = await fetch(`/api/chats/${session.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: 'customer',
          text: `I have completed the requested payment of ${session.paymentConfig?.currency || 'HKD'} ${(session.paymentConfig?.amount || 500).toLocaleString('en-US', { minimumFractionDigits: 2 })}. Please verify.`
        })
      });

      if (msgRes.ok) {
        const updated = await msgRes.json();
        setSession(updated);
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting payment confirmation.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // File Upload base64
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !session) return;
    if (session.uploadsMuted) {
      alert('File uploads are currently muted by the administrator.');
      return;
    }

    const file = files[0];
    if (file.size > 15 * 1024 * 1024) {
      alert('File size exceeds the 15MB limit.');
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
            text: `Attachment Shared: ${file.name}`,
            attachment
          })
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error || 'Upload restricted');
        }

        const updated = await res.json();
        setSession(updated);
      } catch (err: any) {
        alert(err.message || 'Failed to send attachment.');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsDataURL(file);
  };

  // Setup static agent info if active or fallback
  const assignedAgent = session?.status === 'active' && session.agentId ? {
    name: session.agentId === 'carmen-lee' ? 'Carmen Lee' : 'Support Specialist',
    avatar: session.agentId === 'carmen-lee' 
      ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face'
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    status: 'online',
    department: session.agentId === 'carmen-lee' ? 'Customer Operations' : 'Merchant Services',
    verified: true
  } : null;

  if (!session || (session.status === 'bot' && botStep === -1)) {
    return (
      <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center p-0 sm:py-6">
        {/* Clean, authentic mobile or full-size desktop portal container */}
        <div 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          className="w-full sm:w-[1170px] sm:max-w-[1170px] min-h-screen sm:min-h-[1100px] sm:max-h-[1100px] bg-[#f9fafc] text-slate-800 font-sans flex flex-col justify-start overflow-y-auto relative sm:rounded-[2.5rem] sm:shadow-[0_30px_70px_rgba(0,0,0,0.18)] antialiased"
        >
          {/* Elegant red gradient header, with proportional compact padding to match the screenshot precisely */}
          <div 
            style={{ background: 'radial-gradient(circle at 80% 20%, #e30a1c 0%, #a80010 45%, #6a0006 80%, #3a0003 100%)' }}
            className="pt-5 pb-12 sm:pt-8 sm:pb-16 px-5 sm:px-12 text-center text-white relative overflow-hidden sm:rounded-t-[2.4rem] shadow-sm shrink-0 w-full sm:h-[740px] flex flex-col justify-between"
          >
            {/* Professional embedded keyframe animations for high-fidelity 3D/5D dynamic background */}
            <style dangerouslySetInnerHTML={{ __html: `
              @keyframes slowDrift {
                0% { transform: translate3d(0, 0, 0) scale(1); }
                50% { transform: translate3d(8px, -5px, 0) scale(1.03); }
                100% { transform: translate3d(0, 0, 0) scale(1); }
              }
              @keyframes pulseGlow {
                0%, 100% { opacity: 0.15; transform: scale(1); }
                50% { opacity: 0.35; transform: scale(1.08); }
              }
              @keyframes meshDrift {
                0% { transform: translate3d(0, 0, 0) rotate(0deg); }
                50% { transform: translate3d(15px, -8px, 0) rotate(0.5deg); }
                100% { transform: translate3d(0, 0, 0) rotate(0deg); }
              }
              @keyframes slowSweep {
                0% { transform: rotate(0deg) scale(1); }
                50% { transform: rotate(1.5deg) scale(1.02); }
                100% { transform: rotate(0deg) scale(1); }
              }
              
              /* 3D Wave layers animations */
              @keyframes waveFlow3D-1 {
                0% { transform: rotateX(55deg) rotateY(-10deg) rotateZ(0deg) translate3d(0, 0, -30px); }
                50% { transform: rotateX(45deg) rotateY(-6deg) rotateZ(3deg) translate3d(-30px, 15px, 10px); }
                100% { transform: rotateX(55deg) rotateY(-10deg) rotateZ(0deg) translate3d(0, 0, -30px); }
              }
              @keyframes waveFlow3D-2 {
                0% { transform: rotateX(42deg) rotateY(15deg) rotateZ(-8deg) translate3d(-40px, 0, 20px); }
                50% { transform: rotateX(50deg) rotateY(10deg) rotateZ(-5deg) translate3d(20px, -20px, 50px); }
                100% { transform: rotateX(42deg) rotateY(15deg) rotateZ(-8deg) translate3d(-40px, 0, 20px); }
              }
              @keyframes waveFlow3D-3 {
                0% { transform: rotateX(62deg) rotateY(0deg) rotateZ(6deg) translate3d(10px, -15px, 80px); }
                50% { transform: rotateX(56deg) rotateY(-5deg) rotateZ(10deg) translate3d(-15px, 10px, 120px); }
                100% { transform: rotateX(62deg) rotateY(0deg) rotateZ(6deg) translate3d(10px, -15px, 80px); }
              }
              
              /* SVG stroke-dash movement for floating energy flow */
              @keyframes dashMove {
                0% { stroke-dashoffset: 1200; }
                100% { stroke-dashoffset: 0; }
              }

              /* 100% Seamless Infinite Horizontal Fluid Water Scroll Animations */
              @keyframes waveFlowLeft {
                0% { transform: translate3d(0, 0, 0); }
                100% { transform: translate3d(-50%, 0, 0); }
              }
              @keyframes waveFlowRight {
                0% { transform: translate3d(-50%, 0, 0); }
                100% { transform: translate3d(0, 0, 0); }
              }
              
              .animate-slow-drift {
                animation: slowDrift 20s ease-in-out infinite;
              }
              .animate-pulse-glow {
                animation: pulseGlow 9s ease-in-out infinite;
              }
              .animate-mesh-drift {
                animation: meshDrift 16s ease-in-out infinite;
              }
              .animate-slow-sweep {
                animation: slowSweep 24s ease-in-out infinite;
              }
              
              /* Liquid Water Wave Selectors */
              .animate-wave-left-slow {
                animation: waveFlowLeft 26s linear infinite;
              }
              .animate-wave-right-medium {
                animation: waveFlowRight 18s linear infinite;
              }
              .animate-wave-left-fast {
                animation: waveFlowLeft 13s linear infinite;
              }
              .animate-wave-right-fastest {
                animation: waveFlowRight 9s linear infinite;
              }
              
              /* 3D Wave selectors */
              .animate-wave-3d-1 {
                animation: waveFlow3D-1 16s ease-in-out infinite, dashMove 40s linear infinite;
                transform-style: preserve-3d;
              }
              .animate-wave-3d-2 {
                animation: waveFlow3D-2 22s ease-in-out infinite, dashMove 55s linear infinite;
                transform-style: preserve-3d;
              }
              .animate-wave-3d-3 {
                animation: waveFlow3D-3 12s ease-in-out infinite, dashMove 30s linear infinite;
                transform-style: preserve-3d;
              }
            ` }} />

            {/* HIGH-FIDELITY LIVE "BIG WATER" LIQUID WAVE SYSTEM (Seamless overlapping flowing waves) */}
            <div className="absolute inset-x-0 bottom-0 top-0 pointer-events-none overflow-hidden select-none z-0">
              
              {/* Layer 1: Back-most deep dark crimson wave (Slow, majestically large) */}
              <div className="absolute inset-x-0 bottom-0 h-[280px] overflow-hidden opacity-60">
                <div className="flex w-[200%] h-full animate-wave-left-slow">
                  <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 0 60 C 300 20, 300 100, 600 60 C 900 20, 900 100, 1200 60 L 1200 120 L 0 120 Z" fill="rgba(110, 0, 6, 0.5)" />
                  </svg>
                  <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 0 60 C 300 20, 300 100, 600 60 C 900 20, 900 100, 1200 60 L 1200 120 L 0 120 Z" fill="rgba(110, 0, 6, 0.5)" />
                  </svg>
                </div>
              </div>

              {/* Layer 2: Middle-back vibrant red wave (Medium speed, opposite direction) */}
              <div className="absolute inset-x-0 bottom-0 h-[230px] overflow-hidden opacity-75">
                <div className="flex w-[200%] h-full animate-wave-right-medium">
                  <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 0 70 C 300 110, 300 30, 600 70 C 900 110, 900 30, 1200 70 L 1200 120 L 0 120 Z" fill="rgba(168, 0, 16, 0.4)" />
                  </svg>
                  <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 0 70 C 300 110, 300 30, 600 70 C 900 110, 900 30, 1200 70 L 1200 120 L 0 120 Z" fill="rgba(168, 0, 16, 0.4)" />
                  </svg>
                </div>
              </div>

              {/* Layer 3: Middle-front lighter glowing red wave (Medium-fast, forward direction) */}
              <div className="absolute inset-x-0 bottom-0 h-[170px] overflow-hidden opacity-85">
                <div className="flex w-[200%] h-full animate-wave-left-fast">
                  <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 0 50 C 300 10, 300 90, 600 50 C 900 10, 900 90, 1200 50 L 1200 120 L 0 120 Z" fill="rgba(227, 10, 28, 0.3)" />
                  </svg>
                  <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 0 50 C 300 10, 300 90, 600 50 C 900 10, 900 90, 1200 50 L 1200 120 L 0 120 Z" fill="rgba(227, 10, 28, 0.3)" />
                  </svg>
                </div>
              </div>

              {/* Layer 4: Front-most translucent sparkling white crest wave (Fastest, opposite direction) */}
              <div className="absolute inset-x-0 bottom-0 h-[120px] overflow-hidden opacity-90">
                <div className="flex w-[200%] h-full animate-wave-right-fastest">
                  <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 0 40 C 300 80, 300 0, 600 40 C 900 80, 900 0, 1200 40 L 1200 120 L 0 120 Z" fill="rgba(255, 255, 255, 0.12)" />
                    <path d="M 0 40 C 300 80, 300 0, 600 40 C 900 80, 900 0, 1200 40" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" fill="none" />
                  </svg>
                  <svg className="w-1/2 h-full shrink-0" viewBox="0 0 1200 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 0 40 C 300 80, 300 0, 600 40 C 900 80, 900 0, 1200 40 L 1200 120 L 0 120 Z" fill="rgba(255, 255, 255, 0.12)" />
                    <path d="M 0 40 C 300 80, 300 0, 600 40 C 900 80, 900 0, 1200 40" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" fill="none" />
                  </svg>
                </div>
              </div>

              {/* High-Fidelity 3D Glowing Wireframe Outline Overlays to preserve digital aesthetic */}
              <div 
                style={{ perspective: '1200px', transformStyle: 'preserve-3d' }}
                className="absolute inset-0 opacity-40 mix-blend-screen"
              >
                <svg className="w-full h-full" viewBox="0 0 1170 740" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="glow-grad-new-1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
                      <stop offset="30%" stopColor="rgba(255, 120, 140, 0.3)" />
                      <stop offset="50%" stopColor="rgba(255, 255, 255, 0.85)" />
                      <stop offset="70%" stopColor="rgba(255, 140, 160, 0.3)" />
                      <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                    </linearGradient>
                    <linearGradient id="glow-grad-new-2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
                      <stop offset="50%" stopColor="rgba(255, 255, 255, 0.6)" />
                      <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                    </linearGradient>
                  </defs>

                  <g className="animate-wave-3d-1" style={{ transformOrigin: 'center center' }}>
                    <path 
                      d="M -200 420 Q 200 240 600 420 T 1400 420 T 2200 420" 
                      stroke="url(#glow-grad-new-1)" 
                      strokeWidth="1.6" 
                      strokeDasharray="400 300"
                      fill="none"
                    />
                  </g>

                  <g className="animate-wave-3d-2" style={{ transformOrigin: 'center center' }}>
                    <path 
                      d="M -200 480 Q 300 290 800 480 T 1800 480 T 2800 480" 
                      stroke="url(#glow-grad-new-2)" 
                      strokeWidth="1.2" 
                      strokeDasharray="500 400"
                      fill="none"
                    />
                  </g>
                </svg>
              </div>

            </div>

            {/* Top Row with Back and Secure Badge (Clean, without capsule box as screenshotted) */}
            <div className="w-full flex justify-between items-center relative z-10 mb-2">
              <button 
                onClick={onBackToHome}
                className="flex items-center gap-1 text-white/95 hover:text-white font-normal text-sm transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-white" strokeWidth={2.5} />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-1.5 text-white/90 text-[11px] sm:text-xs font-normal">
                <Lock className="w-3.5 h-3.5 text-white/90" strokeWidth={1.8} />
                <span>Secure & Confidential</span>
                <span className="w-2 h-2 bg-[#22c55e] rounded-full inline-block shadow-[0_0_6px_rgba(34,197,148,0.8)] animate-pulse" />
              </div>
            </div>

            {/* Logo & Headline with pristine typography matching the original screenshot precisely */}
            <div className="w-full relative z-10 flex flex-col items-center flex-1 justify-center sm:my-auto gap-4 sm:gap-8">
              {/* Large, high-fidelity brand logo as requested */}
              <div className="flex justify-center w-full px-4 overflow-hidden">
                <img 
                  src="https://assets.paymebusinessllc.online/london-site/header.png" 
                  className="w-[82%] max-w-[310px] sm:max-w-[480px] h-auto -my-9 sm:-my-14 object-contain transition-transform duration-500 hover:scale-[1.02]" 
                  alt="PayMe from HSBC"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="flex flex-col items-center gap-1 sm:gap-3">
                <div className="text-[12px] sm:text-[18px] font-light tracking-[0.08em] text-white/95 leading-none mt-1 sm:mt-0 uppercase">
                  Welcome to PayMe Support
                </div>
                <h1 className="text-[23px] sm:text-[42px] font-bold tracking-tight leading-tight mt-2.5 sm:mt-0 text-white">
                  How can we help you today?
                </h1>
                <p className="text-[11.5px] sm:text-[17px] text-white/85 leading-relaxed mt-2.5 sm:mt-0 max-w-[280px] sm:max-w-[620px] mx-auto font-light">
                  Our support team is here to assist you with<br className="sm:hidden" /> any issues or questions.
                </p>
              </div>
            </div>
          </div>

          {/* Scrollable Container with Overlapping Cards */}
          <div className="flex-1 px-5 sm:px-16 relative z-20 -mt-[32px] sm:-mt-[80px] pb-8 sm:pb-16 space-y-6 sm:space-y-8 sm:max-w-[780px] sm:mx-auto w-full">
            
            {!session ? (
              /* Loading Spinner inside a Card */
              <div className="bg-white border border-slate-100 p-12 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-4">
                <RefreshCw className="w-8 h-8 text-[#bd162c] animate-spin" />
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Initializing Secure Gateway...
                </div>
              </div>
            ) : (
              <>
                {/* 1. Chat with a real person Floating Card */}
                <div 
                  onClick={() => setBotStep(0)}
                  className="bg-white border border-slate-100/50 p-4 rounded-[20px] shadow-[0_6px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] hover:translate-y-[-1px] transition-all duration-300 cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-13 h-13 rounded-full bg-[#fef2f2]/80 flex items-center justify-center shrink-0 border border-[#fee2e2]/40 shadow-inner">
                      <Headphones className="w-6.5 h-6.5 text-[#ce1126]" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="text-[14.5px] font-bold text-[#06122c] leading-tight">
                        Chat with a real person
                      </h3>
                      <p className="text-slate-400 text-[11.5px] sm:text-[12px] leading-snug mt-1 font-normal max-w-[210px]">
                        Our support specialists are online and ready to assist you.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]/20 px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1 shrink-0 shadow-xs">
                    <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full" />
                    <span className="text-slate-600 text-[11px] font-medium leading-none">Online</span>
                  </div>
                </div>

                {/* 2. What can we help you with Section */}
                <div className="space-y-4">
                  <div className="pt-1">
                    <h2 className="text-base sm:text-[17px] font-black text-slate-900 tracking-tight leading-none">
                      What can we help you with?
                    </h2>
                    <p className="text-slate-400 text-xs leading-relaxed mt-1.5 font-medium">
                      Please select the issue you need help with.
                    </p>
                  </div>

                  {/* Help Categories Grid (2 Columns as screenshotted) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      {
                        id: 'account',
                        title: 'Account Issues',
                        desc: 'Login, profile, verification',
                        icon: (
                          <div className="w-10 h-10 rounded-full bg-[#fef2f2] flex items-center justify-center border border-[#fee2e2] shrink-0">
                            <User className="w-5 h-5 text-[#bd162c]" />
                          </div>
                        )
                      },
                      {
                        id: 'payment',
                        title: 'Payment Issues',
                        desc: 'Payments, holds, refunds',
                        icon: (
                          <div className="w-10 h-10 rounded-full bg-[#fef2f2] flex items-center justify-center border border-[#fee2e2] shrink-0">
                            <DollarSign className="w-5 h-5 text-[#bd162c]" />
                          </div>
                        )
                      },
                      {
                        id: 'transfer',
                        title: 'Transfer Issues',
                        desc: 'Sending, receiving money',
                        icon: (
                          <div className="w-10 h-10 rounded-full bg-[#fef2f2] flex items-center justify-center border border-[#fee2e2] shrink-0">
                            <ArrowLeftRight className="w-5 h-5 text-[#bd162c]" />
                          </div>
                        )
                      },
                      {
                        id: 'transaction',
                        title: 'Transaction Issues',
                        desc: 'Failed, pending, disputes',
                        icon: (
                          <div className="w-10 h-10 rounded-full bg-[#fef2f2] flex items-center justify-center border border-[#fee2e2] shrink-0">
                            <FileText className="w-5 h-5 text-[#bd162c]" />
                          </div>
                        )
                      },
                      {
                        id: 'security',
                        title: 'Security Issues',
                        desc: 'Fraud, security, privacy',
                        icon: (
                          <div className="w-10 h-10 rounded-full bg-[#fef2f2] flex items-center justify-center border border-[#fee2e2] shrink-0">
                            <Shield className="w-5 h-5 text-[#bd162c]" />
                          </div>
                        )
                      },
                      {
                        id: 'verification',
                        title: 'Verification Issues',
                        desc: 'Identity, documents, KYC',
                        icon: (
                          <div className="w-10 h-10 rounded-full bg-[#fef2f2] flex items-center justify-center border border-[#fee2e2] shrink-0">
                            <FileText className="w-5 h-5 text-[#bd162c]" />
                          </div>
                        )
                      }
                    ].map((cat) => (
                      <div
                        key={cat.id}
                        onClick={() => {
                          setFormCategory(cat.title);
                          setBotStep(0); // starts flow with name input
                        }}
                        className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between gap-3 cursor-pointer hover:border-slate-200 hover:shadow-sm transition-all duration-200 min-w-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {cat.icon}
                          <div className="min-w-0">
                            <div className="text-[13px] font-bold text-slate-900 leading-tight">
                              {cat.title}
                            </div>
                            <div className="text-[10.5px] text-slate-400 font-normal leading-tight mt-1 truncate">
                              {cat.desc}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </div>
                    ))}
                  </div>

                  {/* Other Issues row */}
                  <div 
                    onClick={() => {
                      setFormCategory('Other Issues');
                      setBotStep(0);
                    }}
                    className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:border-slate-200 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#fef2f2] flex items-center justify-center border border-[#fee2e2] shrink-0">
                        <MoreHorizontal className="w-5 h-5 text-[#bd162c]" />
                      </div>
                      <div>
                        <div className="text-[13px] font-black text-slate-900 leading-none">
                          Other Issues
                        </div>
                        <div className="text-[10.5px] text-slate-450 font-medium mt-1.5">
                          Something else
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-350 shrink-0" />
                  </div>

                </div>

                {/* Bottom Security Info Widget */}
                <div className="bg-slate-50 border border-slate-100/80 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-slate-100 shrink-0 shadow-sm">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800 leading-tight">Your conversation is secure and encrypted</div>
                    <p className="text-[10px] text-slate-400 font-medium mt-1 leading-normal">We protect your privacy and data at all times.</p>
                  </div>
                </div>
              </>
            )}

            {/* Footer */}
            <div className="text-center text-[10.5px] text-slate-400 pt-2 pb-4 font-semibold shrink-0">
              Powered by PayMe from HSBC
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#f4f5f7] text-slate-800 font-sans flex flex-col justify-between overflow-x-hidden antialiased">
      
      {/* 2. Top Navigation Bar (HSBC Brand Header) */}
      <header className="relative z-10 bg-gradient-to-r from-[#bd162c] via-[#9c001a] to-[#800010] border-b border-rose-950 px-4 py-3.5 sm:px-8 flex justify-between items-center shrink-0 shadow-md">
        <div className="flex items-center gap-4 sm:gap-6">
          <button 
            onClick={onBackToHome}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
            title="Back to PayMe"
          >
            <ChevronDown className="w-5 h-5 text-white/80 hover:text-white transform rotate-90" />
          </button>
          
          <div className="flex items-center gap-3">
            {/* PayMe Red Circular Logo & HSBC Text */}
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <svg viewBox="0 0 32 32" className="w-5 h-5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="15" fill="#DB0011" />
                    <path d="M16 6C21.5228 6 26 10.4772 26 16C26 21.5228 21.5228 26 16 26C10.4772 26 6 21.5228 6 16C6 12.5 7.8 9.5 10.5 7.8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M16 10C19.3137 10 22 12.6863 22 16C22 19.3137 19.3137 22 16 22C12.6863 22 10 19.3137 10 16C10 14 11.2 12.2 12.8 11.2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M16 13C17.6569 13 19 14.3431 19 16C19 17.6569 17.6569 19 16 19C14.3431 19 13 17.6569 13 16C13 15 13.8 14.2 14.5 13.8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="font-bold tracking-tight text-white">PayMe</span>
              </span>
              <span className="text-white/60 text-[10px] font-medium px-1">from</span>
              <span className="text-sm font-bold text-white flex items-center gap-1.5">
                <svg viewBox="0 0 54 41" className="h-4 w-auto shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 20.5L13.5 7 L13.5 34 Z" fill="white"/>
                  <path d="M54 20.5L40.5 7 L40.5 34 Z" fill="white"/>
                  <path d="M27 20.5L13.5 7 H40.5 L27 20.5 Z" fill="white"/>
                  <path d="M27 20.5L13.5 34 H40.5 L27 20.5 Z" fill="white"/>
                </svg>
                <span className="font-extrabold tracking-wide">HSBC</span>
              </span>
            </div>
          </div>
        </div>

        {/* Connection Security Status */}
        <div className="flex items-center gap-4.5">
          <div className="flex items-center gap-2 bg-white/10 px-3.5 py-1.5 rounded-full border border-white/15 text-xs text-white">
            <Lock className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline font-medium">Secure & Confidential</span>
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          </div>

          <button 
            onClick={onBackToHome}
            className="text-xs bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-full transition-colors font-medium border border-white/20"
          >
            Exit Portal
          </button>
        </div>
      </header>

      {/* 3. Main Workspace Area */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto flex flex-col lg:flex-row overflow-hidden bg-white shadow-lg lg:my-4 lg:rounded-3xl lg:border lg:border-slate-100">
        
        {/* LEFT COLUMN: Support Side Details (HSBC Intercom Style) */}
        <div className="hidden lg:flex w-80 flex-col bg-[#9c001a] text-white p-6 justify-between shrink-0">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                  <svg viewBox="0 0 32 32" className="w-5 h-5 shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="15" fill="#DB0011" />
                    <path d="M16 6C21.5228 6 26 10.4772 26 16C26 21.5228 21.5228 26 16 26C10.4772 26 6 21.5228 6 16C6 12.5 7.8 9.5 10.5 7.8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M16 10C19.3137 10 22 12.6863 22 16C22 19.3137 19.3137 22 16 22C12.6863 22 10 19.3137 10 16C10 14 11.2 12.2 12.8 11.2" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M16 13C17.6569 13 19 14.3431 19 16C19 17.6569 17.6569 19 16 19C14.3431 19 13 17.6569 13 16C13 15 13.8 14.2 14.5 13.8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="font-extrabold text-sm tracking-wide">PayMe from HSBC</span>
              </div>
              <h4 className="text-[11px] font-bold text-red-300 tracking-widest uppercase mt-4 mb-1">Live Chat Support</h4>
              <h2 className="text-2xl font-black text-white tracking-tight leading-tight">We're here to help</h2>
              <span className="inline-block w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse mt-2" />
            </div>

            {/* Conversation Secure details box */}
            <div className="bg-white/10 p-4 rounded-2xl border border-white/15 space-y-3 text-xs leading-relaxed">
              <div className="flex items-center gap-2 text-white font-bold">
                <Shield className="w-4 h-4 text-white" />
                <span>Secure & Encrypted</span>
              </div>
              <p className="text-white/80 text-[11px]">
                Your conversation is secured end-to-end. All data is protected with enterprise-grade security protocols.
              </p>
            </div>

            {/* Chat Topic box */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold text-white/55 uppercase tracking-wider">Chat Topic</div>
              <div className="bg-white/5 border border-white/10 p-3 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-white/60">Selected Category</div>
                  <div className="text-xs font-bold text-white truncate max-w-[160px]">
                    {session?.selectedTopic || formCategory || 'Payment Issue'}
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => { localStorage.removeItem('payme_chat_session_id'); window.location.reload(); }}
                  className="px-2.5 py-1 bg-red-800 hover:bg-red-900 border border-red-700 rounded-lg text-[10px] font-bold text-white transition-colors"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Agent Support Specialist Panel */}
            <div className="pt-2">
              <div className="text-[10px] font-bold text-white/55 uppercase tracking-wider mb-3">Agent Group</div>
              
              <div className="flex items-center gap-3">
                {/* Stacked avatars */}
                <div className="flex -space-x-2.5 overflow-hidden">
                  <img className="inline-block h-8 w-8 rounded-full ring-2 ring-[#9c001a] object-cover" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&h=100&fit=crop&crop=face" referrerPolicy="no-referrer" />
                  <img className="inline-block h-8 w-8 rounded-full ring-2 ring-[#9c001a] object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face" referrerPolicy="no-referrer" />
                  <img className="inline-block h-8 w-8 rounded-full ring-2 ring-[#9c001a] object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" referrerPolicy="no-referrer" />
                  <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-800 ring-2 ring-[#9c001a] text-[10px] font-bold text-white">
                    +12
                  </div>
                </div>
                
                <div>
                  <div className="text-xs font-bold text-white">Support team is available</div>
                  <div className="text-[10px] text-red-200 mt-0.5">Average wait: <span className="font-bold text-emerald-300">Under 1 minute</span></div>
                </div>
              </div>

              <div className="text-[10.5px] text-white/70 mt-4 leading-relaxed">
                Real humans. Real support. <br />
                <span className="font-semibold text-white">7:00 AM – 11:00 PM (HKT)</span>
              </div>
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className="pt-4 border-t border-white/10 text-center text-[10px] text-white/50">
            Powered by PayMe from HSBC
          </div>
        </div>

        {/* MIDDLE COLUMN: Customer Chat Screen */}
        <div className="flex-1 flex flex-col bg-[#fdfdfd] overflow-hidden">
          
          {/* A. Persistent Agent Header bar */}
          <div className="bg-white border-b border-slate-100 px-6 py-4 flex justify-between items-center shrink-0 shadow-sm relative z-20">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={assignedAgent?.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face"} 
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 shadow-sm" 
                  referrerPolicy="no-referrer" 
                />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900 text-[15px]">{assignedAgent?.name || 'Carmen Lee'}</span>
                  {/* Verified checkmark badge in red */}
                  <span className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-red-600 text-white text-[10px] font-black" title="Verified Agent">
                    ✓
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                  <span>{assignedAgent?.department || 'Customer Support Specialist'}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    Online
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button 
                type="button"
                onClick={() => setIsCasePanelExpanded(!isCasePanelExpanded)}
                className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
                title="Options"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              <button 
                type="button"
                onClick={onBackToHome}
                className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                End Chat
              </button>
            </div>
          </div>

          {/* Action Required Banner */}
          {session && session.status === 'active' && session.paymentConfig?.enabled && (
            <div className="bg-[#fff8f2] border-b border-[#ffe0cc] px-6 py-3 flex justify-between items-center text-xs text-[#9a4d00] shrink-0 font-medium animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-xs shrink-0">
                  !
                </span>
                <div className="leading-relaxed">
                  <span className="font-bold">Action required:</span> Additional payment is required to continue processing your transaction.
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsRightSidebarOpen(true)}
                className="text-[#bd162c] hover:underline font-extrabold shrink-0 ml-4"
              >
                View Details
              </button>
            </div>
          )}

          {/* Case Status pink accordion block (Collapsible) */}
          {session && session.status === 'active' && (
            <div className="px-6 pt-4 bg-[#fdfdfd]">
              <div 
                className="p-4 bg-[#fff2f3] border border-[#ffd6d8] rounded-2xl flex justify-between items-center cursor-pointer hover:bg-[#ffe5e7] transition-all duration-200 shadow-sm"
                onClick={() => setIsCasePanelExpanded(!isCasePanelExpanded)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl border border-red-100 bg-white flex items-center justify-center shadow-sm shrink-0">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-extrabold text-red-500">Case Status</div>
                    <div className="text-[14px] font-black text-[#bd162c] flex items-center gap-1.5 leading-tight mt-0.5">
                      {session.timelineProgress === 3 ? 'Payment On Hold' :
                       session.timelineProgress === 4 ? 'Refund Verification' :
                       session.timelineProgress === 5 ? 'Pending Approval' :
                       session.timelineProgress === 6 ? 'Completed' : 'Under Review'}
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                    </div>
                    <div className="text-[10.5px] text-slate-500 font-mono mt-0.5">Case ID: {session.caseId}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isCasePanelExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Case Panel Drawer */}
              <AnimatePresence>
                {isCasePanelExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden bg-white border border-slate-100 rounded-2xl p-5 mt-3 shadow-md text-slate-700"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                      <div className="space-y-4">
                        <div>
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Case Metadata</h5>
                          <div className="space-y-1.5 text-xs text-slate-600">
                            <p>ID: <span className="font-mono text-slate-800 font-semibold">{session.caseId}</span></p>
                            <p>Assigned Expert: <span className="text-slate-800 font-semibold">{assignedAgent?.name || 'Assigned Specialist'}</span></p>
                            <p>Department: <span className="text-slate-800 font-semibold">{assignedAgent?.department || 'Customer Operations'}</span></p>
                            <p>Last Synced: <span className="text-slate-800 font-semibold">{new Date(session.createdAt).toLocaleTimeString()}</span></p>
                          </div>
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Reference Info</h5>
                          <div className="space-y-1.5 text-xs text-slate-600">
                            <p>Merchant Name: <span className="text-slate-800 font-semibold">{session.userName}</span></p>
                            <p>Email: <span className="text-slate-800 font-semibold">{session.userEmail}</span></p>
                            <p>Transaction ID: <span className="font-mono text-slate-800 font-semibold">{session.collectedInfo?.transactionId || 'None'}</span></p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Instructions</h5>
                        {session.instructions.length === 0 ? (
                          <div className="text-xs text-slate-400 italic">No specific actions requested by the agent yet.</div>
                        ) : (
                          <div className="space-y-2">
                            {session.instructions.map((inst) => (
                              <div key={inst.id} className="p-3 rounded-xl bg-[#fbfbfc] border border-slate-100 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                                <div>
                                  <div className="text-xs font-bold text-slate-800">{inst.title}</div>
                                  <p className="text-[10.5px] text-slate-500 mt-0.5">{inst.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Timeline Milestones</h5>
                        <div className="space-y-2 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span>Intake Received</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${session.timelineProgress >= 2 ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span>Under Review</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${session.timelineProgress >= 3 ? 'bg-red-500 animate-pulse' : 'bg-slate-300'}`} />
                            <span>Security / Verification Hold</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* B. Conversation Log Box */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 space-y-6">
                   {/* BOT MODE: intake onboarding widgets */}
            {session && session.status === 'bot' && (
              <div className="max-w-2xl mx-auto space-y-6 py-4">
                
                {/* Onboarding Welcome Header Card */}
                <div className="bg-[#fff2f3] border border-[#ffd6d8] p-6 sm:p-8 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <span className="px-3 py-1 bg-[#bd162c] text-[11px] font-bold text-white rounded-full uppercase tracking-wider">
                      Intake Desk
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                      <Lock className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> Secure Connection
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                    PayMe Enterprise Support Portal
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Welcome to the HSBC customer operations and clearing queue. Please provide the required information below so we can routing your ticket directly to the assigned settlement supervisor.
                  </p>
                  
                  {/* Step Progress Line */}
                  <div className="pt-2 flex items-center gap-1.5">
                    {[0, 1, 2, 3].map((stepIdx) => (
                      <div 
                        key={stepIdx} 
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          botStep > stepIdx ? 'bg-emerald-500' : botStep === stepIdx ? 'bg-[#bd162c] w-1/3' : 'bg-slate-200'
                        }`} 
                      />
                    ))}
                  </div>
                </div>

                {/* Animated Intake Input Sections */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm">
                  {botStep === 0 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Full Name / Merchant Title
                      </label>
                      <input 
                        type="text" 
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g., Ka Hing Wong" 
                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors text-sm"
                      />
                      <p className="text-[11px] text-slate-400">Provide your verified registered bank holder name.</p>
                      
                      <div className="flex gap-3 mt-4">
                        <button 
                          onClick={() => setBotStep(-1)}
                          className="flex-1 h-11 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-medium transition-colors"
                        >
                          Back
                        </button>
                        <button 
                          onClick={handleNextBotStep}
                          className="flex-1 h-11 bg-[#bd162c] hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                        >
                          Continue
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {botStep === 1 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div className="text-xs text-red-600 font-extrabold tracking-wider mb-2">Hello, {formName}</div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Registered Business Email
                      </label>
                      <input 
                        type="email" 
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
                        placeholder="e.g., merchant@company.com" 
                        className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors text-sm"
                      />
                      <p className="text-[11px] text-slate-400">We will verify your system authorization via this address.</p>
                      
                      <div className="flex gap-3 mt-4">
                        <button 
                          onClick={() => setBotStep(0)}
                          className="flex-1 h-11 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-medium transition-colors"
                        >
                          Back
                        </button>
                        <button 
                          onClick={handleNextBotStep}
                          className="flex-1 h-11 bg-[#bd162c] hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
                        >
                          Continue
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {botStep === 2 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Select Issue Category
                      </label>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {[
                          'Account Issues', 'Payment Issues', 'Transfer Issues', 
                          'Transaction Verification', 'Refund Issues', 'Business Account', 
                          'Identity Verification', 'Technical Support', 'Security Review', 'Other'
                        ].map((cat) => (
                          <button
                            key={cat}
                            onClick={() => {
                              setFormCategory(cat);
                              setBotStep(3);
                            }}
                            className={`p-4 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between ${
                              formCategory === cat 
                                ? 'bg-[#fff2f3] border-[#ffd6d8] text-[#bd162c]' 
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <span>{cat}</span>
                            <span className={`w-2 h-2 rounded-full ${formCategory === cat ? 'bg-red-600' : 'bg-slate-300'}`} />
                          </button>
                        ))}
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button 
                          onClick={() => setBotStep(1)}
                          className="w-full h-11 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-medium transition-colors"
                        >
                          Back
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {botStep === 3 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                      <div className="text-xs text-[#bd162c] font-black tracking-wider mb-1">Issue: {formCategory}</div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Transaction ID (Optional)
                          </label>
                          <input 
                            type="text" 
                            value={formTxnId}
                            onChange={(e) => setFormTxnId(e.target.value)}
                            placeholder="e.g. PM-HK-20240517-0012" 
                            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 transition-colors text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Reference Number (Optional)
                          </label>
                          <input 
                            type="text" 
                            value={formRefNum}
                            onChange={(e) => setFormRefNum(e.target.value)}
                            placeholder="e.g. REF-2026-A91" 
                            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 transition-colors text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                          Describe your issue in detail
                        </label>
                        <textarea 
                          rows={3}
                          value={formDesc}
                          onChange={(e) => setFormDesc(e.target.value)}
                          placeholder="Please clarify details about disputed deposits or hold constraints..." 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 transition-colors text-xs resize-none"
                        />
                      </div>

                      {/* Attachments optional selector */}
                      <div className="p-3 border border-dashed border-slate-200 rounded-xl flex items-center justify-between text-xs bg-slate-50">
                        <span className="text-slate-500">Share documents or receipts</span>
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-600 font-bold transition-colors shadow-sm"
                        >
                          Choose File
                        </button>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <button 
                          onClick={() => setBotStep(2)}
                          className="flex-1 h-11 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-medium transition-colors"
                        >
                          Back
                        </button>
                        <button 
                          onClick={handleNextBotStep}
                          className="flex-1 h-11 bg-[#bd162c] hover:bg-rose-700 text-white rounded-xl text-sm font-bold transition-colors shadow-md"
                        >
                          Submit Ticket
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* PENDING MODE (Queue state before human accepts) */}
            {session && session.status === 'pending' && (
              <div className="max-w-md mx-auto space-y-8 py-8 flex flex-col items-center text-center">
                
                {/* Custom glowing sphere loading animation */}
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-red-500/10 border-2 border-dashed border-[#bd162c] animate-spin" style={{ animationDuration: '8s' }} />
                  <div className="absolute inset-2 rounded-full bg-red-500/5 border border-[#bd162c]/20 animate-pulse" />
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#bd162c] to-[#9c001a] shadow-lg flex items-center justify-center text-white">
                    <Clock className="w-6 h-6 animate-spin" style={{ animationDuration: '4s' }} />
                  </div>
                </div>

                <div className="space-y-3.5">
                  <span className="px-3.5 py-1 bg-[#fff2f3] border border-[#ffd6d8] text-[11px] font-extrabold text-[#bd162c] rounded-full tracking-widest uppercase">
                    Queue Ticket Active
                  </span>
                  <h3 className="text-xl font-black text-slate-950 tracking-tight">Waiting for Agent Connection</h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm font-medium">
                    Your details have been successfully checked. We are matching your inquiry with a qualified compliance officer. Please do not close this window.
                  </p>
                </div>

                {/* Queue status metrics card */}
                <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 text-left grid grid-cols-2 gap-4 divide-x divide-slate-100 shadow-sm">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Queue Position</div>
                    <div className="text-lg font-extrabold text-slate-900 mt-1 font-mono">1st in line</div>
                  </div>
                  <div className="pl-4">
                    <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Est. Wait Time</div>
                    <div className="text-lg font-extrabold text-emerald-600 mt-1 font-mono">&lt; 1 minute</div>
                  </div>
                </div>

                {/* Secure Badge footer */}
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verified Security Clearance ID: <span className="font-mono">{session.caseId}</span></span>
                </div>
              </div>
            )}

            {/* ACTIVE/RESOLVED CHAT LOGS */}
            {session && (session.status === 'active' || session.status === 'resolved') && (
              <div className="space-y-5">
                
                {/* Connecting Notice */}
                <div className="flex justify-center my-4">
                  <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200/60 px-4 py-2 rounded-full text-[11px] text-slate-500 font-medium">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Secure end-to-end conversation is active (ID: {session.caseId})</span>
                  </div>
                </div>

                {/* Message items loop */}
                {session.messages.map((msg) => {
                  const isCustomer = msg.sender === 'customer';
                  const isBot = msg.sender === 'bot';
                  const isSystem = msg.sender === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-2.5">
                        <span className="bg-slate-100 text-[11px] text-slate-500 px-3.5 py-1.5 rounded-full border border-slate-200">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex gap-3 max-w-[85%] ${isCustomer ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      {/* Avatar */}
                      {!isCustomer && (
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 shrink-0 overflow-hidden shadow-sm">
                          {isBot ? (
                            <div className="w-full h-full bg-red-50 flex items-center justify-center text-[10px] font-black text-[#bd162c]">
                              AI
                            </div>
                          ) : (
                            <img src={assignedAgent?.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          )}
                        </div>
                      )}

                      {/* Bubble content */}
                      <div>
                        {/* Sender Label */}
                        <div className={`text-[10px] font-semibold text-slate-400 mb-1 ${isCustomer ? 'text-right' : 'text-left'}`}>
                          {isCustomer ? 'You (Merchant)' : isBot ? 'Support Assistant (AI)' : msg.agentName || 'Agent'}
                        </div>

                        {/* Text bubble */}
                        <div 
                          className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-[13px] leading-relaxed shadow-sm ${
                            isCustomer 
                              ? 'bg-[#bd162c] text-white rounded-tr-none' 
                              : 'bg-slate-100 text-slate-800 border border-slate-200/60 rounded-tl-none'
                          }`}
                        >
                          {/* Markdown parsing or raw replacement */}
                          <p className="whitespace-pre-line">{msg.text}</p>

                          {/* Voice Note attachment styling */}
                          {msg.attachment && msg.attachment.type.startsWith('audio/') && (
                            <div className={`mt-3.5 rounded-xl p-3 border flex items-center gap-3 w-56 shadow-sm ${
                              isCustomer 
                                ? 'bg-[#9c001a] border-red-800 text-white' 
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}>
                              <button
                                onClick={() => msg.attachment && handleAudioPlayPause(msg.id, msg.attachment.data)}
                                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                  isCustomer 
                                    ? 'bg-white text-[#bd162c] hover:bg-slate-100' 
                                    : 'bg-[#bd162c] text-white hover:bg-rose-700'
                                }`}
                              >
                                {playingAudioId === msg.id ? <Pause className="w-4.5 h-4.5 fill-current" /> : <Play className="w-4.5 h-4.5 fill-current translate-x-0.5" />}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-bold">Voice Message</div>
                                <div className={`text-[10px] mt-0.5 ${isCustomer ? 'text-white/70' : 'text-slate-400'}`}>
                                  {audioCurrentTimes[msg.id] 
                                    ? `${Math.floor(audioCurrentTimes[msg.id])}s / ${msg.attachment.duration || Math.floor(audioDurations[msg.id] || 0)}s`
                                    : `${msg.attachment.duration || '0'}s`}
                                </div>
                              </div>
                              <a 
                                href={msg.attachment.data} 
                                download={msg.attachment.name}
                                className={`p-1 transition-colors ${isCustomer ? 'text-white/65 hover:text-white' : 'text-slate-400'}`}
                                title="Download Audio File"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          )}

                          {/* Document/File attachment styling */}
                          {msg.attachment && !msg.attachment.type.startsWith('audio/') && (
                            <div className={`mt-3.5 border rounded-xl p-3 flex items-center justify-between gap-3 max-w-sm shadow-sm ${
                              isCustomer 
                                ? 'bg-[#9c001a] border-red-800 text-white' 
                                : 'bg-white border-slate-200 text-slate-800'
                            }`}>
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${
                                  isCustomer ? 'bg-white/10 border-white/20' : 'bg-red-50 border-red-100'
                                }`}>
                                  <FileText className={`w-4.5 h-4.5 ${isCustomer ? 'text-white' : 'text-[#bd162c]'}`} />
                                </div>
                                <div className="min-w-0">
                                  <div className="text-xs font-bold truncate">{msg.attachment.name}</div>
                                  <div className={`text-[9.5px] uppercase mt-0.5 ${isCustomer ? 'text-white/70' : 'text-slate-400'}`}>
                                    {msg.attachment.type.split('/')[1] || 'document'}
                                  </div>
                                </div>
                              </div>
                              <a 
                                href={msg.attachment.data} 
                                download={msg.attachment.name}
                                className={`p-1 ${isCustomer ? 'text-white/70 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          )}
                        </div>

                        {/* Timestamp & read receipt */}
                        <div className={`flex items-center gap-1.5 mt-1.5 ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isCustomer && (
                            <CheckCheck className={`w-3.5 h-3.5 ${msg.status === 'seen' ? 'text-red-600' : 'text-slate-300'}`} />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Active Live Agent Typing state */}
                {session.agentTyping && (
                  <div className="flex gap-3 mr-auto items-center">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm">
                      <img src={assignedAgent?.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="bg-slate-100 p-3 px-4 rounded-full border border-slate-200/60 flex items-center gap-1 shadow-sm">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* C. Input Control Panel (Text, Voice, Attachment) */}
          {session && (session.status === 'active' || session.status === 'resolved') && (
            <footer className="relative z-10 border-t border-slate-100 bg-white p-4 shrink-0">
              {session.status === 'resolved' ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center text-xs text-slate-500">
                  This conversation has been closed and archived. Click <button onClick={() => { localStorage.removeItem('payme_chat_session_id'); window.location.reload(); }} className="text-[#bd162c] underline font-bold">here</button> to open a new support ticket.
                </div>
              ) : session.isLocked ? (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4 text-red-500" />
                  <span>Your chat privileges have been locked by the agent. Please wait for the agent to unlock.</span>
                </div>
              ) : (
                <form onSubmit={handleSendText} className="space-y-3">
                  
                  {/* Recording Widget overlay bar */}
                  {isRecording && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-slate-700 font-mono">
                          Recording: {Math.floor(recordDuration / 60)}:{(recordDuration % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      
                      {/* Dynamic canvas audio wave display */}
                      <canvas ref={canvasRef} width={200} height={32} className="h-8 max-w-[150px] sm:max-w-[200px] bg-white rounded-lg border border-slate-200" />

                      <div className="flex items-center gap-2">
                        {isRecordPaused ? (
                          <button 
                            type="button" 
                            onClick={resumeRecording}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 rounded text-white"
                            title="Resume Recording"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        ) : (
                          <button 
                            type="button" 
                            onClick={pauseRecording}
                            className="p-1.5 bg-amber-500 hover:bg-amber-600 rounded text-white"
                            title="Pause Recording"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          type="button" 
                          onClick={() => stopRecordingAndSend(true)}
                          className="px-3 py-1.5 bg-[#bd162c] hover:bg-rose-700 text-white rounded text-xs font-bold"
                        >
                          Send Voice
                        </button>
                        <button 
                          type="button" 
                          onClick={() => { setIsRecording(false); if (mediaRecorderRef.current) mediaRecorderRef.current.stop(); }}
                          className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {/* Add attachment trigger */}
                    <button
                      type="button"
                      disabled={session.uploadsMuted}
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-3 bg-slate-50 border rounded-xl transition-colors shrink-0 ${
                        session.uploadsMuted 
                          ? 'border-slate-100 text-slate-300 cursor-not-allowed' 
                          : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                      title={session.uploadsMuted ? 'Uploads disabled by Agent' : 'Share File/PDF/Image'}
                    >
                      <Paperclip className="w-5 h-5" />
                    </button>

                    {/* Microphone trigger */}
                    <button
                      type="button"
                      disabled={session.voiceNotesAllowed === false}
                      onClick={startRecording}
                      className={`p-3 bg-slate-50 border rounded-xl transition-colors shrink-0 ${
                        session.voiceNotesAllowed === false
                          ? 'border-slate-100 text-slate-300 cursor-not-allowed'
                          : 'border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                      title={session.voiceNotesAllowed === false ? 'Voice messages disabled by Agent' : 'Record voice note'}
                    >
                      <Mic className="w-5 h-5" />
                    </button>

                    {/* Hidden file input */}
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden" 
                      accept="image/*,application/pdf,application/msword,text/*"
                    />

                    {/* Input message text field */}
                    <input 
                      type="text"
                      value={inputMessage}
                      onChange={(e) => {
                        setInputMessage(e.target.value);
                        triggerTypingStatus(e.target.value.length > 0);
                      }}
                      onBlur={() => triggerTypingStatus(false)}
                      placeholder="Type your message here..."
                      className="flex-1 h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-colors"
                    />

                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className={`p-3.5 rounded-xl text-white shrink-0 transition-colors shadow-sm ${
                        inputMessage.trim() 
                          ? 'bg-[#bd162c] hover:bg-rose-700 font-bold' 
                          : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      <Send className="w-4.5 h-4.5" />
                    </button>
                  </div>
                  
                  {isUploading && (
                    <div className="flex items-center gap-2 text-xs text-red-600 font-semibold animate-pulse">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending secure file payload...</span>
                    </div>
                  )}
                </form>
              )}
            </footer>
          )}
        </div>

        {/* RIGHT COLUMN: Interactive Case Center Sidebar (Only visible once Active/Accepted) */}
        {session && (session.status === 'active' || session.status === 'resolved') && (
          <div className="w-80 border-l border-slate-100 bg-[#f9fafc] flex flex-col overflow-y-auto shrink-0 divide-y divide-slate-100">
            
            {/* Widget 1: Case Center Header */}
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Case Center</h3>
                <span className="text-[10px] bg-[#fff2f3] border border-[#ffd6d8] text-[#bd162c] px-2.5 py-1 rounded-full font-bold">
                  Active Security Hold
                </span>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Case ID</span>
                  <span className="font-mono font-bold text-slate-800">{session.caseId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="text-red-600 font-extrabold">
                    {session.timelineProgress === 3 ? 'Payment On Hold' :
                     session.timelineProgress === 4 ? 'Refund Verification' :
                     session.timelineProgress === 5 ? 'Pending Approval' :
                     session.timelineProgress === 6 ? 'Completed' : 'Under Review'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Synced</span>
                  <span className="text-slate-850 font-semibold">Active now</span>
                </div>
              </div>
            </div>

            {/* Widget 2: Case Progress Live Timeline */}
            <div className="p-5 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Case Progress</h3>
              
              {/* Vertical Timeline Stepper */}
              <div className="relative pl-5 space-y-6 text-xs text-slate-600">
                <div className="absolute top-1 left-2.5 bottom-1 w-0.5 bg-slate-100" />

                {[
                  { step: 1, label: 'Received' },
                  { step: 2, label: 'Under Review' },
                  { step: 3, label: 'On Hold' },
                  { step: 4, label: 'Refund Verification' },
                  { step: 5, label: 'Pending Approval' },
                  { step: 6, label: 'Completed' }
                ].map((item) => {
                  const isActive = session.timelineProgress === item.step;
                  const isCompleted = session.timelineProgress > item.step;

                  return (
                    <div key={item.step} className="relative flex items-center gap-3">
                      {/* Timeline dot */}
                      <span className={`absolute left-[-15px] w-3 h-3 rounded-full border-2 transition-all ${
                        isCompleted 
                          ? 'bg-emerald-500 border-emerald-500 shadow' 
                          : isActive 
                            ? 'bg-red-600 border-red-600 animate-pulse shadow shadow-red-200' 
                            : 'bg-white border-slate-200'
                      }`} />
                      
                      <div className="min-w-0">
                        <div className={`font-bold transition-colors ${
                          isCompleted ? 'text-slate-500' : isActive ? 'text-red-600 font-extrabold' : 'text-slate-300'
                        }`}>
                          {item.label}
                        </div>
                        {isActive && (
                          <div className="text-[10px] text-slate-400 mt-0.5 font-medium">
                            Compliance action active...
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Widget 3: Collapsible Payment Section (Initially Hidden / Active if enabled) */}
            {session.paymentConfig?.enabled && (
              <div className="p-5 space-y-4 bg-[#fff2f3]/55">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                  <h3 className="text-xs font-black text-red-700 uppercase tracking-widest">Payment Request</h3>
                </div>

                <div className="p-4 rounded-xl bg-white border border-[#ffd6d8] space-y-3 shadow-sm">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Amount Required</span>
                    <span className="text-base font-black text-red-600 font-mono">
                      {session.paymentConfig.currency} {session.paymentConfig.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs border-t border-slate-100 pt-2.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Reference</span>
                      <span className="font-mono text-[11px] text-slate-800 font-bold truncate max-w-[120px]">{session.paymentConfig.reference || session.caseId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Deadline</span>
                      <span className="text-slate-800 font-mono text-[11px] font-bold">{session.paymentConfig.deadline || 'Immediate'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Payment Status</span>
                      <span className="px-2 py-0.5 bg-[#fff2f3] text-red-600 rounded-full font-bold text-[10px] border border-[#ffd6d8]">
                        {session.paymentConfig.status}
                      </span>
                    </div>
                  </div>

                  {session.paymentConfig.notes && (
                    <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-100 pt-2">
                      {session.paymentConfig.notes}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Widget 4: Requested Instructions */}
            <div className="p-5 space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Requested Actions</h3>
              
              {session.instructions.length === 0 ? (
                <div className="text-xs text-slate-400 italic p-3 rounded-xl border border-slate-100 bg-white">
                  No pending documentation requests from agent.
                </div>
              ) : (
                <div className="space-y-3">
                  {session.instructions.map((inst) => (
                    <div 
                      key={inst.id} 
                      className={`p-4 rounded-xl border transition-all ${
                        inst.status === 'completed'
                          ? 'bg-slate-50 border-slate-100 opacity-60'
                          : 'bg-white border-slate-200 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100 uppercase tracking-wider">
                          {inst.category}
                        </span>
                        {inst.status === 'completed' && (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-slate-800 mt-2.5">{inst.title}</div>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{inst.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* Footer copyright */}
      <footer className="relative z-10 py-3.5 bg-white border-t border-slate-100 text-center text-[10px] text-slate-400 shrink-0 font-medium">
        Powered by PayMe Support & HSBC Merchant Operations • Secure Connection SSL Active
      </footer>

    </div>
  );
}
