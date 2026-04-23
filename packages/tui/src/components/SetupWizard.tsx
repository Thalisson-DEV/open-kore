import React, { useState } from 'react'
import { useKeyboard } from '@opentui/react'
import { theme } from '../theme'

interface Option {
  label: string;
  value: string;
}

interface SelectProps {
  options: Option[];
  onSelect: (opt: Option) => void;
  focused: boolean;
  width?: number;
}

// Componente Select modular e customizado para o estilo OpenKore
const Select: React.FC<SelectProps> = ({ options, onSelect, focused, width = 40 }) => {
  const [index, setIndex] = useState(0);

  useKeyboard((key) => {
    if (!focused) return;
    if (key.name === 'up') setIndex(i => (i > 0 ? i - 1 : options.length - 1));
    if (key.name === 'down') setIndex(i => (i < options.length - 1 ? i + 1 : 0));
    if (key.name === 'return') onSelect(options[index]);
  });

  return (
    <box style={{ flexDirection: 'column', width }}>
      {options.map((opt, i) => {
        const isSelected = i === index;
        return (
          <box 
            key={opt.value} 
            style={{ 
              backgroundColor: isSelected ? theme.accent : 'transparent', 
              paddingX: 1,
              marginTop: 0,
              marginBottom: 0
            }}
          >
            <text fg={isSelected ? "#000000" : theme.fg} bold={isSelected}>
              {isSelected ? ' › ' : '   '}
              {opt.label}
            </text>
          </box>
        );
      })}
    </box>
  );
};

interface SetupInputProps {
  children: React.ReactNode;
  height?: number;
}

const SetupInput: React.FC<SetupInputProps> = ({ children, height = 3 }) => {
  const bars = [];
  for (let i = 0; i < height; i++) {
    bars.push(<text key={i} fg={theme.accent}>│</text>);
  }

  return (
    <box 
      style={{
        backgroundColor: theme.bgPanel,
        paddingX: 0,
        paddingY: 0, 
        flexDirection: "row",
        height,
        marginTop: 1,
        width: 'auto',
      }}
    >
      <box style={{ flexDirection: "column", width: 1 }}>
        {bars}
      </box>
      <box 
        style={{ 
          flexDirection: "row", 
          flexGrow: 1, 
          paddingY: 1,
          paddingLeft: 1,
          paddingRight: 2,
          alignItems: "center"
        }}
      >
        {children}
      </box>
    </box>
  );
};

