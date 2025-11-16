
import * as React from 'react';
import SearchIcon from './icons/SearchIcon';
import SpinnerIcon from './icons/SpinnerIcon';

interface DirectionsInputProps {
  onSearch: (from: string, to: string) => void;
  isLoading: boolean;
}

const DirectionsInput: React.FC<DirectionsInputProps> = ({ onSearch, isLoading }) => {
  const [from, setFrom] = React.useState('');
  const [to, setTo] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (from.trim() && to.trim() && !isLoading) {
      onSearch(from.trim(), to.trim());
    }
  };

  const inputStyles = "w-full px-5 py-4 bg-gray-900/50 border border-blue-400/30 text-white placeholder-gray-400 rounded-full shadow-lg backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50";

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-2xl transition-all duration-300 flex items-center gap-2"
    >
        <div className="flex-1">
             <label htmlFor="from-location" className="sr-only">From</label>
            <input
                id="from-location"
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="From..."
                disabled={isLoading}
                className={inputStyles}
            />
        </div>
         <div className="flex-1">
             <label htmlFor="to-location" className="sr-only">To</label>
            <input
                id="to-location"
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="To..."
                disabled={isLoading}
                className={inputStyles}
            />
        </div>
      <button
        type="submit"
        disabled={isLoading || !from.trim() || !to.trim()}
        className="flex-shrink-0 h-14 w-14 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors duration-300"
        aria-label="Find Route"
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

export default DirectionsInput;
