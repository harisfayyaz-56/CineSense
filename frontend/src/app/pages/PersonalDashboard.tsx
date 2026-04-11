/**
 * PersonalDashboard Component
 * 
 * Dedicated page for personalized movie recommendations and user insights.
 * Shows curated collection, favorite genres, and personalization analytics.
 * 
 * Features:
 * - Your Personal Collection (movies user explicitly added)
 * - Favorite Genres analysis from rating history
 * - New releases in favorite genres
 * - Personalization level indicator
 * - User statistics and insights
 * - Movie card interactions: click to view details, rate, add to watchlist
 * 
 * Props:
 * - onMovieClick: Navigate to movie details
 * - onRate: Save movie rating
 * - onToggleWatchlist: Add/remove from watchlist
 * - onTogglePersonalDashboard: Add/remove from personal dashboard
 * - watchlist: User's watchlist
 * - personalDashboard: User's personal collection
 * - userRatings: User's movie ratings
 */

import { BookmarkPlus, Zap, Star, TrendingUp, ArrowLeft } from "lucide-react";
import { Movie, mockMovies } from "../data/mockMovies";
import { MovieCard } from "../components/MovieCard";
import { useMemo } from "react";

interface PersonalDashboardProps {
  onMovieClick: (movie: Movie) => void;
  onRate: (movieId: number, rating: number) => void;
  onToggleWatchlist: (movieId: number) => void;
  onTogglePersonalDashboard: (movieId: number) => void;
  onBack: () => void;
  watchlist: number[];
  personalDashboard: number[];
  userRatings: Record<number, number>;
}

