import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Components
import Header from './components/Header';
import Home from './components/Home';
import Movies from './components/Movies';
import Actors from './components/Actors';
import Favorites from './components/Favorites';
import Genres from './components/Genres';
import Login from './components/Login';
import { Toaster } from './components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize data and check authentication
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize sample data
      await axios.post(`${API}/init-data`);
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await axios.get(`${API}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUser(response.data);
          setIsAdmin(true);
        } catch (error) {
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, token) => {
    setUser(userData);
    setIsAdmin(true);
    setShowLogin(false);
    localStorage.setItem('token', token);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAdmin(false);
    localStorage.removeItem('token');
  };

  const toggleAdminMode = () => {
    if (isAdmin && user) {
      handleLogout();
    } else {
      setShowLogin(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="App min-h-screen bg-gray-900 text-white">
        <Header 
          isAdmin={isAdmin} 
          user={user}
          onToggleAdmin={toggleAdminMode}
          onLogout={handleLogout}
        />
        
        <main>
          <Routes>
            <Route path="/" element={<Home isAdmin={isAdmin} />} />
            <Route path="/movies" element={<Movies isAdmin={isAdmin} />} />
            <Route path="/actors" element={<Actors isAdmin={isAdmin} />} />
            <Route path="/favorites" element={<Favorites isAdmin={isAdmin} />} />
            <Route path="/genres" element={<Genres isAdmin={isAdmin} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {showLogin && (
          <Login 
            onLogin={handleLogin}
            onClose={() => setShowLogin(false)}
          />
        )}
        
        <Toaster />
      </div>
    </BrowserRouter>
  );
}

export default App;