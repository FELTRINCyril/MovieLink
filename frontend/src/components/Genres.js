import React, { useState, useEffect } from 'react';
import { Plus, Tag, Edit, Trash2, Film, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Genres = ({ isAdmin }) => {
  const [movieGenres, setMovieGenres] = useState([]);
  const [actorGenres, setActorGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingGenre, setEditingGenre] = useState(null);
  const [activeTab, setActiveTab] = useState('movies');
  const [newGenre, setNewGenre] = useState({ name: '', type: 'movie' });

  useEffect(() => {
    if (isAdmin) {
      loadGenres();
    }
  }, [isAdmin]);

  const loadGenres = async () => {
    try {
      setLoading(true);
      const [movieGenresRes, actorGenresRes] = await Promise.all([
        axios.get(`${API}/genres?type=movie`),
        axios.get(`${API}/genres?type=actor`)
      ]);
      
      setMovieGenres(movieGenresRes.data);
      setActorGenres(actorGenresRes.data);
    } catch (error) {
      console.error('Error loading genres:', error);
      toast.error('Erreur lors du chargement des genres');
    } finally {
      setLoading(false);
    }
  };

  const handleAddGenre = async (e) => {
    e.preventDefault();
    if (!newGenre.name.trim()) {
      toast.error('Le nom du genre est obligatoire');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (editingGenre) {
        // Update existing genre (would need PUT endpoint)
        toast.info('Modification des genres non implémentée');
      } else {
        await axios.post(`${API}/genres`, newGenre, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Genre ajouté avec succès');
      }
      
      setShowAddDialog(false);
      setEditingGenre(null);
      resetForm();
      loadGenres();
    } catch (error) {
      console.error('Error saving genre:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDeleteGenre = async (genreId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce genre ?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/genres/${genreId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Genre supprimé avec succès');
      loadGenres();
    } catch (error) {
      console.error('Error deleting genre:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const resetForm = () => {
    setNewGenre({ name: '', type: 'movie' });
  };

  const openEditDialog = (genre) => {
    setEditingGenre(genre);
    setNewGenre({ name: genre.name, type: genre.type });
    setShowAddDialog(true);
  };

  // Redirect if not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Tag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-400 mb-2">Accès restreint</h2>
          <p className="text-gray-600 mb-6">Vous devez être connecté en tant qu'administrateur pour accéder à cette page</p>
          <Button onClick={() => window.location.href = '/'} className="bg-violet-600 hover:bg-violet-700">
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold gradient-text mb-2 flex items-center gap-3">
              <Tag className="w-10 h-10 text-violet-400" />
              Gestion des Genres
            </h1>
            <p className="text-gray-400">
              {movieGenres.length} genres de films et {actorGenres.length} genres d'acteurs
            </p>
          </div>
          
          <Button
            data-testid="add-genre-btn"
            onClick={() => {
              resetForm();
              setEditingGenre(null);
              setNewGenre({ name: '', type: activeTab === 'movies' ? 'movie' : 'actor' });
              setShowAddDialog(true);
            }}
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un genre
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-800 border-gray-700">
            <TabsTrigger 
              value="movies" 
              className="flex items-center gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white"
            >
              <Film className="w-4 h-4" />
              Genres de Films ({movieGenres.length})
            </TabsTrigger>
            <TabsTrigger 
              value="actors" 
              className="flex items-center gap-2 data-[state=active]:bg-violet-600 data-[state=active]:text-white"
            >
              <Users className="w-4 h-4" />
              Genres d'Acteurs ({actorGenres.length})
            </TabsTrigger>
          </TabsList>

          {/* Movie Genres Tab */}
          <TabsContent value="movies" className="space-y-6">
            {movieGenres.length === 0 ? (
              <div className="text-center py-16">
                <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Aucun genre de film</h3>
                <p className="text-gray-600 mb-6">Commencez par ajouter des genres pour classer vos films</p>
                <Button
                  onClick={() => {
                    resetForm();
                    setNewGenre({ name: '', type: 'movie' });
                    setShowAddDialog(true);
                  }}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  Ajouter le premier genre
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {movieGenres.map((genre) => (
                  <Card 
                    key={genre.id} 
                    className="bg-gray-800/50 border-gray-700 card-hover group"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-violet-600/20 rounded-lg">
                            <Film className="w-5 h-5 text-violet-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{genre.name}</h3>
                            <p className="text-sm text-gray-400">Genre de film</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 p-1 h-6 w-6"
                            onClick={() => openEditDialog(genre)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/20 p-1 h-6 w-6"
                            onClick={() => handleDeleteGenre(genre.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Actor Genres Tab */}
          <TabsContent value="actors" className="space-y-6">
            {actorGenres.length === 0 ? (
              <div className="text-center py-16">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Aucun genre d'acteur</h3>
                <p className="text-gray-600 mb-6">Commencez par ajouter des genres pour classer vos acteurs</p>
                <Button
                  onClick={() => {
                    resetForm();
                    setNewGenre({ name: '', type: 'actor' });
                    setShowAddDialog(true);
                  }}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  Ajouter le premier genre
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {actorGenres.map((genre) => (
                  <Card 
                    key={genre.id} 
                    className="bg-gray-800/50 border-gray-700 card-hover group"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-violet-600/20 rounded-lg">
                            <Users className="w-5 h-5 text-violet-400" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{genre.name}</h3>
                            <p className="text-sm text-gray-400">Genre d'acteur</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700 p-1 h-6 w-6"
                            onClick={() => openEditDialog(genre)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/20 p-1 h-6 w-6"
                            onClick={() => handleDeleteGenre(genre.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Add/Edit Genre Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-md bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingGenre ? 'Modifier le genre' : 'Ajouter un nouveau genre'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleAddGenre} className="space-y-4">
              <div>
                <Label htmlFor="genre-name" className="text-gray-300">Nom du genre *</Label>
                <Input
                  id="genre-name"
                  data-testid="genre-name-input"
                  type="text"
                  value={newGenre.name}
                  onChange={(e) => setNewGenre({...newGenre, name: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Ex: Action, Comédie, Drame..."
                  required
                />
              </div>
              
              <div>
                <Label className="text-gray-300">Type de genre</Label>
                <Select 
                  value={newGenre.type} 
                  onValueChange={(value) => setNewGenre({...newGenre, type: value})}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="movie" className="text-white">
                      <div className="flex items-center gap-2">
                        <Film className="w-4 h-4" />
                        Genre de film
                      </div>
                    </SelectItem>
                    <SelectItem value="actor" className="text-white">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Genre d'acteur
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
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
                  {editingGenre ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Genres;