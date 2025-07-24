import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  try {
    const { data, error } = await supabase
      .from('accommodations')
      .select('*, booking_dot_com_affiliate_url, expedia_affiliate_url, hotels_dot_com_affiliate_url, trip_dot_com_affiliate_url')
      .ilike('city', `%${city.toLowerCase()}%`)
      .order('rating', { ascending: false })
      .limit(10);

    if (error) throw error;

    const transformedData = data.map(item => {
      let imageUrl = item.image_url;
      if (imageUrl) {
        const uploadIndex = item.image_url.indexOf('/upload/') + 8;
        const cloudinaryPath = item.image_url.slice(uploadIndex);
        imageUrl = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_600,h_400,c_fill,f_auto,q_auto/${cloudinaryPath}`;
      }

      return {
        ...item,
        image_url: imageUrl,
        affiliate_deals: [
          { site_name: 'Booking.com', affiliate_url: item.booking_dot_com_affiliate_url, price: item.price },
          { site_name: 'Expedia', affiliate_url: item.expedia_affiliate_url, price: item.price },
          { site_name: 'Hotels.com', affiliate_url: item.hotels_dot_com_affiliate_url, price: item.price },
          { site_name: 'Trip.com', affiliate_url: item.trip_dot_com_affiliate_url, price: item.price },
          { site_name: 'Priceline', affiliate_url: item.priceline_affiliate_url, price: item.price }
        ].filter(deal => deal.affiliate_url),
      };
    });

    res.status(200).json(transformedData);
  } catch (error) {
    console.error('Error fetching accommodations:', error);
    res.status(500).json({ error: 'Failed to fetch accommodations' });
  }
}