import * as React from 'react';
import SearchIcon from './icons/SearchIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ onSearch, isLoading, placeholder }) => {
  const [query, setQuery] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-lg transition-all duration-300"
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder || "Enter a city, landmark, or address..."}
        disabled={isLoading}
        className="w-full pl-5 pr-14 py-4 bg-gray-900/50 border border-blue-400/30 text-white placeholder-gray-400 rounded-full shadow-lg backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={isLoading}
        className="absolute right-2 top-1/2 -translate-y-1/2 h-12 w-12 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors duration-300"
        aria-label="Fly to location"
      >
        {isLoading ? (
          <SpinnerIcon className="animate-spin h-6 w-6" />
        ) : (
          <SearchIcon className="h-6 w-6" />
        )}
      </button>
    </form>
  );
};

export default SearchInput;