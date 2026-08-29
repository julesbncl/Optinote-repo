'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Sparkles,
  CalendarDays,
  BookOpen,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Lock,
  Layers,
  ArrowUpRight,
  ArrowDown,
  Users,
} from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { SnapMapDemo } from '@/components/landing/SnapMapDemo'

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'campus' | 'planning' | 'revision' | 'grades'>('campus')

  const handleFeatureClick = (tab: 'campus' | 'planning' | 'revision' | 'grades') => {
    setActiveTab(tab)
    const demoSection = document.getElementById('demo')
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-surface selection:bg-primary-100 selection:text-primary-900">
      {/* ═══════════════════════════════════════════════════════
          BANDEAU ACCÈS PRO GRATUIT (avant le lancement payant)
          ═══════════════════════════════════════════════════════ */}
      <Link
        href="/register"
        className="block bg-gradient-to-r from-primary-600 to-accent-600 text-white text-center py-1 px-2 text-[9px] sm:text-xs font-semibold hover:opacity-90 transition-opacity"
      >
        🚀 OptiNote Pro offert à tous jusqu&apos;au 1er septembre — Crée ton compte gratuitement →
      </Link>

      {/* ═══════════════════════════════════════════════════════
          NAVBAR (COMPACTE MOBILE & LUXE DESKTOP)
          ═══════════════════════════════════════════════════════ */}
      <nav className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 h-11 sm:h-16 flex items-center justify-between gap-1">
          <div className="flex-shrink-0">
            <Logo size="xs" href="/" className="sm:hidden" />
            <Logo size="md" href="/" className="hidden sm:flex" />
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-text-secondary">
            <a href="#features" className="hover:text-primary-600 transition-colors">
              Fonctionnalités
            </a>
            <a href="#demo" className="hover:text-primary-600 transition-colors">
              Aperçu des fonctionnalités
            </a>
            <Link href="/pricing" className="hover:text-primary-600 transition-colors font-semibold text-primary-600">
              Tarifs
            </Link>
            <a href="#workflow" className="hover:text-primary-600 transition-colors">
              Comment ça marche
            </a>
            <a href="#security" className="hover:text-primary-600 transition-colors">
              Sécurité & RGPD
            </a>
          </div>

          {/* Quick Access Buttons */}
          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1 h-6.5 sm:h-9 px-2 sm:px-3 text-[9px] sm:text-xs font-black text-amber-950 bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-300 hover:from-amber-400 hover:to-yellow-400 border border-amber-300/80 rounded-md sm:rounded-lg shadow-2xs transition-all hover:scale-105"
            >
              <Zap className="h-2.5 w-2.5 sm:h-3.5 sm:w-3.5 text-amber-700 fill-amber-700 animate-pulse" />
              <span>Passer Pro</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center h-6.5 sm:h-9 text-[9px] sm:text-xs font-semibold text-text-secondary hover:text-text-primary px-1.5 sm:px-3 transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center h-6.5 sm:h-9 px-2.5 sm:px-4 text-[9px] sm:text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-md sm:rounded-lg shadow-2xs transition-all"
            >
              <span>Créer un compte</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════
          HERO SECTION (ULTRA COMPACT MOBILE)
          ═══════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-6 pb-8 sm:pt-20 sm:pb-24 bg-gradient-to-b from-primary-50/40 via-surface to-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3.5 sm:py-1.5 rounded-full bg-primary-100/80 text-primary-800 text-[10px] sm:text-xs font-bold shadow-2xs mb-1.5 sm:mb-3">
              <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary-600" />
              <span>La plateforme intelligente pour les lycéens</span>
            </div>

            <h1 className="text-2xl sm:text-5xl md:text-6xl font-black text-text-primary tracking-tight leading-tight">
              Tout pour{' '}
              <span className="bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                optimiser ta vie de lycéen
              </span>
            </h1>

            <p className="text-xs sm:text-lg text-text-secondary max-w-2xl mx-auto leading-normal sm:leading-relaxed font-normal">
              Transforme tes cours en fiches, gère ton planning et connecte-toi à ton campus et echange avec d&apos;autres etudiants !
            </p>

            <div className="flex flex-row items-center justify-center gap-2 sm:gap-4 pt-1 sm:pt-2">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-1.5 h-8 sm:h-12 px-3.5 sm:px-7 text-xs sm:text-base font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg sm:rounded-xl shadow-xs hover:shadow-md transition-all duration-200 flex-1 sm:flex-initial max-w-[200px]"
              >
                <span>Commencer</span>
                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center gap-1.5 h-8 sm:h-12 px-3.5 sm:px-6 text-xs sm:text-base font-semibold text-text-secondary bg-surface hover:bg-surface-secondary border border-border rounded-lg sm:rounded-xl transition-all duration-200 flex-1 sm:flex-initial max-w-[200px]"
              >
                <span>Fonctionnalités</span>
                <ArrowDown className="h-3 w-3 sm:h-4 sm:w-4" />
              </a>
            </div>

            {/* Points de confiance : compacts, sans surcharger le hero */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 pt-2 sm:pt-4">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-surface border border-border text-[9.5px] sm:text-xs font-semibold text-text-secondary">
                🛡️ Élèves vérifiés
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-surface border border-border text-[9.5px] sm:text-xs font-semibold text-text-secondary">
                🔥 Séries quotidiennes
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full bg-surface border border-border text-[9.5px] sm:text-xs font-semibold text-text-secondary">
                🎓 Révise en groupe
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 1 : LES 4 OUTILS CLÉS (COMPACT 2 COLONNES MOBILE)
          ═══════════════════════════════════════════════════════ */}
      <section id="features" className="py-8 sm:py-20 bg-surface-secondary">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-4 sm:mb-12">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-primary-600 mb-0.5 sm:mb-2">
              Fonctionnalités Clés
            </h2>
            <p className="text-base sm:text-3xl font-extrabold text-text-primary tracking-tight">
              Tout ce dont tu as besoin pour cartonner
            </p>
            <p className="mt-0.5 sm:mt-2 text-xs sm:text-base text-text-secondary">
              Des outils intelligents, simples et pensés pour le quotidien des lycéens.
            </p>
          </div>

          {/* Grille 2 Colonnes sur Mobile & Format Carré */}
          <div className="grid grid-cols-2 gap-2 sm:gap-6">
            {/* Outil 1: Campus Social */}
            <div
              onClick={() => handleFeatureClick('campus')}
              className="bg-surface rounded-xl sm:rounded-2xl border border-border p-2 sm:p-7 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group cursor-pointer hover:border-primary-300"
            >
              <div>
                <div className="flex items-center justify-between mb-1 sm:mb-4">
                  <div className="h-6 w-6 sm:h-12 sm:w-12 rounded-md sm:rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                    <Users className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
                  </div>
                </div>
                <h3 className="text-[11px] sm:text-xl font-bold text-text-primary group-hover:text-primary-600 transition-colors leading-tight">
                  <span className="sm:hidden">Campus Social</span>
                  <span className="hidden sm:inline">Campus Social & Carte</span>
                </h3>
                <p className="mt-0.5 sm:mt-2 text-[8px] sm:text-sm text-text-secondary leading-snug">
                  <span className="sm:hidden">Échange avec les lycéens de ton secteur et trouve des groupes.</span>
                  <span className="hidden sm:inline">Échange avec les lycéens de ton secteur et trouve des camarades de classe.</span>
                </p>

                <div className="mt-1 sm:mt-4 p-1 sm:p-3 bg-surface-secondary rounded-md sm:rounded-xl border border-border/60 text-[7.5px] sm:text-xs space-y-0.5 sm:space-y-1.5 font-medium text-text-secondary">
                  <div className="flex items-center justify-between gap-1">
                    <span>🗺️ Carte lycéens</span>
                    <span className="text-primary-600 font-bold flex-shrink-0">Loc</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span>💬 Salons entraide</span>
                    <span className="text-success-600 font-bold flex-shrink-0">Groupe</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span>🎓 Sessions en direct</span>
                    <span className="text-primary-600 font-bold flex-shrink-0">Live</span>
                  </div>
                </div>
              </div>

              <div className="mt-1.5 sm:mt-6 pt-1 sm:pt-4 border-t border-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFeatureClick('campus')
                  }}
                  className="inline-flex items-center gap-0.5 sm:gap-1 text-[8.5px] sm:text-sm font-semibold text-primary-600 hover:text-primary-700 cursor-pointer"
                >
                  <span>Découvrir</span>
                  <ArrowUpRight className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>

            {/* Outil 2: Planning IA */}
            <div
              onClick={() => handleFeatureClick('planning')}
              className="bg-surface rounded-xl sm:rounded-2xl border border-border p-2 sm:p-7 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group cursor-pointer hover:border-primary-300"
            >
              <div>
                <div className="flex items-center justify-between mb-1 sm:mb-4">
                  <div className="h-6 w-6 sm:h-12 sm:w-12 rounded-md sm:rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                    <CalendarDays className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
                  </div>
                </div>
                <h3 className="text-[11px] sm:text-xl font-bold text-text-primary group-hover:text-primary-600 transition-colors leading-tight">
                  <span className="sm:hidden">Planning IA</span>
                  <span className="hidden sm:inline">Planning IA & Agenda</span>
                </h3>
                <p className="mt-0.5 sm:mt-2 text-[8px] sm:text-sm text-text-secondary leading-snug">
                  <span className="sm:hidden">Emploi du temps généré par IA à partir de tes photos de cours.</span>
                  <span className="hidden sm:inline">Emploi du temps personnalisé généré par IA à partir de photos avec rappels.</span>
                </p>

                <div className="mt-1 sm:mt-4 p-1 sm:p-3 bg-surface-secondary rounded-md sm:rounded-xl border border-border/60 text-[7.5px] sm:text-xs space-y-0.5 sm:space-y-1.5 font-medium text-text-secondary">
                  <div className="flex items-center justify-between gap-1">
                    <span>✨ Analyse photo</span>
                    <span className="text-primary-600 font-bold flex-shrink-0">IA</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span>🔔 Rappels cours</span>
                    <span className="text-success-600 font-bold flex-shrink-0">Auto</span>
                  </div>
                </div>
              </div>

              <div className="mt-1.5 sm:mt-6 pt-1 sm:pt-4 border-t border-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFeatureClick('planning')
                  }}
                  className="inline-flex items-center gap-0.5 sm:gap-1 text-[8.5px] sm:text-sm font-semibold text-primary-600 hover:text-primary-700 cursor-pointer"
                >
                  <span>Découvrir</span>
                  <ArrowUpRight className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>

            {/* Outil 3: Fiches de Révision IA */}
            <div
              onClick={() => handleFeatureClick('revision')}
              className="bg-surface rounded-xl sm:rounded-2xl border border-border p-2 sm:p-7 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group cursor-pointer hover:border-accent-300"
            >
              <div>
                <div className="flex items-center justify-between mb-1 sm:mb-4">
                  <div className="h-6 w-6 sm:h-12 sm:w-12 rounded-md sm:rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
                    <BookOpen className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
                  </div>
                </div>
                <h3 className="text-[11px] sm:text-xl font-bold text-text-primary group-hover:text-accent-600 transition-colors leading-tight">
                  <span className="sm:hidden">Fiches Révision</span>
                  <span className="hidden sm:inline">Fiches Révision IA</span>
                </h3>
                <p className="mt-0.5 sm:mt-2 text-[8px] sm:text-sm text-text-secondary leading-snug">
                  <span className="sm:hidden">Fiches créées par IA avec classement par dossiers automatiques.</span>
                  <span className="hidden sm:inline">Fiches de cours créées par IA avec organisation par dossiers.</span>
                </p>

                <div className="mt-1 sm:mt-4 p-1 sm:p-3 bg-surface-secondary rounded-md sm:rounded-xl border border-border/60 text-[7.5px] sm:text-xs space-y-0.5 sm:space-y-1.5 font-medium text-text-secondary">
                  <div className="flex items-center justify-between gap-1">
                    <span>📁 Dossiers cours</span>
                    <span className="text-primary-600 font-bold flex-shrink-0">Classé</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span>✨ Fiches de cours</span>
                    <span className="text-success-600 font-bold flex-shrink-0">IA</span>
                  </div>
                </div>
              </div>

              <div className="mt-1.5 sm:mt-6 pt-1 sm:pt-4 border-t border-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFeatureClick('revision')
                  }}
                  className="inline-flex items-center gap-0.5 sm:gap-1 text-[8.5px] sm:text-sm font-semibold text-primary-600 hover:text-primary-700 cursor-pointer"
                >
                  <span>Découvrir</span>
                  <ArrowUpRight className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>

            {/* Outil 4: Simulateur de Moyenne & Notes */}
            <div
              onClick={() => handleFeatureClick('grades')}
              className="bg-surface rounded-xl sm:rounded-2xl border border-border p-2 sm:p-7 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group cursor-pointer hover:border-success-300"
            >
              <div>
                <div className="flex items-center justify-between mb-1 sm:mb-4">
                  <div className="h-6 w-6 sm:h-12 sm:w-12 rounded-md sm:rounded-xl bg-success-50 flex items-center justify-center text-success-600">
                    <GraduationCap className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
                  </div>
                </div>
                <h3 className="text-[11px] sm:text-xl font-bold text-text-primary group-hover:text-success-600 transition-colors leading-tight">
                  <span className="sm:hidden">Simulateur Notes</span>
                  <span className="hidden sm:inline">Simulateur de Notes</span>
                </h3>
                <p className="mt-0.5 sm:mt-2 text-[8px] sm:text-sm text-text-secondary leading-snug">
                  <span className="sm:hidden">Gestion des moyennes avec coefficients et prévisions de notes.</span>
                  <span className="hidden sm:inline">Gestion des notes avec coefficients et prévisions de DS.</span>
                </p>

                <div className="mt-1 sm:mt-4 p-1 sm:p-3 bg-surface-secondary rounded-md sm:rounded-xl border border-border/60 text-[7.5px] sm:text-xs space-y-0.5 sm:space-y-1.5 font-medium text-text-secondary">
                  <div className="flex items-center justify-between gap-1">
                    <span>📊 Coefficients</span>
                    <span className="text-success-600 font-bold flex-shrink-0">Direct</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span>🎯 Simulation DS</span>
                    <span className="text-warning-600 font-bold flex-shrink-0">Prévisions</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span>📈 Évolution suivie</span>
                    <span className="text-success-600 font-bold flex-shrink-0">Graphique</span>
                  </div>
                </div>
              </div>

              <div className="mt-1.5 sm:mt-6 pt-1 sm:pt-4 border-t border-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFeatureClick('grades')
                  }}
                  className="inline-flex items-center gap-0.5 sm:gap-1 text-[8.5px] sm:text-sm font-semibold text-success-600 hover:text-success-700 cursor-pointer"
                >
                  <span>Découvrir</span>
                  <ArrowUpRight className="h-2.5 w-2.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 : DÉMO INTERACTIVE DE L'INTERFACE
          ═══════════════════════════════════════════════════════ */}
      <section id="demo" className="py-8 sm:py-20 bg-surface">
        <div className="max-w-6xl mx-auto px-2 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-3 sm:mb-10">
            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-text-primary tracking-tight">
              Aperçu des fonctionnalités
            </h2>
            <p className="mt-1 sm:mt-3 text-xs sm:text-base text-text-secondary">
              Clique sur un onglet pour prévisualiser l&apos;interface réelle d&apos;OptiNote.
            </p>
          </div>

          {/* Sélecteur d'onglets compacté (Tous les 4 visibles sur mobile sur 1 seule ligne) */}
          <div className="flex justify-center mb-2.5 sm:mb-8 w-full relative z-20">
            <div className="inline-flex p-0.5 sm:p-1.5 rounded-xl bg-surface-secondary border border-border gap-0.5 sm:gap-1 w-full max-w-xl justify-between sm:justify-center">
              <button
                type="button"
                onClick={() => setActiveTab('campus')}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-sm font-bold transition-all cursor-pointer flex-1 sm:flex-initial touch-manipulation select-none ${
                  activeTab === 'campus'
                    ? 'bg-surface text-primary-600 shadow-2xs border border-border'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 pointer-events-none" />
                <span className="truncate pointer-events-none">Campus</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('planning')}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-sm font-bold transition-all cursor-pointer flex-1 sm:flex-initial touch-manipulation select-none ${
                  activeTab === 'planning'
                    ? 'bg-surface text-primary-600 shadow-2xs border border-border'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <CalendarDays className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 pointer-events-none" />
                <span className="truncate pointer-events-none">Planning</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('revision')}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-sm font-bold transition-all cursor-pointer flex-1 sm:flex-initial touch-manipulation select-none ${
                  activeTab === 'revision'
                    ? 'bg-surface text-accent-600 shadow-2xs border border-border'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 pointer-events-none" />
                <span className="truncate pointer-events-none">Fiches</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('grades')}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-1 sm:px-4 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-sm font-bold transition-all cursor-pointer flex-1 sm:flex-initial touch-manipulation select-none ${
                  activeTab === 'grades'
                    ? 'bg-surface text-success-600 shadow-2xs border border-border'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <GraduationCap className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 pointer-events-none" />
                <span className="truncate pointer-events-none">Notes</span>
              </button>
            </div>
          </div>

          {/* Interactive Screen Preview */}
          <div className="bg-surface rounded-xl sm:rounded-2xl border border-border shadow-md overflow-hidden transition-all duration-300">
            <div className="p-2 sm:p-7">
              {activeTab === 'campus' && <SnapMapDemo />}

              {activeTab === 'planning' && (
                <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                    <div>
                      <h4 className="text-sm sm:text-lg font-bold text-text-primary">
                        Emploi du temps & Sessions de travail
                      </h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-xs px-2.5 py-0.5 sm:py-1 bg-primary-50 text-primary-700 rounded-full font-bold border border-primary-100 flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        <span>Planning IA Actif</span>
                      </span>
                    </div>
                  </div>

                  {/* Grille Interactive Preview Calée à Gauche */}
                  <div className="overflow-x-auto -mx-1 sm:mx-0">
                    <div className="min-w-[340px] sm:min-w-full bg-surface rounded-xl border border-border p-1.5 sm:p-2.5 space-y-1">
                      {/* En-tête des jours */}
                      <div className="grid grid-cols-[20px_repeat(7,1fr)] sm:grid-cols-[36px_repeat(7,1fr)] gap-0.5 sm:gap-1 mb-1">
                        <div className="text-[8px] sm:text-[10px] text-text-tertiary font-bold py-0.5"></div>
                        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                          <div
                            key={day}
                            className="text-[8px] sm:text-xs text-text-secondary font-bold py-0.5 sm:py-1 text-center bg-surface-secondary/70 rounded-md sm:rounded-lg"
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Lignes d'heures */}
                      {[
                        {
                          hour: '8h',
                          slots: [
                            { type: 'class', label: 'Maths' },
                            { type: 'class', label: 'Histoire' },
                            { type: 'class', label: 'Physique' },
                            { type: 'class', label: 'Philo' },
                            { type: 'class', label: 'Anglais' },
                            null,
                            null,
                          ],
                        },
                        {
                          hour: '10h',
                          slots: [
                            { type: 'class', label: 'Physique' },
                            { type: 'class', label: 'SVT' },
                            { type: 'class', label: 'Maths' },
                            { type: 'class', label: 'Histoire' },
                            { type: 'class', label: 'SVT' },
                            null,
                            null,
                          ],
                        },
                        {
                          hour: '14h',
                          slots: [
                            { type: 'class', label: 'Anglais' },
                            { type: 'class', label: 'Philo' },
                            { type: 'study', label: '⚡ SVT' },
                            { type: 'class', label: 'Maths' },
                            { type: 'class', label: 'Espagnol' },
                            { type: 'study', label: '⚡ Maths' },
                            null,
                          ],
                        },
                        {
                          hour: '17h',
                          slots: [
                            { type: 'study', label: '⚡ Exos' },
                            { type: 'study', label: '⚡ Redox' },
                            null,
                            { type: 'study', label: '⚡ Philo' },
                            null,
                            null,
                            { type: 'study', label: '⚡ Bac' },
                          ],
                        },
                      ].map((row) => (
                        <div key={row.hour} className="grid grid-cols-[20px_repeat(7,1fr)] sm:grid-cols-[36px_repeat(7,1fr)] gap-0.5 sm:gap-1 items-center">
                          <div className="text-[8px] sm:text-[10px] font-mono text-text-tertiary text-left sm:text-right pr-0.5">
                            {row.hour}
                          </div>
                          {row.slots.map((slot, idx) => (
                            <div
                              key={idx}
                              className={`rounded-md sm:rounded-lg text-[8px] sm:text-[10px] p-0.5 sm:p-1 h-6.5 sm:h-7.5 flex items-center justify-center transition-all ${
                                slot
                                  ? slot.type === 'class'
                                    ? 'bg-[repeating-linear-gradient(45deg,rgba(37,99,235,0.08),rgba(37,99,235,0.08)_6px,transparent_6px,transparent_12px)] text-primary-800/80 border border-primary-200 line-through decoration-primary-500 decoration-1.5 font-medium'
                                    : 'bg-primary-600 text-white border border-primary-700 font-bold shadow-2xs'
                                  : 'bg-surface-secondary/40 text-text-tertiary'
                              }`}
                            >
                              {slot && <span className="truncate font-medium">{slot.label}</span>}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Légende Discrète */}
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] text-text-secondary pt-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded bg-[repeating-linear-gradient(45deg,rgba(37,99,235,0.2),rgba(37,99,235,0.2)_3px,transparent_3px,transparent_6px)] border border-primary-300" />
                      <span>Cours (Occupé)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded bg-primary-600 border border-primary-700" />
                      <span className="font-semibold text-text-primary">⚡ Révisions IA</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'grades' && (
                <div className="space-y-2 sm:space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between pb-1.5 sm:pb-2 border-b border-border">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                        📊
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-base font-bold text-text-primary leading-tight">
                          Simulateur de Notes & Prévisions
                        </h4>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] sm:text-[10px] text-text-tertiary block font-bold uppercase tracking-wider">
                        Moyenne Trimestre
                      </span>
                      <span className="text-sm sm:text-2xl font-black text-success-600">
                        16.6 <span className="text-[10px] sm:text-sm font-semibold text-text-tertiary">/ 20</span>
                      </span>
                    </div>
                  </div>

                  {/* Liste compacte des 5 matières */}
                  <div className="space-y-1 sm:space-y-1.5">
                    {/* Matière 1 : Maths */}
                    <div className="p-1.5 sm:p-2.5 bg-surface-secondary rounded-lg sm:rounded-xl flex items-center justify-between text-[9px] sm:text-xs">
                      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                        <span className="h-2 w-2 rounded-full bg-primary-500 flex-shrink-0" />
                        <span className="font-bold text-text-primary truncate">Mathématiques</span>
                        <span className="text-[8px] sm:text-[9px] px-1 py-0.2 bg-primary-50 text-primary-700 font-bold rounded flex-shrink-0">
                          Coef 7
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <span className="px-1 sm:px-1.5 py-0.2 rounded bg-surface border border-border text-text-secondary">16</span>
                        <span className="px-1 sm:px-1.5 py-0.2 rounded bg-surface border border-border text-text-secondary">18</span>
                        <span className="px-1 sm:px-1.5 py-0.2 rounded bg-warning-50 text-warning-800 border border-warning-300 font-bold flex items-center gap-0.5">
                          <span>DS: 19</span>
                        </span>
                        <span className="font-extrabold text-text-primary text-[10px] sm:text-xs min-w-[50px] text-right">
                          17.3 <span className="text-text-tertiary font-normal">/20</span>
                        </span>
                      </div>
                    </div>

                    {/* Matière 2 : Physique-Chimie */}
                    <div className="p-1.5 sm:p-2.5 bg-surface-secondary rounded-lg sm:rounded-xl flex items-center justify-between text-[9px] sm:text-xs">
                      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                        <span className="h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />
                        <span className="font-bold text-text-primary truncate">Physique-Chimie</span>
                        <span className="text-[8px] sm:text-[9px] px-1 py-0.2 bg-indigo-50 text-indigo-700 font-bold rounded flex-shrink-0">
                          Coef 6
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <span className="px-1 sm:px-1.5 py-0.2 rounded bg-surface border border-border text-text-secondary">15</span>
                        <span className="px-1 sm:px-1.5 py-0.2 rounded bg-surface border border-border text-text-secondary">16.5</span>
                        <span className="px-1 sm:px-1.5 py-0.2 rounded bg-warning-50 text-warning-800 border border-warning-300 font-bold flex items-center gap-0.5">
                          <span>DS: 17</span>
                        </span>
                        <span className="font-extrabold text-text-primary text-[10px] sm:text-xs min-w-[50px] text-right">
                          16.1 <span className="text-text-tertiary font-normal">/20</span>
                        </span>
                      </div>
                    </div>

                    {/* Matière 3 : Philosophie */}
                    <div className="p-1.5 sm:p-2.5 bg-surface-secondary rounded-lg sm:rounded-xl flex items-center justify-between text-[9px] sm:text-xs">
                      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                        <span className="h-2 w-2 rounded-full bg-rose-500 flex-shrink-0" />
                        <span className="font-bold text-text-primary truncate">Philosophie</span>
                        <span className="text-[8px] sm:text-[9px] px-1 py-0.2 bg-rose-50 text-rose-700 font-bold rounded flex-shrink-0">
                          Coef 4
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <span className="px-1 sm:px-1.5 py-0.2 rounded bg-surface border border-border text-text-secondary">14.5</span>
                        <span className="px-1 sm:px-1.5 py-0.2 rounded bg-surface border border-border text-text-secondary">16</span>
                        <span className="px-1 sm:px-1.5 py-0.2 rounded bg-warning-50 text-warning-800 border border-warning-300 font-bold flex items-center gap-0.5">
                          <span>DS: 15</span>
                        </span>
                        <span className="font-extrabold text-text-primary text-[10px] sm:text-xs min-w-[50px] text-right">
                          15.2 <span className="text-text-tertiary font-normal">/20</span>
                        </span>
                      </div>
                    </div>

                    {/* Matière 4 : Histoire-Géographie */}
                    <div className="p-1.5 sm:p-2.5 bg-surface-secondary rounded-lg sm:rounded-xl flex items-center justify-between text-[9px] sm:text-xs">
                      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                        <span className="h-2 w-2 rounded-full bg-amber-500 flex-shrink-0" />
                        <span className="font-bold text-text-primary truncate">Histoire-Géo</span>
                        <span className="text-[8px] sm:text-[9px] px-1 py-0.2 bg-amber-50 text-amber-700 font-bold rounded flex-shrink-0">
                          Coef 3
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <span className="px-1 sm:px-1.5 py-0.2 rounded bg-surface border border-border text-text-secondary">17</span>
                        <span className="px-1 sm:px-1.5 py-0.2 rounded bg-surface border border-border text-text-secondary">16.5</span>
                        <span className="px-1 sm:px-1.5 py-0.2 rounded bg-warning-50 text-warning-800 border border-warning-300 font-bold flex items-center gap-0.5">
                          <span>DS: 18</span>
                        </span>
                        <span className="font-extrabold text-text-primary text-[10px] sm:text-xs min-w-[50px] text-right">
                          17.1 <span className="text-text-tertiary font-normal">/20</span>
                        </span>
                      </div>
                    </div>

                    {/* Matière 5 : Anglais LV1 */}
                    <div className="p-1.5 sm:p-2.5 bg-surface-secondary rounded-lg sm:rounded-xl flex items-center justify-between text-[9px] sm:text-xs">
                      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                        <span className="font-bold text-text-primary truncate">Anglais LV1</span>
                        <span className="text-[8px] sm:text-[9px] px-1 py-0.2 bg-emerald-50 text-emerald-700 font-bold rounded flex-shrink-0">
                          Coef 3
                        </span>
                      </div>
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        <span className="px-1 sm:px-1.5 py-0.2 rounded bg-surface border border-border text-text-secondary">18</span>
                        <span className="px-1 sm:px-1.5 py-0.2 rounded bg-surface border border-border text-text-secondary">19</span>
                        <span className="px-1 sm:px-1.5 py-0.2 rounded bg-warning-50 text-warning-800 border border-warning-300 font-bold flex items-center gap-0.5">
                          <span>DS: 19</span>
                        </span>
                        <span className="font-extrabold text-text-primary text-[10px] sm:text-xs min-w-[50px] text-right">
                          18.7 <span className="text-text-tertiary font-normal">/20</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'revision' && (
                <div className="space-y-2 sm:space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between gap-1">
                    <div>
                      <h4 className="text-xs sm:text-lg font-bold text-text-primary">
                        Fiche IA : Les Grandes Époques
                      </h4>
                      <p className="text-[9px] sm:text-xs text-text-tertiary hidden sm:block">
                        Synthèse de cours • Histoire & Repères chronologiques
                      </p>
                    </div>
                    <span className="text-[9px] sm:text-xs px-2 py-0.5 sm:py-1 bg-amber-50 text-amber-800 rounded-full font-bold border border-amber-200/80 inline-flex items-center gap-1">
                      <span>🏛️</span>
                      <span>Histoire</span>
                    </span>
                  </div>

                  {/* Frise Chronologique Visuelle Ultra Compacte */}
                  <div className="p-1.5 sm:p-4 bg-surface-secondary/50 rounded-lg sm:rounded-2xl border border-border space-y-1.5 sm:space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 sm:gap-2.5">
                      <div className="p-1.5 sm:p-2.5 rounded-md sm:rounded-xl bg-surface border border-border shadow-2xs">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[8px] font-black text-amber-700 bg-amber-50 px-1 py-0.2 rounded">Jusqu&apos;à -3000</span>
                          <span className="text-[10px]">🪨</span>
                        </div>
                        <h5 className="font-bold text-[10px] sm:text-xs text-text-primary leading-tight">Préhistoire</h5>
                      </div>

                      <div className="p-1.5 sm:p-2.5 rounded-md sm:rounded-xl bg-surface border border-border shadow-2xs">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[8px] font-black text-primary-700 bg-primary-50 px-1 py-0.2 rounded">-3000 à 476</span>
                          <span className="text-[10px]">🏺</span>
                        </div>
                        <h5 className="font-bold text-[10px] sm:text-xs text-text-primary leading-tight">Antiquité</h5>
                      </div>

                      <div className="p-1.5 sm:p-2.5 rounded-md sm:rounded-xl bg-surface border border-border shadow-2xs">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded">476 à 1492</span>
                          <span className="text-[10px]">🏰</span>
                        </div>
                        <h5 className="font-bold text-[10px] sm:text-xs text-text-primary leading-tight">Moyen Âge</h5>
                      </div>

                      <div className="p-1.5 sm:p-2.5 rounded-md sm:rounded-xl bg-surface border border-border shadow-2xs">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[8px] font-black text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded">1492 à 1789</span>
                          <span className="text-[10px]">🧭</span>
                        </div>
                        <h5 className="font-bold text-[10px] sm:text-xs text-text-primary leading-tight">Temps Mod.</h5>
                      </div>

                      <div className="col-span-2 sm:col-span-1 p-1.5 sm:p-2.5 rounded-md sm:rounded-xl bg-surface border border-primary-300 shadow-2xs">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[8px] font-black text-rose-700 bg-rose-50 px-1 py-0.2 rounded">1789 à nos jours</span>
                          <span className="text-[10px]">🚀</span>
                        </div>
                        <h5 className="font-bold text-[10px] sm:text-xs text-text-primary leading-tight">Époque Contemp.</h5>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    <span className="text-[8px] sm:text-xs px-1.5 py-0.2 bg-surface-secondary border border-border rounded font-medium text-text-secondary">
                      #FriseChronologique
                    </span>
                    <span className="text-[8px] sm:text-xs px-1.5 py-0.2 bg-surface-secondary border border-border rounded font-medium text-text-secondary">
                      #GrandesÉpoques
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3 : COMMENT ÇA MARCHE EN 3 ÉTAPES (COMPACT)
          ═══════════════════════════════════════════════════════ */}
      <section id="workflow" className="py-8 sm:py-20 bg-surface-secondary border-t border-border">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-5 sm:mb-14">
            <h2 className="text-xl sm:text-3xl md:text-4xl font-bold text-text-primary tracking-tight">
              Simple, rapide et sans friction
            </h2>
            <p className="mt-1 sm:mt-3 text-xs sm:text-base text-text-secondary">
              Comment OptiNote simplifie ta scolarité en 3 étapes clés.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-8">
            {/* Étape 1 */}
            <div className="bg-surface rounded-xl sm:rounded-2xl border border-border p-2.5 sm:p-6 shadow-2xs relative flex flex-col justify-between">
              <div>
                <div className="h-6 w-6 sm:h-10 sm:w-10 rounded-md sm:rounded-xl bg-primary-600 text-white font-bold text-[10px] sm:text-base flex items-center justify-center mb-1.5 sm:mb-4">
                  1
                </div>
                <h3 className="text-xs sm:text-lg font-bold text-text-primary mb-0.5 sm:mb-2 leading-tight">
                  1. Renseigne tes données
                </h3>
                <p className="text-[9px] sm:text-sm text-text-secondary leading-snug sm:leading-relaxed">
                  Prends en photo ton emploi du temps, tes cours ou entre tes notes. Tout reste 100% privé.
                </p>
              </div>
            </div>

            {/* Étape 2 */}
            <div className="bg-surface rounded-xl sm:rounded-2xl border border-border p-2.5 sm:p-6 shadow-2xs relative flex flex-col justify-between">
              <div>
                <div className="h-6 w-6 sm:h-10 sm:w-10 rounded-md sm:rounded-xl bg-primary-600 text-white font-bold text-[10px] sm:text-base flex items-center justify-center mb-1.5 sm:mb-4">
                  2
                </div>
                <h3 className="text-xs sm:text-lg font-bold text-text-primary mb-0.5 sm:mb-2 leading-tight">
                  2. L&apos;IA optimise
                </h3>
                <p className="text-[9px] sm:text-sm text-text-secondary leading-snug sm:leading-relaxed">
                  Génération des fiches résumées, planning de travail et calculs de moyenne.
                </p>
              </div>
            </div>

            {/* Étape 3 (Centrée en dessous sur mobile col-span-2, intégrée en 3e colonne sur desktop md:col-span-1) */}
            <div className="col-span-2 md:col-span-1 bg-surface rounded-xl sm:rounded-2xl border border-border p-2.5 sm:p-6 shadow-2xs relative flex flex-col justify-between max-w-md mx-auto md:max-w-none w-full">
              <div>
                <div className="h-6 w-6 sm:h-10 sm:w-10 rounded-md sm:rounded-xl bg-primary-600 text-white font-bold text-[10px] sm:text-base flex items-center justify-center mb-1.5 sm:mb-4 mx-auto md:mx-0">
                  3
                </div>
                <h3 className="text-xs sm:text-lg font-bold text-text-primary mb-0.5 sm:mb-2 leading-tight text-center md:text-left">
                  3. Réussis ton année sereinement
                </h3>
                <p className="text-[9px] sm:text-sm text-text-secondary leading-snug sm:leading-relaxed text-center md:text-left">
                  Gagne des heures chaque semaine, progresse et prépare le Baccalauréat sans stress.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4 : FINAL CTA BANNER (COMPACT MOBILE & LUMINEUX)
          ═══════════════════════════════════════════════════════ */}
      <section className="py-7 sm:py-16 bg-surface-secondary border-t border-border">
        <div className="max-w-4xl mx-auto px-3.5 sm:px-6 text-center">
          <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 rounded-2xl sm:rounded-3xl p-5 sm:p-12 text-white shadow-xl">
            <h2 className="text-xl sm:text-4xl font-extrabold tracking-tight mb-2 sm:mb-4">
              Rejoins OptiNote aujourd&apos;hui 🚀
            </h2>
            <p className="text-xs sm:text-base md:text-lg text-white/90 max-w-xl mx-auto mb-4 sm:mb-7">
              Crée ton compte en 30 secondes et accède à tous les modules de l&apos;application dès maintenant.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3.5 max-w-xl mx-auto">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-10 sm:h-12 px-4 sm:px-7 text-xs sm:text-base font-bold text-primary-700 bg-white hover:bg-primary-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
              >
                <span>Teste les fonctionnalités gratuites ➔</span>
              </Link>
              <Link
                href="/pricing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 h-10 sm:h-12 px-4 sm:px-7 text-xs sm:text-base font-black text-amber-950 bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-300 hover:from-amber-400 hover:to-yellow-400 border-2 border-amber-200/90 rounded-xl shadow-lg shadow-amber-500/25 ring-2 ring-white/40 hover:scale-105 hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5"
              >
                <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-700 fill-amber-700 animate-pulse" />
                <span>Passe direct à l&apos;abonnement Pro ➔</span>
              </Link>
            </div>

            <p className="mt-3.5 sm:mt-6 text-[10px] sm:text-xs text-white/80">
              🎁 Invite un ami : vous recevez chacun un mois offert.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SECTION 5 : SÉCURITÉ & CONFIDENTIALITÉ (COMPACT)
          ═══════════════════════════════════════════════════════ */}
      <section id="security" className="py-7 sm:py-16 bg-surface border-t border-border">
        <div className="max-w-5xl mx-auto px-3.5 sm:px-6">
          <div className="bg-gradient-to-br from-surface to-surface-secondary rounded-xl sm:rounded-2xl border border-border p-4 sm:p-10 shadow-2xs flex flex-col md:flex-row items-center gap-3.5 sm:gap-8">
            <div className="h-11 w-11 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-success-50 border border-success-100 flex items-center justify-center flex-shrink-0 text-success-600">
              <ShieldCheck className="h-6 w-6 sm:h-8 sm:w-8" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-sm sm:text-xl font-bold text-text-primary mb-1 sm:mb-2">
                Sécurité maximale & Protection stricte des mineurs
              </h3>
              <p className="text-xs sm:text-sm text-text-secondary leading-snug sm:leading-relaxed">
                Conformité intégrale <strong>RGPD</strong> et activation obligatoire de la technologie <strong>Row Level Security (RLS)</strong> sur chaque table de base de données. Tes notes, fiches et devoirs ne sont accessibles que par toi-même et ne sont jamais revendus.
              </p>
              <div className="mt-2.5 sm:mt-4 flex flex-wrap justify-center sm:justify-start gap-3 sm:gap-4 text-[11px] sm:text-xs font-semibold text-text-secondary">
                <Link href="/legal/privacy" className="text-primary-600 hover:underline flex items-center gap-1">
                  <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span>Politique de Confidentialité RGPD</span>
                </Link>
                <Link href="/legal/mentions-legales" className="text-primary-600 hover:underline">
                  Mentions Légales
                </Link>
              </div>

              <div className="mt-3 pt-3 sm:mt-4 sm:pt-4 border-t border-border/80 flex flex-wrap items-center justify-center sm:justify-start gap-x-4 sm:gap-x-6 gap-y-1.5 text-[10px] sm:text-xs text-text-secondary font-medium">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success-600 flex-shrink-0" />
                  <span>Conçu pour Seconde, Première & Terminale</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success-600 flex-shrink-0" />
                  <span>100% Conforme RGPD & Sécurisé</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success-600 flex-shrink-0" />
                  <span>Accès découverte sans carte bancaire</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FOOTER PROFESSIONNEL COMPLET & MENTIONS LÉGALES
          ═══════════════════════════════════════════════════════ */}
      <footer className="bg-surface border-t border-border py-4 sm:pt-16 sm:pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-8 pb-4 sm:pb-12 border-b border-border">
            {/* Col 1 : Brand & Mission (Centré sur mobile, aligné à gauche sur desktop) */}
            <div className="col-span-2 lg:col-span-2 flex flex-col items-center md:items-start text-center md:text-left space-y-2 sm:space-y-4">
              <Logo size="md" href="/" />
              <p className="text-[11px] sm:text-sm text-text-secondary max-w-sm leading-relaxed text-center md:text-left">
                OptiNote est la plateforme SaaS dédiée aux lycéens de la Seconde à la Terminale. Planning IA, fiches de révision, simulateur de notes et campus local d&apos;entraide.
              </p>
            </div>

            {/* Col 2 : Modules Clés (Colonne 1 sur mobile) */}
            <div className="col-span-1 lg:col-span-1 space-y-1.5 sm:space-y-3">
              <h4 className="text-[10px] sm:text-xs font-bold text-text-primary uppercase tracking-wider">
                Modules Clés
              </h4>
              <ul className="space-y-1 sm:space-y-2 text-[11px] sm:text-sm text-text-secondary">
                <li>
                  <Link href="/planning" className="hover:text-primary-600 transition-colors">
                    Planning IA & Agenda
                  </Link>
                </li>
                <li>
                  <Link href="/grades" className="hover:text-primary-600 transition-colors">
                    Simulateur de Notes
                  </Link>
                </li>
                <li>
                  <Link href="/revision" className="hover:text-primary-600 transition-colors">
                    Fiches de Révision
                  </Link>
                </li>
                <li>
                  <Link href="/campus" className="hover:text-primary-600 transition-colors">
                    Campus & Salons
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3 : Niveaux Scolaires (Colonne 2 sur mobile) */}
            <div className="col-span-1 lg:col-span-1 space-y-1.5 sm:space-y-3">
              <h4 className="text-[10px] sm:text-xs font-bold text-text-primary uppercase tracking-wider">
                Niveaux Scolaires
              </h4>
              <ul className="space-y-1 sm:space-y-2 text-[11px] sm:text-sm text-text-secondary">
                <li>
                  <Link href="/register" className="hover:text-primary-600 transition-colors">
                    Classe de Seconde
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-primary-600 transition-colors">
                    Classe de Première
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-primary-600 transition-colors">
                    Terminale & Bac
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-primary-600 transition-colors">
                    Tarifs & Formule Pro
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4 : Légal & Sécurité (Centré seul sur 2e ligne mobile, 5e colonne sur desktop) */}
            <div className="col-span-2 lg:col-span-1 flex flex-col items-center md:items-start text-center md:text-left space-y-1.5 sm:space-y-3 pt-1 sm:pt-0">
              <h4 className="text-[10px] sm:text-xs font-bold text-text-primary uppercase tracking-wider">
                Légal & Sécurité
              </h4>
              <ul className="space-y-1 sm:space-y-2 text-[11px] sm:text-sm text-text-secondary">
                <li>
                  <Link href="/legal/mentions-legales" className="hover:text-primary-600 transition-colors">
                    Mentions Légales (LCEN)
                  </Link>
                </li>
                <li>
                  <Link href="/legal/privacy" className="hover:text-primary-600 transition-colors">
                    Politique de Confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="/legal/terms" className="hover:text-primary-600 transition-colors">
                    Conditions Générales (CGU)
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="pt-3 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] sm:text-xs text-text-tertiary">
            <p>© {new Date().getFullYear()} OptiNote SAS. Développé en France 🇫🇷.</p>
            <div className="flex items-center gap-3 sm:gap-6">
              <Link href="/legal/mentions-legales" className="hover:text-text-secondary transition-colors">
                Éditeur
              </Link>
              <Link href="/legal/privacy" className="hover:text-text-secondary transition-colors">
                RGPD / CNIL
              </Link>
              <Link href="/legal/terms" className="hover:text-text-secondary transition-colors">
                CGU
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
