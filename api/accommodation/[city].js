import { createClient } from '@supabase/supabase-js';

// eslint-disable-next-line no-undef
const supabaseUrl = process.env.VITE_SUPABASE_URL;
// eslint-disable-next-line no-undef
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ error: 'City is required' });
  }

  try {
    const { data, error } = await supabase
      .from('accommodations')
      .select('id, city, area, name, price, rating, image_url, description')
      .eq('city', city.toLowerCase());

    if (error) throw error;

    res.status(200).json(data);
  // eslint-disable-next-line no-unused-vars
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
}