import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const EmergencyContacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    email: '',
    contact_type: 'family',
    relationship: '',
    organization: '',
    notes: '',
    is_priority: false
  });

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;

  const contactTypes = [
    { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
    { value: 'friend', label: 'Friend', icon: '👫' },
    { value: 'lawyer', label: 'Lawyer', icon: '⚖️' },
    { value: 'legal_aid', label: 'Legal Aid', icon: '🏛️' },
    { value: 'organization', label: 'Organization', icon: '🏢' }
  ];

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/emergency/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContacts(response.data.data || []);
    } catch (error) {
      console.error('Failed to load emergency contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      if (editingContact) {
        await axios.put(`${API}/emergency/contacts/${editingContact.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API}/emergency/contacts`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      resetForm();
      loadContacts();
    } catch (error) {
      console.error('Failed to save emergency contact:', error);
    }
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone_number: contact.phone_number,
      email: contact.email || '',
      contact_type: contact.contact_type,
      relationship: contact.relationship || '',
      organization: contact.organization || '',
      notes: contact.notes || '',
      is_priority: contact.is_priority
    });
    setShowAddForm(true);
  };

  const handleDelete = async (contactId) => {
    if (window.confirm('Are you sure you want to delete this emergency contact?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API}/emergency/contacts/${contactId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        loadContacts();
      } catch (error) {
        console.error('Failed to delete emergency contact:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone_number: '',
      email: '',
      contact_type: 'family',
      relationship: '',
      organization: '',
      notes: '',
      is_priority: false
    });
    setEditingContact(null);
    setShowAddForm(false);
  };

  const getTypeIcon = (type) => {
    const typeObj = contactTypes.find(t => t.value === type);
    return typeObj ? typeObj.icon : '📞';
  };

  const getTypeLabel = (type) => {
    const typeObj = contactTypes.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading emergency contacts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-800 mb-2">
            🚨 Emergency Contacts
          </h1>
          <p className="text-gray-600">
            Manage your emergency contacts for crisis situations
          </p>
        </div>

        {/* Add Contact Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-red-600 hover:bg-red-700 text-white rounded-lg py-3 px-6 flex items-center space-x-2 transition-colors"
          >
            <span>➕</span>
            <span>Add Emergency Contact</span>
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {editingContact ? 'Edit Contact' : 'Add Emergency Contact'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Type
                  </label>
                  <select
                    value={formData.contact_type}
                    onChange={(e) => setFormData({ ...formData, contact_type: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {contactTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relationship
                  </label>
                  <input
                    type="text"
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., Mother, Best Friend, Attorney"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={formData.organization}
                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., Legal Aid Society, Law Firm"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  rows="3"
                  placeholder="Additional information about this contact..."
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_priority"
                  checked={formData.is_priority}
                  onChange={(e) => setFormData({ ...formData, is_priority: e.target.checked })}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="is_priority" className="ml-2 block text-sm text-gray-700">
                  Priority Contact (will be notified first)
                </label>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 px-4 transition-colors"
                >
                  {editingContact ? 'Update Contact' : 'Add Contact'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg py-2 px-4 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Contacts List */}
        <div className="space-y-4">
          {contacts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">📞</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Emergency Contacts</h3>
              <p className="text-gray-600 mb-4">
                Add emergency contacts to receive notifications during crisis situations
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 px-4 transition-colors"
              >
                Add Your First Contact
              </button>
            </div>
          ) : (
            contacts.map((contact) => (
              <div key={contact.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{getTypeIcon(contact.contact_type)}</div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-800">{contact.name}</h3>
                        {contact.is_priority && (
                          <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                            Priority
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">{getTypeLabel(contact.contact_type)}</p>
                      {contact.relationship && (
                        <p className="text-sm text-gray-500">{contact.relationship}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(contact)}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-500">📞</span>
                    <span className="text-gray-700">{contact.phone_number}</span>
                  </div>
                  {contact.email && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">✉️</span>
                      <span className="text-gray-700">{contact.email}</span>
                    </div>
                  )}
                  {contact.organization && (
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">🏢</span>
                      <span className="text-gray-700">{contact.organization}</span>
                    </div>
                  )}
                </div>
                
                {contact.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{contact.notes}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default EmergencyContacts;