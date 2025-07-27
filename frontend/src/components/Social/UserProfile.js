import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const UserProfile = ({ userId, isModal = false, onClose }) => {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState({});

  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users/profiles/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setProfile(response.data.data);
        setEditData({
          display_name: response.data.data.display_name,
          bio: response.data.data.bio || '',
          location: response.data.data.location || '',
          interests: response.data.data.interests || [],
          specialties: response.data.data.specialties || []
        });
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    try {
      const token = localStorage.getItem('token');
      const action = profile.is_following ? 'unfollow' : 'follow';
      
      await axios.post(`${API}/users/profiles/${userId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProfile(prev => ({
        ...prev,
        is_following: !prev.is_following
      }));
    } catch (error) {
      console.error('Failed to update follow status:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/users/profiles/${userId}`, editData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProfile(prev => ({ ...prev, ...editData }));
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleShareContent = async (contentId, contentType) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/content/share`, {
        content_id: contentId,
        content_type: contentType,
        share_message: `Check out this ${contentType}!`,
        is_public: true
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Could add notification here
      console.log('Content shared successfully');
    } catch (error) {
      console.error('Failed to share content:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Profile not found</p>
      </div>
    );
  }

  const ProfileContent = () => (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-forest-600 to-forest-700 px-6 py-8 text-white">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
            {profile.display_name ? profile.display_name.charAt(0).toUpperCase() : '?'}
          </div>
          
          <div className="flex-1">
            {isEditing && profile.is_own_profile ? (
              <input
                type="text"
                value={editData.display_name}
                onChange={(e) => setEditData(prev => ({ ...prev, display_name: e.target.value }))}
                className="bg-white/20 text-white placeholder-white/70 px-3 py-2 rounded-lg w-full text-xl font-bold"
                placeholder="Display name"
              />
            ) : (
              <h2 className="text-2xl font-bold">{profile.display_name}</h2>
            )}
            
            {profile.user_stats && (
              <div className="flex items-center space-x-4 mt-2 text-sm">
                {profile.user_stats.show_level && (
                  <span className="bg-white/20 px-2 py-1 rounded-full">
                    Level {profile.user_stats.level}
                  </span>
                )}
                <span className="bg-white/20 px-2 py-1 rounded-full">
                  {profile.user_stats.xp} XP
                </span>
                <span className="bg-white/20 px-2 py-1 rounded-full">
                  {profile.user_stats.badges_count} Badges
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {profile.is_own_profile ? (
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      className="bg-white text-forest-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-white/20 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-white text-forest-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleFollow}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  profile.is_following
                    ? 'bg-white/20 text-white hover:bg-white/30'
                    : 'bg-white text-forest-600 hover:bg-gray-100'
                }`}
              >
                {profile.is_following ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-6 space-y-6">
        {/* Bio */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">About</h3>
          {isEditing && profile.is_own_profile ? (
            <textarea
              value={editData.bio}
              onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
              rows="3"
              placeholder="Tell others about yourself..."
            />
          ) : (
            <p className="text-gray-600">
              {profile.bio || 'No bio provided yet.'}
            </p>
          )}
        </div>

        {/* Location */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Location</h3>
          {isEditing && profile.is_own_profile ? (
            <input
              type="text"
              value={editData.location}
              onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent"
              placeholder="Your location"
            />
          ) : (
            <p className="text-gray-600 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {profile.location || 'Location not specified'}
            </p>
          )}
        </div>

        {/* Interests */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal Interests</h3>
          <div className="flex flex-wrap gap-2">
            {(profile.interests || []).map((interest, index) => (
              <span
                key={index}
                className="bg-forest-100 text-forest-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {interest}
              </span>
            ))}
            {(!profile.interests || profile.interests.length === 0) && (
              <p className="text-gray-500 text-sm">No interests specified yet.</p>
            )}
          </div>
        </div>

        {/* Specialties */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Specialties</h3>
          <div className="flex flex-wrap gap-2">
            {(profile.specialties || []).map((specialty, index) => (
              <span
                key={index}
                className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {specialty}
              </span>
            ))}
            {(!profile.specialties || profile.specialties.length === 0) && (
              <p className="text-gray-500 text-sm">No specialties specified yet.</p>
            )}
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {/* Mock activity items - would be populated from ActivityFeed model */}
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-forest-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                🏆
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{profile.display_name}</span> reached Level {profile.user_stats?.level || 1}!
                </p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                📚
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{profile.display_name}</span> completed a learning path
                </p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isModal) {
    return (
      <>
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-25 z-40"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="fixed inset-4 bg-white rounded-xl shadow-2xl z-50 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">User Profile</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4">
            <ProfileContent />
          </div>
        </div>
      </>
    );
  }

  return <ProfileContent />;
};

export default UserProfile;