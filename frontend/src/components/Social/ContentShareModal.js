import React, { useState } from 'react';
import axios from 'axios';

const ContentShareModal = ({ 
  isOpen, 
  onClose, 
  contentId, 
  contentType, 
  contentTitle = '',
  contentPreview = '' 
}) => {
  const [shareData, setShareData] = useState({
    share_message: '',
    share_platform: 'internal',
    is_public: true,
    recipients: []
  });
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

  const sharePlatforms = [
    { 
      value: 'internal', 
      label: 'RightNow Community',
      icon: '🏛️',
      description: 'Share with other RightNow users'
    },
    { 
      value: 'twitter', 
      label: 'Twitter',
      icon: '🐦',
      description: 'Share on Twitter'
    },
    { 
      value: 'facebook', 
      label: 'Facebook',
      icon: '📘',
      description: 'Share on Facebook'
    },
    { 
      value: 'email', 
      label: 'Email',
      icon: '📧',
      description: 'Share via email'
    },
    { 
      value: 'copy_link', 
      label: 'Copy Link',
      icon: '🔗',
      description: 'Copy shareable link'
    }
  ];

  const handleShare = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (shareData.share_platform === 'copy_link') {
        // Generate shareable link
        const shareableUrl = `${window.location.origin}/shared/${contentType}/${contentId}`;
        await navigator.clipboard.writeText(shareableUrl);
        setShareUrl(shareableUrl);
        
        // Show success message
        setTimeout(() => {
          onClose();
          setShareUrl('');
        }, 2000);
        
        return;
      }

      // For other platforms, save share record
      const response = await axios.post(`${API}/content/share`, {
        content_id: contentId,
        content_type: contentType,
        share_message: shareData.share_message,
        share_platform: shareData.share_platform,
        is_public: shareData.is_public,
        recipients: shareData.recipients
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Handle different platform sharing
        switch (shareData.share_platform) {
          case 'twitter':
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
              `${shareData.share_message || `Check out this ${contentType}: ${contentTitle}`} ${window.location.origin}/shared/${contentType}/${contentId}`
            )}`;
            window.open(twitterUrl, '_blank');
            break;
            
          case 'facebook':
            const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              `${window.location.origin}/shared/${contentType}/${contentId}`
            )}`;
            window.open(facebookUrl, '_blank');
            break;
            
          case 'email':
            const emailSubject = `Legal Resource: ${contentTitle}`;
            const emailBody = `${shareData.share_message || `I found this helpful ${contentType} and thought you might be interested:`}\n\n${contentPreview}\n\nView it here: ${window.location.origin}/shared/${contentType}/${contentId}`;
            const emailUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
            window.location.href = emailUrl;
            break;
            
          case 'internal':
            // Internal sharing handled by backend
            break;
        }
        
        onClose();
      }
    } catch (error) {
      console.error('Failed to share content:', error);
    } finally {
      setLoading(false);
    }
  };

  const getContentIcon = () => {
    const icons = {
      'statute': '📜',
      'myth': '🔍',
      'simulation': '🎭',
      'learning_path': '📚',
      'question': '❓',
      'article': '📰'
    };
    return icons[contentType] || '📄';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-25 z-50" onClick={onClose} />
      
      {/* Modal */}
      <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg bg-white rounded-xl shadow-2xl z-50">
        {/* Header */}
        <div className="bg-forest-600 text-white p-6 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getContentIcon()}</span>
              <div>
                <h3 className="text-xl font-semibold">Share Content</h3>
                <p className="text-forest-200 text-sm">{contentTitle}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-forest-200 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Content Preview */}
          {contentPreview && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 line-clamp-3">
                {contentPreview}
              </p>
            </div>
          )}

          {/* Share Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add a message (optional)
            </label>
            <textarea
              value={shareData.share_message}
              onChange={(e) => setShareData(prev => ({ ...prev, share_message: e.target.value }))}
              placeholder={`Why are you sharing this ${contentType}?`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-forest-500 focus:border-transparent resize-none"
              rows="3"
            />
          </div>

          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose platform
            </label>
            <div className="grid grid-cols-1 gap-2">
              {sharePlatforms.map(platform => (
                <button
                  key={platform.value}
                  onClick={() => setShareData(prev => ({ ...prev, share_platform: platform.value }))}
                  className={`
                    flex items-center space-x-3 p-3 rounded-lg border-2 transition-all text-left
                    ${shareData.share_platform === platform.value
                      ? 'border-forest-500 bg-forest-50 text-forest-800'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }
                  `}
                >
                  <span className="text-xl">{platform.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium">{platform.label}</p>
                    <p className="text-sm text-gray-500">{platform.description}</p>
                  </div>
                  {shareData.share_platform === platform.value && (
                    <svg className="w-5 h-5 text-forest-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility Settings */}
          {shareData.share_platform === 'internal' && (
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={shareData.is_public}
                  onChange={(e) => setShareData(prev => ({ ...prev, is_public: e.target.checked }))}
                  className="rounded border-gray-300 text-forest-600 focus:ring-forest-500"
                />
                <span className="text-sm text-gray-700">
                  Make this share visible to all community members
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
          {shareUrl ? (
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-medium">Link copied to clipboard!</span>
              </div>
              <p className="text-sm text-gray-600 break-all bg-white p-2 rounded border">
                {shareUrl}
              </p>
            </div>
          ) : (
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleShare}
                disabled={loading}
                className="flex-1 bg-forest-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-forest-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Share'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ContentShareModal;