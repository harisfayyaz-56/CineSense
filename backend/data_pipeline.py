"""
MovieLens Data Pipeline
========================
Downloads, processes, and prepares MovieLens data for recommendation system.

This script:
1. Downloads the MovieLens dataset (small or full)
2. Extracts CSV files
3. Cleans and preprocesses data
4. Exports ready-to-load data files
"""

import os
import sys
import requests
import zipfile
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
import logging
from tqdm import tqdm

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Data paths
DATA_DIR = Path(__file__).parent / "data"
RAW_DIR = DATA_DIR / "raw"
PROCESSED_DIR = DATA_DIR / "processed"

# MovieLens URLs
MOVIELENS_SMALL = "https://files.grouplens.org/datasets/movielens/ml-latest-small.zip"
MOVIELENS_FULL = "https://files.grouplens.org/datasets/movielens/ml-latest.zip"


class MovieLensDataPipeline:
    """Manages MovieLens data download and preprocessing"""
    
    def __init__(self, use_small_dataset=True):
        """
        Initialize pipeline
        
        Args:
            use_small_dataset (bool): If True, use ML-latest-small (100K ratings).
                                     If False, use ML-latest-full (33M ratings)
        """
        self.use_small_dataset = use_small_dataset
        self.dataset_url = MOVIELENS_SMALL if use_small_dataset else MOVIELENS_FULL
        self.dataset_name = "ml-latest-small" if use_small_dataset else "ml-latest"
        
        # Create directories
        RAW_DIR.mkdir(parents=True, exist_ok=True)
        PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"🎬 MovieLens Data Pipeline initialized")
        logger.info(f"   Dataset: {self.dataset_name}")
        logger.info(f"   Raw data dir: {RAW_DIR}")
        logger.info(f"   Processed data dir: {PROCESSED_DIR}")
    
    def download_dataset(self):
        """Download MovieLens dataset from GroupLens"""
        zip_path = RAW_DIR / f"{self.dataset_name}.zip"
        
        # Check if already downloaded
        if zip_path.exists():
            logger.info(f"✅ Dataset already exists: {zip_path}")
            return zip_path
        
        logger.info(f"📥 Downloading {self.dataset_name} dataset...")
        logger.info(f"   URL: {self.dataset_url}")
        
        try:
            response = requests.get(self.dataset_url, stream=True)
            response.raise_for_status()
            
            # Get file size for progress bar
            total_size = int(response.headers.get('content-length', 0))
            
            # Download with progress bar
            with open(zip_path, 'wb') as f:
                with tqdm(total=total_size, unit='B', unit_scale=True, desc="Downloading") as pbar:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                            pbar.update(len(chunk))
            
            logger.info(f"✅ Download complete: {zip_path}")
            return zip_path
            
        except Exception as e:
            logger.error(f"❌ Download failed: {str(e)}")
            raise
    
    def extract_dataset(self, zip_path):
        """Extract downloaded zip file"""
        extract_path = RAW_DIR / self.dataset_name
        
        # Check if already extracted
        if extract_path.exists():
            logger.info(f"✅ Dataset already extracted: {extract_path}")
            return extract_path
        
        logger.info(f"📂 Extracting dataset...")
        
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(RAW_DIR)
            
            logger.info(f"✅ Extraction complete")
            return extract_path
            
        except Exception as e:
            logger.error(f"❌ Extraction failed: {str(e)}")
            raise
    
    def load_raw_data(self):
        """Load raw CSV files as DataFrames"""
        dataset_path = RAW_DIR / self.dataset_name
        
        logger.info(f"📖 Loading raw CSV files...")
        
        # Load ratings
        ratings_path = dataset_path / "ratings.csv"
        ratings_df = pd.read_csv(ratings_path)
        logger.info(f"   ✓ ratings.csv: {len(ratings_df)} records")
        
        # Load movies
        movies_path = dataset_path / "movies.csv"
        movies_df = pd.read_csv(movies_path)
        logger.info(f"   ✓ movies.csv: {len(movies_df)} records")
        
        # Load tags
        tags_path = dataset_path / "tags.csv"
        tags_df = pd.read_csv(tags_path)
        logger.info(f"   ✓ tags.csv: {len(tags_df)} records")
        
        # Load links (for IMDB/TMDB IDs)
        links_path = dataset_path / "links.csv"
        links_df = pd.read_csv(links_path)
        logger.info(f"   ✓ links.csv: {len(links_df)} records")
        
        return {
            'ratings': ratings_df,
            'movies': movies_df,
            'tags': tags_df,
            'links': links_df
        }
    
    def preprocess_movies(self, movies_df, links_df):
        """
        Clean and preprocess movies data
        
        Operations:
        1. Extract year from title: "Movie (2020)" -> 2020
        2. Split genres into arrays
        3. Merge with links (IMDB/TMDB IDs)
        4. Remove duplicates
        5. Calculate basic statistics
        """
        logger.info(f"🧹 Preprocessing movies data...")
        
        # Copy to avoid modifying original
        df = movies_df.copy()
        
        # Extract year from title
        # Pattern: "Title (YYYY)" -> extract YYYY
        df['year'] = df['title'].str.extract(r'\((\d{4})\)', expand=False).astype(float)
        
        # Split genres string into list
        # Original: "Action|Adventure|Comedy"
        df['genres'] = df['genres'].str.split('|')
        
        # Merge with links to get IMDB and TMDB IDs
        df = df.merge(links_df, on='movieId', how='left')
        
        # Handle missing values
        df['year'] = df['year'].fillna(0).astype(int)
        df['imdbId'] = df['imdbId'].fillna('').astype(str)
        df['tmdbId'] = df['tmdbId'].fillna(0).astype(int)
        
        # Remove rows with no valid movieId
        df = df.dropna(subset=['movieId'])
        df['movieId'] = df['movieId'].astype(int)
        
        # Add placeholder fields for Firestore (will be calculated later)
        df['avgRating'] = 0.0
        df['ratingCount'] = 0
        df['popularity'] = 0
        df['tags'] = df['movieId'].apply(lambda x: [])  # Will be populated from tags.csv
        
        logger.info(f"   ✓ Extracted year from {(df['year'] > 0).sum()} movies")
        logger.info(f"   ✓ Split genres into arrays")
        logger.info(f"   ✓ Merged with link data")
        logger.info(f"   ✓ Final movies: {len(df)} records")
        
        return df
    
    def preprocess_ratings(self, ratings_df, movies_df):
        """
        Clean and preprocess ratings data
        
        Operations:
        1. Validate rating values (0.5 - 5.0)
        2. Remove invalid ratings
        3. Convert timestamp to datetime
        4. Merge with movie info for validation
        5. Calculate per-movie statistics
        """
        logger.info(f"🧹 Preprocessing ratings data...")
        
        df = ratings_df.copy()
        
        # Validate rating range (MovieLens: 0.5 to 5.0)
        valid_ratings = (df['rating'] >= 0.5) & (df['rating'] <= 5.0)
        logger.info(f"   ✓ Valid ratings: {valid_ratings.sum()} / {len(df)}")
        df = df[valid_ratings]
        
        # Convert timestamp to datetime
        df['timestamp'] = pd.to_datetime(df['timestamp'], unit='s')
        
        # Validate movieIds exist in movies dataset
        valid_movies = df['movieId'].isin(movies_df['movieId'])
        logger.info(f"   ✓ Valid movieIds: {valid_movies.sum()} / {len(df)}")
        df = df[valid_movies]
        
        # Calculate statistics per movie
        movie_stats = df.groupby('movieId').agg({
            'rating': ['mean', 'count', 'std'],
            'userId': 'nunique'
        }).round(2)
        
        movie_stats.columns = ['avg_rating', 'rating_count', 'rating_std', 'unique_users']
        
        logger.info(f"   ✓ Final ratings: {len(df)} records")
        logger.info(f"   ✓ Statistics calculated for {len(movie_stats)} movies")
        logger.info(f"   ✓ Average rating: {df['rating'].mean():.2f}")
        logger.info(f"   ✓ Unique users: {df['userId'].nunique()}")
        
        return df, movie_stats
    
    def preprocess_tags(self, tags_df):
        """
        Clean and aggregate tags data
        
        Operations:
        1. Remove timestamps (we only need movie->tags mapping)
        2. Group tags by movie
        3. Calculate tag frequency per movie
        4. Keep top tags for each movie
        """
        logger.info(f"🧹 Preprocessing tags data...")
        
        df = tags_df.copy()
        
        # Group by movieId and get unique tags
        tags_by_movie = df.groupby('movieId')['tag'].apply(list).reset_index()
        tags_by_movie.columns = ['movieId', 'tags']
        
        # Count tag frequency (keep only most frequent)
        def get_top_tags(tag_list, top_n=10):
            """Get top N most frequent tags"""
            from collections import Counter
            if not tag_list:
                return []
            tag_counts = Counter(tag_list)
            return [tag for tag, _ in tag_counts.most_common(top_n)]
        
        tags_by_movie['tags'] = tags_by_movie['tags'].apply(lambda x: get_top_tags(x, top_n=10))
        
        logger.info(f"   ✓ Aggregated tags from {len(df)} tag records")
        logger.info(f"   ✓ Movies with tags: {len(tags_by_movie)}")
        logger.info(f"   ✓ Average tags per movie: {sum(len(t) for t in tags_by_movie['tags']) / len(tags_by_movie):.1f}")
        
        return tags_by_movie
    
    def combine_movie_data(self, movies_df, movie_stats, tags_by_movie):
        """Combine all movie information into single dataframe"""
        logger.info(f"🔗 Combining movie data...")
        
        # Start with processed movies
        df = movies_df.copy()
        
        # Merge with rating statistics
        df = df.merge(movie_stats, left_on='movieId', right_index=True, how='left')
        df = df.rename(columns={
            'avg_rating': 'avgRating',
            'rating_count': 'ratingCount',
            'rating_std': 'ratingStd',
            'unique_users': 'uniqueUsers'
        })
        
        # Merge with tags - ensure movieId column types match
        tags_by_movie['movieId'] = tags_by_movie['movieId'].astype(int)
        df['movieId'] = df['movieId'].astype(int)
        df = df.merge(tags_by_movie, on='movieId', how='left')
        
        # Handle tags column - create if it doesn't exist, fill NaN with empty lists
        if 'tags' not in df.columns:
            df['tags'] = [[] for _ in range(len(df))]
        else:
            df['tags'] = df['tags'].fillna('').apply(lambda x: x if isinstance(x, list) else [])
        
        # Calculate popularity score (0-100 based on rating count)
        max_rating_count = df['ratingCount'].max()
        if hasattr(max_rating_count, 'iloc'): max_rating_count = max_rating_count.iloc[0]
        if max_rating_count > 0:
            df['popularity'] = ((df['ratingCount'] / df['ratingCount'].max()) * 100).round(1)
        else:
            df['popularity'] = 0
        
        # Fill NaN ratings with 0 for movies with no ratings
        df['avgRating'] = df['avgRating'].fillna(0).round(2)
        df['ratingCount'] = df['ratingCount'].fillna(0).astype(int)
        
        logger.info(f"   ✓ Combined data for {len(df)} movies")
        logger.info(f"   ✓ Popularity score calculated")
        
        return df
    
    def export_processed_data(self, movies_final_df, ratings_df):
        """Export processed data as CSV for easy inspection and loading"""
        logger.info(f"💾 Exporting processed data...")
        
        # Export movies
        movies_export_path = PROCESSED_DIR / "movies_processed.csv"
        movies_final_df.to_csv(movies_export_path, index=False)
        logger.info(f"   ✓ Saved: {movies_export_path}")
        
        # Export ratings
        ratings_export_path = PROCESSED_DIR / "ratings_processed.csv"
        ratings_df.to_csv(ratings_export_path, index=False)
        logger.info(f"   ✓ Saved: {ratings_export_path}")
        
        # Export metadata
        metadata = {
            'dataset': self.dataset_name,
            'processed_at': datetime.now().isoformat(),
            'total_movies': len(movies_final_df),
            'total_ratings': len(ratings_df),
            'unique_users': ratings_df['userId'].nunique() if len(ratings_df) > 0 else 0,
            'date_range': {
                'from': ratings_df['timestamp'].min().isoformat() if len(ratings_df) > 0 else '',
                'to': ratings_df['timestamp'].max().isoformat() if len(ratings_df) > 0 else ''
            }
        }
        
        import json
        metadata_path = PROCESSED_DIR / "metadata.json"
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        logger.info(f"   ✓ Saved: {metadata_path}")
        
        return {
            'movies_path': movies_export_path,
            'ratings_path': ratings_export_path,
            'metadata_path': metadata_path
        }
    
    def run(self):
        """Execute full pipeline"""
        logger.info("=" * 60)
        logger.info("🎬 MOVIELENS DATA PIPELINE STARTED")
        logger.info("=" * 60)
        
        try:
            # Step 1: Download
            zip_path = self.download_dataset()
            
            # Step 2: Extract
            extract_path = self.extract_dataset(zip_path)
            
            # Step 3: Load raw data
            raw_data = self.load_raw_data()
            
            # Step 4: Preprocess
            movies_processed = self.preprocess_movies(raw_data['movies'], raw_data['links'])
            ratings_processed, movie_stats = self.preprocess_ratings(raw_data['ratings'], raw_data['movies'])
            tags_processed = self.preprocess_tags(raw_data['tags'])
            
            # Step 5: Combine
            movies_final = self.combine_movie_data(movies_processed, movie_stats, tags_processed)
            
            # Step 6: Export
            export_paths = self.export_processed_data(movies_final, ratings_processed)
            
            logger.info("=" * 60)
            logger.info("✅ DATA PIPELINE COMPLETED SUCCESSFULLY")
            logger.info("=" * 60)
            
            return {
                'success': True,
                'movies': movies_final,
                'ratings': ratings_processed,
                'export_paths': export_paths,
                'statistics': {
                    'total_movies': len(movies_final),
                    'total_ratings': len(ratings_processed),
                    'unique_users': ratings_processed['userId'].nunique()
                }
            }
            
        except Exception as e:
            logger.error("=" * 60)
            logger.error(f"❌ PIPELINE FAILED: {str(e)}")
            logger.error("=" * 60)
            raise


if __name__ == "__main__":
    # Example usage
    pipeline = MovieLensDataPipeline(use_small_dataset=True)  # Use small dataset for testing
    result = pipeline.run()
    
    if result['success']:
        print("\n" + "=" * 60)
        print("📊 FINAL STATISTICS")
        print("=" * 60)
        print(f"Total Movies: {result['statistics']['total_movies']}")
        print(f"Total Ratings: {result['statistics']['total_ratings']}")
        print(f"Unique Users: {result['statistics']['unique_users']}")
        print("=" * 60)
