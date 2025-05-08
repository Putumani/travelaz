import { useEffect, useState } from 'react';
import AccommodationCard from '@/components/AccommodationCard';

function CapeTown() {
  const [accommodations, setAccommodations] = useState(Array(10).fill({ empty: true })); // Initialize with 10 placeholders
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/accommodations/capetown')
      .then((res) => res.json())
      .then((data) => {
        // Fill with placeholders if fewer than 10 items
        const filledData = [...data];
        while (filledData.length < 10) {
          filledData.push({ id: `placeholder-${filledData.length}`, empty: true });
        }
        setAccommodations(filledData.slice(0, 10));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="text-center py-12 text-black">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-white">
      <h2 className="text-3xl font-bold mb-8 text-black">Top 10 Accommodations in Cape Town</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {accommodations.map((accommodation, index) => (
          <AccommodationCard 
            key={accommodation.id || `placeholder-${index}`} 
            accommodation={accommodation} 
          />
        ))}
      </div>
    </div>
  );
}

export default CapeTown;