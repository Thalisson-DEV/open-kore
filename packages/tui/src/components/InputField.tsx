import React, { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink'
import TextInput from 'ink-text-input'

interface InputFieldProps {
  onSubmit: (value: string) => void
}

export const InputField: React.FC<InputFieldProps> = ({ onSubmit }) => {
  const [value, setValue] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isFocused, setIsFocused] = useState(true)
  
  // Estados do Autocomplete
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [inputKey, setInputKey] = useState(0)

  useEffect(() => {
    const words = value.split(' ');
    const lastWord = words[words.length - 1] || '';
    
    // Só mostra sugestões se a ÚLTIMA palavra começar com @ e não houver um espaço após ela
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

  useInput((input, key) => {
    if (!isFocused) return

    if (showSuggestions && suggestions.length > 0) {
      if (key.upArrow) {
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        return;
      }
      if (key.downArrow) {
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (key.return || key.tab) {
        const words = value.split(' ');
        words.pop(); // Remove a parte inacabada do @
        const completed = [...words, `@${suggestions[selectedIndex]}`].join(' ') + ' ';
        setValue(completed);
        setSuggestions([]);
        setShowSuggestions(false);
        setInputKey(prev => prev + 1);
        return;
      }
      if (key.escape) {
        setShowSuggestions(false);
        return;
      }
    }

    if (key.upArrow) {
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setValue(history[history.length - 1 - newIndex])
      }
    }
    if (key.downArrow) {
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setValue(history[history.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setValue('')
      }
    }
  })

  const renderHighlightedText = (val: string) => {
    if (val.length === 0) {
      return <Text color="#333333">Pergunte algo ou use @arquivo...</Text>;
    }

    // Regex case-insensitive para o split
    const parts = val.split(/(@[a-zA-Z0-9\._\-\/]+)/gi);
    return (
      <Text>
        {parts.map((part, i) => {
          if (part.startsWith('@')) {
            return <Text key={i} color="#7a9e7a" bold>{part}</Text>;
          }
          return <Text key={i} color="#E0E0E0">{part}</Text>;
        })}
        {isFocused && <Text color="#7a9e7a">┃</Text>}
      </Text>
    );
  };

  return (
    <Box flexDirection="column" paddingX={1} paddingY={0} width="100%">
      {showSuggestions && (
        <Box 
          flexDirection="column" 
          backgroundColor="#1A1A1A" 
          paddingX={1} 
          paddingY={0}
          marginBottom={0}
          borderStyle="round"
          borderColor="#333333"
        >
          <Text color="#7a9e7a" bold> Sugestões de Arquivos </Text>
          {suggestions.map((file, i) => (
            <Box key={file} backgroundColor={i === selectedIndex ? "#7a9e7a" : "transparent"}>
              <Text color={i === selectedIndex ? "#000000" : "#E0E0E0"}>
                {i === selectedIndex ? ' › ' : '   '}
                {file}
              </Text>
            </Box>
          ))}
        </Box>
      )}

      <Box 
        backgroundColor="#111111"
        paddingX={2}
        paddingY={1}
        flexDirection="row"
      >
        <Text color="#7a9e7a">› </Text>

        <Box flexGrow={1} flexDirection="row">
          {/* Camada Visual com Destaque e Input Invisível combinados */}
          <Box flexGrow={1}>
             {renderHighlightedText(value)}
          </Box>

          <Box width={0} height={0} overflow="hidden">
            <TextInput
              key={inputKey}
              focus={isFocused} 
              value={value}
              onChange={setValue}
              showCursor={false}
              onSubmit={(val) => {
                if (showSuggestions && suggestions.length > 0) return; 
                if (val.trim()) {
                  setHistory(prev => [...prev, val])
                  setHistoryIndex(-1)
                }
                onSubmit(val)
                setValue('')
              }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  )
  }
