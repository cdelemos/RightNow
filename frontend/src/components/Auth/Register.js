import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CustomLogo from '../Layout/CustomLogo';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    user_type: 'undergraduate'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const userTypes = [
    { value: 'undergraduate', label: 'Undergraduate Student', icon: '🎓', color: 'bg-blue-100 text-blue-700' },
    { value: 'graduate', label: 'Graduate Student', icon: '📚', color: 'bg-purple-100 text-purple-700' },
    { value: 'law_student', label: 'Law Student', icon: '⚖️', color: 'bg-forest-100 text-forest-700' },
    { value: 'professor', label: 'Professor/Educator', icon: '👨‍🏫', color: 'bg-emerald-100 text-emerald-700' },
    { value: 'general', label: 'General Public', icon: '👤', color: 'bg-gray-100 text-gray-700' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    const registrationData = {
      email: formData.email,
      username: formData.username,
      password: formData.password,
      user_type: formData.user_type
    };

    const result = await register(registrationData);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest-50 via-book-page to-forest-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl shadow-forest-200/50 p-8 border border-forest-100">
            <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-emerald-100 mb-6 animate-bounce-soft">
              <span className="text-4xl">🎉</span>
            </div>
            <h2 className="text-3xl font-bold text-forest-800 mb-4">
              Welcome aboard! 🚀
            </h2>
            <p className="text-forest-600 mb-6">
              Your account has been created successfully. Get ready to level up your legal knowledge!
            </p>
            <div className="inline-flex items-center bg-forest-100 rounded-xl px-4 py-2">
              <span className="animate-pulse text-forest-700">Redirecting to login...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedUserType = userTypes.find(type => type.value === formData.user_type);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest-50 via-book-page to-forest-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <CustomLogo size="xl" showText={true} />
          </div>
          <h2 className="text-3xl font-bold text-forest-800">
            Join the community! 🎓
          </h2>
          <p className="mt-2 text-forest-600">
            Start your legal education journey today
          </p>
        </div>
        
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl shadow-forest-200/50 p-8 border border-forest-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-forest-700 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 border border-forest-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent transition-all duration-200 bg-forest-50/50"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-forest-700 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-forest-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent transition-all duration-200 bg-forest-50/50"
                  placeholder="Choose a username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="user_type" className="block text-sm font-medium text-forest-700 mb-2">
                  I am a...
                </label>
                <div className="relative">
                  <select
                    id="user_type"
                    name="user_type"
                    className="w-full px-4 py-3 border border-forest-200 bg-forest-50/50 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent transition-all duration-200 appearance-none"
                    value={formData.user_type}
                    onChange={handleChange}
                  >
                    {userTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-forest-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {selectedUserType && (
                  <div className={`mt-2 inline-flex items-center px-3 py-1 rounded-lg text-xs ${selectedUserType.color}`}>
                    <span className="mr-1">{selectedUserType.icon}</span>
                    {selectedUserType.label}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-forest-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-3 border border-forest-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent transition-all duration-200 bg-forest-50/50"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-forest-700 mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="w-full px-4 py-3 border border-forest-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent transition-all duration-200 bg-forest-50/50"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50/80 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm backdrop-blur-sm animate-pulse-gentle">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">⚠️</span>
                  {error}
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-white font-medium rounded-xl bg-gradient-to-r from-forest-600 to-forest-700 hover:from-forest-700 hover:to-forest-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-lg shadow-forest-200/50"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Creating account...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="mr-2">🎉</span>
                    Create account
                  </div>
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/login"
                className="font-medium text-forest-600 hover:text-forest-500 transition-colors duration-200"
              >
                Already have an account? <span className="text-forest-700 font-semibold">Sign in!</span> 👋
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;