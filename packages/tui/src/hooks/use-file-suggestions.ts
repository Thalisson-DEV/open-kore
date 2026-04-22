import { useState, useEffect } from 'react';

export function useFileSuggestions(value: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const words = value.split(' ');
    const lastWord = words[words.length - 1] || '';
    
    if (lastWord.startsWith('@')) {
      const query = lastWord.slice(1);
      fetch(`http://localhost:8080/files?q=${query}`)
        .then(res => res.json())
        .then(data => {
          if (data.files && data.files.length > 0) {
            setSuggestions(data.files);
            setShowSuggestions(true);
            setSelectedIndex(0);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        })
        .catch(() => {
          setSuggestions([]);
          setShowSuggestions(false);
        });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  return {
    suggestions,
    showSuggestions,
    setShowSuggestions,
    selectedIndex,
    setSelectedIndex
  };
}
