export interface Movie {
  id: number;
  title: string;
  year: number;
  genre: string[];
  rating: number;
  votes: number;
  duration: number;
  director: string;
  cast: string[];
  overview: string;
  poster: string;
  backdrop?: string;
}

export const mockMovies: Movie[] = [
  {
    id: 1,
    title: "Quantum Horizon",
    year: 2024,
    genre: ["Action", "Sci-Fi", "Thriller"],
    rating: 8.7,
    votes: 45320,
    duration: 142,
    director: "Christopher Nolan",
    cast: ["Tom Hardy", "Emily Blunt", "Oscar Isaac", "Tilda Swinton"],
    overview: "When a physicist discovers a way to manipulate quantum states, she must prevent a shadowy organization from using her research to rewrite reality itself. A mind-bending journey through parallel dimensions.",
    poster: "https://images.unsplash.com/photo-1765510296004-614b6cc204da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhY3Rpb24lMjBtb3ZpZSUyMHBvc3RlcnxlbnwxfHx8fDE3NzI2MjA5ODV8MA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: 2,
    title: "The Last Portrait",
    year: 2025,
    genre: ["Drama", "Romance"],
    rating: 7.9,
    votes: 23450,
    duration: 118,
    director: "Greta Gerwig",
    cast: ["Saoirse Ronan", "Timothée Chalamet", "Laura Dern"],
    overview: "A struggling artist in 1920s Paris finds unexpected love with a mysterious patron who commissions what may be their final masterpiece. A haunting tale of art, passion, and sacrifice.",
    poster: "https://images.unsplash.com/photo-1765510296004-614b6cc204da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcmFtYSUyMGZpbG0lMjBwb3N0ZXJ8ZW58MXx8fHwxNzcyNzAwODAxfDA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: 3,
    title: "Neon Dreams",
    year: 2025,
    genre: ["Sci-Fi", "Mystery", "Thriller"],
    rating: 8.3,
    votes: 38200,
    duration: 136,
    director: "Denis Villeneuve",
    cast: ["Ryan Gosling", "Ana de Armas", "Jared Leto"],
    overview: "In a cyberpunk metropolis where memories can be bought and sold, a detective investigates a series of murders that seem to exist only in the victims' dreams. Reality and illusion blur.",
    poster: "https://images.unsplash.com/photo-1761948245703-cbf27a3e7502?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2ktZmklMjBjaW5lbWElMjBwb3N0ZXJ8ZW58MXx8fHwxNzcyNzAyMjIyfDA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: 4,
    title: "Whispers in the Dark",
    year: 2024,
    genre: ["Horror", "Thriller"],
    rating: 7.5,
    votes: 31500,
    duration: 105,
    director: "Ari Aster",
    cast: ["Florence Pugh", "Jack Reynor", "Will Poulter"],
    overview: "A family moves into an isolated mansion with a dark history. As supernatural events escalate, they realize the house's previous occupants never truly left. Terror lurks in every shadow.",
    poster: "https://images.unsplash.com/photo-1767048264833-5b65aacd1039?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3Jyb3IlMjBmaWxtJTIwcG9zdGVyfGVufDF8fHx8MTc3MjcwMjIyMnww&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: 5,
    title: "Hearts in Harmony",
    year: 2025,
    genre: ["Romance", "Comedy", "Drama"],
    rating: 7.2,
    votes: 19800,
    duration: 112,
    director: "Richard Curtis",
    cast: ["Emma Stone", "Andrew Garfield", "Bill Nighy"],
    overview: "Two musicians from different worlds meet at a summer music festival and discover that love, like music, requires perfect timing. A heartwarming story of second chances and finding your rhythm.",
    poster: "https://images.unsplash.com/photo-1765510296004-614b6cc204da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyb21hbmNlJTIwbW92aWUlMjBwb3N0ZXJ8ZW58MXx8fHwxNzcyNjY2MDY0fDA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: 6,
    title: "The Silent Witness",
    year: 2024,
    genre: ["Thriller", "Crime", "Mystery"],
    rating: 8.1,
    votes: 42100,
    duration: 128,
    director: "David Fincher",
    cast: ["Jake Gyllenhaal", "Rooney Mara", "Michael Shannon"],
    overview: "A mute woman becomes the only witness to a high-profile murder. As she tries to communicate what she saw, she becomes the killer's next target. Trust no one in this psychological thriller.",
    poster: "https://images.unsplash.com/photo-1765510296004-614b6cc204da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aHJpbGxlciUyMG1vdmllJTIwcG9zdGVyfGVufDF8fHx8MTc3MjY0NTQ3Mnww&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: 7,
    title: "Kingdom of Shadows",
    year: 2025,
    genre: ["Fantasy", "Adventure", "Action"],
    rating: 8.5,
    votes: 52300,
    duration: 155,
    director: "Peter Jackson",
    cast: ["Henry Cavill", "Anya Taylor-Joy", "Idris Elba"],
    overview: "In a realm where light and darkness wage eternal war, a reluctant hero must unite the divided kingdoms before an ancient evil awakens. Epic battles and stunning visuals await.",
    poster: "https://images.unsplash.com/photo-1769847780887-dc6f4380621e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwZmlsbSUyMHBvc3RlcnxlbnwxfHx8fDE3NzI1OTcyMjZ8MA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: 8,
    title: "Starlight Academy",
    year: 2024,
    genre: ["Animation", "Family", "Adventure"],
    rating: 7.8,
    votes: 28600,
    duration: 98,
    director: "Pete Docter",
    cast: ["Voices: Zendaya", "Tom Holland", "Awkwafina"],
    overview: "A young girl discovers she has magical powers and is recruited to a secret school for gifted children. But when an ancient curse threatens the academy, she must save the day.",
    poster: "https://images.unsplash.com/photo-1769847780887-dc6f4380621e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltYXRpb24lMjBtb3ZpZSUyMHBvc3RlcnxlbnwxfHx8fDE3NzI3MDIyMjN8MA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: 9,
    title: "Code Red",
    year: 2024,
    genre: ["Action", "Thriller", "Adventure"],
    rating: 7.6,
    votes: 35400,
    duration: 124,
    director: "Michael Bay",
    cast: ["Chris Hemsworth", "Charlize Theron", "John Boyega"],
    overview: "An elite team of operatives must stop a global terrorist network from triggering a catastrophic cyberattack. High-octane action and explosive set pieces in a race against time.",
    poster: "https://images.unsplash.com/photo-1761948245703-cbf27a3e7502?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZHZlbnR1cmUlMjBjaW5lbWElMjBwb3N0ZXJ8ZW58MXx8fHwxNzcyNzAyMjI0fDA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: 10,
    title: "Midnight Betrayal",
    year: 2025,
    genre: ["Crime", "Drama", "Thriller"],
    rating: 8.0,
    votes: 39200,
    duration: 133,
    director: "Martin Scorsese",
    cast: ["Leonardo DiCaprio", "Robert De Niro", "Margot Robbie"],
    overview: "A veteran detective discovers his partner is working for the mob. As loyalties are tested, he must choose between brotherhood and justice in this gritty crime thriller.",
    poster: "https://images.unsplash.com/photo-1769397830996-c0e1a18c0a87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmltZSUyMG1vdmllJTIwcG9zdGVyfGVufDF8fHx8MTc3MjY4Mzk1Nnww&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: 11,
    title: "The Lost City of Atlantis",
    year: 2024,
    genre: ["Adventure", "Fantasy", "Action"],
    rating: 7.4,
    votes: 26800,
    duration: 130,
    director: "James Cameron",
    cast: ["Chris Pratt", "Zoe Saldana", "Benedict Cumberbatch"],
    overview: "An archaeologist discovers clues to the legendary lost city beneath the ocean. Racing against rival treasure hunters, they must unlock ancient secrets before it's too late.",
    poster: "https://images.unsplash.com/photo-1765510296004-614b6cc204da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhY3Rpb24lMjBtb3ZpZSUyMHBvc3RlcnxlbnwxfHx8fDE3NzI2MjA5ODV8MA&ixlib=rb-4.1.0&q=80&w=1080"
  },
  {
    id: 12,
    title: "Autumn Leaves",
    year: 2025,
    genre: ["Drama", "Romance"],
    rating: 7.1,
    votes: 17500,
    duration: 108,
    director: "Sofia Coppola",
    cast: ["Elle Fanning", "Dev Patel", "Cate Blanchett"],
    overview: "Two strangers meet during a weekend retreat in the countryside and share their deepest secrets. A tender exploration of love, loss, and the courage to start over.",
    poster: "https://images.unsplash.com/photo-1765510296004-614b6cc204da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkcmFtYSUyMGZpbG0lMjBwb3N0ZXJ8ZW58MXx8fHwxNzcyNzAwODAxfDA&ixlib=rb-4.1.0&q=80&w=1080"
  }
];

export const genres = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Thriller",
  "Family"
];

export const years = [2025, 2024, 2023, 2022, 2021, 2020];
