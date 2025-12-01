
import React, { useRef } from 'react';
import { MonthData } from '../types';
import { MessageSquare, Upload, ImageIcon } from 'lucide-react';

interface MonthCardProps {
  month: MonthData;
  isEditing: boolean;
  onUpdate: (updatedMonth: MonthData) => void;
  onClick: () => void;
  onProcessMedia: (file: File) => Promise<string>;
}

export const MonthCard: React.FC<MonthCardProps> = ({ month, isEditing, onUpdate, onClick, onProcessMedia }) => {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLaunchTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({
      ...month,
      productLaunch: { ...month.productLaunch, title: e.target.value }
    });
  };

  const handleHeaderLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation(); // Prevent card click
    const file = e.target.files?.[0];
    if (file) {
      try {
        const result = await onProcessMedia(file);
        onUpdate({
          ...month,
          headerLogo: result
        });
      } catch (err) {
        alert("Failed to process logo.");
      }
    }
  };

  const hasLaunch = !!month.productLaunch.title;
  // Count active (unresolved) comment threads
  const activeCommentCount = month.comments ? month.comments.filter(c => !c.resolved).length : 0;

  return (
    <div 
      onClick={onClick}
      className={`
        relative flex flex-col h-full bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)]
        transition-all duration-300 border-t-4
        ${hasLaunch ? 'border-brand-cyan' : 'border-gray-200'}
        ${!isEditing ? 'hover:-translate-y-2 hover:shadow-[0_12px_40px_rgba(0,175,215,0.2)] cursor-pointer' : 'cursor-default'}
      `}
    >
      {/* Header - Split 50/50 and Taller for Square Logos */}
      <div className="h-32 border-b border-gray-100 flex items-stretch bg-gray-50 rounded-t-xl overflow-hidden">
        
        {/* Left: Name & Comment Count */}
        <div className="w-1/2 p-4 flex flex-col justify-between border-r border-gray-100 bg-white/50 relative">
          <h3 className="text-xl font-bold text-brand-navy uppercase tracking-wide break-words leading-tight">{month.name}</h3>
          {activeCommentCount > 0 && (
            <div className="flex items-center gap-1 text-brand-cyan animate-in fade-in self-start bg-brand-light px-2 py-0.5 rounded-full border border-brand-cyan/20">
              <MessageSquare size={12} fill="currentColor" className="opacity-20" />
              <span className="text-xs font-bold">{activeCommentCount}</span>
            </div>
          )}
          {/* Subtle shine effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/60 opacity-0 hover:opacity-100 transition-opacity pointer-events-none"></div>
        </div>

        {/* Right: Header Logo Area (50% Width) */}
        <div 
          onClick={(e) => {
             e.stopPropagation();
             if (isEditing) logoInputRef.current?.click();
          }}
          className={`
            w-1/2 relative flex items-center justify-center bg-white p-2
            ${isEditing ? 'hover:bg-brand-light/30 cursor-pointer group' : ''}
          `}
        >
          {month.headerLogo ? (
            <img src={month.headerLogo} alt={`${month.name} Logo`} className="w-full h-full object-contain" />
          ) : (
            isEditing && (
              <div className="text-center group-hover:scale-105 transition-transform">
                <Upload size={24} className="text-gray-200 mx-auto group-hover:text-brand-cyan transition-colors" />
                <span className="text-[10px] font-bold text-gray-300 uppercase mt-1 block group-hover:text-brand-cyan transition-colors">Upload Logo</span>
              </div>
            )
          )}
          
          {/* Edit Overlay for Logo */}
          {isEditing && month.headerLogo && (
            <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity backdrop-blur-[1px]">
               <Upload size={20} className="text-brand-navy drop-shadow-md" />
            </div>
          )}

          <input 
            type="file"
            ref={logoInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleHeaderLogoUpload}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-center gap-6">
        
        {/* Product Launch Section */}
        <div className={`
          flex flex-col gap-1 p-3 rounded-lg transition-colors border border-transparent
          ${hasLaunch ? 'bg-brand-light/50 border-brand-cyan/5' : 'bg-gray-50/50'}
        `}>
          <div className="flex items-center gap-2 mb-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Launch Spotlight
            </label>
          </div>
          
          {isEditing ? (
            <input
              type="text"
              value={month.productLaunch.title}
              onChange={handleLaunchTitleChange}
              onClick={(e) => e.stopPropagation()}
              className="w-full border-b-2 border-brand-cyan/20 focus:border-brand-cyan outline-none py-1 text-brand-navy font-bold text-lg bg-transparent transition-colors placeholder:font-normal placeholder:text-gray-300"
              placeholder="Add Launch Title..."
            />
          ) : (
            <p className={`font-bold leading-tight ${hasLaunch ? 'text-brand-navy text-lg' : 'text-gray-300 text-sm italic'}`}>
              {month.productLaunch.title || "No major launch"}
            </p>
          )}
        </div>
      </div>
      
      {!isEditing && (
         <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <div className="bg-brand-navy text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
               Open Details
            </div>
         </div>
      )}
    </div>
  );
};
