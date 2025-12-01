import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [cloudName, setCloudName] = useState('drnmanvbf');
  const [uploadPreset, setUploadPreset] = useState('davedave');

  useEffect(() => {
    if (isOpen) {
      const storedCloud = localStorage.getItem('marketer_cloudinary_name');
      const storedPreset = localStorage.getItem('marketer_cloudinary_preset');
      if (storedCloud) setCloudName(storedCloud);
      if (storedPreset) setUploadPreset(storedPreset);
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('marketer_cloudinary_name', cloudName.trim());
    localStorage.setItem('marketer_cloudinary_preset', uploadPreset.trim());
    onClose();
    alert("Settings Saved! Unlimited uploads enabled.");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden font-sans">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h2 className="text-xl font-bold text-brand-navy">Dashboard Settings</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h3 className="font-bold text-blue-900 text-sm mb-1">☁️ Cloudinary Active</h3>
            <p className="text-blue-800/70 text-xs leading-relaxed">
              Your keys are hardcoded. You can upload large files immediately.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Cloud Name</label>
              <input 
                type="text" 
                value={cloudName}
                onChange={(e) => setCloudName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-brand-cyan outline-none font-medium"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Upload Preset</label>
              <input 
                type="text" 
                value={uploadPreset}
                onChange={(e) => setUploadPreset(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:border-brand-cyan outline-none font-medium"
              />
            </div>
          </div>

          <button 
            onClick={handleSave}
            className="w-full bg-brand-cyan text-white font-bold py-3 rounded-lg hover:bg-brand-navy transition-colors flex items-center justify-center gap-2 shadow-md"
          >
            <Save size={18} /> Save
          </button>
        </div>
      </div>
    </div>
  );
};