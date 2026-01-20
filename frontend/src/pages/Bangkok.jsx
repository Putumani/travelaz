import { useEffect, useState } from 'react';
import AccommodationCard from "@/components/AccommodationCard";
import Layout from '@/components/Layout';
import { useAccommodations } from '@/hooks/useAccommodations';

function Bangkok() {
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { fetchData } = useAccommodations('Bangkok');

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const data = await fetchData();
        if (isMounted) {
          setAccommodations(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [fetchData]);

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-12 text-black">Loading...</div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center py-12 text-red-500">
          Error loading accommodations: {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-white">
        <h2 className="text-3xl font-bold mb-8 text-black">Top 10 Accommodations in Bangkok</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {accommodations.map((accommodation, index) => (
            <AccommodationCard 
              key={accommodation?.id || `placeholder-${index}`}
              accommodation={accommodation} 
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default Bangkok;