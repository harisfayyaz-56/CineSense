# 🎬 MovieLens Recommendation System - Backend

## Overview

This backend implements a complete machine learning pipeline for personalized movie recommendations using the MovieLens dataset.

**Dataset**: MovieLens 100K (600 users, 9,000 movies, 100,000 ratings)  
**Technology**: Python, Pandas, Scikit-learn, Firebase  
**Architecture**: Data Pipeline → Preprocessing → Firestore → Recommendation Engine

---

## 📁 Project Structure

```
backend/
├── 📄 main.py                      # Existing feedback HTTP handler
├── 📄 requirements.txt              # Python dependencies (UPDATED)
│
├── 🔄 DATA PIPELINE SCRIPTS
├── 📄 data_pipeline.py             # Download & preprocess MovieLens data
├── 📄 firestore_loader.py          # Load data into Firestore
├── 📄 validate_setup.py            # Pre-flight validation checks
│
├── 📚 DOCUMENTATION  
├── 📄 FIRESTORE_SCHEMA.md          # Database schema & design
├── 📄 SPRINT1_GUIDE.md             # Detailed Sprint 1 walkthrough
└── 📄 README.md                    # This file

└── 📂 data/ (auto-created)
    ├── raw/                        # Downloaded MovieLens files
    │   └── ml-latest-small/
    │       ├── ratings.csv
    │       ├── movies.csv
    │       ├── tags.csv
    │       └── links.csv
    └── processed/                  # Cleaned & processed data
        ├── movies_processed.csv
        ├── ratings_processed.csv
        └── metadata.json
```

---

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Validate Setup

```bash
python validate_setup.py
```

This checks:
- ✅ Python version >= 3.8
- ✅ All packages installed
- ✅ Firebase credentials (`serviceAccountKey.json`)
- ✅ Directory structure

### Step 3: Download & Preprocess Data

```bash
python data_pipeline.py
```

This:
1. Downloads MovieLens dataset (1 MB)
2. Extracts 4 CSV files
3. Cleans & preprocesses data
4. Exports to `data/processed/`

**Time**: ~2-3 minutes  
**Output**: 9,000 movies + 100,000 ratings + metadata

### Step 4: Load to Firestore

```bash
python firestore_loader.py
```

This:
1. Reads processed CSV files
2. Writes 9,000 movies to `movies/` collection
3. Creates 600 sample users with ratings
4. Saves dataset metadata

**Time**: ~3-5 minutes  
**Result**: Complete Firestore database ready for recommendations

---

## 📊 Key Scripts Explained

### `data_pipeline.py`

**Purpose**: Download and prepare MovieLens dataset

**Main Class**: `MovieLensDataPipeline`

**Key Methods**:

| Method | Purpose | Input | Output |
|--------|---------|-------|--------|
| `download_dataset()` | Downloads from GroupLens | URL | ZIP file |
| `extract_dataset()` | Unzips files | ZIP | CSV files |
| `preprocess_movies()` | Cleans movie data | movies.csv + links.csv | Clean DataFrame |
| `preprocess_ratings()` | Validates ratings | ratings.csv | Validated ratings + statistics |
| `preprocess_tags()` | Aggregates tags | tags.csv | Tags per movie |
| `combine_movie_data()` | Merges all data | All DataFrames | Final movies CSV |

**Example Usage**:

```python
from data_pipeline import MovieLensDataPipeline

# Initialize with small dataset (100K ratings)
pipeline = MovieLensDataPipeline(use_small_dataset=True)

# Run full pipeline
result = pipeline.run()

print(f"Total movies: {result['statistics']['total_movies']}")
print(f"Total ratings: {result['statistics']['total_ratings']}")
```

---

### `firestore_loader.py`

**Purpose**: Load processed data into Firestore

**Main Class**: `FirestoreLoader`

**Key Methods**:

| Method | Purpose | Input |
|--------|---------|-------|
| `batch_write()` | Batch write documents (max 500/batch) | Collection name, documents, doc ID field |
| `load_movies()` | Load all movies | CSV path |
| `load_sample_ratings()` | Load sample user ratings | CSV path, sample size |
| `load_dataset_metadata()` | Save dataset info | JSON path |
| `run_full_load()` | Execute everything | - |

