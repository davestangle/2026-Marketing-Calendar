
import React from 'react';
import { MonthData } from '../types';
import { MessageSquare } from 'lucide-react';

interface MonthCardProps {
  month: MonthData;
  isEditing: boolean;
  onUpdate: (updatedMonth: MonthData) => void;
  onClick: () => void;
}

export const MonthCard: React.FC<MonthCardProps> = ({ month, isEditing, onUpdate, onClick }) => {
  
  const handleLaunchTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({
      ...month,
      productLaunch: { ...month.productLaunch, title: e.target.value }
    });
  };

  const hasLaunch = !!month.productLaunch.title;
  // Count active (unresolved) comment threads
  const activeCommentCount = month.comments ? month.comments.filter(c => !c.resolved).length : 0;

  return (
    <div 
      onClick={onClick}
      className={`
        relative flex flex-col h-full bg-white rounded-xl shadow-lg 
        transition-all duration-300 border-t-4
        ${hasLaunch ? 'border-brand-cyan' : 'border-gray-200'}
        ${!isEditing ? 'hover:-translate-y-1 hover:shadow-xl cursor-pointer' : 'cursor-default'}
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
        <h3 className="text-xl font-bold text-brand-navy uppercase tracking-wide">{month.name}</h3>
        {activeCommentCount > 0 && (
          <div className="flex items-center gap-1 text-brand-cyan bg-brand-light px-2 py-0.5 rounded-full border border-brand-cyan/20 shadow-sm animate-in fade-in">
            <MessageSquare size={12} fill="currentColor" className="opacity-20" />
            <span className="text-xs font-bold">{activeCommentCount}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-center gap-6">
        
        {/* Product Launch Section */}
        <div className={`
          flex flex-col gap-1 p-3 rounded-lg transition-colors
          ${hasLaunch ? 'bg-brand-light/50' : 'bg-gray-50/50'}
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
         <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-brand-navy text-white text-xs px-2 py-1 rounded shadow-sm">Details</div>
         </div>
      )}
    </div>
  );
};