import { Star, Plus, Check } from "lucide-react";
import { Movie } from "../data/mockMovies";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { memo } from "react";

interface MovieCardProps {
  movie: Movie;
  onRate?: (movieId: number, rating: number) => void;
  onToggleWatchlist?: (movieId: number) => void;
  isInWatchlist?: boolean;
  userRating?: number;
  onClick?: () => void;
}

export const MovieCard = memo(function MovieCard({
  movie,
  onRate,
  onToggleWatchlist,
  isInWatchlist = false,
  userRating,
  onClick
}: MovieCardProps) {
  const handleRating = (rating: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRate) {
      onRate(movie.id, rating);
    }
  };

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleWatchlist) {
      onToggleWatchlist(movie.id);
    }
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
        
        {/* Watchlist Button */}
        {onToggleWatchlist && (
          <button
            onClick={handleWatchlistToggle}
            className="absolute top-2 right-2 p-2 bg-black/60 backdrop-blur-sm rounded-full hover:bg-black/80 transition-colors z-10"
          >
            {isInWatchlist ? (
              <Check className="w-5 h-5 text-emerald-500" />
            ) : (
              <Plus className="w-5 h-5 text-white" />
            )}
          </button>
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