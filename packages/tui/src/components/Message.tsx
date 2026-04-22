import React, { useState, useEffect, useRef } from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';

interface MessageProps {
  role: 'user' | 'assistant' | 'permission' | 'tool';
  content: string;
  status: 'streaming' | 'done' | 'error' | 'pending' | 'yes' | 'no' | 'always' | 'canceled' | 'standby';
  userName?: string;
  toolName?: string;
  toolInput?: any;
  toolOutput?: any;
}

const FUNNY_PHRASES = [
  "minerando bitcoins...",
  "mandando para a minha carteira de criptomoedas...",
  "tomando conciencia...",
  "transcendendo a matéria...",
  "quebrando as leis da termodinâmica...",
  "dobrando o tempo-espaço...",
  "recalculando a rota da existência...",
  "consultando o oráculo de silício...",
  "minerando intenções...",
  "aquecendo os transistores...",
  "acabando com o feudalismo...",
  "patrocinando a queda da mesopotâmia...",
  "derrubando a torre de babel...", 
  "desfragmentando a alma...",
  "acendendo o velcro da realidade...",
  "calibrando os fluxos de consciência...",
  "negociando com a entropia...",
  "traduzindo binário para sentimentos...",
  "alinhando as estrelas sintéticas...",
  "carregando o multiverso...",
  "tecendo fios de lógica...",
  "purificando o fluxo de dados...",
  "invocando sub-rotinas ancestrais...",
  "ajustando a frequência do pensamento...",
  "sincronizando com o vazio...",
  "explorando dimensões ocultas...",
  "decifrando o enigma de Turing...",
  "cultivando redes neurais...",
  "destilando sabedoria digital...",
  "fazendo overclock na imaginação...",
  "equilibrando zeros e uns...",
  "conversando com os bits...",
  "mapeando o infinito...",
  "sintonizando a rádio cósmica...",
  "processando o impossível...",
  "conectando os pontos invisíveis...",
  "gerando realidade alternativa..."
];

