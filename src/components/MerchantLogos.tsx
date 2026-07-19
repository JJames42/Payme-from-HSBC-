import React from 'react';

interface LogoProps {
  className?: string;
}

// 1. PayMe by HSBC Logo
export const PayMeLogo: React.FC<LogoProps> = ({ className = "h-10" }) => (
  <img 
    src="https://payme.hsbc.com.hk/en/assets/img/logo/payMe-logo-header.png" 
    alt="PayMe by HSBC" 
    className={`${className} object-contain`}
    referrerPolicy="no-referrer"
  />
);

// 2. Wellcome Supermarket Logo
export const WellcomeLogo: React.FC<LogoProps> = ({ className = "" }) => (
  <img 
    src="https://payme.hsbc.com.hk/en/assets/img/logo/Wellcome.png" 
    alt="Wellcome" 
    className={`w-[140px] sm:w-[180px] h-auto object-contain select-none transition-transform duration-300 hover:scale-105 ${className}`}
    referrerPolicy="no-referrer"
  />
);

// 3. Pricerite Furnishing Logo
export const PriceriteLogo: React.FC<LogoProps> = ({ className = "" }) => (
  <img 
    src="https://payme.hsbc.com.hk/en/assets/img/logo/Pricerite.png" 
    alt="Pricerite" 
    className={`w-[140px] sm:w-[180px] h-auto object-contain select-none transition-transform duration-300 hover:scale-105 ${className}`}
    referrerPolicy="no-referrer"
  />
);

// 4. JHC Japan Home Centre Logo
export const JHCLogo: React.FC<LogoProps> = ({ className = "" }) => (
  <img 
    src="https://payme.hsbc.com.hk/en/assets/img/logo/JHC.png" 
    alt="JHC" 
    className={`w-[140px] sm:w-[180px] h-auto object-contain select-none transition-transform duration-300 hover:scale-105 ${className}`}
    referrerPolicy="no-referrer"
  />
);

// 5. 759 Store Logo
export const Store759Logo: React.FC<LogoProps> = ({ className = "" }) => (
  <img 
    src="https://payme.hsbc.com.hk/en/assets/img/logo/759.png" 
    alt="759 Store" 
    className={`w-[130px] sm:w-[170px] h-auto object-contain select-none transition-transform duration-300 hover:scale-105 ${className}`}
    referrerPolicy="no-referrer"
  />
);

// 6. Broadway Electronics Logo
export const BroadwayLogo: React.FC<LogoProps> = ({ className = "" }) => (
  <img 
    src="https://payme.hsbc.com.hk/en/assets/img/logo/Broadway.png" 
    alt="Broadway" 
    className={`w-[140px] sm:w-[180px] h-auto object-contain select-none transition-transform duration-300 hover:scale-105 ${className}`}
    referrerPolicy="no-referrer"
  />
);

// 7. Market Place Logo
export const MarketPlaceLogo: React.FC<LogoProps> = ({ className = "" }) => (
  <img 
    src="https://payme.hsbc.com.hk/en/assets/img/logo/MarketPlace.png" 
    alt="Market Place" 
    className={`w-[140px] sm:w-[180px] h-auto object-contain select-none transition-transform duration-300 hover:scale-105 ${className}`}
    referrerPolicy="no-referrer"
  />
);

// 8. App Store Badge SVG
export const AppStoreBadge: React.FC<LogoProps> = ({ className = "h-10" }) => (
  <img 
    src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
    alt="Download on the App Store" 
    className={`${className} object-contain`}
    referrerPolicy="no-referrer"
  />
);

// 9. Google Play Badge SVG
export const GooglePlayBadge: React.FC<LogoProps> = ({ className = "h-10" }) => (
  <img 
    src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
    alt="Get it on Google Play" 
    className={`${className} object-contain`}
    referrerPolicy="no-referrer"
  />
);

// FoodpandaLogo, CircleKLogo, and ManningsLogo have been moved and upgraded below to support the premium stacked layout.

// 13. McDonald's Logo
export const McDonaldsLogo: React.FC<LogoProps> = () => (
  <div className="w-full h-full bg-[#DA291C] flex items-center justify-center p-4">
    <svg viewBox="0 0 24 24" className="w-[60%] h-[60%] text-[#FFC72C] fill-current">
      <path d="M12 21h-2V10.16C10 7.9 8.78 6.54 7 6.54s-3 1.36-3 3.62V21H2V10.16C2 5.56 5.06 3 8 3c2.44 0 4.28 1.48 4 4.54.28-3.06 2.12-4.54 4.56-4.54 2.94 0 6 2.56 6 7.16V21h-2V10.16c0-2.26-1.22-3.62-3-3.62s-3 1.36-3 3.62V21z" />
    </svg>
  </div>
);

