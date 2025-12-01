import React, { useState, useEffect } from 'react';
import { MonthData, Quarter } from './types';
import { INITIAL_DATA } from './constants';
import { Header } from './components/Header';
import { QuarterSection } from './components/QuarterSection';
import { DetailModal } from './components/DetailModal';
import { SettingsModal } from './components/SettingsModal';

import { db, auth } from './firebase';
import { collection, onSnapshot, doc, setDoc, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged, User, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';

// --- HARDCODED CREDENTIALS ---
const HARDCODED_CLOUD_NAME = 'drnmanvbf'; 
const HARDCODED_UPLOAD_PRESET = 'davedave'; 

// Helper: Resize Image to Blob
const resizeImageToBlob = (file: File, maxWidth: number): Promise<Blob> => {
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
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Canvas processing failed"));
        }, 'image/jpeg', 0.85);
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

// Main Media Processor
const processMediaFile = async (file: File): Promise<string> => {
    const cloudName = HARDCODED_CLOUD_NAME;
    const uploadPreset = HARDCODED_UPLOAD_PRESET;

    if (!file || file.size === 0) {
        throw new Error("File is empty or invalid.");
    }

    console.log(`Processing: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

    // 1. CHECK SIZE LIMITS
    const isGif = file.type.includes('gif');
    // 9.5MB safety limit for GIFs (Cloudinary Free tier is 10MB for images)
    if (isGif && file.size > 9900000) { 
        throw new Error(`Your GIF is ${ (file.size / 1024 / 1024).toFixed(1) }MB. Cloudinary limits Images/GIFs to 10MB. \n\nPlease convert this file to .MP4 (Video) which allows up to 100MB.`);
    }

    // 2. DETERMINE ENDPOINT
    // Videos go to 'video' endpoint (100MB limit). Images/GIFs go to 'image' (10MB limit).
    let resourceType = 'image'; 
    if (file.type.startsWith('video/')) {
        resourceType = 'video';
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
          console.error("Cloudinary Error:", data);
          let msg = data.error?.message || 'Unknown error';
          if (msg.includes('File size too large')) {
             msg = `File too large. Images/GIFs max 10MB. Videos max 100MB.`;
          }
          throw new Error(`Cloudinary Error: ${msg}`);
      }

      console.log("Upload Successful:", data.secure_url);
      return data.secure_url; 
    } catch (err: any) {
      console.error("Upload Error:", err);
      throw new Error(err.message);
    }
};

function App() {
  const [data, setData] = useState<MonthData[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('marketer_username') || '';
  });

  const [logo, setLogo] = useState<string | null>(null);
  const [barkLogo, setBarkLogo] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<MonthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userName) localStorage.setItem('marketer_username', userName);
  }, [userName]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.displayName && !userName) setUserName(currentUser.displayName);
    });
    return () => unsubscribe();
  }, [userName]);

  useEffect(() => {
    const settingsUnsub = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const settings = docSnap.data();
        setLogo(settings.logo || null);
        setBarkLogo(settings.barkLogo || null);
      }
    }, (err) => console.log("Settings sync unavailable", err));

    const monthsCollection = collection(db, 'months');
    const monthsUnsub = onSnapshot(monthsCollection, (snapshot) => {
      if (snapshot.empty && !isLoading && !error) {
        initializeDatabase();
      } else {
        const fetchedMonths = snapshot.docs.map(doc => doc.data() as MonthData);
        const sorted = INITIAL_DATA.map(init => 
          fetchedMonths.find(m => m.id === init.id) || init
        );
        setData(sorted);
        
        if (selectedMonth) {
          const currentVersion = fetchedMonths.find(m => m.id === selectedMonth.id);
          if (currentVersion) setSelectedMonth(currentVersion);
        }
      }
      setIsLoading(false);
    }, (err: any) => {
      console.error("Firestore Error:", err);
      setIsLoading(false);
      if (err.code === 'permission-denied') setError("PERMISSION_DENIED");
      else setError(err.message || "Connection Failed");
    });
    return () => { settingsUnsub(); monthsUnsub(); };
  }, [selectedMonth]);

  const initializeDatabase = async () => {
    try {
      const batch = writeBatch(db);
      INITIAL_DATA.forEach(month => {
        const ref = doc(db, 'months', month.id);
        batch.set(ref, month);
      });
      const settingsRef = doc(db, 'settings', 'global');
      batch.set(settingsRef, { logo: null, barkLogo: null });
      await batch.commit();
    } catch (e: any) {
      if (e.code === 'permission-denied') setError("PERMISSION_DENIED");
    }
  };

  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in", error);
      alert("Failed to sign in.");
    }
  };

  const handleSignOut = async () => { await signOut(auth); };

  const handleUpdateMonth = async (updatedMonth: MonthData) => {
    setData(prev => prev.map(m => m.id === updatedMonth.id ? updatedMonth : m));
    try {
      const ref = doc(db, 'months', updatedMonth.id);
      await setDoc(ref, updatedMonth, { merge: true });
    } catch (e) {
      console.error("Error updating document: ", e);
      alert("Failed to save changes.");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await processMediaFile(file);
        setLogo(url);
        await setDoc(doc(db, 'settings', 'global'), { logo: url }, { merge: true });
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const handleBarkLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await processMediaFile(file);
        setBarkLogo(url);
        await setDoc(doc(db, 'settings', 'global'), { barkLogo: url }, { merge: true });
      } catch (e: any) {
        alert(e.message);
      }
    }
  };

  const getMonthsByQuarter = (q: Quarter) => data.filter(m => m.quarter === q);

  if (error === "PERMISSION_DENIED") {
    return (
      <div className="min-h-screen bg-brand-navy flex items-center justify-center text-white p-4">
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20 max-w-2xl w-full shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-black mb-2 text-red-400">Database Locked</h2>
            <p className="text-white/80 text-lg">Your database rules are blocking the app.</p>
          </div>
          <div className="bg-black/40 p-6 rounded-lg font-mono text-sm text-left mb-6 border border-white/10">
             <p className="text-gray-400">Please update your Firestore Rules in the Firebase Console.</p>
          </div>
          <button onClick={() => window.location.reload()} className="w-full bg-brand-cyan text-white py-4 rounded-lg font-bold">Refresh App</button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-cyan flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="font-bold text-lg">Loading Roadmap...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cyan pb-20 font-sans">
      <Header 
        isEditing={isEditing} 
        setIsEditing={setIsEditing} 
        user={user}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
        logo={logo}
        onLogoUpload={handleLogoUpload}
        barkLogo={barkLogo}
        onBarkLogoUpload={handleBarkLogoUpload}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <QuarterSection 
          quarterName="FY26 - Q4" 
          months={getMonthsByQuarter('FY26 - Q4')} 
          isEditing={isEditing}
          onUpdateMonth={handleUpdateMonth}
          onSelectMonth={setSelectedMonth}
          onProcessMedia={processMediaFile}
        />
        <QuarterSection 
          quarterName="FY27 - Q1" 
          months={getMonthsByQuarter('FY27 - Q1')} 
          isEditing={isEditing}
          onUpdateMonth={handleUpdateMonth}
          onSelectMonth={setSelectedMonth}
          onProcessMedia={processMediaFile}
        />
        <QuarterSection 
          quarterName="FY27 - Q2" 
          months={getMonthsByQuarter('FY27 - Q2')} 
          isEditing={isEditing}
          onUpdateMonth={handleUpdateMonth}
          onSelectMonth={setSelectedMonth}
          onProcessMedia={processMediaFile}
        />
        <QuarterSection 
          quarterName="FY27 - Q3" 
          months={getMonthsByQuarter('FY27 - Q3')} 
          isEditing={isEditing}
          onUpdateMonth={handleUpdateMonth}
          onSelectMonth={setSelectedMonth}
          onProcessMedia={processMediaFile}
        />
      </main>

      {selectedMonth && (
        <DetailModal
          month={selectedMonth}
          isOpen={true}
          onClose={() => setSelectedMonth(null)}
          globalIsEditing={isEditing}
          onUpdate={handleUpdateMonth}
          userName={userName}
          setUserName={setUserName}
          onProcessMedia={processMediaFile}
        />
      )}
      
      <footer className="text-center text-white/40 text-sm pb-8 font-medium">
        2026 CALENDAR // LIVE TEAM DASHBOARD
      </footer>
    </div>
  );
}

export default App;