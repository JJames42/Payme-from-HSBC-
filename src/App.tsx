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
        const path = window.location.pathname;

        if (path === '/admin/london-stie/2026' || path === '/admin' || params.get('admin') === 'true') {
          setView('admin');
        } else if (path === '/support' || path === '/live-chat' || params.get('chat') === 'true' || params.get('channel')) {
          setView('chat');
          const channel = params.get('channel');
          if (channel) {
            setSessionId(channel);
          }
        } else {
          setView('home');
        }
      } catch (error) {
        console.warn('Failed to parse URL on load:', error);
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
      
      // Reset search params and path
      url.searchParams.delete('chat');
      url.searchParams.delete('admin');
      url.searchParams.delete('channel');

      if (newView === 'chat') {
        url.pathname = '/support';
        url.searchParams.set('chat', 'true');
      } else if (newView === 'admin') {
        url.pathname = '/admin/london-stie/2026';
        url.searchParams.set('admin', 'true');
      } else {
        url.pathname = '/';
      }

      window.history.pushState({}, '', url.toString());
    } catch (error) {
      console.warn('window.history.pushState failed or blocked inside iframe:', error);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 font-sans antialiased relative">
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

