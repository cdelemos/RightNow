import React from 'react';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-book-page p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-forest-600 rounded-full mb-6 shadow-lg">
            <span className="text-3xl text-white">⚖️</span>
          </div>
          <h1 className="text-4xl font-bold text-forest-800 mb-4">About RightNow</h1>
          <p className="text-xl text-forest-600 max-w-2xl mx-auto">
            Empowering communities through accessible legal education and real-world protection
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-forest-200/50 p-8 mb-8 border border-forest-100">
          <h2 className="text-2xl font-bold text-forest-800 mb-4 flex items-center">
            <span className="text-2xl mr-3">🎯</span>
            Our Mission
          </h2>
          <p className="text-forest-700 text-lg leading-relaxed">
            RightNow exists to democratize legal knowledge and empower individuals with the tools they need to protect themselves and their communities. We believe that understanding your rights shouldn't be a privilege—it should be accessible to everyone, everywhere, right now.
          </p>
        </div>

        {/* What We Stand For */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-forest-200/50 p-8 mb-8 border border-forest-100">
          <h2 className="text-2xl font-bold text-forest-800 mb-6 flex items-center">
            <span className="text-2xl mr-3">💫</span>
            What We Stand For
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-forest-100 rounded-full flex items-center justify-center">
                <span className="text-forest-600">🌟</span>
              </div>
              <div>
                <h3 className="font-semibold text-forest-800 mb-2">Accessibility First</h3>
                <p className="text-forest-600 text-sm">
                  Legal education should be available to everyone, regardless of background, income, or education level.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-forest-100 rounded-full flex items-center justify-center">
                <span className="text-forest-600">🛡️</span>
              </div>
              <div>
                <h3 className="font-semibold text-forest-800 mb-2">Real-World Protection</h3>
                <p className="text-forest-600 text-sm">
                  We focus on practical knowledge that helps people navigate real legal situations they face daily.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-forest-100 rounded-full flex items-center justify-center">
                <span className="text-forest-600">🤝</span>
              </div>
              <div>
                <h3 className="font-semibold text-forest-800 mb-2">Community Empowerment</h3>
                <p className="text-forest-600 text-sm">
                  We believe in building stronger communities through shared knowledge and mutual support.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-forest-100 rounded-full flex items-center justify-center">
                <span className="text-forest-600">⚡</span>
              </div>
              <div>
                <h3 className="font-semibold text-forest-800 mb-2">Innovation & Engagement</h3>
                <p className="text-forest-600 text-sm">
                  We use gamification and interactive learning to make legal education engaging and memorable.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Our Approach */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-forest-200/50 p-8 mb-8 border border-forest-100">
          <h2 className="text-2xl font-bold text-forest-800 mb-6 flex items-center">
            <span className="text-2xl mr-3">🚀</span>
            Our Approach
          </h2>
          
          <div className="space-y-6">
            <div className="border-l-4 border-forest-500 pl-6">
              <h3 className="font-semibold text-forest-800 mb-2">Interactive Learning</h3>
              <p className="text-forest-600">
                Through gamified experiences, scenario-based simulations, and AI-powered assistance, we make learning legal concepts engaging and practical.
              </p>
            </div>

            <div className="border-l-4 border-forest-500 pl-6">
              <h3 className="font-semibold text-forest-800 mb-2">Purpose-Driven Education</h3>
              <p className="text-forest-600">
                Our XP-based unlock system ensures you learn the legal protections most relevant to your situation and goals.
              </p>
            </div>

            <div className="border-l-4 border-forest-500 pl-6">
              <h3 className="font-semibold text-forest-800 mb-2">Emergency Preparedness</h3>
              <p className="text-forest-600">
                We provide immediate access to critical legal scripts, emergency contacts, and know-your-rights information for real-world situations.
              </p>
            </div>

            <div className="border-l-4 border-forest-500 pl-6">
              <h3 className="font-semibold text-forest-800 mb-2">Community-Driven Content</h3>
              <p className="text-forest-600">
                Our platform encourages peer-to-peer learning through Q&A, discussions, and shared experiences.
              </p>
            </div>
          </div>
        </div>

        {/* Who We Serve */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-forest-200/50 p-8 mb-8 border border-forest-100">
          <h2 className="text-2xl font-bold text-forest-800 mb-6 flex items-center">
            <span className="text-2xl mr-3">👥</span>
            Who We Serve
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎓</span>
              </div>
              <h3 className="font-semibold text-forest-800 mb-2">Students</h3>
              <p className="text-forest-600 text-sm">
                College students, law students, and lifelong learners seeking practical legal knowledge.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏘️</span>
              </div>
              <h3 className="font-semibold text-forest-800 mb-2">Communities</h3>
              <p className="text-forest-600 text-sm">
                Vulnerable populations who need immediate access to legal protection and know-your-rights information.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-forest-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌍</span>
              </div>
              <h3 className="font-semibold text-forest-800 mb-2">Everyone</h3>
              <p className="text-forest-600 text-sm">
                Anyone who believes that understanding your rights is fundamental to living with dignity and security.
              </p>
            </div>
          </div>
        </div>

        {/* Our Impact */}
        <div className="bg-gradient-to-r from-forest-50 to-forest-100 rounded-2xl shadow-xl shadow-forest-200/50 p-8 mb-8 border border-forest-200">
          <h2 className="text-2xl font-bold text-forest-800 mb-6 flex items-center">
            <span className="text-2xl mr-3">📈</span>
            Our Impact
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-forest-700 mb-2">Real-Time</div>
              <div className="text-forest-600">Legal Protection Access</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-forest-700 mb-2">Interactive</div>
              <div className="text-forest-600">Learning Experience</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-forest-700 mb-2">Community</div>
              <div className="text-forest-600">Empowerment Focus</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-forest-200/50 p-8 border border-forest-100">
          <h2 className="text-2xl font-bold text-forest-800 mb-4">Ready to Join Our Mission?</h2>
          <p className="text-forest-600 mb-6 max-w-2xl mx-auto">
            Whether you're a student, educator, community advocate, or someone who believes in the power of legal knowledge, 
            there's a place for you in the RightNow community.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="bg-forest-600 hover:bg-forest-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 shadow-lg"
            >
              <span className="mr-2">🚀</span>
              Get Started Today
            </Link>
            <Link 
              to="/dashboard" 
              className="bg-white border-2 border-forest-600 text-forest-600 hover:bg-forest-50 font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
            >
              <span className="mr-2">📚</span>
              Explore Learning
            </Link>
          </div>
        </div>

        {/* Footer Quote */}
        <div className="text-center mt-12 p-6">
          <blockquote className="text-lg italic text-forest-700 mb-4">
            "Justice delayed is justice denied. Knowledge shared is power multiplied."
          </blockquote>
          <p className="text-forest-600 text-sm">— The RightNow Team</p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;