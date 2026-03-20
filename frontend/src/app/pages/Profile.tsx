// Profile component displays and manages user profile with Firestore integration
import { useEffect, useState } from "react";
import { User, Mail, Calendar, Star, Film, Heart, Award, Settings, Edit, Loader } from "lucide-react";
import { mockMovies } from "../data/mockMovies";
import { getUserProfile, updateUserProfile, getCurrentUser } from "../../config/authService";
import { UserProfile } from "../../config/authService";

interface ProfileProps {
  userName?: string;
  userEmail?: string;
  watchlist?: number[];
  userRatings?: Record<number, number>;
}

export function Profile({ userName: defaultName, userEmail: defaultEmail, watchlist: defaultWatchlist = [], userRatings: defaultRatings = {} }: ProfileProps) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");

  // Use real data from Firestore if available, otherwise fall back to props
  const userName = userProfile?.displayName || defaultName || "User";
  const userEmail = userProfile?.email || defaultEmail || "user@example.com";
  const watchlist = defaultWatchlist;
  const userRatings = defaultRatings;

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const currentUser = getCurrentUser();
        if (currentUser) {
          const profile = await getUserProfile(currentUser.uid);
          if (profile) {
            setUserProfile(profile);
            setEditName(profile.displayName);
          }
        }
      } catch (err: any) {
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleUpdateProfile = async () => {
    if (!userProfile) return;
    
    try {
      await updateUserProfile(userProfile.uid, {
        displayName: editName
      });
      setUserProfile({ ...userProfile, displayName: editName });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-zinc-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  const ratedMovies = Object.keys(userRatings).length;
  const averageRating = ratedMovies > 0
    ? Object.values(userRatings).reduce((a, b) => a + b, 0) / ratedMovies
    : 0;

  // Get favorite genres based on rated movies
  const genreCounts: Record<string, number> = {};
  Object.keys(userRatings).forEach((movieId) => {
    const movie = mockMovies.find((m) => m.id === Number(movieId));
    if (movie) {
      movie.genre.forEach((genre) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    }
  });

  const favoriteGenres = Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([genre]) => genre);

  // Get recent ratings
  const recentRatings = Object.entries(userRatings)
    .slice(-5)
    .reverse()
    .map(([movieId, rating]) => {
      const movie = mockMovies.find((m) => m.id === Number(movieId));
      return { movie, rating };
    })
    .filter((item) => item.movie);

  return (
    <div className="min-h-screen bg-zinc-950">
      {error && (
        <div className="bg-red-500/10 border-b border-red-500/30 p-4 flex items-center gap-3">
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-2xl p-8 mb-8 border border-purple-800/30">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <User className="w-16 h-16 text-white" />
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-zinc-900 rounded-full border-2 border-zinc-950 hover:bg-zinc-800 transition-colors">
                <Loader className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  {isEditing ? (
                    <div className="mb-4 flex gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="text-3xl font-bold text-white bg-zinc-800 border border-zinc-700 rounded px-3 py-1"
                      />
                      <button
                        onClick={handleUpdateProfile}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditName(userName);
                        }}
                        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <h1 className="text-3xl font-bold text-white mb-2 capitalize">
                      {userName}
                    </h1>
                  )}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Mail className="w-4 h-4" />
                      <span>{userEmail}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Member since {userProfile?.createdAt ? new Date(userProfile.createdAt.toDate()).toLocaleDateString() : "March 2026"}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span className="hidden md:inline">Edit Profile</span>
                </button>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-4 mt-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-lg">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-white font-semibold">{ratedMovies}</span>
                  <span className="text-zinc-400 text-sm">Ratings</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-lg">
                  <Heart className="w-5 h-5 text-pink-500" />
                  <span className="text-white font-semibold">{watchlist.length}</span>
                  <span className="text-zinc-400 text-sm">Watchlist</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900/50 rounded-lg">
                  <Award className="w-5 h-5 text-purple-500" />
                  <span className="text-white font-semibold">{averageRating.toFixed(1)}</span>
                  <span className="text-zinc-400 text-sm">Avg Rating</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recent Ratings */}
            <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Star className="w-6 h-6 text-yellow-500" />
                  <h2 className="text-xl font-semibold text-white">Recent Ratings</h2>
                </div>
                <span className="text-sm text-zinc-400">{ratedMovies} total</span>
              </div>

              {recentRatings.length > 0 ? (
                <div className="space-y-4">
                  {recentRatings.map(({ movie, rating }) => (
                    <div
                      key={movie!.id}
                      className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                      <img
                        src={movie!.poster}
                        alt={movie!.title}
                        className="w-16 h-24 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{movie!.title}</h3>
                        <p className="text-sm text-zinc-400 mb-2">
                          {movie!.year} • {movie!.genre.join(", ")}
                        </p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= rating
                                  ? "fill-yellow-500 text-yellow-500"
                                  : "fill-transparent text-zinc-600"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-yellow-500">{rating}</div>
                        <div className="text-xs text-zinc-400">/ 5</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Star className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400">No ratings yet</p>
                  <p className="text-sm text-zinc-500 mt-1">Start rating movies to see them here</p>
                </div>
              )}
            </section>

            {/* Activity Stats */}
            <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-6">
                <Film className="w-6 h-6 text-purple-500" />
                <h2 className="text-xl font-semibold text-white">Viewing Activity</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800/50 rounded-lg">
                  <div className="text-3xl font-bold text-white mb-1">{ratedMovies}</div>
                  <div className="text-sm text-zinc-400">Movies Rated</div>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg">
                  <div className="text-3xl font-bold text-white mb-1">{watchlist.length}</div>
                  <div className="text-sm text-zinc-400">In Watchlist</div>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg">
                  <div className="text-3xl font-bold text-white mb-1">
                    {averageRating > 0 ? averageRating.toFixed(1) : "0"}
                  </div>
                  <div className="text-sm text-zinc-400">Average Rating</div>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-lg">
                  <div className="text-3xl font-bold text-white mb-1">
                    {favoriteGenres.length}
                  </div>
                  <div className="text-sm text-zinc-400">Favorite Genres</div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Favorite Genres */}
            <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <Heart className="w-6 h-6 text-pink-500" />
                <h2 className="text-xl font-semibold text-white">Favorite Genres</h2>
              </div>

              {favoriteGenres.length > 0 ? (
                <div className="space-y-3">
                  {favoriteGenres.map((genre, index) => {
                    const count = genreCounts[genre];
                    const percentage = (count / ratedMovies) * 100;
                    return (
                      <div key={genre}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-medium">{genre}</span>
                          <span className="text-sm text-zinc-400">{count} movies</span>
                        </div>
                        <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-zinc-400 text-sm">Rate movies to discover your preferences</p>
              )}
            </section>

            {/* Achievements */}
            <section className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-6 h-6 text-yellow-500" />
                <h2 className="text-xl font-semibold text-white">Achievements</h2>
              </div>

              <div className="space-y-3">
                <div
                  className={`p-3 rounded-lg border-2 ${
                    ratedMovies >= 1
                      ? "bg-purple-900/30 border-purple-600"
                      : "bg-zinc-800/30 border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        ratedMovies >= 1 ? "bg-purple-600" : "bg-zinc-700"
                      }`}
                    >
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">First Rating</div>
                      <div className="text-xs text-zinc-400">Rate your first movie</div>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border-2 ${
                    ratedMovies >= 10
                      ? "bg-purple-900/30 border-purple-600"
                      : "bg-zinc-800/30 border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        ratedMovies >= 10 ? "bg-purple-600" : "bg-zinc-700"
                      }`}
                    >
                      <Film className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Movie Buff</div>
                      <div className="text-xs text-zinc-400">Rate 10 movies</div>
                    </div>
                  </div>
                </div>

                <div
                  className={`p-3 rounded-lg border-2 ${
                    watchlist.length >= 5
                      ? "bg-purple-900/30 border-purple-600"
                      : "bg-zinc-800/30 border-zinc-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        watchlist.length >= 5 ? "bg-purple-600" : "bg-zinc-700"
                      }`}
                    >
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Collector</div>
                      <div className="text-xs text-zinc-400">Add 5 to watchlist</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
