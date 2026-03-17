import { Star, TrendingUp, BarChart3, Filter, Trash2 } from "lucide-react";
import { Movie, mockMovies } from "../data/mockMovies";
import { MovieCard } from "../components/MovieCard";
import { useState } from "react";

interface MyRatingsProps {
  userRatings: Record<number, number>;
  onMovieClick: (movie: Movie) => void;
  onRate: (movieId: number, rating: number) => void;
  onToggleWatchlist: (movieId: number) => void;
  watchlist: number[];
}

export function MyRatings({
  userRatings,
  onMovieClick,
  onRate,
  onToggleWatchlist,
  watchlist
}: MyRatingsProps) {
  const [filterRating, setFilterRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"recent" | "rating-high" | "rating-low">("recent");

  const ratedMovies = mockMovies.filter((movie) => userRatings[movie.id] !== undefined);

  // Apply filters
  let filteredMovies = [...ratedMovies];

  if (filterRating > 0) {
    filteredMovies = filteredMovies.filter((movie) => userRatings[movie.id] === filterRating);
  }

  // Apply sorting
  filteredMovies.sort((a, b) => {
    switch (sortBy) {
      case "rating-high":
        return userRatings[b.id] - userRatings[a.id];
      case "rating-low":
        return userRatings[a.id] - userRatings[b.id];
      case "recent":
      default:
        return Object.keys(userRatings).indexOf(String(b.id)) - 
               Object.keys(userRatings).indexOf(String(a.id));
    }
  });

  // Calculate statistics
  const totalRatings = ratedMovies.length;
  const averageRating =
    totalRatings > 0
      ? Object.values(userRatings).reduce((a, b) => a + b, 0) / totalRatings
      : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: Object.values(userRatings).filter((r) => r === rating).length
  }));

  const maxCount = Math.max(...ratingDistribution.map((d) => d.count), 1);

  const clearAllRatings = () => {
    Object.keys(userRatings).forEach((movieId) => {
      onRate(Number(movieId), 0);
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-yellow-600/20 rounded-xl">
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">My Ratings</h1>
              <p className="text-zinc-400">All the movies you've rated</p>
            </div>
          </div>
        </div>

        {ratedMovies.length > 0 ? (
          <>
            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Total Ratings */}
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-600/20 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{totalRatings}</div>
                    <div className="text-sm text-zinc-400">Total Ratings</div>
                  </div>
                </div>
              </div>

              {/* Average Rating */}
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-yellow-600/20 rounded-lg">
                    <Star className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">
                      {averageRating.toFixed(1)}
                    </div>
                    <div className="text-sm text-zinc-400">Average Rating</div>
                  </div>
                </div>
              </div>

              {/* Rating Distribution */}
              <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-semibold text-white">Distribution</h3>
                </div>
                <div className="space-y-2">
                  {ratingDistribution.map(({ rating, count }) => {
                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    return (
                      <div key={rating} className="flex items-center gap-2">
                        <div className="flex items-center gap-1 w-12">
                          <span className="text-sm text-white font-medium">{rating}</span>
                          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                        </div>
                        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-zinc-400 w-8 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex flex-wrap items-center gap-4">
                {/* Filter by Rating */}
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-zinc-400" />
                  <select
                    value={filterRating}
                    onChange={(e) => setFilterRating(Number(e.target.value))}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    <option value={0}>All Ratings</option>
                    <option value={5}>5 Stars</option>
                    <option value={4}>4 Stars</option>
                    <option value={3}>3 Stars</option>
                    <option value={2}>2 Stars</option>
                    <option value={1}>1 Star</option>
                  </select>
                </div>

                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="recent">Recently Rated</option>
                  <option value="rating-high">Highest Rated</option>
                  <option value="rating-low">Lowest Rated</option>
                </select>
              </div>

              {/* Clear All */}
              <button
                onClick={clearAllRatings}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-600/30 text-red-400 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span>Clear All Ratings</span>
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
                    isInWatchlist={watchlist.includes(movie.id)}
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
                  No movies with this rating
                </h3>
                <p className="text-zinc-400">Try selecting a different filter</p>
              </div>
            )}

            {/* Insights */}
            {filteredMovies.length > 0 && (
              <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-gradient-to-br from-purple-900/20 to-purple-800/20 rounded-xl border border-purple-800/30">
                  <h3 className="font-semibold text-white mb-2">Your Taste Profile</h3>
                  <p className="text-zinc-300 text-sm mb-4">
                    {averageRating >= 4
                      ? "You're very generous with your ratings! You tend to find the good in most movies."
                      : averageRating >= 3
                      ? "You have a balanced perspective and rate movies fairly based on their merits."
                      : "You're a tough critic! You have high standards for what makes a great movie."}
                  </p>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    <span className="text-white">
                      Average: <span className="font-bold">{averageRating.toFixed(1)}/5</span>
                    </span>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-pink-900/20 to-pink-800/20 rounded-xl border border-pink-800/30">
                  <h3 className="font-semibold text-white mb-2">Keep Exploring</h3>
                  <p className="text-zinc-300 text-sm mb-4">
                    You've rated {totalRatings} movies so far. The more you rate, the better your
                    personalized recommendations become!
                  </p>
                  <button className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium transition-colors">
                    Discover More Movies
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-zinc-900 rounded-full mb-6">
              <Star className="w-12 h-12 text-zinc-700" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">No ratings yet</h3>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              Start rating movies to build your taste profile and get better recommendations. Your
              ratings help us understand what you like!
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
            >
              Start Rating Movies
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