**Example Usage**:

```python
from firestore_loader import FirestoreLoader

# Initialize (automatically connects to Firebase)
loader = FirestoreLoader()

# Load all data
loader.run_full_load(load_ratings_sample=True)
```

**Firestore Structure Created**:

```
movies/                          (9,000 documents)
├── 1: { title: "Toy Story", genres: [...], avgRating: 4.2, ... }
├── 2: { title: "Jumanji", genres: [...], avgRating: 3.8, ... }
└── ...

users/                          (600 documents)
├── 1: { uid: "1", email: "user1@...", totalRatings: 50, ... }
│   └── ratings/               (subcollection)
│       ├── 1: { rating: 5.0, timestamp: ..., ... }
│       ├── 2: { rating: 4.0, timestamp: ..., ... }
│       └── ...
└── ...

movielens_meta/                 (1 document)
└── dataset_info: { total_movies: 9000, total_ratings: 100000, ... }
```

---

### `validate_setup.py`

**Purpose**: Pre-flight checks before running main scripts

**Checks**:
1. Python version >= 3.8
2. All packages installed
3. Firebase credentials valid
4. Directories exist/creatable

**Usage**:

```bash
python validate_setup.py
```

**Output Example**:

```
=========================================================
🔍 SETUP VALIDATION
=========================================================

📌 Checking Python version...
   ✅ Python 3.10.8 (required >= 3.8)

📌 Checking installed packages...
   ✅ pandas
   ✅ numpy
   ✅ scikit-learn
   ...

📌 Checking Firebase credentials...
   ✅ Found: C:\path\to\backend\serviceAccountKey.json
   ✅ Valid Firebase service account key

📌 Checking directory structure...
   ✅ data/
   ✅ data/raw/
   ✅ data/processed/

=========================================================
📊 VALIDATION SUMMARY
=========================================================
✅ PASS: Python Version
✅ PASS: Package Installation
✅ PASS: Firebase Credentials
✅ PASS: Directory Structure
=========================================================
✅ ALL CHECKS PASSED!

🚀 You're ready to run:
   1. python data_pipeline.py
   2. python firestore_loader.py
```

---

## 🔑 Data Processing Explained

### Data Cleaning Pipeline

```
Raw MovieLens CSV
       ↓
┌──────────────────────────┐
│ Extract & Parse          │
│ • Title: "Avatar (2009)" │  → Extract year = 2009
│ • Genres: "A|B|C"        │  → Split to ["A", "B", "C"]
└──────────────────────────┘
       ↓
┌──────────────────────────┐
│ Validate Data            │
│ • Ratings: 0.5-5.0 ✓     │
│ • MovieID exists ✓       │
│ • Timestamp valid ✓      │
└──────────────────────────┘
       ↓
┌──────────────────────────┐
│ Calculate Statistics     │
│ • Avg rating per movie   │
│ • Rating count           │
│ • Popularity score       │
│ • Top tags per movie     │
└──────────────────────────┘
       ↓
Clean, Ready-to-Use Data
```

### Movies Data Transformation

**Before**:
```csv
movieId,title,genres
1,"Toy Story (1995)","Adventure|Animation|Children|Comedy|Fantasy"
2,"Jumanji (1995)","Adventure|Children|Fantasy"
```

**After** (JSON in Firestore):
```json
{
  "movieId": 1,
  "title": "Toy Story",
  "year": 1995,
  "genres": ["Adventure", "Animation", "Children", "Comedy", "Fantasy"],
  "avgRating": 4.19,
  "ratingCount": 215,
  "popularity": 98.5,
  "tags": ["Pixar", "Animation", "Funny", "Family"],
  "imdbId": "0114709",
  "tmdbId": 862
}
```

### Ratings Data Transformation

**Before**:
```csv
userId,movieId,rating,timestamp
1,1,4.0,1000000000
1,2,3.5,1000000002
```

**After** (Firestore subcollection):
```
users/1/ratings/1 {
  movieId: 1,
  rating: 4.0,
  timestamp: Timestamp(2001-09-09),
  implicit: false
}
```

---

## 📈 Dataset Statistics

