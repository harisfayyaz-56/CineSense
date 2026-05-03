"""
Collaborative Filtering Recommendation Engine
==============================================

Builds personalized movie recommendations using three algorithms:
1. User-User Similarity (KNN) - Find users with similar taste
2. Item-Item Similarity - Find movies similar to ones user liked
3. Matrix Factorization (SVD) - Discover hidden patterns

Author: Sprint 2 Implementation
Date: 2026-04-20
"""

import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
from sklearn.preprocessing import StandardScaler
import logging
from typing import List, Dict, Tuple
import warnings
warnings.filterwarnings('ignore')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class RecommendationEngine:
    """
    Core recommendation engine for personalized movie suggestions.
    
    The engine accepts user ratings and movie metadata, then generates
    recommendations using collaborative filtering techniques.
    
    Parameters:
    -----------
    ratings_df : pd.DataFrame
        Must contain columns: userId, movieId, rating
        Example: 100,836 ratings from 610 users on 9,742 movies
    
    movies_df : pd.DataFrame
        Must contain columns: movieId, title, genres, avgRating
        Example: 9,742 movies with metadata
    
    n_factors : int
        Number of latent factors for SVD (default: 10)
        Higher = more complex patterns, but slower & may overfit
        Lower = faster, more generalizable
    
    Examples:
    ---------
    >>> engine = RecommendationEngine(ratings_df, movies_df, n_factors=10)
    >>> recommendations = engine.get_recommendations(user_id=1, n=10)
    >>> similar_movies = engine.get_similar_movies(movie_id=1, n=5)
    """
    
    def __init__(self, ratings_df: pd.DataFrame, movies_df: pd.DataFrame, 
                 n_factors: int = 10):
        """Initialize the recommendation engine"""
        logger.info("🚀 Initializing RecommendationEngine...")
        
        self.ratings_df = ratings_df.copy()
        self.movies_df = movies_df.copy()
        self.n_factors = n_factors
        
        # Step 1: Create user-item matrix
        logger.info("📊 Building user-item matrix...")
        self.user_item_matrix = self._build_user_item_matrix()
        logger.info(f"   ✓ Matrix shape: {self.user_item_matrix.shape}")
        logger.info(f"     (Users: {self.user_item_matrix.shape[0]}, Movies: {self.user_item_matrix.shape[1]})")
        
        # Step 2: Calculate user similarity
        logger.info("👥 Computing user-user similarity...")
        self.user_similarity_matrix = cosine_similarity(self.user_item_matrix)
        logger.info(f"   ✓ User similarity matrix computed")
        
        # Step 3: Calculate item similarity
        logger.info("🎬 Computing item-item similarity...")
        self.item_similarity_matrix = cosine_similarity(self.user_item_matrix.T)
        logger.info(f"   ✓ Item similarity matrix computed")
        
        # Step 4: Train SVD model
        logger.info("🧠 Training SVD model for matrix factorization...")
        self.svd_model = self._train_svd()
        logger.info(f"   ✓ SVD model trained with {self.n_factors} factors")
        
        # Store user and item indices for lookup
        self.user_id_to_idx = {uid: idx for idx, uid in enumerate(self.user_item_matrix.index)}
        self.idx_to_user_id = {idx: uid for uid, idx in self.user_id_to_idx.items()}
        self.movie_id_to_idx = {mid: idx for idx, mid in enumerate(self.user_item_matrix.columns)}
        self.idx_to_movie_id = {idx: mid for mid, idx in self.movie_id_to_idx.items()}
        
        logger.info("✅ RecommendationEngine initialized successfully!\n")
    
    
    def _build_user_item_matrix(self) -> pd.DataFrame:
        """
        BUILD USER-ITEM MATRIX
        ======================
        
        What: Create a 2D table where:
        - Rows = Users
        - Columns = Movies
        - Values = Ratings (1-5) or NaN if user didn't rate that movie
        
        Why: This matrix is the foundation for all algorithms:
        - User-User: Compare rows (user rating patterns)
        - Item-Item: Compare columns (movie rating patterns)
        - SVD: Factorize the entire matrix
        
        Example output:
                    Movie1  Movie2  Movie3  ...  Movie9742
        User1        5.0     NaN     4.0   ...     NaN
        User2        4.0     3.0     NaN   ...     5.0
        User3        NaN     5.0     5.0   ...     4.0
        ...
        
        How:
        1. Group ratings by user and movie
        2. Create pivot table (users × movies)
        3. Fill NaN with 0 (user hasn't rated that movie)
        """
        # Create pivot table: rows=users, columns=movies, values=ratings
        matrix = self.ratings_df.pivot_table(
            index='userId',
            columns='movieId',
            values='rating',
            fill_value=0
        )
        
        logger.info(f"   ✓ Created matrix: {matrix.shape[0]} users, {matrix.shape[1]} movies")
        logger.info(f"   ✓ Sparsity: {(matrix == 0).sum().sum() / (matrix.shape[0] * matrix.shape[1]) * 100:.1f}% empty")
        
        return matrix
    
    
    def _train_svd(self):
        """
        TRAIN SVD (Singular Value Decomposition)
        ========================================
        
        What: Decompose the user-item matrix into hidden factors
        
        Math:
        UserItemMatrix ≈ UserFactors × MovieFactors
        (610 × 9742)   = (610 × 10) × (10 × 9742)
        
        Why: Discover hidden patterns/themes in ratings
        - Factor 1: "Action intensity" (0-1 scale)
        - Factor 2: "Emotional depth" (0-1 scale)
        - Factor 3: "Comedy level" (0-1 scale)
        - ...
        
        How:
        1. Use TruncatedSVD from scikit-learn
        2. Fit on user-item matrix
        3. Compress to n_factors latent factors
        4. Now: User profile = [0.8 action, 0.6 depth, 0.3 comedy]
               Movie profile = [0.9 action, 0.4 depth, 0.2 comedy]
               Score = dot product = 0.8*0.9 + 0.6*0.4 + 0.3*0.2 = 1.06
        
        Benefits:
        - Handles sparsity well (most ratings are 0)
        - Discovers latent features
        - More predictions than available data
        - Efficient and fast
        """
        svd = TruncatedSVD(
            n_components=self.n_factors,
            random_state=42,
            n_iter=100
        )
        svd.fit(self.user_item_matrix)
        
        # Calculate how much variance is explained
        explained_var = svd.explained_variance_ratio_.sum()
        logger.info(f"   ✓ Explained variance: {explained_var*100:.1f}%")
        
        return svd
    
    
    # ============================================================
    # ALGORITHM 1: USER-USER SIMILARITY (Collaborative Filtering)
    # ============================================================
    
    def _user_user_similarity(self, user_id: int, k: int = 10) -> List[Tuple[int, float]]:
        """
        FIND SIMILAR USERS
        ==================
        
        Algorithm: K-Nearest Neighbors (KNN) on user similarity
        
        Concept:
        "People with taste similar to yours have rated other movies highly.
         Recommend those movies!"
        
        Steps:
        1. Get target user's rating vector
        2. Calculate cosine similarity with ALL other users
        3. Find top K most similar users
        4. Collect movies they rated highly (4+ stars)
        5. Return movies target user hasn't watched
        
        Example:
        --------
        User A (me):      [5, 4, 5, 0, 0, 4, ...]
        User B (similar): [5, 4, 5, 0, 0, 5, 3, ...]  ← similarity = 0.98
        User C (different):[1, 2, 1, 5, 5, 1, 4, ...]  ← similarity = 0.12
        
        → Find users with similarity > 0.5
        → Collect movies they rated > 4 but I haven't watched
        → Sort by their rating
        → Top 10 = recommendations
        
        Parameters:
        -----------
        user_id : int
            Target user ID (the one we're recommending for)
        k : int
            Number of similar users to find (default: 10)
        
        Returns:
        --------
        List of (similar_user_id, similarity_score) tuples
        """
        try:
            # Get user index in the matrix
            user_idx = self.user_id_to_idx.get(user_id)
            if user_idx is None:
                logger.warning(f"⚠️ User {user_id} not found in database")
                return []
            
            # Get similarity scores with all other users
            similarities = self.user_similarity_matrix[user_idx]
            
            # Get indices of top K similar users (excluding self)
            # argsort sorts ascending, so [::-1] reverses to descending
            similar_user_indices = np.argsort(similarities)[::-1][1:k+1]
            
            # Convert to (user_id, similarity_score) tuples
            similar_users = [
                (self.idx_to_user_id[idx], similarities[idx])
                for idx in similar_user_indices
            ]
            
            return similar_users
            
        except Exception as e:
            logger.error(f"Error in user-user similarity: {str(e)}")
            return []
    
    
    # ============================================================
    # ALGORITHM 2: ITEM-ITEM SIMILARITY
    # ============================================================
    
    def _item_item_similarity(self, user_id: int, n: int = 10) -> Dict[int, float]:
        """
        FIND SIMILAR MOVIES
        ===================
        
        Algorithm: Item-to-item collaborative filtering
        
        Concept:
        "People who liked the movies YOU like, also liked THESE movies.
         Let me recommend those!"
        
        Steps:
        1. Get movies target user rated highly (4+ stars)
        2. For each liked movie, find similar movies
        3. For each similar movie, get its average rating
        4. Exclude movies user already watched
        5. Sort by combined score
        
        Example:
        --------
        I rated: Toy Story (5⭐), Avatar (4⭐)
        
        Movies similar to Toy Story (rated highly by same people):
        - Monsters Inc (0.95 similarity)
        - Finding Nemo (0.92 similarity)
        
        Movies similar to Avatar (rated highly by same people):
        - Inception (0.88 similarity)
        - Interstellar (0.85 similarity)
        
        → Combine: Monsters Inc (0.95 * 5 = 4.75 score)
        → Return top 10 by score
        
        Parameters:
        -----------
        user_id : int
            Target user ID
        n : int
            Number of recommendations (default: 10)
        
        Returns:
        --------
        Dict {movie_id: recommendation_score}
        """
        try:
            # Get movies user rated highly (4+ stars)
            user_rated = self.ratings_df[self.ratings_df['userId'] == user_id]
            liked_movies = user_rated[user_rated['rating'] >= 4.0]['movieId'].tolist()
            
            if not liked_movies:
                logger.info(f"User {user_id} hasn't rated any movies highly")
                return {}
            
            # For each liked movie, find similar movies
            recommendations = {}
            
            for liked_movie_id in liked_movies:
                movie_idx = self.movie_id_to_idx.get(liked_movie_id)
                if movie_idx is None:
                    continue
                
                # Get similarity scores with all other movies
                similarities = self.item_similarity_matrix[movie_idx]
                
                # Get top similar movies (excluding self)
                similar_movie_indices = np.argsort(similarities)[::-1][1:20]  # Get top 20
                
                for idx in similar_movie_indices:
                    similar_movie_id = self.idx_to_movie_id[idx]
                    similarity_score = similarities[idx]
                    
                    # Skip if user already watched this movie
                    if similar_movie_id in user_rated['movieId'].values:
                        continue
                    
                    # Get the rating user gave to the original liked movie
                    liked_rating = user_rated[user_rated['movieId'] == liked_movie_id]['rating'].values[0]
                    
                    # Score = similarity × user's rating of similar movie
                    score = similarity_score * liked_rating
                    
                    # Keep highest score for each movie (if it was similar to multiple liked movies)
                    if similar_movie_id not in recommendations:
                        recommendations[similar_movie_id] = score
                    else:
                        recommendations[similar_movie_id] = max(recommendations[similar_movie_id], score)
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in item-item similarity: {str(e)}")
            return {}
    
    
    # ============================================================
    # ALGORITHM 3: SVD (Matrix Factorization)
    # ============================================================
    
    def _svd_recommendations(self, user_id: int, n: int = 10) -> Dict[int, float]:
        """
        SVD-BASED RECOMMENDATIONS
        =========================
        
        Algorithm: Latent Factor Model
        
        Concept:
        "Movies and users can be represented as points in hidden space.
         Users close to similar 'types' of movies should like them."
        
        Steps:
        1. Get user's latent factor vector (from SVD)
        2. Get movie latent factor vectors
        3. Predict rating = dot product of vectors
        4. Recommend top-rated predicted movies
        
        Example:
        --------
        User latent vector: [0.8, 0.6, 0.3, -0.2, 0.5, ...]
        (Represents: high action, high depth, low comedy, etc.)
        
        Movie 1 latent vector: [0.9, 0.4, 0.2, -0.1, 0.6, ...]
        Movie 2 latent vector: [0.1, 0.8, 0.9, 0.5, 0.1, ...]
        
        Predicted rating for Movie 1:
        = 0.8*0.9 + 0.6*0.4 + 0.3*0.2 + (-0.2)*(-0.1) + 0.5*0.6
        = 0.72 + 0.24 + 0.06 + 0.02 + 0.30
        = 1.34 / max_rating → normalized to 1-5 scale
        
        Why this works:
        - Captures complex patterns
        - Handles sparsity well
        - Can predict any user-movie pair
        
        Parameters:
        -----------
        user_id : int
            Target user ID
        n : int
            Number of recommendations
        
        Returns:
        --------
        Dict {movie_id: predicted_rating}
        """
        try:
            user_idx = self.user_id_to_idx.get(user_id)
            if user_idx is None:
                logger.warning(f"User {user_id} not found")
                return {}
            
            # Get user latent factors (from SVD)
            user_factors = self.svd_model.transform(self.user_item_matrix)[user_idx]
            
            # Get all movie latent factors (from SVD)
            movie_factors = self.svd_model.components_.T  # Shape: (n_movies, n_factors)
            
            # Predict ratings: dot product of user and movie factors
            predicted_ratings = movie_factors.dot(user_factors)
            
            # Get movies user hasn't rated
            user_rated_movies = self.ratings_df[self.ratings_df['userId'] == user_id]['movieId'].values
            
            # Create recommendations (movie_id → predicted_rating)
            recommendations = {}
            for movie_idx, pred_rating in enumerate(predicted_ratings):
                movie_id = self.idx_to_movie_id[movie_idx]
                
                # Skip movies already rated by user
                if movie_id not in user_rated_movies:
                    # Normalize to 1-5 scale (SVD outputs can be outside this range)
                    normalized_rating = np.clip(pred_rating, 1, 5)
                    recommendations[movie_id] = normalized_rating
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in SVD recommendations: {str(e)}")
            return {}
    
    
    # ============================================================
    # HYBRID APPROACH: COMBINE ALL THREE ALGORITHMS
    # ============================================================
    
    def get_recommendations(self, user_id: int, n: int = 10, 
                           weights: Dict[str, float] = None) -> List[Dict]:
        """
        GET PERSONALIZED RECOMMENDATIONS (HYBRID)
        ==========================================
        
        What: Combine all three algorithms with weighted scoring
        
        Formula:
        --------
        Final Score = (weight_uu × user_user_score) +
                      (weight_ii × item_item_score) +
                      (weight_svd × svd_score)
        
        Where weights sum to 1.0:
        - Default: UU=0.3, II=0.3, SVD=0.4
        - Reason: SVD tends to be most accurate with large datasets
        
        Steps:
        ------
        1. Get user-user similarity scores
           → Find similar users' liked movies
           → Score based on how many similar users liked it
        
        2. Get item-item similarity scores
           → Find movies similar to ones user liked
           → Score based on similarity strength
        
        3. Get SVD predictions
           → Predict user's rating for each movie
           → Use as-is (already in 1-5 scale)
        
        4. Normalize all scores to 0-1 range
        5. Apply weights and combine
        6. Sort by final score
        7. Return top N, excluding already-watched
        
        Parameters:
        -----------
        user_id : int
            Target user ID
        n : int
            Number of recommendations to return
        weights : Dict[str, float], optional
            Custom weights for each algorithm
            Example: {'user_user': 0.3, 'item_item': 0.3, 'svd': 0.4}
        
        Returns:
        --------
        List[Dict] with keys:
        - movieId : int
        - title : str
        - score : float (0-1)
        - reason : str (why we recommend this)
        
        Example output:
        ---------------
        [
            {
                'movieId': 122,
                'title': 'The Lord of the Rings',
                'score': 0.92,
                'reason': 'Users with your taste loved this'
            },
            {
                'movieId': 451,
                'title': 'Inception',
                'score': 0.88,
                'reason': 'Similar to movies you liked'
            }
        ]
        """
        # Set default weights if not provided
        if weights is None:
            weights = {
                'user_user': 0.3,
                'item_item': 0.3,
                'svd': 0.4
            }
        
        logger.info(f"\n📋 Generating recommendations for user {user_id}")
        logger.info(f"   Using weights: UU={weights['user_user']}, II={weights['item_item']}, SVD={weights['svd']}")
        
        # Step 1: Get recommendations from all three algorithms
        logger.info("   🔄 Running Algorithm 1: User-User Similarity...")
        uu_similar_users = self._user_user_similarity(user_id, k=10)
        uu_scores = self._get_uu_scores(user_id, uu_similar_users)
        logger.info(f"      ✓ Got {len(uu_scores)} candidates from UU")
        
        logger.info("   🔄 Running Algorithm 2: Item-Item Similarity...")
        ii_scores = self._item_item_similarity(user_id, n=30)
        logger.info(f"      ✓ Got {len(ii_scores)} candidates from II")
        
        logger.info("   🔄 Running Algorithm 3: SVD Matrix Factorization...")
        svd_scores = self._svd_recommendations(user_id, n=50)
        logger.info(f"      ✓ Got {len(svd_scores)} candidates from SVD")
        
        # Step 2: Combine scores
        logger.info("   🔀 Combining scores with weights...")
        combined_scores = {}
        all_movies = set(uu_scores.keys()) | set(ii_scores.keys()) | set(svd_scores.keys())
        
        for movie_id in all_movies:
            # Get score from each algorithm (default to 0 if not present)
            uu = uu_scores.get(movie_id, 0)
            ii = ii_scores.get(movie_id, 0)
            svd = svd_scores.get(movie_id, 0) / 5.0  # Normalize SVD (1-5) to (0-1)
            
            # Weighted combination
            final_score = (
                weights['user_user'] * uu +
                weights['item_item'] * ii +
                weights['svd'] * svd
            )
            
            combined_scores[movie_id] = final_score
        
        # Step 3: Sort and return top N
        logger.info(f"   📊 Ranking {len(combined_scores)} movies...")
        sorted_movies = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)
        
        # Build response with movie details
        recommendations = []
        for movie_id, score in sorted_movies[:n]:
            movie_info = self.movies_df[self.movies_df['movieId'] == movie_id]
            if not movie_info.empty:
                movie = movie_info.iloc[0]
                
                # Determine reason for recommendation
                reason = self._get_reason(movie_id, uu_scores, ii_scores, svd_scores)
                
                recommendations.append({
                    'movieId': int(movie_id),
                    'title': str(movie['title']),
                    'avgRating': float(movie['avgRating']),
                    'score': float(score),
                    'reason': reason
                })
        
        logger.info(f"   ✅ Generated {len(recommendations)} recommendations\n")
        return recommendations
    
    
    def _get_uu_scores(self, user_id: int, similar_users: List[Tuple[int, float]]) -> Dict[int, float]:
        """
        Calculate movie scores based on similar users' ratings
        """
        scores = {}
        
        for similar_user_id, similarity_score in similar_users:
            # Get movies similar user rated highly
            sim_user_ratings = self.ratings_df[self.ratings_df['userId'] == similar_user_id]
            liked_by_sim = sim_user_ratings[sim_user_ratings['rating'] >= 4.0]
            
            # Add to scores (weighted by similarity)
            for _, row in liked_by_sim.iterrows():
                movie_id = row['movieId']
                rating = row['rating']
                
                # Skip if user already watched
                if movie_id in self.ratings_df[self.ratings_df['userId'] == user_id]['movieId'].values:
                    continue
                
                # Score = similarity × rating (normalized to 0-1)
                weighted_rating = (similarity_score * rating) / 5.0
                
                if movie_id not in scores:
                    scores[movie_id] = weighted_rating
                else:
                    scores[movie_id] = max(scores[movie_id], weighted_rating)
        
        return scores
    
    
    def _get_reason(self, movie_id: int, uu_scores: Dict, ii_scores: Dict, svd_scores: Dict) -> str:
        """Generate human-readable reason for recommendation"""
        if movie_id in uu_scores and uu_scores[movie_id] > 0:
            return "Users with your taste loved this"
        elif movie_id in ii_scores and ii_scores[movie_id] > 0:
            return "Similar to movies you liked"
        elif movie_id in svd_scores:
            return "Trending with similar users"
        return "Recommended for you"
    
    
    def get_similar_movies(self, movie_id: int, n: int = 5) -> List[Dict]:
        """
        GET SIMILAR MOVIES (ITEM-ITEM)
        ==============================
        
        Find movies similar to a given movie based on user rating patterns.
        
        Use case:
        - "People who liked Avatar also watched..." section
        - Movie detail page
        
        Steps:
        1. Get target movie's rating pattern (who rated it, how much)
        2. Find other movies with similar patterns
        3. Exclude same movie
        4. Return top N similar
        
        Parameters:
        -----------
        movie_id : int
            Target movie ID
        n : int
            Number of similar movies to return
        
        Returns:
        --------
        List[Dict] similar movies with similarity scores
        """
        try:
            movie_idx = self.movie_id_to_idx.get(movie_id)
            if movie_idx is None:
                logger.warning(f"Movie {movie_id} not found")
                return []
            
            # Get similarity scores with all other movies
            similarities = self.item_similarity_matrix[movie_idx]
            
            # Get indices of top similar movies (excluding self)
            similar_indices = np.argsort(similarities)[::-1][1:n+1]
            
            # Get movie details
            similar_movies = []
            for idx in similar_indices:
                similar_movie_id = self.idx_to_movie_id[idx]
                similarity = similarities[idx]
                
                movie_info = self.movies_df[self.movies_df['movieId'] == similar_movie_id]
                if not movie_info.empty:
                    movie = movie_info.iloc[0]
                    similar_movies.append({
                        'movieId': int(similar_movie_id),
                        'title': str(movie['title']),
                        'similarity': float(similarity),
                        'avgRating': float(movie['avgRating'])
                    })
            
            return similar_movies
            
        except Exception as e:
            logger.error(f"Error getting similar movies: {str(e)}")
            return []
    
    
    # ============================================================
    # DYNAMIC USER SUPPORT (For Firestore sync)
    # ============================================================
    
    def add_firestore_users(self, all_ratings_df: pd.DataFrame, 
                            firebase_ratings_df: pd.DataFrame):
        """
        ADD FIREBASE USERS TO ENGINE
        ============================
        
        What: Dynamically add new Firebase users to the recommendation engine
              without retraining from scratch
        
        Process:
        --------
        1. Update ratings dataframe with new Firebase ratings
        2. Rebuild user-item matrix (adds new user rows)
        3. Update user similarity matrix (only new rows)
        4. Update item similarity matrix (full recalc, but same dims)
        5. Retrain SVD with new data
        6. Update index mappings
        
        Parameters:
        -----------
        all_ratings_df : pd.DataFrame
            Combined MovieLens + Firebase ratings (userId, movieId, rating)
        
        firebase_ratings_df : pd.DataFrame
            Only Firebase ratings (for logging purposes)
        
        Example:
        --------
        # User rated 5 movies
        firebase_ratings = pd.DataFrame({
            'userId': ['user_abc123', 'user_abc123', 'user_abc123', 'user_abc123', 'user_abc123'],
            'movieId': [1, 5, 42, 100, 200],
            'rating': [5, 4, 3, 5, 2]
        })
        
        # Update engine
        engine.add_firestore_users(all_ratings, firebase_ratings)
        
        # Now recommendations work!
        recs = engine.get_recommendations('user_abc123', n=10)
        """
        logger.info("🔄 Adding Firebase users to recommendation engine...")
        
        try:
            old_user_count = len(self.ratings_df['userId'].unique())
            old_total_ratings = len(self.ratings_df)
            
            # Step 1: Update ratings
            self.ratings_df = all_ratings_df.copy()
            new_user_count = len(self.ratings_df['userId'].unique())
            new_total_ratings = len(self.ratings_df)
            new_users = new_user_count - old_user_count
            
            logger.info(f"   ✓ Updated ratings: {old_total_ratings} → {new_total_ratings} (+{new_total_ratings - old_total_ratings})")
            logger.info(f"   ✓ Updated users: {old_user_count} → {new_user_count} (+{new_users})")
            
            # Step 2: Rebuild user-item matrix
            logger.info("   📊 Rebuilding user-item matrix...")
            old_matrix_shape = self.user_item_matrix.shape
            self.user_item_matrix = self._build_user_item_matrix()
            logger.info(f"      ✓ Matrix: {old_matrix_shape} → {self.user_item_matrix.shape}")
            
            # Step 3: Recompute similarities
            logger.info("   👥 Recomputing user-user similarity...")
            self.user_similarity_matrix = cosine_similarity(self.user_item_matrix)
            logger.info(f"      ✓ User similarity: {self.user_similarity_matrix.shape}")
            
            logger.info("   🎬 Recomputing item-item similarity...")
            self.item_similarity_matrix = cosine_similarity(self.user_item_matrix.T)
            logger.info(f"      ✓ Item similarity: {self.item_similarity_matrix.shape}")
            
            # Step 4: Retrain SVD
            logger.info("   🧠 Retraining SVD model...")
            self.svd_model = self._train_svd()
            logger.info(f"      ✓ SVD retrained")
            
            # Step 5: Update index mappings
            logger.info("   🗂️  Updating index mappings...")
            self.user_id_to_idx = {uid: idx for idx, uid in enumerate(self.user_item_matrix.index)}
            self.idx_to_user_id = {idx: uid for uid, idx in self.user_id_to_idx.items()}
            self.movie_id_to_idx = {mid: idx for idx, mid in enumerate(self.user_item_matrix.columns)}
            self.idx_to_movie_id = {idx: mid for mid, idx in self.movie_id_to_idx.items()}
            logger.info(f"      ✓ Mappings updated")
            
            logger.info(f"✅ Engine updated! Firebase users can now get recommendations\n")
            
        except Exception as e:
            logger.error(f"❌ Error adding Firebase users: {str(e)}")
            raise


