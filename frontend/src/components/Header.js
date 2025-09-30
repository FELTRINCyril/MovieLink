import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Film, Users, Crown, LogOut, Menu, X, Heart, Tag, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Header = ({ isAdmin, user, onToggleAdmin, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [selectedActor, setSelectedActor] = useState(null);
  const [actors, setActors] = useState([]);
  const location = useLocation();

  useEffect(() => {
    loadActors();
  }, []);

  const loadActors = async () => {
    try {
      const response = await axios.get(`${API}/actors`);
      setActors(response.data);
    } catch (error) {
      console.error('Error loading actors:', error);
    }
  };

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await axios.get(`${API}/search?q=${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
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

  const toggleFavorite = async (id, currentStatus, type) => {
    try {
      await axios.patch(`${API}/${type}s/${id}/favorite`);
      // Reload search results if they're displayed
      if (searchResults && searchQuery) {
        handleSearch(searchQuery);
      }
      if (type === 'actor') {
        loadActors();
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="text-2xl font-bold gradient-text hover:opacity-80 transition-opacity"
            onClick={clearSearch}
          >
            🎬 MovieHub
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8 relative">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                data-testid="search-input"
                type="text"
                placeholder="Rechercher un film ou un acteur..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400 focus:border-violet-500"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-violet-500 border-t-transparent"></div>
                </div>
              )}
            </div>
            
            {/* Search Results Dropdown */}
            {searchResults && (searchResults.movies.length > 0 || searchResults.actors.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 max-h-96 overflow-y-auto z-50">
                {searchResults.movies.length > 0 && (
                  <div className="p-3">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Films</h3>
                    {searchResults.movies.slice(0, 3).map((movie) => (
                      <div
                        key={movie.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded-md transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedMovie(movie);
                          clearSearch();
                        }}
                      >
                        {movie.image && (
                          <img src={movie.image} alt={movie.title} className="w-8 h-12 object-cover rounded" />
                        )}
                        <span className="text-white text-sm">{movie.title}</span>
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.actors.length > 0 && (
                  <div className="p-3 border-t border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Acteurs</h3>
                    {searchResults.actors.slice(0, 3).map((actor) => (
                      <div
                        key={actor.id}
                        className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded-md transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedActor(actor);
                          clearSearch();
                        }}
                      >
                        {actor.image && (
                          <img src={actor.image} alt={actor.name} className="w-8 h-8 object-cover rounded-full" />
                        )}
                        <span className="text-white text-sm">{actor.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link 
              to="/movies" 
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                isActive('/movies') 
                  ? 'bg-violet-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Film className="w-4 h-4" />
              Films
            </Link>
            
            <Link 
              to="/actors" 
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                isActive('/actors') 
                  ? 'bg-violet-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Users className="w-4 h-4" />
              Acteurs
            </Link>

            <Link 
              to="/favorites" 
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                isActive('/favorites') 
                  ? 'bg-violet-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Heart className="w-4 h-4" />
              Favoris
            </Link>

            {isAdmin && (
              <Link 
                to="/genres" 
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  isActive('/genres') 
                    ? 'bg-violet-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Tag className="w-4 h-4" />
                Genres
              </Link>
            )}

            {/* Admin Toggle */}
            <Button
              data-testid="admin-toggle-btn"
              onClick={onToggleAdmin}
              variant={isAdmin ? "default" : "outline"}
              size="sm"
              className={`flex items-center gap-2 transition-all ${
                isAdmin 
                  ? 'bg-violet-600 hover:bg-violet-700 text-white'
                  : 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {isAdmin ? (
                <>
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </>
              ) : (
                <>
                  <Crown className="w-4 h-4" />
                  Admin
                </>
              )}
            </Button>
          </nav>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700 py-4 space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
            
            {/* Mobile Navigation */}
            <div className="flex flex-col space-y-2">
              <Link 
                to="/movies" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                  isActive('/movies') 
                    ? 'bg-violet-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Film className="w-4 h-4" />
                Films
              </Link>
              
              <Link 
                to="/actors" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                  isActive('/actors') 
                    ? 'bg-violet-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Users className="w-4 h-4" />
                Acteurs
              </Link>

              <Link 
                to="/favorites" 
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                  isActive('/favorites') 
                    ? 'bg-violet-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                <Heart className="w-4 h-4" />
                Favoris
              </Link>

              {isAdmin && (
                <Link 
                  to="/genres" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                    isActive('/genres') 
                      ? 'bg-violet-600 text-white' 
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Tag className="w-4 h-4" />
                  Genres
                </Link>
              )}
              
              <Button
                onClick={() => {
                  onToggleAdmin();
                  setIsMobileMenuOpen(false);
                }}
                variant={isAdmin ? "default" : "outline"}
                className={`flex items-center gap-2 justify-start ${
                  isAdmin 
                    ? 'bg-violet-600 hover:bg-violet-700 text-white'
                    : 'border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {isAdmin ? (
                  <>
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </>
                ) : (
                  <>
                    <Crown className="w-4 h-4" />
                    Admin
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Movie Detail Modal */}
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
                  
                  {selectedMovie.genres && selectedMovie.genres.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-white mb-1">Genres</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedMovie.genres.map((genreId, index) => (
                          <Badge key={index} variant="secondary" className="bg-violet-600/20 text-violet-300">
                            Genre {genreId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedMovie.actors && selectedMovie.actors.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">Acteurs</h4>
                    <div className="space-y-2">
                      {selectedMovie.actors.map((actorId) => (
                        <div key={actorId} className="flex items-center gap-3">
                          <span className="text-gray-200">{getActorName(actorId)}</span>
                        </div>
                      ))}
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
                    onClick={() => toggleFavorite(selectedMovie.id, selectedMovie.is_favorite, 'movie')}
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

      {/* Actor Detail Modal */}
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
                    <Users className="w-16 h-16 text-gray-500" />
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
                  
                  {selectedActor.genres && selectedActor.genres.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-white mb-1">Genres</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedActor.genres.map((genreId, index) => (
                          <Badge key={index} variant="secondary" className="bg-violet-600/20 text-violet-300">
                            Genre {genreId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {selectedActor.movies && selectedActor.movies.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-white mb-2">Filmographie</h4>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedActor.movies.map((movieId, index) => (
                        <div key={index} className="flex items-center gap-3 p-2 bg-gray-700/30 rounded">
                          <span className="text-gray-200 font-medium">Film {movieId}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline"
                    onClick={() => toggleFavorite(selectedActor.id, selectedActor.is_favorite, 'actor')}
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
    </header>
  );
};

export default Header;