interface SetupWizardProps {
  onComplete: () => void
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0)
  const [userName, setUserName] = useState('')
  const [provider, setProvider] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [tier1Model, setTier1Model] = useState('')
  const [tier2Model, setTier2Model] = useState('')
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleNameSubmit = () => setStep(1)

  const handleProviderSelect = async (opt: Option) => {
    const val = opt.value;
    setProvider(val)
    if (val === 'ollama') {
      setLoading(true)
      try {
        const res = await fetch('http://localhost:8080/providers/ollama/models')
        const data = await res.json()
        setOllamaModels(data.models || [])
        setLoading(false)
        setStep(3)
      } catch (e) {
        setLoading(false)
        setStep(3)
      }
    } else {
      setStep(2)
    }
  }

  const handleApiKeySubmit = () => setStep(3)
  
  const handleTier1Select = (opt: Option) => {
    setTier1Model(opt.value)
    setStep(4)
  }

  const handleTier1TextSubmit = (val: string) => {
    setTier1Model(val)
    setStep(4)
  }

  const handleTier2Select = (opt: Option) => {
    setTier2Model(opt.value)
    handleFinalSubmit(tier1Model, opt.value)
  }

  const handleTier2TextSubmit = (val: string) => {
    setTier2Model(val)
    handleFinalSubmit(tier1Model, val)
  }

  const handleFinalSubmit = async (t1: string, t2: string) => {
    setLoading(true)
    try {
      await fetch('http://localhost:8080/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userName,
          provider, 
          apiKey: provider === 'ollama' ? 'none' : apiKey, 
          tier1Model: t1,
          tier2Model: t2,
          model: t2,
          masterPassword: 'alpha-no-password'
        })
      })
      onComplete()
    } catch (e) {
      setLoading(false)
    }
  }

  if (loading) return (
    <box style={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}>
      <text fg={theme.fgDim}>Configurando seu ambiente...</text>
    </box>
  )

  return (
    <box style={{ flexDirection: "column", padding: 2, height: '100%', width: '100%', justifyContent: "center", alignItems: "center", backgroundColor: theme.bg }}>
      <text bold fg={theme.accent} style={{ marginBottom: 1 }}>OpenKore — Configuração Inicial</text>
      
      {step === 0 && (
        <box key="step0" style={{ flexDirection: "column", alignItems: "center" }}>
          <text fg={theme.fgDim}>Qual é o seu apelido?</text>
          <SetupInput>
            <text fg={theme.accent}> › </text>
            <input 
              value={userName} 
              onInput={setUserName} 
              onSubmit={handleNameSubmit} 
              placeholder="Digite seu nome..." 
              focused={true} 
              style={{ fg: theme.fg, width: 30, height: 1 }} 
            />
          </SetupInput>
          <text fg={theme.fgMuted} style={{ marginTop: 1 }}>Pressione [Enter] para continuar</text>
        </box>
      )}

      {step === 1 && (
        <box key="step1" style={{ flexDirection: "column", alignItems: "center" }}>
          <text fg={theme.fgDim}>Olá, {userName}! Selecione seu provedor de IA:</text>
          <SetupInput height={4}>
            <Select 
              options={[
                { label: 'OpenRouter (Nuvem)', value: 'openrouter' },
                { label: 'Ollama (Local)', value: 'ollama' }
              ]} 
              onSelect={handleProviderSelect} 
              focused={true}
              width={35}
            />
          </SetupInput>
        </box>
      )}

      {step === 2 && (
        <box key="step2" style={{ flexDirection: "column", alignItems: "center" }}>
          <text fg={theme.fgDim}>Informe sua API Key para {provider}:</text>
          <SetupInput>
            <text fg={theme.accent}> › </text>
            <input 
              value={apiKey} 
              onInput={setApiKey} 
              onSubmit={handleApiKeySubmit} 
              password={true}
              focused={true} 
              style={{ fg: theme.fg, width: 40, height: 1 }} 
            />
          </SetupInput>
        </box>
      )}

      {step === 3 && (
        <box key="step3" style={{ flexDirection: "column", alignItems: "center" }}>
          <text fg={theme.fgDim}>Escolha o modelo Tier 1 (Rápido/Leitura):</text>
          {provider === 'ollama' && ollamaModels.length > 0 ? (
            <SetupInput height={Math.min(ollamaModels.length + 2, 10)}>
              <Select 
                options={ollamaModels.map(m => ({ label: m, value: m }))} 
                onSelect={handleTier1Select} 
                focused={true}
                width={40} 
              />
            </SetupInput>
          ) : (
            <SetupInput>
              <text fg={theme.accent}> › </text>
              <input 
                value={tier1Model} 
                onInput={setTier1Model} 
                onSubmit={handleTier1TextSubmit} 
                placeholder="Ex: gpt-4o-mini" 
                focused={true} 
                style={{ fg: theme.fg, width: 35, height: 1 }} 
              />
            </SetupInput>
          )}
        </box>
      )}

      {step === 4 && (
        <box key="step4" style={{ flexDirection: "column", alignItems: "center" }}>
          <text fg={theme.fgDim}>Escolha o modelo Tier 2 (Inteligente/Escrita):</text>
          {provider === 'ollama' && ollamaModels.length > 0 ? (
            <SetupInput height={Math.min(ollamaModels.length + 2, 10)}>
              <Select 
                options={ollamaModels.map(m => ({ label: m, value: m }))} 
                onSelect={handleTier2Select} 
                focused={true}
                width={40} 
              />
            </SetupInput>
          ) : (
            <SetupInput>
              <text fg={theme.accent}> › </text>
              <input 
                value={tier2Model} 
                onInput={setTier2Model} 
                onSubmit={handleTier2TextSubmit} 
                placeholder="Ex: claude-3-5-sonnet" 
                focused={true} 
                style={{ fg: theme.fg, width: 35, height: 1 }} 
              />
            </SetupInput>
          )}
        </box>
      )}
    </box>
  )
}
