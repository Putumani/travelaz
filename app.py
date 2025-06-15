from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
from scripts.scrape_booking_dot_com_hotels import scrape_booking_hotel
import sys
from pathlib import Path
import logging
from queue import Queue
from threading import Lock

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

sys.path.append(str(Path(__file__).parent / "scripts"))

app = Flask(__name__)

CORS(app, resources={
    r"/scrape-booking": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],  
        "methods": ["POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

BASE_SEARCH_URL = "https://www.booking.com/searchresults.en-gb.html?aid=304142&label=gen173nr-1FCAEoggI46AdIM1gDaFCIAQGYAQm4ARfIAQzYAQHoAQH4AQKIAgGoAgO4AqyN94AGwAIB0gIkYzVlYzU3YjYtOTM1Yi00YjA5LWE4Y2UtNzU1Y2Q3Y2Q1YzVj2AIF4AIB&ss=President+Hotel&ssne=President+Hotel&ssne_untouched=President+Hotel"

request_queue = Queue()
request_lock = Lock()
MAX_CONCURRENT_REQUESTS = 1

def process_request(data):
    """Process a single scraping request"""
    try:
        checkin_date = data.get('checkIn', datetime.now().strftime('%Y-%m-%d'))
        checkout_date = data.get('checkOut', (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'))
        adults = int(data.get('adults', 2))
        children = int(data.get('children', 0))
        rooms = int(data.get('rooms', 1))
        hotel_name = data.get('hotelName')

        result = scrape_booking_hotel(
            base_url=BASE_SEARCH_URL,
            checkin_date=checkin_date,
            checkout_date=checkout_date,
            occupants=adults + children,
            hotel_name=hotel_name
        )

        return result
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {"error": str(e)}

@app.route('/scrape-booking', methods=['POST', 'OPTIONS'])
def handle_scrape_request():
    if request.method == 'OPTIONS':
        response = jsonify({'status': 'preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        response.headers.add('Access-Control-Allow-Methods', 'POST')
        return response

    try:
        data = request.get_json()

        if not data or 'hotelName' not in data:
            logger.warning("Missing required field: hotelName")
            return _build_cors_response({
                "success": False,
                "error": "Missing required field: hotelName",
                "fallback_data": get_fallback_data()
            }, 400)

        with request_lock:
            result = process_request(data)

        if 'error' in result:
            logger.error(f"Scraping error: {result['error']}")
            return _build_cors_response({
                "success": False,
                "error": result['error'],
                "fallback_data": get_fallback_data(),
                "alternative_dates": result.get('alternative_dates', [])
            })

        return _build_cors_response({
            "success": True,
            "data": {
                "hotel_name": result.get('hotel_name', data['hotelName']),
                "price": result.get('price', 1200),
                "currency": result.get('currency', 'ZAR'),
                "check_in": result.get('checkin_date', data.get('checkIn', datetime.now().strftime('%Y-%m-%d'))),
                "check_out": result.get('checkout_date', data.get('checkOut', (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'))),
                "occupants": result.get('occupants', int(data.get('adults', 2)) + int(data.get('children', 0))),
                "availability": result.get('availability', 'Available'),
                "room_type": result.get('room_type', 'Standard Room'),
                "source": result.get('source', 'Booking.com')
            }
        })

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return _build_cors_response({
            "success": False,
            "error": f"An unexpected error occurred: {str(e)}",
            "fallback_data": get_fallback_data()
        }, 500)

def _build_cors_response(data, status_code=200):
    response = jsonify(data)
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173") 
    return response, status_code

def get_fallback_data():
    return {
        "price": 1200,
        "currency": "ZAR",
        "availability": "Available",
        "room_type": "Standard Room",
        "source": "Booking.com"
    }

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)