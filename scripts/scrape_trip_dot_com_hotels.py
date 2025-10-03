from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
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

def setup_driver():
    global _driver
    with _driver_lock:
        if _driver is None:
            try:
                options = webdriver.ChromeOptions()
                options.add_argument('--ignore-certificate-errors')
                options.add_argument('--disable-dev-shm-usage')
                options.add_argument('--no-sandbox')
                options.add_argument('--window-size=1920,1080')
                options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36')
                options.add_argument('--disable-cache')
                options.add_argument('--disable-blink-features=AutomationControlled')
                options.add_experimental_option("excludeSwitches", ["enable-automation"])
                options.add_experimental_option('useAutomationExtension', False)
                
                service = Service(ChromeDriverManager().install())
                _driver = webdriver.Chrome(service=service, options=options)
                
                _driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
                    'source': '''
                        Object.defineProperty(navigator, 'webdriver', {
                            get: () => undefined
                        })
                    '''
                })
                
                logger.info(f"Initialized new WebDriver instance with ChromeDriver at {service.path}")
                logger.info(f"Chrome version: {_driver.capabilities['browserVersion']}")
                logger.info(f"ChromeDriver version: {_driver.capabilities['chrome']['chromedriverVersion']}")
            except Exception as e:
                logger.error(f"Failed to initialize WebDriver: {str(e)}")
                raise
        return _driver

def modify_hotel_url(original_url, checkin_date, checkout_date, adults=2, children=0, rooms=1, currency='USD'):
    parsed = urlparse(original_url)
    query_params = parse_qs(parsed.query)

    query_params['checkIn'] = [checkin_date]
    query_params['checkOut'] = [checkout_date]
    query_params['adult'] = [str(adults)]
    query_params['children'] = [str(children)]
    query_params['crn'] = [str(rooms)]
    query_params['curr'] = [currency.upper()]
    
    locale_mapping = {
        'USD': 'en-US',
        'ZAR': 'en-ZA',
        'GBP': 'en-GB',
        'EUR': 'en-EU',
        'AUD': 'en-AU',
        'THB': 'en-TH'
    }
    query_params['locale'] = [locale_mapping.get(currency.upper(), 'en-US')]

    for param in ['checkin', 'checkout', 'subStamp', 'subChannel', 'travelpurpose']:
        if param in query_params:
            del query_params[param]

    new_query = urlencode(query_params, doseq=True)
    logger.info(f"Modified hotel URL with currency {currency}: {new_query}")
    return urlunparse(parsed._replace(query=new_query))

def extract_price(price_text):
    if not price_text:
        return None
    price_text = price_text.replace("US$", "").replace("R", "").replace("ZAR", "").replace("£", "").replace("€", "").replace("A$", "").replace("฿", "").strip()
    numbers = re.findall(r'[\d,]+(?:\.\d+)?', price_text.replace(",", ""))
    return float(numbers[0]) if numbers else None

def detect_currency(page_text, requested_currency):
    page_text_upper = page_text.upper()
    if requested_currency.upper() in page_text_upper:
        return requested_currency.upper()
    if "ZAR" in page_text or "R" in page_text:
        return "ZAR"
    elif "$" in page_text or "US$" in page_text:
        return "USD"
    elif "£" in page_text:
        return "GBP"
    elif "€" in page_text:
        return "EUR"
    elif "A$" in page_text:
        return "AUD"
    elif "฿" in page_text:
        return "THB"
    logger.warning(f"No currency detected, defaulting to {requested_currency.upper()}")
    return requested_currency.upper()

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
                "dates": f"{checkin_dt.strftime('%b %d')} - {new_checkout.strftime('%b %d')}",
                "price": 0,
                "taxes": 0,
                "currency": "USD"
            })
        return alternatives
    except ValueError:
        logger.error("Invalid date format for alternative dates")
        return []

