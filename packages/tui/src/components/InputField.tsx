import React, { useState } from 'react'
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

  useInput((input, key) => {
    if (!isFocused) return

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

  return (
    <Box 
      flexDirection="column" 
      paddingX={1} 
      paddingY={0}
      width="100%"
    >
      <Box 
        borderStyle="round" 
        borderColor={isFocused ? "#7a9e7a" : "#3A3A3A"}
        paddingX={1}
      >
        <Text color={isFocused ? "#7a9e7a" : "#666666"}>› </Text>
        <TextInput
          focus={isFocused}
          value={value}
          onChange={setValue}
          onSubmit={(val) => {
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
  )
}
