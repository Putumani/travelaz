import { useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export function useAccommodations(city) {
  const fetchData = useCallback(async () => {
    const { data, error } = await supabase
      .from('accommodations')
      .select('*')
      .ilike('city', `%${city}%`);
    
    if (error) throw error;
    return data;
  }, [city]);

  return { fetchData };
}