import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const ProtectionTypeSetup = ({ onComplete }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    primary_protection_type: '',
    secondary_protection_types: [],
    location_state: '',
    location_city: '',
    specific_concerns: [],
    notification_preferences: {
      push_notifications: true,
      email_updates: true,
      sms_alerts: false
    }
  });
  const [loading, setLoading] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  const protectionTypes = [
    { 
      id: 'undocumented',
      label: 'I\'m undocumented',
      description: 'Immigration rights and protections',
      icon: '📄',
      color: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    { 
      id: 'renter',
      label: 'I rent',
      description: 'Tenant rights and housing protections',
      icon: '🏠',
      color: 'bg-green-100 text-green-800 border-green-300'
    },
    { 
      id: 'protester',
      label: 'I protest',
      description: 'First Amendment and protest rights',
      icon: '✊',
      color: 'bg-red-100 text-red-800 border-red-300'
    },
    { 
      id: 'student',
      label: 'I\'m a student',
      description: 'Student rights and campus protections',
      icon: '🎓',
      color: 'bg-purple-100 text-purple-800 border-purple-300'
    },
    { 
      id: 'worker',
      label: 'I\'m a worker',
      description: 'Labor rights and workplace protections',
      icon: '👷',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    },
    { 
      id: 'lgbtq',
      label: 'I\'m LGBTQ+',
      description: 'LGBTQ+ rights and discrimination protections',
      icon: '🏳️‍🌈',
      color: 'bg-pink-100 text-pink-800 border-pink-300'
    },
    { 
      id: 'disabled',
      label: 'I have a disability',
      description: 'Disability rights and accessibility protections',
      icon: '♿',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-300'
    },
    { 
      id: 'parent',
      label: 'I\'m a parent',
      description: 'Family rights and parental protections',
      icon: '👨‍👩‍👧‍👦',
      color: 'bg-orange-100 text-orange-800 border-orange-300'
    },
    { 
      id: 'senior',
      label: 'I\'m a senior',
      description: 'Senior rights and age-related protections',
      icon: '👴',
      color: 'bg-gray-100 text-gray-800 border-gray-300'
    },
    { 
      id: 'general',
      label: 'General legal education',
      description: 'Broad legal knowledge and protections',
      icon: '⚖️',
      color: 'bg-sage-100 text-sage-800 border-sage-300'
    }
  ];

  const commonConcerns = {
    undocumented: ['ICE encounters', 'Work authorization', 'Family separation', 'Deportation'],
    renter: ['Eviction notices', 'Security deposits', 'Maintenance issues', 'Rent increases'],
    protester: ['Arrest during protests', 'Permit requirements', 'Police encounters', 'Free speech zones'],
    student: ['Campus discipline', 'Student loans', 'Housing issues', 'Academic freedom'],
    worker: ['Wage theft', 'Workplace harassment', 'Union rights', 'Wrongful termination'],
    lgbtq: ['Discrimination', 'Healthcare access', 'Housing discrimination', 'Identity documents'],
    disabled: ['ADA compliance', 'Accommodation requests', 'Discrimination', 'Accessibility'],
    parent: ['Custody issues', 'School rights', 'Family benefits', 'Child protection'],
    senior: ['Medicare/Medicaid', 'Elder abuse', 'Social Security', 'Healthcare decisions'],
    general: ['Contract disputes', 'Consumer rights', 'Traffic violations', 'Legal documents']
  };

  const US_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming'
  ];

  const handlePrimaryTypeSelect = (typeId) => {
    setFormData(prev => ({
      ...prev,
      primary_protection_type: typeId,
      specific_concerns: []
    }));
  };

  const handleSecondaryTypeToggle = (typeId) => {
    setFormData(prev => ({
      ...prev,
      secondary_protection_types: prev.secondary_protection_types.includes(typeId)
        ? prev.secondary_protection_types.filter(id => id !== typeId)
        : [...prev.secondary_protection_types, typeId]
    }));
  };

  const handleConcernToggle = (concern) => {
    setFormData(prev => ({
      ...prev,
      specific_concerns: prev.specific_concerns.includes(concern)
        ? prev.specific_concerns.filter(c => c !== concern)
        : [...prev.specific_concerns, concern]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/personalization/setup-profile`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        onComplete();
      }
    } catch (error) {
      console.error('Failed to set up protection profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">What's your main concern?</h2>
        <p className="text-gray-600">Help us personalize your legal education experience</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {protectionTypes.map(type => (
          <button
            key={type.id}
            onClick={() => handlePrimaryTypeSelect(type.id)}
            className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
              formData.primary_protection_type === type.id
                ? `${type.color} border-opacity-100`
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{type.icon}</span>
              <div className="text-left">
                <div className="font-medium">{type.label}</div>
                <div className="text-sm opacity-75">{type.description}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      <div className="flex justify-center">
        <button
          onClick={() => setStep(2)}
          disabled={!formData.primary_protection_type}
          className="bg-sage-600 hover:bg-sage-700 text-white rounded-lg py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Any additional areas of interest?</h2>
        <p className="text-gray-600">Select all that apply (optional)</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {protectionTypes
          .filter(type => type.id !== formData.primary_protection_type)
          .map(type => (
            <button
              key={type.id}
              onClick={() => handleSecondaryTypeToggle(type.id)}
              className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                formData.secondary_protection_types.includes(type.id)
                  ? `${type.color} border-opacity-100`
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-xl">{type.icon}</span>
                <div className="text-left">
                  <div className="font-medium text-sm">{type.label}</div>
                </div>
              </div>
            </button>
          ))}
      </div>
      
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setStep(1)}
          className="bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg py-3 px-6 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setStep(3)}
          className="bg-sage-600 hover:bg-sage-700 text-white rounded-lg py-3 px-6 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">What are your specific concerns?</h2>
        <p className="text-gray-600">Help us prioritize relevant content for you</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {commonConcerns[formData.primary_protection_type]?.map(concern => (
          <button
            key={concern}
            onClick={() => handleConcernToggle(concern)}
            className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${
              formData.specific_concerns.includes(concern)
                ? 'bg-sage-100 text-sage-800 border-sage-300'
                : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="font-medium text-sm">{concern}</div>
          </button>
        ))}
      </div>
      
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setStep(2)}
          className="bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg py-3 px-6 transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => setStep(4)}
          className="bg-sage-600 hover:bg-sage-700 text-white rounded-lg py-3 px-6 transition-colors"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Where are you located?</h2>
        <p className="text-gray-600">This helps us show relevant local laws and protections</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
          <select
            value={formData.location_state}
            onChange={(e) => setFormData(prev => ({ ...prev, location_state: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sage-500 focus:border-transparent"
          >
            <option value="">Select your state</option>
            {US_STATES.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">City (Optional)</label>
          <input
            type="text"
            value={formData.location_city}
            onChange={(e) => setFormData(prev => ({ ...prev, location_city: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-sage-500 focus:border-transparent"
            placeholder="Enter your city"
          />
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-800 mb-3">Notification Preferences</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.notification_preferences.push_notifications}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                notification_preferences: {
                  ...prev.notification_preferences,
                  push_notifications: e.target.checked
                }
              }))}
              className="mr-3"
            />
            <span className="text-sm">Push notifications for relevant legal updates</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.notification_preferences.email_updates}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                notification_preferences: {
                  ...prev.notification_preferences,
                  email_updates: e.target.checked
                }
              }))}
              className="mr-3"
            />
            <span className="text-sm">Email updates with personalized content</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.notification_preferences.sms_alerts}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                notification_preferences: {
                  ...prev.notification_preferences,
                  sms_alerts: e.target.checked
                }
              }))}
              className="mr-3"
            />
            <span className="text-sm">SMS alerts for emergency legal information</span>
          </label>
        </div>
      </div>
      
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => setStep(3)}
          className="bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg py-3 px-6 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !formData.location_state}
          className="bg-sage-600 hover:bg-sage-700 text-white rounded-lg py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Setting up...' : 'Complete Setup'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 to-green-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-center space-x-2">
              {[1, 2, 3, 4].map(stepNum => (
                <div
                  key={stepNum}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    stepNum <= step
                      ? 'bg-sage-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {stepNum}
                </div>
              ))}
            </div>
          </div>
          
          {/* Step content */}
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>
      </div>
    </div>
  );
};

export default ProtectionTypeSetup;