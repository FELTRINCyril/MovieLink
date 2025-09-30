import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Heart, Edit, Trash2, Users as UsersIcon, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Actors = ({ isAdmin }) => {
  const [actors, setActors] = useState([]);
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [filteredActors, setFilteredActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgeRange, setSelectedAgeRange] = useState('all');
  const [selectedMovieCount, setSelectedMovieCount] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingActor, setEditingActor] = useState(null);
  const [selectedActor, setSelectedActor] = useState(null);
  
  const [newActor, setNewActor] = useState({
    name: '',
    age: '',
    image: '',
    movies: [],
    description: '',
    genres: []
  });

  const [imageSettings, setImageSettings] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterActors();
  }, [actors, searchQuery, selectedAgeRange, selectedMovieCount]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [actorsRes, moviesRes, genresRes] = await Promise.all([
        axios.get(`${API}/actors`),
        axios.get(`${API}/movies`),
        axios.get(`${API}/genres?type=actor`)
      ]);
      
      setActors(actorsRes.data);
      setMovies(moviesRes.data);
      setGenres(genresRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const filterActors = () => {
    let filtered = actors;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(actor => 
        actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        actor.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        actor.movies.some(movieId => {
          const movie = movies.find(m => m.id === movieId);
          return movie?.title.toLowerCase().includes(searchQuery.toLowerCase());
        })
      );
    }

    // Age filter
    if (selectedAgeRange && selectedAgeRange !== 'all') {
      filtered = filtered.filter(actor => {
        const age = actor.age || 0;
        switch (selectedAgeRange) {
          case 'young': return age < 30;
          case 'middle': return age >= 30 && age < 50;
          case 'mature': return age >= 50;
          default: return true;
        }
      });
    }

    // Movie count filter
    if (selectedMovieCount && selectedMovieCount !== 'all') {
      filtered = filtered.filter(actor => {
        const movieCount = actor.movies?.length || 0;
        switch (selectedMovieCount) {
          case 'few': return movieCount <= 2;
          case 'moderate': return movieCount > 2 && movieCount <= 5;
          case 'many': return movieCount > 5;
          default: return true;
        }
      });
    }

    setFilteredActors(filtered);
  };

  const handleAddActor = async (e) => {
    e.preventDefault();
    if (!newActor.name.trim()) {
      toast.error('Le nom est obligatoire');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const actorData = {
        ...newActor,
        age: newActor.age ? parseInt(newActor.age) : null
      };
      
      if (editingActor) {
        await axios.put(`${API}/actors/${editingActor.id}`, actorData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Acteur modifié avec succès');
      } else {
        await axios.post(`${API}/actors`, actorData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Acteur ajouté avec succès');
      }
      
      setShowAddDialog(false);
      setEditingActor(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving actor:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteActor = async (actorId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet acteur ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/actors/${actorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Acteur supprimé avec succès');
      loadData();
    } catch (error) {
      console.error('Error deleting actor:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleFavorite = async (actorId, currentStatus) => {
    try {
      await axios.patch(`${API}/actors/${actorId}/favorite`);
      toast.success(currentStatus ? 'Retiré des favoris' : 'Ajouté aux favoris');
      loadData();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Erreur lors de la modification des favoris');
    }
  };

  const resetForm = () => {
    setNewActor({
      name: '',
      age: '',
      image: '',
      movies: [],
      description: '',
      genres: []
    });
  };

  const openEditDialog = (actor) => {
    setEditingActor(actor);
    setNewActor({
      name: actor.name,
      age: actor.age ? actor.age.toString() : '',
      image: actor.image || '',
      movies: actor.movies || [],
      description: actor.description || '',
      genres: actor.genres || []
    });
    setShowAddDialog(true);
  };

  const getMovieTitle = (movieId) => {
    const movie = movies.find(m => m.id === movieId);
    return movie?.title || 'Film inconnu';
  };

  const getGenreName = (genreId) => {
    const genre = genres.find(g => g.id === genreId);
    return genre?.name || 'Genre inconnu';
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedAgeRange('all');
    setSelectedMovieCount('all');
  };

  const getImageSettings = (actorId) => {
    const actor = actors.find(a => a.id === actorId);
    return actor?.image_settings || { scale: 100, positionX: 50, positionY: 50 };
  };

  const updateImageSettings = async (actorId, settings) => {
    const newSettings = { ...getImageSettings(actorId), ...settings };
    
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API}/actors/${actorId}/image-settings`, newSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setActors(prev => prev.map(actor => 
        actor.id === actorId 
          ? { ...actor, image_settings: newSettings }
          : actor
      ));
      setFilteredActors(prev => prev.map(actor => 
        actor.id === actorId 
          ? { ...actor, image_settings: newSettings }
          : actor
      ));
    } catch (error) {
      console.error('Error updating image settings:', error);
      toast.error('Erreur lors de la sauvegarde des paramètres d\'image');
    }
  };

  const resetImageSettings = async (actorId) => {
    const defaultSettings = { scale: 100, positionX: 50, positionY: 50 };
    await updateImageSettings(actorId, defaultSettings);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-violet-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 bg-gray-900">
      <div className="container mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2">Acteurs</h1>
            <p className="text-gray-300">{filteredActors.length} acteur{filteredActors.length !== 1 ? 's' : ''} trouvé{filteredActors.length !== 1 ? 's' : ''}</p>
          </div>
          
          {isAdmin && (
            <Button
              data-testid="add-actor-btn"
              onClick={() => {
                resetForm();
                setEditingActor(null);
                setShowAddDialog(true);
              }}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter un acteur
            </Button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="glass rounded-lg p-6 mb-8 bg-gray-800/60 border border-gray-600">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <Label htmlFor="actor-search" className="text-gray-200 mb-2 block font-medium">
                Rechercher un acteur
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="actor-search"
                  data-testid="actor-search-input"
                  type="text"
                  placeholder="Nom, description, film..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-700/80 border-gray-600 text-white placeholder-gray-400 focus:border-violet-400"
                />
              </div>
            </div>

            {/* Age Filter */}
            <div>
              <Label className="text-gray-200 mb-2 block font-medium">Âge</Label>
              <Select value={selectedAgeRange} onValueChange={setSelectedAgeRange}>
                <SelectTrigger className="bg-gray-700/80 border-gray-600 text-white">
                  <SelectValue placeholder="Tous les âges" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">Tous les âges</SelectItem>
                  <SelectItem value="young" className="text-white hover:bg-gray-700">Jeune (&lt; 30 ans)</SelectItem>
                  <SelectItem value="middle" className="text-white hover:bg-gray-700">Moyen (30-50 ans)</SelectItem>
                  <SelectItem value="mature" className="text-white hover:bg-gray-700">Mature (&gt; 50 ans)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Movie Count Filter */}
            <div>
              <Label className="text-gray-200 mb-2 block font-medium">Nombre de films</Label>
              <Select value={selectedMovieCount} onValueChange={setSelectedMovieCount}>
                <SelectTrigger className="bg-gray-700/80 border-gray-600 text-white">
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="few" className="text-white hover:bg-gray-700">Peu (≤ 2 films)</SelectItem>
                  <SelectItem value="moderate" className="text-white hover:bg-gray-700">Modéré (3-5 films)</SelectItem>
                  <SelectItem value="many" className="text-white hover:bg-gray-700">Beaucoup (&gt; 5 films)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Clear Filters */}
          {(searchQuery || selectedAgeRange !== 'all' || selectedMovieCount !== 'all') && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white"
              >
                <Filter className="w-4 h-4 mr-2" />
                Effacer les filtres
              </Button>
            </div>
          )}
        </div>

        {/* Actors Grid */}
        {filteredActors.length === 0 ? (
          <div className="text-center py-16">
            <UsersIcon className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Aucun acteur trouvé</h3>
            <p className="text-gray-500 mb-6">
              {actors.length === 0 
                ? "Aucun acteur n'a été ajouté pour le moment"
                : "Aucun acteur ne correspond à vos critères de recherche"
              }
            </p>
            {isAdmin && actors.length === 0 && (
              <Button
                onClick={() => {
                  resetForm();
                  setEditingActor(null);
                  setShowAddDialog(true);
                }}
                className="bg-violet-600 hover:bg-violet-700"
              >
                Ajouter le premier acteur
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
            {filteredActors.map((actor) => {
              const settings = getImageSettings(actor.id);
              return (
                <Card 
                  key={actor.id} 
                  className="actor-card card-hover bg-gray-800/60 border-gray-600 group cursor-pointer overflow-hidden"
                  onClick={() => setSelectedActor(actor)}
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-[3/4] overflow-hidden bg-gray-700">
                      {actor.image ? (
                        <>
                          <img 
                            src={actor.image} 
                            alt={actor.name}
                            className="w-full h-full object-cover transition-transform duration-300"
                            style={{
                              transform: `scale(${settings.scale / 100})`,
                              objectPosition: `${settings.positionX}% ${settings.positionY}%`
                            }}
                            onLoad={(e) => {
                              e.target.style.display = 'block';
                              e.target.nextSibling.style.display = 'none';
                            }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                            <UsersIcon className="w-12 h-12 text-gray-500" />
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <UsersIcon className="w-12 h-12 text-gray-500" />
                        </div>
                      )}
                      
                      {/* Favorite Heart */}
                      {actor.is_favorite && (
                        <div className="absolute top-2 right-2">
                          <Heart className="w-5 h-5 text-red-500 fill-current" />
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-white/30 text-white hover:bg-red-500/80 hover:border-red-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(actor.id, actor.is_favorite);
                          }}
                        >
                          <Heart className={`w-4 h-4 ${actor.is_favorite ? 'fill-current text-red-500' : ''}`} />
                        </Button>
                      </div>
                      
                      {/* Admin Controls */}
                      {isAdmin && (
                        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-white/30 text-white hover:bg-blue-500/80 p-1 h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDialog(actor);
                              }}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-red-500/30 text-red-400 hover:bg-red-500/80 p-1 h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteActor(actor.id);
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Image Controls */}
                      {isAdmin && actor.image && (
                        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black/80 rounded-lg p-2 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white">Zoom:</span>
                              <div className="flex items-center gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="p-1 h-6 w-6 text-white hover:bg-white/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateImageSettings(actor.id, { scale: Math.max(50, settings.scale - 10) });
                                  }}
                                >
                                  <ZoomOut className="w-3 h-3" />
                                </Button>
                                <span className="text-xs text-white min-w-[30px] text-center">{settings.scale}%</span>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="p-1 h-6 w-6 text-white hover:bg-white/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateImageSettings(actor.id, { scale: Math.min(200, settings.scale + 10) });
                                  }}
                                >
                                  <ZoomIn className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="p-1 h-5 w-5 text-white hover:bg-white/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateImageSettings(actor.id, { positionX: Math.max(0, settings.positionX - 10) });
                                  }}
                                >
                                  ←
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="p-1 h-5 w-5 text-white hover:bg-white/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateImageSettings(actor.id, { positionX: Math.min(100, settings.positionX + 10) });
                                  }}
                                >
                                  →
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="p-1 h-5 w-5 text-white hover:bg-white/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateImageSettings(actor.id, { positionY: Math.max(0, settings.positionY - 10) });
                                  }}
                                >
                                  ↑
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="p-1 h-5 w-5 text-white hover:bg-white/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateImageSettings(actor.id, { positionY: Math.min(100, settings.positionY + 10) });
                                  }}
                                >
                                  ↓
                                </Button>
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="p-1 h-5 w-5 text-white hover:bg-white/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  resetImageSettings(actor.id);
                                }}
                              >
                                <RotateCcw className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-3 bg-gray-800">
                      <h3 className="font-semibold text-white text-sm line-clamp-1 leading-tight">{actor.name}</h3>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Add/Edit Actor Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl bg-gray-800 border-gray-600 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">
                {editingActor ? 'Modifier l\'acteur' : 'Ajouter un nouvel acteur'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleAddActor} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-200 font-medium">Nom *</Label>
                  <Input
                    id="name"
                    data-testid="actor-name-input"
                    type="text"
                    value={newActor.name}
                    onChange={(e) => setNewActor({...newActor, name: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white focus:border-violet-400"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="age" className="text-gray-200 font-medium">Âge</Label>
                  <Input
                    id="age"
                    type="number"
                    value={newActor.age}
                    onChange={(e) => setNewActor({...newActor, age: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white focus:border-violet-400"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="image" className="text-gray-200 font-medium">Image (URL de la photo)</Label>
                <Input
                  id="image"
                  type="url"
                  value={newActor.image}
                  onChange={(e) => setNewActor({...newActor, image: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white focus:border-violet-400"
                  placeholder="https://..."
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="text-gray-200 font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={newActor.description}
                  onChange={(e) => setNewActor({...newActor, description: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white focus:border-violet-400"
                  rows={3}
                />
              </div>
              
              {/* Genres Selection - Multiple Select */}
              <div>
                <Label className="text-gray-200 font-medium">Genres</Label>
                <div className="space-y-2 mt-2">
                  {newActor.genres.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newActor.genres.map((genreId) => {
                        const genre = genres.find(g => g.id === genreId);
                        return genre ? (
                          <Badge 
                            key={genreId} 
                            variant="secondary" 
                            className="bg-violet-600/20 text-violet-300 cursor-pointer hover:bg-red-500/20 hover:text-red-300"
                            onClick={() => setNewActor({...newActor, genres: newActor.genres.filter(g => g !== genreId)})}
                          >
                            {genre.name} ×
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                  <Select 
                    value="" 
                    onValueChange={(value) => {
                      if (value && !newActor.genres.includes(value)) {
                        setNewActor({...newActor, genres: [...newActor.genres, value]});
                      }
                    }}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Sélectionner un genre" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {genres.filter(genre => !newActor.genres.includes(genre.id)).map((genre) => (
                        <SelectItem key={genre.id} value={genre.id} className="text-white hover:bg-gray-700">
                          {genre.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Movies Selection - Multiple Select */}
              <div>
                <Label className="text-gray-200 font-medium">Films</Label>
                <div className="space-y-2 mt-2">
                  {newActor.movies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newActor.movies.map((movieId) => {
                        const movie = movies.find(m => m.id === movieId);
                        return movie ? (
                          <Badge 
                            key={movieId} 
                            variant="secondary" 
                            className="bg-blue-600/20 text-blue-300 cursor-pointer hover:bg-red-500/20 hover:text-red-300"
                            onClick={() => setNewActor({...newActor, movies: newActor.movies.filter(m => m !== movieId)})}
                          >
                            {movie.title} ×
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                  <Select 
                    value="" 
                    onValueChange={(value) => {
                      if (value && !newActor.movies.includes(value)) {
                        setNewActor({...newActor, movies: [...newActor.movies, value]});
                      }
                    }}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Sélectionner un film" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-600">
                      {movies.filter(movie => !newActor.movies.includes(movie.id)).map((movie) => (
                        <SelectItem key={movie.id} value={movie.id} className="text-white hover:bg-gray-700">
                          {movie.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  className="border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                >
                  {editingActor ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Actor Detail Dialog */}
        {selectedActor && (
          <Dialog open={!!selectedActor} onOpenChange={() => setSelectedActor(null)}>
            <DialogContent className="max-w-4xl bg-gray-800 border-gray-600 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white">{selectedActor.name}</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  {selectedActor.image ? (
                    <img 
                      src={selectedActor.image} 
                      alt={selectedActor.name}
                      className="w-full rounded-lg"
                    />
                  ) : (
                    <div className="w-full aspect-[3/4] bg-gray-700 flex items-center justify-center rounded-lg">
                      <UsersIcon className="w-16 h-16 text-gray-500" />
                    </div>
                  )}
                </div>
                
                <div className="md:col-span-2 space-y-4">
                  {selectedActor.description && (
                    <p className="text-gray-200 leading-relaxed">{selectedActor.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedActor.age && (
                      <div>
                        <h4 className="font-semibold text-white mb-1">Âge</h4>
                        <p className="text-gray-300">{selectedActor.age} ans</p>
                      </div>
                    )}
                    
                    {selectedActor.genres.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-white mb-1">Genres</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedActor.genres.map((genreId) => (
                            <Badge key={genreId} variant="secondary" className="bg-violet-600/20 text-violet-300">
                              {getGenreName(genreId)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {selectedActor.movies.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-white mb-2">Filmographie</h4>
                      <div className="grid grid-cols-1 gap-2">
                        {selectedActor.movies.map((movieId) => {
                          const movie = movies.find(m => m.id === movieId);
                          return movie ? (
                            <div key={movieId} className="flex items-center gap-3 p-2 bg-gray-700/30 rounded">
                              {movie.image && (
                                <img 
                                  src={movie.image} 
                                  alt={movie.title}
                                  className="w-10 h-15 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <span className="text-gray-200 font-medium">{movie.title}</span>
                                {movie.duration && (
                                  <p className="text-sm text-gray-400">{Math.floor(movie.duration / 60)}h {movie.duration % 60}m</p>
                                )}
                              </div>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-3 pt-4">
                    <Button 
                      variant="outline"
                      onClick={() => toggleFavorite(selectedActor.id, selectedActor.is_favorite)}
                      className="border-gray-500 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      <Heart className={`w-4 h-4 mr-2 ${selectedActor.is_favorite ? 'fill-current text-red-500' : ''}`} />
                      {selectedActor.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
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

export default Actors;