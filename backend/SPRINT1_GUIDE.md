# Sprint 1 Implementation Guide

## Overview
Sprint 1 sets up the complete data pipeline for the MovieLens recommendation system. Three main scripts work together:

```
┌─────────────────────────────────────────────────────────┐
│  MovieLens Dataset (CSV files from GroupLens)           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
         ┌───────────────────────┐
         │  data_pipeline.py     │  ✓ Downloads & preprocesses
         │  • Download dataset   │  ✓ Cleans data
         │  • Extract ZIP        │  ✓ Calculates statistics
         │  • Preprocess         │  ✓ Exports to CSV
         └───────┬───────────────┘
                 │
                 ↓
     ┌───────────────────────────┐
     │ Processed CSV files       │
     │ • movies_processed.csv    │
     │ • ratings_processed.csv   │
     │ • metadata.json           │
     └───────┬───────────────────┘
             │
             ↓
     ┌──────────────────────────┐
     │  firestore_loader.py     │  ✓ Batch writes (500 ops/batch)
     │  • Load movies           │  ✓ Creates user profiles
     │  • Load sample ratings   │  ✓ Uploads to Firestore
     │  • Load metadata         │
     └──────┬───────────────────┘
            │
            ↓
    ┌───────────────────────────┐
    │  Firestore Database       │
    │  ✓ movies/                │
    │  ✓ users/                 │
    │  ✓ movielens_meta/        │
    └───────────────────────────┘
```

---

## File Structure

```
backend/
├── main.py                      (Existing feedback handler)
├── data_pipeline.py             (NEW) Download & process data
├── firestore_loader.py          (NEW) Load data to Firestore
├── FIRESTORE_SCHEMA.md          (NEW) Database design
├── SPRINT1_GUIDE.md             (THIS FILE)
├── requirements.txt             (UPDATED) Added ML packages
├── serviceAccountKey.json       (EXISTING) Firebase credentials
└── data/
    ├── raw/                     (AUTO-CREATED) Downloaded files
    │   └── ml-latest-small/     (Extracted CSV files)
    │       ├── ratings.csv
    │       ├── movies.csv
    │       ├── tags.csv
    │       └── links.csv
    └── processed/               (AUTO-CREATED) Cleaned data
        ├── movies_processed.csv
        ├── ratings_processed.csv
        └── metadata.json
```

---

## Installation & Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

**What gets installed**:
- `pandas` & `numpy` - Data processing
- `scikit-learn` - ML algorithms
- `firebase-admin` - Firestore connection
- `requests` - Download files
- `flask` & `flask-cors` - REST API

### 2. Ensure Firebase Credentials

Make sure `serviceAccountKey.json` exists in the backend folder. If not:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save as `serviceAccountKey.json` in backend folder

---

## Step-by-Step Execution

### Phase 1A: Download & Preprocess Data (5-10 minutes)

**Script**: `data_pipeline.py`

```bash
python data_pipeline.py
```

**What happens**:
1. ✓ Downloads `ml-latest-small.zip` (1 MB) from GroupLens
2. ✓ Extracts to `data/raw/ml-latest-small/`
3. ✓ Loads 4 CSV files into memory
4. ✓ **Cleans movies**: Extracts year, splits genres
5. ✓ **Cleans ratings**: Validates ranges, converts timestamps
6. ✓ **Aggregates tags**: Groups tags per movie
7. ✓ **Calculates statistics**: avgRating, popularity, etc.
8. ✓ Exports to `data/processed/`

**Output**:
```
data/processed/
├── movies_processed.csv        9,000 movies with genres, ratings, tags
├── ratings_processed.csv       100,000 ratings with metadata
└── metadata.json               Dataset statistics
```

**Key Statistics** (with ml-latest-small):
- 9,000 movies
- 100,000 ratings
- 600 users
- Time span: 1995-2018
- Average rating: 3.5/5

---

### Phase 1B: Load to Firestore (5-10 minutes)

**Script**: `firestore_loader.py`

```bash
python firestore_loader.py
```

