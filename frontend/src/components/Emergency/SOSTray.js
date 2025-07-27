import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CompassRoseEmergency from '../Book/CompassRoseEmergency';
import axios from 'axios';

const SOSTray = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentTool, setCurrentTool] = useState('main');
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [statuteSearch, setStatuteSearch] = useState('');
  const [statuteResults, setStatuteResults] = useState([]);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  useEffect(() => {
    if (isOpen) {
      loadEmergencyContacts();
      getCurrentLocation();
    }
  }, [isOpen]);

  const loadEmergencyContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/emergency/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmergencyContacts(response.data.data || []);
    } catch (error) {
      console.error('Failed to load emergency contacts:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Failed to get location:', error);
        }
      );
    }
  };

  const searchStatutes = async (query) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/statutes/search`, {
        params: { query, limit: 5 },
        headers: { Authorization: `Bearer ${token}` }
      });
      setStatuteResults(response.data.data || []);
    } catch (error) {
      console.error('Failed to search statutes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const askAI = async (query) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/ai/emergency-query`, {
        message: query,
        location: location,
        is_emergency: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiResponse(response.data.data.response);
    } catch (error) {
      console.error('Failed to get AI response:', error);
      setAiResponse('I apologize, but I cannot process your request right now. Please contact emergency services if this is urgent.');
    } finally {
      setIsLoading(false);
    }
  };

  const alertContacts = async (message) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/emergency/alert`, {
        message,
        location,
        alert_type: 'emergency',
        priority_level: 5
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Emergency contacts have been notified!');
    } catch (error) {
      console.error('Failed to alert contacts:', error);
      alert('Failed to send alerts. Please contact emergency services directly.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderMainTray = () => (
    <div className="p-6">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">🚨</div>
        <h2 className="text-2xl font-bold text-red-800 mb-2">Emergency SOS Tray</h2>
        <p className="text-red-600">Quick access to critical legal tools</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Statute Search Tool */}
        <button
          onClick={() => setCurrentTool('statutes')}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
        >
          <div className="flex items-center">
            <div className="text-3xl mr-4">📚</div>
            <div className="text-left">
              <h3 className="font-bold text-lg">Statute Search</h3>
              <p className="text-blue-100 text-sm">Find relevant laws quickly</p>
            </div>
          </div>
        </button>

        {/* AI Emergency Assistant */}
        <button
          onClick={() => setCurrentTool('ai')}
          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all shadow-lg"
        >
          <div className="flex items-center">
            <div className="text-3xl mr-4">🤖</div>
            <div className="text-left">
              <h3 className="font-bold text-lg">AI Emergency Assistant</h3>
              <p className="text-purple-100 text-sm">Get instant legal guidance</p>
            </div>
          </div>
        </button>

        {/* Emergency Contacts */}
        <button
          onClick={() => setCurrentTool('contacts')}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg"
        >
          <div className="flex items-center">
            <div className="text-3xl mr-4">📞</div>
            <div className="text-left">
              <h3 className="font-bold text-lg">Alert Contacts</h3>
              <p className="text-green-100 text-sm">Notify your emergency circle</p>
            </div>
          </div>
        </button>
      </div>

      {/* Location Status */}
      {location && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center text-yellow-800">
            <span className="mr-2">📍</span>
            <span className="text-sm">Location enabled for emergency services</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderStatuteTool = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-blue-800">📚 Statute Search</h2>
        <button
          onClick={() => setCurrentTool('main')}
          className="text-blue-600 hover:text-blue-800"
        >
          ← Back
        </button>
      </div>

      <div className="mb-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={statuteSearch}
            onChange={(e) => setStatuteSearch(e.target.value)}
            placeholder="Search for relevant laws..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && searchStatutes(statuteSearch)}
          />
          <button
            onClick={() => searchStatutes(statuteSearch)}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? '...' : 'Search'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {statuteResults.map((statute) => (
          <div key={statute.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-bold text-gray-800 mb-2">{statute.title}</h3>
            <p className="text-gray-600 text-sm mb-2">{statute.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">{statute.state} • {statute.category}</span>
              <button
                onClick={() => navigate(`/statutes/${statute.id}`)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View Details →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAITool = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-purple-800">🤖 AI Emergency Assistant</h2>
        <button
          onClick={() => setCurrentTool('main')}
          className="text-purple-600 hover:text-purple-800"
        >
          ← Back
        </button>
      </div>

      <div className="mb-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="Ask about your rights in this situation..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            onKeyPress={(e) => e.key === 'Enter' && askAI(aiQuery)}
          />
          <button
            onClick={() => askAI(aiQuery)}
            disabled={isLoading}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isLoading ? '...' : 'Ask'}
          </button>
        </div>
      </div>

      {aiResponse && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-bold text-purple-800 mb-2">AI Response:</h3>
          <p className="text-purple-700 whitespace-pre-wrap">{aiResponse}</p>
        </div>
      )}

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center text-yellow-800">
          <span className="mr-2">⚠️</span>
          <span className="text-sm">Emergency mode: Educational information only. Contact emergency services for immediate help.</span>
        </div>
      </div>
    </div>
  );

  const renderContactsTool = () => (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-green-800">📞 Emergency Contacts</h2>
        <button
          onClick={() => setCurrentTool('main')}
          className="text-green-600 hover:text-green-800"
        >
          ← Back
        </button>
      </div>

      <div className="mb-4">
        <button
          onClick={() => alertContacts('Emergency situation - please contact me immediately')}
          disabled={isLoading || emergencyContacts.length === 0}
          className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Sending Alerts...' : '🚨 Send Emergency Alert'}
        </button>
      </div>

      <div className="space-y-3">
        {emergencyContacts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No emergency contacts configured.</p>
            <button
              onClick={() => navigate('/emergency-contacts')}
              className="mt-2 text-blue-600 hover:text-blue-800"
            >
              Add Emergency Contacts →
            </button>
          </div>
        ) : (
          emergencyContacts.map((contact) => (
            <div key={contact.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-800">{contact.name}</h3>
                  <p className="text-gray-600 text-sm">{contact.relationship}</p>
                  <p className="text-gray-600 text-sm">{contact.phone_number}</p>
                </div>
                <div className="flex space-x-2">
                  <a
                    href={`tel:${contact.phone_number}`}
                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                  >
                    Call
                  </a>
                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                    >
                      Email
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-200 p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Emergency SOS</h1>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-gray-800 text-2xl"
          >
            ×
          </button>
        </div>
        
        {currentTool === 'main' && renderMainTray()}
        {currentTool === 'statutes' && renderStatuteTool()}
        {currentTool === 'ai' && renderAITool()}
        {currentTool === 'contacts' && renderContactsTool()}
      </div>
    </div>
  );
};

export default SOSTray;