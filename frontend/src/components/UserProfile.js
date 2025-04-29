import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { ClipLoader } from 'react-spinners';
import 'react-toastify/dist/ReactToastify.css';
import api from '../services/api';

const UserProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Benutzerdaten laden
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/api/auth/profile');
        setUserData(prev => ({
          ...prev,
          name: response.data.name || '',
          email: response.data.email || ''
        }));
      } catch (error) {
        toast.error('Fehler beim Laden der Benutzerdaten');
        console.error('Fehler beim Laden der Benutzerdaten:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Profil aktualisieren
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put('/api/auth/profile', {
        name: userData.name,
        email: userData.email
      });
      toast.success('Profil erfolgreich aktualisiert');
    } catch (error) {
      toast.error('Fehler beim Aktualisieren des Profils');
      console.error('Fehler beim Aktualisieren des Profils:', error);
    } finally {
      setSaving(false);
    }
  };

  // Passwort ändern
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (userData.newPassword !== userData.confirmPassword) {
      toast.error('Die Passwörter stimmen nicht überein');
      return;
    }

    setSaving(true);

    try {
      await api.put('/auth/change-password', {
        currentPassword: userData.currentPassword,
        newPassword: userData.newPassword
      });
      toast.success('Passwort erfolgreich geändert');
      setUserData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      toast.error('Fehler beim Ändern des Passworts');
      console.error('Fehler beim Ändern des Passworts:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <ClipLoader color="#3B82F6" size={50} />
      </div>
    );
  }

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 max-w-2xl mx-auto">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        Benutzerprofil
      </h2>

      {/* Profilinformationen */}
      <form onSubmit={handleUpdateProfile} className="space-y-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={userData.name}
            onChange={(e) => setUserData({ ...userData, name: e.target.value })}
            className="w-full p-2 border rounded-lg"
            placeholder="Ihr Name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            E-Mail
          </label>
          <input
            type="email"
            value={userData.email}
            onChange={(e) => setUserData({ ...userData, email: e.target.value })}
            className="w-full p-2 border rounded-lg"
            placeholder="Ihre E-Mail"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300"
        >
          {saving ? <ClipLoader color="#ffffff" size={20} /> : 'Profil speichern'}
        </button>
      </form>

      {/* Passwort ändern */}
      <form onSubmit={handleChangePassword} className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          Passwort ändern
        </h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Aktuelles Passwort
          </label>
          <input
            type="password"
            value={userData.currentPassword}
            onChange={(e) => setUserData({ ...userData, currentPassword: e.target.value })}
            className="w-full p-2 border rounded-lg"
            placeholder="Aktuelles Passwort"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Neues Passwort
          </label>
          <input
            type="password"
            value={userData.newPassword}
            onChange={(e) => setUserData({ ...userData, newPassword: e.target.value })}
            className="w-full p-2 border rounded-lg"
            placeholder="Neues Passwort"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Neues Passwort bestätigen
          </label>
          <input
            type="password"
            value={userData.confirmPassword}
            onChange={(e) => setUserData({ ...userData, confirmPassword: e.target.value })}
            className="w-full p-2 border rounded-lg"
            placeholder="Neues Passwort bestätigen"
          />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors disabled:bg-green-300"
        >
          {saving ? <ClipLoader color="#ffffff" size={20} /> : 'Passwort ändern'}
        </button>
      </form>
    </div>
  );
};

export default UserProfile; 