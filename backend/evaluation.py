"""
Evaluation & Testing Framework
===============================

Evaluates recommendation engine quality using industry-standard metrics.

Metrics Evaluated:
------------------
1. Precision@10: Of top 10 recommendations, what fraction did user like?
2. Recall@10: Of all movies user liked, what fraction is in top 10?
3. NDCG: Ranking quality (best items ranked highest?)
4. RMSE: Prediction accuracy (how close are predicted ratings?)

Standard Benchmarks:
- Precision@10 ≥ 0.70 (70%): ✅ Good
- Recall@10 ≥ 0.50 (50%): ✅ Good
- NDCG@10 ≥ 0.60: ✅ Good
- RMSE ≤ 0.75: ✅ Good

Author: Sprint 2 Implementation
"""

import pandas as pd
import numpy as np
from typing import List, Dict, Tuple
import logging
from recommendation_engine import RecommendationEngine, RecommendationEvaluator

logger = logging.getLogger(__name__)


class EvaluationFramework:
    """
    Framework to evaluate recommendation engine performance
    
    Workflow:
    ---------
    1. Load all user ratings
    2. Split into train (80%) and test (20%)
    3. Train engine on 80% of data
    4. Generate recommendations for test users
    5. Compare to held-out 20%
    6. Calculate metrics
    7. Report results
    """
    
    def __init__(self, ratings_df: pd.DataFrame, movies_df: pd.DataFrame, 
                 test_size: float = 0.2, random_state: int = 42):
        """
        Initialize evaluation framework
        
        Parameters:
        -----------
        ratings_df : pd.DataFrame
            All user ratings with columns: userId, movieId, rating
        
        movies_df : pd.DataFrame
            Movie metadata with columns: movieId, title, genres, avgRating
        
        test_size : float
            Fraction of data to use for testing (default: 0.2 = 20%)
        
        random_state : int
            Random seed for reproducibility
        """
        logger.info("🧪 Initializing Evaluation Framework...")
        
        self.ratings_df = ratings_df.copy()
        self.movies_df = movies_df.copy()
        self.test_size = test_size
        self.random_state = random_state
        
        # Split data
        logger.info(f"📊 Splitting data: {(1-test_size)*100:.0f}% train, {test_size*100:.0f}% test")
        self.train_df, self.test_df = self._train_test_split()
        
        logger.info(f"   ✓ Train set: {len(self.train_df):,} ratings")
        logger.info(f"   ✓ Test set: {len(self.test_df):,} ratings")
        
        # Initialize engine on training data
        logger.info("🚀 Training engine on training data...")
        self.engine = RecommendationEngine(self.train_df, self.movies_df, n_factors=10)
        
        logger.info("✅ Evaluation Framework ready!\n")
    
    
    def _train_test_split(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Split ratings into train and test sets
        
        Strategy:
        ---------
        For each user, randomly select (1 - test_size) of their ratings for training
        and the rest for testing.
        
        Why this approach?
        - Ensures each user has ratings in both train and test
        - More realistic (user rates movies, we predict future ratings)
        - Better for cross-validation
        
        Example:
        User 1 rated 50 movies:
        - Train: 40 ratings (80%)
        - Test: 10 ratings (20%) ← We predict these
        
        Steps:
        1. Group by user
        2. For each user, sample test_size fraction of their ratings
        3. Rest go to training set
        """
        np.random.seed(self.random_state)
        
        test_indices = []
        for user_id in self.ratings_df['userId'].unique():
            user_indices = self.ratings_df[self.ratings_df['userId'] == user_id].index
            n_test = max(1, int(len(user_indices) * self.test_size))
            
            test_idx = np.random.choice(user_indices, size=n_test, replace=False)
            test_indices.extend(test_idx)
        
        test_df = self.ratings_df.loc[test_indices]
        train_df = self.ratings_df.drop(test_indices)
        
        return train_df, test_df
    
    
    def evaluate(self, n_recommendations: int = 10, n_users: int = 50) -> Dict:
        """
        EVALUATE RECOMMENDATION ENGINE
        ==============================
        
        Workflow:
        ---------
        1. Select subset of test users (n_users)
        2. For each user:
            a. Generate top N recommendations using trained engine
            b. Get actual liked movies from test set (>= 4 stars)
            c. Calculate Precision@N, Recall@N, NDCG@N, RMSE
        3. Average metrics across all test users
        4. Print report with visual indicators
        
        Parameters:
        -----------
        n_recommendations : int
            Number of recommendations to generate per user (default: 10)
        
        n_users : int
            Number of test users to evaluate (default: 50)
            - Full evaluation takes time, sample for quick feedback
            - Use n_users=-1 to evaluate all test users
        
        Returns:
        --------
        Dict with aggregated metrics:
        {
            'precision': 0.78,
            'recall': 0.62,
            'ndcg': 0.71,
            'rmse': 0.68,
            'users_evaluated': 50,
            'results_by_user': [...]
        }
        
        Interpretation:
        ----------------
        Precision = 0.78 → 78% of recommendations were relevant
        Recall = 0.62 → 62% of all relevant movies were in recommendations
        NDCG = 0.71 → Ranking is pretty good (items ranked fairly well)
        RMSE = 0.68 → Rating predictions off by ~0.7 stars on average
        """
        
        logger.info(f"\n🧪 Evaluating engine on {n_users} test users...")
        logger.info(f"   Generating {n_recommendations} recommendations per user\n")
        
        # Get test users
        test_users = self.test_df['userId'].unique()
        if n_users > 0:
            test_users = np.random.choice(test_users, size=min(n_users, len(test_users)), replace=False)
        
        logger.info(f"📋 Selected {len(test_users)} users for evaluation\n")
        
        # Evaluate each user
        results = []
        
        for i, user_id in enumerate(test_users):
            if (i + 1) % max(1, len(test_users) // 5) == 0:
                logger.info(f"   Progress: {i+1}/{len(test_users)} users evaluated")
            
            try:
                # Get recommendations
                recommendations = self.engine.get_recommendations(
                    user_id, 
                    n=n_recommendations
                )
                
                # Extract movie IDs
                recommended_movies = [r['movieId'] for r in recommendations]
                
                # Get actual movies user liked in test set (>= 4 stars)
                user_test_ratings = self.test_df[self.test_df['userId'] == user_id]
                actual_liked = user_test_ratings[user_test_ratings['rating'] >= 4.0]['movieId'].tolist()
                
                if not actual_liked:
                    continue
                
                # Calculate metrics
                precision = RecommendationEvaluator.precision_at_k(
                    recommended_movies, 
                    actual_liked, 
                    k=n_recommendations
                )
                
                recall = RecommendationEvaluator.recall_at_k(
                    recommended_movies, 
                    actual_liked, 
                    k=n_recommendations
                )
                
                ndcg = self._calculate_ndcg(recommended_movies, actual_liked, k=n_recommendations)
                
                # Calculate RMSE for predicted vs actual
                predictions = {r['movieId']: r['score'] * 5 for r in recommendations}  # Convert to 1-5 scale
                actual_dict = dict(zip(user_test_ratings['movieId'], user_test_ratings['rating']))
                rmse = RecommendationEvaluator.root_mean_squared_error(predictions, actual_dict)
                
                results.append({
                    'userId': user_id,
                    'precision': precision,
                    'recall': recall,
                    'ndcg': ndcg,
                    'rmse': rmse,
                    'recommendations': len(recommended_movies),
                    'relevant': len(actual_liked)
                })
                
            except Exception as e:
                logger.warning(f"⚠️ Error evaluating user {user_id}: {str(e)}")
                continue
        
        # Aggregate results
        if not results:
            logger.error("❌ No users successfully evaluated!")
            return {}
        
        results_df = pd.DataFrame(results)
        
        aggregated = {
            'precision': results_df['precision'].mean(),
            'recall': results_df['recall'].mean(),
            'ndcg': results_df['ndcg'].mean(),
            'rmse': results_df['rmse'].mean(),
            'users_evaluated': len(results),
            'results_by_user': results
        }
        
        # Print evaluation report
        self._print_report(aggregated)
        
        return aggregated
    
    
    def _calculate_ndcg(self, recommendations: List[int], actual_liked: List[int], k: int = 10) -> float:
        """
        Calculate NDCG (Normalized Discounted Cumulative Gain)
        =======================================================
        
        What: How well-ranked are the recommendations?
        
        Concept:
        "It's better to recommend relevant items at the TOP of the list
         than at the BOTTOM."
        
        Formula:
        --------
        DCG = Σ (relevance_i / log2(i + 1))
        
        Where:
        - relevance_i = 1 if movie i is in actual_liked, 0 otherwise
        - i = position (1-based)
        - log2(i + 1) = discount factor (penalizes lower positions)
        
        Example:
        --------
        Actual liked: [101, 205, 350]
        Recommendations (top 5): [205, 420, 350, 101, 999]
        
        Position 1: Movie 205 (relevant) → 1 / log2(2) = 1.0
        Position 2: Movie 420 (not relevant) → 0 / log2(3) = 0
        Position 3: Movie 350 (relevant) → 1 / log2(4) = 0.5
        Position 4: Movie 101 (relevant) → 1 / log2(5) = 0.43
        Position 5: Movie 999 (not relevant) → 0 / log2(6) = 0
        
        DCG = 1.0 + 0 + 0.5 + 0.43 + 0 = 1.93
        
        IDCG (Ideal DCG) = if we ranked perfectly:
        [101, 205, 350, ...] (all relevant first)
        = 1.0 + 0.63 + 0.5 = 2.13
        
        NDCG = DCG / IDCG = 1.93 / 2.13 = 0.91
        
        Interpretation:
        - NDCG 0.9-1.0 = Excellent ranking
        - NDCG 0.7-0.9 = Good ranking
        - NDCG 0.5-0.7 = Fair ranking
        - NDCG 0.0-0.5 = Poor ranking
        
        Why it matters:
        Users only click on top results, so ranking matters MORE than just
        having relevant items anywhere in the list.
        """
        
        # Calculate DCG
        dcg = 0
        for i, rec_id in enumerate(recommendations[:k]):
            if rec_id in actual_liked:
                dcg += 1 / np.log2(i + 2)  # i+2 because positions are 1-based
        
        # Calculate IDCG (perfect ranking)
        idcg = 0
        for i in range(min(k, len(actual_liked))):
            idcg += 1 / np.log2(i + 2)
        
        # NDCG = DCG / IDCG
        ndcg = dcg / idcg if idcg > 0 else 0
        return ndcg
    
    
    def _print_report(self, aggregated: Dict):
        """
        Print comprehensive evaluation report with visual indicators
        
        Output format:
        ===============================================
        📊 RECOMMENDATION ENGINE EVALUATION REPORT
        ===============================================
        
        ✅ Precision@10:     0.78 / 1.00  [████████░░]
        ✅ Recall@10:        0.62 / 1.00  [██████░░░░]
        ✅ NDCG@10:          0.71 / 1.00  [███████░░░]
        ✅ RMSE:             0.68 / 5.00  [█░░░░░░░░░]
        
        📈 Summary:
        - Users Evaluated: 50
        - Average Metrics: All ✅ Above Target
        - Recommendation: ✅ APPROVED FOR PRODUCTION
        
        Next Steps:
        1. Deploy to production ✅
        2. Monitor performance metrics
        3. Collect user feedback for refinement
        """
        
        print("\n" + "="*50)
        print("📊 RECOMMENDATION ENGINE EVALUATION REPORT")
        print("="*50 + "\n")
        
        # Determine status (check if above benchmarks)
        precision_ok = aggregated['precision'] >= 0.70
        recall_ok = aggregated['recall'] >= 0.50
        ndcg_ok = aggregated['ndcg'] >= 0.60
        rmse_ok = aggregated['rmse'] <= 0.75
        
        # Print metrics with visual bars
        metrics = [
            ("Precision@10", aggregated['precision'], 1.0, precision_ok),
            ("Recall@10", aggregated['recall'], 1.0, recall_ok),
            ("NDCG@10", aggregated['ndcg'], 1.0, ndcg_ok),
            ("RMSE", aggregated['rmse'], 5.0, rmse_ok)
        ]
        
        for metric_name, value, max_val, ok in metrics:
            status = "✅" if ok else "⚠️"
            bar = self._create_bar(value / max_val)
            print(f"{status} {metric_name:15s}: {value:5.2f} / {max_val:5.2f}  {bar}")
        
        print("\n" + "-"*50)
        print(f"📈 Summary:")
        print(f"   Users Evaluated: {aggregated['users_evaluated']}")
        
        all_ok = all([precision_ok, recall_ok, ndcg_ok, rmse_ok])
        recommendation = "✅ APPROVED FOR PRODUCTION" if all_ok else "⚠️ NEEDS IMPROVEMENT"
        print(f"   Status: {recommendation}")
        
        print("\n💡 Next Steps:")
        print("   1. Deploy to production")
        print("   2. Monitor performance metrics")
        print("   3. Collect user feedback for refinement")
        print("="*50 + "\n")
    
    
    @staticmethod
    def _create_bar(ratio: float, width: int = 10) -> str:
        """Create visual progress bar"""
        filled = int(width * ratio)
        return "█" * filled + "░" * (width - filled)
    
    
    def compare_algorithms(self, n_users: int = 30) -> Dict:
        """
        COMPARE ALL THREE ALGORITHMS
        =============================
        
        Compare performance of:
        1. User-User Similarity
        2. Item-Item Similarity
        3. SVD Matrix Factorization
        4. Hybrid (weighted combination)
        
        Output:
        -------
        Precision, Recall, NDCG, RMSE for each algorithm
        
        Use Case:
        ---------
        Determine which algorithm performs best
        Fine-tune weights for hybrid approach
        """
        logger.info("\n🔬 Comparing all algorithms...\n")
        
        algorithms = {
            'user_user': {'weight': 1.0, 'results': []},
            'item_item': {'weight': 1.0, 'results': []},
            'svd': {'weight': 1.0, 'results': []},
            'hybrid': {'weights': {'user_user': 0.3, 'item_item': 0.3, 'svd': 0.4}, 'results': []}
        }
        
        # TODO: Implement algorithm comparison
        # This is a framework for Phase 2B
        
        return algorithms


if __name__ == "__main__":
    print("Evaluation Framework Module")
    print("Import this module to evaluate recommendation engine performance")
