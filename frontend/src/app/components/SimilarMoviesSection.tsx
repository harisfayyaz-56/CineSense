// SimilarMoviesSection.tsx

import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import MovieCard from './MovieCard';
import MovieCardSkeleton from './LoadingSkeleton';

interface SimilarMovie {
  movieId: number;
  title: string;
  similarity: number; // 0-1
  avgRating: number;
}

interface SimilarMoviesSectionProps {
  movieId: number;
  movieTitle: string;
  count?: number;
}

/**
 * SIMILAR MOVIES SECTION COMPONENT
 * ================================
 *
 * What: Display movies similar to a given movie based on collaborative filtering
 *
 * Use Cases:
 * ----------
 * 1. Movie detail page bottom section
 * 2. "People who watched this also watched..." carousel
 * 3. Browse recommendations based on a specific movie
 *
 * Props:
 * ------
 * movieId : number
 *   The movie to find similar movies for
 *
 * movieTitle : string
 *   Name of the movie (for display in heading)
 *
 * count : number (optional)
 *   Number of similar movies to show (default: 5, max: 20)
 *
 * Example Usage:
 * --------------
 * <SimilarMoviesSection
 *   movieId={movieDetails.id}
 *   movieTitle={movieDetails.title}
 *   count={8}
 * />
 *
 * Algorithm Behind It:
 * -------------------
 * Uses Item-Item Collaborative Filtering:
 *
 * "If 1000 users rated both 'Avatar' and 'Inception' similarly high,
 *  then these movies are similar to each other."
 *
 * Similarity Calculation:
 * - Extract rating vectors for both movies
 * - Calculate cosine similarity (0 = different, 1 = identical)
 * - Movies with high similarity = people who like one also like the other
 *
 * Example:
 * Avatar:     [5★, 5★, 4★, 5★, 4★] (from 5 users)
 * Inception:  [5★, 4★, 4★, 5★, 5★] (same 5 users)
 * Similarity: 0.87 (87%) ← Very similar!
 *
 * Inception:  [5★, 4★, 4★, 5★, 5★]
 * Prometheus: [2★, 3★, 2★, 3★, 2★] (different users liked it differently)
 * Similarity: 0.15 (15%) ← Not similar
 */

export default function SimilarMoviesSection({
  movieId,
  movieTitle,
  count = 5
}: SimilarMoviesSectionProps) {
  // STATE MANAGEMENT
  // ===============

  const [similarMovies, setSimilarMovies] = useState<SimilarMovie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FETCH SIMILAR MOVIES
  // ==================

  useEffect(() => {
    /**
     * Fetch similar movies from /api/recommendations/similar/{movieId}
     *
     * Flow:
     * 1. Set loading state
     * 2. Call endpoint with movie ID
     * 3. Validate response
     * 4. Update state
     * 5. Handle errors
     */
    const fetchSimilarMovies = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Build URL
        const url = `http://localhost:8000/api/recommendations/similar/${movieId}?n=${Math.min(count, 20)}`;

        console.log(`🎬 Fetching similar movies from: ${url}`);

        // Fetch from backend
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        // Validate response (should be array)
        if (!Array.isArray(data)) {
          throw new Error("Invalid response format");
        }

        console.log(`✅ Found ${data.length} similar movies`);

        setSimilarMovies(data);
        setIsLoading(false);

      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch similar movies";
        console.error(`❌ Error: ${message}`);
        setError(message);
        setIsLoading(false);
      }
    };

    if (movieId) {
      fetchSimilarMovies();
    }

  }, [movieId, count]);


  // RENDER LOADING STATE
  // ===================

  if (isLoading) {
    return (
      <section className="mb-8">
        <h3 className="text-lg font-bold text-white mb-4">
          👥 People who watched "{movieTitle}" also watched
        </h3>
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-4 min-w-full">
            {Array(count).fill(null).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-40">
                <MovieCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }


  // RENDER ERROR STATE
  // =================

  if (error) {
    return (
      <section className="mb-8">
        <h3 className="text-lg font-bold text-white mb-4">
          Similar Movies
        </h3>
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      </section>
    );
  }


  // RENDER EMPTY STATE
  // ==================

  if (similarMovies.length === 0) {
    return (
      <section className="mb-8">
        <h3 className="text-lg font-bold text-white mb-4">
          Similar Movies
        </h3>
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6 text-center">
          <p className="text-slate-400">No similar movies found</p>
        </div>
      </section>
    );
  }


  // RENDER RESULTS
  // ==============

  return (
    <section className="mb-8">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        👥 People who watched "{movieTitle}" also watched
        <span className="text-sm font-normal text-slate-400">
          ({similarMovies.length})
        </span>
      </h3>

      {/* Horizontal carousel */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-full">
          {similarMovies.map((movie) => (
            <div key={movie.movieId} className="flex-shrink-0">
              <div className="w-40">
                {/* Movie Card */}
                <MovieCard
                  movieId={movie.movieId}
                  title={movie.title}
                  avgRating={movie.avgRating}
                />

                {/* Similarity Score */}
                <div className="mt-2 px-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-300">
                      Similarity
                    </span>
                    <span className="text-xs font-bold text-cyan-400">
                      {(movie.similarity * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Similarity Bar */}
                  <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full"
                      style={{ width: `${movie.similarity * 100}%` }}
                    />
                  </div>

                  {/* Similarity Label */}
                  <p className="text-xs text-slate-500 mt-1.5">
                    {movie.similarity > 0.85 ? "🔥 Very Similar" :
                     movie.similarity > 0.70 ? "✨ Similar" :
                     "📌 Related"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <p className="text-xs text-slate-500 mt-4">
        💡 Based on how users rated these movies similarly
      </p>
    </section>
  );
}

/**
 * SIMILARITY INTERPRETATION GUIDE
 * ===============================
 *
 * 🔥 0.90-1.00 (Very Similar)
 * → People who loved this movie also love it
 * → Similar genre, tone, themes
 * → Highly likely you'll enjoy both
 * Example: Avatar ↔ Inception (0.92)
 *
 * ✨ 0.70-0.89 (Similar)
 * → Significant overlap in who likes them
 * → Similar elements but different enough
 * → Probably worth watching if you liked the first
 * Example: Inception ↔ Interstellar (0.78)
 *
 * 📌 0.50-0.69 (Related)
 * → Some audience overlap
 * → Different but complementary
 * → Might appeal to some fans
 * Example: Inception ↔ The Matrix (0.62)
 *
 * 🤔 0.00-0.49 (Not Similar)
 * → Very different audiences
 * → Minimal overlap
 * → Probably for different tastes
 * Example: Inception ↔ The Notebook (0.12)
 */
