import { Heart, Trash2, Play, Calendar, Clock, Filter } from "lucide-react";
import { Movie, mockMovies } from "../data/mockMovies";
import { MovieCard } from "../components/MovieCard";
import { useState } from "react";

interface WatchlistProps {
  watchlist: number[];
  onMovieClick: (movie: Movie) => void;
  onRate: (movieId: number, rating: number) => void;
  onToggleWatchlist: (movieId: number) => void;
  userRatings: Record<number, number>;
}

/**
 * Helper function: Calculate watchlist statistics including total runtime
 * Returns object with total minutes, formatted hours and minutes
 */
const calculateWatchlistStats = (movies: Movie[]) => {
  const totalMinutes = movies.reduce((sum, movie) => sum + movie.duration, 0);
  return {
    totalMinutes,
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60
  };
};

/**
 * Helper function: Extract unique genres from watchlist movies
 * Returns sorted array of genre strings
 */
const extractGenres = (movies: Movie[]): string[] => {
  return Array.from(
    new Set(movies.flatMap((movie) => movie.genre))
  ).sort();
};

/**
 * Helper function: Filter movies by selected genre
 * Returns filtered array if genre is selected, otherwise returns all movies
 */
const filterByGenre = (movies: Movie[], selectedGenre: string): Movie[] => {
  if (selectedGenre === "all") {
    return movies;
  }
  return movies.filter((movie) => movie.genre.includes(selectedGenre));
};

/**
 * Helper function: Sort movies by specified criteria
 * Supports: "added" (order in watchlist), "rating" (highest first), "year" (newest first)
 */
const sortMovies = (
  movies: Movie[],
  sortBy: "added" | "rating" | "year",
  watchlistOrder: number[]
): Movie[] => {
  const sorted = [...movies];
  
  switch (sortBy) {
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "year":
      return sorted.sort((a, b) => b.year - a.year);
    case "added":
    default:
      return sorted.sort((a, b) => watchlistOrder.indexOf(b.id) - watchlistOrder.indexOf(a.id));
  }
};

/**
 * Helper function: Apply all filters and sorting to watchlist movies
 * Combines genre filtering and sorting in one operation
 */
const getFilteredAndSortedMovies = (
  movies: Movie[],
  selectedGenre: string,
  sortBy: "added" | "rating" | "year",
  watchlistOrder: number[]
): Movie[] => {
  const filtered = filterByGenre(movies, selectedGenre);
  return sortMovies(filtered, sortBy, watchlistOrder);
};

export function Watchlist({
  watchlist,
  onMovieClick,
  onRate,
  onToggleWatchlist,
  userRatings
}: WatchlistProps) {
  const [sortBy, setSortBy] = useState<"added" | "rating" | "year">("added");
  const [filterGenre, setFilterGenre] = useState<string>("all");

  // Get movies that are in the watchlist
  const watchlistMovies = mockMovies.filter((movie) => watchlist.includes(movie.id));

  // Calculate statistics for display
  const stats = calculateWatchlistStats(watchlistMovies);

  // Get available genres from watchlist movies
  const availableGenres = extractGenres(watchlistMovies);

  // Apply filters and sorting to get final display list
  const filteredMovies = getFilteredAndSortedMovies(
    watchlistMovies,
    filterGenre,
    sortBy,
    watchlist
  );

  // Remove all movies from watchlist at once
  const clearWatchlist = () => {
    watchlist.forEach((id) => onToggleWatchlist(id));
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-pink-600/20 rounded-xl">
              <Heart className="w-8 h-8 text-pink-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">My Watchlist</h1>
              <p className="text-zinc-400">Movies you want to watch later</p>
            </div>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800">
              <Play className="w-5 h-5 text-purple-500" />
              <span className="text-white font-semibold">{watchlistMovies.length}</span>
              <span className="text-zinc-400 text-sm">Movies</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800">
              <Clock className="w-5 h-5 text-emerald-500" />
              <span className="text-white font-semibold">
                {stats.hours}h {stats.minutes}m
              </span>
              <span className="text-zinc-400 text-sm">Total Runtime</span>
            </div>
          </div>
        </div>

        {watchlistMovies.length > 0 ? (
          <>
            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                {/* Sort */}
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-zinc-400" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "added" | "rating" | "year")}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="added">Recently Added</option>
                    <option value="rating">Highest Rated</option>
                    <option value="year">Newest First</option>
                  </select>
                </div>

                {/* Genre Filter */}
                {availableGenres.length > 0 && (
                  <select
                    value={filterGenre}
                    onChange={(e) => setFilterGenre(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value="all">All Genres</option>
                    {availableGenres.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Clear All */}
              <button
                onClick={clearWatchlist}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-400 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span>Clear All</span>
              </button>
            </div>

            {/* Movies Grid */}
            {filteredMovies.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {filteredMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onClick={() => onMovieClick(movie)}
                    onRate={onRate}
                    onToggleWatchlist={onToggleWatchlist}
                    isInWatchlist={true}
                    userRating={userRatings[movie.id]}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-zinc-900 rounded-full mb-4">
                  <Filter className="w-10 h-10 text-zinc-600" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  No movies match this filter
                </h3>
                <p className="text-zinc-400">Try selecting a different genre</p>
              </div>
            )}

            {/* Recommendations */}
            {filteredMovies.length > 0 && (
              <div className="mt-12 p-6 bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-800/30">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Ready to Start Watching?
                </h3>
                <p className="text-zinc-300 mb-4">
                  You have {watchlistMovies.length} movies waiting for you. That's about{" "}
                  {hours}h {minutes}m of entertainment!
                </p>
                <div className="flex flex-wrap gap-3">
                  <button className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors">
                    <Play className="w-5 h-5" />
                    Pick Random Movie
                  </button>
                  <button className="flex items-center gap-2 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-semibold transition-colors">
                    <Calendar className="w-5 h-5" />
                    Schedule Watch Time
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-zinc-900 rounded-full mb-6">
              <Heart className="w-12 h-12 text-zinc-700" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">
              Your watchlist is empty
            </h3>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              Start adding movies you want to watch. Click the + icon on any movie card to add it
              to your watchlist.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
            >
              Browse Movies
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
