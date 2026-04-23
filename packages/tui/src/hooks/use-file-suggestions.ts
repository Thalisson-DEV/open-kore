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
          const newFiles = data.files || [];
          if (newFiles.length > 0) {
            setSuggestions(prev => {
              // Só atualiza se a lista for diferente para evitar resets de index desnecessários
              if (JSON.stringify(prev) === JSON.stringify(newFiles)) return prev;
              setSelectedIndex(0);
              return newFiles;
            });
            setShowSuggestions(true);
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
