/**
 * Dashboard Component
 * 
 * Main landing page that displays movie recommendations to authenticated users.
 * The component uses memoization to optimize performance when rendering large movie lists.
 * Clean home page with essential movie discovery sections.
 * 
 * Features:
 * - Recommended movies based on ratings
 * - Trending movies section showing most voted films
 * - Recently added movies (newest first)
 * - Top rated movies filtered by minimum rating (8.0+)
 * - Movie card interactions: click to view details, rate, add to watchlist
 * - Quick access to Personal Dashboard
 * 
 * State Management:
 * - watchlist: Array of movie IDs added by user
 * - personalDashboard: Array of movie IDs added to personal dashboard
 * - userRatings: Object mapping movieId to user's rating (1-10)
 * - All movie lists are memoized to prevent unnecessary re-renders
 * 
 * Props:
 * - onMovieClick: Callback when user clicks a movie card
 * - onRate: Callback when user rates a movie
 * - onToggleWatchlist: Callback when user adds/removes from watchlist
 * - onTogglePersonalDashboard: Callback when user adds/removes from personal dashboard
 * - onNavigatePersonalDashboard: Callback to navigate to personal dashboard
 * - watchlist: Current user's watchlist
 * - personalDashboard: Current user's personal dashboard
 * - userRatings: Current user's movie ratings
 * - userName: Display user's name in greeting
 */

import { TrendingUp, Sparkles, Clock, Star } from "lucide-react";
import { Movie, mockMovies } from "../data/mockMovies";
import { MovieCard } from "../components/MovieCard";
import { MovieGridSkeleton } from "../components/LoadingSkeleton";
import { useMemo, useState, useEffect } from "react";
import { db } from "../../config/firebaseConfig";
import { collection, query, getDocs, limit, orderBy } from "firebase/firestore";
import { getCurrentUser } from "../../config/authService";

interface DashboardProps {
  onMovieClick: (movie: Movie) => void;
  onRate: (movieId: number, rating: number) => void;
  onToggleWatchlist: (movieId: number) => void;
  onTogglePersonalDashboard: (movieId: number) => void;
  onNavigatePersonalDashboard: () => void;
  watchlist: number[];
  personalDashboard: number[];
  userRatings: Record<number, number>;
  userName?: string;
}

