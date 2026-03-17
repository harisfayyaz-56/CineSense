import { useState, useCallback } from "react";
import { Login } from "./pages/Login";
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

type Page = "login" | "dashboard" | "search" | "details" | "profile" | "watchlist" | "ratings" | "feedback";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [watchlist, setWatchlist] = useState<number[]>([]);
  const [userRatings, setUserRatings] = useState<Record<number, number>>({});

  const handleLogin = (email: string, password: string) => {
    // Mock authentication
    setIsAuthenticated(true);
    setUserName(email.split("@")[0]);
    setUserEmail(email);
    setCurrentPage("dashboard");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserName("");
    setCurrentPage("login");
    setWatchlist([]);
    setUserRatings({});
  };

  const handleNavigate = (page: string) => {
    if (page === "dashboard" || page === "search" || page === "profile" || page === "watchlist" || page === "ratings" || page === "feedback") {
      setCurrentPage(page as Page);
    }
  };

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