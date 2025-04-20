import { useEffect, useState } from 'react';
import AccommodationCard from '../components/AccommodationCard';

function Bangkok() {
  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://your-render-app.onrender.com/api/accommodations/bangkok')
      .then((res) => res.json())
      .then((data) => {
        setAccommodations(data);
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
      <h2 className="text-3xl font-bold mb-8 text-black">Top 10 Accommodations in Bangkok</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {accommodations.map((accommodation) => (
          <AccommodationCard key={accommodation._id} accommodation={accommodation} />
        ))}
      </div>
    </div>
  );
}

export default Bangkok;