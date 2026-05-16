'use client'
import { useEffect } from 'react'

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registrado:', reg.scope))
        .catch(err => console.log('SW falhou:', err))
    }

    // Interceptar botão voltar do Android para não fechar o app
    // Adiciona um estado no histórico para o botão voltar ter algo para "voltar"
    window.history.pushState({ garfado: true }, '', window.location.href)

    const handlePopState = (e: PopStateEvent) => {
      // Repõe o estado para que o próximo "voltar" também seja interceptado
      window.history.pushState({ garfado: true }, '', window.location.href)
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return null
}
