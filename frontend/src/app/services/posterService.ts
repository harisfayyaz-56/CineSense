/**
 * Poster URL Generator Service
 * Generates professional movie poster URLs based on genre
 * No API keys needed - uses free Unsplash images
 */

// High-quality professional images by genre
const GENRE_POSTER_MAP: Record<string, string> = {
  "Action": "https://images.unsplash.com/photo-1765510296004-614b6cc204da?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=450&q=80&w=300",
  "Adventure": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=450&q=80&w=300",
  "Animation": "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=450&q=80&w=300",
  "Comedy": "https://images.unsplash.com/photo-1485846234645-a62644f84728?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=450&q=80&w=300",
  "Crime": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=450&q=80&w=300",
  "Documentary": "https://images.unsplash.com/photo-1533050487297-86b450e76abe?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=450&q=80&w=300",
  "Drama": "https://images.unsplash.com/photo-1478720568477-152d9e3fb27f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=450&q=80&w=300",
  "Fantasy": "https://images.unsplash.com/photo-1574856123206-b1a2e5ad96ff?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=450&q=80&w=300",
  "Horror": "https://images.unsplash.com/photo-1767048264833-5b65aacd1039?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=450&q=80&w=300",
  "Romance": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=450&q=80&w=300",
  "Sci-Fi": "https://images.unsplash.com/photo-1761948245703-cbf27a3e7502?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=450&q=80&w=300",
  "Thriller": "https://images.unsplash.com/photo-1485846234645-a62644f84728?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=450&q=80&w=300",
};

const DEFAULT_POSTER = "https://images.unsplash.com/photo-1485846234645-a62644f84728?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=450&q=80&w=300";

/**
 * Get a professional poster URL for a movie
 * Priority: Firestore poster > Genre-based Unsplash > Default
 */
export function getPosterUrl(movie: any): string {
  // If movie already has a poster from Firestore, use it
  if (movie.poster && movie.poster.trim() !== '') {
    return movie.poster;
  }

  // Otherwise, get genre-based professional poster
  if (movie.genre && Array.isArray(movie.genre) && movie.genre.length > 0) {
    const primaryGenre = movie.genre[0];
    return GENRE_POSTER_MAP[primaryGenre] || DEFAULT_POSTER;
  }

  // Final fallback
  return DEFAULT_POSTER;
}

// Cache to avoid regenerating URLs
const posterCache = new Map<string | number, string>();

/**
 * Get cached poster URL (memoized for performance)
 */
export function getCachedPosterUrl(movie: any): string {
  const cacheKey = movie.id || movie.movieId;
  
  if (posterCache.has(cacheKey)) {
    return posterCache.get(cacheKey)!;
  }

  const url = getPosterUrl(movie);
  posterCache.set(cacheKey, url);
  return url;
}
