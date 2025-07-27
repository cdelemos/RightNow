import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CustomLogo from '../Layout/CustomLogo';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

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

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-forest-50 via-book-page to-forest-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Logo size="xl" showText={true} />  
          </div>
          <h2 className="mt-6 text-3xl font-bold text-forest-800">
            Welcome back! 👋
          </h2>
          <p className="mt-2 text-forest-600">
            Continue your legal education journey
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
                <label htmlFor="password" className="block text-sm font-medium text-forest-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="w-full px-4 py-3 border border-forest-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500 focus:border-transparent transition-all duration-200 bg-forest-50/50"
                  placeholder="Enter your password"
                  value={formData.password}
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
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span className="mr-2">🚀</span>
                    Sign in
                  </div>
                )}
              </button>
            </div>

            <div className="text-center">
              <Link
                to="/register"
                className="font-medium text-forest-600 hover:text-forest-500 transition-colors duration-200"
              >
                Don't have an account? <span className="text-forest-700 font-semibold">Join the community!</span> 🎓
              </Link>
            </div>
          </form>
        </div>

        {/* Fun motivational element */}
        <div className="text-center">
          <div className="inline-flex items-center bg-white/60 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg shadow-forest-200/30 border border-forest-100">
            <span className="text-forest-600 text-sm">
              <span className="animate-float inline-block mr-2">⚖️</span>
              Ready to level up your legal knowledge?
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;