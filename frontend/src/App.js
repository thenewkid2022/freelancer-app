import React, { useState } from 'react';
import './App.css';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  createRoutesFromElements,
  createBrowserRouter,
  RouterProvider,
  Outlet
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import Login from './components/Login';
import Register from './components/Register';
import TimeTracker from './components/TimeTracker';
import TimeEntriesList from './components/TimeEntriesList';
import EnhancedTimeStatistics from './components/EnhancedTimeStatistics';
import UserProfile from './components/UserProfile';

// Geschützte Route
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Layout-Komponente
const Layout = () => {
  const handleTimeEntrySaved = () => {
    // Hier können wir später eine Aktualisierung der Zeiteinträge implementieren
    console.log('Zeiteintrag wurde gespeichert');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Outlet context={{ onTimeEntrySaved: handleTimeEntrySaved }} />
      </main>
    </div>
  );
};

function App() {
  const [refreshStats, setRefreshStats] = useState(0);

  // Handler, der nach jeder Änderung an den Einträgen aufgerufen wird
  const handleEntriesChanged = () => setRefreshStats(r => r + 1);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <RouterProvider router={createBrowserRouter(
          createRoutesFromElements(
            <Route element={<Layout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <TimeTracker onTimeEntrySaved={handleEntriesChanged} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/entries"
                element={
                  <ProtectedRoute>
                    <TimeEntriesList refresh={refreshStats} onEntryUpdated={handleEntriesChanged} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/statistics"
                element={
                  <ProtectedRoute>
                    <EnhancedTimeStatistics refresh={refreshStats} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                }
              />
            </Route>
          ),
          {
            future: {
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }
          }
        )} />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;