/**
 * Dashboard Component
 * 
 * Main landing page that displays personalized movie recommendations to authenticated users.
 * The component uses memoization to optimize performance when rendering large movie lists.
 * 
 * Features:
 * - Personalized recommendations based on movie ratings
 * - Trending movies section showing most voted films
 * - Recently added movies (newest first)
 * - Top rated movies filtered by minimum rating (8.0+)
 * - Movie card interactions: click to view details, rate, add to watchlist
 * 
 * State Management:
 * - watchlist: Array of movie IDs added by user
 * - userRatings: Object mapping movieId to user's rating (1-10)
 * - All movie lists are memoized to prevent unnecessary re-renders
 * 
 * Props:
 * - onMovieClick: Callback when user clicks a movie card
 * - onRate: Callback when user rates a movie
 * - onToggleWatchlist: Callback when user adds/removes from watchlist
 * - watchlist: Current user's watchlist
 * - userRatings: Current user's movie ratings
 * - userName: Display user's name in greeting
 */

import { TrendingUp, Sparkles, Clock, Star } from "lucide-react";
import { Movie, mockMovies } from "../data/mockMovies";
import { MovieCard } from "../components/MovieCard";
import { useMemo } from "react";

interface DashboardProps {
  onMovieClick: (movie: Movie) => void;
  onRate: (movieId: number, rating: number) => void;
  onToggleWatchlist: (movieId: number) => void;
  watchlist: number[];
  userRatings: Record<number, number>;
  userName?: string;
}

export function Dashboard({
  onMovieClick,
  onRate,
  onToggleWatchlist,
  watchlist,
  userRatings
}: DashboardProps) {
  // Derived movie lists - each sorted and filtered by different criteria
  // Using useMemo prevents recalculation on every render, improving performance
  // Performance optimization is critical since mockMovies can contain hundreds of entries
  
  // Recommendations: Top 6 highest rated movies from the entire catalog
  // Simulates an AI recommendation engine by showing critically acclaimed films
  // Real implementation would use MovieLens collaborative filtering algorithm
  const recommendedMovies = useMemo(() => 
    [...mockMovies]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6),
    []
  );

  // Trending movies (most votes)
  const trendingMovies = useMemo(() => 
    [...mockMovies]
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 6),
    []
  );

  // Recently added (newest first)
  const recentMovies = useMemo(() => 
    [...mockMovies]
      .sort((a, b) => b.year - a.year)
      .slice(0, 6),
    []
  );

  // Top rated
  const topRatedMovies = useMemo(() => 
    [...mockMovies]
      .filter((m) => m.rating >= 8.0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6),
    []
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {recommendedMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={() => onMovieClick(movie)}
                onRate={onRate}
                onToggleWatchlist={onToggleWatchlist}
                isInWatchlist={watchlist.includes(movie.id)}
                userRating={userRatings[movie.id]}
              />
            ))}
          </div>
        </section>

        {/* Trending Now */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-pink-500" />
            <h3 className="text-2xl font-semibold text-white">Trending Now</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {trendingMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={() => onMovieClick(movie)}
                onRate={onRate}
                onToggleWatchlist={onToggleWatchlist}
                isInWatchlist={watchlist.includes(movie.id)}
                userRating={userRatings[movie.id]}
              />
            ))}
          </div>
        </section>

        {/* Top Rated */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <Star className="w-6 h-6 text-yellow-500" />
            <h3 className="text-2xl font-semibold text-white">Top Rated Movies</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {topRatedMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onClick={() => onMovieClick(movie)}
                onRate={onRate}
                onToggleWatchlist={onToggleWatchlist}
                isInWatchlist={watchlist.includes(movie.id)}
                userRating={userRatings[movie.id]}
              />
            ))}
          </div>
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
                isInWatchlist={watchlist.includes(movie.id)}
                userRating={userRatings[movie.id]}
              />
            ))}
          </div>
        </section>

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