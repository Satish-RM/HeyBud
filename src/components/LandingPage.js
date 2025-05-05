import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4 text-center text-blue-600">HeyBud Login</h1>
      <button
        onClick={() => navigate('/dashboard')}
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Sign In (Demo)
      </button>
    </div>
  );
};

export default LandingPage;