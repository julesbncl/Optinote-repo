import { NextRequest, NextResponse } from 'next/server'

// Seed fallback data au cas où l'API externe est injoignable (Lycées uniquement)
const FALLBACK_SCHOOLS = [
  { uai: '0750654D', name: 'Lycée Henri-IV', city: 'Paris', postal_code: '75005', academy: 'Paris', latitude: 48.8463, longitude: 2.3473, type: 'Lycée' },
  { uai: '0750655E', name: 'Lycée Louis Le Grand', city: 'Paris', postal_code: '75005', academy: 'Paris', latitude: 48.8480, longitude: 2.3441, type: 'Lycée' },
  { uai: '0750651A', name: 'Lycée Condorcet', city: 'Paris', postal_code: '75009', academy: 'Paris', latitude: 48.8753, longitude: 2.3275, type: 'Lycée' },
  { uai: '0690026J', name: 'Lycée du Parc', city: 'Lyon', postal_code: '69006', academy: 'Lyon', latitude: 45.7705, longitude: 4.8569, type: 'Lycée' },
  { uai: '0130034W', name: 'Lycée Thiers', city: 'Marseille', postal_code: '13001', academy: 'Aix-Marseille', latitude: 43.2989, longitude: 5.3831, type: 'Lycée' },
  { uai: '0310037V', name: 'Lycée Pierre-de-Fermat', city: 'Toulouse', postal_code: '31000', academy: 'Toulouse', latitude: 43.6033, longitude: 1.4398, type: 'Lycée' },
  { uai: '0330028H', name: 'Lycée Michel Montaigne', city: 'Bordeaux', postal_code: '33000', academy: 'Bordeaux', latitude: 44.8344, longitude: -0.5750, type: 'Lycée' },
  { uai: '0590119X', name: 'Lycée Faidherbe', city: 'Lille', postal_code: '59000', academy: 'Lille', latitude: 50.6186, longitude: 3.0689, type: 'Lycée' },
  { uai: '0440029F', name: 'Lycée Clemenceau', city: 'Nantes', postal_code: '44000', academy: 'Nantes', latitude: 47.2197, longitude: -1.5456, type: 'Lycée' },
  { uai: '0670080B', name: 'Lycée des Pontonniers', city: 'Strasbourg', postal_code: '67000', academy: 'Strasbourg', latitude: 48.5838, longitude: 7.7558, type: 'Lycée' },
  { uai: '0060032S', name: 'Lycée Masséna', city: 'Nice', postal_code: '06000', academy: 'Nice', latitude: 43.7003, longitude: 7.2721, type: 'Lycée' },
  { uai: '0350028V', name: 'Lycée Chateaubriand', city: 'Rennes', postal_code: '35700', academy: 'Rennes', latitude: 48.1275, longitude: -1.6582, type: 'Lycée' },
  { uai: '0340032A', name: 'Lycée Joffre', city: 'Montpellier', postal_code: '34000', academy: 'Montpellier', latitude: 43.6128, longitude: 3.8821, type: 'Lycée' },
  { uai: '0380031E', name: 'Lycée Champollion', city: 'Grenoble', postal_code: '38000', academy: 'Grenoble', latitude: 45.1873, longitude: 5.7278, type: 'Lycée' },
  { uai: '0760098U', name: 'Lycée Pierre Corneille', city: 'Rouen', postal_code: '76000', academy: 'Normandie', latitude: 49.4445, longitude: 1.1009, type: 'Lycée' },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() || ''

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const sanitizedQuery = query.replace(/['"]/g, ' ').trim()

    // Requête stricte ciblant les lycées (généraux, technologiques, professionnels, polyvalents)
    const apiUrl = `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records?where=(type_etablissement%20like%20%22Lyc%C3%A9e%25%22%20or%20search(nom_etablissement%2C%20%22lyc%C3%A9e%22)%20or%20search(nom_etablissement%2C%20%22lycee%22)%20or%20search(libelle_nature%2C%20%22LYCEE%22))%20and%20(search(nom_etablissement%2C%20%22${encodeURIComponent(
      sanitizedQuery
    )}%22)%20or%20search(nom_commune%2C%20%22${encodeURIComponent(
      sanitizedQuery
    )}%22)%20or%20search(code_postal%2C%20%22${encodeURIComponent(
      sanitizedQuery
    )}%22))&limit=25`

    const response = await fetch(apiUrl, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      throw new Error(`Data Gouv API error: ${response.statusText}`)
    }

    const data = await response.json()
    const records = data.results || []

    const formatted = records
      .map((r: any) => {
        const lat = r.latitude || r.position?.lat || null
        const lon = r.longitude || r.position?.lon || null

        const rawType = r.type_etablissement || ''
        const rawNature = r.libelle_nature || ''
        const rawName = r.nom_etablissement || ''

        // Formatage clair du type de lycée
        let displayType = 'Lycée'
        if (rawNature.includes('POLYVALENT')) displayType = 'Lycée Polyvalent'
        else if (rawNature.includes('PROFESSIONNEL') || rawNature.includes('SECTION D ENSEIGNEMENT PROFESSIONNEL')) displayType = 'Lycée Professionnel'
        else if (rawNature.includes('GENERAL ET TECHNOLOGIQUE')) displayType = 'Lycée Général & Techno'
        else if (rawNature.includes('AGRICOLE')) displayType = 'Lycée Agricole'
        else if (rawType.includes('Lycée')) displayType = rawType

        return {
          uai: r.identifiant_de_l_etablissement,
          name: rawName,
          type: displayType,
          city: r.nom_commune,
          postal_code: r.code_postal,
          academy: r.libelle_academie || r.nom_academie || '',
          latitude: lat ? Number(lat) : null,
          longitude: lon ? Number(lon) : null,
          address: r.adresse_1 || '',
          rawType,
          rawNature,
        }
      })
      // Filtrage strict : UNIQUEMENT les Lycées (exclusion systématique des écoles primaires, maternelles, collèges sans lycée)
      .filter((item: any) => {
        if (!item.latitude || !item.longitude || !item.name) return false

        const nameLower = item.name.toLowerCase()
        const rawTypeLower = (item.rawType || '').toLowerCase()
        const rawNatureLower = (item.rawNature || '').toLowerCase()

        const isExplicitSchoolOrCollege =
          (nameLower.includes('école') ||
            nameLower.includes('ecole') ||
            nameLower.includes('collège') ||
            nameLower.includes('college')) &&
          !nameLower.includes('lycée') &&
          !nameLower.includes('lycee') &&
          !rawNatureLower.includes('lycee')

        const isLycee =
          rawTypeLower.includes('lycée') ||
          rawTypeLower.includes('lycee') ||
          rawNatureLower.includes('lycee') ||
          rawNatureLower.includes('professionnel') ||
          nameLower.includes('lycée') ||
          nameLower.includes('lycee')

        return isLycee && !isExplicitSchoolOrCollege
      })
      .slice(0, 12)

    return NextResponse.json({ results: formatted })
  } catch (error) {
    console.error('Error querying data.education.gouv.fr API:', error)

    // Fallback recherche locale (Lycées uniquement)
    const localFiltered = FALLBACK_SCHOOLS.filter(
      (s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.city.toLowerCase().includes(query.toLowerCase()) ||
        s.postal_code.includes(query)
    )

    return NextResponse.json({ results: localFiltered })
  }
}
