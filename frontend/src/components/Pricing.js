import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PaymentModal from './PaymentModal';

const Pricing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const getPlanAmount = (plan) => {
    switch (plan) {
      case 'basic':
        return 0;
      case 'pro':
        return 29;
      case 'enterprise':
        return 99;
      default:
        return 0;
    }
  };

  const handleSelectPlan = async (plan) => {
    try {
      setSelectedPlan(plan);
      setIsLoading(true);

      if (!isAuthenticated) {
        setTimeout(() => {
          navigate('/register');
        }, 500);
        return;
      }

      // Wenn es der Basic-Plan ist, keine Zahlung erforderlich
      if (plan === 'basic') {
        setTimeout(() => {
          alert('Basic Plan erfolgreich aktiviert!');
          setIsLoading(false);
          setSelectedPlan(null);
        }, 500);
        return;
      }

      // Für Pro und Enterprise Pläne, PaymentModal öffnen
      setShowPaymentModal(true);
      setIsLoading(false);

    } catch (error) {
      console.error('Fehler bei der Planauswahl:', error);
      alert('Es gab einen Fehler bei der Planauswahl. Bitte versuchen Sie es später erneut.');
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  const handlePaymentModalClose = () => {
    setShowPaymentModal(false);
    setSelectedPlan(null);
  };

  const getPlanClasses = (plan) => {
    const baseClasses = 'relative bg-white rounded-2xl shadow-xl p-8 transform transition-all duration-300 hover:scale-105';
    const selectedClasses = selectedPlan === plan ? 'ring-4 ring-blue-500 scale-105' : '';
    const loadingClasses = isLoading && selectedPlan === plan ? 'opacity-75' : '';
    return `${baseClasses} ${selectedClasses} ${loadingClasses}`;
  };

  const getButtonClasses = (plan) => {
    const baseClasses = 'mt-8 block w-full font-medium px-6 py-3 rounded-lg transition duration-300';
    const defaultClasses = 'bg-indigo-600 text-white hover:bg-indigo-700';
    const selectedClasses = selectedPlan === plan ? 'bg-green-500 hover:bg-green-600' : defaultClasses;
    const loadingClasses = isLoading && selectedPlan === plan ? 'cursor-wait' : 'cursor-pointer';
    return `${baseClasses} ${selectedClasses} ${loadingClasses}`;
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
          <div className={getPlanClasses('basic')}>
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
              disabled={isLoading}
              className={getButtonClasses('basic')}
            >
              {isLoading && selectedPlan === 'basic' ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wird ausgewählt...
                </div>
              ) : 'Kostenlos starten'}
            </button>
          </div>

          {/* Pro Plan */}
          <div className={getPlanClasses('pro')}>
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
              disabled={isLoading}
              className={getButtonClasses('pro')}
            >
              {isLoading && selectedPlan === 'pro' ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wird ausgewählt...
                </div>
              ) : 'Pro Plan wählen'}
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className={getPlanClasses('enterprise')}>
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
              disabled={isLoading}
              className={getButtonClasses('enterprise')}
            >
              {isLoading && selectedPlan === 'enterprise' ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wird ausgewählt...
                </div>
              ) : 'Enterprise kontaktieren'}
            </button>
          </div>
        </div>
      </div>

      <PaymentModal
        visible={showPaymentModal}
        onClose={handlePaymentModalClose}
        amount={getPlanAmount(selectedPlan)}
        plan={selectedPlan}
      />
    </div>
  );
};

export default Pricing; 