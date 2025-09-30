import React, { useState, useEffect } from 'react';
import { Heart, Film, Users, Play, Calendar, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Favorites = ({ isAdmin }) => {
  const [favorites, setFavorites] = useState({ movies: [], actors: [] });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('movies');

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/favorites`);
      setFavorites(response.data);
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast.error('Erreur lors du chargement des favoris');
    } finally {
      setLoading(false);
    }
  };

  const toggleMovieFavorite = async (movieId, currentStatus) => {
    try {
      await axios.patch(`${API}/movies/${movieId}/favorite`);
      toast.success('Film retiré des favoris');
      loadFavorites();
    } catch (error) {
      console.error('Error toggling movie favorite:', error);
      toast.error('Erreur lors de la modification des favoris');
    }
  };

  const toggleActorFavorite = async (actorId, currentStatus) => {
    try {
      await axios.patch(`${API}/actors/${actorId}/favorite`);
      toast.success('Acteur retiré des favoris');
      loadFavorites();
    } catch (error) {
      console.error('Error toggling actor favorite:', error);
      toast.error('Erreur lors de la modification des favoris');
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="flex items-center justify-center mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold gradient-text mb-2 flex items-center gap-3 justify-center">
              <Heart className="w-10 h-10 text-red-500 fill-current" />
              Favoris
            </h1>
            <p className="text-gray-400">
              {favorites.movies.length} film{favorites.movies.length !== 1 ? 's' : ''} et {favorites.actors.length} acteur{favorites.actors.length !== 1 ? 's' : ''} en favoris
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-800 border-gray-700">
            <TabsTrigger 
              value="movies" 
              className="flex items-center gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white"
            >
              <Film className="w-4 h-4" />
              Films ({favorites.movies.length})
            </TabsTrigger>
            <TabsTrigger 
              value="actors" 
              className="flex items-center gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4" />
              Acteurs ({favorites.actors.length})
            </TabsTrigger>
          </TabsList>

          {/* Movies Tab */}
          <TabsContent value="movies" className="space-y-6">
            {favorites.movies.length === 0 ? (
              <div className="text-center py-16">
                <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Aucun film en favoris</h3>
                <p className="text-gray-600 mb-6">Ajoutez des films à vos favoris pour les retrouver ici</p>
                <Button 
                  onClick={() => window.location.href = '/movies'}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  Découvrir les films
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {favorites.movies.map((movie) => (
                  <Card 
                    key={movie.id} 
                    className="movie-card card-hover bg-gray-800/50 border-gray-700 group cursor-pointer"
                    onClick={() => setSelectedItem({...movie, type: 'movie'})}
                  >
                    <CardContent className="p-0">
                      <div className="relative aspect-[16/9]">
                        {movie.image ? (
                          <img 
                            src={movie.image} 
                            alt={movie.title}
                            className="w-full h-full object-cover rounded-t-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-700 flex items-center justify-center rounded-t-lg">
                            <Film className="w-12 h-12 text-gray-500" />
                          </div>
                        )}
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-t-lg">
                          <div className="flex items-center gap-2">
                            {movie.url && (
                              <Button 
                                size="sm" 
                                className="bg-violet-600 hover:bg-violet-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(movie.url, '_blank');
                                }}
                              >
                                <Play className="w-4 h-4" />
                              </Button>
                            )}
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleMovieFavorite(movie.id, movie.is_favorite);
                              }}
                            >
                              <Heart className="w-4 h-4 fill-current" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="absolute top-2 right-2">
                          <Heart className="w-5 h-5 text-red-500 fill-current" />
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <h3 className="font-semibold text-white text-lg mb-2 line-clamp-2">{movie.title}</h3>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                          {movie.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>{formatDuration(movie.duration)}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>2024</span>
                          </div>
                        </div>
                        
                        {movie.description && (
                          <p className="text-gray-400 text-sm line-clamp-2">{movie.description}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Actors Tab */}
          <TabsContent value="actors" className="space-y-6">
            {favorites.actors.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Aucun acteur en favoris</h3>
                <p className="text-gray-600 mb-6">Ajoutez des acteurs à vos favoris pour les retrouver ici</p>
                <Button 
                  onClick={() => window.location.href = '/actors'}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  Découvrir les acteurs
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {favorites.actors.map((actor) => (
                  <Card 
                    key={actor.id} 
                    className="actor-card card-hover bg-gray-800/50 border-gray-700 group cursor-pointer"
                    onClick={() => setSelectedItem({...actor, type: 'actor'})}
                  >
                    <CardContent className="p-0">
                      <div className="relative aspect-[3/4]">
                        {actor.image ? (
                          <img 
                            src={actor.image} 
                            alt={actor.name}
                            className="w-full h-full object-cover rounded-t-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-700 flex items-center justify-center rounded-t-lg">
                            <Users className="w-12 h-12 text-gray-500" />
                          </div>
                        )}
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-t-lg">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleActorFavorite(actor.id, actor.is_favorite);
                            }}
                          >
                            <Heart className="w-4 h-4 fill-current" />
                          </Button>
                        </div>
                        
                        <div className="absolute top-2 right-2">
                          <Heart className="w-5 h-5 text-red-500 fill-current" />
                        </div>
                      </div>
                      
                      <div className="p-3">
                        <h3 className="font-semibold text-white text-sm mb-1 line-clamp-1">{actor.name}</h3>
                        
                        {actor.age && (
                          <p className="text-xs text-gray-400 mb-1">{actor.age} ans</p>
                        )}
                        
                        <p className="text-xs text-gray-500">
                          {actor.movies?.length || 0} film{(actor.movies?.length || 0) !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Favorites;