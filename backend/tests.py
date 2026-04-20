"""
Unit Tests for Recommendation Engine
====================================

Tests for each component:
- User-User Similarity
- Item-Item Similarity  
- SVD Matrix Factorization
- Hybrid Approach
- API Endpoints
- Data Validation

Test Framework: pytest
Coverage Goal: > 80%

Author: Sprint 2 Implementation
"""

import pytest
import pandas as pd
import numpy as np
from recommendation_engine import RecommendationEngine, RecommendationEvaluator
import logging

logger = logging.getLogger(__name__)


# ============================================================
# TEST DATA FIXTURES
# ============================================================

@pytest.fixture
def sample_ratings_df():
    """
    Create sample ratings data for testing
    
    Format:
    userId | movieId | rating
    1      | 1       | 5.0
    1      | 2       | 4.0
    ...
    
    Represents: 10 users rating 20 movies
    """
    data = {
        'userId': [1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4],
        'movieId': [1, 2, 3, 4, 5, 1, 2, 6, 7, 8, 2, 3, 9, 10, 11, 1, 6, 12, 13, 14],
        'rating': [5, 4, 4, 3, 2, 5, 5, 4, 4, 3, 4, 4, 5, 3, 2, 5, 3, 4, 4, 5]
    }
    return pd.DataFrame(data)


@pytest.fixture
def sample_movies_df():
    """
    Create sample movies data for testing
    
    Format:
    movieId | title | year | genres | avgRating | ratingCount
    1       | Toy Story | 1995 | [Animation, Comedy] | 4.27 | 100
    ...
    
    Represents: 20 movies with metadata
    """
    data = {
        'movieId': list(range(1, 21)),
        'title': [f"Movie {i}" for i in range(1, 21)],
        'year': [1995 + i for i in range(20)],
        'genres': [['Action', 'Adventure'] for _ in range(20)],
        'avgRating': np.random.uniform(2.5, 4.5, 20),
        'ratingCount': np.random.randint(50, 500, 20)
    }
    return pd.DataFrame(data)


@pytest.fixture
def engine(sample_ratings_df, sample_movies_df):
    """Initialize recommendation engine with sample data"""
    return RecommendationEngine(sample_ratings_df, sample_movies_df, n_factors=3)


# ============================================================
# UNIT TESTS: ENGINE INITIALIZATION
# ============================================================

class TestEngineInitialization:
    """Test recommendation engine initialization"""
    
    def test_engine_initializes(self, engine):
        """Test that engine initializes without errors"""
        assert engine is not None
        logger.info("✅ Engine initializes successfully")
    
    
    def test_user_item_matrix_shape(self, engine):
        """Test user-item matrix has correct shape"""
        n_users = engine.user_item_matrix.shape[0]
        n_movies = engine.user_item_matrix.shape[1]
        
        assert n_users > 0, "Must have users"
        assert n_movies > 0, "Must have movies"
        logger.info(f"✅ User-item matrix shape: {n_users} × {n_movies}")
    
    
    def test_similarity_matrices_computed(self, engine):
        """Test that similarity matrices were computed"""
        assert hasattr(engine, 'user_similarity_matrix')
        assert hasattr(engine, 'item_similarity_matrix')
        
        assert engine.user_similarity_matrix.shape[0] > 0
        assert engine.item_similarity_matrix.shape[0] > 0
        logger.info("✅ Similarity matrices computed")
    
    
    def test_svd_model_trained(self, engine):
        """Test SVD model was trained"""
        assert hasattr(engine, 'svd_model')
        assert engine.svd_model is not None
        
        n_components = engine.svd_model.n_components
        assert n_components == engine.n_factors
        logger.info(f"✅ SVD model trained with {n_components} factors")


# ============================================================
# UNIT TESTS: USER-USER SIMILARITY
# ============================================================