# ============================================================
# EVALUATION METRICS
# ============================================================

class RecommendationEvaluator:
    """
    Evaluate recommendation quality using standard metrics.
    
    Metrics:
    --------
    1. Precision@K: Of top K recommendations, how many did user like?
    2. Recall@K: Of all movies user liked, how many are in top K?
    3. NDCG: Normalized Discounted Cumulative Gain (ranking quality)
    4. RMSE: Root Mean Squared Error (prediction accuracy)
    """
    
    @staticmethod
    def precision_at_k(recommendations: List[int], actual_liked: List[int], k: int = 10) -> float:
        """
        PRECISION@K
        ===========
        
        Question: "Of my top 10 recommendations, how many did the user actually like?"
        
        Formula: precision@k = (relevant items in top K) / K
        
        Example:
        Top 10 recommendations: [1, 5, 3, 12, 8, 99, 42, 7, 2, 11]
        User actually liked: [1, 3, 8, 42, 999]
        
        Relevant in top 10: [1, 3, 8, 42] = 4 items
        Precision@10 = 4 / 10 = 0.40 (40%)
        
        Interpretation:
        - 0.8-1.0 = Excellent (most recommendations are relevant)
        - 0.6-0.8 = Good
        - 0.4-0.6 = Fair
        - 0.0-0.4 = Poor
        """
        top_k = recommendations[:k]
        relevant = len([item for item in top_k if item in actual_liked])
        return relevant / k if k > 0 else 0
    
    
    @staticmethod
    def recall_at_k(recommendations: List[int], actual_liked: List[int], k: int = 10) -> float:
        """
        RECALL@K
        =========
        
        Question: "Of all movies the user liked, what fraction are in my top 10?"
        
        Formula: recall@k = (relevant items in top K) / (total relevant items)
        
        Example:
        Top 10 recommendations: [1, 5, 3, 12, 8, 99, 42, 7, 2, 11]
        User actually liked: [1, 3, 8, 42, 999]
        
        Relevant in top 10: [1, 3, 8, 42] = 4 items
        Total liked: 5 items
        Recall@10 = 4 / 5 = 0.80 (80%)
        
        Interpretation:
        - 0.8-1.0 = Excellent (covered most of user's preferences)
        - 0.6-0.8 = Good
        - 0.4-0.6 = Fair
        - 0.0-0.4 = Poor (missed a lot of their favorites)
        """
        relevant = len([item for item in recommendations[:k] if item in actual_liked])
        return relevant / len(actual_liked) if len(actual_liked) > 0 else 0
    
    
    @staticmethod
    def root_mean_squared_error(predictions: Dict[int, float], 
                               actual: Dict[int, float]) -> float:
        """
        RMSE (Root Mean Squared Error)
        ===============================
        
        Question: "How accurate are my rating predictions?"
        
        Formula: RMSE = sqrt(mean((predicted - actual)²))
        
        Example:
        Predicted ratings: {1: 4.2, 5: 3.8, 3: 4.9}
        Actual ratings: {1: 5.0, 5: 3.5, 3: 4.0}
        
        Errors: [(4.2-5.0)², (3.8-3.5)², (4.9-4.0)²]
                = [0.64, 0.09, 0.81]
        Mean: 0.51
        RMSE: sqrt(0.51) = 0.71
        
        Interpretation:
        - < 0.5 = Excellent (error is small relative to 1-5 scale)
        - 0.5-1.0 = Good
        - 1.0-1.5 = Fair
        - > 1.5 = Poor (predictions are off by > 1.5 stars)
        """
        errors = []
        for movie_id in predictions:
            if movie_id in actual:
                error = (predictions[movie_id] - actual[movie_id]) ** 2
                errors.append(error)
        
        if not errors:
            return 0
        
        mse = np.mean(errors)
        return np.sqrt(mse)


if __name__ == "__main__":
    print("Recommendation Engine Module")
    print("Import this module to use RecommendationEngine class")
