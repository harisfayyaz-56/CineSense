# Recommendation System Testing Guide

## Quick Test Plan

### Phase 1: Set Up Test Profile (5 min)
Rate 10-15 movies with clear preferences:

**Rate High (4-5 stars):**
- Inception (Sci-Fi)
- The Matrix (Sci-Fi/Action)
- Interstellar (Sci-Fi/Drama)
- Avatar (Sci-Fi/Adventure)
- Blade Runner 2049 (Sci-Fi)

**Rate Low (1-2 stars):**
- A romantic comedy
- A musical
- A horror movie
- A very slow drama

### Phase 2: Get Recommendations
1. Open Dashboard
2. Look at "Recommended For You" section
3. Check if recommendations match your ratings pattern

### Phase 3: Validate Results

#### ✅ Correct Recommendations Show:
- Sci-Fi movies ranked highest (since you liked them)
- Similar movies to Inception: Interstellar, The Matrix, Tenet
- NOT showing comedies/musicals (you rated low)
- Explanation: "Users with your taste loved this"

#### ❌ Incorrect Recommendations Would Show:
- Comedy movies in top recommendations
- Unrelated genres mixed together
- Same movies you already rated
- No explanation for suggestions

### Phase 4: Test Edge Cases

**Test A: What if I rate nothing yet?**
- Should show: Popular movies (highest avgRating)
- System can't calculate collaborative filtering without data

**Test B: What if I change my mind and re-rate?**
- Should update recommendations within 1 session
- Re-rate Inception from 5★ → 2★
- Similar movies should rank lower now

**Test C: New movie with no ratings?**
- Might not appear if system only uses user-based filtering
- Item-item might still find it based on similar movies
- SVD can use hidden factors to predict

### Phase 5: Performance Metrics

Check recommendation quality:
- **Precision@10:** Of top 10 recommendations, how many are "good"?
- **Recall:** Of all good movies, how many are recommended?
- **NDCG:** Are best recommendations ranked first?

For manual testing, just ask:
**"Would I want to watch these movies?"**

---

## API Testing

### Get Recommendations
```bash
curl -X GET "http://localhost:8000/api/recommendations/user/1?n=10"
```

Response format:
```json
{
  "userId": 1,
  "recommendations": [
    {
      "movieId": 122,
      "title": "The Lord of the Rings",
      "avgRating": 4.27,
      "score": 0.92,
      "reason": "Users with your taste loved this"
    },
    ...
  ],
  "algorithm": "hybrid",
  "timestamp": "2026-05-03T12:00:00"
}
```

### Get Similar Movies
```bash
curl -X GET "http://localhost:8000/api/recommendations/similar/1"
```

Response format:
```json
[
  {
    "movieId": 451,
    "title": "Inception",
    "similarity": 0.87,
    "avgRating": 4.16
  },
  ...
]
```

---

## Success Criteria

You'll know the system is working correctly if:

1. ✅ Recommendations match your rating patterns
2. ✅ Similar-rated movies get similar recommendations
3. ✅ Re-rating updates recommendations
4. ✅ Explanations are provided
5. ✅ API returns correct JSON structure
6. ✅ Response time < 2 seconds
7. ✅ No recommendations you've already rated