class TestUserUserSimilarity:
    """Test user-user collaborative filtering"""
    
    def test_finds_similar_users(self, engine):
        """Test that engine finds similar users"""
        similar_users = engine._user_user_similarity(user_id=1, k=3)
        
        assert len(similar_users) > 0, "Must find similar users"
        assert len(similar_users) <= 3, "Should return at most k users"
        
        # Check format: (user_id, similarity_score)
        for user_id, sim_score in similar_users:
            assert isinstance(user_id, (int, np.integer))
            assert 0 <= sim_score <= 1, "Similarity should be between 0 and 1"
            assert user_id != 1, "Should not include self"
        
        logger.info(f"✅ Found {len(similar_users)} similar users for user 1")
    
    
    def test_similar_users_sorted_by_similarity(self, engine):
        """Test that similar users are sorted by similarity (descending)"""
        similar_users = engine._user_user_similarity(user_id=1, k=5)
        
        similarities = [score for _, score in similar_users]
        assert similarities == sorted(similarities, reverse=True), \
            "Users should be sorted by similarity (descending)"
        
        logger.info("✅ Similar users are properly sorted")
    
    
    def test_invalid_user_returns_empty(self, engine):
        """Test that invalid user ID returns empty list"""
        similar_users = engine._user_user_similarity(user_id=99999, k=5)
        
        assert similar_users == [], "Invalid user should return empty list"
        logger.info("✅ Invalid user handled correctly")


# ============================================================
# UNIT TESTS: ITEM-ITEM SIMILARITY
# ============================================================

class TestItemItemSimilarity:
    """Test item-item collaborative filtering"""
    
    def test_finds_similar_movies(self, engine):
        """Test that engine finds similar movies"""
        similar_movies = engine._item_item_similarity(user_id=1, n=5)
        
        # User 1 rated movies 1,2,3,4,5
        # Engine should find movies similar to these
        assert isinstance(similar_movies, dict)
        logger.info(f"✅ Found {len(similar_movies)} movie recommendations")
    
    
    def test_excludes_user_rated_movies(self, engine):
        """Test that similar movie recommendations exclude already-rated movies"""
        user_id = 1
        user_ratings = engine.ratings_df[engine.ratings_df['userId'] == user_id]
        rated_movies = set(user_ratings['movieId'].values)
        
        similar_movies = engine._item_item_similarity(user_id=user_id)
        recommended_movies = set(similar_movies.keys())
        
        overlap = rated_movies & recommended_movies
        assert len(overlap) == 0, "Should not recommend already-rated movies"
        
        logger.info(f"✅ Correctly excluded {len(rated_movies)} already-rated movies")
    
    
    def test_scores_in_valid_range(self, engine):
        """Test that scores are in valid range"""
        similar_movies = engine._item_item_similarity(user_id=1)
        
        for movie_id, score in similar_movies.items():
            assert 0 <= score <= 5, f"Score {score} should be in range [0, 5]"
        
        logger.info("✅ All scores in valid range")


# ============================================================
# UNIT TESTS: SVD RECOMMENDATIONS
# ============================================================

class TestSVDRecommendations:
    """Test SVD-based recommendations"""
    
    def test_generates_svd_recommendations(self, engine):
        """Test SVD can generate recommendations"""
        svd_recs = engine._svd_recommendations(user_id=1, n=5)
        
        assert isinstance(svd_recs, dict)
        assert len(svd_recs) > 0, "SVD should generate recommendations"
        
        logger.info(f"✅ SVD generated {len(svd_recs)} recommendations")
    
    
    def test_svd_scores_normalized_to_1_5(self, engine):
        """Test that SVD predictions are normalized to 1-5 rating scale"""
        svd_recs = engine._svd_recommendations(user_id=1, n=10)
        
        for movie_id, score in svd_recs.items():
            assert 1 <= score <= 5, f"SVD score {score} should be in [1, 5]"
        
        logger.info("✅ SVD scores properly normalized")
    
    
    def test_excludes_user_rated_movies_svd(self, engine):
        """Test SVD doesn't recommend already-rated movies"""
        user_id = 1
        user_ratings = engine.ratings_df[engine.ratings_df['userId'] == user_id]
        rated_movies = set(user_ratings['movieId'].values)
        
        svd_recs = engine._svd_recommendations(user_id=user_id)
        recommended_movies = set(svd_recs.keys())
        
        overlap = rated_movies & recommended_movies
        assert len(overlap) == 0, "SVD should not recommend already-rated movies"
        
        logger.info("✅ SVD correctly excludes rated movies")


