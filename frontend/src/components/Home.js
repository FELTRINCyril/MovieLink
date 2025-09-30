import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Star, Clock, Calendar, Heart, ChevronRight, Film, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = ({ isAdmin }) => {
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [recentMovies, setRecentMovies] = useState([]);
  const [favoriteMovies, setFavoriteMovies] = useState([]);
  const [moviesByGenre, setMoviesByGenre] = useState({});
  const [loading, setLoading] = useState(true);
  const [genres, setGenres] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [actors, setActors] = useState([]);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [featuredRes, recentRes, favoritesRes, genresRes, actorsRes] = await Promise.all([
        axios.get(`${API}/movies/featured`),
        axios.get(`${API}/movies/recent?limit=8`),
        axios.get(`${API}/movies/favorites?limit=6`),
        axios.get(`${API}/genres?type=movie`),
        axios.get(`${API}/actors`)
      ]);
      
      setFeaturedMovie(featuredRes.data);
      setRecentMovies(recentRes.data);
      setFavoriteMovies(favoritesRes.data);
      setGenres(genresRes.data);
      setActors(actorsRes.data);
      
      // Load movies by genre
      const moviesByGenreData = {};
      for (const genre of genresRes.data.slice(0, 3)) {
        try {
          const moviesRes = await axios.get(`${API}/movies/by-genre/${genre.id}?limit=6`);
          if (moviesRes.data.length > 0) {
            moviesByGenreData[genre.name] = {
              genre: genre,
              movies: moviesRes.data
            };
          }
        } catch (error) {
          console.error(`Error loading movies for genre ${genre.name}:`, error);
        }
      }
      setMoviesByGenre(moviesByGenreData);
      
    } catch (error) {
      console.error('Error loading home data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (movieId, currentStatus) => {
    try {
      await axios.patch(`${API}/movies/${movieId}/favorite`);
      toast.success(currentStatus ? 'Retiré des favoris' : 'Ajouté aux favoris');
      loadHomeData(); // Reload data
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Erreur lors de la modification des favoris');
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getActorName = (actorId) => {
    const actor = actors.find(a => a.id === actorId);
    return actor?.name || 'Acteur inconnu';
  };

  const getGenreName = (genreId) => {
    const genre = genres.find(g => g.id === genreId);
    return genre?.name || 'Genre inconnu';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section - Featured Movie */}
      {featuredMovie && (
        <section className="relative h-screen flex items-center justify-center overflow-hidden">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: featuredMovie.image ? `url(${featuredMovie.image})` : 'none',
              backgroundColor: featuredMovie.image ? 'transparent' : '#1f1f2e'
            }}
          >
            <div className="absolute inset-0 hero-gradient"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 container mx-auto px-4 text-center max-w-4xl">
            <div className="fade-in">
              <Badge className="mb-4 bg-violet-600/20 text-violet-300 border-violet-500/30">
                <Star className="w-3 h-3 mr-1" />
                Film en vedette
              </Badge>
              
              <h1 
                data-testid="featured-movie-title"
                className="text-5xl md:text-7xl font-bold mb-6 gradient-text"
              >
                {featuredMovie.title}
              </h1>
              
              {featuredMovie.description && (
                <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                  {featuredMovie.description}
                </p>
              )}
              
              <div className="flex items-center justify-center gap-6 mb-8 text-gray-400">
                {featuredMovie.duration && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>{formatDuration(featuredMovie.duration)}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>2024</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-4">
                <Button 
                  data-testid="watch-featured-movie-btn"
                  size="lg" 
                  className="btn-primary bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 text-lg"
                  onClick={() => {
                    if (featuredMovie.url) {
                      window.open(featuredMovie.url, '_blank');
                    } else {
                      toast.info('Lien du film non disponible');
                    }
                  }}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Regarder
                </Button>
                
                <Button 
                  data-testid="favorite-featured-movie-btn"
                  variant="outline"
                  size="lg"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-3"
                  onClick={() => toggleFavorite(featuredMovie.id, featuredMovie.is_favorite)}
                >
                  <Heart className={`w-5 h-5 mr-2 ${featuredMovie.is_favorite ? 'fill-red-500 text-red-500' : ''}`} />
                  {featuredMovie.is_favorite ? 'Favoris' : 'Ajouter aux favoris'}
                </Button>
              </div>
            </div>
          </div>
          
          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <ChevronRight className="w-6 h-6 text-white/60 rotate-90" />
          </div>
        </section>
      )}

      {/* Recent Movies Section */}
      {recentMovies.length > 0 && (
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white">Derniers films ajoutés</h2>
              <Link to="/movies">
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
                  Voir tout
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {recentMovies.map((movie) => (
                <Card 
                  key={movie.id} 
                  className="movie-card card-hover bg-gray-800/50 border-gray-700 group cursor-pointer"
                  onClick={() => setSelectedMovie(movie)}
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      {movie.image ? (
                        <img 
                          src={movie.image} 
                          alt={movie.title}
                          className="w-full h-64 object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="w-full h-64 bg-gray-700 flex items-center justify-center">
                          <Film className="w-12 h-12 text-gray-500" />
                        </div>
                      )}
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          size="sm" 
                          className="bg-violet-600 hover:bg-violet-700"
                          onClick={() => toggleFavorite(movie.id, movie.is_favorite)}
                        >
                          <Heart className={`w-4 h-4 ${movie.is_favorite ? 'fill-current' : ''}`} />
                        </Button>
                      </div>
                      
                      {movie.is_favorite && (
                        <div className="absolute top-2 right-2">
                          <Heart className="w-5 h-5 text-red-500 fill-current" />
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3">
                      <h3 className="font-semibold text-white text-sm line-clamp-2">{movie.title}</h3>
                      {movie.duration && (
                        <p className="text-xs text-gray-400 mt-1">{formatDuration(movie.duration)}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Favorite Movies Section */}
      {favoriteMovies.length > 0 && (
        <section className="py-16 px-4 bg-gray-900/30">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                <Star className="w-8 h-8 text-yellow-500" />
                Films favoris
              </h2>
              <Link to="/movies">
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
                  Voir tout
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {favoriteMovies.map((movie) => (
                <Card 
                  key={movie.id} 
                  className="movie-card card-hover bg-gray-800/50 border-gray-700 group cursor-pointer"
                  onClick={() => setSelectedMovie(movie)}
                >
                  <CardContent className="p-0">
                    <div className="relative">
                      {movie.image ? (
                        <img 
                          src={movie.image} 
                          alt={movie.title}
                          className="w-full h-64 object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="w-full h-64 bg-gray-700 flex items-center justify-center">
                          <Film className="w-12 h-12 text-gray-500" />
                        </div>
                      )}
                      
                      <div className="absolute top-2 right-2">
                        <Heart className="w-5 h-5 text-red-500 fill-current" />
                      </div>
                      
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-white/30 text-white hover:bg-white/20"
                          onClick={() => {
                            if (movie.url) {
                              window.open(movie.url, '_blank');
                            } else {
                              toast.info('Lien du film non disponible');
                            }
                          }}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Regarder
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-3">
                      <h3 className="font-semibold text-white text-sm line-clamp-2">{movie.title}</h3>
                      {movie.duration && (
                        <p className="text-xs text-gray-400 mt-1">{formatDuration(movie.duration)}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Movies by Genre Sections */}
      {Object.keys(moviesByGenre).map((genreName) => {
        const genreData = moviesByGenre[genreName];
        return (
          <section key={genreName} className="py-16 px-4">
            <div className="container mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white">
                  Films {genreName}
                </h2>
                <Link to="/movies">
                  <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
                    Voir tout
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {genreData.movies.map((movie) => (
                  <Card 
                    key={movie.id} 
                    className="movie-card card-hover bg-gray-800/50 border-gray-700 group cursor-pointer"
                    onClick={() => setSelectedMovie(movie)}
                  >
                    <CardContent className="p-0">
                      <div className="relative">
                        {movie.image ? (
                          <img 
                            src={movie.image} 
                            alt={movie.title}
                            className="w-full h-64 object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <div className="w-full h-64 bg-gray-700 flex items-center justify-center">
                            <Film className="w-12 h-12 text-gray-500" />
                          </div>
                        )}
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button 
                            size="sm" 
                            className="bg-violet-600 hover:bg-violet-700"
                            onClick={() => toggleFavorite(movie.id, movie.is_favorite)}
                          >
                            <Heart className={`w-4 h-4 ${movie.is_favorite ? 'fill-current' : ''}`} />
                          </Button>
                        </div>
                        
                        {movie.is_favorite && (
                          <div className="absolute top-2 right-2">
                            <Heart className="w-5 h-5 text-red-500 fill-current" />
                          </div>
                        )}
                      </div>
                      
                      <div className="p-3">
                        <h3 className="font-semibold text-white text-sm line-clamp-2">{movie.title}</h3>
                        {movie.duration && (
                          <p className="text-xs text-gray-400 mt-1">{formatDuration(movie.duration)}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* No Content State */}
      {!featuredMovie && recentMovies.length === 0 && favoriteMovies.length === 0 && (
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-400 mb-2">Aucun film disponible</h2>
            <p className="text-gray-600 mb-6">Commencez par ajouter des films à votre collection</p>
            <Link to="/movies">
              <Button className="bg-violet-600 hover:bg-violet-700">
                Ajouter des films
              </Button>
            </Link>
          </div>
        </div>
      )}
      
      {/* Movie Detail Dialog */}
      {selectedMovie && (
        <Dialog open={!!selectedMovie} onOpenChange={() => setSelectedMovie(null)}>
          <DialogContent className="max-w-4xl bg-gray-800 border-gray-600 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">{selectedMovie.title}</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1">
                {selectedMovie.image ? (
                  <img 
                    src={selectedMovie.image} 
                    alt={selectedMovie.title}
                    className="w-full rounded-lg"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-gray-700 flex items-center justify-center rounded-lg">
                    <Film className="w-16 h-16 text-gray-500" />
                  </div>
                )}
              </div>
              
              <div className="md:col-span-2 space-y-4">
                {selectedMovie.description && (
                  <p className="text-gray-200 leading-relaxed">{selectedMovie.description}</p>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedMovie.duration && (
                    <div>
                      <h4 className="font-semibold text-white mb-1">Durée</h4>
                      <p className="text-gray-300">{formatDuration(selectedMovie.duration)}</p>
                    </div>
                  )}
                  
                  {selectedMovie.genres.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-white mb-1">Genres</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedMovie.genres.map((genreId) => (
                          <Badge key={genreId} variant="secondary" className="bg-violet-600/20 text-violet-300">
                            {getGenreName(genreId)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedMovie.actors.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">Acteurs</h4>
                    <div className="space-y-2">
                      {selectedMovie.actors.map((actorId) => {
                        const actor = actors.find(a => a.id === actorId);
                        return actor ? (
                          <div key={actorId} className="flex items-center gap-3">
                            {actor.image && (
                              <img 
                                src={actor.image} 
                                alt={actor.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            )}
                            <span className="text-gray-200">{actor.name}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  {selectedMovie.url && (
                    <Button 
                      onClick={() => window.open(selectedMovie.url, '_blank')}
                      className="bg-violet-600 hover:bg-violet-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Regarder
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline"
                    onClick={() => toggleFavorite(selectedMovie.id, selectedMovie.is_favorite)}
                    className="border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <Heart className={`w-4 h-4 mr-2 ${selectedMovie.is_favorite ? 'fill-current text-red-500' : ''}`} />
                    {selectedMovie.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Home;