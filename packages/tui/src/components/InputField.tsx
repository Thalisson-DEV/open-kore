import React, { useEffect, useRef, useState } from 'react'
import { useRenderer, useOnResize } from '@opentui/react'
import { TextareaRenderable, type TextareaRenderable as TextareaType } from '@opentui/core'
import { theme } from '../theme'
import { Autocomplete } from './Autocomplete'
import { useFileSuggestions } from '../hooks/use-file-suggestions'
import { estimateWrappedLines } from '../hooks/useInputHeight'

const MAX_LINES = 8
const MIN_LINES = 1

interface InputFieldProps {
  onSubmit: (value: string) => void
  isFocused?: boolean
  value?: string
  onValueChange?: (val: string) => void
  isLoading?: boolean
}

export const InputField: React.FC<InputFieldProps> = ({ 
  onSubmit, 
  isFocused = true,
  value: externalValue = '',
  onValueChange,
  isLoading = false
}) => {
  const renderer = useRenderer()
  const containerRef = useRef<any>(null)
  const textareaRef = useRef<TextareaType | null>(null)
  const [lineCount, setLineCount] = useState(MIN_LINES)
  const [hasContent, setHasContent] = useState(false)
  const [value, setValue] = useState(externalValue)

  const onSubmitRef = useRef(onSubmit)
  const onValueChangeRef = useRef(onValueChange)
  useEffect(() => {
    onSubmitRef.current = onSubmit
    onValueChangeRef.current = onValueChange
  }, [onSubmit, onValueChange])

  // TODO: Implementar histórico de comandos de forma robusta
  const cursorLineRef = useRef(0)

  const { 
    suggestions, 
    showSuggestions, 
    setShowSuggestions, 
    selectedIndex, 
    setSelectedIndex 
  } = useFileSuggestions(value);

  const stateRef = useRef({ showSuggestions, suggestions, selectedIndex, value: externalValue, isLoading })
  useEffect(() => {
    stateRef.current = { showSuggestions, suggestions, selectedIndex, value: externalValue, isLoading }
  }, [showSuggestions, suggestions, selectedIndex, externalValue, isLoading])

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea && !textarea.isDestroyed) {
      textarea.placeholder = isLoading ? 'Aguardando resposta da IA...' : 'Digite uma tarefa, @arquivo, !shell ou /comando...';
      textarea.textColor = isLoading ? theme.fgMuted : theme.fg;
      textarea.focusedTextColor = isLoading ? theme.fgMuted : theme.fg;
      
      if (isFocused && !isLoading) {
        textarea.focus();
      } else {
        textarea.blur();
      }
    }
  }, [isLoading, isFocused]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || textarea.isDestroyed) return;

    // Sincronização forçada: se o valor externo for vazio, limpa TUDO.
    if (externalValue === '') {
      textarea.setText('');
      setValue('');
      setHasContent(false);
      setLineCount(MIN_LINES);
      if (textarea.height !== MIN_LINES) textarea.height = MIN_LINES;
    } else if (textarea.plainText !== externalValue) {
      textarea.setText(externalValue);
      const containerWidth = containerRef.current?.width ?? 80;
      const visualLines = estimateWrappedLines(externalValue, containerWidth);
      const newLineCount = Math.max(MIN_LINES, Math.min(visualLines, MAX_LINES));
      setLineCount(newLineCount);
      setValue(externalValue);
      setHasContent(externalValue.length > 0);
      if (textarea.height !== newLineCount) textarea.height = newLineCount;
    }
  }, [externalValue]);

  const handleAutocompleteSelect = (selectedFile: string) => {
    const textarea = textareaRef.current;
    if (!textarea || textarea.isDestroyed) return;

    const words = stateRef.current.value.split(' ');
    words.pop();
    const completed = [...words, `@${selectedFile}`].join(' ') + ' ';
    
    textarea.setText(completed);
    textarea.cursorOffset = completed.length;
    
    setValue(completed);
    onValueChangeRef.current?.(completed);
    setShowSuggestions(false);
  };

  const boxHeight = Math.min(lineCount, MAX_LINES) + 2

  useEffect(() => {
    if (!containerRef.current) return

    const textarea = new TextareaRenderable(renderer, {
      id: 'prompt-textarea',
      width: '100%',
      height: MIN_LINES,
      initialValue: externalValue,
      placeholder: isLoading ? 'Aguardando resposta da IA...' : 'Digite uma tarefa, @arquivo, !shell ou /comando...',
      placeholderColor: theme.fgDim,
      backgroundColor: 'transparent',
      focusedBackgroundColor: 'transparent',
      textColor: isLoading ? theme.fgMuted : theme.fg,
      focusedTextColor: isLoading ? theme.fgMuted : theme.fg,
      cursorColor: theme.accent,
      wrapMode: 'word',
      
      keyBindings: [
        { name: 'return', meta: true, action: 'newline' },
        { name: 'return', shift: true, action: 'newline' },
      ],

      onContentChange: () => {
        if (textarea.isDestroyed) return;
        let text = textarea.plainText

        // Se o texto começa com uma quebra de linha (resquício do Enter anterior), limpa.
        if (text === '\n' || text === '\r\n') {
          textarea.setText('');
          return;
        }
        
        // Se estiver carregando e não for uma limpeza, ignora.
        if (stateRef.current.isLoading && text !== '') return;

        const containerWidth = containerRef.current?.width ?? 80
        const visualLines = estimateWrappedLines(text, containerWidth)
        const newLineCount = Math.max(MIN_LINES, Math.min(visualLines, MAX_LINES))
        
        setLineCount(newLineCount)
        setHasContent(text.length > 0)
        setValue(text)
        onValueChangeRef.current?.(text)
        if (textarea.height !== newLineCount) textarea.height = newLineCount
      },

      onCursorChange: (event) => {
        if (textarea.isDestroyed) return;
        cursorLineRef.current = event.line ?? 0
      },
    })

    textarea.onKeyDown = (key) => {
      if (textarea.isDestroyed || stateRef.current.isLoading) return;
      const { showSuggestions, suggestions, selectedIndex } = stateRef.current;

      // 1. PRIORIDADE MÁXIMA: Autocomplete
      if (showSuggestions && suggestions.length > 0) {
        if (key.name === 'up') {
          setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
          return;
        }
        if (key.name === 'down') {
          setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
          return;
        }
        if (key.name === 'return' || key.name === 'enter') {
          handleAutocompleteSelect(suggestions[selectedIndex]);
          return;
        }
        if (key.name === 'escape') {
          setShowSuggestions(false);
          return;
        }
      }

      // 2. Submissão manual
      if (key.name === 'return' || key.name === 'enter') {
        if (!key.alt && !key.meta && !key.shift && !key.ctrl) {
           const val = textarea.plainText.trim()
           if (val) {
             textarea.setText(''); // Limpa o buffer
             setValue('');         // Limpa o estado local
             onSubmitRef.current(val);
           }
           return; 
        }
      }
    };

    containerRef.current.add(textarea)
    if (isFocused && !isLoading) textarea.focus()
    textareaRef.current = textarea

    return () => {
      textareaRef.current = null
      textarea.destroy?.()
    }
  }, [renderer])

  useOnResize((newWidth) => {
    const textarea = textareaRef.current
    if (!textarea || textarea.isDestroyed || !textarea.plainText) return
    const lines = estimateWrappedLines(textarea.plainText, newWidth)
    const newLineCount = Math.max(MIN_LINES, Math.min(lines, MAX_LINES))
    setLineCount(newLineCount)
    textarea.height = newLineCount
  })

  const renderSideBar = () => {
    const bars = [];
    for (let i = 0; i < boxHeight; i++) {
      bars.push(<text key={i} fg={theme.accent}>│</text>);
    }
    return bars;
  };

  return (
    <box style={{ flexDirection: "column", width: "100%", position: "relative" }}>
      {showSuggestions && (
        <box style={{ position: "absolute", bottom: boxHeight, left: 2, zIndex: 100 }}>
          <Autocomplete 
            suggestions={suggestions}
            selectedIndex={selectedIndex}
            onSelect={handleAutocompleteSelect}
            visible={showSuggestions}
          />
        </box>
      )}

      <box 
        style={{
          backgroundColor: theme.bgPanel,
          paddingX: 0, 
          paddingY: 0, 
          flexDirection: "row",
          height: boxHeight,
          width: '100%',
        }}
      >
        <box style={{ flexDirection: "column", width: 1 }}>
          {renderSideBar()}
        </box>

        <box 
          style={{ 
            flexDirection: "column", 
            flexGrow: 1, 
            paddingTop: 1, 
            paddingBottom: 1,
            paddingLeft: 1, 
            paddingRight: 2 
          }}
        >
          <box 
            ref={containerRef}
            style={{
              flexGrow: 1,
              height: Math.min(lineCount, MAX_LINES),
            }}
          />
        </box>
      </box>
    </box>
  )
}
