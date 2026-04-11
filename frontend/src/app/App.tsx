import { useState, useCallback, useEffect } from "react";
import { Login } from "./pages/Login";
import { EmailVerification } from "./pages/EmailVerification";
import { Dashboard } from "./pages/Dashboard";
import { PersonalDashboard } from "./pages/PersonalDashboard";
import { Search } from "./pages/Search";
import { MovieDetails } from "./pages/MovieDetails";
import { Profile } from "./pages/Profile";
import { Watchlist } from "./pages/Watchlist";
import { MyRatings } from "./pages/MyRatings";
import { Feedback } from "./pages/Feedback";
import { Header } from "./components/Header";
import { Movie } from "./data/mockMovies";
import { Toaster } from "./components/ui/sonner";
import { getCurrentUser, getUserProfile, isUserEmailVerified, getUserMovieRatings, saveMovieRating, getUserWatchlist, saveUserWatchlist, getUserPersonalDashboard, saveUserPersonalDashboard } from "../config/authService";

type Page = "login" | "email-verification" | "dashboard" | "personal-dashboard" | "search" | "details" | "profile" | "watchlist" | "ratings" | "feedback";

// Valid pages that require authentication
const VALID_AUTHENTICATED_PAGES: Page[] = ["email-verification", "dashboard", "personal-dashboard", "search", "profile", "watchlist", "ratings", "feedback"];

/**
 * Helper function: Validate if page is a valid authenticated page
 * Returns true if page can be navigated to, false otherwise
 */
const isValidPage = (page: string): page is Page => {
  return VALID_AUTHENTICATED_PAGES.includes(page as Page);
};

/**
 * Helper function: Perform user login and profile loading
 * Fetches user profile from Firestore and updates app state
 * Returns object with userName, userEmail, ratings, watchlist, and personalDashboard
 */
const performLogin = async (email: string): Promise<{ userName: string; userEmail: string; ratings: Record<number, number>; watchlist: number[]; personalDashboard: number[] }> => {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    return { userName: "User", userEmail: email, ratings: {}, watchlist: [], personalDashboard: [] };
  }

  try {
    const profile = await getUserProfile(currentUser.uid);
    const ratings = await getUserMovieRatings(currentUser.uid);
    const watchlist = await getUserWatchlist(currentUser.uid);
    const personalDashboard = await getUserPersonalDashboard(currentUser.uid);
    
    return {
      userName: profile?.displayName || "User",
      userEmail: email,
      ratings: ratings,
      watchlist: watchlist,
      personalDashboard: personalDashboard
    };
  } catch (error) {
    console.error("Error loading user profile:", error);
    return {
      userName: "User",
      userEmail: email,
      ratings: {},
      watchlist: [],
      personalDashboard: []
    };
  }
};

/**
 * Helper function: Reset all user state on logout
 * Clears authentication, user data, watchlist, personal dashboard, ratings
 */
const getLogoutState = () => {
  return {
    isAuthenticated: false,
    userName: "",
    userEmail: "",
    currentPage: "login" as Page,
    watchlist: [] as number[],
    personalDashboard: [] as number[],
    userRatings: {} as Record<number, number>
  };
};

/**
 * Helper function: Initialize authentication on app load
 * Checks if user is already logged in and fetches their profile
 * Also checks if email is verified and loads ratings, watchlist, personalDashboard
 * Returns object with loaded state or null if not authenticated
 */
