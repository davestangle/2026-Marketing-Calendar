
import React, { useState, useEffect } from 'react';
import { MonthData, Quarter } from './types';
import { INITIAL_DATA } from './constants';
import { Header } from './components/Header';
import { QuarterSection } from './components/QuarterSection';
import { DetailModal } from './components/DetailModal';

// Firebase Imports
import { db, auth } from './firebase';
import { collection, onSnapshot, doc, setDoc, writeBatch, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User, signInWithPopup, signOut, GoogleAuthProvider } from 'firebase/auth';

function App() {
  const [data, setData] = useState<MonthData[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [logo, setLogo] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<MonthData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. AUTH LISTENER
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. DATA LISTENER (Real-time Sync)
  useEffect(() => {
    // Listener for Global Settings (Logo)
    const settingsUnsub = onSnapshot(doc(db, 'settings', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const settings = docSnap.data();
        setLogo(settings.logo || null);
      }
    }, (err) => {
      console.log("Settings sync unavailable (DB might be empty or restricted)", err);
    });

    // Listener for Month Data
    const monthsCollection = collection(db, 'months');
    const monthsUnsub = onSnapshot(monthsCollection, (snapshot) => {
      if (snapshot.empty && !isLoading && !error) {
        // Only run initialization if we've finished initial load check
        initializeDatabase();
      } else {
        const fetchedMonths = snapshot.docs.map(doc => doc.data() as MonthData);
        // Sort based on INITIAL_DATA order to maintain calendar sequence
        const sorted = INITIAL_DATA.map(init => 
          fetchedMonths.find(m => m.id === init.id) || init
        );
        setData(sorted);
        
        // Update selected month if it's currently open
        if (selectedMonth) {
          const currentVersion = fetchedMonths.find(m => m.id === selectedMonth.id);
          if (currentVersion) setSelectedMonth(currentVersion);
        }
      }
      setIsLoading(false);
    }, (err: any) => {
      console.error("Firestore Error:", err);
      setIsLoading(false);
      if (err.code === 'permission-denied') {
        setError("PERMISSION_DENIED");
      } else {
        setError(err.message || "Connection Failed");
      }
    });

    return () => {
      settingsUnsub();
      monthsUnsub();
    };
  }, [selectedMonth]);

  // Helper: Upload Initial Data if DB is empty
  const initializeDatabase = async () => {
    console.log("Initializing Database...");
    try {
      const batch = writeBatch(db);
      
      // Set Months
      INITIAL_DATA.forEach(month => {
        const ref = doc(db, 'months', month.id);
        batch.set(ref, month);
      });

      // Set Global Settings
      const settingsRef = doc(db, 'settings', 'global');
      batch.set(settingsRef, { logo: null });

      await batch.commit();
      console.log("Database initialized.");
    } catch (e: any) {
      console.error("Init Error:", e);
      // Don't set error state here if it's just a permission issue, let the listener catch it
      if (e.code === 'permission-denied') {
        setError("PERMISSION_DENIED");
      }
    }
  };

  // HANDLERS
  const handleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in", error);
      alert("Failed to sign in. Please check your connection or try again.");
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  const handleUpdateMonth = async (updatedMonth: MonthData) => {
    // Optimistic update for UI smoothness
    setData(prev => prev.map(m => m.id === updatedMonth.id ? updatedMonth : m));
    
    // Write to Firestore
    try {
      const ref = doc(db, 'months', updatedMonth.id);
      await setDoc(ref, updatedMonth, { merge: true });
    } catch (e) {
      console.error("Error updating document: ", e);
      alert("Failed to save changes. Please check your internet connection.");
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check size (Max 700KB for Firestore safety)
      if (file.size > 700 * 1024) {
        alert("File too large. Please upload a logo smaller than 700KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        setLogo(base64);
        try {
          await setDoc(doc(db, 'settings', 'global'), { logo: base64 }, { merge: true });
        } catch (e) {
          console.error("Upload error", e);
          alert("Failed to upload logo to cloud.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const getMonthsByQuarter = (q: Quarter) => data.filter(m => m.quarter === q);

  if (error === "PERMISSION_DENIED") {
    return (
      <div className="min-h-screen bg-brand-navy flex items-center justify-center text-white p-4">
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20 max-w-2xl w-full shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-black mb-2 text-red-400">Database Locked</h2>
            <p className="text-white/80 text-lg">Your database exists, but the security rules are blocking the app.</p>
          </div>
          
          <div className="bg-black/40 p-6 rounded-lg font-mono text-sm text-left mb-6 border border-white/10">
            <p className="text-gray-400 mb-2">1. Go to Firebase Console {'>'} Build {'>'} Firestore Database {'>'} <strong className="text-white">Rules</strong> tab.</p>
            <p className="text-gray-400 mb-2">2. Paste this code and click <strong>Publish</strong>:</p>
            <div className="bg-black p-4 rounded text-green-400 my-4 select-all">
              rules_version = '2';<br/>
              service cloud.firestore {'{'}<br/>
              &nbsp;&nbsp;match /databases/{'{'}database{'}'}/documents {'{'}<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;match /{'{(document=**)}'} {'{'}<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow read, write: if true;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;{'}'}<br/>
              &nbsp;&nbsp;{'}'}<br/>
              {'}'}
            </div>
          </div>

          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-brand-cyan text-white py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-brand-navy transition-colors shadow-lg"
          >
            I Updated the Rules, Try Again
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-cyan flex items-center justify-center text-white p-4">
        <div className="bg-white/10 backdrop-blur-md p-8 rounded-xl border border-white/20 max-w-lg w-full shadow-2xl">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black mb-2">Setup Required</h2>
            <p className="text-white/80">{error}</p>
          </div>
          
          <div className="bg-black/20 p-4 rounded-lg text-sm text-white/90 font-mono mb-6 space-y-2">
             <p className="font-bold border-b border-white/10 pb-2 mb-2">Troubleshooting Steps:</p>
             <ul className="list-disc pl-4 space-y-1">
               <li>Go to Firebase Console</li>
               <li>Check <strong>Firestore Database</strong> is created</li>
               <li>Check <strong>Authentication</strong> {'>'} Google is Enabled</li>
             </ul>
          </div>

          <button 
            onClick={() => window.location.reload()} 
            className="w-full bg-white text-brand-navy py-3 rounded-lg font-bold hover:bg-brand-light transition-colors shadow-lg"
          >
            Refresh App
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-cyan flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="font-bold text-lg">Connecting to Roadmap...</p>
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
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        <QuarterSection 
          quarterName="FY26 - Q4" 
          months={getMonthsByQuarter('FY26 - Q4')} 
          isEditing={isEditing}
          onUpdateMonth={handleUpdateMonth}
          onSelectMonth={setSelectedMonth}
        />
        <QuarterSection 
          quarterName="FY27 - Q1" 
          months={getMonthsByQuarter('FY27 - Q1')} 
          isEditing={isEditing}
          onUpdateMonth={handleUpdateMonth}
          onSelectMonth={setSelectedMonth}
        />
        <QuarterSection 
          quarterName="FY27 - Q2" 
          months={getMonthsByQuarter('FY27 - Q2')} 
          isEditing={isEditing}
          onUpdateMonth={handleUpdateMonth}
          onSelectMonth={setSelectedMonth}
        />
        <QuarterSection 
          quarterName="FY27 - Q3" 
          months={getMonthsByQuarter('FY27 - Q3')} 
          isEditing={isEditing}
          onUpdateMonth={handleUpdateMonth}
          onSelectMonth={setSelectedMonth}
        />
      </main>

      {selectedMonth && (
        <DetailModal
          month={selectedMonth}
          isOpen={true}
          onClose={() => setSelectedMonth(null)}
          globalIsEditing={isEditing}
          onUpdate={handleUpdateMonth}
          currentUser={user}
          onSignIn={handleSignIn}
        />
      )}
      
      <footer className="text-center text-white/40 text-sm pb-8 font-medium">
        MARKETER2026 // COLLABORATIVE DASHBOARD
      </footer>
    </div>
  );
}

export default App;