export function Dashboard({
  onMovieClick,
  onRate,
  onToggleWatchlist,
  onTogglePersonalDashboard,
  onNavigatePersonalDashboard,
  watchlist,
  personalDashboard,
  userRatings
}: DashboardProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recommendedMovies, setRecommendedMovies] = useState<Movie[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(null);

  // Fetch movies from Firestore
  useEffect(() => {
    const fetchMovies = async () => {
      try {
        console.log("🔄 Fetching all movies from Firestore...");
        const moviesCollection = collection(db, "movies");
        // Remove limit to get ALL movies
        const moviesSnapshot = await getDocs(moviesCollection);
        
        console.log(`✅ Retrieved ${moviesSnapshot.docs.length} movies from Firestore`);
        
        const firestoreMovies = moviesSnapshot.docs.map((doc) => {
          const data = doc.data();
          // Generate a consistent color-based image using title hash
          const colors = ['FF6B6B', '4ECDC4', '45B7D1', 'FFA07A', '98D8C8', 'F7DC6F', 'BB8FCE', '85C1E2'];
          const hashCode = data.title?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
          const colorIndex = hashCode % colors.length;
          const bgColor = colors[colorIndex];
          
          // Transform Firestore data to Movie interface
          return {
            id: data.movieId || doc.id,
            title: data.title || "",
            year: data.year || 0,
            genre: Array.isArray(data.genres) ? data.genres : (data.genres?.split("|") || []),
            rating: data.avgRating || 0,
            votes: data.ratingCount || 0,
            duration: 120,
            director: "Unknown",
            cast: [],
            overview: "",
            poster: `https://via.placeholder.com/300x450/${bgColor}/FFFFFF?text=${encodeURIComponent(data.title?.substring(0, 20) || 'Movie')}`,
            backdrop: `https://via.placeholder.com/1200x600/${bgColor}/FFFFFF?text=${encodeURIComponent(data.title || 'Movie')}`
          } as Movie;
        });

        if (firestoreMovies.length > 0) {
          console.log(`📊 Setting movies state with ${firestoreMovies.length} real movies`);
          console.log("Sample movie:", firestoreMovies[0]);
          setMovies(firestoreMovies);
        } else {
          console.warn("⚠️ No movies found in Firestore, falling back to mock data");
          setMovies(mockMovies);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching movies from Firestore:", error);
        // Fallback to mock data if Firestore fails
        setIsLoading(false);
      }
    };

    fetchMovies();
  }, []);

  // Fetch personalized recommendations from backend
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoadingRecommendations(true);
        setRecommendationError(null);

        const currentUser = getCurrentUser();
        if (!currentUser) {
          console.log("No user logged in, showing popular movies");
          setIsLoadingRecommendations(false);
          return;
        }

        console.log("Fetching personalized recommendations for user:", currentUser.uid);
        
        // Call backend recommendation API
        const response = await fetch(
          `http://localhost:8000/api/recommendations/user/${currentUser.uid}?n=6`,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch recommendations: ${response.status}`);
        }

        const data = await response.json();
        console.log("Recommendations response:", data);

        if (data.recommendations && Array.isArray(data.recommendations)) {
          // Convert API recommendations to Movie objects
          const recommendedMoviesList = data.recommendations
            .map((rec: any) => {
              const foundMovie = movies.find(m => m.id === rec.movieId);
              return foundMovie || {
                id: rec.movieId,
                title: rec.title,
                rating: rec.avgRating,
                votes: 0,
                year: 0,
                genre: [],
                duration: 120,
                director: "Unknown",
                cast: [],
                overview: "",
                poster: `https://via.placeholder.com/300x450/4ECDC4/FFFFFF?text=${encodeURIComponent(rec.title.substring(0, 20))}`,
                backdrop: `https://via.placeholder.com/1200x600/4ECDC4/FFFFFF?text=${encodeURIComponent(rec.title)}`
              };
            })
            .filter((movie: Movie) => movie !== null);

          setRecommendedMovies(recommendedMoviesList);
          console.log(`Loaded ${recommendedMoviesList.length} personalized recommendations`);
        } else {
          throw new Error("Invalid recommendations response format");
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        setRecommendationError(error instanceof Error ? error.message : "Failed to load recommendations");
        // Fallback to popular movies
        setRecommendedMovies([...movies].sort((a, b) => b.rating - a.rating).slice(0, 6));
      } finally {
        setIsLoadingRecommendations(false);
      }
    };

    if (movies.length > 0) {
      fetchRecommendations();
    }
  }, [movies, userRatings]);

  // Derived movie lists - each sorted and filtered by different criteria
  // Using useMemo prevents recalculation on every render, improving performance
  // Performance optimization is critical since movies can contain hundreds of entries

  // Trending movies (most votes)
  const trendingMovies = useMemo(() => 
    [...movies]
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 6),
    [movies]
  );

  // Recently added (newest first)
  const recentMovies = useMemo(() => 
    [...movies]
      .sort((a, b) => b.year - a.year)
      .slice(0, 6),
    [movies]
  );

  // Top rated
  const topRatedMovies = useMemo(() => 
    [...movies]
      .filter((m) => m.rating >= 8.0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6),
    [movies]
  );

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-purple-900/50 to-pink-900/50 p-8 md:p-12 border border-purple-800/30">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-yellow-500" />
                <span className="text-sm font-semibold text-yellow-500 uppercase tracking-wider">
                  Personalized For You
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Discover Your Next Favorite Movie
              </h2>
              <p className="text-zinc-300 text-lg max-w-2xl">
                Our intelligent recommendation system analyzes your preferences to bring you the
                perfect films. Rate movies to get even better suggestions!
              </p>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-600/20 rounded-full blur-3xl" />
          </div>
        </div>

        {/* Recommended For You */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-purple-500" />
            <h3 className="text-2xl font-semibold text-white">Recommended For You</h3>
          </div>
          {recommendationError && (
            <div className="mb-4 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg text-yellow-400 text-sm">
              {recommendationError} - Showing popular movies instead
            </div>
          )}
          {isLoadingRecommendations ? <MovieGridSkeleton count={6} /> : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {recommendedMovies.length > 0 ? recommendedMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={() => onMovieClick(movie)}
                  onRate={onRate}
                  onToggleWatchlist={onToggleWatchlist}
                  onTogglePersonalDashboard={onTogglePersonalDashboard}
                  isInWatchlist={watchlist.includes(movie.id)}
                  isInPersonalDashboard={personalDashboard.includes(movie.id)}
                  userRating={userRatings[movie.id]}
                />
              )) : (
                <div className="col-span-full text-center text-zinc-400 py-8">
                  Rate some movies to get personalized recommendations!
                </div>
              )}
            </div>
          )}
        </section>

        {/* Trending Now */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-pink-500" />
            <h3 className="text-2xl font-semibold text-white">Trending Now</h3>
          </div>
          {isLoading ? <MovieGridSkeleton count={6} /> : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {trendingMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={() => onMovieClick(movie)}
                  onRate={onRate}
                  onToggleWatchlist={onToggleWatchlist}
                  onTogglePersonalDashboard={onTogglePersonalDashboard}
                  isInWatchlist={watchlist.includes(movie.id)}
                  isInPersonalDashboard={personalDashboard.includes(movie.id)}
                  userRating={userRatings[movie.id]}
                />
              ))}
            </div>
          )}
        </section>

        {/* Top Rated */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Star className="w-6 h-6 text-yellow-500" />
            <h3 className="text-2xl font-semibold text-white">Top Rated Movies</h3>
          </div>
          {isLoading ? <MovieGridSkeleton count={6} /> : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {topRatedMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onClick={() => onMovieClick(movie)}
                  onRate={onRate}
                  onToggleWatchlist={onToggleWatchlist}
                  onTogglePersonalDashboard={onTogglePersonalDashboard}
                  isInWatchlist={watchlist.includes(movie.id)}
                  isInPersonalDashboard={personalDashboard.includes(movie.id)}
                  userRating={userRatings[movie.id]}
                />
              ))}
            </div>
          )}
        </section>

        {/* Recently Added */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-emerald-500" />
            <h3 className="text-2xl font-semibold text-white">Recently Added</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recentMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={() => onMovieClick(movie)}
                onRate={onRate}
                onToggleWatchlist={onToggleWatchlist}
                onTogglePersonalDashboard={onTogglePersonalDashboard}
                isInWatchlist={watchlist.includes(movie.id)}
                isInPersonalDashboard={personalDashboard.includes(movie.id)}
                userRating={userRatings[movie.id]}
              />
            ))}
          </div>
        </section>

        {/* Quick Access to Personal Dashboard */}
        <div className="mb-12">
          <button
            onClick={onNavigatePersonalDashboard}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-all hover:shadow-lg"
          >
            <span className="text-lg">✨ View Your Personal Dashboard</span>
            <p className="text-sm text-purple-100 mt-1">See your curated collection and personalized recommendations</p>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-600/20 rounded-lg">
                <Star className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{Object.keys(userRatings).length}</p>
                <p className="text-sm text-zinc-400">Movies Rated</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-pink-600/20 rounded-lg">
                <Clock className="w-6 h-6 text-pink-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{watchlist.length}</p>
                <p className="text-sm text-zinc-400">In Watchlist</p>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-600/20 rounded-lg">
                <Sparkles className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{mockMovies.length}</p>
                <p className="text-sm text-zinc-400">Movies Available</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}