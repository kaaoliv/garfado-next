'use client'
import { useState, useEffect } from 'react'
import { useApp } from '@/lib/context'
import { getNotifications, markAllAsRead, markAsRead } from '@/lib/notifications'
import { Bell, Check } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

export function NotificationsScreen({ onClose }: { onClose: () => void }) {
  const { user } = useApp()
  const { t } = useI18n()
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    getNotifications(user.id).then(data => {
      setNotifications(data)
      setLoading(false)
    })
  }, [user])

  const handleMarkAllRead = async () => {
    if (!user) return
    await markAllAsRead(user.id)
    setNotifications(n => n.map(x => ({ ...x, read: true })))
  }

  const handleRead = async (id: string) => {
    await markAsRead(id)
    setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x))
  }

  const getIcon = (type: string) => {
    const icons: Record<string, string> = {
      follow: '👤', reaction: '😋', visit: '🍴', achievement: '🏆'
    }
    return icons[type] || '🔔'
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h`
    return `${Math.floor(hrs / 24)}d`
  }

  const unread = notifications.filter(n => !n.read).length

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="flex items-center justify-between px-4 py-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center touch-manipulation">
            <span className="text-lg">←</span>
          </button>
          <div>
            <h2 className="font-serif text-base font-bold">Notificações</h2>
            {unread > 0 && <p className="text-xs text-primary">{unread} não lidas</p>}
          </div>
        </div>
        {unread > 0 && (
          <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs text-primary touch-manipulation">
            <Check className="w-3 h-3" />
            Marcar todas
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading ? (
          <div className="flex flex-col gap-3 p-4">
            {[1,2,3].map(i => (
              <div key={i} className="bg-card rounded-2xl p-4 border border-border animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-3 bg-secondary rounded w-40 mb-2" />
                    <div className="h-2 bg-secondary rounded w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
            <Bell className="w-12 h-12 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground text-sm text-center">Nenhuma notificação ainda</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 p-4">
            {notifications.map(n => (
              <button key={n.id} onClick={() => handleRead(n.id)}
                className={`w-full flex items-start gap-3 rounded-2xl p-3 border touch-manipulation text-left transition-colors ${
                  n.read ? 'bg-card border-border' : 'bg-primary/5 border-primary/20'
                }`}>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-xl">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read && <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
