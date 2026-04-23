import React from 'react'
import { useKeyboard } from '@opentui/react'
import { type ScrollBoxRenderable } from '@opentui/core'

interface Options {
  scrollboxRef: React.RefObject<ScrollBoxRenderable | null>
  isInputFocused: boolean
  terminalHeight: number
}

export function useScrollControl({ scrollboxRef, isInputFocused, terminalHeight }: Options) {
  useKeyboard((key) => {
    const box = scrollboxRef.current
    if (!box) return

    // Não capturar scroll quando o input está com foco E a tecla é ↑ ou ↓
    // (o InputField precisa delas para histórico)
    if (isInputFocused && (key.name === 'up' || key.name === 'down')) return

    // PgUp / PgDown sempre funcionam, independente do foco do input
    if (key.name === 'pageup') {
      box.scrollBy(-Math.floor(terminalHeight * 0.8))
      return
    }
    if (key.name === 'pagedown') {
      box.scrollBy(Math.floor(terminalHeight * 0.8))
      return
    }

    // Ctrl+U / Ctrl+D (meia tela)
    if (key.ctrl && key.name === 'u') {
      box.scrollBy(-Math.floor(terminalHeight / 2))
      return
    }
    if (key.ctrl && key.name === 'd') {
      box.scrollBy(Math.floor(terminalHeight / 2))
      return
    }

    // G — ir ao fundo
    if (!isInputFocused && key.name === 'g' && !key.shift) {
      box.scrollTo(box.scrollHeight)
      return
    }

    // ↑ / ↓ linha a linha — só quando input não está focado
    if (!isInputFocused && key.name === 'up')   box.scrollBy(-1)
    if (!isInputFocused && key.name === 'down')  box.scrollBy(1)
  })
}