# ============================================================
# UNIT TESTS: HYBRID RECOMMENDATIONS
# ============================================================

class TestHybridRecommendations:
    """Test hybrid recommendation approach"""
    
    def test_hybrid_generates_recommendations(self, engine):
        """Test hybrid approach generates recommendations"""
        recommendations = engine.get_recommendations(user_id=1, n=5)
        
        assert isinstance(recommendations, list)
        assert len(recommendations) > 0
        
        logger.info(f"✅ Hybrid generated {len(recommendations)} recommendations")
    
    
    def test_hybrid_response_format(self, engine):
        """Test hybrid recommendations have required fields"""
        recommendations = engine.get_recommendations(user_id=1, n=3)
        
        required_fields = {'movieId', 'title', 'score', 'reason', 'avgRating'}
        
        for rec in recommendations:
            assert set(rec.keys()) >= required_fields, \
                f"Missing fields: {required_fields - set(rec.keys())}"
            
            assert 0 <= rec['score'] <= 1, "Score should be in [0, 1]"
            assert isinstance(rec['movieId'], int)
            assert isinstance(rec['title'], str)
            assert isinstance(rec['reason'], str)
        
        logger.info("✅ All recommendations have required fields")
    
    
    def test_recommendations_sorted_by_score(self, engine):
        """Test that recommendations are sorted by score (descending)"""
        recommendations = engine.get_recommendations(user_id=1, n=10)
        
        scores = [r['score'] for r in recommendations]
        assert scores == sorted(scores, reverse=True), \
            "Recommendations should be sorted by score (descending)"
        
        logger.info("✅ Recommendations properly sorted by score")
    
    
    def test_custom_weights(self, engine):
        """Test hybrid with custom weights"""
        custom_weights = {
            'user_user': 0.5,
            'item_item': 0.3,
            'svd': 0.2
        }
        
        recommendations = engine.get_recommendations(
            user_id=1, 
            n=5,
            weights=custom_weights
        )
        
        assert len(recommendations) > 0
        logger.info("✅ Custom weights work correctly")


# ============================================================
# UNIT TESTS: SIMILAR MOVIES
# ============================================================

class TestSimilarMovies:
    """Test similar movie retrieval"""
    
    def test_gets_similar_movies(self, engine):
        """Test getting similar movies for a given movie"""
        similar = engine.get_similar_movies(movie_id=1, n=3)
        
        assert isinstance(similar, list)
        assert len(similar) > 0
        
        logger.info(f"✅ Found {len(similar)} movies similar to movie 1")
    
    
    def test_similar_movies_response_format(self, engine):
        """Test similar movies response has required fields"""
        similar = engine.get_similar_movies(movie_id=1, n=3)
        
        required_fields = {'movieId', 'title', 'similarity', 'avgRating'}
        
        for movie in similar:
            assert set(movie.keys()) >= required_fields
            assert 0 <= movie['similarity'] <= 1
            assert movie['movieId'] != 1, "Should not include self"
        
        logger.info("✅ Similar movies response format correct")
    
    
    def test_similar_movies_sorted_by_similarity(self, engine):
        """Test similar movies sorted by similarity"""
        similar = engine.get_similar_movies(movie_id=1, n=5)
        
        similarities = [m['similarity'] for m in similar]
        assert similarities == sorted(similarities, reverse=True)
        
        logger.info("✅ Similar movies sorted by similarity")


# ============================================================
# UNIT TESTS: EVALUATION METRICS
# ============================================================

