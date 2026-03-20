/**
 * Search and Filter Page Component
 * 
 * Advanced search interface with multi-filter capabilities and sorting options.
 * Allows users to discover movies through text search and refined filtering.
 * 
 * Search & Filter Features:
 * - Full-text search: filters movies by title (case-insensitive)
 * - Genre filtering: select multiple genres with OR logic (matches any selected genre)
 * - Year filtering: filter movies by release year
 * - Rating filtering: minimum rating threshold filter
 * - Sort options: by rating (descending), year (newest first), or title (A-Z)
 * - Clear all filters: resets all filters and search to show full catalog
 * 
 * State Management:
 * - searchQuery: text string for movie title search
 * - selectedGenres: array of genre strings (can select multiple)
 * - selectedYear: single year or null (mutually exclusive)
 * - minRating: number 0-10 for minimum rating threshold
 * - showFilters: boolean controlling filter panel visibility (mobile optimization)
 * - sortBy: "rating" | "year" | "title" - changes result order
 * 
 * Filtering Algorithm (useMemo):
 * - Filters are applied in sequence: search → genres → year → rating
 * - Uses memoization to prevent recalculation on every render
 * - Only recalculates when filter state changes, not on parent re-renders
 * - Critical performance optimization for large movie catalogs
 * 
 * Sorting:
 * - Rating: highest to lowest (8.5 before 7.2)
 * - Year: newest to oldest (2024 before 2020)
 * - Title: alphabetical A-Z order
 * 
 * Props and Callbacks:
 * - onMovieClick: navigate to movie details page
 * - onRate: save user's movie rating to state
 * - onToggleWatchlist: add/remove movie from watchlist
 * - watchlist: array of movie IDs in user's watchlist
 * - userRatings: object mapping movieId to user's 1-5 rating
 */

import { useState, useMemo } from "react";
import { Search as SearchIcon, Filter, X, SlidersHorizontal } from "lucide-react";
import { Movie, mockMovies, genres, years } from "../data/mockMovies";
import { MovieCard } from "../components/MovieCard";

interface SearchProps {
  onMovieClick: (movie: Movie) => void;
  onRate: (movieId: number, rating: number) => void;
  onToggleWatchlist: (movieId: number) => void;
  watchlist: number[];
  userRatings: Record<number, number>;
}

export function Search({
  onMovieClick,
  onRate,
  onToggleWatchlist,
  watchlist,
  userRatings
}: SearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<"rating" | "year" | "title">("rating");

  // Genre toggle: adds/removes genre from filter array
  // Supports multiple selections with OR logic (any selected genre matches)
  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  // Reset all filters and search simultaneously
  // Returns view to showing entire movie catalog
  const clearFilters = () => {
    setSelectedGenres([]);
    setSelectedYear(null);
    setMinRating(0);
    setSearchQuery("");
  };

  // Memoized filtering and sorting: only recalculates when filters change
  // Prevents expensive filter operations on every render
  // Sequence of filters applied: text search → genres → release year → rating → sort
  const filteredMovies = useMemo(() => {
    let filtered = mockMovies;

    // Search by title
    if (searchQuery) {
      filtered = filtered.filter((movie) =>
        movie.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by genres
    if (selectedGenres.length > 0) {
      filtered = filtered.filter((movie) =>
        selectedGenres.some((genre) => movie.genre.includes(genre))
      );
    }

    // Filter by year
    if (selectedYear) {
      filtered = filtered.filter((movie) => movie.year === selectedYear);
    }

    // Filter by rating
    if (minRating > 0) {
      filtered = filtered.filter((movie) => movie.rating >= minRating);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "year":
          return b.year - a.year;
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, selectedGenres, selectedYear, minRating, sortBy]);

  const activeFiltersCount =
    selectedGenres.length +
    (selectedYear ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (searchQuery ? 1 : 0);

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Search & Discover</h1>
          <p className="text-zinc-400">Find your next favorite movie from our collection</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for movies..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-12 pr-4 py-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-6 py-4 rounded-lg font-medium transition-colors ${
              showFilters
                ? "bg-purple-600 text-white"
                : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800"
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="hidden md:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mb-6 bg-zinc-900 rounded-lg p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-white">Filters</h3>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Genres */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">Genres</label>
                <div className="flex flex-wrap gap-2">
                  {genres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        selectedGenres.includes(genre)
                          ? "bg-purple-600 text-white"
                          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Year */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">Release Year</label>
                <select
                  value={selectedYear || ""}
                  onChange={(e) => setSelectedYear(e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="">All Years</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  Minimum Rating: {minRating > 0 ? minRating.toFixed(1) : "Any"}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={minRating}
                  onChange={(e) => setMinRating(Number(e.target.value))}
                  className="w-full accent-purple-600"
                />
                <div className="flex justify-between text-xs text-zinc-500 mt-1">
                  <span>0</span>
                  <span>10</span>
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-3">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as "rating" | "year" | "title")}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="rating">Rating (High to Low)</option>
                  <option value="year">Year (Newest First)</option>
                  <option value="title">Title (A-Z)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="mb-6">
          <p className="text-zinc-400">
            Found <span className="text-white font-semibold">{filteredMovies.length}</span> movies
          </p>
        </div>

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
              <SearchIcon className="w-10 h-10 text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No movies found</h3>
            <p className="text-zinc-400 mb-4">
              Try adjusting your filters or search query
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-purple-400 hover:text-purple-300 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
