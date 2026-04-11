import { useState, useCallback, useEffect } from "react";
import { Login } from "./pages/Login";
import { EmailVerification } from "./pages/EmailVerification";
import { Dashboard } from "./pages/Dashboard";
import { Search } from "./pages/Search";
import { MovieDetails } from "./pages/MovieDetails";
import { Profile } from "./pages/Profile";
import { Watchlist } from "./pages/Watchlist";
import { MyRatings } from "./pages/MyRatings";
import { Feedback } from "./pages/Feedback";
import { Header } from "./components/Header";
import { Movie } from "./data/mockMovies";
import { Toaster } from "./components/ui/sonner";
import { getCurrentUser, getUserProfile, isUserEmailVerified } from "../config/authService";

type Page = "login" | "email-verification" | "dashboard" | "search" | "details" | "profile" | "watchlist" | "ratings" | "feedback";

// Valid pages that require authentication
const VALID_AUTHENTICATED_PAGES: Page[] = ["email-verification", "dashboard", "search", "profile", "watchlist", "ratings", "feedback"];

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
 * Returns object with userName, userEmail, and success status
 */
const performLogin = async (email: string): Promise<{ userName: string; userEmail: string }> => {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    return { userName: "User", userEmail: email };
  }

  try {
    const profile = await getUserProfile(currentUser.uid);
    return {
      userName: profile?.displayName || "User",
      userEmail: email
    };
  } catch (error) {
    console.error("Error loading user profile:", error);
    return {
      userName: "User",
      userEmail: email
    };
  }
};

/**
 * Helper function: Reset all user state on logout
 * Clears authentication, user data, watchlist, ratings
 */
const getLogoutState = () => {
  return {
    isAuthenticated: false,
    userName: "",
    userEmail: "",
    currentPage: "login" as Page,
    watchlist: [] as number[],
    userRatings: {} as Record<number, number>
  };
};

/**
 * Helper function: Initialize authentication on app load
 * Checks if user is already logged in and fetches their profile
 * Also checks if email is verified
 * Returns object with loaded state or null if not authenticated
 */
const initializeAuthFromUser = async () => {
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    return null;
  }

  try {
    const profile = await getUserProfile(currentUser.uid);
    
    // Check if email is verified
    const emailVerified = currentUser.emailVerified;
    
    return {
      isAuthenticated: true,
      userName: profile?.displayName || "User",
      userEmail: profile?.email || currentUser.email || "",
      currentPage: emailVerified ? "dashboard" as Page : "email-verification" as Page,
      emailVerified: emailVerified
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
  }, []);

  const handleToggleWatchlist = useCallback((movieId: number) => {
    setWatchlist((prev) =>
      prev.includes(movieId)
        ? prev.filter((id) => id !== movieId)
        : [...prev, movieId]
    );
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
          watchlist={watchlist}
          userRatings={userRatings}
          userName={userName}
        />
      )}

      {currentPage === "search" && (
        <Search
          onMovieClick={handleMovieClick}
          onRate={handleRate}
          onToggleWatchlist={handleToggleWatchlist}
          watchlist={watchlist}
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
          watchlist={watchlist}
          userRatings={userRatings}
        />
      )}

      {currentPage === "profile" && (
        <Profile
          userName={userName}
          userEmail={userEmail}
          watchlist={watchlist}
          userRatings={userRatings}
        />
      )}

      {currentPage === "watchlist" && (
        <Watchlist
          watchlist={watchlist}
          onMovieClick={handleMovieClick}
          onRate={handleRate}
          onToggleWatchlist={handleToggleWatchlist}
          userRatings={userRatings}
        />
      )}

      {currentPage === "ratings" && (
        <MyRatings
          userRatings={userRatings}
          onMovieClick={handleMovieClick}
          onRate={handleRate}
          onToggleWatchlist={handleToggleWatchlist}
          watchlist={watchlist}
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