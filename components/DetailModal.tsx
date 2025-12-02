import React, { useRef, useState, useEffect } from 'react';
import { MonthData, Comment } from '../types';
import { X, Upload, Plus, Trash2, Target, Banknote, Link as LinkIcon, ExternalLink, Edit2, Save, MessageSquare, Send, CheckCircle2, Reply, ChevronDown, Loader2, Link2, FileText, Layers, Calendar, Info } from 'lucide-react';

interface DetailModalProps {
  month: MonthData;
  isOpen: boolean;
  onClose: () => void;
  globalIsEditing: boolean;
  onUpdate: (updatedMonth: MonthData) => void;
  userName: string;
  setUserName: (name: string) => void;
  onProcessMedia: (file: File) => Promise<string>;
}

export const DetailModal: React.FC<DetailModalProps> = ({ 
  month, 
  isOpen, 
  onClose, 
  globalIsEditing, 
  onUpdate,
  userName,
  setUserName,
  onProcessMedia
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const commentScrollRef = useRef<HTMLDivElement>(null);

  const [isLocalEditing, setIsLocalEditing] = useState(globalIsEditing);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Processing Media...");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkInputValue, setLinkInputValue] = useState("");

  // LOCAL FORM BUFFER
  const [localLaunchData, setLocalLaunchData] = useState(month.productLaunch);

  useEffect(() => {
    setLocalLaunchData(month.productLaunch);
  }, [month.id]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (JSON.stringify(month.productLaunch) !== JSON.stringify(localLaunchData)) {
        onUpdate({
          ...month,
          productLaunch: localLaunchData
        });
      }
    }, 500); 
    return () => clearTimeout(timer);
  }, [localLaunchData, month.id]); 

  useEffect(() => {
    setIsLocalEditing(globalIsEditing);
  }, [globalIsEditing]);

  useEffect(() => {
    if (showComments && commentScrollRef.current) {
      commentScrollRef.current.scrollTop = commentScrollRef.current.scrollHeight;
    }
  }, [showComments, month.comments?.length]); 

  if (!isOpen || !month) return null;

  // --- HELPER: RENDER RICH TEXT (LINKS + NEWLINES + BULLETS) ---
  const renderStyledText = (text: string | undefined) => {
    if (!text) return '—';
    const lines = text.split('\n');
    return lines.map((line, lineIndex) => {
      // Check for bullet points
      const isBullet = line.trim().startsWith('-') || line.trim().startsWith('•');
      
      const parts = line.split(/(\[.*?\]\(.*?\))/g);
      const parsedLine = parts.map((part, i) => {
        const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
        if (linkMatch) {
           return (
             <a 
               key={i} 
               href={linkMatch[2]} 
               target="_blank" 
               rel="noopener noreferrer"
               className="text-brand-cyan hover:underline font-bold"
               onClick={(e) => e.stopPropagation()}
             >
               {linkMatch[1]}
             </a>
           );
        }
        return part;
      });
      
      return (
        <div key={lineIndex} className={`min-h-[1.2em] ${isBullet ? 'pl-4' : ''}`}>
          {parsedLine}
        </div>
      );
    });
  };

  // --- HANDLERS ---
  const updateLocalField = (field: keyof typeof localLaunchData, value: any) => {
    setLocalLaunchData(prev => ({ ...prev, [field]: value }));
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; 
    if (file) {
      setIsProcessing(true);
      setStatusMessage("Uploading... (Large files may take 10-20s)");
      try {
        const result = await onProcessMedia(file);
        onUpdate({ ...month, productLaunch: { ...localLaunchData, image: result } });
        updateLocalField('image', result); 
      } catch (err: any) {
        alert(err.message || "Failed to process file.");
      } finally {
        setIsProcessing(false);
        setStatusMessage("Processing Media...");
      }
    }
  };

  const openLinkInput = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setLinkInputValue(""); setShowLinkInput(true);
  };

  const submitLinkInput = (e?: React.MouseEvent) => {
    e?.preventDefault(); e?.stopPropagation();
    let url = linkInputValue.trim();
    if (url) {
      if (url.includes('drive.google.com') && url.includes('/file/d/')) {
         const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
         if (match && match[1]) url = `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
      onUpdate({ ...month, productLaunch: { ...localLaunchData, image: url } });
      updateLocalField('image', url);
    }
    setShowLinkInput(false);
  };

  const handleRemoveMedia = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    onUpdate({ ...month, productLaunch: { ...localLaunchData, image: '' } });
    updateLocalField('image', '');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      setIsProcessing(true);
      setStatusMessage("Processing Logo...");
      try {
        const result = await onProcessMedia(file);
        onUpdate({ ...month, productLaunch: { ...localLaunchData, logo: result } });
        updateLocalField('logo', result);
      } catch (err: any) {
        alert(err.message || "Failed to process logo.");
      } finally {
        setIsProcessing(false);
        setStatusMessage("Processing Media...");
      }
    }
  };

  // --- Campaign Handlers ---
  const addCampaign = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    onUpdate({
      ...month,
      campaigns: [...(month.campaigns || []), { id: newId, name: 'New Activity' }]
    });
  };

  const updateCampaign = (id: string, name: string) => {
    onUpdate({
      ...month,
      campaigns: month.campaigns?.map(c => c.id === id ? { ...c, name } : c)
    });
  };

  const removeCampaign = (id: string) => {
    onUpdate({
      ...month,
      campaigns: month.campaigns?.filter(c => c.id !== id)
    });
  };

  // --- Resource Handlers ---
  const addResource = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    const currentResources = localLaunchData.resources || [];
    const newResources = [...currentResources, { id: newId, label: 'New Resource', url: 'https://' }];
    updateLocalField('resources', newResources);
    onUpdate({ ...month, productLaunch: { ...localLaunchData, resources: newResources } });
  };

  const updateResource = (id: string, field: 'label' | 'url', value: string) => {
    const newResources = localLaunchData.resources?.map(r => r.id === id ? { ...r, [field]: value } : r);
    updateLocalField('resources', newResources);
    onUpdate({ ...month, productLaunch: { ...localLaunchData, resources: newResources } });
  };

  const removeResource = (id: string) => {
    const newResources = localLaunchData.resources?.filter(r => r.id !== id);
    updateLocalField('resources', newResources);
    onUpdate({ ...month, productLaunch: { ...localLaunchData, resources: newResources } });
  };

  // --- Comment Handlers ---
  const saveName = () => { if(tempName.trim()) setUserName(tempName.trim()); };
  const addTopLevelComment = () => {
    if (!newComment.trim() || !userName) return;
    const comment: Comment = { id: Date.now().toString(), text: newComment, timestamp: new Date().toISOString(), author: userName, resolved: false, replies: [] };
    onUpdate({ ...month, comments: [...(month.comments || []), comment] });
    setNewComment("");
  };
  const addReply = (parentId: string) => {
    if (!replyText.trim() || !userName) return;
    const reply: Comment = { id: Date.now().toString(), text: replyText, timestamp: new Date().toISOString(), author: userName, resolved: false, replies: [] };
    onUpdate({ ...month, comments: month.comments?.map(c => c.id === parentId ? { ...c, replies: [...(c.replies || []), reply] } : c) });
    setReplyText(""); setActiveReplyId(null);
  };
  const deleteComment = (commentId: string, parentId?: string) => {
    if (parentId) onUpdate({ ...month, comments: month.comments?.map(c => c.id === parentId ? { ...c, replies: c.replies?.filter(r => r.id !== commentId) } : c) });
    else onUpdate({ ...month, comments: month.comments?.filter(c => c.id !== commentId) });
  };
  const toggleResolve = (commentId: string) => {
    onUpdate({ ...month, comments: month.comments?.map(c => c.id === commentId ? { ...c, resolved: !c.resolved } : c) });
  };
  const formatTime = (iso: string) => { const d = new Date(iso); return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); };

  const safeComments = month.comments || [];
  const activeComments = safeComments.filter(c => !c.resolved);
  const commentsToDisplay = showResolved ? [...activeComments, ...safeComments.filter(c => c.resolved)] : activeComments;
  commentsToDisplay.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Render Media
  const renderMedia = () => {
    const src = localLaunchData.image; 
    if (!src) return null;
    if (src.includes('drive.google.com') && src.includes('/preview')) return <iframe key={src} src={src} className="w-full h-full border-0 bg-black" allow="autoplay" />;
    if (src.includes('youtube.com') || src.includes('youtu.be')) {
      let embedSrc = src;
      if (src.includes('watch?v=')) embedSrc = src.replace('watch?v=', 'embed/');
      else if (src.includes('youtu.be/')) embedSrc = src.replace('youtu.be/', 'youtube.com/embed/');
      return <iframe key={src} src={embedSrc} className="w-full h-full border-0 bg-black" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
    }
    const isVideo = src.startsWith('data:video') || /\.(mp4|webm|mov|m4v)($|\?)/i.test(src) || src.includes('/video/upload/');
    if (isVideo) return <video key={src} src={src} controls autoPlay loop muted playsInline className="w-full h-full object-contain max-h-[600px] animate-in fade-in" />;
    return <img key={src} src={src} alt="Visual" className="w-full h-full object-contain max-h-[600px] animate-in fade-in" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = `<div class="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-4 text-center"><p class="font-bold">Unable to Load Media</p><p class="text-xs">Link blocked or broken.</p></div>`; }} />;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 font-sans">
      <div className="absolute inset-0 bg-brand-navy/60 backdrop-blur-md transition-opacity duration-300" onClick={!isProcessing && !showLinkInput ? onClose : undefined} />
      
      {/* EXPANDED WIDTH: max-w-[95vw] */}
      <div className={`relative bg-white w-full max-w-[95vw] max-h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out ${showComments ? 'pr-[350px]' : ''}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white z-10 shrink-0">
          <div><h2 className="text-3xl font-bold text-brand-navy tracking-tight">{month.name} {month.year}</h2><p className="text-gray-400 font-medium text-sm mt-1 uppercase tracking-widest">{month.quarter}</p></div>
          <div className="flex items-center gap-3">
             <button disabled={isProcessing} onClick={() => setIsLocalEditing(!isLocalEditing)} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all disabled:opacity-50 ${isLocalEditing ? 'bg-brand-cyan text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>{isLocalEditing ? <><Save size={16} /> Save Edits</> : <><Edit2 size={16} /> Edit Page</>}</button>
             <button onClick={() => setShowComments(!showComments)} className={`relative p-2 rounded-full transition-colors ${showComments ? 'bg-brand-navy/10 text-brand-navy' : 'hover:bg-gray-100 text-gray-500'}`} title="Comments"><MessageSquare size={24} />{activeComments.length > 0 && <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">{activeComments.length}</span>}</button>
             <div className="w-px h-8 bg-gray-200 mx-1"></div>
             <button disabled={isProcessing} onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors text-gray-400 disabled:opacity-50"><X size={32} /></button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          {/* GRID LAYOUT */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* --- LEFT COLUMN (5/12): Image + Budget + Resources --- */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Media Container */}
              <div className={`relative min-h-[350px] bg-gray-50 rounded-xl overflow-hidden shadow-inner border border-gray-200 group flex items-center justify-center ${isLocalEditing ? 'cursor-pointer hover:border-brand-cyan hover:shadow-md transition-all' : ''}`} onClick={(e) => { if (!isProcessing && !showLinkInput && isLocalEditing && !(e.target as HTMLElement).closest('button') && !(e.target as HTMLElement).closest('input')) fileInputRef.current?.click(); }}>
                {isProcessing && <div className="absolute inset-0 z-20 bg-white/90 flex flex-col items-center justify-center backdrop-blur-sm"><Loader2 size={48} className="text-brand-cyan animate-spin mb-4" /><p className="text-brand-navy font-black text-lg tracking-tight">{statusMessage}</p></div>}
                {showLinkInput && <div className="absolute inset-0 z-[60] bg-white flex flex-col items-center justify-center p-8" onClick={(e) => e.stopPropagation()}><h3 className="text-brand-navy font-bold text-lg mb-4 flex items-center gap-2"><Link2 size={20} /> Paste Media Link</h3><input autoFocus type="text" className="w-full max-w-md border-2 border-brand-cyan/30 focus:border-brand-cyan rounded-lg p-3 mb-4 text-sm outline-none" placeholder="https://..." value={linkInputValue} onChange={e => setLinkInputValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitLinkInput()} /><div className="flex gap-3"><button onClick={(e) => { e.stopPropagation(); setShowLinkInput(false); }} className="px-6 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-bold">Cancel</button><button onClick={submitLinkInput} className="px-6 py-2 bg-brand-cyan text-white hover:bg-brand-navy rounded-lg text-sm font-bold shadow-md">Save Link</button></div></div>}
                {localLaunchData.image ? renderMedia() : <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center pointer-events-none"><span className="text-6xl mb-4 opacity-20 grayscale">📷</span><p className="text-sm font-medium uppercase tracking-widest opacity-50">{isLocalEditing ? 'Click to Upload or Link' : 'No Visual Asset'}</p></div>}
                {isLocalEditing && !isProcessing && !showLinkInput && <><button type="button" onClick={openLinkInput} className="absolute top-4 left-4 z-50 p-2.5 bg-white text-brand-cyan rounded-full shadow-lg hover:bg-brand-light hover:scale-105 transition-all border border-brand-cyan/10"><Link2 size={20} /></button>{localLaunchData.image && <button type="button" onClick={handleRemoveMedia} className="absolute top-4 right-4 z-50 p-2.5 bg-white text-red-400 rounded-full shadow-lg hover:bg-red-50 hover:text-red-600 hover:scale-105 transition-all border border-red-100"><Trash2 size={20} /></button>}</>}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleMediaUpload} />
              </div>

              {/* Budgets (Moved to Left Col) */}
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-4 text-gray-600 border-b border-gray-200 pb-2"><Banknote size={18} /><h4 className="font-bold text-sm uppercase tracking-wide">Budget Allocation</h4></div>
                  <div className="space-y-4">
                     <div><div className="flex justify-between text-xs font-bold text-brand-navy mb-1 uppercase tracking-wider"><span>Performance Spend</span>{isLocalEditing ? <input type="text" value={localLaunchData.performanceSpend} onChange={(e) => updateLocalField('performanceSpend', e.target.value)} className="text-right bg-white border border-gray-300 rounded px-1 w-24 focus:border-brand-cyan outline-none" placeholder="$0" /> : <span>{localLaunchData.performanceSpend || '—'}</span>}</div><div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner"><div className="bg-brand-cyan h-full rounded-full" style={{ width: '65%' }}></div></div></div>
                     <div><div className="flex justify-between text-xs font-bold text-brand-navy mb-1 uppercase tracking-wider"><span>Brand Awareness</span>{isLocalEditing ? <input type="text" value={localLaunchData.brandSpend} onChange={(e) => updateLocalField('brandSpend', e.target.value)} className="text-right bg-white border border-gray-300 rounded px-1 w-24 focus:border-brand-cyan outline-none" placeholder="$0" /> : <span>{localLaunchData.brandSpend || '—'}</span>}</div><div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner"><div className="bg-brand-navy h-full rounded-full" style={{ width: '40%' }}></div></div></div>
                  </div>
              </div>

              {/* Resources (Moved to Left Col) */}
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2"><div className="flex items-center gap-2 text-gray-600"><LinkIcon size={18} /><h4 className="font-bold text-sm uppercase tracking-wide">Resources & Decks</h4></div>{isLocalEditing && <button onClick={addResource} className="text-xs font-bold text-brand-cyan flex items-center gap-1 hover:underline"><Plus size={14} /> Add</button>}</div>
                  <div className="space-y-2">
                    {(localLaunchData.resources || []).map((resource) => (
                      <div key={resource.id} className="flex items-center gap-2 group">
                        {isLocalEditing ? <div className="flex-1 grid grid-cols-2 gap-2"><input type="text" value={resource.label} onChange={(e) => updateResource(resource.id, 'label', e.target.value)} className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:border-brand-cyan outline-none" placeholder="Link Label" /><input type="text" value={resource.url} onChange={(e) => updateResource(resource.id, 'url', e.target.value)} className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:border-brand-cyan outline-none text-gray-500" placeholder="URL" /></div> : <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center gap-2 text-sm font-bold text-brand-cyan hover:underline hover:text-brand-navy transition-colors bg-white border border-gray-200 p-2 rounded-lg shadow-sm hover:shadow hover:border-brand-cyan/30"><ExternalLink size={14} />{resource.label}</a>}
                        {isLocalEditing && <button onClick={() => removeResource(resource.id)} className="text-gray-300 hover:text-red-500 p-1 transition-colors opacity-50 group-hover:opacity-100"><Trash2 size={16} /></button>}
                      </div>
                    ))}
                    {(!localLaunchData.resources?.length) && !isLocalEditing && <p className="text-gray-400 text-sm italic pl-2">No resources attached.</p>}
                  </div>
              </div>
            </div>

            {/* --- RIGHT COLUMN (7/12) --- */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Title & Logo */}
              <div className="flex gap-4 items-start">
                 <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Launch Title</label>
                    <input type="text" readOnly={!isLocalEditing} value={localLaunchData.title} onChange={(e) => updateLocalField('title', e.target.value)} className={`w-full text-3xl font-bold text-brand-navy outline-none bg-transparent placeholder-gray-200 leading-tight ${isLocalEditing ? 'border-b-2 border-brand-cyan/30 focus:border-brand-cyan pb-2 transition-colors' : ''}`} placeholder={isLocalEditing ? "Enter Launch Title..." : "No Launch Scheduled"} />
                 </div>
                 <div onClick={() => !isProcessing && isLocalEditing && logoInputRef.current?.click()} className={`w-24 h-24 shrink-0 rounded-lg border-2 flex items-center justify-center bg-white relative overflow-hidden group shadow-sm ${isLocalEditing ? 'border-dashed border-gray-300 hover:border-brand-cyan cursor-pointer hover:bg-brand-light/10 transition-colors' : 'border-transparent'}`}>
                    {isProcessing ? <Loader2 size={20} className="text-brand-cyan animate-spin" /> : localLaunchData.logo ? <img src={localLaunchData.logo} alt="Logo" className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform" /> : isLocalEditing && <div className="text-center"><Upload size={20} className="mx-auto text-gray-300 mb-1" /><span className="text-[10px] text-gray-400 font-bold uppercase">Add Logo</span></div>}
                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                 </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-200 flex items-center gap-3">
                   <div className="p-2 bg-brand-light/50 rounded-full text-brand-cyan"><Calendar size={16} /></div>
                   <div className="flex-1"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Campaign Launch Date</p>{isLocalEditing ? <input type="text" value={localLaunchData.launchDate || ''} onChange={(e) => updateLocalField('launchDate', e.target.value)} className="w-full bg-transparent border-b border-gray-300 focus:border-brand-cyan outline-none text-sm font-bold text-brand-navy" placeholder="e.g. Mar 10" /> : <p className="text-sm font-bold text-brand-navy">{localLaunchData.launchDate || '—'}</p>}</div>
                </div>
                <div className="bg-gray-50/50 p-3 rounded-lg border border-gray-200 flex items-center gap-3">
                   <div className="p-2 bg-brand-light/50 rounded-full text-brand-navy"><Calendar size={16} /></div>
                   <div className="flex-1"><p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Campaign End Date</p>{isLocalEditing ? <input type="text" value={localLaunchData.endDate || ''} onChange={(e) => updateLocalField('endDate', e.target.value)} className="w-full bg-transparent border-b border-gray-300 focus:border-brand-cyan outline-none text-sm font-bold text-brand-navy" placeholder="e.g. Apr 5" /> : <p className="text-sm font-bold text-brand-navy">{localLaunchData.endDate || '—'}</p>}</div>
                </div>
              </div>

              {/* Objective */}
              <div className="bg-brand-light/30 p-5 rounded-xl border border-brand-cyan/10 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand-cyan/50"></div>
                  <div className="flex items-center gap-2 mb-3 text-brand-navy"><Target size={18} /><h4 className="font-bold text-sm uppercase tracking-wide">Objective</h4></div>
                  {isLocalEditing ? (
                    <><textarea value={localLaunchData.objective} onChange={(e) => updateLocalField('objective', e.target.value)} className="w-full bg-white border border-brand-cyan/20 rounded-lg p-3 text-brand-navy text-sm focus:ring-2 focus:ring-brand-cyan/30 outline-none resize-none min-h-[100px] shadow-sm mb-2" placeholder="What is the main goal?" /><p className="text-[10px] text-gray-400 flex items-center gap-1"><Info size={10} /> Tip: Use [Link Text](https://url.com) to add links.</p></>
                  ) : <div className="text-brand-navy/80 leading-relaxed font-medium whitespace-pre-wrap">{renderStyledText(localLaunchData.objective)}</div>}
              </div>

              {/* WHATS ON THE TABLE (Custom 1) */}
              <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-3 text-brand-navy border-b border-gray-200 pb-2"><FileText size={18} />{isLocalEditing ? <input type="text" value={localLaunchData.section1Title || 'WHATS ON THE TABLE'} onChange={(e) => updateLocalField('section1Title', e.target.value)} className="font-bold text-sm uppercase tracking-wide bg-transparent border-b border-dashed border-gray-400 focus:border-brand-cyan outline-none text-brand-navy w-full" /> : <h4 className="font-bold text-sm uppercase tracking-wide">{localLaunchData.section1Title || 'WHATS ON THE TABLE'}</h4>}</div>
                  {isLocalEditing ? (
                    <><textarea value={localLaunchData.section1Text || ''} onChange={(e) => updateLocalField('section1Text', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-3 text-brand-navy text-sm focus:ring-1 focus:ring-brand-cyan outline-none resize-none min-h-[80px]" placeholder="Add details here..." /><p className="text-[10px] text-gray-400 mt-1">Supports links and bullets (- or •)</p></>
                  ) : <div className="text-brand-navy/80 leading-relaxed text-sm whitespace-pre-wrap">{renderStyledText(localLaunchData.section1Text)}</div>}
              </div>

              {/* PRE CAMPAIGN TIMELINE (Custom 2) */}
              <div className="bg-gray-50/50 p-5 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-3 text-brand-navy border-b border-gray-200 pb-2"><Layers size={18} />{isLocalEditing ? <input type="text" value={localLaunchData.section2Title || 'PRE CAMPAIGN TIMELINE'} onChange={(e) => updateLocalField('section2Title', e.target.value)} className="font-bold text-sm uppercase tracking-wide bg-transparent border-b border-dashed border-gray-400 focus:border-brand-cyan outline-none text-brand-navy w-full" /> : <h4 className="font-bold text-sm uppercase tracking-wide">{localLaunchData.section2Title || 'PRE CAMPAIGN TIMELINE'}</h4>}</div>
                  {isLocalEditing ? (
                    <textarea value={localLaunchData.section2Text || ''} onChange={(e) => updateLocalField('section2Text', e.target.value)} className="w-full bg-white border border-gray-200 rounded-lg p-3 text-brand-navy text-sm focus:ring-1 focus:ring-brand-cyan outline-none resize-none min-h-[80px]" placeholder="Add details here..." />
                  ) : <div className="text-brand-navy/80 leading-relaxed text-sm whitespace-pre-wrap">{renderStyledText(localLaunchData.section2Text)}</div>}
              </div>

            </div>
          </div>

          <hr className="border-gray-100 my-8" />

          {/* Additional Campaigns - Now using Textarea for richer editing */}
          <div className="">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-brand-navy flex items-center gap-2">Additional Campaign Activities<span className="text-sm font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">{(month.campaigns || []).length}</span></h3>
              {isLocalEditing && <button onClick={addCampaign} className="text-sm bg-brand-cyan/10 text-brand-cyan px-3 py-1.5 rounded-lg hover:bg-brand-cyan hover:text-white transition-all font-bold flex items-center gap-1 shadow-sm"><Plus size={16} /> Add Activity</button>}
            </div>
            {(month.campaigns && month.campaigns.length > 0) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {month.campaigns.map((campaign) => (
                  <div key={campaign.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex flex-col gap-2 group hover:bg-white hover:shadow-sm transition-all hover:border-brand-cyan/20">
                    <div className="flex justify-between items-start">
                       {isLocalEditing ? (
                         <textarea 
                           value={campaign.name} 
                           onChange={(e) => updateCampaign(campaign.id, e.target.value)} 
                           className="bg-white border border-gray-200 rounded p-2 text-sm w-full min-h-[60px] focus:border-brand-cyan outline-none text-brand-navy resize-none" 
                           placeholder="Activity Name (Supports links/bullets)" 
                         />
                       ) : <div className="text-brand-navy/80 font-medium text-sm whitespace-pre-wrap">{renderStyledText(campaign.name)}</div>}
                       {isLocalEditing && <button onClick={() => removeCampaign(campaign.id)} className="text-red-300 hover:text-red-500 ml-2 transition-colors"><Trash2 size={16} /></button>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200"><p className="text-gray-400">No additional campaigns listed.</p></div>}
          </div>
        </div>

        {/* --- COMMENTS SIDEBAR (Unchanged) --- */}
        <div className={`absolute top-0 right-0 h-full w-[350px] bg-white border-l border-gray-200 shadow-2xl transition-transform duration-300 flex flex-col z-20 ${showComments ? 'translate-x-0' : 'translate-x-full'}`}>
           <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
              <h3 className="font-bold text-brand-navy flex items-center gap-2"><MessageSquare size={16} /> Comments</h3>
              <button onClick={() => setShowComments(false)} className="text-gray-400 hover:text-brand-cyan hover:bg-brand-light p-2 rounded-full transition-colors z-50 cursor-pointer" title="Close Comments"><X size={20} /></button>
           </div>
           {/* ... */}
           {/* Identity Section */}
           <div className="px-4 py-3 bg-brand-light/20 border-b border-gray-100 shrink-0">
             {userName ? (
               <div className="flex items-center justify-between"><div className="flex items-center gap-2"><div className="w-6 h-6 bg-brand-navy text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm">{userName.charAt(0)}</div><span className="text-xs font-bold text-gray-700 truncate max-w-[150px]">{userName}</span></div><button onClick={() => setUserName('')} className="text-[10px] text-gray-400 hover:text-brand-cyan underline">Change</button></div>
             ) : (
               <div className="space-y-2"><p className="text-xs font-bold text-brand-navy">What is your name?</p><div className="flex gap-2"><input type="text" value={tempName} onChange={(e) => setTempName(e.target.value)} className="flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:border-brand-cyan outline-none" placeholder="Enter name..." /><button onClick={saveName} disabled={!tempName.trim()} className="bg-brand-cyan text-white text-xs font-bold px-3 py-1 rounded disabled:opacity-50 hover:bg-brand-navy transition-colors">Save</button></div></div>
             )}
           </div>
           {/* List */}
           <div ref={commentScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {commentsToDisplay.length === 0 ? <div className="text-center py-8 opacity-50"><MessageSquare size={32} className="mx-auto mb-2 text-gray-300" /><p className="text-xs text-gray-400">No comments yet.</p></div> : 
                commentsToDisplay.map((comment) => (
                   <div key={comment.id} className={`bg-white rounded-lg p-3 shadow-sm border ${comment.resolved ? 'border-gray-100 opacity-60' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between mb-2">
                         <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-brand-navy/10 flex items-center justify-center text-[10px] font-bold text-brand-navy">{comment.author.charAt(0)}</div><div><p className="text-xs font-bold text-gray-800">{comment.author}</p><p className="text-[10px] text-gray-400">{formatTime(comment.timestamp)}</p></div></div>
                         <button onClick={() => toggleResolve(comment.id)} className={`p-1 rounded hover:bg-gray-100 ${comment.resolved ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}`}><CheckCircle2 size={16} /></button>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{comment.text}</p>
                      {(comment.replies || []).length > 0 && <div className="ml-4 pl-3 border-l-2 border-gray-100 space-y-2 mb-3">{comment.replies.map(reply => <div key={reply.id}><div className="flex items-center gap-2 mb-1"><span className="text-[10px] font-bold text-gray-600">{reply.author}</span><span className="text-[10px] text-gray-300">{formatTime(reply.timestamp)}</span></div><p className="text-xs text-gray-600">{reply.text}</p></div>)}</div>}
                      {!comment.resolved && <div className="flex items-center gap-2">{activeReplyId === comment.id ? <div className="flex items-center gap-1 w-full animate-in fade-in slide-in-from-top-2"><input autoFocus type="text" value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addReply(comment.id)} className="flex-1 text-xs border border-brand-cyan/30 rounded px-2 py-1 outline-none focus:border-brand-cyan" placeholder="Reply..." /><button onClick={() => addReply(comment.id)} className="text-brand-cyan hover:bg-brand-light p-1 rounded"><Send size={12} /></button></div> : <button onClick={() => setActiveReplyId(comment.id)} className="text-[10px] font-bold text-gray-400 hover:text-brand-navy flex items-center gap-1"><Reply size={10} /> Reply</button>}<button onClick={() => deleteComment(comment.id)} className="text-[10px] text-gray-300 hover:text-red-400 ml-auto">Delete</button></div>}
                   </div>
                ))
              }
           </div>
           {/* Input */}
           <div className="p-4 bg-white border-t border-gray-200 shrink-0">
             {userName ? <div className="relative"><textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addTopLevelComment(); } }} placeholder="Type a comment..." className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 pr-10 text-sm focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none resize-none h-20 shadow-inner" /><button onClick={addTopLevelComment} disabled={!newComment.trim()} className="absolute bottom-2 right-2 p-1.5 bg-brand-navy text-white rounded-md disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-cyan transition-colors shadow-sm"><Send size={16} /></button></div> : <div className="text-center p-4 bg-gray-50 rounded border border-dashed border-gray-200"><p className="text-xs text-gray-500">Please enter your name above to comment.</p></div>}
           </div>
        </div>
      </div>
    </div>
  );
};