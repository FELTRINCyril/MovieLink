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
                      <Link
                        key={movie.id}
                        to="/movies"
                        onClick={clearSearch}
                        className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded-md transition-colors"
                      >
                        {movie.image && (
                          <img src={movie.image} alt={movie.title} className="w-8 h-12 object-cover rounded" />
                        )}
                        <span className="text-white text-sm">{movie.title}</span>
                      </Link>
                    ))}
                  </div>
                )}
                {searchResults.actors.length > 0 && (
                  <div className="p-3 border-t border-gray-700">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">Acteurs</h3>
                    {searchResults.actors.slice(0, 3).map((actor) => (
                      <Link
                        key={actor.id}
                        to="/actors"
                        onClick={clearSearch}
                        className="flex items-center gap-3 p-2 hover:bg-gray-700 rounded-md transition-colors"
                      >
                        {actor.image && (
                          <img src={actor.image} alt={actor.name} className="w-8 h-8 object-cover rounded-full" />
                        )}
                        <span className="text-white text-sm">{actor.name}</span>
                      </Link>
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
    </header>
  );
};

export default Header;