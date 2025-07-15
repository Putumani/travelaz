from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, WebDriverException
from datetime import datetime, timedelta
import json
import time
import os
import re
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
import logging
from threading import Lock
import random

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

SCREENSHOTS_DIR = "screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

_driver = None
_driver_lock = Lock()

def setup_driver():
    global _driver
    with _driver_lock:
        if _driver is None:
            options = webdriver.ChromeOptions()
            options.add_argument('--ignore-certificate-errors')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--no-sandbox')
            options.add_argument('--window-size=1920,1080')
            options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36')
            options.add_argument('--disable-cache')
            options.add_argument('--disable-blink-features=AutomationControlled')
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            options.add_experimental_option('useAutomationExtension', False)
            # Use headless mode to reduce bot detection
            # options.add_argument('--headless')
            service = Service()
            try:
                _driver = webdriver.Chrome(service=service, options=options)
                _driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
                    'source': '''
                        Object.defineProperty(navigator, 'webdriver', {
                            get: () => undefined
                        })
                    '''
                })
                logger.info("Initialized new WebDriver instance")
            except WebDriverException as e:
                logger.error(f"Failed to initialize WebDriver: {str(e)}")
                raise
        return _driver

def modify_hotel_url(original_url, checkin_date, checkout_date, adults=2, children=0, rooms=1):
    parsed = urlparse(original_url)
    query_params = parse_qs(parsed.query)
    
    query_params['startDate'] = [checkin_date]
    query_params['endDate'] = [checkout_date]
    query_params['adults'] = [str(adults)]
    query_params['children'] = [str(children)]
    query_params['rooms'] = [str(rooms)]
    
    for param in ['selected', 'q', 't']:
        if param in query_params:
            del query_params[param]
    
    new_query = urlencode(query_params, doseq=True)
    logger.info(f"Modified hotel URL: {new_query}")
    return urlunparse(parsed._replace(query=new_query))

def extract_price(price_text):
    if not price_text:
        return None
    numbers = re.findall(r'[\d,]+(?:\.\d{2})?', price_text.replace(",", ""))
    return float(numbers[0]) if numbers else None

def detect_currency(page_text):
    if "ZAR" in page_text or "R" in page_text:
        return "ZAR"
    elif "$" in page_text:
        return "USD"
    return "USD"

def generate_alternative_dates(checkin_date, checkout_date):
    try:
        checkin_dt = datetime.strptime(checkin_date, '%Y-%m-%d').date()
        checkout_dt = datetime.strptime(checkout_date, '%Y-%m-%d').date()
        alternatives = []
        
        if (checkout_dt - checkin_dt).days == 1:
            new_checkout = checkin_dt + timedelta(days=2)
            alternatives.append({
                "checkin_date": checkin_dt.strftime('%Y-%m-%d'),
                "checkout_date": new_checkout.strftime('%Y-%m-%d'),
                "nights": 2,
                "dates": f"{checkin_dt.strftime('%b %d')} - {new_checkout.strftime('%b %d')}"
            })
        return alternatives
    except ValueError:
        return []

