import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  checkActionCode,
  verifyPasswordResetCode,
  sendEmailVerification,
  reload
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebaseConfig';

// Defines the structure of user profile documents in Firestore
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  ratings?: Record<string, number>; // movieId -> rating
  watchlist?: number[]; // array of movie IDs
  personalDashboard?: number[]; // array of movie IDs
  createdAt: Timestamp;
  updatedAt: Timestamp;
  profilePicture?: string;
  bio?: string;
  favoriteGenres?: string[];
  role?: string;
}

// Creates a new Firebase Auth user and saves their profile to Firestore
export const signUpUser = async (
  email: string,
  password: string,
  displayName: string
): Promise<{ user: User; uid: string }> => {
  try {
    // Create user in Firebase Authentication
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Send email verification
    await sendEmailVerification(user);

    // Create user profile in Firestore with emailVerified: false
    const userProfile: UserProfile = {
      uid: user.uid,
      email,
      displayName,
      emailVerified: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      role: 'user'
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);

    return { user, uid: user.uid };
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Authenticates user with email and password
export const signInUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

// Retrieves user profile document from Firestore database
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Update user profile in Firestore
 */
export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      updatedAt: Timestamp.now()
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Sign out user
 */
export const signOutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Get current user
 */
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

/**
 * Send password reset email to user
 */
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Verify password reset code and get email
 */
export const verifyResetCode = async (code: string): Promise<string> => {
  try {
    const email = await verifyPasswordResetCode(auth, code);
    return email;
  } catch (error: any) {
    throw new Error("Invalid or expired reset code");
  }
};

/**
 * Confirm password reset with code and new password
 */
export const confirmPasswordResetWithCode = async (code: string, newPassword: string): Promise<void> => {
  try {
    await confirmPasswordReset(auth, code, newPassword);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Verify old password by re-authenticating
 */
export const verifyOldPassword = async (email: string, password: string): Promise<boolean> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("No user logged in");
    }

    const credential = EmailAuthProvider.credential(email, password);
    await reauthenticateWithCredential(currentUser, credential);
    return true;
  } catch (error: any) {
    throw new Error("Invalid password");
  }
};

/**
 * Update password for currently logged in user
 */
export const changePassword = async (newPassword: string): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("No user logged in");
    }

    await updatePassword(currentUser, newPassword);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Send verification email to current user
 */
export const resendVerificationEmail = async (): Promise<void> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      throw new Error("No user logged in");
    }

    await sendEmailVerification(currentUser);
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Check if current user's email is verified
 */
export const isUserEmailVerified = async (): Promise<boolean> => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      return false;
    }

    // Reload user to get latest verification status
    await reload(currentUser);
    return currentUser.emailVerified;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Get user's email verification status from Firestore
 */
export const getUserEmailVerificationStatus = async (uid: string): Promise<boolean> => {
  try {
    const profile = await getUserProfile(uid);
    return profile?.emailVerified || false;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Mark user's email as verified in Firestore
 */
export const markEmailAsVerified = async (uid: string): Promise<void> => {
  try {
    await updateUserProfile(uid, {
      emailVerified: true
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Save or update a movie rating for the user
 */
export const saveMovieRating = async (uid: string, movieId: number, rating: number): Promise<void> => {
  try {
    const userProfile = await getUserProfile(uid);
    if (!userProfile) {
      throw new Error("User profile not found");
    }

    const currentRatings = userProfile.ratings || {};
    const movieIdStr = String(movieId);

    if (rating === 0) {
      // Remove rating if 0
      delete currentRatings[movieIdStr];
    } else {
      // Save or update rating
      currentRatings[movieIdStr] = rating;
    }

    await updateUserProfile(uid, {
      ratings: currentRatings
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Get all movie ratings for a user
 */
export const getUserMovieRatings = async (uid: string): Promise<Record<number, number>> => {
  try {
    const userProfile = await getUserProfile(uid);
    if (!userProfile || !userProfile.ratings) {
      return {};
    }

    // Convert string keys back to numbers
    const ratings: Record<number, number> = {};
    Object.entries(userProfile.ratings).forEach(([movieId, rating]) => {
      ratings[Number(movieId)] = rating;
    });

    return ratings;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Save or update user's watchlist
 */
export const saveUserWatchlist = async (uid: string, watchlist: number[]): Promise<void> => {
  try {
    await updateUserProfile(uid, {
      watchlist: watchlist
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Get user's watchlist
 */
export const getUserWatchlist = async (uid: string): Promise<number[]> => {
  try {
    const userProfile = await getUserProfile(uid);
    if (!userProfile || !userProfile.watchlist) {
      return [];
    }
    return userProfile.watchlist;
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Save or update user's personal dashboard
 */
export const saveUserPersonalDashboard = async (uid: string, personalDashboard: number[]): Promise<void> => {
  try {
    await updateUserProfile(uid, {
      personalDashboard: personalDashboard
    });
  } catch (error: any) {
    throw new Error(error.message);
  }
};

/**
 * Get user's personal dashboard
 */
export const getUserPersonalDashboard = async (uid: string): Promise<number[]> => {
  try {
    const userProfile = await getUserProfile(uid);
    if (!userProfile || !userProfile.personalDashboard) {
      return [];
    }
    return userProfile.personalDashboard;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
