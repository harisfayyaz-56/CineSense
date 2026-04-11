/**
 * MovieCard Component - Reusable Movie Display Card
 * 
 * Renders individual movie cards with poster image, title, rating, and interactive features.
 * Wrapped with React.memo() to prevent unnecessary re-renders when parent component updates.
 * This optimization is critical since Dashboard can render 24+ cards simultaneously.
 * 
 * Key Features:
 * - Hover animations: scale up and gradient overlay reveal
 * - Star rating system: clickable 5-star rating interface
 * - Watchlist toggle: add/remove movies from user's watchlist
 * - Image fallback: displays placeholder if poster fails to load
 * - Genre badges: shows primary genres on card bottom
 * 
 * Event Handling:
 * - Uses e.stopPropagation() on rating/watchlist buttons to prevent card click trigger
 * - Allows independent interaction with buttons while maintaining card click functionality
 * - Critical for preventing double navigation when user tries to add movie to watchlist
 * 
 * Props:
 * - movie: Movie object containing all movie data (title, poster, rating, genres, etc)
 * - onRate: Callback function (movieId, rating) triggered when user rates movie
 * - onToggleWatchlist: Callback function (movieId) triggered for watchlist add/remove
 * - isInWatchlist: Boolean indicating if movie is already in user's watchlist
 * - userRating: Current user's rating for this movie (1-5), displays filled stars
 * - onClick: Callback when card is clicked to view movie details
 * 
 * Performance Note:
 * memo() wraps component to skip re-renders if props haven't changed.
 * Essential optimization for rendering multiple cards in Dashboard/Search views.
 */

import { Star, Plus, Check, BookmarkPlus, MoreVertical } from "lucide-react";
import { Movie } from "../data/mockMovies";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { memo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface MovieCardProps {
  movie: Movie;
  onRate?: (movieId: number, rating: number) => void;
  onToggleWatchlist?: (movieId: number) => void;
  onTogglePersonalDashboard?: (movieId: number) => void;
  isInWatchlist?: boolean;
  isInPersonalDashboard?: boolean;
  userRating?: number;
  onClick?: () => void;
}

export const MovieCard = memo(function MovieCard({
  movie,
  onRate,
  onToggleWatchlist,
  onTogglePersonalDashboard,
  isInWatchlist = false,
  isInPersonalDashboard = false,
  userRating,
  onClick
}: MovieCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Event handler for rating: uses stopPropagation to prevent parent click
  // Allows user to rate without navigating to movie details page
  const handleRating = (rating: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRate) {
      onRate(movie.id, rating);
    }
  };

  const handleWatchlistClick = () => {
    if (onToggleWatchlist) {
      onToggleWatchlist(movie.id);
    }
    setIsMenuOpen(false);
  };

  const handlePersonalDashboardClick = () => {
    if (onTogglePersonalDashboard) {
      onTogglePersonalDashboard(movie.id);
    }
    setIsMenuOpen(false);
  };

  return (
    <div 
      className="group relative bg-zinc-900 rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105 hover:shadow-2xl"
      onClick={onClick}
    >
      <div className="aspect-[2/3] relative overflow-hidden">
        <ImageWithFallback
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        
        {/* Add Menu Button */}
        {(onToggleWatchlist || onTogglePersonalDashboard) && (
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/80 transition-colors z-10"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={handleWatchlistClick}>
                <BookmarkPlus className="w-4 h-4 mr-2" />
                <span>Add to Watch Later</span>
                {isInWatchlist && <Check className="w-4 h-4 ml-auto text-emerald-500" />}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={handlePersonalDashboardClick}>
                <Star className="w-4 h-4 mr-2" />
                <span>Add to Personal Dashboard</span>
                {isInPersonalDashboard && <Check className="w-4 h-4 ml-auto text-emerald-500" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        {/* Hover Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform">
          {onRate && (
            <div className="flex gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={(e) => handleRating(rating, e)}
                  className="hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-5 h-5 ${
                      userRating && rating <= userRating
                        ? "fill-yellow-500 text-yellow-500"
                        : "fill-transparent text-white hover:text-yellow-500"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-white mb-1 truncate">{movie.title}</h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">{movie.year}</span>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
            <span className="text-white">{movie.rating.toFixed(1)}</span>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {movie.genre.slice(0, 2).map((g) => (
            <span
              key={g}
              className="text-xs px-2 py-1 bg-zinc-800 text-zinc-300 rounded"
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});