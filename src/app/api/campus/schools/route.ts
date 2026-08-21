import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Seed fallback data au cas où l'API externe est injoignable
const DEFAULT_SCHOOLS = [
  { id: 'sch-01', name: 'Lycée Henri IV', city: 'Paris (5e)', postal_code: '75005', academy: 'Académie de Paris', latitude: 48.8458, longitude: 2.3486, students_count: 148 },
  { id: 'sch-02', name: 'Lycée Louis-le-Grand', city: 'Paris (5e)', postal_code: '75005', academy: 'Académie de Paris', latitude: 48.8480, longitude: 2.3444, students_count: 165 },
  { id: 'sch-03', name: 'Lycée Condorcet', city: 'Paris (9e)', postal_code: '75009', academy: 'Académie de Paris', latitude: 48.8753, longitude: 2.3275, students_count: 94 },
  { id: 'sch-04', name: 'Lycée du Parc', city: 'Lyon', postal_code: '69006', academy: 'Académie de Lyon', latitude: 45.7705, longitude: 4.8569, students_count: 125 },
  { id: 'sch-05', name: 'Lycée Ampère', city: 'Lyon', postal_code: '69002', academy: 'Académie de Lyon', latitude: 45.7645, longitude: 4.8362, students_count: 82 },
  { id: 'sch-06', name: 'Lycée Thiers', city: 'Marseille', postal_code: '13001', academy: "Académie d'Aix-Marseille", latitude: 43.2989, longitude: 5.3831, students_count: 112 },
  { id: 'sch-07', name: 'Lycée Pierre-de-Fermat', city: 'Toulouse', postal_code: '31000', academy: 'Académie de Toulouse', latitude: 43.6033, longitude: 1.4398, students_count: 130 },
  { id: 'sch-08', name: 'Lycée Michel Montaigne', city: 'Bordeaux', postal_code: '33000', academy: 'Académie de Bordeaux', latitude: 44.8344, longitude: -0.5750, students_count: 98 },
  { id: 'sch-09', name: 'Lycée Faidherbe', city: 'Lille', postal_code: '59000', academy: 'Académie de Lille', latitude: 50.6186, longitude: 3.0689, students_count: 88 },
  { id: 'sch-10', name: 'Lycée Clemenceau', city: 'Nantes', postal_code: '44000', academy: 'Académie de Nantes', latitude: 47.2197, longitude: -1.5456, students_count: 104 },
  { id: 'sch-11', name: 'Lycée des Pontonniers', city: 'Strasbourg', postal_code: '67000', academy: 'Académie de Strasbourg', latitude: 48.5838, longitude: 7.7558, students_count: 76 },
  { id: 'sch-12', name: 'Lycée Masséna', city: 'Nice', postal_code: '06000', academy: 'Académie de Nice', latitude: 43.7003, longitude: 7.2721, students_count: 91 },
  { id: 'sch-13', name: 'Lycée Chateaubriand', city: 'Rennes', postal_code: '35700', academy: 'Académie de Rennes', latitude: 48.1275, longitude: -1.6582, students_count: 85 },
  { id: 'sch-14', name: 'Lycée Joffre', city: 'Montpellier', postal_code: '34000', academy: 'Académie de Montpellier', latitude: 43.6128, longitude: 3.8821, students_count: 99 },
  { id: 'sch-15', name: 'Lycée Champollion', city: 'Grenoble', postal_code: '38000', academy: 'Académie de Grenoble', latitude: 45.1873, longitude: 5.7278, students_count: 79 },
  { id: 'sch-16', name: 'Lycée Pierre Corneille', city: 'Rouen', postal_code: '76000', academy: 'Académie de Normandie', latitude: 49.4445, longitude: 1.1009, students_count: 68 },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const north = searchParams.get('north')
  const south = searchParams.get('south')
  const east = searchParams.get('east')
  const west = searchParams.get('west')

  try {
    // 1. Si des coordonnées de zone géographique (Bounds) sont fournies : interrogation de l'API de l'Éducation Nationale
    if (north && south && east && west) {
      const n = parseFloat(north)
      const s = parseFloat(south)
      const e = parseFloat(east)
      const w = parseFloat(west)

      if (!isNaN(n) && !isNaN(s) && !isNaN(e) && !isNaN(w)) {
        // Requête OpenDataSoft v2.1 avec bbox
        const apiUrl = `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-annuaire-education/records?where=type_etablissement%20like%20%22Lyc%C3%A9e%25%22%20and%20in_bbox(position%2C%20${n}%2C%20${e}%2C%20${s}%2C%20${w})&limit=100`

        const response = await fetch(apiUrl, {
          headers: { Accept: 'application/json' },
          next: { revalidate: 3600 },
        })

        if (response.ok) {
          const data = await response.json()
          const records = data.results || []

          const schoolsFromApi = records
            .map((r: any) => {
              const lat = r.latitude || r.position?.lat || null
              const lon = r.longitude || r.position?.lon || null
              if (!lat || !lon || !r.nom_etablissement) return null

              return {
                id: r.identifiant_de_l_etablissement || `sch-${r.nom_etablissement.toLowerCase().replace(/\s+/g, '-')}`,
                name: r.nom_etablissement,
                type: r.type_etablissement || 'Lycée',
                city: r.nom_commune || '',
                postal_code: r.code_postal || '',
                academy: r.libelle_academie || r.nom_academie || 'Académie',
                latitude: Number(lat),
                longitude: Number(lon),
                students_count: 1,
              }
            })
            .filter(Boolean)

          if (schoolsFromApi.length > 0) {
            return NextResponse.json({ schools: schoolsFromApi })
          }
        }
      }
    }

    // 2. Sinon : récupération depuis la base Supabase ou seed data
    const supabase = await createClient()
    const { data: schools, error } = await supabase
      .from('schools')
      .select('*')
      .order('students_count', { ascending: false })

    if (error || !schools || schools.length === 0) {
      return NextResponse.json({ schools: DEFAULT_SCHOOLS })
    }

    return NextResponse.json({ schools })
  } catch (error) {
    console.error('Error fetching schools:', error)
    return NextResponse.json({ schools: DEFAULT_SCHOOLS })
  }
}
