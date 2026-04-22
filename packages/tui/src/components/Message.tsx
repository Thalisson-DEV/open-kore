import React, { useState, useEffect, useRef } from 'react';
import { theme } from '../theme';
import { useSpinner } from '../hooks/use-spinner';
import { ToolBlock } from './ToolBlock';
import { useTheme } from '../core/ThemeContext';

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
  "gerando reality alternativa..."
];

export const Message: React.FC<MessageProps> = ({ 
  role, content, status, userName, toolName, toolInput, toolOutput 
}) => {
  const { syntaxStyle } = useTheme();
  const isAssistant = role === 'assistant';
  const isTool = role === 'tool';
  const isThinking = isAssistant && status === 'streaming' && (!content || content.length === 0);
  const isToolPending = isTool && status === 'streaming';
  
  const spinner = useSpinner(isThinking || isToolPending);
  
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    let phraseInterval: any;
    let timerInterval: any;

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
  }, [isThinking]);

  const formatTime = (s: number) => {
    if (s < 60) return `${s}s`;
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isTool) {
    return (
      <ToolBlock 
        toolName={toolName || ''} 
        toolInput={toolInput} 
        toolOutput={toolOutput} 
        status={status as any} 
      />
    );
  }
  
  if (role === 'user') {
    return (
      <box style={{ flexDirection: "column", marginBottom: 1, width: "100%" }}>
        <box 
          style={{
            backgroundColor: theme.bgPanel,
            paddingX: 2,
            paddingY: 1,
            flexDirection: "row"
          }}
        >
          <text fg={theme.accent} bold>┃ </text>
          <box style={{ flexGrow: 1 }}>
            <markdown
              content={content}
              syntaxStyle={syntaxStyle}
              style={{ fg: theme.fg, width: '100%' }}
            />
          </box>
        </box>
      </box>
    );
  }

  const isGenericAbortMessage = content === 'streamAborted' || content === 'The operation was aborted' || content === 'AbortError';

  return (
    <box style={{ flexDirection: "column", marginBottom: 1 }}>
      <box style={{ marginBottom: 0 }}>
        <text fg={status === 'canceled' ? theme.fgMuted : (isAssistant ? theme.accent : theme.fgDim)} bold>
          {isAssistant ? "● OpenKore" : `› ${userName || 'Usuário'}`}
          {status === 'standby' ? <span fg={theme.fgMuted}> [Em espera]</span> : null}
          {status === 'canceled' ? <span fg={theme.error} dim> [Interrompido]</span> : null}
        </text>
        {isThinking ? (
          <box style={{ marginLeft: 1, flexDirection: "row" }}>
            <text fg={theme.accent}>
              {spinner} {FUNNY_PHRASES[phraseIndex]}
            </text>
            <text fg="#444444"> ({formatTime(seconds)})</text>
            <text fg="#333333"> [Esc p/ interromper]</text>
          </box>
        ) : null}
      </box>
      
      <box style={{ paddingLeft: 2, marginTop: 0 }}>
        {status === 'canceled' && (!content || isGenericAbortMessage) ? (
          <text italic fg={theme.fgMuted}>Interrompido pelo usuário.</text>
        ) : (
          <markdown
            content={content}
            syntaxStyle={syntaxStyle}
            style={{ 
              fg: status === 'error' ? theme.error : (status === 'canceled' ? theme.fgDim : theme.fg), 
              width: '100%' 
            }}
          />
        )}
      </box>
    </box>
  );
};
