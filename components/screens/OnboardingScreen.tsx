'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { useApp } from '@/lib/context'
import { ForkIcon } from '@/components/shared/ForkIcon'
import { toast } from 'sonner'
import { ChevronRight } from 'lucide-react'
import { AuthScreen } from './AuthScreen'

const slides = [
  {
    emoji: '🍽',
    titleKey: 'onboarding.slide1_title',
    descKey: 'onboarding.slide1_desc',
    color: '#4ade80',
  },
  {
    emoji: '👥',
    titleKey: 'onboarding.slide2_title',
    descKey: 'onboarding.slide2_desc',
    color: '#60a5fa',
  },
  {
    emoji: '🎯',
    titleKey: 'onboarding.slide3_title',
    descKey: 'onboarding.slide3_desc',
    color: '#f59e0b',
  },
]

export function OnboardingScreen() {
  const { finishOnboarding } = useApp()
  const { t } = useI18n()
  const [step, setStep] = useState(0) // 0,1,2 = slides, 3 = username
  const [showAuth, setShowAuth] = useState(false)
  const [username, setUsername] = useState('')
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const checkTimer = useRef<any>(null)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [direction, setDirection] = useState(1)

  const handleNext = () => {
    setDirection(1)
    setStep(s => s + 1)
  }

  const handleBack = () => {
    setDirection(-1)
    setStep(s => s - 1)
  }

  const handleSubmit = async () => {
    const un = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '')
    if (!un || un.length < 3) { toast.error(t('onboarding.username_min')); return }
    setLoading(true)
    const ok = await finishOnboarding(un, name.trim() || 'Explorador')
    if (!ok) { toast.error(t('onboarding.username_taken')); setLoading(false) }
  }

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  }

  if (showAuth) return <AuthScreen />

  return (
    <div className="flex-1 flex flex-col overflow-hidden">

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-2 pt-6 pb-2 flex-shrink-0">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`rounded-full transition-all duration-300 ${
            i === step
              ? 'w-6 h-2 bg-primary'
              : i < step
                ? 'w-2 h-2 bg-primary/40'
                : 'w-2 h-2 bg-border'
          }`} />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence custom={direction} mode="wait">
          {step < 3 ? (
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center px-8 gap-8 text-center"
            >
              {/* Emoji com fundo colorido */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="w-28 h-28 rounded-3xl flex items-center justify-center text-6xl"
                style={{ background: slides[step].color + '20', border: `2px solid ${slides[step].color}30` }}
              >
                {slides[step].emoji}
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.4 }}
                className="flex flex-col gap-3"
              >
                <h1 className="font-serif text-2xl font-bold">{t(slides[step].titleKey)}</h1>
                <p className="text-sm text-muted-foreground leading-relaxed">{t(slides[step].descKey)}</p>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="username"
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-center px-8 gap-6"
            >
              <div className="flex flex-col items-center gap-3 text-center">
                <ForkIcon className="w-10 h-14 text-primary" />
                <h1 className="font-serif text-2xl font-bold">{t('onboarding.setup_title')}</h1>
                <p className="text-sm text-muted-foreground">{t('onboarding.setup_desc')}</p>
              </div>

              <div className="w-full flex flex-col gap-3">
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('onboarding.name_placeholder')}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                />
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
                  <input
                    value={username}
                    onChange={async e => {
                      const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                      setUsername(val)
                      setUsernameAvailable(null)
                      if (val.length >= 3) {
                        clearTimeout(checkTimer.current)
                        checkTimer.current = setTimeout(async () => {
                          const { supabase } = await import('@/lib/supabase')
                          const { data } = await supabase.from('profiles').select('id').eq('username', val).maybeSingle()
                          setUsernameAvailable(!data)
                        }, 600)
                      }
                    }}
                    placeholder="username"
                    className="w-full bg-card border border-border rounded-xl pl-8 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{t('perfil.username_hint')}</p>
                  {username.length >= 3 && (
                    <p className={`text-xs font-medium ${usernameAvailable === true ? 'text-primary' : usernameAvailable === false ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {usernameAvailable === true ? '✓ disponível' : usernameAvailable === false ? '✗ já em uso' : '...'}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Botões */}
      <div className="px-8 pb-8 flex-shrink-0 flex flex-col gap-3">
        {step < 3 ? (
          <>
            <button
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-sm active:scale-[0.98] transition-all touch-manipulation"
            >
              {t('onboarding.next')}
              <ChevronRight className="w-4 h-4" />
            </button>
            {step > 0 && (
              <button
                onClick={handleBack}
                className="w-full py-3 text-sm text-muted-foreground touch-manipulation"
              >
                {t('onboarding.back')}
              </button>
            )}
            {step === 0 && (
              <button
                onClick={() => setShowAuth(true)}
                className="w-full py-3 text-sm text-muted-foreground touch-manipulation"
              >
                {t('onboarding.skip')}
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-semibold text-sm disabled:opacity-50 active:scale-[0.98] transition-all touch-manipulation"
            >
              {loading ? t('perfil.saving') : t('onboarding.enter')}
            </button>
            <button
              onClick={handleBack}
              className="w-full py-3 text-sm text-muted-foreground touch-manipulation"
            >
              {t('onboarding.back')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
