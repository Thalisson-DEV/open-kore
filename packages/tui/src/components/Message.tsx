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
  "transcendendo a matéria...",
  "quebrando as leis da termodinâmica...",
  "dobrando o tempo-espaço...",
  "recalculando a rota da existência...",
  "consultando o oráculo de silício...",
  "minerando intenções...",
  "aquecendo os transistores...",
  "desfragmentando a alma...",
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

  // Renderização de Ferramentas
  if (isTool) {
    const isPending = status === 'streaming';
    // Extrai o caminho do arquivo de diferentes possíveis formatos de input
    const filePath = toolInput?.path || toolInput?.file_path || (typeof toolInput === 'string' ? toolInput : '');
    const dirPath = toolInput?.dir_path;
    
    // Formata o nome da ferramenta (ex: readFile -> ReadFile)
    const formattedName = toolName ? toolName.charAt(0).toUpperCase() + toolName.slice(1) : '';

    return (
      <Box flexDirection="column" marginLeft={2} marginBottom={1}>
        <Box flexDirection="row">
          <Text color={isPending ? "#EBCB8B" : "#7a9e7a"}>
            {isPending ? <Spinner type="dots" /> : "✓"} 
          </Text>
          <Text color={isPending ? "#EBCB8B" : "#7a9e7a"} bold> {formattedName} </Text>
          {(filePath || dirPath) && (
            <Text color="#666666"> {filePath || dirPath}</Text>
          )}
        </Box>
        {status === 'done' && toolOutput && (
          <Box flexDirection="column" marginTop={1} paddingX={1} borderStyle="round" borderColor="#222222">
             <Text color="#444444">--- Content from referenced files ---</Text>
             <Text color="#666666">Content from @{filePath || 'file'}:</Text>
             <Box paddingLeft={1} marginY={1}>
               <Text color="#A0A0A0">
                 {typeof toolOutput === 'string' ? toolOutput : (toolOutput.content || JSON.stringify(toolOutput, null, 2))}
               </Text>
             </Box>
             <Text color="#444444">--- End of content ---</Text>
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
        <Text color={status === 'error' || status === 'canceled' ? "#444444" : "#E0E0E0"} italic={status === 'canceled'}>
          {status === 'canceled' ? "interrompido pelo usuário" : content}
        </Text>
      </Box>
    </Box>
  );
};
