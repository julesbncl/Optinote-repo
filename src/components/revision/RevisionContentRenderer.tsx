'use client'

import React, { useState } from 'react'
import {
  Bookmark,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  Sparkles,
  BookOpen,
} from 'lucide-react'

interface Flashcard {
  question: string
  answer: string
}

interface RevisionContentRendererProps {
  content: string
  flashcards?: Flashcard[]
  className?: string
}

// Nettoie et convertit les notations LaTeX usuelles pour un rendu lisible, fluide et naturel
export function cleanMathNotation(text: string): string {
  if (!text) return ''
  let result = text
    // 1. Suppression des délimiteurs LaTeX bruts et espacements
    .replace(/\\\(/g, '')
    .replace(/\\\)/g, '')
    .replace(/\\\[/g, '')
    .replace(/\\\]/g, '')
    .replace(/\\qquad\b/g, '   ')
    .replace(/\\quad\b/g, '  ')
    .replace(/\\[,;:!]/g, ' ')

    // 2. Ensembles de nombres et symboles mathématiques usuels
    .replace(/\\mathbb\{R\}|\\mathbf\{R\}/g, 'ℝ')
    .replace(/\\mathbb\{N\}|\\mathbf\{N\}/g, 'ℕ')
    .replace(/\\mathbb\{Z\}|\\mathbf\{Z\}/g, 'ℤ')
    .replace(/\\mathbb\{Q\}|\\mathbf\{Q\}/g, 'ℚ')
    .replace(/\\mathbb\{C\}|\\mathbf\{C\}/g, 'ℂ')
    .replace(/\\in\b/g, '∈')
    .replace(/\\notin\b/g, '∉')
    .replace(/\\forall\b/g, '∀')
    .replace(/\\exists\b/g, '∃')
    .replace(/\\emptyset\b/g, '∅')
    .replace(/\\infty\b/g, '∞')

    // 3. Lettres grecques
    .replace(/\\alpha\b/g, 'α')
    .replace(/\\beta\b/g, 'β')
    .replace(/\\gamma\b/g, 'γ')
    .replace(/\\delta\b/g, 'δ')
    .replace(/\\Delta\b/g, 'Δ')
    .replace(/\\theta\b/g, 'θ')
    .replace(/\\lambda\b/g, 'λ')
    .replace(/\\pi\b/g, 'π')
    .replace(/\\sigma\b/g, 'σ')
    .replace(/\\mu\b/g, 'µ')
    .replace(/\\omega\b/g, 'ω')
    .replace(/\\Omega\b/g, 'Ω')

    // 4. Opérateurs, relations et flèches
    .replace(/\\iff\b|\\Leftrightarrow\b/g, '⟺')
    .replace(/\\implies\b|\\Rightarrow\b/g, '⟹')
    .replace(/\\to\b|\\rightarrow\b/g, '→')
    .replace(/\\le\b|\\leq\b/g, '≤')
    .replace(/\\ge\b|\\geq\b/g, '≥')
    .replace(/\\neq\b/g, '≠')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\equiv\b/g, '≡')
    .replace(/\\pm\b/g, '±')
    .replace(/\\times\b/g, '×')
    .replace(/\\div\b/g, '÷')
    .replace(/\\cdot\b/g, '·')
    .replace(/\\sum\b/g, '∑')
    .replace(/\\prod\b/g, '∏')
    .replace(/\\int\b/g, '∫')
    .replace(/\\partial\b/g, '∂')
    .replace(/\\nabla\b/g, '∇')
    .replace(/\\subset\b/g, '⊂')
    .replace(/\\subseteq\b/g, '⊆')
    .replace(/\\cup\b/g, '∪')
    .replace(/\\cap\b/g, '∩')

  // 5. Passes successives pour traiter les fractions, racines et textes imbriqués
  for (let i = 0; i < 4; i++) {
    result = result
      .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')
      .replace(/\\sqrt\[([^{}]+)\]\{([^{}]+)\}/g, '$1√($2)')
      .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1 / $2)')
      .replace(/\\textbf\{([^{}]+)\}/g, '**$1**')
      .replace(/\\textit\{([^{}]+)\}/g, '*$1*')
      .replace(/\\mathbf\{([^{}]+)\}/g, '$1')
      .replace(/\\text\{([^{}]+)\}/g, '$1')
      .replace(/\\mathrm\{([^{}]+)\}/g, '$1')
      .replace(/\\left\(/g, '(')
      .replace(/\\right\)/g, ')')
      .replace(/\\left\[/g, '[')
      .replace(/\\right\]/g, ']')
      .replace(/\\left\{/g, '{')
      .replace(/\\right\}/g, '}')
  }

  // 6. Nettoyage des balises dollars mathématiques
  return result
    .replace(/\$\$([^$]+)\$\$/g, '$1')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\\([a-zA-Z]+)/g, '$1') // Fallback pour tout résidu d'antislash
}