const initializeAuthFromUser = async () => {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    return null;
  }

  try {
    const profile = await getUserProfile(currentUser.uid);
    const ratings = await getUserMovieRatings(currentUser.uid);
    const watchlist = await getUserWatchlist(currentUser.uid);
    const personalDashboard = await getUserPersonalDashboard(currentUser.uid);
    
    // Check if email is verified
    const emailVerified = currentUser.emailVerified;
    
    return {
      isAuthenticated: true,
      userName: profile?.displayName || "User",
      userEmail: profile?.email || currentUser.email || "",
      currentPage: emailVerified ? "dashboard" as Page : "email-verification" as Page,
      emailVerified: emailVerified,
      ratings: ratings,
      watchlist: watchlist,
      personalDashboard: personalDashboard
    };
  } catch (error) {
    console.error("Error loading user profile:", error);
    return null;
  }
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [watchlist, setWatchlist] = useState<number[]>([]);
  const [personalDashboard, setPersonalDashboard] = useState<number[]>([]);
  const [userRatings, setUserRatings] = useState<Record<number, number>>({});

  // Handle user login with profile fetching
  const handleLogin = async (email: string, password: string) => {
    const loginData = await performLogin(email);
    
    // Check if email is verified
    const currentUser = getCurrentUser();
    const emailVerified = currentUser?.emailVerified || false;
    
    setIsAuthenticated(true);
    setUserName(loginData.userName);
    setUserEmail(loginData.userEmail);
    setUserRatings(loginData.ratings);
    setWatchlist(loginData.watchlist);
    setPersonalDashboard(loginData.personalDashboard);
    
    // Redirect to email verification or dashboard based on verification status
    setCurrentPage(emailVerified ? "dashboard" : "email-verification");
  };

  // Handle user logout and state reset
  const handleLogout = () => {
    const logoutState = getLogoutState();
    
    setIsAuthenticated(logoutState.isAuthenticated);
    setUserName(logoutState.userName);
    setUserEmail(logoutState.userEmail);
    setCurrentPage(logoutState.currentPage);
    setWatchlist(logoutState.watchlist);
    setPersonalDashboard(logoutState.personalDashboard);
    setUserRatings(logoutState.userRatings);
  };

  // Handle page navigation with validation
  const handleNavigate = (page: string) => {
    if (isValidPage(page)) {
      setCurrentPage(page);
    }
  };

  // Check if user is already logged in on app load
  useEffect(() => {
    const loadAuthState = async () => {
      const authState = await initializeAuthFromUser();
      
      if (authState) {
        setIsAuthenticated(authState.isAuthenticated);
        setUserName(authState.userName);
        setUserEmail(authState.userEmail);
        setCurrentPage(authState.currentPage);
        setUserRatings(authState.ratings || {});
        setWatchlist(authState.watchlist || []);
        setPersonalDashboard(authState.personalDashboard || []);
      } else {
        setCurrentPage("login");
      }
    };

    loadAuthState();
  }, []);

  const handleMovieClick = useCallback((movie: Movie) => {
    setSelectedMovie(movie);
    setCurrentPage("details");
  }, []);

  const handleBackFromDetails = () => {
    setCurrentPage("dashboard");
    setSelectedMovie(null);
  };

  const handleRate = useCallback((movieId: number, rating: number) => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    // Update local state
    setUserRatings((prev) => {
      if (rating === 0) {
        const newRatings = { ...prev };
        delete newRatings[movieId];
        return newRatings;
      }
      return {
        ...prev,
        [movieId]: rating
      };
    });

    // Save to Firestore (async)
    saveMovieRating(currentUser.uid, movieId, rating).catch((error) => {
      console.error("Failed to save movie rating:", error);
    });
  }, []);

  const handleToggleWatchlist = useCallback((movieId: number) => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    // Update local state
    setWatchlist((prev) => {
      const newWatchlist = prev.includes(movieId)
        ? prev.filter((id) => id !== movieId)
        : [...prev, movieId];
      
      // Save to Firestore (async)
      saveUserWatchlist(currentUser.uid, newWatchlist).catch((error) => {
        console.error("Failed to save watchlist:", error);
      });
      
      return newWatchlist;
    });
  }, []);

  const handleTogglePersonalDashboard = useCallback((movieId: number) => {
    const currentUser = getCurrentUser();
    if (!currentUser) return;

    // Update local state
    setPersonalDashboard((prev) => {
      const newPersonalDashboard = prev.includes(movieId)
        ? prev.filter((id) => id !== movieId)
        : [...prev, movieId];
      
      // Save to Firestore (async)
      saveUserPersonalDashboard(currentUser.uid, newPersonalDashboard).catch((error) => {
        console.error("Failed to save personal dashboard:", error);
      });
      
      return newPersonalDashboard;
    });
  }, []);

  const handleNavigatePersonalDashboard = useCallback(() => {
    setCurrentPage("personal-dashboard");
  }, []);

  const handleBackFromPersonalDashboard = useCallback(() => {
    setCurrentPage("dashboard");
  }, []);

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (currentPage === "email-verification") {
    return (
      <EmailVerification 
        onVerificationComplete={() => setCurrentPage("dashboard")}
        onBack={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {currentPage !== "details" && (
        <Header
          currentPage={currentPage}
          onNavigate={handleNavigate}
          userName={userName}
          onLogout={handleLogout}
        />
      )}

      {currentPage === "dashboard" && (
        <Dashboard
          onMovieClick={handleMovieClick}
          onRate={handleRate}
          onToggleWatchlist={handleToggleWatchlist}
          onTogglePersonalDashboard={handleTogglePersonalDashboard}
          onNavigatePersonalDashboard={handleNavigatePersonalDashboard}
          watchlist={watchlist}
          personalDashboard={personalDashboard}
          userRatings={userRatings}
          userName={userName}
        />
      )}

      {currentPage === "search" && (
        <Search
          onMovieClick={handleMovieClick}
          onRate={handleRate}
          onToggleWatchlist={handleToggleWatchlist}
          onTogglePersonalDashboard={handleTogglePersonalDashboard}
          watchlist={watchlist}
          personalDashboard={personalDashboard}
          userRatings={userRatings}
        />
      )}

      {currentPage === "personal-dashboard" && (
        <PersonalDashboard
          onMovieClick={handleMovieClick}
          onRate={handleRate}
          onToggleWatchlist={handleToggleWatchlist}
          onTogglePersonalDashboard={handleTogglePersonalDashboard}
          onBack={handleBackFromPersonalDashboard}
          watchlist={watchlist}
          personalDashboard={personalDashboard}
          userRatings={userRatings}
        />
      )}

      {currentPage === "details" && selectedMovie && (
        <MovieDetails
          movie={selectedMovie}
          onBack={handleBackFromDetails}
          onMovieClick={handleMovieClick}
          onRate={handleRate}
          onToggleWatchlist={handleToggleWatchlist}
          onTogglePersonalDashboard={handleTogglePersonalDashboard}
          watchlist={watchlist}
          personalDashboard={personalDashboard}
          userRatings={userRatings}
        />
      )}

      {currentPage === "profile" && (
        <Profile
          userName={userName}
          userEmail={userEmail}
          watchlist={watchlist}
          personalDashboard={personalDashboard}
          userRatings={userRatings}
        />
      )}

      {currentPage === "watchlist" && (
        <Watchlist
          watchlist={watchlist}
          personalDashboard={personalDashboard}
          onMovieClick={handleMovieClick}
          onRate={handleRate}
          onToggleWatchlist={handleToggleWatchlist}
          onTogglePersonalDashboard={handleTogglePersonalDashboard}
          userRatings={userRatings}
        />
      )}

      {currentPage === "ratings" && (
        <MyRatings
          userRatings={userRatings}
          onMovieClick={handleMovieClick}
          onRate={handleRate}
          onToggleWatchlist={handleToggleWatchlist}
          onTogglePersonalDashboard={handleTogglePersonalDashboard}
          watchlist={watchlist}
          personalDashboard={personalDashboard}
        />
      )}

      {currentPage === "feedback" && (
        <Feedback
          userName={userName}
          userEmail={userEmail}
        />
      )}
      <Toaster />
    </div>
  );
}