import os
import time
import random
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
from supabase import create_client
from scripts.scrape_booking_dot_com_hotels import scrape_booking_hotel
from scripts.scrape_trip_dot_com_hotels import scrape_trip_hotel
import sys
from pathlib import Path
from threading import Lock

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

sys.path.append(str(Path(__file__).parent / "scripts"))

app = Flask(__name__)

CORS(app, resources={
    r"/scrape-booking": {
        "origins": [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://putumani.github.io",
            "https://travelaz.onrender.com"
        ],
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    },
    r"/scrape-trip": {
        "origins": [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://putumani.github.io",
            "https://travelaz.onrender.com"
        ],
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

try:
    supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY'))
except Exception as e:
    logger.warning(f"Supabase initialization failed: {str(e)}")
    supabase = None

request_lock = Lock()

def check_cached_deals(hotel_url, checkin_date, checkout_date, source):
    """Check Supabase for cached deals to avoid redundant scraping."""
    if not supabase:
        return None
    try:
        response = supabase.table('accommodation_deals').select('*')\
            .eq('source_url', hotel_url)\
            .eq('check_in', checkin_date)\
            .eq('check_out', checkout_date)\
            .eq('source', source)\
            .execute()
        if response.data:
            logger.info(f"Retrieved cached data for {source}: {hotel_url}")
            return response.data[0]
        return None
    except Exception as e:
        logger.error(f"Error checking cached deals for {source}: {str(e)}")
        return None

def process_booking_request(data):
    try:
        checkin_date = data.get('checkIn', datetime.now().strftime('%Y-%m-%d'))
        checkout_date = data.get('checkOut', (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'))
        adults = int(data.get('adults', 2))
        children = int(data.get('children', 0))
        rooms = int(data.get('rooms', 1))
        hotel_url = data.get('hotelUrl')

        logger.info(f"Processing Booking.com request: hotelUrl={hotel_url}, checkIn={checkin_date}, checkOut={checkout_date}")

        if not hotel_url:
            return {"error": "Hotel URL is required"}

        if not hotel_url.startswith('https://www.booking.com'):
            return {"error": "Invalid Booking.com URL"}

        cached_data = check_cached_deals(hotel_url, checkin_date, checkout_date, "Booking.com")
        if cached_data:
            return cached_data

        time.sleep(random.uniform(1, 3))

        result = scrape_booking_hotel(
            hotel_url=hotel_url,
            checkin_date=checkin_date,
            checkout_date=checkout_date,
            adults=adults,
            children=children,
            rooms=rooms
        )

        if supabase and 'error' not in result:
            try:
                supabase.table('accommodation_deals').insert({
                    "hotel_id": result.get('hotel_id', 0),
                    "source": "Booking.com",
                    "source_url": hotel_url,
                    "price": result.get('price', 0),
                    "taxes": result.get('taxes', 0),
                    "currency": result.get('currency', 'ZAR'),
                    "check_in": checkin_date,
                    "check_out": checkout_date,
                    "availability": result.get('availability', 'Not available'),
                    "room_type": result.get('room_type', 'Standard Room')
                }).execute()
            except Exception as e:
                logger.error(f"Failed to cache Booking.com result: {str(e)}")

        return result
    except Exception as e:
        logger.error(f"Error processing Booking.com request: {str(e)}")
        return {"error": str(e)}

def process_trip_request(data):
    try:
        checkin_date = data.get('checkIn', datetime.now().strftime('%Y-%m-%d'))
        checkout_date = data.get('checkOut', (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'))
        adults = int(data.get('adults', 2))
        children = int(data.get('children', 0))
        rooms = int(data.get('rooms', 1))
        hotel_url = data.get('hotelUrl')

        logger.info(f"Processing Trip.com request: hotelUrl={hotel_url}, checkIn={checkin_date}, checkOut={checkout_date}")

        if not hotel_url:
            return {"error": "Hotel URL is required"}

        if not hotel_url.startswith('https://www.trip.com'):
            return {"error": "Invalid Trip.com URL"}

        cached_data = check_cached_deals(hotel_url, checkin_date, checkout_date, "Trip.com")
        if cached_data:
            return cached_data

        time.sleep(random.uniform(1, 3))

        result = scrape_trip_hotel(
            hotel_url=hotel_url,
            checkin_date=checkin_date,
            checkout_date=checkout_date,
            adults=adults,
            children=children,
            rooms=rooms
        )

        if supabase and 'error' not in result:
            try:
                supabase.table('accommodation_deals').insert({
                    "hotel_id": result.get('hotel_id', 0),
                    "source": "Trip.com",
                    "source_url": hotel_url,
                    "price": result.get('price', 0),
                    "taxes": result.get('taxes', 0),
                    "currency": result.get('currency', 'USD'),
                    "check_in": checkin_date,
                    "check_out": checkout_date,
                    "availability": result.get('availability', 'Not available'),
                    "room_type": result.get('room_type', 'Standard Room')
                }).execute()
            except Exception as e:
                logger.error(f"Failed to cache Trip.com result: {str(e)}")

        return result
    except Exception as e:
        logger.error(f"Error processing Trip.com request: {str(e)}")
        return {"error": str(e)}

@app.route('/scrape-booking', methods=['POST', 'OPTIONS'])
def handle_scrape_booking_request():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

    try:
        data = request.get_json()

        if not data or 'hotelUrl' not in data:
            logger.warning("Missing required field: hotelUrl")
            return _build_cors_response({
                "success": False,
                "error": "Missing required field: hotelUrl",
                "fallback_data": get_fallback_data("Booking.com")
            }, 400)

        with request_lock:
            result = process_booking_request(data)

        if 'error' in result:
            logger.error(f"Booking.com scraping error: {result['error']}")
            return _build_cors_response({
                "success": False,
                "error": result['error'],
                "fallback_data": get_fallback_data("Booking.com"),
                "alternative_dates": result.get('alternative_dates', [])
            })

        return _build_cors_response({
            "success": True,
            "data": {
                "hotel_name": result.get('hotel_name', 'Unknown Hotel'),
                "price": result.get('price', None),
                "taxes": result.get('taxes', 0),
                "currency": result.get('currency', 'ZAR'),
                "check_in": result.get('checkin_date', data.get('checkIn')),
                "check_out": result.get('checkout_date', data.get('checkOut')),
                "occupants": int(data.get('adults', 2)) + int(data.get('children', 0)),
                "availability": result.get('availability', 'Not available'),
                "room_type": result.get('room_type', 'Standard Room'),
                "source": "Booking.com",
                "source_url": result.get('source_url', data['hotelUrl'])
            }
        })

    except Exception as e:
        logger.error(f"Unexpected Booking.com error: {str(e)}")
        return _build_cors_response({
            "success": False,
            "error": f"An unexpected error occurred: {str(e)}",
            "fallback_data": get_fallback_data("Booking.com")
        }, 500)

@app.route('/scrape-trip', methods=['POST', 'OPTIONS'])
def handle_scrape_trip_request():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

    try:
        data = request.get_json()

        if not data or 'hotelUrl' not in data:
            logger.warning("Missing required field: hotelUrl")
            return _build_cors_response({
                "success": False,
                "error": "Missing required field: hotelUrl",
                "fallback_data": get_fallback_data("Trip.com")
            }, 400)

        with request_lock:
            result = process_trip_request(data)

        if 'error' in result:
            logger.error(f"Trip.com scraping error: {result['error']}")
            return _build_cors_response({
                "success": False,
                "error": result['error'],
                "fallback_data": get_fallback_data("Trip.com"),
                "alternative_dates": result.get('alternative_dates', [])
            })

        return _build_cors_response({
            "success": True,
            "data": {
                "hotel_name": result.get('hotel_name', 'Unknown Hotel'),
                "price": result.get('price', None),
                "taxes": result.get('taxes', 0),
                "currency": result.get('currency', 'USD'),
                "check_in": result.get('checkin_date', data.get('checkIn')),
                "check_out": result.get('checkout_date', data.get('checkOut')),
                "occupants": int(data.get('adults', 2)) + int(data.get('children', 0)),
                "availability": result.get('availability', 'Not available'),
                "room_type": result.get('room_type', 'Standard Room'),
                "source": "Trip.com",
                "source_url": result.get('source_url', data['hotelUrl'])
            }
        })

    except Exception as e:
        logger.error(f"Unexpected Trip.com error: {str(e)}")
        return _build_cors_response({
            "success": False,
            "error": f"An unexpected error occurred: {str(e)}",
            "fallback_data": get_fallback_data("Trip.com")
        }, 500)

def _build_cors_response(data, status_code=200):
    response = jsonify(data)
    origin = request.headers.get('Origin', '')
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://putumani.github.io",
        "https://travelaz.onrender.com"
    ]
    if origin in allowed_origins:
        response.headers.add("Access-Control-Allow-Origin", origin)
    else:
        response.headers.add("Access-Control-Allow-Origin", "https://putumani.github.io")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type")
    response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
    return response, status_code

def get_fallback_data(source):
    return {
        "price": None,
        "taxes": 0,
        "currency": "USD" if source == "Trip.com" else "ZAR",
        "availability": "Not available",
        "room_type": "Standard Room",
        "source": source
    }

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True, use_reloader=False)