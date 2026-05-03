#!/usr/bin/env python3
"""
Batch update movie posters efficiently (respects Firestore quota)
Updates movies in small batches with delays to avoid quota errors
"""

import firebase_admin
from firebase_admin import credentials, firestore
import time

try:
    firebase_admin.get_app()
except ValueError:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)

db = firestore.client()

# Genre to professional Unsplash image mapping
GENRE_IMAGES = {
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

DEFAULT_IMAGE = "https://images.unsplash.com/photo-1485846234645-a62644f84728?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=500"

def batch_update_posters(batch_size=20, delay_between_batches=5):
    """
    Update all movies with poster URLs in batches
    
    Args:
        batch_size: Number of movies to update per batch
        delay_between_batches: Seconds to wait between batches (respects quota)
    """
    print("=" * 60)
    print("BATCH UPDATING MOVIE POSTERS (Quota-Friendly)")
    print("=" * 60)
    
    try:
        movies_ref = db.collection('movies')
        all_movies = list(movies_ref.stream())
        total_movies = len(all_movies)
        
        print(f"📊 Found {total_movies} movies to update")
        print(f"📦 Batch size: {batch_size} | Delay: {delay_between_batches}s between batches\n")
        
        updated_count = 0
        
        # Process movies in batches
        for i in range(0, total_movies, batch_size):
            batch = db.batch()
            batch_movies = all_movies[i:i + batch_size]
            
            for movie_doc in batch_movies:
                movie_data = movie_doc.to_dict()
                
                # Get primary genre
                genres = movie_data.get('genres', [])
                primary_genre = genres[0] if isinstance(genres, list) and genres else "Drama"
                
                # Get poster URL based on genre
                poster_url = GENRE_IMAGES.get(primary_genre, DEFAULT_IMAGE)
                
                # Add update to batch
                batch.update(movie_doc.reference, {
                    'poster': poster_url,
                    'posterGenre': primary_genre
                })
            
            # Commit batch
            batch.commit()
            updated_count += len(batch_movies)
            
            progress_pct = (updated_count / total_movies) * 100
            print(f"✅ Updated {updated_count}/{total_movies} movies ({progress_pct:.1f}%)")
            
            # Wait between batches (respects quota limits)
            if updated_count < total_movies:
                print(f"⏳ Waiting {delay_between_batches}s before next batch...")
                time.sleep(delay_between_batches)
        
        print(f"\n🎉 COMPLETE! All {updated_count} movies now have professional posters!")
        print(f"✨ Each movie gets a genre-appropriate high-quality image from Unsplash")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        print(f"💡 Firestore quota may be exceeded. Try again in a few minutes.")
        return False
    
    return True

if __name__ == "__main__":
    # You can adjust these parameters if quota errors occur
    # Smaller batch size = slower but less quota pressure
    # Larger delay = slower but more quota-friendly
    
    success = batch_update_posters(
        batch_size=20,  # Update 20 movies per batch
        delay_between_batches=5  # Wait 5 seconds between batches
    )
    
    if success:
        print("\n📱 Now refresh your app to see all movies with beautiful posters!")
