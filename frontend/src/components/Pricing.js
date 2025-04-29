import React from 'react';
import { useNavigate } from 'react-router-dom';

const Pricing = () => {
  const navigate = useNavigate();

  const handleSelectPlan = (plan) => {
    // Hier könnte später die Logik für die Planauswahl implementiert werden
    console.log(`Selected plan: ${plan}`);
    navigate('/register');
  };

  return (
    <div className="bg-gray-100 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Wählen Sie Ihren Plan
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Einfache, transparente Preise für jede Unternehmensgröße
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3 lg:gap-x-8">
          {/* Basic Plan */}
          <div className="relative bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <h3 className="text-2xl font-medium text-gray-900">Basic</h3>
              <p className="mt-4 text-5xl font-extrabold text-gray-900">
                CHF 0
                <span className="text-xl font-medium text-gray-500">/Monat</span>
              </p>
            </div>
            <div className="mt-8">
              <ul className="space-y-4">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-700">Zeiterfassung für 1 Benutzer</span>
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-700">Basis Statistiken</span>
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-700">7 Tage Verlauf</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan('basic')}
              className="mt-8 block w-full bg-indigo-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-indigo-700 transition duration-150"
            >
              Kostenlos starten
            </button>
          </div>

          {/* Pro Plan */}
          <div className="relative bg-white rounded-2xl shadow-xl p-8 border-2 border-indigo-500">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2">
              <span className="inline-flex rounded-full bg-indigo-600 px-4 py-1 text-sm font-semibold text-white">
                Beliebt
              </span>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-medium text-gray-900">Pro</h3>
              <p className="mt-4 text-5xl font-extrabold text-gray-900">
                CHF 29
                <span className="text-xl font-medium text-gray-500">/Monat</span>
              </p>
            </div>
            <div className="mt-8">
              <ul className="space-y-4">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-700">Zeiterfassung für 5 Benutzer</span>
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-700">Erweiterte Statistiken</span>
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-700">30 Tage Verlauf</span>
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-700">Projektverteilung</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan('pro')}
              className="mt-8 block w-full bg-indigo-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-indigo-700 transition duration-150"
            >
              Pro Plan wählen
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="relative bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center">
              <h3 className="text-2xl font-medium text-gray-900">Enterprise</h3>
              <p className="mt-4 text-5xl font-extrabold text-gray-900">
                CHF 99
                <span className="text-xl font-medium text-gray-500">/Monat</span>
              </p>
            </div>
            <div className="mt-8">
              <ul className="space-y-4">
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-700">Unbegrenzte Benutzer</span>
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-700">Alle Pro Features</span>
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-700">Unbegrenzter Verlauf</span>
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-700">Premium Support</span>
                </li>
                <li className="flex items-center">
                  <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="ml-3 text-gray-700">API Zugang</span>
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleSelectPlan('enterprise')}
              className="mt-8 block w-full bg-indigo-600 text-white font-medium px-6 py-3 rounded-lg hover:bg-indigo-700 transition duration-150"
            >
              Enterprise kontaktieren
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing; 