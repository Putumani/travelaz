import { useEffect, useState } from 'react'
import AccommodationCard from "@/components/AccommodationCard";
import Layout from '@/components/Layout'

function Bangkok() {
  const [accommodations, setAccommodations] = useState(Array(10).fill(null))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/accommodations/bangkok')
        if (!response.ok) throw new Error('Network response was not ok')
        const data = await response.json()
        setAccommodations([...data, ...Array(10 - data.length).fill(null)])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-white">
        <h2 className="text-3xl font-bold mb-8 text-black">Top 10 Accommodations in Bangkok</h2>
        
        {error && (
          <div className="text-center py-12 text-red-500">
            Error loading accommodations: {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-black">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {accommodations.map((accommodation, index) => (
              <AccommodationCard 
                key={accommodation?.id || `placeholder-${index}`}
                accommodation={accommodation} 
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Bangkok