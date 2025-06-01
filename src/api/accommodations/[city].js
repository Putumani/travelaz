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
      .select('*')
      .ilike('city', `%${city.toLowerCase()}%`)
      .order('rating', { ascending: false })
      .limit(10);

    if (error) throw error;

    const transformedData = data.map(item => {
      if (!item.image_url) return item;
      
      const uploadIndex = item.image_url.indexOf('/upload/') + 8;
      const cloudinaryPath = item.image_url.slice(uploadIndex);
      
      return {
        ...item,
        image_url: `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_600,h_400,c_fill,f_auto,q_auto/${cloudinaryPath}`
      };
    });

    res.status(200).json(transformedData);
  } catch (error) {
    console.error('Error fetching accommodations:', error);
    res.status(500).json({ error: 'Failed to fetch accommodations' });
  }
}