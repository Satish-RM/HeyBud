import React from 'react';
import { Link } from 'react-router-dom';

const SettingsPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">Settings</h1>
      <Link to="/dashboard" className="mb-4 inline-block px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
        Back to Dashboard
      </Link>
      <div className="p-4 bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Settings</h2>
        <p>Budget Timing: [Placeholder for setting weekly budget time]</p>
      </div>
    </div>
  );
};

export default SettingsPage;