**What happens**:
1. ✓ Connects to Firebase using `serviceAccountKey.json`
2. ✓ Reads `movies_processed.csv`
3. ✓ **Writes to `movies/` collection** (9,000 documents)
4. ✓ Reads `ratings_processed.csv`
5. ✓ **Creates 600 sample user profiles** in `users/` collection
6. ✓ **Loads ratings as subcollections**: `users/{userId}/ratings/`
7. ✓ **Saves metadata** to `movielens_meta/dataset_info`

**Firestore Structure Created**:
```
movies/
├── 1          { title: "Toy Story", genres: [...], avgRating: 4.2, ... }
├── 2          { title: "Jumanji", genres: [...], avgRating: 3.8, ... }
└── ...
users/
├── 1          { uid: "1", email: "user1@movielens.demo", totalRatings: 50, ... }
│   └── ratings/
│       ├── 1   { movieId: 1, rating: 5.0, timestamp: ... }
│       ├── 2   { movieId: 2, rating: 4.0, timestamp: ... }
│       └── ...
├── 2
│   └── ratings/
│       └── ...
└── ...
movielens_meta/
└── dataset_info  { total_movies: 9000, total_ratings: 100000, ... }
```

---

## Understanding the Code

### Data Pipeline: Key Functions

#### 1. **`download_dataset()`**
```python
# Downloads from MovieLens and shows progress
zip_path = pipeline.download_dataset()

# Output: data/raw/ml-latest-small.zip
```

#### 2. **`preprocess_movies()`**
```python
# Cleans movie data:
# Input:  "Avatar (2009)" | "Action|Adventure"
# Output: title="Avatar", year=2009, genres=["Action", "Adventure"]

movies_processed = pipeline.preprocess_movies(movies_df, links_df)
```

**Operations**:
```python
# Extract year from title using regex
df['year'] = df['title'].str.extract(r'\((\d{4})\)', expand=False)

# Split genres from "A|B|C" to ["A", "B", "C"]
df['genres'] = df['genres'].str.split('|')

# Calculate popularity (0-100)
df['popularity'] = (df['ratingCount'] / df['ratingCount'].max()) * 100
```

#### 3. **`preprocess_ratings()`**
```python
# Validates ratings and calculates statistics
# - Removes invalid ratings (not in 0.5-5.0 range)
# - Converts Unix timestamps to datetime
# - Calculates per-movie stats (avg, count, std dev)

ratings, stats = pipeline.preprocess_ratings(ratings_df, movies_df)

# Result stats for each movie:
# avg_rating: 3.5
# rating_count: 245
# rating_std: 1.2
```

#### 4. **`preprocess_tags()`**
```python
# Groups and aggregates tags per movie
# Returns top 10 most frequent tags for each movie

tags = pipeline.preprocess_tags(tags_df)

# Result:
# movieId: 1, tags: ["Pixar", "Animation", "Funny", ...]
```

#### 5. **`combine_movie_data()`**
```python
# Merges all data into single comprehensive dataframe
# Combines: base info + stats + tags + popularity

final_movies = pipeline.combine_movie_data(
    movies_processed, 
    movie_stats, 
    tags_processed
)

# Final schema:
# movieId, title, year, genres, avgRating, ratingCount, 
# tags, popularity, imdbId, tmdbId, ...
```

---

### Firestore Loader: Key Functions

#### 1. **`batch_write()`**
```python
# Writes documents in batches (Firestore limit: 500 operations/batch)

loader.batch_write(
    collection='movies',
    documents=movie_list,
    doc_id_field='movieId'  # Use movieId as document ID
)

# Automatically splits into chunks of 500 and commits each batch
```

#### 2. **`load_movies()`**
```python
# Reads movies_processed.csv and writes to Firestore

loader.load_movies()

# Result: 9,000 documents in 'movies' collection
# Each document ID = movieId (e.g., "1", "2", "3", ...)
```

