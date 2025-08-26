import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  jobTitle?: string;
  experience?: string;
  techStack?: string;
  bio?: string;
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email: string, password: string, name: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create user profile in Firestore
    const userProfile: UserProfile = {
      id: result.user.uid,
      name,
      email,
      role: email === 'projectify198@gmail.com' ? 'admin' : 'user'
    };
    
    await setDoc(doc(db, 'users', result.user.uid), {
      ...userProfile,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'active'
    });
  };

  const logout = async () => {
    await signOut(auth);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);

      // Check if user profile exists, if not create one
      const docRef = doc(db, 'users', result.user.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        const userProfile: UserProfile = {
          id: result.user.uid,
          name: result.user.displayName || 'User',
          email: result.user.email || '',
          role: result.user.email === 'projectify198@gmail.com' ? 'admin' : 'user'
        };

        await setDoc(doc(db, 'users', result.user.uid), {
          ...userProfile,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active'
        });
      }
    } catch (error: any) {
      // Fallback to redirect in environments that block popups (or when instructed)
      const fallbackErrors = [
        'auth/operation-not-supported-in-this-environment',
        'auth/popup-blocked',
        'auth/popup-closed-by-user'
      ];

      // If domain is unauthorized, rethrow so UI can show a clear message
      if (error?.code === 'auth/unauthorized-domain') {
        throw error;
      }

      if (fallbackErrors.includes(error?.code)) {
        await signInWithRedirect(auth, provider);
        return;
      }

      throw error;
    }
  };

  const fetchUserProfile = async (user: User) => {
    try {
      console.log('Fetching user profile for:', user.email);
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const profileData = docSnap.data() as UserProfile;
        console.log('Found existing profile:', profileData);
        setUserProfile(profileData);
      } else {
        // Create profile for existing users
        const profile: UserProfile = {
          id: user.uid,
          name: user.displayName || 'User',
          email: user.email || '',
          role: user.email === 'projectify198@gmail.com' ? 'admin' : 'user'
        };
        console.log('Creating new profile:', profile);
        await setDoc(doc(db, 'users', user.uid), {
          ...profile,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: 'active'
        });
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    login,
    loginWithGoogle,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};