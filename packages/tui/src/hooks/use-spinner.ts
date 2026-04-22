import { useRenderer } from '@opentui/react'
import { useEffect, useState } from 'react'

const SPINNER_FRAMES = ['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏']

export function useSpinner(active: boolean) {
  const renderer = useRenderer()
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!active) return

    renderer.requestLive()
    const interval = setInterval(() => {
      setFrame(f => (f + 1) % SPINNER_FRAMES.length)
    }, 80)

    return () => {
      clearInterval(interval)
      renderer.dropLive()
    }
  }, [active, renderer])

  return active ? SPINNER_FRAMES[frame] : ''
}
