import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';
import TimeTracker from './components/TimeTracker';
import Login from './components/Login';
import Register from './components/Register';
import Navigation from './components/Navigation';
import UserProfile from './components/UserProfile';
import TimeStatistics from './components/TimeStatistics';
import { AuthProvider, useAuth } from './context/AuthContext';
import EnhancedTimeStatistics from './components/EnhancedTimeStatistics';

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="App">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {isAuthenticated ? (
          <>
            <TimeTracker />
            <UserProfile />
            <TimeStatistics />
            <EnhancedTimeStatistics />
          </>
        ) : (
          <Login />
        )}
      </div>
    </div>
  );
}

const AppWrapper = () => {
  return (
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  );
};

export default AppWrapper; 