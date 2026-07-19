import React, { useState } from 'react';
import { 
  Plus, Minus, Building2, ChevronRight, ChevronDown, CheckCircle2, ArrowRight
} from 'lucide-react';

interface BusinessHomepageProps {
  onOpenChat: () => void;
}

export default function BusinessHomepage({ onOpenChat }: BusinessHomepageProps) {
  // Accordion state for "One platform, endless possibilities"
  const [expandedSection, setExpandedSection] = useState<'app' | 'pos' | 'web' | null>(null);

  // Popup state for the "Get started" / "Contact me" actions to make them highly interactive
  const [showContactModal, setShowContactModal] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [contactForm, setContactForm] = useState({
    businessName: '',
    contactPerson: '',
    phone: '',
    email: '',
    hasHsbcAccount: 'yes'
  });

  const toggleSection = (section: 'app' | 'pos' | 'web') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setShowContactModal(false);
      setContactForm({
        businessName: '',
        contactPerson: '',
        phone: '',
        email: '',
        hasHsbcAccount: 'yes'
      });
    }, 2500);
  };

  return (
    <div className="bg-white min-h-screen text-[#222222] font-sans antialiased animate-in fade-in duration-300">
      
      {/* 1. Main Cover Image & Hero Headline (Screenshot 1) */}
      <section id="business-hero" className="relative flex flex-col items-center bg-white border-b border-gray-100">
        
        {/* Man sitting on stool with cat image */}
        <div className="w-full overflow-hidden">
          <img 
            src="https://payme.hsbc.com.hk/en/assets/img/cover-img/bussiness_bg_mobile.png" 
            alt="PayMe for Business merchant hero" 
            className="w-full max-h-[460px] md:max-h-[640px] object-cover object-center select-none"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Hero Content Area */}
        <div className="max-w-[480px] sm:max-w-[640px] mx-auto px-4 py-12 text-center space-y-6">
          <h1 className="text-[34px] sm:text-[44px] font-bold text-[#222222] tracking-tight leading-[1.15] font-sans">
            Join 90,000 merchant outlets and grow your business!
          </h1>
          
          <p className="text-gray-600 text-[14.5px] sm:text-[16px] leading-relaxed font-normal">
            No matter what size your business is, collect payments seamlessly and connect to over 3 million customers with PayMe for Business.
          </p>

          <div className="pt-2 px-4 flex justify-center">
            <button 
              onClick={() => setShowContactModal(true)}
              className="inline-flex items-center justify-center w-full max-w-[343px] h-[40px] bg-[#DB0011] hover:bg-[#b8000e] text-white font-medium rounded-full text-center text-[13.5px] transition-all duration-200 cursor-pointer shadow-xs"
            >
              Get started
            </button>
          </div>

          {/* Badges */}
          <div className="flex justify-center items-center gap-4 pt-2">
            <a 
              href="https://apps.apple.com/hk/app/payme-by-hsbc/id1184264977?l=en-GB" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:scale-105 active:scale-95 transition-transform inline-block"
            >
              <img 
                src="https://payme.hsbc.com.hk/en/assets/img/desc-img/en/App_Store_Badge.svg" 
                alt="App Store Badge" 
                className="h-10 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </a>
            <a 
              href="https://play.google.com/store/apps/details?id=hk.com.hsbc.paymefromhsbc&hl=en_US" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:scale-105 active:scale-95 transition-transform inline-block"
            >
              <img 
                src="https://payme.hsbc.com.hk/en/assets/img/desc-img/en/google-play.png" 
                alt="Google Play Badge" 
                className="h-[40px] w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </a>
          </div>
        </div>
      </section>

      {/* 2. One Platform, Endless Possibilities (Screenshot 2) */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-[480px] sm:max-w-[640px] mx-auto px-4 space-y-10">
          <h2 className="text-[28px] sm:text-[34px] font-bold text-[#222222] tracking-tight leading-tight text-center font-sans">
            One platform, endless possibilities
          </h2>

          <div className="divide-y divide-gray-100 border-t border-b border-gray-100">
            
            {/* Accordion 1: PayMe for Business app */}
            <div className="py-6">
              <button 
                onClick={() => toggleSection('app')}
                className="w-full flex items-center justify-between text-left focus:outline-none group cursor-pointer"
              >
                <div className="flex items-center gap-6">
                  <div className="w-[84px] h-[84px] shrink-0 overflow-hidden rounded-2xl flex items-center justify-center">
                    <img 
                      src="https://payme.hsbc.com.hk/en/assets/img/cover-img/mob-business-app.jpg" 
                      alt="PayMe for Business app" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[18px] sm:text-[21px] font-bold text-[#222222] font-sans tracking-tight leading-snug">
                    PayMe for Business app
                  </span>
                </div>
                <div className="p-1 rounded-full hover:bg-gray-50 transition-colors">
                  {expandedSection === 'app' ? (
                    <Minus className="w-5 h-5 text-gray-500 stroke-[2]" />
                  ) : (
                    <Plus className="w-5 h-5 text-gray-500 stroke-[2]" />
                  )}
                </div>
              </button>
              {expandedSection === 'app' && (
                <div className="mt-4 pl-[110px] pr-4 text-gray-600 text-[13.5px] sm:text-[14.5px] space-y-3 leading-relaxed animate-fade-in">
                  <p>
                    Collect payments face-to-face and manage your business transactions on the go. Perfect for small and medium-sized enterprises (SMEs), boutiques, coffee shops, and delivery services.
                  </p>
                  <p className="font-semibold text-[#DB0011]">
                    Key benefits:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Instant settlement directly to your HSBC business bank account</li>
                    <li>No monthly fees or setup costs</li>
                    <li>Easily generate custom PayCodes to receive precise payment amounts</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Accordion 2: PayMe for point-of-sale */}
            <div className="py-6">
              <button 
                onClick={() => toggleSection('pos')}
                className="w-full flex items-center justify-between text-left focus:outline-none group cursor-pointer"
              >
                <div className="flex items-center gap-6">
                  <div className="w-[84px] h-[84px] shrink-0 overflow-hidden rounded-2xl flex items-center justify-center">
                    <img 
                      src="https://payme.hsbc.com.hk/en/assets/img/cover-img/mob-business-pos.jpg" 
                      alt="PayMe for point-of-sale" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[18px] sm:text-[21px] font-bold text-[#222222] font-sans tracking-tight leading-snug">
                    PayMe for point-of-sale
                  </span>
                </div>
                <div className="p-1 rounded-full hover:bg-gray-50 transition-colors">
                  {expandedSection === 'pos' ? (
                    <Minus className="w-5 h-5 text-gray-500 stroke-[2]" />
                  ) : (
                    <Plus className="w-5 h-5 text-gray-500 stroke-[2]" />
                  )}
                </div>
              </button>
              {expandedSection === 'pos' && (
                <div className="mt-4 pl-[110px] pr-4 text-gray-600 text-[13.5px] sm:text-[14.5px] space-y-3 leading-relaxed animate-fade-in">
                  <p>
                    Ready to integrate PayMe directly into your store's existing point-of-sale terminal system? We partner with leading local POS systems to deliver instant, high-volume checkout lanes.
                  </p>
                  <p className="font-semibold text-[#DB0011]">
                    Key benefits:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>Frictionless customer queue checkout matching existing credit card terminal styles</li>
                    <li>Automated cashier reconciliation and end-of-day reports</li>
                    <li>Supported by major hardware and terminal brands in Hong Kong</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Accordion 3: PayMe for website/app */}
            <div className="py-6">
              <button 
                onClick={() => toggleSection('web')}
                className="w-full flex items-center justify-between text-left focus:outline-none group cursor-pointer"
              >
                <div className="flex items-center gap-6">
                  <div className="w-[84px] h-[84px] shrink-0 overflow-hidden rounded-2xl flex items-center justify-center">
                    <img 
                      src="https://payme.hsbc.com.hk/en/assets/img/cover-img/mob-business-web-app.jpg" 
                      alt="PayMe for website/app" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-[18px] sm:text-[21px] font-bold text-[#222222] font-sans tracking-tight leading-snug">
                    PayMe for website/app
                  </span>
                </div>
                <div className="p-1 rounded-full hover:bg-gray-50 transition-colors">
                  {expandedSection === 'web' ? (
                    <Minus className="w-5 h-5 text-gray-500 stroke-[2]" />
                  ) : (
                    <Plus className="w-5 h-5 text-gray-500 stroke-[2]" />
                  )}
                </div>
              </button>
              {expandedSection === 'web' && (
                <div className="mt-4 pl-[110px] pr-4 text-gray-600 text-[13.5px] sm:text-[14.5px] space-y-3 leading-relaxed animate-fade-in">
                  <p>
                    Provide a frictionless, bank-secure mobile checkout. Integrate our developer-friendly APIs into your website or e-commerce application to receive online orders instantly.
                  </p>
                  <p className="font-semibold text-[#DB0011]">
                    Key benefits:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5">
                    <li>One-click redirects for customer checkout on mobile phones</li>
                    <li>Frictionless web purchases via dynamic desktop screen QR codes</li>
                    <li>Secure transaction validation with built-in webhook callbacks</li>
                  </ul>
                </div>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* 3. PayMe for Business Portal (Screenshot 3) */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-[480px] sm:max-w-[640px] mx-auto px-4 text-center space-y-6">
          
          {/* Laptop Mockup Image */}
          <div className="w-full flex justify-center">
            <div className="relative w-full max-w-[540px] transition-transform duration-500 hover:scale-[1.01]">
              <img 
                src="https://payme.hsbc.com.hk/en/assets/img/desc-img/en/landing-portal.jpg" 
                alt="PayMe for Business portal on a laptop" 
                className="w-full h-auto object-contain rounded-lg"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <h2 className="text-[28px] sm:text-[34px] font-bold text-[#222222] tracking-tight leading-tight font-sans">
            PayMe for Business portal
          </h2>

          <p className="text-gray-600 text-[14.5px] sm:text-[16px] leading-relaxed font-normal">
            Once you’ve successfully onboarded with the PayMe for Business app, you can activate your free portal account. Allowing you to manage PayMe for Business transactions effortlessly, anytime, anywhere, the portal is accessible through a dedicated website and is completely free of charge for all PayMe for Business customers.
          </p>

          <div className="pt-2 px-4 flex justify-center">
            <button 
              onClick={() => setShowContactModal(true)}
              className="inline-flex items-center justify-center w-full max-w-[343px] h-[40px] bg-[#DB0011] hover:bg-[#b8000e] text-white font-medium rounded-full text-center text-[13.5px] transition-all duration-200 cursor-pointer"
            >
              Get started
            </button>
          </div>
        </div>
      </section>

      {/* 4. Access Funds Instantly (Screenshot 3/4) */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-[480px] sm:max-w-[640px] mx-auto px-4 text-center space-y-6">
          
          {/* Hand holding iPhone image */}
          <div className="w-full flex justify-center">
            <div className="relative w-full max-w-[540px] overflow-hidden rounded-2xl transition-transform duration-500 hover:scale-[1.01]">
              <img 
                src="https://payme.hsbc.com.hk/en/assets/img/desc-img/en/landing-business-trans.jpg" 
                alt="Hand holding iPhone showing transfers" 
                className="w-full h-auto object-cover rounded-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <h2 className="text-[28px] sm:text-[34px] font-bold text-[#222222] tracking-tight leading-tight font-sans">
            Access your funds instantly or set up an automatic transfer
          </h2>

          <p className="text-gray-600 text-[14.5px] sm:text-[16px] leading-relaxed font-normal">
            PayMe for Business provides instant access to your money, so you can transfer it out to your bank account whenever suits you. Best of all, there’s no charge for transferring out your funds.
          </p>
        </div>
      </section>

      {/* 5. Simple Pricing, No Hidden Fees (Screenshot 4/5) */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-[480px] sm:max-w-[640px] mx-auto px-4 text-center space-y-6">
          
          {/* Point-of-Sale Terminal Image */}
          <div className="w-full flex justify-center">
            <div className="relative w-full max-w-[540px] overflow-hidden rounded-2xl transition-transform duration-500 hover:scale-[1.01]">
              <img 
                src="https://payme.hsbc.com.hk/en/assets/img/desc-img/en/landing-pos-report.jpg" 
                alt="White payment terminal mockup" 
                className="w-full h-auto object-contain rounded-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <h2 className="text-[28px] sm:text-[34px] font-bold text-[#222222] tracking-tight leading-tight font-sans">
            Simple pricing, no hidden fees
          </h2>

          <p className="text-gray-600 text-[14.5px] sm:text-[16px] leading-relaxed font-normal">
            A standard fee of 1.2% for PayMe for Business app transactions, and 1.5% for PayMe API (e.g. through your integrated website or mobile apps), or point-of-sale terminal transactions.
          </p>
        </div>
      </section>

      {/* 6. Are you an HSBC customer? (Screenshot 5/6) */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-[480px] sm:max-w-[640px] mx-auto px-4 space-y-10">
          <h2 className="text-[28px] sm:text-[34px] font-bold text-[#222222] tracking-tight leading-tight text-center font-sans">
            Are you an HSBC customer?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-4">
            
            {/* Yes, I am */}
            <div className="flex flex-col items-center text-center space-y-4">
              <img 
                src="https://payme.hsbc.com.hk/en/assets/img/logo/ic-hsbc-logo.svg" 
                alt="HSBC Logo" 
                className="w-[110px] h-[110px] object-contain"
                referrerPolicy="no-referrer"
              />

              <h3 className="text-[18px] sm:text-[21px] font-bold text-[#222222]">
                Yes, I am
              </h3>

              <p className="text-gray-600 text-[13.5px] sm:text-[14.5px] leading-relaxed font-normal max-w-[280px]">
                If you're an HSBC Business Internet Banking customer, you can download and start using PayMe for Business straight away.
              </p>

              {/* App download badges side by side */}
              <div className="flex items-center gap-3 pt-2">
                <a 
                  href="https://apps.apple.com/hk/app/payme-by-hsbc/id1184264977?l=en-GB" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:scale-105 active:scale-95 transition-transform inline-block"
                >
                  <img 
                    src="https://payme.hsbc.com.hk/en/assets/img/desc-img/en/App_Store_Badge.svg" 
                    alt="App Store Badge" 
                    className="h-8.5 w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                </a>
                <a 
                  href="https://play.google.com/store/apps/details?id=hk.com.hsbc.paymefromhsbc&hl=en_US" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:scale-105 active:scale-95 transition-transform inline-block"
                >
                  <img 
                    src="https://payme.hsbc.com.hk/en/assets/img/desc-img/en/google-play.png" 
                    alt="Google Play Badge" 
                    className="h-[34px] w-auto object-contain"
                    referrerPolicy="no-referrer"
                  />
                </a>
              </div>

              {/* Red underlined link block */}
              <p className="text-gray-500 text-[12px] leading-relaxed pt-2 max-w-[280px]">
                If you're an HSBC Commercial Banking customer but haven't signed up for Internet Banking yet, you can do so{' '}
                <a 
                  href="https://apps.apple.com/hk/app/payme-by-hsbc/id1184264977?l=en-GB"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#222222] underline hover:text-[#DB0011] font-bold cursor-pointer"
                >
                  here
                </a>{' '}
                to make sure you can use PayMe for Business.
              </p>
            </div>

            {/* No, I'm not */}
            <div className="flex flex-col items-center text-center space-y-4">
              <img 
                src="https://payme.hsbc.com.hk/en/assets/img/logo/ic-transfer-to-bank-inverse.svg" 
                alt="Transfer to Bank Icon" 
                className="w-[110px] h-[110px] object-contain"
                referrerPolicy="no-referrer"
              />

              <h3 className="text-[18px] sm:text-[21px] font-bold text-[#222222]">
                No, I'm not
              </h3>

              <p className="text-gray-600 text-[13.5px] sm:text-[14.5px] leading-relaxed font-normal max-w-[280px] min-h-[66px]">
                If you'd like to open an account or discuss how HSBC can help your business thrive, sign up{' '}
                <a 
                  href="https://apps.apple.com/hk/app/payme-by-hsbc/id1184264977?l=en-GB"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#222222] underline hover:text-[#DB0011] font-bold cursor-pointer"
                >
                  here
                </a>{' '}
                and we'll be in touch.
              </p>

              <div className="w-full pt-4 max-w-[280px]">
                <button 
                  onClick={() => setShowContactModal(true)}
                  className="inline-flex items-center justify-center w-full h-[40px] border border-[#DB0011] hover:bg-red-50 text-[#DB0011] font-semibold rounded-full text-center text-[13.5px] transition-all duration-200 cursor-pointer"
                >
                  Yes, please contact me
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 7. Connect with 3 million PayMe users (Screenshot 6/7) */}
      <section className="py-16 bg-white border-b border-gray-100">
        <div className="max-w-[480px] sm:max-w-[640px] mx-auto px-4 text-center space-y-6">
          
          {/* Smiling girl holding iPhone with flowers */}
          <div className="w-full flex justify-center">
            <div className="relative w-full max-w-[540px] overflow-hidden rounded-2xl transition-transform duration-500 hover:scale-[1.01]">
              <img 
                src="https://payme.hsbc.com.hk/en/assets/img/desc-img/en/landing-pay-users.jpg" 
                alt="Connect with 3 million PayMe users" 
                className="w-full h-auto object-cover rounded-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <h2 className="text-[28px] sm:text-[34px] font-bold text-[#222222] tracking-tight leading-tight font-sans">
            Connect with 3 million PayMe users
          </h2>

          <p className="text-gray-600 text-[14.5px] sm:text-[16px] leading-relaxed font-normal">
            Start collecting payments from our 3 million (and growing) Hong Kong customer base - instantly, anywhere, anytime.
          </p>
        </div>
      </section>

      {/* 8. Tell us what you think about PayMe! (Screenshot 7/8) */}
      <section className="py-16 bg-white">
        <div className="max-w-[480px] sm:max-w-[640px] mx-auto px-4 text-center space-y-6 flex flex-col items-center">
          
          {/* Smiley frowny illustration */}
          <div className="w-full flex justify-center max-w-[340px] py-4 select-none">
            <img 
              src="https://payme.hsbc.com.hk/en/assets/img/cover-img/tell-us-section.svg" 
              alt="Feedback illustration" 
              className="w-full h-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </div>

          <h2 className="text-[28px] sm:text-[34px] font-bold text-[#222222] tracking-tight leading-tight font-sans">
            Tell us what you think about PayMe!
          </h2>

          <p className="text-gray-600 text-[14.5px] sm:text-[16px] leading-relaxed font-normal">
            Do you have a question to ask or feedback you’d like to share? Got an idea for how we can make PayMe work better for you? We want to hear what you think and give you an opportunity to help us keep improving.
          </p>

          <div className="w-full max-w-[343px] pt-4">
            <button 
              onClick={onOpenChat}
              className="inline-flex items-center justify-center w-full h-[40px] bg-[#DB0011] hover:bg-[#b8000e] text-white font-medium rounded-full text-center text-[13.5px] transition-all duration-200 cursor-pointer"
            >
              Leave your feedback
            </button>
          </div>
        </div>
      </section>

      {/* --- Highly Interactive Contact Form Modal / Popup --- */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative border border-gray-100 animate-in zoom-in-95 duration-200">
            
            {/* Close button */}
            <button 
              onClick={() => {
                setShowContactModal(false);
                setFormSubmitted(false);
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 font-bold focus:outline-none text-[20px] cursor-pointer"
            >
              ×
            </button>

            {formSubmitted ? (
              <div className="text-center py-8 space-y-4 animate-in fade-in duration-300">
                <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-[20px] font-bold text-[#222222]">
                  Request Submitted!
                </h3>
                <p className="text-gray-500 text-xs sm:text-sm leading-relaxed">
                  Thank you for your interest in PayMe for Business. An HSBC merchant specialist will contact you on your registered email and phone number within 1-2 business days.
                </p>
                <p className="text-[11px] text-gray-400 italic">Closing window...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                    <img 
                      src="https://payme.hsbc.com.hk/en/assets/img/logo/ic-hsbc-logo.svg" 
                      alt="HSBC" 
                      className="w-6 h-6 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold text-[#222222]">
                      Register Interest
                    </h3>
                    <p className="text-[11px] text-gray-500 font-normal">
                      Get onboarded with PayMe for Business
                    </p>
                  </div>
                </div>

                <form onSubmit={handleFormSubmit} className="space-y-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Business Name</label>
                    <input 
                      type="text" 
                      name="businessName"
                      required
                      value={contactForm.businessName}
                      onChange={handleFormChange}
                      placeholder="e.g. PayMe Cafe"
                      className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#DB0011] transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Contact Person</label>
                    <input 
                      type="text" 
                      name="contactPerson"
                      required
                      value={contactForm.contactPerson}
                      onChange={handleFormChange}
                      placeholder="e.g. Alex Wong"
                      className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#DB0011] transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Phone Number</label>
                      <input 
                        type="tel" 
                        name="phone"
                        required
                        value={contactForm.phone}
                        onChange={handleFormChange}
                        placeholder="e.g. 9123 4567"
                        className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#DB0011] transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Email Address</label>
                      <input 
                        type="email" 
                        name="email"
                        required
                        value={contactForm.email}
                        onChange={handleFormChange}
                        placeholder="alex@paymecafe.hk"
                        className="w-full px-3.5 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#DB0011] transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Do you have an HSBC Business Account?</label>
                    <select 
                      name="hasHsbcAccount"
                      value={contactForm.hasHsbcAccount}
                      onChange={handleFormChange}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none bg-white focus:border-[#DB0011] transition-colors"
                    >
                      <option value="yes">Yes, I have an HSBC Business Account</option>
                      <option value="no">No, but I would like to open one</option>
                      <option value="none">No, I bank with another provider</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full h-[40px] bg-[#DB0011] hover:bg-[#b8000e] text-white font-medium rounded-full text-center text-[13px] transition-colors cursor-pointer mt-4"
                  >
                    Submit request
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