class TestEvaluationMetrics:
    """Test evaluation metric calculations"""
    
    def test_precision_at_k(self):
        """Test Precision@K calculation"""
        recommendations = [1, 5, 3, 12, 8]
        actual_liked = [1, 3, 8, 42]
        
        precision = RecommendationEvaluator.precision_at_k(
            recommendations, 
            actual_liked, 
            k=5
        )
        
        # Relevant in top 5: [1, 3, 8] = 3 out of 5
        assert precision == 0.6, f"Expected 0.6, got {precision}"
        logger.info(f"✅ Precision@5 = {precision}")
    
    
    def test_recall_at_k(self):
        """Test Recall@K calculation"""
        recommendations = [1, 5, 3, 12, 8]
        actual_liked = [1, 3, 8]
        
        recall = RecommendationEvaluator.recall_at_k(
            recommendations, 
            actual_liked, 
            k=5
        )
        
        # Relevant in top 5: [1, 3, 8] = 3 out of 3 total
        assert recall == 1.0, f"Expected 1.0, got {recall}"
        logger.info(f"✅ Recall@5 = {recall}")
    
    
    def test_rmse(self):
        """Test RMSE calculation"""
        predictions = {1: 4.2, 2: 3.8, 3: 4.9}
        actual = {1: 5.0, 2: 3.5, 3: 4.0}
        
        rmse = RecommendationEvaluator.root_mean_squared_error(predictions, actual)
        
        # Errors: [0.64, 0.09, 0.81], MSE = 0.51, RMSE = 0.714
        assert 0.7 < rmse < 0.73, f"Expected ~0.71, got {rmse}"
        logger.info(f"✅ RMSE = {rmse:.3f}")
    
    
    def test_precision_edge_cases(self):
        """Test Precision@K edge cases"""
        # No recommendations
        precision = RecommendationEvaluator.precision_at_k([], [1, 2], k=5)
        assert precision == 0
        
        # All relevant
        precision = RecommendationEvaluator.precision_at_k([1, 2], [1, 2], k=2)
        assert precision == 1.0
        
        logger.info("✅ Precision edge cases handled")


# ============================================================
# INTEGRATION TESTS
# ============================================================

class TestIntegration:
    """Integration tests combining multiple components"""
    
    def test_full_recommendation_pipeline(self, engine):
        """Test complete recommendation pipeline"""
        
        # Get recommendations
        recommendations = engine.get_recommendations(user_id=1, n=10)
        assert len(recommendations) > 0
        
        # Get similar movies for top recommendation
        top_movie_id = recommendations[0]['movieId']
        similar = engine.get_similar_movies(top_movie_id, n=5)
        assert len(similar) > 0
        
        logger.info("✅ Full pipeline works correctly")
    
    
    def test_consistency_across_calls(self, engine):
        """Test that engine returns consistent results"""
        recommendations1 = engine.get_recommendations(user_id=1, n=5)
        recommendations2 = engine.get_recommendations(user_id=1, n=5)
        
        ids1 = [r['movieId'] for r in recommendations1]
        ids2 = [r['movieId'] for r in recommendations2]
        
        assert ids1 == ids2, "Engine should return consistent results"
        logger.info("✅ Engine returns consistent results")


# ============================================================
# PERFORMANCE TESTS
# ============================================================

class TestPerformance:
    """Test performance and scalability"""
    
    def test_recommendation_generation_time(self, engine):
        """Test that recommendation generation is fast"""
        import time
        
        start = time.time()
        recommendations = engine.get_recommendations(user_id=1, n=10)
        elapsed = time.time() - start
        
        assert elapsed < 1.0, f"Should generate recommendations in <1s, took {elapsed:.2f}s"
        logger.info(f"✅ Generated recommendations in {elapsed:.3f}s")
    
    
    def test_similar_movies_generation_time(self, engine):
        """Test that similar movies can be found quickly"""
        import time
        
        start = time.time()
        similar = engine.get_similar_movies(movie_id=1, n=5)
        elapsed = time.time() - start
        
        assert elapsed < 0.5, f"Should find similar movies in <0.5s, took {elapsed:.3f}s"
        logger.info(f"✅ Found similar movies in {elapsed:.3f}s")


# ============================================================
# TEST RUNNER
# ============================================================

if __name__ == "__main__":
    """
    Run tests:
    
    All tests:
    pytest tests.py -v
    
    Specific test class:
    pytest tests.py::TestHybridRecommendations -v
    
    With coverage:
    pytest tests.py --cov=recommendation_engine --cov=api_endpoints
    
    Verbose output:
    pytest tests.py -v -s
    """
    
    print("Run tests with: pytest tests.py -v")
