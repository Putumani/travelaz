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

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      throw fetchError;
    }

    if (!currentData) {
      throw new Error(`No accommodation found with id: ${parsedId}`);
    }

    const currentCount = currentData.view_count || 0;
    const newCount = currentCount + 1;

    console.log(`Updating view_count from ${currentCount} to ${newCount}`);

    const { data: updateData, error: updateError } = await supabase
      .from('accommodations')
      .update({ view_count: newCount })
      .eq('id', parsedId)
      .select();

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    console.log('Update successful:', updateData);
    return newCount;
  } catch (error) {
    console.error('Error in incrementHotelView:', error);
    throw error;
  }
}