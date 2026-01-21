import React from 'react';
import './App.css';
import Home from './pages/Home';
import HubProvider from './context/HubProvider';

function App() {
  return (
    <HubProvider>
      <div className="min-h-screen bg-gray-50">
        <Home />
      </div>
    </HubProvider>
  );
}

export default App;
