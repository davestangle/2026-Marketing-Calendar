
import React, { useRef, useState, useEffect } from 'react';
import { MonthData, Comment } from '../types';
import { X, Upload, Plus, Trash2, Target, Banknote, Link as LinkIcon, ExternalLink, Edit2, Save, MessageSquare, Send, CheckCircle2, Reply, ChevronDown, Check, LogIn } from 'lucide-react';
import { User } from 'firebase/auth';

interface DetailModalProps {
  month: MonthData;
  isOpen: boolean;
  onClose: () => void;
  globalIsEditing: boolean;
  onUpdate: (updatedMonth: MonthData) => void;
  currentUser: User | null;
  onSignIn: () => void;
}

// Helper to compress images (duplicated here for component portability)
const resizeImage = (file: File, maxWidth = 1200): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width *= maxWidth / height;
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Compress to JPEG at 80% quality
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    };
    reader.onerror = (error) => reject(error);
  });
};


export const DetailModal: React.FC<DetailModalProps> = ({ 
  month, 
  isOpen, 
  onClose, 
  globalIsEditing, 
  onUpdate,
  currentUser,
  onSignIn
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const commentScrollRef = useRef<HTMLDivElement>(null);

  // Local state
  const [isLocalEditing, setIsLocalEditing] = useState(globalIsEditing);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showResolved, setShowResolved] = useState(false);

  useEffect(() => {
    setIsLocalEditing(globalIsEditing);
  }, [globalIsEditing]);

  useEffect(() => {
    if (showComments && commentScrollRef.current) {
      commentScrollRef.current.scrollTop = commentScrollRef.current.scrollHeight;
    }
  }, [showComments, month.comments?.length]); 

  if (!isOpen || !month) return null;

  // --- Image & Data Handlers ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await resizeImage(file, 1200);
        onUpdate({
          ...month,
          productLaunch: { ...month.productLaunch, image: base64 }
        });
      } catch (err) {
        alert("Failed to process image. Try a different file.");
      }
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const base64 = await resizeImage(file, 600); // Smaller max width for logos
        onUpdate({
          ...month,
          productLaunch: { ...month.productLaunch, logo: base64 }
        });
      } catch (err) {
        alert("Failed to process logo.");
      }
    }
  };

  const updateLaunchField = (field: keyof typeof month.productLaunch, value: string) => {
    onUpdate({
      ...month,
      productLaunch: { ...month.productLaunch, [field]: value }
    });
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
    const currentResources = month.productLaunch.resources || [];
    onUpdate({
      ...month,
      productLaunch: { 
        ...month.productLaunch, 
        resources: [...currentResources, { id: newId, label: 'New Resource', url: 'https://' }] 
      }
    });
  };

  const updateResource = (id: string, field: 'label' | 'url', value: string) => {
    onUpdate({
      ...month,
      productLaunch: { 
        ...month.productLaunch, 
        resources: month.productLaunch.resources?.map(r => r.id === id ? { ...r, [field]: value } : r) 
      }
    });
  };

  const removeResource = (id: string) => {
    onUpdate({
      ...month,
      productLaunch: { 
        ...month.productLaunch, 
        resources: month.productLaunch.resources?.filter(r => r.id !== id) 
      }
    });
  };

  // --- Comment System Handlers ---
  const addTopLevelComment = () => {
    if (!newComment.trim() || !currentUser) return;
    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment,
      timestamp: new Date().toISOString(),
      author: currentUser.displayName || 'Anonymous',
      resolved: false,
      replies: []
    };
    onUpdate({ ...month, comments: [...(month.comments || []), comment] });
    setNewComment("");
  };

  const addReply = (parentId: string) => {
    if (!replyText.trim() || !currentUser) return;
    const reply: Comment = {
      id: Date.now().toString(),
      text: replyText,
      timestamp: new Date().toISOString(),
      author: currentUser.displayName || 'Anonymous',
      resolved: false,
      replies: []
    };
    
    onUpdate({
      ...month,
      comments: month.comments?.map(c => 
        c.id === parentId ? { ...c, replies: [...(c.replies || []), reply] } : c
      )
    });
    setReplyText("");
    setActiveReplyId(null);
  };

  const deleteComment = (commentId: string, parentId?: string) => {
    if (parentId) {
      // Delete reply
      onUpdate({
        ...month,
        comments: month.comments?.map(c => 
          c.id === parentId ? { ...c, replies: c.replies?.filter(r => r.id !== commentId) } : c
        )
      });
    } else {
      // Delete top level
      onUpdate({
        ...month,
        comments: month.comments?.filter(c => c.id !== commentId)
      });
    }
  };

  const toggleResolve = (commentId: string) => {
    onUpdate({
      ...month,
      comments: month.comments?.map(c => 
        c.id === commentId ? { ...c, resolved: !c.resolved } : c
      )
    });
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const safeComments = month.comments || [];
  const activeComments = safeComments.filter(c => !c.resolved);
  const resolvedComments = safeComments.filter(c => c.resolved);
  const commentsToDisplay = showResolved ? [...activeComments, ...resolvedComments] : activeComments;
  
  // Sort by time
  commentsToDisplay.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div 
        className="absolute inset-0 bg-brand-navy/80 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div className={`
        relative bg-white w-full max-w-6xl max-h-[95vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 transition-all
        ${showComments ? 'pr-[350px]' : ''} 
      `}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white z-10 shrink-0">
          <div>
            <h2 className="text-3xl font-bold text-brand-navy">{month.name} {month.year}</h2>
            <p className="text-gray-400 font-medium text-sm mt-1">{month.quarter}</p>
          </div>
          
          <div className="flex items-center gap-3">
             <button
               onClick={() => setIsLocalEditing(!isLocalEditing)}
               className={`
                 flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all
                 ${isLocalEditing 
                   ? 'bg-brand-cyan text-white shadow-md' 
                   : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
               `}
             >
               {isLocalEditing ? <><Save size={16} /> Saving Edits...</> : <><Edit2 size={16} /> Edit Page</>}
             </button>

             <button
               onClick={() => setShowComments(!showComments)}
               className={`
                 relative p-2 rounded-full transition-colors
                 ${showComments ? 'bg-brand-navy/10 text-brand-navy' : 'hover:bg-gray-100 text-gray-500'}
               `}
               title="Comments"
             >
               <MessageSquare size={24} />
               {activeComments.length > 0 && (
                 <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                   {activeComments.length}
                 </span>
               )}
             </button>
             
             <div className="w-px h-8 bg-gray-200 mx-1"></div>

             <button 
               onClick={onClose}
               className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-brand-navy"
             >
               <X size={32} />
             </button>
          </div>
        </div>

        <div className="p-8 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Visuals */}
            <div className="space-y-4">
              <div 
                className={`
                  relative min-h-[400px] bg-gray-50 rounded-xl overflow-hidden shadow-inner border border-gray-200 group flex items-center justify-center
                  ${isLocalEditing ? 'cursor-pointer hover:border-brand-cyan hover:shadow-md transition-all' : ''}
                `}
                onClick={() => isLocalEditing && fileInputRef.current?.click()}
              >
                {month.productLaunch.image ? (
                  <img 
                    src={month.productLaunch.image} 
                    alt="Launch Visual" 
                    className="w-full h-full object-contain max-h-[600px]"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                    <span className="text-6xl mb-4 opacity-20">📷</span>
                    <p className="text-sm font-medium uppercase tracking-widest">
                      {isLocalEditing ? 'Click to Upload Image' : 'No Visual Asset'}
                    </p>
                  </div>
                )}
                
                {isLocalEditing && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="bg-white text-brand-navy px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg">
                      <Upload size={18} />
                      {month.productLaunch.image ? 'Change Image' : 'Upload Image'}
                    </div>
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            {/* Right: Launch Details */}
            <div className="space-y-6">
              
              {/* Title & Logo */}
              <div className="flex gap-4 items-start">
                 <div className="flex-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Launch Title</label>
                    <input
                      type="text"
                      readOnly={!isLocalEditing}
                      value={month.productLaunch.title}
                      onChange={(e) => updateLaunchField('title', e.target.value)}
                      className={`
                        w-full text-3xl font-bold text-brand-navy outline-none bg-transparent placeholder-gray-200 leading-tight
                        ${isLocalEditing ? 'border-b-2 border-brand-cyan/30 focus:border-brand-cyan pb-2' : ''}
                      `}
                      placeholder={isLocalEditing ? "Enter Launch Title..." : "No Launch Scheduled"}
                    />
                 </div>
                 
                 <div 
                   className={`
                      w-24 h-24 shrink-0 rounded-lg border-2 flex items-center justify-center bg-white relative overflow-hidden group
                      ${isLocalEditing ? 'border-dashed border-gray-300 hover:border-brand-cyan cursor-pointer' : 'border-transparent'}
                   `}
                   onClick={() => isLocalEditing && logoInputRef.current?.click()}
                 >
                    {month.productLaunch.logo ? (
                       <img src={month.productLaunch.logo} alt="Brand Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                       isLocalEditing && (
                         <div className="text-center">
                            <Upload size={20} className="mx-auto text-gray-300 mb-1 group-hover:text-brand-cyan" />
                            <span className="text-[10px] text-gray-400 font-bold uppercase block leading-none">Add Logo</span>
                         </div>
                       )
                    )}
                    <input 
                      type="file" 
                      ref={logoInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoUpload}
                    />
                 </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                
                {/* Objective */}
                <div className="bg-brand-light/30 p-5 rounded-xl border border-brand-cyan/10">
                  <div className="flex items-center gap-2 mb-3 text-brand-navy">
                    <Target size={18} />
                    <h4 className="font-bold text-sm uppercase tracking-wide">Objective</h4>
                  </div>
                  {isLocalEditing ? (
                    <textarea
                      value={month.productLaunch.objective}
                      onChange={(e) => updateLaunchField('objective', e.target.value)}
                      className="w-full bg-white border border-brand-cyan/20 rounded-lg p-3 text-brand-navy text-sm focus:ring-2 focus:ring-brand-cyan/30 outline-none resize-none min-h-[100px]"
                      placeholder="What is the main goal of this launch?"
                    />
                  ) : (
                    <p className="text-brand-navy/80 leading-relaxed">
                      {month.productLaunch.objective || 'No objective defined.'}
                    </p>
                  )}
                </div>

                {/* Budgets */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 mb-4 text-gray-600 border-b border-gray-200 pb-2">
                    <Banknote size={18} />
                    <h4 className="font-bold text-sm uppercase tracking-wide">Budget Allocation</h4>
                  </div>
                  
                  <div className="space-y-4">
                     <div>
                        <div className="flex justify-between text-xs font-bold text-brand-navy mb-1 uppercase tracking-wider">
                           <span>Performance Spend</span>
                           {isLocalEditing ? (
                             <input 
                               type="text" 
                               value={month.productLaunch.performanceSpend}
                               onChange={(e) => updateLaunchField('performanceSpend', e.target.value)}
                               className="text-right bg-white border border-gray-300 rounded px-1 w-24 focus:border-brand-cyan outline-none"
                               placeholder="$0"
                             />
                           ) : (
                             <span>{month.productLaunch.performanceSpend || '—'}</span>
                           )}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                           <div className="bg-brand-cyan h-full rounded-full" style={{ width: '65%' }}></div>
                        </div>
                     </div>

                     <div>
                        <div className="flex justify-between text-xs font-bold text-brand-navy mb-1 uppercase tracking-wider">
                           <span>Brand Awareness</span>
                           {isLocalEditing ? (
                             <input 
                               type="text" 
                               value={month.productLaunch.brandSpend}
                               onChange={(e) => updateLaunchField('brandSpend', e.target.value)}
                               className="text-right bg-white border border-gray-300 rounded px-1 w-24 focus:border-brand-cyan outline-none"
                               placeholder="$0"
                             />
                           ) : (
                             <span>{month.productLaunch.brandSpend || '—'}</span>
                           )}
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                           <div className="bg-brand-navy h-full rounded-full" style={{ width: '40%' }}></div>
                        </div>
                     </div>
                  </div>
                </div>

                {/* Resources */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <LinkIcon size={18} />
                      <h4 className="font-bold text-sm uppercase tracking-wide">Resources & Decks</h4>
                    </div>
                    {isLocalEditing && (
                      <button onClick={addResource} className="text-xs font-bold text-brand-cyan flex items-center gap-1 hover:underline">
                        <Plus size={14} /> Add
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {(month.productLaunch.resources || []).map((resource) => (
                      <div key={resource.id} className="flex items-center gap-2">
                        {isLocalEditing ? (
                          <div className="flex-1 grid grid-cols-2 gap-2">
                             <input 
                               type="text" 
                               value={resource.label}
                               onChange={(e) => updateResource(resource.id, 'label', e.target.value)}
                               className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:border-brand-cyan outline-none"
                               placeholder="Link Label"
                             />
                             <input 
                               type="text" 
                               value={resource.url}
                               onChange={(e) => updateResource(resource.id, 'url', e.target.value)}
                               className="text-xs border border-gray-300 rounded px-2 py-1.5 focus:border-brand-cyan outline-none text-gray-500"
                               placeholder="URL (https://...)"
                             />
                          </div>
                        ) : (
                          <a 
                            href={resource.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 flex items-center gap-2 text-sm font-bold text-brand-cyan hover:underline hover:text-brand-navy transition-colors bg-white border border-gray-200 p-2 rounded-lg"
                          >
                            <ExternalLink size={14} />
                            {resource.label}
                          </a>
                        )}
                        {isLocalEditing && (
                          <button 
                            onClick={() => removeResource(resource.id)}
                            className="text-gray-300 hover:text-red-500 p-1 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                    {(!month.productLaunch.resources || month.productLaunch.resources.length === 0) && !isLocalEditing && (
                      <p className="text-gray-400 text-sm italic">No resources attached.</p>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>

          <hr className="border-gray-100 my-8" />

          {/* Additional Campaigns */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-brand-navy flex items-center gap-2">
                Additional Campaign Activities
                <span className="text-sm font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{(month.campaigns || []).length}</span>
              </h3>
              {isLocalEditing && (
                <button 
                  onClick={addCampaign}
                  className="text-sm bg-brand-cyan/10 text-brand-cyan px-3 py-1.5 rounded-lg hover:bg-brand-cyan hover:text-white transition-all font-bold flex items-center gap-1"
                >
                  <Plus size={16} /> Add Activity
                </button>
              )}
            </div>
            {(month.campaigns && month.campaigns.length > 0) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {month.campaigns.map((campaign) => (
                  <div key={campaign.id} className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center justify-between group">
                    {isLocalEditing ? (
                      <input
                        type="text"
                        value={campaign.name}
                        onChange={(e) => updateCampaign(campaign.id, e.target.value)}
                        className="bg-transparent border-b border-transparent focus:border-brand-cyan outline-none text-brand-navy w-full mr-2"
                        placeholder="Activity Name"
                      />
                    ) : (
                      <span className="text-brand-navy/80 font-medium truncate">{campaign.name}</span>
                    )}
                    {isLocalEditing && (
                      <button 
                        onClick={() => removeCampaign(campaign.id)}
                        className="text-red-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
               <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-gray-400">No additional campaigns listed.</p>
               </div>
            )}
          </div>
        </div>

        {/* --- COMMENTS SIDEBAR --- */}
        <div className={`
           absolute top-0 right-0 h-full w-[350px] bg-white border-l border-gray-200 shadow-2xl transition-transform duration-300 flex flex-col z-20
           ${showComments ? 'translate-x-0' : 'translate-x-full'}
        `}>
           {/* Sidebar Header */}
           <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
              <h3 className="font-bold text-brand-navy flex items-center gap-2">
                 <MessageSquare size={16} /> Comments
              </h3>
              <button 
                onClick={() => setShowComments(false)} 
                className="text-gray-400 hover:text-brand-cyan hover:bg-brand-light p-2 rounded-full transition-colors z-50 cursor-pointer"
                title="Close Comments"
              >
                 <X size={20} />
              </button>
           </div>
           
           {/* Identity Section */}
           <div className="px-4 py-3 bg-brand-light/20 border-b border-gray-100 shrink-0">
             {currentUser ? (
               <div className="flex items-center gap-2">
                   {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} className="w-6 h-6 rounded-full" alt="User" />
                   ) : (
                      <div className="w-6 h-6 bg-brand-navy text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                        {currentUser.displayName?.charAt(0)}
                      </div>
                   )}
                   <span className="text-xs font-bold text-gray-700">
                     Commenting as {currentUser.displayName}
                   </span>
               </div>
             ) : (
               <button 
                 onClick={onSignIn}
                 className="flex items-center gap-2 text-xs font-bold text-brand-cyan hover:underline w-full justify-center py-1"
               >
                 <LogIn size={14} /> Sign in to comment
               </button>
             )}
           </div>

           {/* Filters */}
           <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                {activeComments.length} Open Threads
              </span>
              <button 
                onClick={() => setShowResolved(!showResolved)}
                className="text-[10px] font-bold text-gray-400 hover:text-brand-navy flex items-center gap-1"
              >
                {showResolved ? 'Hide Resolved' : 'Show Resolved'} <ChevronDown size={12} className={showResolved ? 'rotate-180' : ''} />
              </button>
           </div>

           {/* Comments List */}
           <div ref={commentScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {commentsToDisplay.length === 0 ? (
                <div className="text-center py-8 opacity-50">
                  <MessageSquare size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-xs text-gray-400">No comments yet.</p>
                </div>
              ) : (
                commentsToDisplay.map((comment) => (
                   <div key={comment.id} className={`bg-white rounded-lg p-3 shadow-sm border ${comment.resolved ? 'border-gray-100 opacity-60' : 'border-gray-200'}`}>
                      {/* Comment Header */}
                      <div className="flex items-start justify-between mb-2">
                         <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-brand-navy/10 flex items-center justify-center text-[10px] font-bold text-brand-navy">
                               {comment.author.charAt(0)}
                            </div>
                            <div>
                               <p className="text-xs font-bold text-gray-800">{comment.author}</p>
                               <p className="text-[10px] text-gray-400">{formatTime(comment.timestamp)}</p>
                            </div>
                         </div>
                         <button 
                           onClick={() => toggleResolve(comment.id)}
                           className={`p-1 rounded hover:bg-gray-100 ${comment.resolved ? 'text-green-500' : 'text-gray-300 hover:text-green-500'}`}
                           title={comment.resolved ? "Reopen" : "Resolve"}
                         >
                            <CheckCircle2 size={16} />
                         </button>
                      </div>
                      
                      {/* Comment Text */}
                      <p className="text-sm text-gray-700 mb-3">{comment.text}</p>
                      
                      {/* Replies */}
                      {(comment.replies || []).length > 0 && (
                        <div className="ml-4 pl-3 border-l-2 border-gray-100 space-y-2 mb-3">
                           {comment.replies.map(reply => (
                             <div key={reply.id}>
                                <div className="flex items-center gap-2 mb-1">
                                   <span className="text-[10px] font-bold text-gray-600">{reply.author}</span>
                                   <span className="text-[10px] text-gray-300">{formatTime(reply.timestamp)}</span>
                                </div>
                                <p className="text-xs text-gray-600">{reply.text}</p>
                             </div>
                           ))}
                        </div>
                      )}

                      {/* Actions */}
                      {!comment.resolved && (
                         <div className="flex items-center gap-2">
                           {activeReplyId === comment.id ? (
                             <div className="flex items-center gap-1 w-full animate-in fade-in slide-in-from-top-2">
                                <input 
                                  autoFocus
                                  type="text" 
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && addReply(comment.id)}
                                  className="flex-1 text-xs border border-brand-cyan/30 rounded px-2 py-1 outline-none focus:border-brand-cyan"
                                  placeholder="Reply..."
                                />
                                <button onClick={() => addReply(comment.id)} className="text-brand-cyan hover:bg-brand-light p-1 rounded"><Send size={12} /></button>
                             </div>
                           ) : (
                             <button 
                               onClick={() => setActiveReplyId(comment.id)}
                               className="text-[10px] font-bold text-gray-400 hover:text-brand-navy flex items-center gap-1"
                             >
                               <Reply size={10} /> Reply
                             </button>
                           )}
                           
                           {/* Allow delete if current user is author */}
                           {currentUser && currentUser.displayName === comment.author && (
                             <button 
                                onClick={() => deleteComment(comment.id)}
                                className="text-[10px] text-gray-300 hover:text-red-400 ml-auto"
                             >
                                Delete
                             </button>
                           )}
                         </div>
                      )}
                   </div>
                ))
              )}
           </div>

           {/* Input Area */}
           <div className="p-4 bg-white border-t border-gray-200 shrink-0">
             {currentUser ? (
               <div className="relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        addTopLevelComment();
                      }
                    }}
                    placeholder="Type a comment..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 pr-10 text-sm focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan outline-none resize-none h-20"
                  />
                  <button 
                    onClick={addTopLevelComment}
                    disabled={!newComment.trim()}
                    className="absolute bottom-2 right-2 p-1.5 bg-brand-navy text-white rounded-md disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand-cyan transition-colors"
                  >
                    <Send size={16} />
                  </button>
               </div>
             ) : (
               <div className="text-center p-4 bg-gray-50 rounded border border-dashed border-gray-200">
                  <p className="text-xs text-gray-500">Sign in to join the conversation.</p>
               </div>
             )}
           </div>

        </div>

      </div>
    </div>
  );
};
