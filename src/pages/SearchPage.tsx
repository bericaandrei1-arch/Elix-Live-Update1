import React, { useState } from 'react';
import { ArrowLeft, Search as SearchIcon, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TRENDING_SEARCHES = [
  'Dance challenge',
  'Funny cats',
  'Cooking hacks',
  'Travel vlog',
  'Gaming highlights',
  'Fitness tips'
];

export default function SearchPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      alert(`Searching for: ${query}`);
      // Implement actual search results page later
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex justify-center">
      <div className="w-full max-w-[500px]">
      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => navigate(-1)} className="p-1">
            <ArrowLeft size={24} />
          </button>
          <form onSubmit={handleSearch} className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Search" 
              className="w-full bg-gray-800 text-white rounded-md py-2 pl-10 pr-4 text-sm focus:outline-none focus:bg-gray-700"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            {query && (
              <button 
                type="button" 
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                <X size={14} />
              </button>
            )}
          </form>
          <button className="text-[#FE2C55] font-semibold text-sm" onClick={handleSearch}>Search</button>
        </div>
        <h2 className="font-bold mb-4">You may like</h2>
        <div className="flex flex-wrap gap-2">
          {TRENDING_SEARCHES.map((tag) => (
            <button 
              key={tag}
              onClick={() => setQuery(tag)}
              className="bg-gray-800 px-3 py-1.5 rounded-full text-sm hover:bg-gray-700 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
