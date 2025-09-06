from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
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

from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service as ChromeService

def setup_driver():
    global _driver
    with _driver_lock:
        if _driver is None: 
            options = webdriver.ChromeOptions()
            
            # Always use headless in production
            options.add_argument('--headless=new')
            
            # Memory and performance optimizations
            options.add_argument('--no-sandbox')
            options.add_argument('--disable-dev-shm-usage')
            options.add_argument('--disable-gpu')
            options.add_argument('--window-size=1280,1024')
            options.add_argument('--disable-setuid-sandbox')
            options.add_argument('--ignore-certificate-errors')
            
            # Reduce memory usage
            options.add_argument('--disable-extensions')
            options.add_argument('--disable-software-rasterizer')
            
            # Security and automation detection avoidance
            options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36')
            options.add_argument('--disable-blink-features=AutomationControlled')
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            options.add_experimental_option('useAutomationExtension', False)
            
            try:
                # Use webdriver-manager to handle ChromeDriver
                service = ChromeService(ChromeDriverManager().install())
                _driver = webdriver.Chrome(service=service, options=options)
                
                _driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
                    'source': '''
                        Object.defineProperty(navigator, 'webdriver', {
                            get: () => undefined
                        })
                    '''
                })
                
                logger.info("Initialized WebDriver instance")
            except Exception as e:
                logger.error(f"Failed to initialize WebDriver: {str(e)}")
                raise
        return _driver

def cleanup_driver():
    global _driver
    with _driver_lock:
        if _driver is not None:
            try:
                _driver.quit()
                _driver = None
                logger.info("WebDriver instance closed")
            except Exception as e:
                logger.error(f"Error during driver cleanup: {str(e)}")

def modify_trip_url(original_url, checkin_date, checkout_date, adults=2, children=0, rooms=1):
    """
    Modify Trip.com URL with the given parameters
    """
    parsed = urlparse(original_url)
    query_params = parse_qs(parsed.query)
    
    # Trip.com uses different parameter names than Booking.com
    query_params['checkIn'] = [checkin_date]
    query_params['checkOut'] = [checkout_date]
    query_params['adult'] = [str(adults)]
    query_params['children'] = [str(children)]
    query_params['rooms'] = [str(rooms)]
    
    # Remove any parameters that might conflict
    for param in ['subStamp', 'subChannel', 'travelpurpose', 'curr', 'locale']:
        if param in query_params:
            del query_params[param]
    
    # Set currency to USD by default
    query_params['curr'] = ['USD']
    query_params['locale'] = ['en-US']
    
    new_query = urlencode(query_params, doseq=True)
    logger.info(f"Modified Trip.com URL: {new_query}")
    return urlunparse(parsed._replace(query=new_query))

def extract_price(price_text):
    if not price_text:
        return None
    # Extract numbers from price text, handling decimals
    numbers = re.findall(r'[\d,]+(?:\.\d+)?', price_text.replace(",", ""))
    return float(numbers[0]) if numbers else None

def detect_currency(page_text):
    if "US$" in page_text or "$" in page_text:
        return "USD"
    elif "ZAR" in page_text or "R" in page_text:
        return "ZAR"
    elif "€" in page_text or "EUR" in page_text:
        return "EUR"
    elif "£" in page_text or "GBP" in page_text:
        return "GBP"
    return "USD"  # Default to USD

def generate_alternative_dates(checkin_date, checkout_date):
    try:
        checkin_dt = datetime.strptime(checkin_date, '%Y-%m-%d').date()
        checkout_dt = datetime.strptime(checkout_date, '%Y-%m-%d').date()
        alternatives = []
        
        # Generate alternative dates with 2-night stay if originally 1 night
        if (checkout_dt - checkin_dt).days == 1:
            new_checkout = checkin_dt + timedelta(days=2)
            alternatives.append({
                "checkin_date": checkin_dt.strftime('%Y-%m-%d'),
                "checkout_date": new_checkout.strftime('%Y-%m-%d'),
                "nights": 2,
                "dates": f"{checkin_dt.strftime('%b %d')} - {new_checkout.strftime('%b %d')}"
            })
        
        # Generate alternative dates with 3-night stay
        new_checkout_3 = checkin_dt + timedelta(days=3)
        alternatives.append({
            "checkin_date": checkin_dt.strftime('%Y-%m-%d'),
            "checkout_date": new_checkout_3.strftime('%Y-%m-%d'),
            "nights": 3,
            "dates": f"{checkin_dt.strftime('%b %d')} - {new_checkout_3.strftime('%b %d')}"
        })
        
        return alternatives
    except ValueError:
        return []

