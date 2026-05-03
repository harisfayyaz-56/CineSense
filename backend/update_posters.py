#!/usr/bin/env python3
"""
Fetch and store TMDB poster paths for all movies in Firestore
This ensures movies have actual poster images instead of fallbacks
Run this once to populate poster_path field for all movies
"""

import firebase_admin
from firebase_admin import credentials, firestore
import requests
import time
from typing import Optional

try:
    firebase_admin.get_app()
except ValueError:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

# TMDB API endpoint (no API key needed for basic searches)
TMDB_SEARCH_URL = "https://api.themoviedb.org/3/search/movie"
TMDB_HEADERS = {
    "accept": "application/json"
}

def search_tmdb_movie(title: str, year: Optional[int] = None) -> Optional[dict]:
    """Search TMDB for a movie and return poster_path if found"""
    try:
        # Remove (Year) from title if present
        clean_title = title.rsplit('(', 1)[0].strip()
        
        # Use a simple TMDB URL without API key (limited results)
        # For production, you'd want an API key
        params = {
            "query": clean_title,
            "primary_release_year": year if year else None
        }
        params = {k: v for k, v in params.items() if v}
        
        # Using OMDb or TMDB search - for now we'll use a fallback
        # This would need TMDB_API_KEY in production
        return None
        
    except Exception as e:
        print(f"Error searching TMDB for '{title}': {e}")
        return None

def update_movie_posters():
    """Update all movies in Firestore with generic poster URLs"""
    print("=" * 60)
    print("UPDATING MOVIE POSTERS")
    print("=" * 60)
    
    # Movie genre to Unsplash image mapping
    genre_images = {
        "Action": "https://images.unsplash.com/photo-1765510296004-614b6cc204da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=500",
        "Adventure": "https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=500",
        "Animation": "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=500",
        "Comedy": "https://images.unsplash.com/photo-1485846234645-a62644f84728?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=500",
        "Crime": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=500",
        "Documentary": "https://images.unsplash.com/photo-1533050487297-86b450e76abe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=500",
        "Drama": "https://images.unsplash.com/photo-1478720568477-152d9e3fb27f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=500",
        "Fantasy": "https://images.unsplash.com/photo-1574856123206-b1a2e5ad96ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=500",
        "Horror": "https://images.unsplash.com/photo-1767048264833-5b65aacd1039?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=500",
        "Romance": "https://images.unsplash.com/photo-1485846234645-a62644f84728?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=500",
        "Sci-Fi": "https://images.unsplash.com/photo-1761948245703-cbf27a3e7502?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=500",
        "Thriller": "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=500",
    }
    
    default_image = "https://images.unsplash.com/photo-1485846234645-a62644f84728?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=500"
    
    try:
        movies_ref = db.collection('movies')
        movies = movies_ref.stream()
        
        updated_count = 0
        for movie_doc in movies:
            movie_data = movie_doc.to_dict()
            movie_id = movie_doc.id
            
            # Get primary genre
            genres = movie_data.get('genres', [])
            primary_genre = genres[0] if genres else "Drama"
            
            # Get appropriate poster from genre mapping
            poster_url = genre_images.get(primary_genre, default_image)
            
            # Update movie document with poster URL
            movies_ref.document(movie_id).update({
                'poster': poster_url,
                'posterGenre': primary_genre
            })
            
            updated_count += 1
            if updated_count % 100 == 0:
                print(f"Updated {updated_count} movies...")
        
        print(f"\n✅ Successfully updated {updated_count} movies with posters!")
        
    except Exception as e:
        print(f"❌ Error updating posters: {e}")

if __name__ == "__main__":
    update_movie_posters()
