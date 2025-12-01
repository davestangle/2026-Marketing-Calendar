
import React from 'react';
import { MonthData, Quarter } from '../types';
import { MonthCard } from './MonthCard';

interface QuarterSectionProps {
  quarterName: Quarter;
  months: MonthData[];
  isEditing: boolean;
  onUpdateMonth: (updatedMonth: MonthData) => void;
  onSelectMonth: (month: MonthData) => void;
  onProcessMedia: (file: File) => Promise<string>;
}

export const QuarterSection: React.FC<QuarterSectionProps> = ({ 
  quarterName, 
  months, 
  isEditing, 
  onUpdateMonth,
  onSelectMonth,
  onProcessMedia
}) => {
  return (
    <section className="w-full mb-12 last:mb-0">
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-4xl font-black text-white/90 tracking-tighter drop-shadow-sm">{quarterName}</h2>
        <div className="h-1 flex-1 bg-white/20 rounded-full"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {months.map(month => (
          <MonthCard
            key={month.id}
            month={month}
            isEditing={isEditing}
            onUpdate={onUpdateMonth}
            onClick={() => onSelectMonth(month)}
            onProcessMedia={onProcessMedia}
          />
        ))}
      </div>
    </section>
  );
};
