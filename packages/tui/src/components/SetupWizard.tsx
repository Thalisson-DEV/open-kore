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
  const [model, setModel] = useState('')
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
        setStep(3) // Pula API Key para Ollama
      } catch (e) {
        setLoading(false)
        setStep(3)
      }
    } else {
      setStep(2)
    }
  }

  const handleApiKeySubmit = () => setStep(3)
  
  const handleModelSelect = (item: { value: string }) => {
    setModel(item.value)
    handleFinalSubmit(item.value)
  }

  const handleModelTextSubmit = (val: string) => {
    handleFinalSubmit(val)
  }

  const handleFinalSubmit = async (finalModel: string) => {
    setLoading(true)
    try {
      await fetch('http://localhost:8080/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userName,
          provider, 
          apiKey: provider === 'ollama' ? 'none' : apiKey, 
          model: finalModel,
          masterPassword: 'alpha-no-password' // Temporário para o Alpha
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

      {step === 3 && provider === 'ollama' && (
        <Box flexDirection="column" marginTop={1} alignItems="center">
          <Text color="#666666">Selecione um modelo instalado no seu Ollama:</Text>
          <Box marginTop={1}>
            {ollamaModels.length > 0 ? (
              <SelectInput 
                items={ollamaModels.map(m => ({ label: m, value: m }))} 
                onSelect={handleModelSelect} 
              />
            ) : (
              <Box flexDirection="column" alignItems="center">
                <Text color="red">Nenhum modelo encontrado no Ollama.</Text>
                <Text color="gray">Certifique-se que o Ollama está rodando.</Text>
                <Box backgroundColor="#111111" paddingX={2} paddingY={1} marginTop={1}>
                  <Text color="#666666">Digite o nome do modelo manualmente: </Text>
                  <TextInput value={model} onChange={setModel} onSubmit={handleModelTextSubmit} />
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {step === 2 && provider === 'openrouter' && (
        <Box flexDirection="column" marginTop={1} alignItems="center">
          <Text color="#666666">Qual modelo deseja usar?</Text>
          <Box backgroundColor="#111111" paddingX={2} paddingY={1} marginTop={1} minWidth={40}>
            <Text color="#7a9e7a">› </Text>
            <TextInput 
              value={model} 
              onChange={setModel} 
              onSubmit={handleModelTextSubmit} 
              placeholder="Ex: qwen/qwen-2.5-coder-32b-instruct" 
            />
          </Box>
          <Text color="gray" dimColor marginTop={1}>Pressione Enter para o padrão (Qwen 2.5 Coder)</Text>
        </Box>
      )}
    </Box>
  )
}
