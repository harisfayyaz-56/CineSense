import { ArrowLeft, Star, Clock, Calendar, User, Plus, Check, Play } from "lucide-react";
import { Movie, mockMovies } from "../data/mockMovies";
import { MovieCard } from "../components/MovieCard";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

interface MovieDetailsProps {
  movie: Movie;
  onBack: () => void;
  onMovieClick: (movie: Movie) => void;
  onRate: (movieId: number, rating: number) => void;
  onToggleWatchlist: (movieId: number) => void;
  watchlist: number[];
  userRatings: Record<number, number>;
}

/**
 * Helper function: Find movies with similar genres
 * Filters out current movie and returns up to MAX_SIMILAR_MOVIES recommendations
 */
const MAX_SIMILAR_MOVIES = 6;

const findSimilarMovies = (currentMovie: Movie, allMovies: Movie[]): Movie[] => {
  return allMovies
    .filter(
      (m) =>
        m.id !== currentMovie.id &&
        m.genre.some((g) => currentMovie.genre.includes(g))
    )
    .slice(0, MAX_SIMILAR_MOVIES);
};

/**
 * Helper function: Check if user has rated the movie
 * Returns rating value (1-5) if rated, otherwise returns undefined
 */
const getUserRating = (movieId: number, userRatings: Record<number, number>): number | undefined => {
  return userRatings[movieId];
};

/**
 * Helper function: Check if movie is in user's watchlist
 * Returns boolean indicating watchlist status
 */
const isMovieInWatchlist = (movieId: number, watchlist: number[]): boolean => {
  return watchlist.includes(movieId);
};

/**
 * Helper function: Build cast and crew formatted data
 * Returns object with director and cast information ready for display
 */
const formatCastAndCrew = (movie: Movie) => {
  return {
    director: movie.director,
    cast: movie.cast.join(", ")
  };
};

/**
 * Helper function: Extract movie metadata stats
 * Returns object with formatted rating, votes, year, and duration
 */
const getMovieStats = (movie: Movie) => {
  return {
    rating: movie.rating.toFixed(1),
    votes: movie.votes.toLocaleString(),
    year: movie.year,
    duration: movie.duration
  };
};

export function MovieDetails({
  movie,
  onBack,
  onMovieClick,
  onRate,
  onToggleWatchlist,
  watchlist,
  userRatings
}: MovieDetailsProps) {
  // Calculate user interactions with this movie
  const userRating = getUserRating(movie.id, userRatings);
  const isInWatchlist = isMovieInWatchlist(movie.id, watchlist);

  // Get similar movies based on genre matching
  const similarMovies = findSimilarMovies(movie, mockMovies);

  // Format display data
  const stats = getMovieStats(movie);
  const castCrew = formatCastAndCrew(movie);

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Backdrop */}
      <div className="relative h-[60vh] overflow-hidden">
        <div className="absolute inset-0">
          <ImageWithFallback
            src={movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-sm rounded-lg text-white hover:bg-black/80 transition-colors z-10"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* Movie Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Poster */}
              <div className="w-48 flex-shrink-0 hidden md:block">
                <ImageWithFallback
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full rounded-lg shadow-2xl"
                />
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                  {movie.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    <span className="text-xl font-semibold text-white">
                      {stats.rating}
                    </span>
                    <span className="text-zinc-400">({stats.votes} votes)</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Calendar className="w-5 h-5" />
                    <span>{stats.year}</span>
                  </div>
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Clock className="w-5 h-5" />
                    <span>{stats.duration} min</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {movie.genre.map((genre) => (
                    <span
                      key={genre}
                      className="px-4 py-1.5 bg-zinc-800 text-zinc-200 rounded-full text-sm font-medium"
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-4">
                  <button className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors">
                    <Play className="w-5 h-5" />
                    Watch Trailer
                  </button>
                  <button
                    onClick={() => onToggleWatchlist(movie.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                      isInWatchlist
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-zinc-800 hover:bg-zinc-700 text-white"
                    }`}
                  >
                    {isInWatchlist ? (
                      <>
                        <Check className="w-5 h-5" />
                        In Watchlist
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Add to Watchlist
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Overview</h2>
              <p className="text-zinc-300 leading-relaxed text-lg">{movie.overview}</p>
            </section>

            {/* Your Rating */}
            <section className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <h3 className="text-xl font-semibold text-white mb-4">Rate This Movie</h3>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => onRate(movie.id, rating)}
                    className="hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-10 h-10 ${
                        userRating && rating <= userRating
                          ? "fill-yellow-500 text-yellow-500"
                          : "fill-transparent text-zinc-600 hover:text-yellow-500"
                      }`}
                    />
                  </button>
                ))}
                {userRating && (
                  <span className="ml-4 text-zinc-300">
                    Your rating: <span className="text-yellow-500 font-semibold">{userRating}/5</span>
                  </span>
                )}
              </div>
            </section>

            {/* Cast & Crew */}
            <section>
              <h2 className="text-2xl font-semibold text-white mb-4">Cast & Crew</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-purple-500 mt-1" />
                  <div>
                    <p className="text-sm text-zinc-400">Director</p>
                    <p className="text-white font-medium">{castCrew.director}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-purple-500 mt-1" />
                  <div>
                    <p className="text-sm text-zinc-400">Cast</p>
                    <p className="text-white font-medium">{castCrew.cast}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold text-white mb-4">Movie Details</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-zinc-400">Release Year</p>
                  <p className="text-white font-medium">{movie.year}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Duration</p>
                  <p className="text-white font-medium">{movie.duration} minutes</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Genres</p>
                  <p className="text-white font-medium">{movie.genre.join(", ")}</p>
                </div>
                <div>
                  <p className="text-sm text-zinc-400">Average Rating</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                    <span className="text-white font-medium">{movie.rating.toFixed(1)}/10</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Movies */}
        {similarMovies.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold text-white mb-6">Similar Movies</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {similarMovies.map((similarMovie) => (
                <MovieCard
                  key={similarMovie.id}
                  movie={similarMovie}
                  onClick={() => onMovieClick(similarMovie)}
                  onRate={onRate}
                  onToggleWatchlist={onToggleWatchlist}
                  isInWatchlist={watchlist.includes(similarMovie.id)}
                  userRating={userRatings[similarMovie.id]}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
