import React, { useState } from 'react'
import { Box, Text } from 'ink'
import TextInput from 'ink-text-input'
import SelectInput from 'ink-select-input'

interface SetupWizardProps {
  onComplete: () => void
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0)
  const [provider, setProvider] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleProviderSelect = (item: { value: string }) => {
    setProvider(item.value)
    setStep(1)
  }

  const handleApiKeySubmit = () => setStep(2)
  const handleModelSubmit = () => setStep(3)
  
  const handleFinalSubmit = async () => {
    setLoading(true)
    try {
      await fetch('http://localhost:8080/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          provider, 
          apiKey, 
          model: model || (provider === 'openrouter' ? 'qwen/qwen-2.5-coder-32b-instruct' : 'llama3'),
          masterPassword: password 
        })
      })
      onComplete()
    } catch (e) {
      setLoading(false)
      alert('Erro ao salvar configuração')
    }
  }

  if (loading) return <Text>Salvando configurações...</Text>

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="blue">
      <Text bold color="blue">OpenKore — Primeiro Boot</Text>
      
      {step === 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text>Selecione seu provider principal:</Text>
          <SelectInput 
            items={[
              { label: 'OpenRouter', value: 'openrouter' },
              { label: 'Ollama (Local)', value: 'ollama' }
            ]} 
            onSelect={handleProviderSelect} 
          />
        </Box>
      )}

      {step === 1 && (
        <Box flexDirection="column" marginTop={1}>
          <Text>Informe sua API Key para {provider}:</Text>
          <Box>
            <Text color="blue">› </Text>
            <TextInput value={apiKey} onChange={setApiKey} onSubmit={handleApiKeySubmit} />
          </Box>
        </Box>
      )}

      {step === 2 && (
        <Box flexDirection="column" marginTop={1}>
          <Text>Modelo padrão (opcional, deixe vazio para default):</Text>
          <Box>
            <Text color="blue">› </Text>
            <TextInput value={model} onChange={setModel} onSubmit={handleModelSubmit} placeholder="Ex: qwen/qwen-2.5-coder-32b-instruct" />
          </Box>
        </Box>
      )}

      {step === 3 && (
        <Box flexDirection="column" marginTop={1}>
          <Text>Defina sua Master Password (usada para criptografar suas chaves):</Text>
          <Box>
            <Text color="blue">› </Text>
            <TextInput value={password} onChange={setPassword} onSubmit={handleFinalSubmit} mask="*" />
          </Box>
        </Box>
      )}
    </Box>
  )
}