def scrape_trip_hotel(hotel_url, checkin_date, checkout_date, adults=2, children=0, rooms=1, currency='USD'):
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

    logger.info(f"Processing dates: checkIn={checkin_date}, checkOut={checkout_date}, currency={currency}")

    driver = setup_driver()
    try:
        search_url = modify_hotel_url(hotel_url, checkin_date, checkout_date, adults, children, rooms, currency)
        logger.info(f"Loading hotel URL: {search_url}")

        max_retries = 3
        for attempt in range(max_retries):
            try:
                driver.get(search_url)
                WebDriverWait(driver, 20).until(
                    EC.any_of(
                        EC.presence_of_element_located((By.CSS_SELECTOR, "div.no-results")),
                        EC.presence_of_element_located((By.CSS_SELECTOR, "section.main-container.main-content ul.long-list.long-list-v8 li[id]"))
                    )
                )
                break
            except Exception as e:
                if attempt == max_retries - 1:
                    logger.error(f"Failed to load page after {max_retries} attempts: {str(e)}")
                    raise
                logger.warning(f"Attempt {attempt + 1} failed, retrying...")
                time.sleep(random.uniform(2, 4))

        with open('trip_page_content.html', 'w', encoding='utf-8') as f:
            f.write(driver.page_source)

        try:
            no_results_div = driver.find_element(By.CSS_SELECTOR, "div.no-results")
            error_message = no_results_div.find_element(By.CSS_SELECTOR, "span").text
            logger.info(f"Unavailability message detected: {error_message}")
            result = {
                "error": error_message,
                "availability": "Not available",
                "hotel_name": "Unknown Hotel",
                "price": None,
                "taxes": None,
                "currency": currency.upper(),
                "checkin_date": checkin_date,
                "checkout_date": checkout_date,
                "room_type": "Standard Room",
                "source_url": search_url,
                "alternative_dates": generate_alternative_dates(checkin_date, checkout_date)
            }
            return result
        except NoSuchElementException:
            logger.info("No unavailability message found, proceeding with hotel card scraping")

        hotel_card = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "section.main-container.main-content ul.long-list.long-list-v8 li[id]"))
        )

        hotel_name = hotel_card.find_element(By.CSS_SELECTOR, "div.list-card-title a.name").text
        rating = hotel_card.find_element(By.CSS_SELECTOR, "div.score .real").text
        reviews = hotel_card.find_element(By.CSS_SELECTOR, "div.count a").text
        location = hotel_card.find_element(By.CSS_SELECTOR, "span[data-testid='address']").text if hotel_card.find_elements(By.CSS_SELECTOR, "span[data-testid='address']") else "Unknown"
        distance = hotel_card.find_element(By.CSS_SELECTOR, "p.transport span:nth-child(2)").text
        availability_url = hotel_card.find_element(By.CSS_SELECTOR, "a[href*='/hotels/detail']").get_attribute("href")
        
        try:
            room_type = hotel_card.find_element(By.CSS_SELECTOR, "span.room-panel-roominfo-name").text
        except NoSuchElementException:
            logger.warning("Room type element not found, defaulting to 'Standard Room'")
            room_type = "Standard Room"

        try:
            price_element = hotel_card.find_element(By.CSS_SELECTOR, "div.real.labelColor")
            price_text = price_element.text
            price = extract_price(price_text)
            taxes_info = hotel_card.find_element(By.CSS_SELECTOR, "p.price-explain").text
            taxes_match = re.search(r'Total \(incl\. taxes & fees\): [^\d]*(\d+\.?\d*)', taxes_info)
            taxes = float(taxes_match.group(1)) - price if taxes_match else 0
            availability = "Available" if price else "Not available"
            detected_currency = detect_currency(driver.page_source, currency)
        except NoSuchElementException:
            logger.warning("Price element not found, assuming no availability")
            price = None
            taxes = None
            availability = "Not available"
            detected_currency = currency.upper()

        result = {
            "hotel_name": hotel_name,
            "rating": rating,
            "reviews": reviews,
            "location": location,
            "distance_from_center": distance,
            "price": price,
            "taxes": taxes,
            "currency": detected_currency,
            "availability": availability,
            "checkin_date": checkin_date,
            "checkout_date": checkout_date,
            "room_type": room_type,
            "source_url": availability_url
        }
        logger.info(f"Scraped data: {result}")
        return result

    except Exception as e:
        logger.error(f"Scraping error: {str(e)}")
        with open('trip_error_page_content.html', 'w', encoding='utf-8') as f:
            f.write(driver.page_source)
        return {
            "error": str(e),
            "availability": "Not available",
            "hotel_name": "Unknown Hotel",
            "price": None,
            "taxes": None,
            "currency": currency.upper(),
            "checkin_date": checkin_date,
            "checkout_date": checkout_date,
            "room_type": "Standard Room",
            "source_url": search_url,
            "alternative_dates": generate_alternative_dates(checkin_date, checkout_date)
        }

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