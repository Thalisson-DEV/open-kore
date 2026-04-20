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

  useInput((input, key) => {
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
    <Box paddingX={1} marginTop={1}>
      <Text color="#4ade80">› </Text>
      <TextInput
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
  )
}
