import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Play, Heart, Clock, Calendar, Edit, Trash2, Film as FilmIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Checkbox } from './ui/checkbox';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Movies = ({ isAdmin }) => {
  const [movies, setMovies] = useState([]);
  const [actors, setActors] = useState([]);
  const [genres, setGenres] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActor, setSelectedActor] = useState('all');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [selectedDuration, setSelectedDuration] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState(null);
  
  const [newMovie, setNewMovie] = useState({
    title: '',
    url: '',
    image: '',
    actors: [],
    description: '',
    genres: [],
    duration: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterMovies();
  }, [movies, searchQuery, selectedActor, selectedGenre, selectedDuration]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [moviesRes, actorsRes, genresRes] = await Promise.all([
        axios.get(`${API}/movies`),
        axios.get(`${API}/actors`),
        axios.get(`${API}/genres?type=movie`)
      ]);
      
      setMovies(moviesRes.data);
      setActors(actorsRes.data);
      setGenres(genresRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const filterMovies = () => {
    let filtered = movies;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(movie => 
        movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        movie.actors.some(actorId => {
          const actor = actors.find(a => a.id === actorId);
          return actor?.name.toLowerCase().includes(searchQuery.toLowerCase());
        })
      );
    }

    // Actor filter
    if (selectedActor && selectedActor !== 'all') {
      filtered = filtered.filter(movie => movie.actors.includes(selectedActor));
    }

    // Genre filter
    if (selectedGenre && selectedGenre !== 'all') {
      filtered = filtered.filter(movie => movie.genres.includes(selectedGenre));
    }

    // Duration filter
    if (selectedDuration && selectedDuration !== 'all') {
      filtered = filtered.filter(movie => {
        const duration = movie.duration || 0;
        switch (selectedDuration) {
          case 'short': return duration < 90;
          case 'medium': return duration >= 90 && duration < 150;
          case 'long': return duration >= 150;
          default: return true;
        }
      });
    }

    setFilteredMovies(filtered);
  };

  const handleAddMovie = async (e) => {
    e.preventDefault();
    if (!newMovie.title.trim()) {
      toast.error('Le titre est obligatoire');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const movieData = {
        ...newMovie,
        duration: newMovie.duration ? parseInt(newMovie.duration) : null
      };
      
      if (editingMovie) {
        await axios.put(`${API}/movies/${editingMovie.id}`, movieData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Film modifié avec succès');
      } else {
        await axios.post(`${API}/movies`, movieData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Film ajouté avec succès');
      }
      
      setShowAddDialog(false);
      setEditingMovie(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving movie:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteMovie = async (movieId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce film ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/movies/${movieId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Film supprimé avec succès');
      loadData();
    } catch (error) {
      console.error('Error deleting movie:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleFavorite = async (movieId, currentStatus) => {
    try {
      await axios.patch(`${API}/movies/${movieId}/favorite`);
      toast.success(currentStatus ? 'Retiré des favoris' : 'Ajouté aux favoris');
      loadData();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Erreur lors de la modification des favoris');
    }
  };

  const resetForm = () => {
    setNewMovie({
      title: '',
      url: '',
      image: '',
      actors: [],
      description: '',
      genres: [],
      duration: ''
    });
  };

  const openEditDialog = (movie) => {
    setEditingMovie(movie);
    setNewMovie({
      title: movie.title,
      url: movie.url || '',
      image: movie.image || '',
      actors: movie.actors || [],
      description: movie.description || '',
      genres: movie.genres || [],
      duration: movie.duration ? movie.duration.toString() : ''
    });
    setShowAddDialog(true);
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

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedActor('');
    setSelectedGenre('');
    setSelectedDuration('');
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
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Films</h1>
            <p className="text-gray-400">{filteredMovies.length} film{filteredMovies.length !== 1 ? 's' : ''} trouvé{filteredMovies.length !== 1 ? 's' : ''}</p>
          </div>
          
          {isAdmin && (
            <Button
              data-testid="add-movie-btn"
              onClick={() => {
                resetForm();
                setEditingMovie(null);
                setShowAddDialog(true);
              }}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un film
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="glass rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <Label htmlFor="movie-search" className="text-gray-300 mb-2 block">
                Rechercher un film
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="movie-search"
                  data-testid="movie-search-input"
                  type="text"
                  placeholder="Titre, description, acteur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Actor Filter */}
            <div>
              <Label className="text-gray-300 mb-2 block">Acteur</Label>
              <Select value={selectedActor} onValueChange={setSelectedActor}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue placeholder="Tous les acteurs" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">Tous les acteurs</SelectItem>
                  {actors.map((actor) => (
                    <SelectItem key={actor.id} value={actor.id} className="text-white">
                      {actor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Genre Filter */}
            <div>
              <Label className="text-gray-300 mb-2 block">Genre</Label>
              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue placeholder="Tous les genres" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">Tous les genres</SelectItem>
                  {genres.map((genre) => (
                    <SelectItem key={genre.id} value={genre.id} className="text-white">
                      {genre.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration Filter */}
            <div>
              <Label className="text-gray-300 mb-2 block">Durée</Label>
              <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                  <SelectValue placeholder="Toutes durées" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="all">Toutes durées</SelectItem>
                  <SelectItem value="short" className="text-white">Court (&lt; 1h30)</SelectItem>
                  <SelectItem value="medium" className="text-white">Moyen (1h30 - 2h30)</SelectItem>
                  <SelectItem value="long" className="text-white">Long (&gt; 2h30)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Clear Filters */}
          {(searchQuery || selectedActor || selectedGenre || selectedDuration) && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Filter className="w-4 h-4 mr-2" />
                Effacer les filtres
              </Button>
            </div>
          )}
        </div>

        {/* Movies Grid */}
        {filteredMovies.length === 0 ? (
          <div className="text-center py-16">
            <FilmIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Aucun film trouvé</h3>
            <p className="text-gray-600 mb-6">
              {movies.length === 0 
                ? "Aucun film n'a été ajouté pour le moment"
                : "Aucun film ne correspond à vos critères de recherche"
              }
            </p>
            {isAdmin && movies.length === 0 && (
              <Button
                onClick={() => {
                  resetForm();
                  setEditingMovie(null);
                  setShowAddDialog(true);
                }}
                className="bg-violet-600 hover:bg-violet-700"
              >
                Ajouter le premier film
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMovies.map((movie) => (
              <Card 
                key={movie.id} 
                className="movie-card card-hover bg-gray-800/50 border-gray-700 group cursor-pointer"
                onClick={() => setSelectedMovie(movie)}
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
                        <FilmIcon className="w-12 h-12 text-gray-500" />
                      </div>
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-t-lg">
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          className="bg-violet-600 hover:bg-violet-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (movie.url) {
                              window.open(movie.url, '_blank');
                            } else {
                              toast.info('Lien du film non disponible');
                            }
                          }}
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-white/30 text-white hover:bg-white/20"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(movie.id, movie.is_favorite);
                          }}
                        >
                          <Heart className={`w-4 h-4 ${movie.is_favorite ? 'fill-current text-red-500' : ''}`} />
                        </Button>
                      </div>
                    </div>
                    
                    {movie.is_favorite && (
                      <div className="absolute top-2 right-2">
                        <Heart className="w-5 h-5 text-red-500 fill-current" />
                      </div>
                    )}
                    
                    {/* Admin Controls */}
                    {isAdmin && (
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-white/30 text-white hover:bg-white/20 p-1 h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(movie);
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/20 p-1 h-6 w-6"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMovie(movie.id);
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    )}
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
                      <p className="text-gray-400 text-sm line-clamp-2 mb-3">{movie.description}</p>
                    )}
                    
                    {/* Genres */}
                    {movie.genres.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {movie.genres.slice(0, 2).map((genreId) => (
                          <Badge key={genreId} variant="secondary" className="text-xs bg-violet-600/20 text-violet-300">
                            {getGenreName(genreId)}
                          </Badge>
                        ))}
                        {movie.genres.length > 2 && (
                          <Badge variant="secondary" className="text-xs bg-gray-600/20 text-gray-400">
                            +{movie.genres.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {/* Actors */}
                    {movie.actors.length > 0 && (
                      <div className="text-xs text-gray-500">
                        Avec {movie.actors.slice(0, 2).map(getActorName).join(', ')}
                        {movie.actors.length > 2 && ` et ${movie.actors.length - 2} autre${movie.actors.length > 3 ? 's' : ''}`}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Movie Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingMovie ? 'Modifier le film' : 'Ajouter un nouveau film'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleAddMovie} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title" className="text-gray-300">Titre *</Label>
                  <Input
                    id="title"
                    data-testid="movie-title-input"
                    type="text"
                    value={newMovie.title}
                    onChange={(e) => setNewMovie({...newMovie, title: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="duration" className="text-gray-300">Durée (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={newMovie.duration}
                    onChange={(e) => setNewMovie({...newMovie, duration: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="url" className="text-gray-300">Lien vers le film</Label>
                <Input
                  id="url"
                  type="url"
                  value={newMovie.url}
                  onChange={(e) => setNewMovie({...newMovie, url: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="https://..."
                />
              </div>
              
              <div>
                <Label htmlFor="image" className="text-gray-300">Image (URL de l'affiche)</Label>
                <Input
                  id="image"
                  type="url"
                  value={newMovie.image}
                  onChange={(e) => setNewMovie({...newMovie, image: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="https://..."
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  value={newMovie.description}
                  onChange={(e) => setNewMovie({...newMovie, description: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                />
              </div>
              
              {/* Genres Selection */}
              <div>
                <Label className="text-gray-300">Genres</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {genres.map((genre) => (
                    <div key={genre.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`genre-${genre.id}`}
                        checked={newMovie.genres.includes(genre.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewMovie({...newMovie, genres: [...newMovie.genres, genre.id]});
                          } else {
                            setNewMovie({...newMovie, genres: newMovie.genres.filter(g => g !== genre.id)});
                          }
                        }}
                      />
                      <Label htmlFor={`genre-${genre.id}`} className="text-gray-300 text-sm">
                        {genre.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Actors Selection */}
              <div>
                <Label className="text-gray-300">Acteurs</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {actors.map((actor) => (
                    <div key={actor.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`actor-${actor.id}`}
                        checked={newMovie.actors.includes(actor.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setNewMovie({...newMovie, actors: [...newMovie.actors, actor.id]});
                          } else {
                            setNewMovie({...newMovie, actors: newMovie.actors.filter(a => a !== actor.id)});
                          }
                        }}
                      />
                      <Label htmlFor={`actor-${actor.id}`} className="text-gray-300 text-sm">
                        {actor.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {editingMovie ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Movie Detail Dialog */}
        {selectedMovie && (
          <Dialog open={!!selectedMovie} onOpenChange={() => setSelectedMovie(null)}>
            <DialogContent className="max-w-4xl bg-gray-800 border-gray-700 max-h-[90vh] overflow-y-auto">
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
                      <FilmIcon className="w-16 h-16 text-gray-500" />
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2 space-y-4">
                  {selectedMovie.description && (
                    <p className="text-gray-300 leading-relaxed">{selectedMovie.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedMovie.duration && (
                      <div>
                        <h4 className="font-semibold text-white mb-1">Durée</h4>
                        <p className="text-gray-400">{formatDuration(selectedMovie.duration)}</p>
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
                              <span className="text-gray-300">{actor.name}</span>
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
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
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
    </div>
  );
};

export default Movies;