def scrape_expedia_hotel(hotel_url, checkin_date, checkout_date, adults=2, children=0, rooms=1):
    try:
        checkin_dt = datetime.strptime(checkin_date, '%Y-%m-%d').date()
        checkout_dt = datetime.strptime(checkout_date, '%Y-%m-%d').date()
        if checkin_dt >= checkout_dt:
            logger.error("Invalid dates: check-out must be after check-in")
            return {"error": "Check-out date must be after check-in date"}
        if checkin_dt < datetime.now().date():
            logger.error("Invalid dates: check-in date cannot be in the past")
            return {"error": "Check-in date cannot be in the past"}
    except ValueError:
        logger.error("Invalid date format")
        return {"error": "Invalid date format, expected YYYY-MM-DD"}

    logger.info(f"Processing dates: checkIn={checkin_date}, checkOut={checkout_date}")

    driver = setup_driver()
    try:
        search_url = modify_hotel_url(hotel_url, checkin_date, checkout_date, adults, children, rooms)
        logger.info(f"Loading hotel URL: {search_url}")
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                driver.get(search_url)
                # Wait for JavaScript to load
                time.sleep(5)
                WebDriverWait(driver, 30).until(
                    EC.any_of(
                        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-stid='property-listings-results']")),
                        EC.presence_of_element_located((By.CSS_SELECTOR, "[data-stid='messaging-card-no-availability']"))
                    )
                )
                break
            except TimeoutException as e:
                if attempt == max_retries - 1:
                    logger.error(f"Timeout after {max_retries} attempts: {str(e)}")
                    raise
                logger.warning(f"Attempt {attempt + 1} failed, retrying...")
                time.sleep(random.uniform(3, 6))
        
        # Save page source for debugging
        timestamp = int(time.time())
        with open(os.path.join(SCREENSHOTS_DIR, f'expedia_page_content_{timestamp}.html'), 'w', encoding='utf-8') as f:
            f.write(driver.page_source)
        
        try:
            unavailability_div = driver.find_element(By.CSS_SELECTOR, "[data-stid='messaging-card-no-availability']")
            unavailability_message = unavailability_div.find_element(By.CSS_SELECTOR, "h3").text
            logger.info(f"Unavailability message detected: {unavailability_message}")
            
            result = {
                "error": unavailability_message,
                "availability": "Not available",
                "hotel_name": "Unknown Hotel",
                "price": None,
                "taxes": None,
                "currency": "USD",
                "checkin_date": checkin_date,
                "checkout_date": checkout_date,
                "room_type": "Standard Room",
                "source_url": search_url
            }
            
            if "try different dates" in unavailability_message.lower():
                result["alternative_dates"] = generate_alternative_dates(checkin_date, checkout_date)
            
            return result
        except NoSuchElementException:
            logger.info("No unavailability message found, proceeding with hotel card scraping")

        try:
            # Find the hotel listings container
            listings_container = WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-stid='property-listings-results']"))
            )
            # Get all hotel cards
            hotel_cards = listings_container.find_elements(By.CSS_SELECTOR, "[data-stid='lodging-card-responsive']")
            if len(hotel_cards) < 2:
                logger.error("Not enough hotel cards found, expected at least two")
                return {"error": "No valid hotel cards found"}

            # Skip the first card (sign-in prompt) and use the second card
            hotel_card = hotel_cards[1]
            
            # Extract hotel name
            try:
                hotel_name = hotel_card.find_element(By.CSS_SELECTOR, "h3.uitk-heading-5").text
            except NoSuchElementException:
                hotel_name = "Unknown Hotel"
                logger.warning("Hotel name not found")

            # Extract rating
            try:
                rating = hotel_card.find_element(By.CSS_SELECTOR, ".uitk-badge-base-text").text
            except NoSuchElementException:
                rating = "N/A"
                logger.warning("Rating not found")

            # Extract reviews
            try:
                reviews = hotel_card.find_element(By.CSS_SELECTOR, ".uitk-text[aria-hidden='true']:not(.uitk-type-end)").text
                if "reviews" not in reviews.lower():
                    reviews = "No reviews"
            except NoSuchElementException:
                reviews = "No reviews"
                logger.warning("Reviews not found")

            # Extract location
            try:
                location = hotel_card.find_element(By.CSS_SELECTOR, ".uitk-text-spacing-half.truncate-lines-3").text
            except NoSuchElementException:
                location = "Unknown"
                logger.warning("Location not found")

            # Extract price and taxes
            try:
                price_element = hotel_card.find_element(By.CSS_SELECTOR, "[data-test-id='price-summary'] .uitk-text.uitk-type-400.uitk-type-medium")
                price_text = price_element.text
                price = extract_price(price_text)
                taxes = 0  # Assume taxes included as per HTML
                availability = "Available" if price else "Not available"
                currency = detect_currency(price_text)
            except NoSuchElementException:
                logger.warning("Price element not found")
                price = None
                taxes = None
                availability = "Not available"
                currency = "USD"

            # Extract room type
            try:
                room_type_element = hotel_card.find_element(By.CSS_SELECTOR, ".uitk-gallery-carousel-item-current img")
                room_type = room_type_element.get_attribute("alt").split("|")[0].strip()
            except NoSuchElementException:
                room_type = "Standard Room"
                logger.warning("Room type not found")

            # Extract source URL
            try:
                source_url = hotel_card.find_element(By.CSS_SELECTOR, "[data-stid='open-hotel-information']").get_attribute("href")
            except NoSuchElementException:
                source_url = search_url
                logger.warning("Source URL not found")

            result = {
                "hotel_name": hotel_name,
                "rating": rating,
                "reviews": reviews,
                "location": location,
                "distance_from_center": "Unknown",  # Not available in provided HTML
                "price": price,
                "taxes": taxes,
                "currency": currency,
                "availability": availability,
                "checkin_date": checkin_date,
                "checkout_date": checkout_date,
                "room_type": room_type,
                "source_url": source_url
            }
            logger.info(f"Scraped data: {result}")
            return result

        except Exception as e:
            logger.error(f"Error processing hotel card: {str(e)}")
            return {"error": f"Failed to process hotel card: {str(e)}"}

    except Exception as e:
        logger.error(f"Scraping error: {str(e)}")
        with open(os.path.join(SCREENSHOTS_DIR, f'expedia_error_page_content_{timestamp}.html'), 'w', encoding='utf-8') as f:
            f.write(driver.page_source)
        return {"error": str(e)}

def cleanup_driver():
    global _driver
    with _driver_lock:
        if _driver is not None:
            try:
                _driver.quit()
                _driver = None
                logger.info("WebDriver instance manually closed")
            except Exception:
                pass

import atexit
atexit.register(cleanup_driver) 