/**
 * Templates HTML optimisés et responsive pour les emails transactionnels OptiNote
 */

interface WelcomeEmailProps {
  name?: string
  dashboardUrl?: string
}

interface NotificationEmailProps {
  title: string
  message: string
  actionLabel?: string
  actionUrl?: string
}

export function getWelcomeEmailHtml({
  name = 'Lycéen',
  dashboardUrl = 'https://optinote.fr/dashboard',
}: WelcomeEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenue sur OptiNote</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #0F172A; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .logo-badge { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: linear-gradient(135deg, #4F46E5, #7C3AED); border-radius: 12px; color: #FFFFFF; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
    h1 { font-size: 22px; font-weight: 800; color: #0F172A; margin: 0 0 12px 0; }
    p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 18px 0; }
    .feature-box { background: #F1F5F9; border-radius: 12px; padding: 16px; margin: 20px 0; border: 1px solid #E2E8F0; }
    .feature-item { font-size: 13px; color: #334155; margin-bottom: 8px; display: flex; align-items: center; }
    .feature-item:last-child { margin-bottom: 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: #FFFFFF !important; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 12px; margin-top: 10px; text-align: center; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #F1F5F9; text-align: center; font-size: 11px; color: #94A3B8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-badge">⚡</div>
    <h1>Bienvenue sur OptiNote, ${name} ! 🎉</h1>
    <p>Ton compte est prêt. Tu as désormais accès à tous les outils d'organisation et d'IA conçus pour booster tes résultats au Bac 2026 :</p>
    
    <div class="feature-box">
      <div class="feature-item">📚 <strong>Fiches & Synthèses IA</strong> : Crée tes résumés et fiches en 1 clic.</div>
      <div class="feature-item">📅 <strong>Planning Intelligent</strong> : Révise sans stress avec un calendrier calibré.</div>
      <div class="feature-item">🎯 <strong>Simulateur de Notes</strong> : Pilote ta moyenne et prépare ton dossier Parcoursup.</div>
      <div class="feature-item">🎓 <strong>Campus Social</strong> : Entraide-toi avec les lycéens de ton académie.</div>
    </div>

    <p>Commence dès maintenant en créant ta première fiche ou en générant ton planning de révision :</p>

    <div style="text-align: center;">
      <a href="${dashboardUrl}" class="btn">Accéder à mon Dashboard ➔</a>
    </div>

    <div class="footer">
      <p>© 2026 OptiNote SAS • L'application tout-en-un pour lycéens<br>Tu as reçu cet email car tu t'es inscrit sur <a href="https://optinote.fr" style="color: #4F46E5;">optinote.fr</a>.</p>
    </div>
  </div>
</body>
</html>
  `
}

export function getNotificationEmailHtml({
  title,
  message,
  actionLabel = 'Voir sur OptiNote',
  actionUrl = 'https://optinote.fr/dashboard',
}: NotificationEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #0F172A; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    h1 { font-size: 20px; font-weight: 800; color: #0F172A; margin: 0 0 16px 0; }
    p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: #FFFFFF !important; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 10px; text-align: center; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #F1F5F9; text-align: center; font-size: 11px; color: #94A3B8; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p>${message}</p>

    <div style="text-align: center; margin: 28px 0 10px 0;">
      <a href="${actionUrl}" class="btn">${actionLabel} ➔</a>
    </div>

    <div class="footer">
      <p>© 2026 OptiNote • Notification automatique • <a href="https://optinote.fr" style="color: #4F46E5;">optinote.fr</a></p>
    </div>
  </div>
</body>
</html>
  `
}

export interface VerificationEmailProps {
  name?: string
  verificationUrl: string
  expiresInHours?: number
}

export function getVerificationEmailHtml({
  name = 'Lycéen',
  verificationUrl,
  expiresInHours = 24,
}: VerificationEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vérifie ton adresse email — OptiNote</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #0F172A; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .logo-badge { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: linear-gradient(135deg, #4F46E5, #7C3AED); border-radius: 12px; color: #FFFFFF; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
    h1 { font-size: 22px; font-weight: 800; color: #0F172A; margin: 0 0 12px 0; }
    p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 18px 0; }
    .security-notice { background: #EEF2FF; border-radius: 12px; padding: 14px; margin: 20px 0; border: 1px solid #C7D2FE; font-size: 13px; color: #3730A3; line-height: 1.5; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4F46E5, #7C3AED); color: #FFFFFF !important; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px; margin: 12px 0; text-align: center; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25); }
    .fallback-box { background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 8px; padding: 12px; font-size: 11px; word-break: break-all; color: #64748B; margin-top: 24px; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #F1F5F9; text-align: center; font-size: 11px; color: #94A3B8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-badge">⚡</div>
    <h1>Confirme ton inscription sur OptiNote 🚀</h1>
    <p>Bonjour <strong>${name}</strong>,</p>
    <p>Merci de rejoindre OptiNote ! Pour sécuriser ton compte et commencer à réviser avec nos outils IA et tes fiches, clique sur le bouton ci-dessous pour vérifier ton adresse email :</p>
    
    <div style="text-align: center; margin: 24px 0;">
      <a href="${verificationUrl}" class="btn" target="_blank" rel="noopener noreferrer">
        Vérifier mon adresse email ➔
      </a>
    </div>

    <div class="security-notice">
      🔒 <strong>Lien sécurisé et unique :</strong> Ce lien expirera dans <strong>${expiresInHours} heures</strong>. Si tu n'es pas à l'origine de cette demande de création de compte, tu peux ignorer cet email en toute sécurité.
    </div>

    <p style="font-size: 12px; color: #64748B;">Si le bouton ne fonctionne pas, copie et colle ce lien directement dans ton navigateur :</p>
    <div class="fallback-box">
      ${verificationUrl}
    </div>

    <div class="footer">
      <p>© 2026 OptiNote SAS • L'application tout-en-un pour lycéens<br>Expédié depuis <strong style="color: #4F46E5;">contact@optinote.fr</strong> • <a href="https://optinote.fr" style="color: #4F46E5;">optinote.fr</a></p>
    </div>
  </div>
</body>
</html>
  `
}
