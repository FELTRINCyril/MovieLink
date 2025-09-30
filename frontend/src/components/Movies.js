import React from 'react';
import { Film } from 'lucide-react';

const Movies = ({ isAdmin }) => {
  return (
    <div className="min-h-screen py-8 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-400 mb-2">Page Films</h2>
            <p className="text-gray-600">Cette page sera développée dans la prochaine étape</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Movies;