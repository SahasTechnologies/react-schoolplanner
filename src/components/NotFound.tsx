import React from "react";

const NotFound: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
    <h1 className="text-8xl font-extrabold mb-4">404</h1>
    <h2 className="text-3xl font-bold mb-2">Page Not Found</h2>
    <p className="text-lg opacity-70 mb-8">The page you are looking for does not exist.</p>
    <a href="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-full text-white font-semibold transition">Go Home</a>
  </div>
);

export default NotFound; 