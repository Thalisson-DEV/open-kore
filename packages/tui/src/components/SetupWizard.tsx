import React, { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import SelectInput from 'ink-select-input'

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

  const handleProviderSelect = async (item: { value: string }) => {
    setProvider(item.value)
    if (item.value === 'ollama') {
      setLoading(true)
      try {
        const res = await fetch('http://localhost:8080/providers/ollama/models')
        const data = await res.json()
        setOllamaModels(data.models || [])
        setLoading(false)
        setStep(3) // Pula para Tier 1
      } catch (e) {
        setLoading(false)
        setStep(3)
      }
    } else {
      setStep(2)
    }
  }

  const handleApiKeySubmit = () => setStep(3)
  
  const handleTier1Select = (item: { value: string }) => {
    setTier1Model(item.value)
    setStep(4)
  }

  const handleTier1TextSubmit = (val: string) => {
    setTier1Model(val)
    setStep(4)
  }

  const handleTier2Select = (item: { value: string }) => {
    setTier2Model(item.value)
    handleFinalSubmit(tier1Model, item.value)
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
          model: t2, // Retrocompatibilidade
          masterPassword: 'alpha-no-password'
        })
      })
      onComplete()
    } catch (e) {
      setLoading(false)
    }
  }

  if (loading) return <Box padding={1}><Text color="gray">Processando...</Text></Box>

  return (
    <Box flexDirection="column" padding={2} flexGrow={1} justifyContent="center" alignItems="center" backgroundColor="#0A0A0A">
      <Text bold color="#7a9e7a">OpenKore — Primeiro Boot</Text>
      
      {step === 0 && (
        <Box flexDirection="column" marginTop={1} alignItems="center">
          <Text color="#666666">Oi, quem é você?</Text>
          <Box backgroundColor="#111111" paddingX={2} paddingY={1} marginTop={1} minWidth={40}>
            <Text color="#7a9e7a">› </Text>
            <TextInput value={userName} onChange={setUserName} onSubmit={handleNameSubmit} placeholder="Seu nome ou apelido" />
          </Box>
        </Box>
      )}

      {step === 1 && (
        <Box flexDirection="column" marginTop={1} alignItems="center">
          <Text color="#666666">Prazer, {userName || 'viajante'}! Selecione seu provider principal:</Text>
          <Box marginTop={1}>
            <SelectInput 
              items={[
                { label: 'OpenRouter (Nuvem)', value: 'openrouter' },
                { label: 'Ollama (Local)', value: 'ollama' }
              ]} 
              onSelect={handleProviderSelect} 
            />
          </Box>
        </Box>
      )}

      {step === 2 && (
        <Box flexDirection="column" marginTop={1} alignItems="center">
          <Text color="#666666">Informe sua API Key para {provider}:</Text>
          <Box backgroundColor="#111111" paddingX={2} paddingY={1} marginTop={1} minWidth={40}>
            <Text color="#7a9e7a">› </Text>
            <TextInput value={apiKey} onChange={setApiKey} onSubmit={handleApiKeySubmit} />
          </Box>
        </Box>
      )}

      {step === 3 && (
        <Box flexDirection="column" marginTop={1} alignItems="center">
          <Text color="#666666">Escolha o modelo Tier 1 (Rápido/Leitura):</Text>
          <Box marginTop={1}>
            {provider === 'ollama' && ollamaModels.length > 0 ? (
              <SelectInput items={ollamaModels.map(m => ({ label: m, value: m }))} onSelect={handleTier1Select} />
            ) : (
              <Box backgroundColor="#111111" paddingX={2} paddingY={1} minWidth={40}>
                <Text color="#7a9e7a">› </Text>
                <TextInput value={tier1Model} onChange={setTier1Model} onSubmit={handleTier1TextSubmit} placeholder="Ex: qwen-2.5-coder-7b" />
              </Box>
            )}
          </Box>
        </Box>
      )}

      {step === 4 && (
        <Box flexDirection="column" marginTop={1} alignItems="center">
          <Text color="#666666">Escolha o modelo Tier 2 (Inteligente/Escrita):</Text>
          <Box marginTop={1}>
            {provider === 'ollama' && ollamaModels.length > 0 ? (
              <SelectInput items={ollamaModels.map(m => ({ label: m, value: m }))} onSelect={handleTier2Select} />
            ) : (
              <Box backgroundColor="#111111" paddingX={2} paddingY={1} minWidth={40}>
                <Text color="#7a9e7a">› </Text>
                <TextInput value={tier2Model} onChange={setTier2Model} onSubmit={handleTier2TextSubmit} placeholder="Ex: qwen-2.5-coder-32b" />
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  )
}
