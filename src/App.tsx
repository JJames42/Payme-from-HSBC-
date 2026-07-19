import { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage.tsx';
import LiveChat from './components/LiveChat.tsx';
import AdminDashboard from './components/AdminDashboard.tsx';

export default function App() {
  const [view, setView] = useState<'home' | 'chat' | 'admin'>('home');
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const handleUrlChange = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('admin') === 'true') {
          setView('admin');
        } else if (params.get('chat') === 'true' || params.get('channel')) {
          setView('chat');
          const channel = params.get('channel');
          if (channel) {
            setSessionId(channel);
          }
        } else {
          setView('home');
        }
      } catch (error) {
        console.warn('Failed to parse URL search parameters on load:', error);
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  const navigateTo = (newView: 'home' | 'chat' | 'admin') => {
    setView(newView);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('chat');
      url.searchParams.delete('admin');
      url.searchParams.delete('channel');

      if (newView === 'chat') {
        url.searchParams.set('chat', 'true');
      } else if (newView === 'admin') {
        url.searchParams.set('admin', 'true');
      }

      window.history.pushState({}, '', url.toString());
    } catch (error) {
      console.warn('window.history.pushState failed or blocked inside iframe:', error);
    }
  };

  return (
    <div className="w-full min-h-screen bg-white">
      {view === 'home' && (
        <LandingPage onOpenChat={() => navigateTo('chat')} />
      )}
      {view === 'chat' && (
        <LiveChat onBackToHome={() => navigateTo('home')} sessionId={sessionId} />
      )}
      {view === 'admin' && (
        <AdminDashboard onBackToHome={() => navigateTo('home')} />
      )}
    </div>
  );
}
