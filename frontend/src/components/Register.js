import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        email,
        password,
      });

      setMessage('Erfolgreich registriert! Sie werden zur Anmeldung weitergeleitet.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Fehler bei der Registrierung');
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
        Registrierung
      </h2>
      {message && (
        <p className="text-center text-red-500 mb-4">{message}</p>
      )}
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">E-Mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Passwort</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded-lg"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
        >
          Registrieren
        </button>
      </form>
      <p className="mt-4 text-center text-gray-600">
        Bereits registriert?{' '}
        <Link to="/login" className="text-blue-500 hover:underline">
          Anmelden
        </Link>
      </p>
    </div>
  );
};

export default Register; 