### MovieLens 100K Dataset

| Metric | Value |
|--------|-------|
| **Movies** | 9,000 |
| **Ratings** | 100,000 |
| **Users** | 600 |
| **Time Span** | 1995-2018 |
| **Avg Rating** | 3.5/5.0 |
| **Sparsity** | 99.98% (most user-movie pairs unrated) |

### Firestore Storage

| Collection | Documents | Est. Size |
|------------|-----------|-----------|
| `movies/` | 9,000 | ~2-3 MB |
| `users/` | 600 | ~200 KB |
| `users/{userId}/ratings/` | 100,000 | ~5-8 MB |
| `movielens_meta/` | 1 | ~1 KB |
| **Total** | **~110K** | **~8-12 MB** |

*All within Firestore free tier!*

---

## 🔗 Database Schema

See [FIRESTORE_SCHEMA.md](FIRESTORE_SCHEMA.md) for complete schema documentation including:

- ✓ All 8 collections and their fields
- ✓ Data types and validation rules
- ✓ Indexes for optimization
- ✓ Security considerations

---

## 🐛 Troubleshooting

### Issue: "No module named 'firebase_admin'"

```bash
# Solution: Install dependencies
pip install -r requirements.txt
```

### Issue: "Service account key not found"

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Project Settings → Service Accounts
4. Generate New Private Key
5. Save as `serviceAccountKey.json` in backend folder

### Issue: "Connection timeout downloading MovieLens"

- Check internet connection
- MovieLens servers might be temporarily down
- Try again later or manually download from: https://grouplens.org/datasets/movielens/

### Issue: "Firestore write quota exceeded"

- Small dataset (100K) is within free tier
- For full 33M dataset, enable Blaze plan in Firebase

---

## 🚀 Next Steps (Sprint 2)

After Sprint 1 is complete, proceed to Sprint 2:

### Sprint 2: Collaborative Filtering Engine

Build the recommendation algorithms:

1. **User-User Similarity**
   - Calculate cosine similarity between users
   - Find "similar users"
   - Recommend movies liked by similar users

2. **Item-Item Similarity**
   - Calculate cosine similarity between movies
   - Based on user rating patterns
   - Recommend similar movies

3. **Matrix Factorization (SVD)**
   - Decompose user-movie matrix
   - Discover latent factors (genres, themes, etc.)
   - Advanced recommendations

**Scripts to create**:
- `recommendation_engine.py` - CF algorithms
- `api_endpoints.py` - REST API for recommendations
- `evaluation.py` - Test recommendation quality

---

## 📚 References

- **MovieLens**: https://grouplens.org/datasets/movielens/
- **Scikit-learn**: https://scikit-learn.org/
- **Firebase Docs**: https://firebase.google.com/docs/firestore
- **Recommendation Systems**: https://developers.google.com/machine-learning/recommendation

---

## 📝 Implementation Notes

### Design Decisions

1. **Small Dataset for Development**
   - Using `ml-latest-small` (100K) instead of full (33M)
   - Reason: Faster processing, fits free Firestore tier, good for testing

2. **Firestore for Data Storage**
   - Real-time database for user interactions
   - Scales well with Firebase auth
   - Easy frontend integration

3. **Batch Processing**
   - Firestore batch write limit: 500 ops
   - Auto-batching in loader script
   - Reliable and efficient

4. **Sample User Ratings**
   - Not loading all 100K ratings to each user
   - Only sample ratings for demo
   - Real system: ratings added as users rate movies

### Future Enhancements

- [ ] Real-time user rating updates
- [ ] Caching with Redis for performance
- [ ] A/B testing framework
- [ ] Recommendation explainability
- [ ] Cold-start user handling
- [ ] Temporal dynamics (recency bias)

---

## ✅ Checklist

- [ ] Python 3.8+ installed
- [ ] Run `validate_setup.py` and see all ✅
- [ ] Run `data_pipeline.py` and verify output
- [ ] Run `firestore_loader.py` and check Firebase Console
- [ ] Ready for Sprint 2!

---

**Created**: 2026-04-19  
**Status**: Sprint 1 Complete  
**Next**: Sprint 2 - Collaborative Filtering Engine