// 14. 7-Eleven Logo
export const SevenElevenLogo: React.FC<LogoProps> = () => (
  <div className="w-full h-full bg-[#008060] flex items-center justify-center p-2.5">
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Curved white-outlined container matching official 7-Eleven shield format */}
      <rect x="12" y="10" width="76" height="80" rx="6" fill="#008060" stroke="white" strokeWidth="7" />
      
      {/* Orange top bar of '7' */}
      <path d="M 31,26 H 69 L 63,41 H 39 Z" fill="#F26522" />
      
      {/* Red vertical stem of '7' */}
      <path d="M 46,41 H 63 L 47,80 H 35 Z" fill="#EE4024" />
      
      {/* White horizontal background bar for ELEVEn */}
      <rect x="5" y="44" width="90" height="15" fill="white" />
      
      {/* ELEVEn text inside the white band (with authentic lowercase 'n' trivia) */}
      <text 
        x="50" 
        y="55" 
        fill="#008060" 
        fontSize="10" 
        fontWeight="900" 
        fontFamily="system-ui, -apple-system, sans-serif" 
        textAnchor="middle" 
        letterSpacing="1"
      >
        ELEVEn
      </text>
    </svg>
  </div>
);

// 15. HKTVmall Logo
export const HKTVmallLogo: React.FC<LogoProps> = () => (
  <div className="w-full h-full bg-[#8CC63F] flex items-center justify-center p-2">
    <div className="w-[92%] h-[82%] bg-white rounded-[16px] rounded-br-[4px] flex flex-col items-center justify-center relative shadow-xs">
      <span className="text-[#8CC63F] font-sans font-black text-[15.5px] tracking-tight leading-none">HKTV</span>
      <span className="text-slate-800 font-sans font-black text-[9px] tracking-widest uppercase mt-0.5">mall</span>
      <div className="absolute -bottom-[5px] right-[12px] w-0 h-0 border-t-[6px] border-t-white border-r-[6px] border-r-transparent" />
    </div>
  </div>
);

// 16. Fairwood Logo
export const FairwoodLogo: React.FC<LogoProps> = () => (
  <div className="w-full h-full bg-[#FF5000] flex flex-col items-center justify-center p-3 text-white">
    <svg viewBox="0 0 100 100" className="w-[54px] h-[54px] fill-current text-white -mt-2">
      <circle cx="50" cy="22" r="8" />
      <path d="M50,30 C55,35 68,32 75,25 C70,38 65,45 52,48 C48,49 42,52 38,58 C32,66 22,80 15,85 C25,78 35,68 45,58 C49,54 54,58 60,65 C68,74 80,85 88,88 C78,80 70,70 62,60 C58,55 54,42 50,30 Z" />
    </svg>
    <div className="flex flex-col items-center text-[10px] font-sans font-bold leading-none -mt-1 tracking-tight">
      <span className="text-white">大快活</span>
      <span className="text-white/80 text-[7px] font-normal uppercase tracking-wider mt-0.5">Fairwood</span>
    </div>
  </div>
);

// 17. Uniqlo Logo
export const UniqloLogo: React.FC<LogoProps> = () => (
  <div className="w-full h-full bg-[#E60012] flex items-center justify-center p-4">
    <div className="grid grid-cols-2 gap-x-1 gap-y-[1px] text-[15px] leading-none text-white font-sans font-black text-center tracking-normal">
      <span>U</span><span>N</span>
      <span>I</span><span>Q</span>
      <span>L</span><span>O</span>
      <span className="text-[11px] -mt-0.5">■</span><span className="text-[11px] -mt-0.5">■</span>
    </div>
  </div>
);

// 18. Klook Logo
export const KlookLogo: React.FC<LogoProps> = () => (
  <div className="w-full h-full bg-white flex flex-col items-center justify-center p-3">
    <svg viewBox="0 0 100 100" className="w-[46px] h-[46px]">
      <g transform="translate(50, 45)">
        <path d="M0,0 C3,-10 12,-15 18,-6 C24,2 15,10 0,0 Z" fill="#FF5B00" />
        <path d="M0,0 C12,-3 18,6 14,14 C10,22 0,15 0,0 Z" fill="#FDB913" />
        <path d="M0,0 C10,5 6,16 -2,16 C-10,16 -12,5 0,0 Z" fill="#EC008C" />
        <path d="M0,0 C-10,3 -16,-6 -10,-12 C-4,-18 5,-10 0,0 Z" fill="#00B3E3" />
        <path d="M0,0 C-3,-10 5,-18 12,-12 C19,-6 10,5 0,0 Z" fill="#8CC63F" />
      </g>
    </svg>
    <span className="text-[12.5px] font-sans font-black text-[#FF5B00] -mt-0.5 tracking-tight leading-none">klook</span>
  </div>
);

// 19. Don Don Donki Logo
export const DonDonDonkiLogo: React.FC<LogoProps> = () => (
  <div className="w-full h-full bg-[#FFCC00] flex flex-col items-center justify-center p-3 leading-none select-none">
    <span className="text-[#112F7A] font-sans font-black text-[13.5px] tracking-wider uppercase">Don Don</span>
    <span className="text-[#112F7A] font-sans font-black text-[13.5px] tracking-wider uppercase mt-1">Donki</span>
  </div>
);