#### 3. **`load_sample_ratings()`**
```python
# Creates user profiles and their rating history

loader.load_sample_ratings(sample_size=5000)

# Results in:
# - 600 user documents in 'users/{userId}'
# - Each user has subcollection 'ratings/{movieId}'
```

**Subcollection Structure**:
```
users/
└── 1/
    └── ratings/
        ├── 1    {rating: 5.0, timestamp: ..., implicit: false}
        ├── 2    {rating: 4.0, timestamp: ..., implicit: false}
        └── 3    {rating: 3.5, timestamp: ..., implicit: false}
```

---

## Expected Output

### After running `data_pipeline.py`:

```
INFO:root:🎬 MovieLens Data Pipeline initialized
INFO:root:📥 Downloading ml-latest-small dataset...
Downloading: 100%|████████| 1.2M/1.2M
INFO:root:✅ Download complete
INFO:root:📂 Extracting dataset...
INFO:root:✅ Extraction complete
INFO:root:📖 Loading raw CSV files...
INFO:root:   ✓ ratings.csv: 100,000 records
INFO:root:   ✓ movies.csv: 9,000 records
INFO:root:   ✓ tags.csv: 3,000 records
INFO:root:   ✓ links.csv: 9,000 records
INFO:root:🧹 Preprocessing movies data...
INFO:root:   ✓ Extracted year from 8,500 movies
INFO:root:   ✓ Split genres into arrays
INFO:root:💾 Exporting processed data...
INFO:root:   ✓ Saved: data/processed/movies_processed.csv
INFO:root:   ✓ Saved: data/processed/ratings_processed.csv
============================================================
✅ FINAL STATISTICS
============================================================
Total Movies: 9,000
Total Ratings: 100,000
Unique Users: 600
============================================================
```

### After running `firestore_loader.py`:

```
INFO:root:🔐 Initializing Firebase connection...
INFO:root:✅ Firebase connection established
INFO:root:📝 Writing 9,000 documents to 'movies'...
INFO:root:   ✓ Batch 1 committed (500 documents)
INFO:root:   ✓ Batch 2 committed (500 documents)
...
INFO:root:✅ All 9,000 documents written successfully
INFO:root:📖 Loading sample ratings from data/processed/ratings_processed.csv...
INFO:root:   Total ratings available: 100,000
INFO:root:   Using sample of 5,000 ratings for testing
Processing users: 100%|████████| 600/600
INFO:root:✅ Loaded 600 sample users with 5,000 ratings
INFO:root:✅ Metadata loaded:
INFO:root:   Total Movies: 9,000
INFO:root:   Total Ratings: 100,000
INFO:root:   Unique Users: 600
============================================================
✅ FIRESTORE LOADING COMPLETED SUCCESSFULLY
============================================================
```

---

## Firestore Database Verification

After loading, verify data in Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database**
4. You should see:
   - ✅ `movies` collection with 9,000 documents
   - ✅ `users` collection with 600 documents
   - ✅ Each user has `ratings` subcollection
   - ✅ `movielens_meta` collection with dataset info

---

## Troubleshooting

### Issue: "No module named 'firebase_admin'"
**Solution**: Run `pip install -r requirements.txt`

### Issue: "Service account key not found"
**Solution**: Place `serviceAccountKey.json` in backend folder

### Issue: Firestore write quota exceeded
**Solution**: Small dataset (100K ratings) is within free tier. For full dataset (33M), use Blaze plan

### Issue: "Connection timeout to MovieLens"
**Solution**: Check internet connection, MovieLens servers might be temporarily down

---

## Next Steps (Sprint 2)

After Sprint 1 is complete:
- ✅ MovieLens data downloaded & preprocessed
- ✅ Data loaded to Firestore
- ✅ Database schema validated

Next: Build the **Collaborative Filtering recommendation engine** in Sprint 2!

---

## Quick Commands Reference

```bash
# Install dependencies
pip install -r requirements.txt

# Download & preprocess data
python data_pipeline.py

# Load to Firestore
python firestore_loader.py

# Check Firestore data
# Visit Firebase Console → Firestore Database
```

---

Generated: 2026-04-19
