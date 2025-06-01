import { supabase } from '../lib/supabaseClient'; 

export async function incrementHotelView(hotelId, city) {
  const { data, error } = await supabase
    .from('hotel_views')
    .select('view_count')
    .eq('hotel_id', hotelId)
    .eq('city', city)
    .single();

  if (error && error.code === 'PGRST116') {
    const { error: insertError } = await supabase.from('hotel_views').insert({
      hotel_id: hotelId,
      city: city,
      view_count: 1,
    });
    if (insertError) {
      console.error('Error inserting hotel view:', insertError);
    }
  } else if (error) {
    console.error('Error fetching hotel view:', error);
  } else {
    const { error: updateError } = await supabase
      .from('hotel_views')
      .update({ view_count: data.view_count + 1 })
      .eq('hotel_id', hotelId)
      .eq('city', city);
    if (updateError) {
      console.error('Error updating hotel view:', updateError);
    }
  }
}