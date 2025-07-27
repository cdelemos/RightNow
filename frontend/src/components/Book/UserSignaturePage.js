import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const UserSignaturePage = ({ isOpen, onClose, onSignatureComplete }) => {
  const { user } = useAuth();
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signature, setSignature] = useState(null);
  const [pledgeAccepted, setPledgeAccepted] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  const pledge = {
    title: "Legal Knowledge Pledge",
    text: `I, ${user?.username || 'Student'}, pledge to use this legal knowledge responsibly and ethically. I understand that this information is for educational purposes and does not constitute legal advice. I commit to:

• Seeking professional legal counsel for specific legal matters
• Using this knowledge to protect myself and others
• Sharing accurate legal information responsibly
• Continuing to learn and stay informed about my rights
• Respecting the legal system while advocating for justice

I acknowledge that knowledge of rights is the foundation of protection and justice.`,
    date: new Date().toLocaleDateString()
  };

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Set canvas size
      canvas.width = 400;
      canvas.height = 150;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fdfcf8';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Set drawing style
      ctx.strokeStyle = '#1f2937';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [isOpen]);

  const startDrawing = (e) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fdfcf8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSignature(null);
  };

  const saveSignature = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL();
    setSignature(signatureData);
    setShowCertificate(true);
  };

  const completePledge = () => {
    if (signature && pledgeAccepted) {
      // Save to user profile (in real app, send to backend)
      const pledgeData = {
        signature,
        pledgeText: pledge.text,
        date: pledge.date,
        username: user?.username
      };
      
      localStorage.setItem('userPledge', JSON.stringify(pledgeData));
      
      if (onSignatureComplete) {
        onSignatureComplete(pledgeData);
      }
      
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-book-page max-w-4xl w-full max-h-[95vh] overflow-y-auto rounded-lg shadow-2xl">
        {!showCertificate ? (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-forest-600 to-forest-800 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-2">⚖️ Legal Knowledge Pledge</h2>
                  <p className="text-forest-100">
                    Complete your commitment to responsible legal learning
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-forest-100 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Pledge Content */}
            <div className="p-8">
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-gold-300 rounded-lg p-6 mb-6">
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">📜</div>
                  <h3 className="text-xl font-bold text-book-leather">{pledge.title}</h3>
                </div>
                
                <div className="text-forest-800 leading-relaxed whitespace-pre-line text-sm">
                  {pledge.text}
                </div>
                
                <div className="mt-6 text-center">
                  <div className="text-forest-600 font-medium">
                    Date: {pledge.date}
                  </div>
                </div>
              </div>

              {/* Signature Area */}
              <div className="bg-white border-2 border-forest-200 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-bold text-book-leather mb-4">
                  ✍️ Your Signature
                </h4>
                
                <div className="border-2 border-dashed border-forest-300 rounded-lg p-4 mb-4">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="border border-forest-200 rounded cursor-crosshair w-full"
                    style={{ maxWidth: '400px', height: '150px' }}
                  />
                </div>
                
                <div className="flex space-x-4">
                  <button
                    onClick={clearSignature}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    onClick={saveSignature}
                    className="bg-forest-600 text-white px-4 py-2 rounded-lg hover:bg-forest-700 transition-colors"
                  >
                    Save Signature
                  </button>
                </div>
              </div>

              {/* Acceptance Checkbox */}
              <div className="bg-gold-50 border border-gold-200 rounded-lg p-4 mb-6">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pledgeAccepted}
                    onChange={(e) => setPledgeAccepted(e.target.checked)}
                    className="w-5 h-5 text-forest-600 border-forest-300 rounded focus:ring-forest-500"
                  />
                  <span className="text-forest-800 font-medium">
                    I have read and agree to this pledge of responsible legal learning
                  </span>
                </label>
              </div>

              {/* Complete Button */}
              <div className="text-center">
                <button
                  onClick={completePledge}
                  disabled={!signature || !pledgeAccepted}
                  className={`px-8 py-3 rounded-lg font-bold text-lg transition-all ${
                    signature && pledgeAccepted
                      ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-lg hover:shadow-xl hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Complete Pledge 📜
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Certificate View */
          <div className="p-8 text-center">
            <div className="bg-gradient-to-br from-gold-50 to-amber-100 border-4 border-gold-400 rounded-lg p-8 mb-6">
              <div className="mb-6">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-2xl font-bold text-book-leather mb-2">
                  Certificate of Legal Knowledge Commitment
                </h3>
                <p className="text-forest-600">
                  This certifies that you have pledged to use legal knowledge responsibly
                </p>
              </div>
              
              <div className="bg-white rounded-lg p-6 mb-6 shadow-inner">
                <div className="text-forest-800 mb-4">
                  <div className="text-lg font-bold">{user?.username}</div>
                  <div className="text-sm text-forest-600">Legal Knowledge Student</div>
                </div>
                
                {signature && (
                  <div className="mb-4">
                    <img
                      src={signature}
                      alt="User signature"
                      className="border-b-2 border-forest-300 mx-auto"
                      style={{ maxWidth: '200px' }}
                    />
                    <div className="text-xs text-forest-600 mt-2">Digital Signature</div>
                  </div>
                )}
                
                <div className="text-sm text-forest-600">
                  Signed on {pledge.date}
                </div>
              </div>
              
              <div className="text-xs text-forest-500 italic">
                "Knowledge of rights is the foundation of protection and justice"
              </div>
            </div>
            
            <button
              onClick={completePledge}
              className="bg-gradient-to-r from-forest-600 to-forest-800 text-white px-8 py-3 rounded-lg font-bold hover:scale-105 transition-transform shadow-lg"
            >
              Complete & Continue 🚀
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSignaturePage;