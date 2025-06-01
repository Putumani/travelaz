import { supabase } from '../lib/supabaseClient';

export async function incrementHotelView(id) {
  try {
    const parsedId = parseInt(id, 10);
    if (isNaN(parsedId)) {
      throw new Error(`Invalid id: ${id}. Must be a valid integer.`);
    }

    console.log(`Attempting to increment view for id: ${parsedId}`);

    const { data: currentData, error: fetchError } = await supabase
      .from('accommodations')
      .select('view_count')
      .eq('id', parsedId)
      .single();

    if (fetchError) throw fetchError;

    const currentCount = currentData?.view_count || 0;
    const newCount = currentCount + 1;

    const { error: updateError } = await supabase
      .from('accommodations')
      .update({ view_count: newCount })
      .eq('id', parsedId);

    if (updateError) throw updateError;

    console.log(`Successfully incremented view_count to ${newCount} for id: ${parsedId}`);
    return newCount;
  } catch (error) {
    console.error('Error in incrementHotelView:', error.message);
    throw error;
  }
}