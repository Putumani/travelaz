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

def setup_driver():
    global _driver
    with _driver_lock:
        if _driver is not None:
            try:
                _driver.quit()
            except Exception:
                pass
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
        service = Service()
        _driver = webdriver.Chrome(service=service, options=options)
        
        _driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
            'source': '''
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                })
            '''
        })
        
        logger.info("Initialized new WebDriver instance")
        return _driver

def modify_hotel_url(original_url, checkin_date, checkout_date, adults=2, children=0, rooms=1):
    parsed = urlparse(original_url)
    query_params = parse_qs(parsed.query)
    
    query_params['checkin'] = [checkin_date]
    query_params['checkout'] = [checkout_date]
    query_params['group_adults'] = [str(adults)]
    query_params['group_children'] = [str(children)]
    query_params['no_rooms'] = [str(rooms)]
    
    for param in ['changed_currency', 'hlrd', 'req_adults', 'req_children', 'req_room']:
        if param in query_params:
            del query_params[param]
    
    new_query = urlencode(query_params, doseq=True)
    logger.info(f"Modified hotel URL: {new_query}")
    return urlunparse(parsed._replace(query=new_query))

def extract_price(price_text):
    if not price_text:
        return None
    numbers = re.findall(r'[\d,]+', price_text.replace(",", ""))
    return int(numbers[0]) if numbers else None

def detect_currency(page_text):
    if "ZAR" in page_text or "R" in page_text:
        return "ZAR"
    elif "$" in page_text:
        return "USD"
    return "ZAR"

def scrape_booking_hotel(hotel_url, checkin_date, checkout_date, adults=2, children=0, rooms=1):
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
                WebDriverWait(driver, 20).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='property-card']"))
                )
                break
            except Exception as e:
                if attempt == max_retries - 1:
                    raise
                logger.warning(f"Attempt {attempt + 1} failed, retrying...")
                time.sleep(random.uniform(2, 4))
        
        with open('page_content.html', 'w', encoding='utf-8') as f:
            f.write(driver.page_source)
        
        hotel_card = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='property-card']"))
        )
        
        hotel_name = hotel_card.find_element(By.CSS_SELECTOR, "div[data-testid='title']").text
        rating = hotel_card.find_element(By.CSS_SELECTOR, "div[data-testid='review-score'] .dff2e52086").text
        reviews = hotel_card.find_element(By.CSS_SELECTOR, "div[data-testid='review-score'] .fff1944c52.fb14de7f14.eaa8455879").text
        location = hotel_card.find_element(By.CSS_SELECTOR, "span[data-testid='address']").text
        distance = hotel_card.find_element(By.CSS_SELECTOR, "span[data-testid='distance']").text
        availability_url = hotel_card.find_element(By.CSS_SELECTOR, "a[data-testid='availability-cta-btn']").get_attribute("href")
        currency = detect_currency(hotel_card.text)
        room_type = hotel_card.find_element(By.CSS_SELECTOR, "div[data-testid='recommended-units'] h4").text

        try:
            price_element = hotel_card.find_element(By.CSS_SELECTOR, "span[data-testid='price-and-discounted-price']")
            price = extract_price(price_element.text)
            taxes_info = hotel_card.find_element(By.CSS_SELECTOR, "div[data-testid='taxes-and-charges']").text
            taxes = 0 if "Includes taxes and charges" in taxes_info else None
            availability = "Available" if price else "Not available"
        except NoSuchElementException:
            logger.warning("Price element not found, checking for unavailability indicators")
            unavailability_indicators = hotel_card.find_elements(By.XPATH, "//*[contains(text(), 'No availability') or contains(text(), 'Sold out')]")
            if unavailability_indicators:
                price = None
                taxes = None
                availability = "Not available"
            else:
                price = None
                taxes = None
                availability = "Unknown availability (price missing)"

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
            "source_url": availability_url
        }
        logger.info(f"Scraped data: {result}")
        return result

    except Exception as e:
        logger.error(f"Scraping error: {str(e)}")
        with open('error_page_content.html', 'w', encoding='utf-8') as f:
            f.write(driver.page_source)
        return {"error": str(e)}
    finally:
        try:
            driver.quit()
        except:
            pass

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