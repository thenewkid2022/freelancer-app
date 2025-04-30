import React, { useState, useEffect } from 'react';
import { aiService } from '../services/aiService';

const AIFeatures = ({ projectInfo, onSuggestionAccepted }) => {
  const [suggestions, setSuggestions] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    if (isEnabled && projectInfo.description) {
      analyzeDescription(projectInfo.description);
    }
  }, [projectInfo.description, isEnabled]);

  const analyzeDescription = async (description) => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await aiService.analyzeActivity(description);
      setSuggestions(result);
    } catch (err) {
      setError('Fehler bei der KI-Analyse');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionAccept = (suggestion) => {
    onSuggestionAccepted(suggestion);
  };

  if (!isEnabled) return null;

  return (
    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">KI-Vorschläge</h3>
        <button
          onClick={() => setIsEnabled(false)}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Deaktivieren
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm mb-2">
          {error}
        </div>
      )}

      {suggestions && !isLoading && (
        <div className="space-y-3">
          {suggestions.categories && (
            <div>
              <h4 className="text-sm font-medium text-gray-700">Vorgeschlagene Kategorien:</h4>
              <div className="flex flex-wrap gap-2 mt-1">
                {suggestions.categories.map((category, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionAccept({ type: 'category', value: category })}
                    className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          )}

          {suggestions.tags && (
            <div>
              <h4 className="text-sm font-medium text-gray-700">Empfohlene Tags:</h4>
              <div className="flex flex-wrap gap-2 mt-1">
                {suggestions.tags.map((tag, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionAccept({ type: 'tag', value: tag })}
                    className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {suggestions.similarProjects && (
            <div>
              <h4 className="text-sm font-medium text-gray-700">Ähnliche Projekte:</h4>
              <div className="mt-1 space-y-1">
                {suggestions.similarProjects.map((project, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionAccept({ type: 'project', value: project })}
                    className="block w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  >
                    {project.name} ({project.similarity}% Übereinstimmung)
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIFeatures; 