export function PersonalDashboard({
  onMovieClick,
  onRate,
  onToggleWatchlist,
  onTogglePersonalDashboard,
  onBack,
  watchlist,
  personalDashboard,
  userRatings
}: PersonalDashboardProps) {
  // Personal Dashboard curated movies
  const personalDashboardMovies = useMemo(() =>
    [...mockMovies]
      .filter((m) => personalDashboard.includes(m.id))
      .sort((a, b) => b.rating - a.rating),
    [personalDashboard]
  );

  // Extract favorite genres based on user ratings
  const favoriteGenres = useMemo(() => {
    const genreScores: Record<string, number> = {};
    const ratedMovies = mockMovies.filter((m) => userRatings[m.id] !== undefined);
    
    ratedMovies.forEach((movie) => {
      const rating = userRatings[movie.id] || 0;
      movie.genre.forEach((genre) => {
        genreScores[genre] = (genreScores[genre] || 0) + rating;
      });
    });

    return Object.entries(genreScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([genre]) => genre);
  }, [userRatings]);

  // Genre-based recommendations
  const genreRecommendations = useMemo(() => {
    if (favoriteGenres.length === 0) return [];
    
    return [...mockMovies]
      .filter((m) => !personalDashboard.includes(m.id) && m.genre.some((g) => favoriteGenres.includes(g)))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 12);
  }, [favoriteGenres, personalDashboard]);

  // Calculate personalization level
  const personalizationLevel = useMemo(() => {
    const totalRatings = Object.keys(userRatings).length;
    return Math.min(100, Math.round((totalRatings / 20) * 100));
  }, [userRatings]);

  // Average user rating
  const averageRating = useMemo(() => {
    const ratings = Object.values(userRatings);
    if (ratings.length === 0) return 0;
    return (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1);
  }, [userRatings]);

  // Calculate most watched rating
  const mostWatchedRating = useMemo(() => {
    const ratings = Object.values(userRatings);
    if (ratings.length === 0) return 0;
    const ratingCounts: Record<number, number> = {};
    ratings.forEach((r) => {
      ratingCounts[r] = (ratingCounts[r] || 0) + 1;
    });
    return Object.entries(ratingCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || 0;
  }, [userRatings]);

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back Button & Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Page Title */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">Your Personal Dashboard</h1>
          <p className="text-zinc-400 text-lg">
            Your curated collection and personalized recommendations
          </p>
        </div>

        {/* Personalization Level & Stats */}
        <div className="mb-12 bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-2xl p-6 md:p-8 border border-purple-800/30">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="flex-1">
              <h3 className="text-2xl font-semibold text-white mb-2">Your Taste Profile</h3>
              <p className="text-zinc-300 mb-6">
                We know your taste based on your {Object.keys(userRatings).length} ratings. Keep rating to improve recommendations!
              </p>
              <div className="w-full bg-zinc-800 rounded-full h-3 max-w-md">
                <div
                  className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${personalizationLevel}%` }}
                />
              </div>
              <p className="text-sm text-zinc-400 mt-2">{personalizationLevel}% Personalized</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-4xl font-bold text-yellow-500">{averageRating}</p>
                <p className="text-sm text-zinc-400 mt-1">Avg Rating</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-purple-500">{Object.keys(userRatings).length}</p>
                <p className="text-sm text-zinc-400 mt-1">Movies Rated</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-blue-500">{personalDashboard.length}</p>
                <p className="text-sm text-zinc-400 mt-1">Curated Items</p>
              </div>
            </div>
          </div>
        </div>

        {/* Your Personal Collection */}
        {personalDashboardMovies.length > 0 ? (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <BookmarkPlus className="w-8 h-8 text-blue-500" />
              <div>
                <h2 className="text-3xl font-bold text-white">Your Personal Collection</h2>
                <p className="text-zinc-400 text-sm mt-1">{personalDashboardMovies.length} movies curated by you</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {personalDashboardMovies.map((movie) => (
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
        ) : (
          <div className="mb-12 text-center py-16 bg-zinc-900/50 rounded-2xl border border-zinc-800">
            <BookmarkPlus className="w-16 h-16 text-zinc-600 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-white mb-2">Build Your Collection</h3>
            <p className="text-zinc-400">
              Add movies to your personal collection from the movie cards dropdown menu to see them here
            </p>
          </div>
        )}

        {/* Your Favorite Genres */}
        {favoriteGenres.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-8">
              <Zap className="w-8 h-8 text-amber-500" />
              <div>
                <h2 className="text-3xl font-bold text-white">Your Favorite Genres</h2>
                <p className="text-zinc-400 text-sm mt-1">Based on your ratings</p>
              </div>
            </div>

            {/* Genre Badges */}
            <div className="flex flex-wrap gap-3 mb-12">
              {favoriteGenres.map((genre) => (
                <div
                  key={genre}
                  className="px-6 py-3 bg-gradient-to-r from-amber-900/40 to-orange-900/40 rounded-full border border-amber-600/50 hover:border-amber-500 transition-colors"
                >
                  <p className="text-amber-100 font-semibold text-lg">{genre}</p>
                </div>
              ))}
            </div>

            {/* New in Your Favorite Genres */}
            {genreRecommendations.length > 0 && (
              <>
                <div className="flex items-center gap-3 mb-8">
                  <TrendingUp className="w-6 h-6 text-emerald-500" />
                  <h3 className="text-2xl font-bold text-white">
                    New Releases in Your Favorite Genres
                  </h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {genreRecommendations.slice(0, 12).map((movie) => (
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
              </>
            )}
          </section>
        )}

        {/* Rating Insights */}
        {Object.keys(userRatings).length > 0 && (
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-8">Your Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/10 rounded-xl p-6 border border-purple-800/30">
                <Star className="w-8 h-8 text-purple-500 mb-3" />
                <p className="text-sm text-zinc-400 mb-1">Most Common Rating</p>
                <p className="text-3xl font-bold text-purple-400">{mostWatchedRating}/5</p>
              </div>

              <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/10 rounded-xl p-6 border border-blue-800/30">
                <TrendingUp className="w-8 h-8 text-blue-500 mb-3" />
                <p className="text-sm text-zinc-400 mb-1">Total Ratings</p>
                <p className="text-3xl font-bold text-blue-400">{Object.keys(userRatings).length}</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/10 rounded-xl p-6 border border-emerald-800/30">
                <BookmarkPlus className="w-8 h-8 text-emerald-500 mb-3" />
                <p className="text-sm text-zinc-400 mb-1">Saved in Collection</p>
                <p className="text-3xl font-bold text-emerald-400">{personalDashboard.length}</p>
              </div>

              <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/10 rounded-xl p-6 border border-orange-800/30">
                <Zap className="w-8 h-8 text-orange-500 mb-3" />
                <p className="text-sm text-zinc-400 mb-1">Favorite Genres</p>
                <p className="text-3xl font-bold text-orange-400">{favoriteGenres.length}</p>
              </div>
            </div>
          </section>
        )}

        {/* Call to Action */}
        {Object.keys(userRatings).length === 0 && (
          <div className="text-center py-20 bg-zinc-900/30 rounded-2xl border border-zinc-800">
            <Star className="w-16 h-16 text-zinc-600 mx-auto mb-4 opacity-50" />
            <h3 className="text-2xl font-semibold text-white mb-3">Get Your Personalized Dashboard</h3>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              Start rating movies from the home dashboard to unlock personalized recommendations tailored to your taste!
            </p>
            <button
              onClick={onBack}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
            >
              Rate Movies Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
