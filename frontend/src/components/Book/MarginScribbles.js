import React, { useState, useEffect } from 'react';

const MarginScribbles = ({ position = 'right', context = 'general' }) => {
  const [currentQuote, setCurrentQuote] = useState(null);
  const [animatingQuote, setAnimatingQuote] = useState(false);

  const legalQuotes = {
    general: [
      {
        id: 1,
        text: "The Constitution is not a suicide pact.",
        author: "Justice Robert Jackson",
        context: "Constitutional Law",
        style: "handwritten",
        color: "text-forest-700"
      },
      {
        id: 2,
        text: "Justice delayed is justice denied.",
        author: "William E. Gladstone",
        context: "Legal System",
        style: "cursive",
        color: "text-blue-700"
      },
      {
        id: 3,
        text: "The good lawyer is not the man who has an eye to every side and angle of contingency.",
        author: "Justice Benjamin Cardozo",
        context: "Legal Practice",
        style: "print",
        color: "text-purple-700"
      },
      {
        id: 4,
        text: "Equal justice under law is not a mere slogan.",
        author: "Chief Justice Earl Warren",
        context: "Civil Rights",
        style: "handwritten",
        color: "text-green-700"
      },
      {
        id: 5,
        text: "The law must be stable, but it must not stand still.",
        author: "Justice Roscoe Pound",
        context: "Legal Evolution",
        style: "cursive",
        color: "text-red-700"
      }
    ],
    criminal: [
      {
        id: 6,
        text: "It is better that ten guilty persons escape than that one innocent suffer.",
        author: "Sir William Blackstone",
        context: "Criminal Justice",
        style: "handwritten",
        color: "text-red-700"
      },
      {
        id: 7,
        text: "The right to be heard would be, in many cases, of little avail if it did not comprehend the right to be heard by counsel.",
        author: "Justice George Sutherland",
        context: "Right to Counsel",
        style: "print",
        color: "text-blue-700"
      }
    ],
    constitutional: [
      {
        id: 8,
        text: "We must never forget that it is a Constitution we are expounding.",
        author: "Chief Justice John Marshall",
        context: "Constitutional Interpretation",
        style: "cursive",
        color: "text-forest-700"
      },
      {
        id: 9,
        text: "The Constitution follows the flag, but doesn't quite catch up with it.",
        author: "Justice Finley Peter Dunne",
        context: "Constitutional Law",
        style: "handwritten",
        color: "text-purple-700"
      }
    ],
    civil_rights: [
      {
        id: 10,
        text: "Injustice anywhere is a threat to justice everywhere.",
        author: "Martin Luther King Jr.",
        context: "Civil Rights",
        style: "handwritten",
        color: "text-green-700"
      },
      {
        id: 11,
        text: "The arc of the moral universe is long, but it bends toward justice.",
        author: "Theodore Parker",
        context: "Social Justice",
        style: "cursive",
        color: "text-blue-700"
      }
    ]
  };

  useEffect(() => {
    // Show initial quote
    showRandomQuote();
    
    // Change quote every 45 seconds
    const interval = setInterval(() => {
      showRandomQuote();
    }, 45000);
    
    return () => clearInterval(interval);
  }, [context]);

  const showRandomQuote = () => {
    const contextQuotes = legalQuotes[context] || legalQuotes.general;
    const randomQuote = contextQuotes[Math.floor(Math.random() * contextQuotes.length)];
    
    setAnimatingQuote(true);
    setTimeout(() => {
      setCurrentQuote(randomQuote);
      setAnimatingQuote(false);
    }, 300);
  };

  const getStyleClasses = (style) => {
    switch (style) {
      case 'handwritten':
        return 'font-mono transform -rotate-1 text-sm';
      case 'cursive':
        return 'font-serif italic transform rotate-1 text-sm';
      case 'print':
        return 'font-sans text-xs';
      default:
        return 'font-serif text-sm';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'left':
        return 'left-0 pl-2';
      case 'right':
        return 'right-0 pr-2';
      case 'top':
        return 'top-0 pt-2';
      case 'bottom':
        return 'bottom-0 pb-2';
      default:
        return 'right-0 pr-2';
    }
  };

  if (!currentQuote) return null;

  // Embedded layout for left page
  if (position === 'embedded') {
    return (
      <div className={`transition-all duration-500 ${
        animatingQuote ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'
      }`}>
        <div className="relative">
          {/* Quote text */}
          <div className={`${getStyleClasses(currentQuote.style)} ${currentQuote.color} leading-relaxed mb-2`}>
            "{currentQuote.text}"
          </div>
          
          {/* Author */}
          <div className="text-xs text-forest-600 text-right">
            <div className="font-medium">— {currentQuote.author}</div>
            <div className="text-forest-500 italic">{currentQuote.context}</div>
          </div>
          
          {/* Refresh button */}
          <button
            onClick={showRandomQuote}
            className="absolute top-0 right-0 text-forest-400 hover:text-forest-600 text-xs"
            title="New quote"
          >
            ↻
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed ${getPositionClasses()} z-20 pointer-events-none`}>
      <div className={`max-w-xs transition-all duration-500 ${
        animatingQuote ? 'opacity-0 transform translate-y-2' : 'opacity-100 transform translate-y-0'
      }`}>
        {/* Quote Container */}
        <div className="bg-book-page/80 backdrop-blur-sm border border-forest-200 rounded-lg p-4 shadow-lg relative">
          {/* Quote mark */}
          <div className="absolute -top-2 -left-2 text-2xl text-forest-600">"</div>
          
          {/* Quote text */}
          <div className={`${getStyleClasses(currentQuote.style)} ${currentQuote.color} leading-relaxed mb-3`}>
            {currentQuote.text}
          </div>
          
          {/* Author */}
          <div className="text-xs text-forest-600 text-right border-t border-forest-200 pt-2">
            <div className="font-medium">— {currentQuote.author}</div>
            <div className="text-forest-500 italic">{currentQuote.context}</div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-1 right-1 w-2 h-2 bg-gold-400 rounded-full opacity-50"></div>
          <div className="absolute bottom-1 left-1 w-1 h-1 bg-forest-400 rounded-full opacity-50"></div>
        </div>
        
        {/* Refresh button */}
        <button
          onClick={showRandomQuote}
          className="absolute -bottom-2 -right-2 bg-forest-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-forest-700 transition-colors pointer-events-auto"
          title="New quote"
        >
          ↻
        </button>
      </div>
    </div>
  );
};

// Archive component for viewing all quotes
export const QuoteArchive = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('general');
  
  const categories = {
    general: '⚖️ General Legal',
    criminal: '🔒 Criminal Justice',
    constitutional: '📜 Constitutional Law',
    civil_rights: '✊ Civil Rights'
  };

  const legalQuotes = {
    general: [
      {
        id: 1,
        text: "The Constitution is not a suicide pact.",
        author: "Justice Robert Jackson",
        context: "Constitutional Law"
      },
      {
        id: 2,
        text: "Justice delayed is justice denied.",
        author: "William E. Gladstone",
        context: "Legal System"
      },
      {
        id: 3,
        text: "The good lawyer is not the man who has an eye to every side and angle of contingency.",
        author: "Justice Benjamin Cardozo",
        context: "Legal Practice"
      },
      {
        id: 4,
        text: "Equal justice under law is not a mere slogan.",
        author: "Chief Justice Earl Warren",
        context: "Civil Rights"
      },
      {
        id: 5,
        text: "The law must be stable, but it must not stand still.",
        author: "Justice Roscoe Pound",
        context: "Legal Evolution"
      }
    ],
    criminal: [
      {
        id: 6,
        text: "It is better that ten guilty persons escape than that one innocent suffer.",
        author: "Sir William Blackstone",
        context: "Criminal Justice"
      },
      {
        id: 7,
        text: "The right to be heard would be, in many cases, of little avail if it did not comprehend the right to be heard by counsel.",
        author: "Justice George Sutherland",
        context: "Right to Counsel"
      }
    ],
    constitutional: [
      {
        id: 8,
        text: "We must never forget that it is a Constitution we are expounding.",
        author: "Chief Justice John Marshall",
        context: "Constitutional Interpretation"
      },
      {
        id: 9,
        text: "The Constitution follows the flag, but doesn't quite catch up with it.",
        author: "Justice Finley Peter Dunne",
        context: "Constitutional Law"
      }
    ],
    civil_rights: [
      {
        id: 10,
        text: "Injustice anywhere is a threat to justice everywhere.",
        author: "Martin Luther King Jr.",
        context: "Civil Rights"
      },
      {
        id: 11,
        text: "The arc of the moral universe is long, but it bends toward justice.",
        author: "Theodore Parker",
        context: "Social Justice"
      }
    ]
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-book-page rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-book-page border-b border-forest-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-book-leather">
              📝 Legal Wisdom Archive
            </h2>
            <p className="text-forest-600">
              Inspiring quotes from legal luminaries
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-forest-600 hover:text-forest-800 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(categories).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === key
                    ? 'bg-forest-600 text-white'
                    : 'bg-forest-100 text-forest-700 hover:bg-forest-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          
          {/* Quotes */}
          <div className="space-y-4">
            {legalQuotes[selectedCategory].map((quote) => (
              <div
                key={quote.id}
                className="bg-gradient-to-br from-book-page to-amber-50 border border-forest-200 rounded-lg p-4 shadow-sm"
              >
                <div className="text-forest-800 leading-relaxed mb-3 text-lg">
                  "{quote.text}"
                </div>
                <div className="text-forest-600 text-right">
                  <div className="font-medium">— {quote.author}</div>
                  <div className="text-sm italic">{quote.context}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarginScribbles;