import React, { useState } from 'react';
import { 
  ArrowRight, Download, HelpCircle, Shield, Globe, Landmark, 
  CheckCircle, MessageSquare, CreditCard, ChevronRight, X, AlertTriangle, ChevronDown,
  Briefcase, Code, Sparkles, BookOpen, ExternalLink
} from 'lucide-react';
import {
  PayMeLogo,
  WellcomeLogo,
  PriceriteLogo,
  JHCLogo,
  Store759Logo,
  BroadwayLogo,
  MarketPlaceLogo,
  PromoOffersIllustration,
  DimSumSharingIllustration,
  AppStoreBadge,
  GooglePlayBadge,
  FoodpandaLogo,
  CircleKLogo,
  ManningsLogo,
  McDonaldsLogo,
  SevenElevenLogo,
  HKTVmallLogo,
  FairwoodLogo,
  UniqloLogo,
  KlookLogo,
  DonDonDonkiLogo
} from './MerchantLogos';
import BusinessHomepage from './BusinessHomepage';

interface LandingPageProps {
  onOpenChat: () => void;
}

export default function LandingPage({ onOpenChat }: LandingPageProps) {
  const [showWarning, setShowWarning] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [showPromo, setShowPromo] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<'business' | 'more' | null>(null);
  const [currentView, setCurrentView] = useState<'personal' | 'business'>('personal');
  const [activeMerchant, setActiveMerchant] = useState(0);
  
  // Custom Swipe and Autoplay states
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [autoplayPaused, setAutoplayPaused] = useState(false);
  const pauseTimeoutRef = React.useRef<any>(null);

  const triggerInteractionPause = () => {
    setAutoplayPaused(true);
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = setTimeout(() => {
      setAutoplayPaused(false);
    }, 6000); // Resume auto-swipe after 6 seconds of no touch/interaction
  };

  // Autoplay swipe logic
  React.useEffect(() => {
    if (autoplayPaused) return;
    const timer = setInterval(() => {
      setActiveMerchant((prev) => (prev + 1) % 10);
    }, 2800);
    return () => clearInterval(timer);
  }, [autoplayPaused]);

  // Clean up timer on unmount
  React.useEffect(() => {
    return () => {
      if (pauseTimeoutRef.current) clearTimeout(pauseTimeoutRef.current);
    };
  }, []);

  const merchantsList = [
    { id: 0, name: "HKTVmall", component: <HKTVmallLogo /> },
    { id: 1, name: "Fairwood", component: <FairwoodLogo /> },
    { id: 2, name: "Uniqlo", component: <UniqloLogo /> },
    { id: 3, name: "Klook", component: <KlookLogo /> },
    { id: 4, name: "Don Don Donki", component: <DonDonDonkiLogo /> },
    { id: 5, name: "McDonald's", component: <McDonaldsLogo /> },
    { id: 6, name: "7-Eleven", component: <SevenElevenLogo /> },
    { id: 7, name: "foodpanda", component: <FoodpandaLogo /> },
    { id: 8, name: "Circle K", component: <CircleKLogo /> },
    { id: 9, name: "Mannings", component: <ManningsLogo /> }
  ];

  // Gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartX(e.touches[0].clientX);
    triggerInteractionPause();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    setDragOffset(currentX - dragStartX);
    triggerInteractionPause();
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    // Snap threshold
    if (dragOffset < -60) {
      // Swiped left -> Next Card
      setActiveMerchant((prev) => (prev === 9 ? 0 : prev + 1));
    } else if (dragOffset > 60) {
      // Swiped right -> Prev Card
      setActiveMerchant((prev) => (prev === 0 ? 9 : prev - 1));
    }
    setDragOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevents image/text dragging issues
    setIsDragging(true);
    setDragStartX(e.clientX);
    triggerInteractionPause();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragOffset(e.clientX - dragStartX);
    triggerInteractionPause();
  };

  const handleMouseUpOrLeave = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    if (dragOffset < -60) {
      setActiveMerchant((prev) => (prev === 9 ? 0 : prev + 1));
    } else if (dragOffset > 60) {
      setActiveMerchant((prev) => (prev === 0 ? 9 : prev - 1));
    }
    setDragOffset(0);
  };

  // Business simulator states
  const [businessSimBalance, setBusinessSimBalance] = useState<number>(12450.00);
  const [businessSimAmount, setBusinessSimAmount] = useState<string>('45.00');
  const [businessSimStatus, setBusinessSimStatus] = useState<'idle' | 'generating' | 'ready' | 'paying' | 'received'>('idle');
  const [businessPayerName, setBusinessPayerName] = useState<string>('Chloe Wong');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const merchantPartners = [
    { name: 'Wellcome', category: 'Supermarket', desc: 'Everyday household groceries & food' },
    { name: 'Pricerite', category: 'Home Furnishing', desc: 'Smart living solutions & furniture' },
    { name: 'Japan Home Centre', category: 'Household', desc: 'Household goods & kitchen utility products' },
    { name: '759 Store', category: 'Snacks & Groceries', desc: 'Imported snacks, drinks & food products' },
    { name: 'Broadway', category: 'Electronics', desc: 'Premium gadgets, cameras & home appliances' },
    { name: 'Market Place', category: 'Supermarket', desc: 'High-end delicatessen & premium wine selection' }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans selection:bg-[#FF1A3B] selection:text-white antialiased">
      
      {/* Background click-overlay to dismiss dropdowns easily */}
      {activeDropdown && (
        <div 
          className="fixed inset-0 top-[110px] bg-black/10 backdrop-blur-xs transition-opacity duration-300 z-30"
          onClick={() => setActiveDropdown(null)}
        />
      )}

      {/* Main Navigation Bar matching the screenshot precisely */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100/90 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-0">
          
          {/* Logo - Centered/Left-aligned on top */}
          <div className="flex items-center mb-5 shrink-0">
            <PayMeLogo className="h-10 sm:h-10.5" />
          </div>

          {/* Navigation Tabs aligned exactly as shown in screenshot with drop down functionality */}
          <nav className="flex items-center gap-8 text-gray-700 text-sm sm:text-base pb-3">
            <button 
              onClick={() => {
                setCurrentView('personal');
                setActiveDropdown(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`relative pb-0.5 select-none text-[15px] sm:text-[16px] tracking-normal focus:outline-none cursor-pointer transition-colors ${currentView === 'personal' ? 'text-[#222222] font-bold' : 'text-gray-500 hover:text-[#DB0011]'}`}
            >
              Personal
              {currentView === 'personal' && (
                <div className="absolute -bottom-[12.5px] left-0 right-0 h-[3px] bg-[#DB0011]" />
              )}
            </button>
            
            <button 
              onClick={() => {
                setCurrentView('business');
                setActiveDropdown(null);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`relative pb-0.5 flex items-center gap-1 select-none text-[15px] sm:text-[16px] tracking-normal focus:outline-none cursor-pointer transition-colors ${currentView === 'business' ? 'text-[#222222] font-bold' : 'text-gray-500 hover:text-[#DB0011]'}`}
            >
              <span>Business</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 stroke-[1.8px] ${currentView === 'business' ? 'text-[#222222] font-bold' : 'text-gray-400'}`} />
              {currentView === 'business' && (
                <div className="absolute -bottom-[12.5px] left-0 right-0 h-[3px] bg-[#DB0011]" />
              )}
            </button>

            <button 
              onClick={() => setActiveDropdown(activeDropdown === 'more' ? null : 'more')}
              className={`flex items-center gap-1.5 transition-colors font-normal text-[15px] sm:text-[16px] focus:outline-none cursor-pointer ${activeDropdown === 'more' ? 'text-[#DB0011] font-medium' : 'text-gray-500 hover:text-[#DB0011]'}`}
            >
              <span>More</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 stroke-[1.8px] ${activeDropdown === 'more' ? 'rotate-180 text-[#DB0011]' : 'text-gray-400'}`} />
            </button>
          </nav>

        </div>
        {/* --- More Dropdown Menu --- */}
        {activeDropdown === 'more' && (
          <div className="absolute left-0 right-0 top-full bg-white border-b border-gray-150 shadow-2xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column */}
                <div>
                  <h3 className="text-xs font-bold text-[#DB0011] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Our Story & Updates
                  </h3>
                  <ul className="space-y-4">
                    <li>
                      <a href="#about-section" onClick={() => setActiveDropdown(null)} className="group block">
                        <span className="block text-[14px] font-semibold text-gray-900 group-hover:text-[#DB0011] transition-colors">
                          About PayMe
                        </span>
                        <span className="block text-[12px] text-gray-500 mt-0.5 leading-relaxed">
                          How we became Hong Kong's favorite social payment app, trusted by over 3M people.
                        </span>
                      </a>
                    </li>
                    <li>
                      <a href="#campaign-news" onClick={() => setActiveDropdown(null)} className="group block">
                        <span className="block text-[14px] font-semibold text-gray-900 group-hover:text-[#DB0011] transition-colors">
                          What's New & Campaigns
                        </span>
                        <span className="block text-[12px] text-gray-500 mt-0.5 leading-relaxed">
                          Discover the latest updates, brand voucher giveaways, and promotional rewards.
                        </span>
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Middle Column */}
                <div>
                  <h3 className="text-xs font-bold text-[#DB0011] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Help & Security
                  </h3>
                  <ul className="space-y-4">
                    <li>
                      <button 
                        onClick={() => {
                          setActiveDropdown(null);
                          onOpenChat();
                        }} 
                        className="group block text-left w-full focus:outline-none"
                      >
                        <span className="block text-[14px] font-semibold text-gray-900 group-hover:text-[#DB0011] transition-colors">
                          Interactive Live Chat Support
                        </span>
                        <span className="block text-[12px] text-gray-500 mt-0.5 leading-relaxed">
                          Open our fully operational sandbox customer desk for instantaneous help.
                        </span>
                      </button>
                    </li>
                    <li>
                      <a href="#security-details" onClick={() => setActiveDropdown(null)} className="group block">
                        <span className="block text-[14px] font-semibold text-gray-900 group-hover:text-[#DB0011] transition-colors">
                          Bank-Grade Security Shield
                        </span>
                        <span className="block text-[12px] text-gray-500 mt-0.5 leading-relaxed">
                          Learn about HSBC encryption, real-time biometrics, and active fraud protection algorithms.
                        </span>
                      </a>
                    </li>
                  </ul>
                </div>

                {/* Right Column / Dev Portal Info */}
                <div>
                  <h3 className="text-xs font-bold text-[#DB0011] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5" />
                    Technical Portal
                  </h3>
                  <ul className="space-y-4">
                    <li>
                      <a href="#dev-sandbox" onClick={() => setActiveDropdown(null)} className="group block">
                        <span className="block text-[14px] font-semibold text-gray-900 group-hover:text-[#DB0011] transition-colors">
                          Developer Portal
                        </span>
                        <span className="block text-[12px] text-gray-500 mt-0.5 leading-relaxed">
                          Access comprehensive staging sandbox tools, code endpoints, and integration SDKs.
                        </span>
                      </a>
                    </li>
                    <li>
                      <div className="pt-2 border-t border-gray-100">
                        <span className="block text-[11px] text-gray-400 uppercase tracking-widest font-bold">Regulatory ID</span>
                        <span className="block text-[11px] font-mono text-gray-500 mt-1 leading-normal">
                          Stored Value Facility License Number: SVF0002
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

      </header>

      {/* Real-Styled Fraud Alert Banner (Fidelity match to image) */}
      {showWarning && (
        <div className="bg-[#f5f5f5] border-b border-gray-100 text-[#222222] transition-all duration-300">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-start gap-4">
            <div className="flex gap-4">
              <div className="w-6.5 h-6.5 rounded-full bg-[#EA9615] text-white flex items-center justify-center font-extrabold text-sm shrink-0 mt-0.5 select-none">
                !
              </div>
              <p className="leading-relaxed font-normal text-gray-800 text-[14px] sm:text-[15px]">
                Beware of fraud! Never share your personal information (such as credit card details or one-time passwords) in return for offer or discounts – especially when requested via unsolicited emails or SMS messages.
              </p>
            </div>
            <button 
              onClick={() => setShowWarning(false)}
              className="p-1 hover:bg-black/5 rounded-full transition-colors cursor-pointer shrink-0 mt-0.5"
              title="Dismiss warning"
            >
              <X className="w-5 h-5 text-gray-500 hover:text-gray-900 stroke-[2]" />
            </button>
          </div>
        </div>
      )}

      {currentView === 'personal' ? (
        <>
          {/* 4. Hero Section - Exact Match of payme.hsbc.com.hk Mobile Landing Page */}
          <section id="hero" className="relative overflow-hidden bg-white pt-16 pb-20 sm:pb-28 sm:pt-24 border-b border-slate-100">

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Column: Text & Badges */}
            <div className="lg:col-span-7 text-center lg:text-left space-y-8">
              {/* Headline - Exact Copy and typography matching image */}
              <h1 className="text-[34px] sm:text-[44px] md:text-[50px] lg:text-[56px] font-bold text-[#222222] tracking-[-0.035em] leading-[1.1] select-none font-sans">
                Pay you. PayMe.
                <span className="block mt-1 sm:mt-2">Pay anyone instantly.</span>
              </h1>

              {/* Paragraphs - Exact copy & weights from screenshot */}
              <div className="space-y-6 text-[#222222] font-normal">
                <p className="text-[14.5px] sm:text-[16px] leading-relaxed">
                  Go cashless. As well paying your friends and family, you can also use our award-winning app to pay your favourite restaurants, retailers and many more!
                </p>
                <p className="text-[14.5px] sm:text-[16px] leading-relaxed">
                  PayMe's accepted at thousands of outlets across Hong Kong, and with great offers and discounts exclusively for our users, it pays to pay with PayMe!
                </p>
              </div>

              {/* Left-aligned (or centered on mobile) SVG Download badges */}
              <div className="space-y-4">
                <div className="flex justify-center lg:justify-start items-center gap-4">
                  <a 
                    href="https://apps.apple.com/hk/app/payme-by-hsbc/id1184264977?l=en-GB" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:scale-105 active:scale-95 transition-transform inline-block"
                  >
                    <AppStoreBadge className="h-10 w-auto" />
                  </a>
                  
                  <a 
                    href="https://play.google.com/store/apps/details?id=hk.com.hsbc.paymefromhsbc&hl=en_US" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:scale-105 active:scale-95 transition-transform inline-block"
                  >
                    <GooglePlayBadge className="h-[43px] w-auto" />
                  </a>
                </div>
              </div>
            </div>

            {/* Right Column: Direct Landing GIF containing its own built-in high-fidelity iPhone frame */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-[280px] sm:max-w-[320px] transition-transform duration-500 hover:scale-[1.02]">
                <img 
                  src="https://payme.hsbc.com.hk/en/assets/img/desc-img/en/i-phone-x-landing.gif" 
                  alt="PayMe Mobile Experience" 
                  className="w-full h-auto object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* 5. Section: "Where can I pay with PayMe?" matching screenshot precisely */}
      <section id="where-to-pay" className="bg-white py-12 border-t border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-4 max-w-3xl mx-auto mb-8">
            <h2 className="text-[28px] sm:text-[34px] font-bold text-[#222222] tracking-tight leading-tight font-sans">
              Where can I pay with PayMe?
            </h2>
            <p className="text-[#222222] max-w-2xl mx-auto leading-relaxed text-[14.5px] sm:text-[16px] font-normal">
              With more businesses joining every day, tap below to see a selection of stores, restaurants and more that accept PayMe.
            </p>
          </div>

          {/* High-fidelity interactive sliding gallery resembling screenshot */}
          <div 
            className="relative max-w-[480px] mx-auto overflow-hidden py-2 select-none touch-pan-y cursor-grab active:cursor-grabbing"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
          >
            <div 
              className={`flex items-center gap-5 py-6 ${isDragging ? '' : 'transition-transform duration-500 ease-out'}`}
              style={{ 
                width: `${merchantsList.length * 330}px`, 
                transform: `translateX(${-activeMerchant * 330 + dragOffset}px)`,
                marginLeft: 'calc(50% - 155px)'
              }}
            >
              {merchantsList.map((merchant) => (
                <button
                  key={merchant.id}
                  onClick={() => {
                    setActiveMerchant(merchant.id);
                    triggerInteractionPause();
                  }}
                  className={`w-[310px] h-[134px] bg-white rounded-[26px] overflow-hidden transition-all duration-500 cursor-pointer shrink-0 p-5 flex items-center gap-5 text-left border border-slate-100/10 ${
                    activeMerchant === merchant.id 
                      ? "shadow-[0_20px_48px_rgba(0,0,0,0.08)] opacity-100 scale-100 z-10" 
                      : "shadow-[0_4px_16px_rgba(0,0,0,0.01)] opacity-30 hover:opacity-50 scale-[0.93] z-0"
                  }`}
                >
                  <div className="w-[90px] h-[90px] shrink-0 rounded-[18px] overflow-hidden flex items-center justify-center">
                    {merchant.component}
                  </div>
                  <div className="flex flex-col min-w-0 pr-1">
                    <span className="text-[21px] font-semibold text-[#222222] font-sans tracking-tight leading-none truncate">
                      {merchant.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Beautiful red button matching the screenshot */}
          <div className="mt-4 px-4 flex justify-center">
            <a 
              href="https://payme.hsbc.com.hk/en/merchant-list"
              target="_blank"
              rel="referrer noopener"
              className="inline-flex items-center justify-center w-full max-w-[343px] h-[40px] bg-[#DB0011] hover:bg-[#b8000e] text-white font-medium rounded-full text-center text-[13.5px] transition-all duration-200 cursor-pointer shadow-xs"
            >
              See the list
            </a>
          </div>
        </div>
      </section>

      {/* 6. Section: "Join a community of over 3 million users" */}
      <section id="community" className="py-20 bg-white overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          
          {/* Centered Heading and Text */}
          <div className="space-y-4 max-w-2xl mx-auto mb-12">
            <h2 className="text-[32px] sm:text-[40px] font-black text-[#222222] tracking-tight leading-tight font-sans">
              Join a community of<br />
              3m users
            </h2>
            <p className="text-gray-600 leading-relaxed text-[15px] sm:text-[16px] font-normal">
              Signing up is simple. Get started in seconds, find friends already on PayMe and invite those who are missing out! PayMe now is available to anyone age 12 and above. 
            </p>
          </div>

          {/* Centered Joined Community Graphic - Stacked vertically matching the real PayMe website */}
          <div className="flex flex-col items-center justify-center gap-6 max-w-[340px] sm:max-w-[400px] mx-auto select-none bg-white">
            
            {/* Circle 1: Shopping */}
            <div className="w-full hover:scale-102 transition-transform duration-300">
              <img 
                src="https://payme.hsbc.com.hk/en/assets/img/logo/shopping@3x.jpg" 
                alt="Shopping with PayMe" 
                className="w-full h-auto"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Circle 2: Dining */}
            <div className="w-full hover:scale-102 transition-transform duration-300">
              <img 
                src="https://payme.hsbc.com.hk/en/assets/img/logo/dining@3x.jpg" 
                alt="Dining with PayMe" 
                className="w-full h-auto"
                referrerPolicy="no-referrer"
              />
            </div>

          </div>

        </div>
      </section>

      {/* 7. Section: "We're taking the pain out of payments" */}
      <section className="py-20 bg-white border-t border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="space-y-6 max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl sm:text-[40px] font-black text-[#222222] tracking-tight leading-tight font-sans">
              We're taking the pain<br />
              out of payments
            </h2>
            <p className="text-[#222222] leading-relaxed text-[15px] sm:text-[16.5px] font-normal">
              Whether you're planning a holiday or splitting the bill for lunch, PayMe makes payments for every social occasion easier than ever.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed max-w-lg mx-auto">
              We keep it simple so you can concentrate on things that matter, like living your best life and savouring the moment.
            </p>
          </div>

          {/* Centered Transaction Feed Banner */}
          <div className="max-w-[420px] mx-auto overflow-hidden">
            <img 
              src="https://payme.hsbc.com.hk/en/assets/img/desc-img/en/transaction.jpg" 
              alt="We're taking the pain out of payments" 
              className="w-full h-auto rounded-2xl shadow-xs"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </section>

      {/* 8. Section: "Pay a business" & "Pay businesses with PayCodes" */}
      <section id="business" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Copy Content Left */}
            <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
              <div className="space-y-3">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Pay a business
                </h2>
                <p className="text-slate-600 leading-relaxed font-medium">
                  A new way to pay in stores - swipe left from your homescreen, tap 'Pay a business', authorise and let the cashier scan your code.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-xl font-bold text-slate-900">Pay businesses with PayCodes</h3>
                <p className="text-slate-600 leading-relaxed font-medium">
                  Use PayMe to pay your favourite HK businesses. Simply swipe left to open the scanner and scan the PayCode to make instant payments. You can use PayCodes to pay friends too!
                </p>
              </div>
            </div>

            {/* Real QR Scanner Phone Screenshot */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="max-w-[340px] sm:max-w-[380px] w-full">
                <img 
                  src="https://payme.hsbc.com.hk/en/assets/img/desc-img/en/scaner.png" 
                  alt="Pay businesses with PayCodes Scanner" 
                  className="w-full h-auto object-contain select-none hover:scale-102 transition-transform duration-500 ease-out"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 9. Section: "These businesses use PayMe" Logo Grid */}
      <section className="bg-white py-20 border-t border-slate-100 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <h2 className="text-[32px] sm:text-[40px] font-black text-[#222222] tracking-tight leading-tight font-sans">
            These businesses use PayMe
          </h2>
          
          <div className="grid grid-cols-3 gap-y-16 gap-x-8 sm:gap-x-16 md:gap-x-24 items-center justify-items-center max-w-4xl mx-auto py-4">
            <WellcomeLogo />
            <PriceriteLogo />
            <JHCLogo />
            <Store759Logo />
            <BroadwayLogo />
            <MarketPlaceLogo />
          </div>
        </div>
      </section>

      {/* 10. Section: "We've got your back" (HSBC Security focus) */}
      <section id="security" className="bg-white pt-10 pb-24 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <h2 className="text-[32px] sm:text-[40px] font-black text-[#222222] tracking-tight leading-tight font-sans">
            We've got your back
          </h2>
          <p className="text-[#222222] text-[18px] sm:text-[21px] leading-relaxed font-normal font-sans max-w-3xl mx-auto">
            When it comes to keeping your account safe, we don't mess around. Powered by HSBC's bank-standard security and fraud prevention technology, you can rest assured we've got you covered.
          </p>
          <div className="flex justify-center pt-8">
            <div className="max-w-[340px] sm:max-w-[380px] w-full">
              <img 
                src="https://payme.hsbc.com.hk/en/assets/img/desc-img/en/iphone-red-bg.jpg" 
                alt="HSBC bank-standard security" 
                className="w-full h-auto object-contain select-none hover:scale-102 transition-transform duration-500 ease-out"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <div className="flex justify-center pt-8">
            <div className="max-w-4xl w-full">
              <img 
                src="https://payme.hsbc.com.hk/en/assets/img/cover-img/web-img-landing-about.png" 
                alt="About PayMe" 
                className="w-full h-auto object-contain select-none hover:scale-101 transition-transform duration-500 ease-out rounded-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 11. Section: "Tell us what you think about PayMe!" */}
      <section className="bg-white py-16 text-center border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 flex flex-col items-center">

          {/* Title */}
          <h2 className="text-[32px] sm:text-[40px] font-black text-[#222222] tracking-tight leading-tight font-sans">
            Tell us what you think about PayMe!
          </h2>

          {/* Description */}
          <p className="text-[#222222] text-[18px] sm:text-[21px] leading-relaxed font-normal font-sans max-w-3xl mx-auto">
            Do you have a question to ask or feedback you'd like to share? Got an idea for how we can make PayMe work better for you? We want to hear what you think and give you an opportunity to help us keep improving.
          </p>

          {/* Centered button matching original proportions */}
          <div className="w-full max-w-[343px] pt-2">
            <button
              onClick={onOpenChat}
              className="inline-flex items-center justify-center w-full h-[40px] bg-[#DB0011] hover:bg-[#b8000e] text-white font-medium rounded-full text-center text-[13.5px] transition-all duration-200 cursor-pointer"
            >
              Leave your feedback
            </button>
          </div>

        </div>
      </section>
        </>
      ) : (
        <BusinessHomepage onOpenChat={onOpenChat} />
      )}

      {/* 12. Accordion Legal Footer matching official site */}
      <footer className="bg-white py-16 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Collapsible Accordion sections */}
          <div className="flex flex-col">
            
            {/* Item 1 */}
            <div className="border-t border-b border-[#EAEAEA]">
              <button 
                onClick={() => toggleSection('payme')}
                className="w-full flex justify-between items-center text-[#222222] font-normal text-[16px] sm:text-[17px] py-4.5 focus:outline-none cursor-pointer"
              >
                <span>PayMe</span>
                {expandedSection === 'payme' ? <ChevronDown className="w-4 h-4 text-slate-500 stroke-[1.5]" /> : <ChevronRight className="w-4 h-4 text-slate-500 stroke-[1.5]" />}
              </button>
              {expandedSection === 'payme' && (
                <div className="pb-4.5 text-slate-600 text-[13px] sm:text-[14px] space-y-2 leading-relaxed animate-fade-in">
                  <p>PayMe is Hong Kong's award-winning payment companion. Built to simplify local consumer-to-consumer transfers and corporate merchant checkout services.</p>
                  <p>Our dedicated operations support manages transaction communications and verified customer live-chat support ticket queues.</p>
                </div>
              )}
            </div>

            {/* Item 2 */}
            <div className="border-b border-[#EAEAEA]">
              <button 
                onClick={() => toggleSection('legal')}
                className="w-full flex justify-between items-center text-[#222222] font-normal text-[16px] sm:text-[17px] py-4.5 focus:outline-none cursor-pointer"
              >
                <span>Legal</span>
                {expandedSection === 'legal' ? <ChevronDown className="w-4 h-4 text-slate-500 stroke-[1.5]" /> : <ChevronRight className="w-4 h-4 text-slate-500 stroke-[1.5]" />}
              </button>
              {expandedSection === 'legal' && (
                <div className="pb-4.5 text-slate-600 text-[13px] sm:text-[14px] space-y-2 leading-relaxed animate-fade-in">
                  <p>All Stored Value Facility services are licensed under SVF0002 by the Hong Kong Monetary Authority (HKMA). Operations match bank-standard compliance protocols for capital settlement, refund releases and AML rules.</p>
                  <p>Access to merchant platforms is managed securely. Keep transaction tokens and credentials fully confidential.</p>
                </div>
              )}
            </div>

          </div>

          {/* Disclaimer Text */}
          <div className="text-[#222222] text-[11px] sm:text-[12px] leading-relaxed space-y-3.5">
            <p>
              The screen displays and the images of the website are for reference and illustration purposes only.
            </p>
            <p>
              Apple, the Apple logo, iPhone are trademarks of Apple Inc., registered in the U.S. and other countries and regions. App Store is a service mark of Apple Inc.
            </p>
            <p>
              Google Play™ is the trademark of Google Inc. Android™ is a trademark of Google Inc.
            </p>
          </div>

          <div className="border-t border-slate-200 pt-5 space-y-4">
            {/* HSBC Logo Lockup */}
            <div className="flex items-center">
              <img 
                src="https://payme.hsbc.com.hk/en/assets/img/logo/footer-logo.png" 
                alt="By HSBC" 
                className="h-[16px] sm:h-[18px] w-auto object-contain select-none"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Copyright, disclosure and license */}
            <div className="text-[#222222] text-[11px] sm:text-[12px] leading-relaxed space-y-1">
              <p>© Copyright. The Hongkong and Shanghai Banking Corporation Limited 2026. All rights reserved.</p>
              <p>
                This website is designed for use in Hong Kong. <a href="#disclosure" className="underline text-blue-600 hover:text-blue-800 transition-colors">Cross-border disclosure</a>
              </p>
              <p>SVF License Number: SVFB002</p>
            </div>
          </div>

        </div>
      </footer>

      {/* Floating Action Button for Support */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={onOpenChat}
          className="w-14 h-14 bg-[#FF1A3B] hover:bg-[#db141c] text-white rounded-full flex items-center justify-center shadow-lg shadow-rose-200 hover:shadow-xl hover:scale-105 transition-all cursor-pointer group"
          title="Direct Support Chat Line"
        >
          <MessageSquare className="w-6 h-6 group-hover:rotate-6 transition-transform" />
        </button>
      </div>

    </div>
  );
}
