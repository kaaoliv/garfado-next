import { supabase } from './supabase'

// VAPID keys — para produção gerar com web-push
// Por enquanto usamos um par fixo para desenvolvimento
export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''

export async function requestPushPermission(userId: string): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false
  
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const reg = await navigator.serviceWorker.ready
    
    // Verificar se já tem subscription
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
    }

    const json = sub.toJSON()
    const keys = json.keys as any

    await supabase.from('push_subscriptions').upsert({
      user_id: userId,
      endpoint: sub.endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    }, { onConflict: 'user_id,endpoint' })

    return true
  } catch (e) {
    console.error('Push permission error:', e)
    return false
  }
}

export async function sendNotification(
  toUserId: string,
  type: 'follow' | 'reaction' | 'visit' | 'achievement',
  title: string,
  body: string,
  data: Record<string, any> = {}
) {
  // Salvar no banco (in-app notification)
  await supabase.from('notifications').insert({
    user_id: toUserId,
    type,
    title,
    body,
    data,
  })
}

export async function getNotifications(userId: string) {
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)
  return data || []
}

export async function markAsRead(notificationId: string) {
  await supabase.from('notifications').update({ read: true }).eq('id', notificationId)
}

export async function markAllAsRead(userId: string) {
  await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