// Supprime les symboles markdown pour un affichage texte brut pur (résumés, badges)
export function cleanPlainText(text: string): string {
  if (!text) return ''
  return cleanMathNotation(text)
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^>\s*/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/---|\*\*\*|___/g, '')
    .trim()
}

// Rendu inline récursif pour gérer le **Gras**, *Italique*, et `Code`
function renderInlineText(text: string): React.ReactNode[] {
  const cleaned = cleanMathNotation(text)

  // Tokenize bold **text** and `code`
  const parts: React.ReactNode[] = []
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(cleaned)) !== null) {
    if (match.index > lastIndex) {
      parts.push(cleaned.substring(lastIndex, match.index))
    }

    const token = match[0]
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong
          key={`bold-${match.index}`}
          className="font-extrabold text-text-primary"
        >
          {token.slice(2, -2)}
        </strong>
      )
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em
          key={`em-${match.index}`}
          className="italic text-text-secondary"
        >
          {token.slice(1, -1)}
        </em>
      )
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={`code-${match.index}`}
          className="px-1.5 py-0.5 rounded bg-surface-secondary text-primary-700 font-mono text-[11px] sm:text-xs font-semibold border border-border"
        >
          {token.slice(1, -1)}
        </code>
      )
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < cleaned.length) {
    parts.push(cleaned.substring(lastIndex))
  }

  return parts
}

