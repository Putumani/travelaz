import os
from dotenv import load_dotenv
from supabase import create_client
import requests
from bs4 import BeautifulSoup 
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
from scrapingdog import Scrapingdog
import time
from datetime import datetime, timedelta

load_dotenv()

API_KEY = os.getenv('SCRAPINGDOG_API_KEY')  
SUPABASE_URL = os.getenv('VITE_SUPABASE_URL')
SUPABASE_KEY = os.getenv('VITE_SUPABASE_ANON_KEY')
CITIES = ['Durban', 'Cape Town', 'Bangkok']
CHECK_IN = (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d')
CHECK_OUT = (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d')
ADULTS = 2
ROOMS = 1
BASE_URL = 'https://www.booking.com/searchresults.html'

scraper = Scrapingdog(api_key=API_KEY)
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

options = Options()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

def scrape_city_hotels(city):
    params = {
        'ss': city,
        'checkin': CHECK_IN,
        'checkout': CHECK_OUT,
        'group_adults': ADULTS,
        'no_rooms': ROOMS,
        'group_children': 0,
        'order': 'popularity',
    }

    try:
        url = f"{BASE_URL}?{'&'.join(f'{k}={v}' for k, v in params.items())}"
        response = scraper.get(url)
        soup = BeautifulSoup(response.content, 'lxml')

        driver.get(url)
        time.sleep(5)

        try:
            driver.find_element_by_css_selector('[aria-label="Dismiss"]').click()
        except:
            pass

        hotel_cards = soup.find_all('div', {'data-testid': 'property-card'}, limit=10)
        for card in hotel_cards:
            try:
                name = card.find('div', {'data-testid': 'title'}).get_text(strip=True)
                price_elem = card.find('span', {'data-testid': 'price-and-discounted-price'})
                price = price_elem.get_text(strip=True).replace('ZAR', '').replace('THB', '').strip() if price_elem else '0'
                rating_elem = card.find('div', {'data-testid': 'review-score'})
                rating = rating_elem.get_text(strip=True)[:3] if rating_elem else '0.0'
                reviews_elem = card.find('div', {'data-testid': 'review-score'})
                reviews = reviews_elem.find_all('div')[1].get_text(strip=True).split()[0] if reviews_elem else '0'
                availability_elem = card.find('div', {'data-testid': 'availability-cta'})
                available = 'Available' if availability_elem else 'Sold Out'
                booking_url = card.find('a', {'data-testid': 'title-link'})['href']
                amenities_elem = card.find('div', {'data-testid': 'property-card-features'})
                amenities = [item.get_text(strip=True) for item in amenities_elem.find_all('div')] if amenities_elem else []

                data = {
                    'city': city,
                    'name': name,
                    'price': int(float(price.replace(',', '')) if price != 'N/A' else 0),
                    'rating': float(rating) if rating != 'N/A' else 0.0,
                    'image_url': '', 
                    'area': '',
                    'view_count': 0, 
                    'affiliate_deals': {'price': price, 'site_name': 'Booking.com', 'affiliate_url': booking_url},
                    'available': available,
                    'booking_url': booking_url,
                    'amenities': amenities,
                    'reviews': int(reviews.replace(',', '')) if reviews != 'N/A' else 0,
                    'check_in': CHECK_IN,
                    'check_out': CHECK_OUT,
                    'currency': 'ZAR' if city in ['Durban', 'Cape Town'] else 'THB'
                }
                response = supabase.table('accommodations').upsert(data, on_conflict='name').execute()
                print(f"Upserted {name} in {city} at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} SAST")
            except Exception as e:
                print(f"Error parsing hotel in {city}: {e}")
                continue

    except Exception as e:
        print(f"Error scraping {city}: {e}")

def main():
    for city in sorted(CITIES):
        print(f"Scraping hotels in {city} at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} SAST...")
        scrape_city_hotels(city)
        time.sleep(2)
    driver.quit()

if __name__ == '__main__':
    main()