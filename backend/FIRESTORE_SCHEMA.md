# Firestore Database Schema for Movie Recommendation System

## Overview
The Firestore database is organized into collections to store movie data, user interactions, and pre-computed recommendations.

---

## Collections Structure

### 1. `movies/` Collection
Stores movie metadata from MovieLens dataset.

**Document ID**: `movieId` (from MovieLens)

**Fields**:
```javascript
{
  movieId: number,          // Unique movie identifier from MovieLens
  title: string,            // Movie title
  year: number,             // Release year (extracted from title)
  genres: string[],         // Array of genres: ["Action", "Adventure", "Comedy"]
  tmdbId: number,           // TMDB ID for external API integration
  imdbId: string,           // IMDB ID
  avgRating: number,        // Average rating from MovieLens data (0-5)
  ratingCount: number,      // Total ratings in MovieLens dataset
  popularity: number,       // Popularity score (0-100, based on rating count)
  tags: string[],           // Most relevant tags (from ML-20M dataset)
  tagGenome: {              // Tag-genome scores for content-based filtering
    "tagId": 0.85,          // Tag ID -> relevance score (0-1)
    ...
  },
  createdAt: timestamp,     // When added to our system
  lastUpdated: timestamp    // Last update timestamp
}
```

**Indexes**: movieId, genres, popularity

---

### 2. `users/{userId}` Collection
Stores user profile and preferences.

**Document ID**: `uid` (Firebase Auth UID)

**Fields**:
```javascript
{
  uid: string,              // Firebase user ID
  email: string,            // User email
  displayName: string,      // User display name
  preferredGenres: string[], // User's favorite genres
  createdAt: timestamp,     // Account creation date
  lastActive: timestamp,    // Last activity timestamp
  totalRatings: number,     // Count of movies user has rated
  avgRatingGiven: number,   // Average rating user gives
  profileComplete: boolean  // Whether user completed onboarding
}
```

---

### 3. `users/{userId}/ratings/` Subcollection
Stores all movie ratings given by a user.

**Document ID**: `movieId`

**Fields**:
```javascript
{
  movieId: number,          // Movie that was rated
  rating: number,           // Rating value (0.5 to 5.0)
  timestamp: timestamp,     // When user rated this movie
  implicit: boolean         // False = explicit (user chose), True = implicit (derived from watching)
}
```

**Indexes**: timestamp (for sorting by recency)

---

### 4. `users/{userId}/watchHistory/` Subcollection
Stores movies the user has watched or interacted with.

**Document ID**: `movieId`

**Fields**:
```javascript
{
  movieId: number,          // Movie watched
  watchedAt: timestamp,     // When watched
  completionPercent: number, // How much of movie was watched (0-100)
  userRating: number,       // If rated, store here too
  genres: string[],         // Genres of watched movie (for quick reference)
  title: string             // Movie title (for display in dashboard)
}
```

---

### 5. `users/{userId}/watchlist/` Subcollection
Stores movies the user wants to watch.

**Document ID**: `movieId`

**Fields**:
```javascript
{
  movieId: number,
  title: string,
  genres: string[],
  addedAt: timestamp,
  priority: number          // 1-5, user's priority for watching
}
```

---

### 6. `recommendations/{userId}` Collection
Cached recommendations for each user (updated periodically).

**Document ID**: `userId`

**Fields**:
```javascript
{
  userId: string,           // User ID these recommendations are for
  recommendations: [
    {
      movieId: number,
      title: string,
      score: number,        // Recommendation confidence (0-1)
      reason: string,       // Why recommended: "Based on your Action ratings"
      algorithm: string     // Which algorithm generated: "collaborative_filtering"
    },
    ...
  ],
  generatedAt: timestamp,   // When recommendations were computed
  expiresAt: timestamp,     // When they should be refreshed
  totalCount: number        // Total recommendations generated
}
```

---

### 7. `movielens_meta/` Collection
Stores metadata about the MovieLens dataset in our system.

**Document ID**: `dataset_info`

**Fields**:
```javascript
{
  version: string,          // "ml-latest-small" or "ml-latest-full"
  totalMovies: number,      // How many movies loaded
  totalRatings: number,     // Total ratings in dataset
  totalUsers: number,       // Total unique users in MovieLens
  loadedAt: timestamp,      // When data was loaded to Firestore
  lastUpdated: timestamp,   // Last time dataset was refreshed
  statistics: {
    avgRatingPerMovie: number,
    avgRatingPerUser: number,
    dateRange: {
      from: string,         // "1995-01-01"
      to: string            // "2023-12-31"
    }
  }
}
```

---

### 8. `similarMovies/{movieId}` Collection
Pre-computed similar movies for each movie (computed offline).

**Document ID**: `movieId`

**Fields**:
```javascript
{
  movieId: number,          // Movie we're finding similarities for
  similarMovies: [
    {
      movieId: number,
      title: string,
      similarity: number,   // 0-1 score (based on genre, tags, ratings)
      commonGenres: string[]
    },
    ...  // Top 20 similar movies
  ],
  computedAt: timestamp,
  algorithm: string         // "tag_genome_similarity" or "collaborative_filtering"
}
```

---

## Data Loading Strategy

### Phase 1: Initial Load
1. Download MovieLens dataset (CSV files)
2. Parse and clean data
3. Batch write to Firestore in chunks (Firestore batch limit: 500 operations)

### Phase 2: Incremental Updates
- New user ratings → Add to user's rating subcollection
- New watch history → Add to watchHistory subcollection
- Periodic recommendation refresh → Update recommendations collection

---

## Firestore Security Rules
(Will be implemented separately in `firestore.rules`)

- Users can only read/write their own data
- Movie data is readable by everyone
- Recommendations are readable only by the owner
- Admin can write dataset metadata

---

## Indexes Created

```
Collection: movies
- Single field: genres (Ascending)
- Single field: popularity (Descending)
- Single field: avgRating (Descending)

Collection: users/{userId}/ratings
- Single field: timestamp (Descending)

Collection: recommendations/{userId}
- Composite: userId (Asc) + generatedAt (Desc)
```

---

## Data Volume Estimates

Using ML-Latest-Small (100K ratings):
- Movies: ~9,000 documents (~2-3 MB)
- Ratings: ~100,000 documents (~5-8 MB)
- Users: ~600 documents (~200 KB)
- Total Firestore usage: ~10-15 MB (very reasonable)

With ML-Latest-Full (33M ratings):
- Movies: ~86,000 documents (~20-25 MB)
- Ratings: ~33,000,000 documents (~1-2 GB) ⚠️ May hit limits
- Users: ~330,975 documents (~100 MB)
- Consider using Firestore backup or separate analytics DB
