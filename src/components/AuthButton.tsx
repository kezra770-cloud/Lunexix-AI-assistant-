import React, { useState, useEffect } from 'react';
import { User, LogOut, LogIn } from 'lucide-react';
import { auth, signInWithGoogle, logout } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function AuthButton() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        // Save user profile to Firestore
        try {
          await setDoc(doc(db, 'users', currentUser.uid), {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL
          }, { merge: true });
        } catch (error) {
          console.error("Error saving user to Firestore:", error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center animate-pulse">
        <User className="w-5 h-5 text-slate-500" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || 'User'} className="w-10 h-10 rounded-xl border border-white/10 object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-lunexix-primary/20 border border-lunexix-primary/30 flex items-center justify-center">
              <span className="text-lunexix-primary font-bold">{user.email?.[0].toUpperCase()}</span>
            </div>
          )}
        </div>
        <button 
          onClick={logout}
          className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all"
          title="Sign Out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={signInWithGoogle}
      className="flex items-center gap-2 px-4 py-2 bg-lunexix-primary hover:bg-lunexix-primary/90 text-white rounded-xl transition-all shadow-lg shadow-lunexix-primary/20 font-medium text-sm"
    >
      <LogIn className="w-4 h-4" />
      Sign In
    </button>
  );
}
