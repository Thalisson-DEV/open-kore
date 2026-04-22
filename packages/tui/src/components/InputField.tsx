import React, { useState, useMemo } from 'react'
import { useKeyboard } from '@opentui/react'
import { theme } from '../theme'
import { HistoryManager } from '../services/HistoryManager'
import { Autocomplete } from './Autocomplete'
import { useFileSuggestions } from '../hooks/use-file-suggestions'

interface InputFieldProps {
  onSubmit: (value: string) => void
}

export const InputField: React.FC<InputFieldProps> = ({ onSubmit }) => {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(true)
  const historyManager = useMemo(() => new HistoryManager(), [])
  
  const { 
    suggestions, 
    showSuggestions, 
    setShowSuggestions, 
    selectedIndex, 
    setSelectedIndex 
  } = useFileSuggestions(value);

  const handleAutocompleteSelect = (selectedFile: string) => {
    const words = value.split(' ');
    words.pop();
    const completed = [...words, `@${selectedFile}`].join(' ') + ' ';
    setValue(completed);
    setShowSuggestions(false);
  };

  useKeyboard((key) => {
    if (!isFocused) return

    if (showSuggestions && suggestions.length > 0) {
      if (key.name === 'up') {
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        return;
      }
      if (key.name === 'down') {
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (key.name === 'return' || key.name === 'tab') {
        handleAutocompleteSelect(suggestions[selectedIndex]);
        return;
      }
      if (key.name === 'escape') {
        setShowSuggestions(false);
        return;
      }
    }

    if (key.name === 'up') {
      setValue(historyManager.up(value));
      return;
    }
    if (key.name === 'down') {
      setValue(historyManager.down());
      return;
    }
  })

  const handleSubmit = (val: string) => {
    if (showSuggestions && suggestions.length > 0) return;
    if (val.trim()) {
      historyManager.add(val);
    }
    onSubmit(val);
    setValue('');
  }

  return (
    <box style={{ flexDirection: "column", paddingX: 1, width: "100%" }}>
      <Autocomplete 
        suggestions={suggestions}
        selectedIndex={selectedIndex}
        onSelect={handleAutocompleteSelect}
        visible={showSuggestions}
      />

      <box 
        style={{
          backgroundColor: theme.bgPanel,
          paddingX: 2,
          paddingY: 1,
          flexDirection: "row"
        }}
      >
        <text fg={theme.accent}>› </text>
        <input
          value={value}
          onInput={setValue}
          onSubmit={handleSubmit}
          placeholder="Pergunte algo ou use @arquivo..."
          focused={isFocused}
          style={{
            flexGrow: 1,
            fg: theme.fg,
          }}
        />
      </box>
    </box>
  )
}
