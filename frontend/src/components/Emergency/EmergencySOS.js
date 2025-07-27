import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import CompassRoseEmergency from '../Book/CompassRoseEmergency';
import axios from 'axios';

const EmergencySOS = () => {
  const { user } = useAuth();
  const [isSOSOpen, setIsSOSOpen] = useState(false);
  const [showCompassRose, setShowCompassRose] = useState(false);
  const [sosStep, setSOSStep] = useState('main'); // main, contacts, alert, confirmation
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [quickTools, setQuickTools] = useState([]);
  const [activeAlert, setActiveAlert] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [alertForm, setAlertForm] = useState({
    alert_type: 'general_emergency',
    description: '',
    priority_level: 3
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  // Emergency alert types
  const emergencyTypes = [
    { value: 'police_encounter', label: 'Police Encounter', icon: '👮', color: 'bg-red-500' },
    { value: 'ice_encounter', label: 'ICE Encounter', icon: '🛡️', color: 'bg-orange-500' },
    { value: 'arrest', label: 'Arrest', icon: '⚖️', color: 'bg-red-600' },
    { value: 'detention', label: 'Detention', icon: '🔒', color: 'bg-red-600' },
    { value: 'traffic_stop', label: 'Traffic Stop', icon: '🚗', color: 'bg-yellow-500' },
    { value: 'search', label: 'Search', icon: '🔍', color: 'bg-blue-500' },
    { value: 'housing_emergency', label: 'Housing Emergency', icon: '🏠', color: 'bg-purple-500' },
    { value: 'workplace_emergency', label: 'Workplace Emergency', icon: '🏢', color: 'bg-green-500' },
    { value: 'general_emergency', label: 'General Emergency', icon: '🚨', color: 'bg-gray-500' }
  ];

  useEffect(() => {
    if (isSOSOpen) {
      loadEmergencyData();
      getCurrentLocation();
    }
  }, [isSOSOpen]);

  const loadEmergencyData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Load emergency contacts
      const contactsResponse = await axios.get(`${API}/emergency/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmergencyContacts(contactsResponse.data.data || []);

      // Load quick access tools
      const toolsResponse = await axios.get(`${API}/emergency/quick-tools`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuickTools(toolsResponse.data.data || []);
    } catch (error) {
      console.error('Failed to load emergency data:', error);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date().toISOString()
          });
        },
        (error) => {
          console.error('Failed to get location:', error);
        }
      );
    }
  };

  const handleEmergencyAlert = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const alertData = {
        ...alertForm,
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: location.timestamp
        } : null
      };

      const response = await axios.post(`${API}/emergency/alert`, alertData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setActiveAlert(response.data.data);
      setSOSStep('confirmation');
    } catch (error) {
      console.error('Failed to create emergency alert:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickTool = async (tool) => {
    try {
      const token = localStorage.getItem('token');
      
      switch (tool.tool_type) {
        case 'rights_script':
          // Navigate to AI chat with emergency mode
          window.location.href = `/ai-chat?emergency=true&script=${tool.action_data.scripts[0]}`;
          break;
        case 'statute_search':
          // Navigate to statute lookup with emergency categories
          window.location.href = `/statutes?emergency=true&category=${tool.action_data.categories[0]}`;
          break;
        case 'ai_chat':
          // Navigate to AI chat with emergency mode
          window.location.href = `/ai-chat?emergency=true`;
          break;
        case 'contact_alert':
          // Start emergency alert process
          setSOSStep('alert');
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Failed to handle quick tool:', error);
    }
  };

  const renderSOSButton = () => (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setShowCompassRose(true)}
        className="bg-red-600 hover:bg-red-700 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 animate-pulse"
        title="Emergency Toolkit"
      >
        <span className="text-2xl">🧭</span>
      </button>
    </div>
  );

  const renderMainSOS = () => (
    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🚨</div>
        <h2 className="text-2xl font-bold text-gray-800">Emergency SOS</h2>
        <p className="text-gray-600 mt-2">Quick access to emergency legal tools</p>
      </div>

      <div className="space-y-4">
        {quickTools.map((tool, index) => (
          <button
            key={index}
            onClick={() => handleQuickTool(tool)}
            className="w-full bg-gray-50 hover:bg-gray-100 rounded-lg p-4 flex items-center space-x-3 transition-colors"
          >
            <div className="text-2xl">{tool.icon}</div>
            <div className="text-left">
              <div className="font-medium text-gray-800">{tool.title}</div>
              <div className="text-sm text-gray-600">{tool.description}</div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={() => setSOSStep('alert')}
          className="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-3 px-4 flex items-center justify-center space-x-2 transition-colors"
        >
          <span>📞</span>
          <span className="font-medium">Send Emergency Alert</span>
        </button>
      </div>
    </div>
  );

  const renderAlertForm = () => (
    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🚨</div>
        <h2 className="text-2xl font-bold text-gray-800">Emergency Alert</h2>
        <p className="text-gray-600 mt-2">Your contacts will be notified immediately</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Emergency Type
          </label>
          <select
            value={alertForm.alert_type}
            onChange={(e) => setAlertForm({ ...alertForm, alert_type: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            {emergencyTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Priority Level
          </label>
          <select
            value={alertForm.priority_level}
            onChange={(e) => setAlertForm({ ...alertForm, priority_level: parseInt(e.target.value) })}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value={1}>🟢 Low</option>
            <option value={2}>🟡 Medium</option>
            <option value={3}>🟠 High</option>
            <option value={4}>🔴 Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={alertForm.description}
            onChange={(e) => setAlertForm({ ...alertForm, description: e.target.value })}
            placeholder="Describe the situation..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            rows="3"
          />
        </div>

        {location && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center text-green-700">
              <span className="mr-2">📍</span>
              <span className="text-sm">Location detected and will be shared</span>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-blue-700 text-sm">
            <span className="font-medium">Emergency Contacts:</span> {emergencyContacts.length} contacts will be notified
          </div>
        </div>
      </div>

      <div className="mt-6 flex space-x-3">
        <button
          onClick={() => setSOSStep('main')}
          className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg py-3 px-4 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleEmergencyAlert}
          disabled={isLoading}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-3 px-4 flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <span>🚨</span>
              <span>Send Alert</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderConfirmation = () => (
    <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">✅</div>
        <h2 className="text-2xl font-bold text-green-800">Alert Sent!</h2>
        <p className="text-gray-600 mt-2">Your emergency contacts have been notified</p>
      </div>

      {activeAlert && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="font-medium text-green-800 mb-2">
              {activeAlert.contacts_notified_count} contacts notified
            </div>
            <div className="text-sm text-green-700">
              Alert ID: {activeAlert.alert.id.slice(-8)}
            </div>
          </div>

          {activeAlert.emergency_response && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="font-medium text-blue-800 mb-2">Legal Guidance:</div>
              <div className="text-sm text-blue-700">
                {activeAlert.emergency_response.legal_guidance}
              </div>
            </div>
          )}

          {activeAlert.emergency_response?.emergency_scripts && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="font-medium text-yellow-800 mb-2">Emergency Scripts:</div>
              <div className="space-y-1">
                {activeAlert.emergency_response.emergency_scripts.map((script, index) => (
                  <div key={index} className="text-sm text-yellow-700 bg-yellow-100 rounded px-2 py-1">
                    "{script}"
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 space-y-3">
        <button
          onClick={() => {
            setIsSOSOpen(false);
            setSOSStep('main');
            setActiveAlert(null);
          }}
          className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg py-3 px-4 transition-colors"
        >
          Close
        </button>
        
        <button
          onClick={() => setSOSStep('alert')}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-lg py-3 px-4 transition-colors"
        >
          Send Another Alert
        </button>
      </div>
    </div>
  );

  const renderSOSModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setIsSOSOpen(false)}
          className="absolute top-4 right-4 z-10 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
        >
          ✕
        </button>
        
        {sosStep === 'main' && renderMainSOS()}
        {sosStep === 'alert' && renderAlertForm()}
        {sosStep === 'confirmation' && renderConfirmation()}
      </div>
    </div>
  );

  return (
    <>
      {renderSOSButton()}
      {isSOSOpen && renderSOSModal()}
    </>
  );
};

export default EmergencySOS;