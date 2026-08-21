import { NextRequest, NextResponse } from 'next/server'

// Seed fallback data au cas où l'API externe est injoignable
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
    // Appel à l'API Explore v2.1 de l'Annuaire de l'Éducation Nationale
    const sanitizedQuery = query.replace(/['"]/g, ' ')
    const apiUrl = `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records?where=search(nom_etablissement,%20%22${encodeURIComponent(
      sanitizedQuery
    )}%22)%20or%20search(nom_commune,%20%22${encodeURIComponent(
      sanitizedQuery
    )}%22)&limit=15`

    const response = await fetch(apiUrl, {
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 3600 }, // Cache 1h
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

        return {
          uai: r.identifiant_de_l_etablissement,
          name: r.nom_etablissement,
          type: r.type_etablissement || r.libelle_nature || 'Lycée',
          city: r.nom_commune,
          postal_code: r.code_postal,
          academy: r.libelle_academie || r.nom_academie || '',
          latitude: lat,
          longitude: lon,
          address: r.adresse_1 || '',
        }
      })
      // Privilégier les Lycées et collèges
      .filter((item: any) => item.latitude && item.longitude && item.name)
      .sort((a: any, b: any) => {
        const isLycA = a.type?.toLowerCase().includes('lycée') || a.name?.toLowerCase().includes('lycée')
        const isLycB = b.type?.toLowerCase().includes('lycée') || b.name?.toLowerCase().includes('lycée')
        if (isLycA && !isLycB) return -1
        if (!isLycA && isLycB) return 1
        return 0
      })

    return NextResponse.json({ results: formatted })
  } catch (error) {
    console.error('Error querying data.education.gouv.fr API:', error)

    // Fallback recherche locale
    const localFiltered = FALLBACK_SCHOOLS.filter(
      (s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.city.toLowerCase().includes(query.toLowerCase()) ||
        s.postal_code.includes(query)
    )

    return NextResponse.json({ results: localFiltered })
  }
}
