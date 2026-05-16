'use client'
import { motion } from 'framer-motion'
import { Crown, X, Check, BarChart2, Zap } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

interface PaywallScreenProps {
  onClose: () => void
  onSubscribe: () => void
}

export function PaywallScreen({ onClose, onSubscribe }: PaywallScreenProps) {
  const { t } = useI18n()

  const benefits = [
    { icon: '📊', key: 'paywall.benefit1' },
    { icon: '📅', key: 'paywall.benefit2' },
    { icon: '🏆', key: 'paywall.benefit3' },
    { icon: '🚫', key: 'paywall.benefit4' },
    { icon: '⚡', key: 'paywall.benefit5' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-[430px] bg-card rounded-t-3xl border-t border-border overflow-hidden flex flex-col"
        style={{ maxHeight: '90dvh' }}
      >
        {/* Handle */}
        <div className="w-10 h-1 bg-border rounded-full mx-auto mt-3 mb-4" />

        {/* Fechar */}
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary flex items-center justify-center touch-manipulation">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="px-6 pb-8 overflow-y-auto flex-1 scrollbar-hide">
          {/* Hero */}
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Crown className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <h2 className="font-serif text-2xl font-bold">Garfado Pro</h2>
              <p className="text-sm text-muted-foreground mt-1">{t('paywall.subtitle')}</p>
            </div>
          </div>

          {/* Benefícios */}
          <div className="flex flex-col gap-3 mb-6">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-lg">
                  {b.icon}
                </div>
                <p className="text-sm text-foreground">{t(b.key)}</p>
                <Check className="w-4 h-4 text-primary ml-auto flex-shrink-0" />
              </motion.div>
            ))}
          </div>

          {/* Preço */}
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-5 text-center">
            <p className="text-3xl font-bold font-serif text-primary">R$ 19,90</p>
            <p className="text-sm text-muted-foreground">{t('paywall.per_month')}</p>
            <p className="text-xs text-primary/70 mt-1">{t('paywall.cancel_anytime')}</p>
          </div>

          {/* Botão */}
          <motion.button
            onClick={onSubscribe}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-base touch-manipulation flex items-center justify-center gap-2"
          >
            <Crown className="w-5 h-5" />
            {t('paywall.subscribe')}
          </motion.button>
          <p className="text-center text-xs text-muted-foreground mt-3">{t('paywall.terms')}</p>
        </div>
      </motion.div>
    </motion.div>
  )
}
