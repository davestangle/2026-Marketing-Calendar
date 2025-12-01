import React, { useRef } from 'react';
import { ToggleLeft, ToggleRight, Upload, LogIn } from 'lucide-react';
import { User } from 'firebase/auth';

interface HeaderProps {
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  user: User | null;
  onSignIn: () => void;
  onSignOut: () => void;
  logo: string | null;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  isEditing, 
  setIsEditing, 
  user,
  onSignIn,
  onSignOut,
  logo,
  onLogoUpload 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="sticky top-0 z-50 w-full bg-brand-cyan shadow-lg border-b border-white/10 px-6 h-24 flex items-center justify-between relative transition-colors duration-300">
      
      {/* Left: Title & Brand */}
      <div className="flex items-center gap-4 relative z-10 min-w-[200px]">
        <div>
           <h1 className="text-5xl font-black tracking-tighter leading-none select-none">
             <span className="text-white">2026</span><span className="text-brand-navy ml-2">CALENDAR</span>
           </h1>
        </div>
      </div>

      {/* Center: Logo */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0 hidden md:block">
        {isEditing ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="cursor-pointer group flex items-center justify-center border-2 border-dashed border-white/40 hover:border-white bg-white/10 hover:bg-white/20 rounded-lg px-6 py-2 transition-all h-16 min-w-[240px]"
            title="Click to upload logo"
          >
            {logo ? (
               <img src={logo} alt="Dashboard Logo" className="h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity" />
            ) : (
               <div className="flex items-center gap-2 text-white/60 group-hover:text-white transition-colors">
                 <Upload size={18} />
                 <span className="text-xs font-bold uppercase tracking-wider">Upload Logo</span>
               </div>
            )}
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              onChange={onLogoUpload} 
              className="hidden"
            />
          </div>
        ) : (
          logo && (
            <img src={logo} alt="Dashboard Logo" className="h-16 w-auto object-contain drop-shadow-md" />
          )
        )}
      </div>

      {/* Right: Controls & Auth */}
      <div className="flex items-center gap-4 relative z-10 min-w-[200px] justify-end">
         
         {/* Cloud Status */}
         <div className="hidden lg:flex items-center gap-1.5 bg-brand-navy/20 px-3 py-1.5 rounded-full border border-white/10 shadow-sm backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_5px_rgba(74,222,128,0.6)]"></div>
            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Cloud Live</span>
         </div>

         {/* Auth Section */}
         <div className="mr-4 border-r border-white/20 pr-4 flex items-center">
            {user ? (
               <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                     <p className="text-xs font-bold text-white">{user.displayName}</p>
                     <button onClick={onSignOut} className="text-[10px] text-brand-navy hover:text-white flex items-center justify-end gap-1 ml-auto transition-colors font-semibold">
                        Sign Out
                     </button>
                  </div>
                  {user.photoURL ? (
                     <img src={user.photoURL} alt={user.displayName || "User"} className="w-9 h-9 rounded-full border-2 border-white/50 shadow-sm" />
                  ) : (
                     <div className="w-9 h-9 bg-white text-brand-cyan rounded-full flex items-center justify-center font-bold shadow-sm">
                        {user.displayName?.charAt(0) || "U"}
                     </div>
                  )}
               </div>
            ) : (
               <button 
                 onClick={onSignIn}
                 className="flex items-center gap-2 bg-white text-brand-cyan hover:bg-gray-50 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-lg"
               >
                 <LogIn size={14} />
                 Sign In
               </button>
            )}
         </div>

        {/* Edit Toggle */}
        <div 
          className="flex items-center gap-2 cursor-pointer group select-none" 
          onClick={() => setIsEditing(!isEditing)}
        >
          <span className={`text-sm font-bold transition-colors hidden sm:block ${isEditing ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>
            {isEditing ? 'Done Editing' : 'Edit Dashboard'}
          </span>
          {isEditing ? (
            <ToggleRight className="text-brand-navy drop-shadow-md" size={32} />
          ) : (
            <ToggleLeft className="text-brand-navy/40 group-hover:text-brand-navy/60 transition-colors" size={32} />
          )}
        </div>
      </div>
    </header>
  );
};