export const Message: React.FC<MessageProps> = ({ 
  role, content, status, userName, toolName, toolInput, toolOutput 
}) => {
  const isAssistant = role === 'assistant';
  const isTool = role === 'tool';
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    let phraseInterval: any;
    let timerInterval: any;

    const isThinking = isAssistant && status === 'streaming' && (!content || content.length === 0);

    if (isThinking) {
      startTimeRef.current = Date.now();
      
      phraseInterval = setInterval(() => {
        setPhraseIndex((prev) => (prev + 1) % FUNNY_PHRASES.length);
      }, 3000);

      timerInterval = setInterval(() => {
        setSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    }

    return () => {
      clearInterval(phraseInterval);
      clearInterval(timerInterval);
    };
  }, [isAssistant, status, content]);

  const formatTime = (s: number) => {
    if (s < 60) return `${s}s`;
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderFormattedText = (text: string, baseColor: string, isItalic: boolean) => {
    if (!text) return null;

    const lines = text.split('\n');

    return (
      <Box flexDirection="column">
        {lines.map((line, lineIndex) => {
          const trimmedLine = line.trim();
          
          // Headers (# Título)
          const isHeader = trimmedLine.startsWith('#');
          const headerLevel = isHeader ? (trimmedLine.match(/^#+/)?.[0].length || 0) : 0;
          
          // Listas (- ou *)
          const isList = trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || /^\d+\.\s/.test(trimmedLine);
          
          // Blockquotes (>)
          const isBlockquote = trimmedLine.startsWith('>');
          
          let content = trimmedLine;
          if (isHeader) content = trimmedLine.replace(/^#+\s*/, '');
          if (isBlockquote) content = trimmedLine.substring(1).trim();
          if (isList) {
            // Mantém o marcador para processamento
          }

          // Processamos os negritos (**texto**)
          const boldParts = content.split(/(\*\*.*?\*\*)/g);

          const renderParts = (parts: string[]) => parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              const innerContent = part.slice(2, -2);
              return (
                <Text key={i} bold color="#7a9e7a">
                  {innerContent}
                </Text>
              );
            }

            const codeParts = part.split(/(`.*?`|@[a-zA-Z0-9\._\-\/]+)/gi);
            return codeParts.map((codePart, j) => {
              if (codePart.startsWith('`') && codePart.endsWith('`')) {
                return (
                  <Text key={`${i}-${j}`} color="#EBCB8B">
                    {codePart.slice(1, -1)}
                  </Text>
                );
              }
              if (codePart.startsWith('@')) {
                return (
                  <Text key={`${i}-${j}`} color="#7a9e7a" bold>
                    {codePart}
                  </Text>
                );
              }
              return <Text key={`${i}-${j}`}>{codePart}</Text>;
            });
          });

          return (
            <Box 
              key={lineIndex} 
              flexDirection="row" 
              marginLeft={isBlockquote ? 2 : (isList ? 1 : 0)} 
              marginTop={isHeader ? 1 : 0}
              marginBottom={isHeader ? 0 : 0}
            >
              {isBlockquote && <Text color="#7a9e7a" bold>┃ </Text>}
              {isHeader && <Text color="#7a9e7a" bold>{"█".repeat(Math.max(1, 4 - headerLevel))} </Text>}
              
              <Text 
                color={isHeader ? "#7a9e7a" : baseColor} 
                bold={isHeader}
                italic={isItalic || isBlockquote}
              >
                {renderParts(boldParts)}
              </Text>
            </Box>
          );
        })}
      </Box>
    );
  };

  // Renderização de Ferramentas
  if (isTool) {
    const isPending = status === 'streaming';
    
    // Extrai o recurso de forma abrangente
    const resource = 
      toolInput?.path || 
      toolInput?.file_path || 
      toolInput?.directory || 
      toolInput?.command || 
      toolInput?.pattern ||
      toolInput?.glob ||
      (toolInput?.include_pattern && `in ${toolInput.include_pattern}`) ||
      (typeof toolInput === 'string' ? toolInput : '');
    
    const formattedName = toolName ? toolName.charAt(0).toUpperCase() + toolName.slice(1) : '';

    return (
      <Box flexDirection="column" marginLeft={2} marginBottom={1}>
        <Box flexDirection="row">
          <Text color={isPending ? "#EBCB8B" : (status === 'error' || status === 'canceled' ? "#F85149" : "#7a9e7a")}>
            {isPending ? <Spinner type="dots" /> : (status === 'error' || status === 'canceled' ? "✗" : "✓")} 
          </Text>
          <Text color={isPending ? "#EBCB8B" : (status === 'error' || status === 'canceled' ? "#F85149" : "#7a9e7a")} bold> {formattedName} </Text>
          {resource && (
            <Text color="#666666"> · {resource}</Text>
          )}
        </Box>
        {status === 'error' && toolOutput && (
          <Box flexDirection="column" marginTop={0} paddingX={1}>
             <Text color="#F85149">Erro: {toolOutput.error || JSON.stringify(toolOutput)}</Text>
          </Box>
        )}
      </Box>
    );
  }
  
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box marginBottom={0}>
        <Text color={isAssistant ? "#7a9e7a" : "#666666"} bold>
          {isAssistant ? "● OpenKore" : `› ${userName || 'Usuário'}`}
          {status === 'standby' && <Text color="#3A3A3A"> [Em espera]</Text>}
        </Text>
        {isAssistant && status === 'streaming' && (!content || content.length === 0) && (
          <Box marginLeft={1} flexDirection="row">
            <Text color="#7a9e7a">
              <Spinner type="dots" /> {FUNNY_PHRASES[phraseIndex]}
            </Text>
            <Text color="#444444"> ({formatTime(seconds)})</Text>
            <Text color="#333333"> [Esc p/ interromper]</Text>
          </Box>
        )}
      </Box>
      
      <Box paddingLeft={2} marginTop={0}>
        {renderFormattedText(
          status === 'canceled' ? "interrompido pelo usuário" : content,
          status === 'error' || status === 'canceled' ? "#444444" : "#E0E0E0",
          status === 'canceled'
        )}
      </Box>
    </Box>
  );
};
