import React, { useState, useEffect, useRef, useCallback } from 'react';

interface SearchResult {
  id: string;
  title: string;
}

interface SearchInputProps {
  onResults?: (results: SearchResult[]) => void;
  debounceDelay?: number;
}

export function SearchInput({ onResults, debounceDelay = 300 }: SearchInputProps) {
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, setIsPending] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const executeSearch = useCallback(async (searchKeyword: string) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (!searchKeyword.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setIsPending(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`/api/search?keyword=${encodeURIComponent(searchKeyword)}`, {
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setResults(data);
      if (onResults) onResults(data);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Search failed:', err);
      }
    } finally {
      setLoading(false);
      setIsPending(false);
    }
  }, [onResults]);

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newKeyword = e.target.value;
    setKeyword(newKeyword);

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new debounce timer
    setIsPending(true);
    debounceTimerRef.current = setTimeout(() => {
      executeSearch(newKeyword);
    }, debounceDelay);
  };

  const handleSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    executeSearch(keyword);
  };

  const handleCancel = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsPending(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
        {(isPending || loading) && (
          <button onClick={handleCancel}>Cancel</button>
        )}
      </div>
      {loading && <div className="search-loading">Searching...</div>}
      {results.length > 0 && (
        <div className="search-results">
          Found {results.length} results
        </div>
      )}
    </div>
  );
}

export default SearchInput;