// 20. foodpanda Logo
export const FoodpandaLogo: React.FC<LogoProps> = () => (
  <div className="w-full h-full bg-[#D50D57] flex flex-col items-center justify-center p-3 text-white leading-none">
    <svg viewBox="0 0 100 100" className="w-[48px] h-[48px] text-white fill-current -mt-1">
      <path d="M50,15 C65,15 76,26 76,40 C76,54 65,65 50,65 C35,65 24,54 24,40 C24,26 35,15 50,15 Z M24,15 C20,15 15,20 15,25 C15,31 20,35 25,35 C26,35 27,35 28,34 C25,29 24,23 24,15 Z M76,15 C76,23 75,29 72,34 C73,35 74,35 75,35 C80,35 85,31 85,25 C85,20 80,15 76,15 Z" />
      <circle cx="38" cy="38" r="8" fill="black" />
      <circle cx="62" cy="38" r="8" fill="black" />
      <circle cx="36" cy="36" r="3" fill="white" />
      <circle cx="60" cy="36" r="3" fill="white" />
      <path d="M46,48 C46,48 50,52 54,48 L50,46 Z" fill="black" />
    </svg>
    <span className="text-[9.5px] font-sans font-black tracking-tight mt-0.5">foodpanda</span>
  </div>
);

// 21. Circle K Logo
export const CircleKLogo: React.FC<LogoProps> = () => (
  <div className="w-full h-full bg-[#E31B23] flex flex-col items-center justify-between p-0 relative">
    <div className="flex-1 flex items-center justify-center w-full">
      <div className="w-[46px] h-[46px] bg-white rounded-full flex items-center justify-center shadow-xs">
        <span className="text-[#E31B23] font-sans font-black text-3xl select-none leading-none -mt-0.5">K</span>
      </div>
    </div>
    <div className="w-full h-[18px] bg-[#F9A01B]" />
  </div>
);

// 22. Mannings Logo
export const ManningsLogo: React.FC<LogoProps> = () => (
  <div className="w-full h-full bg-[#F58220] flex flex-col items-center justify-center p-3 leading-none">
    <span className="text-white font-sans font-black text-[24px] tracking-widest mb-1 select-none">萬寧</span>
    <span className="text-white font-sans font-extrabold text-[11px] tracking-tight uppercase">mannings</span>
  </div>
);

// 20. Illustration: Promo Offers
export const PromoOffersIllustration: React.FC = () => (
  <div className="w-full max-w-[320px] h-[240px] bg-gradient-to-tr from-rose-550/5 to-pink-550/10 rounded-3xl border border-rose-100 flex flex-col items-center justify-center p-6 space-y-4">
    <div className="relative">
      <div className="w-20 h-20 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 text-4xl animate-bounce duration-1000">
        🎁
      </div>
      <span className="absolute -top-1 -right-1 text-2xl">✨</span>
      <span className="absolute -bottom-1 -left-1 text-2xl">⚡</span>
    </div>
    <div className="text-center space-y-1">
      <h4 className="text-sm font-extrabold text-slate-800">Exclusive Reward Packs</h4>
      <p className="text-xs text-slate-500 leading-normal">
        Unlock targeted discounts and local merchant coupons automatically as you purchase.
      </p>
    </div>
  </div>
);

// 21. Illustration: Dim Sum Sharing
export const DimSumSharingIllustration: React.FC = () => (
  <div className="w-full max-w-[320px] h-[240px] bg-gradient-to-tr from-amber-500/5 to-orange-500/10 rounded-3xl border border-amber-100 flex flex-col items-center justify-center p-6 space-y-4">
    <div className="relative">
      <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-4xl">
        🥟
      </div>
      <span className="absolute top-0 right-0 text-2xl">🥢</span>
      <span className="absolute bottom-1 left-2 text-2xl">🍵</span>
    </div>
    <div className="text-center space-y-1">
      <h4 className="text-sm font-extrabold text-slate-800">Splitting is Sharing</h4>
      <p className="text-xs text-slate-500 leading-normal">
        Instantly split dim sum lunches or general checkout receipts with group QR codes.
      </p>
    </div>
  </div>
);

// 22. Illustration: Support & Feedback
export const SupportFeedbackIllustration: React.FC = () => (
  <div className="w-full max-w-[360px] h-[260px] bg-gradient-to-br from-rose-50 to-pink-50 rounded-3xl border border-rose-100/50 flex flex-col items-center justify-center p-6 space-y-4 shadow-xs">
    <div className="relative flex items-center gap-2">
      <div className="w-14 h-14 rounded-full bg-white text-2xl flex items-center justify-center shadow-sm">
        👩‍💻
      </div>
      <div className="w-10 h-10 rounded-full bg-[#FF1A3B] text-white text-base flex items-center justify-center shadow-sm font-extrabold">
        💬
      </div>
    </div>
    <div className="text-center space-y-2">
      <span className="text-[10px] bg-rose-100 text-rose-600 font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
        Hong Kong Ops Hub
      </span>
      <h4 className="text-sm font-black text-slate-900 mt-1">24/7 Sandbox Support Desk</h4>
      <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
        Test support workflows, transaction disputes, refunds, and interactive queues simulated live.
      </p>
    </div>
  </div>
);
