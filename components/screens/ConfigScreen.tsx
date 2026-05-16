'use client'
import { useState } from 'react'
import { useTheme } from 'next-themes'
import { useApp } from '@/lib/context'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { ChevronLeft, Sun, Moon, Bell, BellOff, Globe, Lock, LogOut, Trash2 } from 'lucide-react'
import { getLocale, setLocale, type Locale } from '@/lib/i18n'
import { useI18n } from '@/lib/i18n'

interface ConfigScreenProps {
  onBack: () => void
}

export function ConfigScreen({ onBack }: ConfigScreenProps) {
  const { theme, setTheme } = useTheme()
  const { profile, setProfile, signOut } = useApp()

  const [notificacoes, setNotificacoes] = useState(() => {
    try { return JSON.parse(localStorage.getItem('garfado_notif') || 'true') } catch { return true }
  })

  // Privacidade — salva só no localStorage (não depende de coluna no Supabase)
  const [contaPublica, setContaPublica] = useState(() => {
    try { return JSON.parse(localStorage.getItem('garfado_privacy') || 'true') } catch { return true }
  })

  const [idioma, setIdioma] = useState<Locale>(getLocale)
  const { t } = useI18n()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const toggleNotificacoes = () => {
    const next = !notificacoes
    setNotificacoes(next)
    localStorage.setItem('garfado_notif', JSON.stringify(next))
    toast.success(next ? t('config.notif_on') : t('config.notif_off'))
  }

  const togglePrivacidade = () => {
    const next = !contaPublica
    setContaPublica(next)
    localStorage.setItem('garfado_privacy', JSON.stringify(next))
    toast.success(next ? t('config.public_sub') : t('config.private_sub'))
  }

  const handleSelectIdioma = (lang: { id: Locale; label: string }) => {
    if (lang.id === idioma) return
    setIdioma(lang.id)
    toast.success(`Idioma: ${lang.label}`, {
      description: t('config.applying'),
    })
    // Salva e recarrega após o toast aparecer
    setTimeout(() => setLocale(lang.id), 1000)
  }

  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    try {
      await supabase.from('visits').delete().eq('user_id', profile!.id)
      await supabase.from('profiles').delete().eq('id', profile!.id)
      await supabase.auth.signOut()
      toast.success('Conta excluída')
    } catch {
      toast.error('Erro ao excluir conta')
      setDeleteLoading(false)
    }
  }

  const langs = [
    { id: 'pt-BR' as Locale, label: 'Português (Brasil)', flag: '🇧🇷' },
    { id: 'en' as Locale, label: 'English', flag: '🇺🇸' },
    { id: 'es' as Locale, label: 'Español', flag: '🇪🇸' },
  ]

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-background">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border flex-shrink-0">
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center touch-manipulation">
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-serif text-lg font-bold">{t('config.title')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-4 space-y-5">

        {/* Aparência */}
        <section>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2 px-1">{t('config.appearance')}</p>
          <div className="bg-card rounded-2xl border border-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {theme === 'dark' ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                <div>
                  <p className="text-sm font-medium">{t('config.theme')}</p>
                  <p className="text-xs text-muted-foreground">{theme === 'dark' ? t('config.dark') : t('config.light')}</p>
                </div>
              </div>
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={`relative w-14 h-7 rounded-full transition-colors touch-manipulation ${theme === 'dark' ? 'bg-primary' : 'bg-secondary border border-border'}`}
              >
                <div className={`absolute top-1 w-5 h-5 rounded-full shadow transition-transform flex items-center justify-center ${theme === 'dark' ? 'translate-x-8 bg-primary-foreground' : 'translate-x-1 bg-white'}`}>
                  {theme === 'dark' ? <Moon className="w-2.5 h-2.5 text-primary" /> : <Sun className="w-2.5 h-2.5 text-yellow-500" />}
                </div>
              </button>
            </div>
          </div>
        </section>

        {/* Idioma */}
        <section>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2 px-1">{t('config.language')}</p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {langs.map((lang, i) => (
              <button key={lang.id}
                onClick={() => handleSelectIdioma(lang)}
                className={`w-full flex items-center justify-between p-4 touch-manipulation transition-colors ${
                  i < langs.length - 1 ? 'border-b border-border' : ''
                } ${idioma === lang.id ? 'bg-primary/5' : 'hover:bg-secondary/50'}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{lang.flag}</span>
                  <p className="text-sm font-medium">{lang.label}</p>
                </div>
                {idioma === lang.id && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground px-1 mt-1.5">O app será recarregado para aplicar o idioma.</p>
        </section>

        {/* Notificações */}
        <section>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2 px-1">{t('config.notifications')}</p>
          <div className="bg-card rounded-2xl border border-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {notificacoes ? <Bell className="w-5 h-5 text-primary" /> : <BellOff className="w-5 h-5 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium">{t('config.notifications')}</p>
                  <p className="text-xs text-muted-foreground">{notificacoes ? t('config.notif_on') : t('config.notif_off')}</p>
                </div>
              </div>
              <button onClick={toggleNotificacoes}
                className={`relative w-14 h-7 rounded-full transition-colors touch-manipulation ${notificacoes ? 'bg-primary' : 'bg-secondary border border-border'}`}>
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${notificacoes ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Privacidade */}
        <section>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2 px-1">{t('config.privacy')}</p>
          <div className="bg-card rounded-2xl border border-border">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {contaPublica ? <Globe className="w-5 h-5 text-primary" /> : <Lock className="w-5 h-5 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium">{t('config.public')}</p>
                  <p className="text-xs text-muted-foreground">{contaPublica ? t('config.public_sub') : t('config.private_sub')}</p>
                </div>
              </div>
              <button onClick={togglePrivacidade}
                className={`relative w-14 h-7 rounded-full transition-colors touch-manipulation ${contaPublica ? 'bg-primary' : 'bg-secondary border border-border'}`}>
                <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${contaPublica ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </section>

        {/* Conta */}
        <section>
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2 px-1">{t('config.account')}</p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <button onClick={signOut}
              className="w-full flex items-center gap-3 p-4 border-b border-border touch-manipulation hover:bg-secondary/50 transition-colors">
              <LogOut className="w-5 h-5 text-muted-foreground" />
              <p className="text-sm font-medium">{t('config.signout')}</p>
            </button>
            <button onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 p-4 touch-manipulation hover:bg-red-500/5 transition-colors">
              <Trash2 className="w-5 h-5 text-red-500" />
              <p className="text-sm font-medium text-red-500">{t('config.delete')}</p>
            </button>
          </div>
        </section>

        <p className="text-center text-xs text-muted-foreground/40 pb-4">Garfado v1.0.0</p>
      </div>

      {/* Modal excluir conta */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-[390px] bg-card rounded-t-3xl p-6 border-t border-border">
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-5" />
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h2 className="font-serif text-lg font-bold text-center mb-2">{t('config.delete_title')}</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">{t('config.delete_msg')}</p>
            <div className="flex flex-col gap-2">
              <button onClick={handleDeleteAccount} disabled={deleteLoading}
                className="w-full py-3.5 rounded-2xl bg-red-500 text-white font-semibold text-sm touch-manipulation disabled:opacity-60">
                {deleteLoading ? '...' : t('config.delete_confirm')}
              </button>
              <button onClick={() => setShowDeleteConfirm(false)}
                className="w-full py-3.5 rounded-2xl bg-secondary text-foreground text-sm touch-manipulation">
                {t('config.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
