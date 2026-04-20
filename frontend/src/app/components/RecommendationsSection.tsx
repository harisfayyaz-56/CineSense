"""
FRONTEND RECOMMENDATIONS COMPONENT (React/TypeScript)
=====================================================

Displays personalized movie recommendations with carousel UI.

Features:
- Fetch recommendations from /api/recommendations/user/{userId}
- Display in responsive carousel/grid
- Show loading state with skeletons
- Handle errors gracefully
- Include reason tooltips

Replace this file with TypeScript/TSX when integrating
"""

// RecommendationsSection.tsx

import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import MovieCard from './MovieCard';
import MovieCardSkeleton from './LoadingSkeleton';

interface Recommendation {
  movieId: number;
  title: string;
  avgRating: number;
  score: number; // 0-1
  reason: string;
}

interface RecommendationsSectionProps {
  userId: string;
  title?: string;
  count?: number;
  variant?: 'carousel' | 'grid';
}

/**
 * RECOMMENDATIONS SECTION COMPONENT
 * ==================================
 *
 * What: Displays personalized movie recommendations using collaborative filtering
 *
 * Props:
 * ------
 * userId : string
 *   The user ID to get recommendations for
 *
 * title : string (optional)
 *   Section title (default: "Recommended For You")
 *
 * count : number (optional)
 *   Number of recommendations to display (default: 10, max: 50)
 *
 * variant : 'carousel' | 'grid' (optional)
 *   Layout variant (default: 'carousel')
 *
 * Usage:
 * ------
 * import RecommendationsSection from '@/app/components/RecommendationsSection';
 *
 * <RecommendationsSection
 *   userId={userId}
 *   title="Recommended For You"
 *   count={10}
 *   variant="carousel"
 * />
 *
 * Data Flow:
 * ---------
 * 1. Component mounts
 * 2. useEffect runs with userId dependency
 * 3. Fetch from /api/recommendations/user/{userId}?n={count}
 * 4. If loading, show skeleton loaders
 * 5. If error, show error message
 * 6. If success, display recommendations
 *
 * Example API Response:
 * -------------------
 * {
 *   "userId": 123,
 *   "recommendations": [
 *     {
 *       "movieId": 122,
 *       "title": "The Lord of the Rings",
 *       "avgRating": 4.27,
 *       "score": 0.92,
 *       "reason": "Users with your taste loved this"
 *     },
 *     ...
 *   ],
 *   "timestamp": "2026-04-20T12:30:45",
 *   "algorithm": "hybrid"
 * }
 */

export default function RecommendationsSection({
  userId,
  title = "Recommended For You",
  count = 10,
  variant = 'carousel'
}: RecommendationsSectionProps) {
  // STATE MANAGEMENT
  // ===============

  // Array of recommendations
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  // Loading state while fetching
  const [isLoading, setIsLoading] = useState(true);

  // Error state if API fails
  const [error, setError] = useState<string | null>(null);

  // Carousel position (for scroll-based carousel)
  const [scrollPos, setScrollPos] = useState(0);

  // FETCH RECOMMENDATIONS
  // ====================

  useEffect(() => {
    /**
     * Fetch personalized recommendations from backend
     *
     * Flow:
     * 1. Set loading state
     * 2. Call /api/recommendations/user/{userId}
     * 3. Validate response structure
     * 4. Update recommendations state
     * 5. Handle errors
     */
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Build URL
        const url = `http://localhost:8000/api/recommendations/user/${userId}?n=${Math.min(count, 50)}&algorithm=hybrid`;

        console.log(`📋 Fetching recommendations from: ${url}`);

        // Fetch from backend
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Validate response
        if (!data.recommendations || !Array.isArray(data.recommendations)) {
          throw new Error("Invalid response format from API");
        }

        console.log(`✅ Got ${data.recommendations.length} recommendations`);

        setRecommendations(data.recommendations);
        setIsLoading(false);

      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to fetch recommendations";
        console.error(`❌ Error: ${message}`);
        setError(message);
        setIsLoading(false);
      }
    };

    // Only fetch if userId is valid
    if (userId) {
      fetchRecommendations();
    } else {
      setError("User ID not provided");
      setIsLoading(false);
    }

  }, [userId, count]); // Re-fetch if userId or count changes


  // RENDER LOADING STATE
  // ===================

  if (isLoading) {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array(count).fill(null).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      </section>
    );
  }


  // RENDER ERROR STATE
  // =================

  if (error) {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-6 flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-medium">Unable to load recommendations</p>
            <p className="text-red-300 text-sm">{error}</p>
          </div>
        </div>
      </section>
    );
  }


  // RENDER EMPTY STATE
  // ==================

  if (recommendations.length === 0) {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-8 text-center">
          <p className="text-slate-400 mb-2">No recommendations available</p>
          <p className="text-slate-500 text-sm">
            Rate some movies to get personalized recommendations!
          </p>
        </div>
      </section>
    );
  }


  // CAROUSEL VARIANT
  // ===============

  if (variant === 'carousel') {
    return (
      <section className="mb-8">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          {title}
          <span className="text-sm font-normal text-slate-400">
            ({recommendations.length} recommendations)
          </span>
        </h2>

        {/* Horizontal scrolling carousel */}
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-4 min-w-full">
            {recommendations.map((rec) => (
              <div key={rec.movieId} className="flex-shrink-0 w-48">
                {/* Movie Card */}
                <MovieCard
                  movieId={rec.movieId}
                  title={rec.title}
                  avgRating={rec.avgRating}
                />

                {/* Recommendation Score & Reason */}
                <div className="mt-2 px-1">
                  {/* Score Bar */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full"
                        style={{ width: `${rec.score * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-purple-300">
                      {(rec.score * 100).toFixed(0)}%
                    </span>
                  </div>

                  {/* Reason Tooltip */}
                  <p className="text-xs text-slate-400 leading-tight">
                    {rec.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <p className="text-xs text-slate-500 mt-3">
          💡 Based on your ratings and movies watched
        </p>
      </section>
    );
  }


  // GRID VARIANT (DEFAULT)
  // ======================

  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        {title}
        <span className="text-sm font-normal text-slate-400">
          ({recommendations.length} recommendations)
        </span>
      </h2>

      {/* Grid layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {recommendations.map((rec) => (
          <div key={rec.movieId} className="flex flex-col">
            {/* Movie Card */}
            <MovieCard
              movieId={rec.movieId}
              title={rec.title}
              avgRating={rec.avgRating}
            />

            {/* Recommendation Score */}
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 bg-slate-700 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full"
                  style={{ width: `${rec.score * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-purple-300">
                {(rec.score * 100).toFixed(0)}%
              </span>
            </div>

            {/* Reason */}
            <p className="text-xs text-slate-400 leading-tight mt-1.5">
              {rec.reason}
            </p>
          </div>
        ))}
      </div>

      {/* Info */}
      <p className="text-xs text-slate-500 mt-4">
        💡 Based on your ratings and movies watched using hybrid collaborative filtering
      </p>
    </section>
  );
}
