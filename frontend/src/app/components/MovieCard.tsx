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
      className="group relative bg-zinc-900 rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-105 hover:shadow-2xl shadow-lg border border-zinc-700/50"
      onClick={onClick}
    >
      <div className="aspect-[2/3] relative overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-950">
        {/* Movie poster - if placeholder, enhance styling */}
        <div className="w-full h-full relative">
          <ImageWithFallback
            src={movie.poster}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          
          {/* Enhanced overlay for placeholder images */}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent opacity-40 group-hover:opacity-60 transition-opacity" />
          
          {/* Title overlay on poster */}
          <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-black via-transparent to-transparent">
            <h3 className="font-bold text-white text-sm line-clamp-2 mb-2">{movie.title}</h3>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-yellow-400 font-semibold text-xs">{movie.rating.toFixed(1)}</span>
              </div>
              <span className="text-zinc-300 text-xs bg-black/60 px-2 py-1 rounded">{movie.year}</span>
            </div>
          </div>
        </div>
        
        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-purple-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Add Menu Button */}
        {(onToggleWatchlist || onTogglePersonalDashboard) && (
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => e.stopPropagation()}
                className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-sm rounded-full hover:bg-purple-600 transition-all z-10 opacity-0 group-hover:opacity-100"
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
        
        {/* Hover Info - Rating Stars */}
        {onRate && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent translate-y-full group-hover:translate-y-0 transition-transform">
            <p className="text-xs text-zinc-400 mb-2">Your Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={(e) => handleRating(rating, e)}
                  className="hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-5 h-5 ${
                      userRating && rating <= userRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-transparent text-zinc-500 hover:text-yellow-400"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom info section */}
      <div className="p-3 bg-gradient-to-b from-zinc-800/50 to-zinc-900">
        <div className="flex flex-wrap gap-1">
          {movie.genre.slice(0, 2).map((g) => (
            <span
              key={g}
              className="text-xs px-2 py-1 bg-purple-900/40 text-purple-200 rounded-full border border-purple-700/50 hover:bg-purple-900/60 transition-colors"
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
});