def scrape_trip_hotel(hotel_url, checkin_date, checkout_date, adults=2, children=0, rooms=1):
    """
    Scrape hotel data from Trip.com
    """
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
        search_url = modify_trip_url(hotel_url, checkin_date, checkout_date, adults, children, rooms)
        logger.info(f"Loading Trip.com URL: {search_url}")
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                driver.get(search_url)
                # Wait for either the hotel details or an error message to load
                WebDriverWait(driver, 20).until(
                    EC.any_of(
                        EC.presence_of_element_located((By.CSS_SELECTOR, ".hotel-detail")),
                        EC.presence_of_element_located((By.CSS_SELECTOR, ".error-container, .no-available")),
                        EC.presence_of_element_located((By.CSS_SELECTOR, "[class*='soldout']"))
                    )
                )
                break
            except Exception as e:
                if attempt == max_retries - 1:
                    raise
                logger.warning(f"Attempt {attempt + 1} failed, retrying...")
                time.sleep(random.uniform(2, 4))
        
        # Save page content for debugging
        with open('trip_page_content.html', 'w', encoding='utf-8') as f:
            f.write(driver.page_source)
        
        # Check for error/sold-out messages
        try:
            # Check for sold-out messages
            soldout_elements = driver.find_elements(By.CSS_SELECTOR, ".soldout-tip, .no-available, [class*='soldout']")
            if soldout_elements:
                soldout_message = soldout_elements[0].text
                logger.info(f"Sold out message detected: {soldout_message}")
                
                result = {
                    "error": soldout_message,
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
                
                # Check if it's a minimum stay requirement
                if "minimum" in soldout_message.lower() or "night" in soldout_message.lower():
                    result["alternative_dates"] = generate_alternative_dates(checkin_date, checkout_date)
                
                return result
        except NoSuchElementException:
            logger.info("No sold-out message found, proceeding with hotel detail scraping")
        
        # Check for error messages
        try:
            error_elements = driver.find_elements(By.CSS_SELECTOR, ".error-container, .error-tip")
            if error_elements:
                error_message = error_elements[0].text
                logger.info(f"Error message detected: {error_message}")
                
                result = {
                    "error": error_message,
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
                
                if "minimum" in error_message.lower() or "night" in error_message.lower():
                    result["alternative_dates"] = generate_alternative_dates(checkin_date, checkout_date)
                
                return result
        except NoSuchElementException:
            logger.info("No error message found, proceeding with hotel detail scraping")

        # Extract hotel details
        hotel_name = driver.find_element(By.CSS_SELECTOR, ".hotel-name, .detail-title").text
        rating = driver.find_element(By.CSS_SELECTOR, ".score, .review-score").text
        reviews = driver.find_element(By.CSS_SELECTOR, ".review-count, .review-num").text
        
        # Extract location if available
        try:
            location = driver.find_element(By.CSS_SELECTOR, ".location, .address").text
        except NoSuchElementException:
            location = "Unknown"
        
        # Extract distance from center if available
        try:
            distance = driver.find_element(By.CSS_SELECTOR, "[class*='distance'], [class*='location']").text
        except NoSuchElementException:
            distance = "Unknown"
        
        currency = detect_currency(driver.page_source)
        
        # Try to find room type
        try:
            room_type = driver.find_element(By.CSS_SELECTOR, ".room-name, .room-type").text
        except NoSuchElementException:
            room_type = "Standard Room"
        
        # Try to extract price
        try:
            price_element = driver.find_element(By.CSS_SELECTOR, ".final-price, .total-price, .price-value")
            price = extract_price(price_element.text)
            
            # Try to extract taxes
            try:
                taxes_element = driver.find_element(By.CSS_SELECTOR, ".taxes, .fee-info, .additional-fees")
                taxes = extract_price(taxes_element.text)
            except NoSuchElementException:
                taxes = 0
                
            availability = "Available" if price else "Not available"
        except NoSuchElementException:
            logger.warning("Price element not found, checking for alternative selectors")
            # Try alternative selectors for price
            try:
                price_element = driver.find_element(By.CSS_SELECTOR, "[class*='price'], [class*='amount']")
                price = extract_price(price_element.text)
                taxes = 0
                availability = "Available" if price else "Not available"
            except NoSuchElementException:
                price = None
                taxes = None
                availability = "Not available"

        result = {
            "hotel_name": hotel_name,
            "rating": rating,
            "reviews": reviews,
            "location": location,
            "distance_from_center": distance,
            "price": price,
            "taxes": taxes,
            "currency": currency,
            "availability": availability,
            "checkin_date": checkin_date,
            "checkout_date": checkout_date,
            "room_type": room_type,
            "source_url": search_url
        }
        
        logger.info(f"Scraped data from Trip.com: {result}")
        return result

    except Exception as e:
        logger.error(f"Scraping error on Trip.com: {str(e)}")
        # Save error page content for debugging
        with open('trip_error_page_content.html', 'w', encoding='utf-8') as f:
            f.write(driver.page_source)
        return {"error": str(e)}
    
    finally:
        cleanup_driver()

import atexit
atexit.register(cleanup_driver)