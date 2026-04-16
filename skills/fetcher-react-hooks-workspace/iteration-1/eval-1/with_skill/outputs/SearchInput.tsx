import React, { useState } from 'react';
import { useDebouncedFetcherQuery } from '@ahoo-wang/fetcher-react';

interface SearchResult {
  id: string;
  title: string;
  // Add other result fields as needed
}

interface SearchInputProps {
  onResults?: (results: SearchResult[]) => void;
}

export function SearchInput({ onResults }: SearchInputProps) {
  const [keyword, setKeyword] = useState('');

  const {
    loading,
    result,
    run,
    cancel,
    isPending,
    setQuery,
    getQuery,
  } = useDebouncedFetcherQuery<{ keyword: string }, SearchResult[]>({
    url: '/api/search',
    initialQuery: { keyword: '' },
    debounce: { delay: 300 },
    autoExecute: false,
  });

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKeyword = e.target.value;
    setKeyword(newKeyword);
    setQuery({ keyword: newKeyword });
  };

  const handleSearch = () => {
    run();
  };

  const handleCancel = () => {
    cancel();
  };

  // Notify parent of results when they change
  React.useEffect(() => {
    if (result && onResults) {
      onResults(result);
    }
  }, [result, onResults]);

  return (
    <div className="search-input-container">
      <div className="search-input-row">
        <input
          type="text"
          value={keyword}
          onChange={handleKeywordChange}
          placeholder="Search..."
          className="search-input"
        />
        <button onClick={handleSearch} disabled={loading || isPending()}>
          {loading ? 'Searching...' : 'Search'}
        </button>
        {(isPending() || loading) && (
          <button onClick={handleCancel}>Cancel</button>
        )}
      </div>
      {loading && <div className="search-loading">Searching...</div>}
      {result && (
        <div className="search-results">
          Found {result.length} results
        </div>
      )}
    </div>
  );
}

export default SearchInput;
