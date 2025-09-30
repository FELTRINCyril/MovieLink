import React, { useState } from 'react';
import { X, Eye, EyeOff, Crown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Login = ({ onLogin, onClose }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!credentials.username.trim() || !credentials.password.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${API}/auth/login`, credentials);
      const { access_token } = response.data;
      
      // Get user info
      const userResponse = await axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      
      onLogin(userResponse.data, access_token);
      toast.success('Connexion réussie !');
    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.status === 401) {
        toast.error('Nom d\'utilisateur ou mot de passe incorrect');
      } else {
        toast.error('Erreur de connexion');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <Card className="relative z-10 w-full max-w-md bg-gray-800 border-gray-700 scale-in">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
          
          <div className="flex items-center gap-3 justify-center">
            <div className="p-2 bg-violet-600/20 rounded-lg">
              <Crown className="w-6 h-6 text-violet-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-white">
              Connexion Admin
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-300">
                Nom d'utilisateur
              </Label>
              <Input
                data-testid="login-username-input"
                id="username"
                name="username"
                type="text"
                placeholder="admin"
                value={credentials.username}
                onChange={handleInputChange}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-violet-500"
                required
                autoComplete="username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  data-testid="login-password-input"
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="admin123"
                  value={credentials.password}
                  onChange={handleInputChange}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-violet-500 pr-10"
                  required
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <div className="pt-2">
              <Button
                data-testid="login-submit-btn"
                type="submit"
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Connexion...
                  </div>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </div>
          </form>
          
          <div className="mt-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">Identifiants par défaut :</h4>
            <div className="text-sm text-gray-400 space-y-1">
              <div>Nom d'utilisateur: <code className="text-violet-400">admin</code></div>
              <div>Mot de passe: <code className="text-violet-400">admin123</code></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;