export function RevisionContentRenderer({
  content,
  flashcards = [],
  className = '',
}: RevisionContentRendererProps) {
  const [openCardIndex, setOpenCardIndex] = useState<number | null>(null)

  if (!content) {
    return (
      <div className="text-center py-6 text-text-tertiary text-xs sm:text-sm">
        Aucun contenu à afficher.
      </div>
    )
  }

  const lines = content.split('\n')
  const elements: React.ReactNode[] = []

  let inList = false
  let listItems: React.ReactNode[] = []
  let inBlockquote = false
  let blockquoteLines: string[] = []

  function flushList() {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul
          key={`list-${elements.length}`}
          className="space-y-1.5 sm:space-y-2 my-2 sm:my-3 pl-1"
        >
          {listItems}
        </ul>
      )
      listItems = []
      inList = false
    }
  }

  function flushBlockquote() {
    if (inBlockquote && blockquoteLines.length > 0) {
      elements.push(
        <div
          key={`quote-${elements.length}`}
          className="my-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-primary-50/80 to-indigo-50/40 border-l-4 border-primary-500 shadow-2xs text-primary-950"
        >
          <div className="flex items-start gap-2">
            <Bookmark className="h-4 w-4 sm:h-5 sm:w-5 text-primary-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 break-words text-xs sm:text-sm font-medium leading-relaxed">
              {blockquoteLines.map((l, i) => (
                <p key={i} className="my-0.5">
                  {renderInlineText(l)}
                </p>
              ))}
            </div>
          </div>
        </div>
      )
      blockquoteLines = []
      inBlockquote = false
    }
  }

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim()

    // 1. Ligne vide
    if (!line) {
      flushList()
      flushBlockquote()
      return
    }

    // 2. Séparateur horizontal (--- ou ***)
    if (line === '---' || line === '***' || line === '___') {
      flushList()
      flushBlockquote()
      elements.push(
        <div
          key={`divider-${index}`}
          className="my-4 sm:my-6 h-px bg-gradient-to-r from-transparent via-border to-transparent"
        />
      )
      return
    }

    // 3. Titre Niveau 1 & 2 (## ou #)
    if (line.startsWith('## ') || line.startsWith('# ')) {
      flushList()
      flushBlockquote()
      const titleText = line.replace(/^#{1,2}\s+/, '')
      const isBacWarning =
        titleText.toLowerCase().includes('piège') ||
        titleText.toLowerCase().includes('essentiel') ||
        titleText.toLowerCase().includes('bac')

      elements.push(
        <div
          key={`h2-${index}`}
          className={`mt-5 sm:mt-7 mb-2 sm:mb-3 pb-1.5 sm:pb-2 border-b flex items-center gap-2 ${
            isBacWarning
              ? 'border-amber-200 text-amber-950'
              : 'border-border text-text-primary'
          }`}
        >
          <div
            className={`h-6 w-6 sm:h-7 sm:w-7 rounded-lg flex items-center justify-center text-xs sm:text-sm font-black ${
              isBacWarning
                ? 'bg-amber-100 text-amber-700'
                : 'bg-primary-100 text-primary-700'
            }`}
          >
            {isBacWarning ? '🎯' : '📌'}
          </div>
          <h2 className="min-w-0 break-words text-sm sm:text-lg font-black tracking-tight">
            {renderInlineText(titleText)}
          </h2>
        </div>
      )
      return
    }

    // 4. Titre Niveau 3 (###)
    if (line.startsWith('### ')) {
      flushList()
      flushBlockquote()
      const subTitleText = line.replace(/^###\s+/, '')
      const isWarning =
        subTitleText.toLowerCase().includes('piège') ||
        subTitleText.toLowerCase().includes('attention')

      elements.push(
        <div
          key={`h3-${index}`}
          className={`mt-3.5 sm:mt-4.5 mb-1.5 sm:mb-2 flex items-center gap-1.5 font-extrabold text-xs sm:text-sm ${
            isWarning ? 'text-amber-700' : 'text-primary-800'
          }`}
        >
          {isWarning ? (
            <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-600 flex-shrink-0" />
          ) : (
            <Lightbulb className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary-600 flex-shrink-0" />
          )}
          <span className="min-w-0 break-words">{renderInlineText(subTitleText)}</span>
        </div>
      )
      return
    }

    // 5. Citation ou Encadré (> ...)
    if (line.startsWith('>')) {
      flushList()
      inBlockquote = true
      blockquoteLines.push(line.replace(/^>\s*/, ''))
      return
    } else if (inBlockquote) {
      flushBlockquote()
    }

    // 6. Liste à puces (- ou * ou +)
    if (/^[-*+]\s+/.test(line)) {
      inList = true
      const itemText = line.replace(/^[-*+]\s+/, '')
      listItems.push(
        <li
          key={`li-${index}`}
          className="flex items-start gap-2 text-xs sm:text-sm text-text-secondary leading-relaxed"
        >
          <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5 sm:mt-2" />
          <span className="flex-1 min-w-0 break-words">{renderInlineText(itemText)}</span>
        </li>
      )
      return
    }

    // 7. Liste numérotée (1., 2., etc.)
    if (/^\d+\.\s+/.test(line)) {
      inList = true
      const num = line.match(/^(\d+)\.\s+/)?.[1] || '1'
      const itemText = line.replace(/^\d+\.\s+/, '')
      listItems.push(
        <li
          key={`num-li-${index}`}
          className="flex items-start gap-2 text-xs sm:text-sm text-text-secondary leading-relaxed"
        >
          <span className="h-4 w-4 sm:h-5 sm:w-5 rounded-md bg-surface-secondary border border-border text-primary-700 font-bold text-[9px] sm:text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
            {num}
          </span>
          <span className="flex-1 min-w-0 break-words">{renderInlineText(itemText)}</span>
        </li>
      )
      return
    }

    // 8. Paragraphe normal
    flushList()
    flushBlockquote()
    elements.push(
      <p
        key={`p-${index}`}
        className="my-1.5 sm:my-2 text-xs sm:text-sm text-text-secondary leading-relaxed font-normal"
      >
        {renderInlineText(line)}
      </p>
    )
  })

  // Flush remaining blocks
  flushList()
  flushBlockquote()

  return (
    <div className={`space-y-1 sm:space-y-2 text-text-primary ${className}`}>
      {/* Contenu Markdown Stylisé */}
      <div className="space-y-1">{elements}</div>

      {/* Section Flashcards d'Auto-Évaluation (si présentes) */}
      {flashcards && flashcards.length > 0 && (
        <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border space-y-2.5 sm:space-y-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            <h3 className="text-xs sm:text-base font-black text-text-primary">
              Flashcards d&apos;Auto-Évaluation ({flashcards.length})
            </h3>
          </div>
          <p className="text-[10px] sm:text-xs text-text-tertiary">
            Teste ta mémoire en essayant de répondre avant de révéler la solution.
          </p>

          <div className="space-y-2">
            {flashcards.map((fc, i) => {
              const isOpen = openCardIndex === i
              return (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-surface p-2.5 sm:p-3.5 transition-all shadow-2xs hover:border-purple-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenCardIndex(isOpen ? null : i)}
                    className="w-full flex items-center justify-between text-left gap-2 cursor-pointer group"
                  >
                    <div className="flex items-start gap-2">
                      <span className="h-4.5 w-4.5 rounded-full bg-purple-50 text-purple-700 font-black text-[10px] sm:text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-purple-200">
                        ?
                      </span>
                      <span className="min-w-0 break-words text-xs sm:text-sm font-bold text-text-primary group-hover:text-purple-700 transition-colors">
                        {renderInlineText(fc.question)}
                      </span>
                    </div>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-text-tertiary transition-transform duration-200 flex-shrink-0 ${
                        isOpen ? 'rotate-180 text-purple-600' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="mt-2.5 pt-2.5 border-t border-border/60 text-xs sm:text-sm text-purple-950 bg-purple-50/50 p-2.5 rounded-lg border border-purple-100 flex items-start gap-2 animate-in fade-in-50 duration-200">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0 break-words leading-relaxed">
                        {renderInlineText(fc.answer)}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
