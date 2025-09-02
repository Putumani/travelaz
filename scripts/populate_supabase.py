from supabase import createClient
from scrape_booking_dot_com_hotels import scrape_booking_hotel
from scrape_trip_dot_com_hotels import scrape_trip_hotel

supabase = createClient('https://your-project.supabase.co', 'your-service-key')

def populate_deals(hotel_id, url, source, check_in, check_out):
    result = scrape_booking_hotel(url, check_in, check_out) if source == 'Booking.com' else scrape_trip_hotel(url, check_in, check_out)
    if 'error' not in result:
        supabase.table('accommodation_deals').insert({
            'hotel_id': hotel_id,
            'source': source,
            'price': result['price'],
            'currency': result['currency'],
            'availability': result['availability'],
            'check_in': check_in,
            'check_out': check_out,
            'room_type': result['room_type'],
            'source_url': result['source_url']
        }).execute()

# Example data (replace with real hotel URLs)
hotels = [
    {'id': 1, 'url': 'https://www.booking.com/hotel/za/sample', 'source': 'Booking.com'},
    {'id': 1, 'url': 'https://www.trip.com/hotels/sample', 'source': 'Trip.com'}
]
for hotel in hotels:
    populate_deals(hotel['id'], hotel['url'], hotel['source'], '2025-08-01', '2025-08-02')