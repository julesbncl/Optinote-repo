'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { MESSAGE_TYPES } from '@/lib/constants'
import {
  Send,
  Copy,
  Check,
  RefreshCw,
  Star,
  StarOff,
  Clock,
  Sparkles,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { GeneratedMessage } from '@/types/database'

export default function MessagesPage() {
  const supabase = createClient()
  const [messages, setMessages] = useState<GeneratedMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatedMessage, setGeneratedMessage] = useState('')
  const [selectedType, setSelectedType] = useState('absence')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadMessages()
  }, [])

  async function loadMessages() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('generated_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    setMessages(data || [])
    setLoading(false)
  }

  async function handleGenerate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setGenerating(true)
    setGeneratedMessage('')

    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch('/api/ai/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageType: selectedType,
          context: formData.get('context'),
          teacherName: formData.get('teacherName') || undefined,
          studentName: formData.get('studentName') || undefined,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Erreur de génération')
      }

      const data = await response.json()
      setGeneratedMessage(data.message)
      toast.success('Message généré !')
      loadMessages()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erreur'
      toast.error(message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(generatedMessage)
    setCopied(true)
    toast.success('Copié dans le presse-papiers !')
    setTimeout(() => setCopied(false), 2000)
  }

  async function toggleFavorite(msg: GeneratedMessage) {
    const { error } = await supabase
      .from('generated_messages')
      .update({ is_favorite: !msg.is_favorite })
      .eq('id', msg.id)

    if (!error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id ? { ...m, is_favorite: !m.is_favorite } : m
        )
      )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-text-primary">
          Générateur de Messages Pro
        </h2>
        <p className="text-sm text-text-secondary mt-1">
          Génère des messages formels et polis pour tes professeurs
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generator form */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary-600" />
                Nouveau message
              </div>
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Message type selector */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Type de message
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MESSAGE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSelectedType(type.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                      selectedType === type.value
                        ? 'bg-primary-50 text-primary-700 border-2 border-primary-300'
                        : 'bg-surface border border-border text-text-secondary hover:bg-surface-tertiary'
                    }`}
                  >
                    <span>{type.emoji}</span>
                    <span className="truncate">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <Input
              name="teacherName"
              label="Nom du professeur"
              placeholder="ex: M. Dupont (optionnel)"
            />

            <Input
              name="studentName"
              label="Ton nom"
              placeholder="ex: Jade Bonicel (optionnel)"
            />

            <Textarea
              name="context"
              label="Contexte / Détails"
              placeholder="Décris ta situation : pourquoi tu étais absent, quelle question tu veux poser, etc."
              rows={4}
              required
            />

            <Button
              type="submit"
              className="w-full"
              isLoading={generating}
              leftIcon={<Send className="h-4 w-4" />}
            >
              Générer le message
            </Button>
          </form>

          {/* Generated message preview */}
          {generatedMessage && (
            <div className="mt-6 p-4 bg-surface-secondary rounded-xl border border-border">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-text-primary">
                  Message généré
                </h4>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    leftIcon={
                      copied ? (
                        <Check className="h-4 w-4 text-success-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )
                    }
                  >
                    {copied ? 'Copié !' : 'Copier'}
                  </Button>
                </div>
              </div>
              <div className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">
                {generatedMessage}
              </div>
            </div>
          )}
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-text-tertiary" />
                Historique
              </div>
            </CardTitle>
          </CardHeader>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-lg" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <Send className="h-10 w-10 text-text-tertiary mx-auto mb-3" />
              <p className="text-sm text-text-secondary">
                Aucun message généré encore.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto no-scrollbar">
              {messages.map((msg) => {
                const typeInfo = MESSAGE_TYPES.find(
                  (t) => t.value === msg.message_type
                )
                return (
                  <div
                    key={msg.id}
                    className="p-3 rounded-lg border border-border hover:bg-surface-tertiary transition-colors cursor-pointer"
                    onClick={() => setGeneratedMessage(msg.generated_content)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="primary">
                        {typeInfo?.emoji} {typeInfo?.label}
                      </Badge>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleFavorite(msg)
                        }}
                        className="p-1 cursor-pointer"
                      >
                        {msg.is_favorite ? (
                          <Star className="h-4 w-4 text-warning-500 fill-warning-500" />
                        ) : (
                          <StarOff className="h-4 w-4 text-text-tertiary hover:text-warning-500" />
                        )}
                      </button>
                    </div>
                    <p className="text-sm text-text-secondary line-clamp-2">
                      {msg.generated_content}
                    </p>
                    <p className="text-xs text-text-tertiary mt-1">
                      {new Date(msg.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
