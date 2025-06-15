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

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

SCREENSHOTS_DIR = "screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

# Singleton WebDriver instance
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
            options.add_argument('--disable-cache')  # Disable caching to avoid old data
            service = Service()
            _driver = webdriver.Chrome(service=service, options=options)
            logger.info("Initialized new WebDriver instance")
        return _driver

def save_screenshot(driver, filename):
    path = os.path.join(SCREENSHOTS_DIR, filename)
    driver.save_screenshot(path)
    logger.info(f"Screenshot saved: {path}")

def modify_search_url(original_url, checkin_date, checkout_date, occupants=2):
    parsed = urlparse(original_url)
    query_params = parse_qs(parsed.query)
    query_params['checkin'] = [checkin_date]  # Ensure correct checkin date
    query_params['checkout'] = [checkout_date]  # Ensure correct checkout date
    query_params['group_adults'] = [str(occupants)]
    query_params['group_children'] = ['0']
    new_query = urlencode(query_params, doseq=True)
    logger.info(f"Modified URL query: {new_query}")  # Log the modified query for debugging
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

def scrape_booking_hotel(base_url, checkin_date, checkout_date, occupants=2, hotel_name="President Hotel"):
    driver = setup_driver()
    try:
        search_url = modify_search_url(base_url, checkin_date, checkout_date, occupants)
        logger.info(f"Loading search URL: {search_url}")
        driver.get(search_url)
        
        # Clear cache and force reload
        driver.execute_script("window.location.reload(true);")
        time.sleep(random.uniform(5, 10))  # Wait for dynamic content

        # Wait for the hotel card to load
        try:
            hotel_card = WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.XPATH,
                    f"//div[contains(@data-testid, 'property-card')][.//div[@data-testid='title' and contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '{hotel_name.lower()}')]]"))
            )
        except TimeoutException:
            logger.error("Hotel not found in search results")
            save_screenshot(driver, f"hotel_not_found_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
            return {"error": "Hotel not found in search results"}

        # Extract hotel name
        try:
            name_element = hotel_card.find_element(By.CSS_SELECTOR, "[data-testid='title']")
            hotel_name = name_element.text
        except NoSuchElementException:
            hotel_name = hotel_name  # Fallback to provided name

        # Extract availability details
        availability_section = hotel_card.find_element(By.CSS_SELECTOR, "[data-testid='availability-single']")
        try:
            # Extract room type
            room_type_element = availability_section.find_element(By.CSS_SELECTOR, "h4")
            room_type = room_type_element.text

            # Extract breakfast and cancellation
            amenities = availability_section.find_elements(By.CSS_SELECTOR, ".d1e8dce286 li")
            breakfast_included = any("Breakfast included" in elem.text for elem in amenities)
            free_cancellation = any("Free cancellation" in elem.text for elem in amenities)

            # Extract price
            price_element = availability_section.find_element(By.CSS_SELECTOR, "[data-testid='price-and-discounted-price']")
            price = extract_price(price_element.text)

            taxes_element = availability_section.find_element(By.CSS_SELECTOR, "[data-testid='taxes-and-charges']")
            taxes = extract_price(taxes_element.text.replace("+", "").replace(" taxes and charges", ""))

        except NoSuchElementException as e:
            logger.warning(f"Could not find all availability details: {str(e)}")
            price = None
            taxes = None
            room_type = None
            breakfast_included = False
            free_cancellation = False

        result = {
            "hotel_name": hotel_name,
            "price": price,
            "taxes": taxes,
            "currency": detect_currency(driver.page_source),
            "availability": "Available" if price else "Not available",
            "checkin_date": checkin_date,
            "checkout_date": checkout_date,
            "room_type": room_type,
            "breakfast_included": breakfast_included,
            "free_cancellation": free_cancellation
        }
        logger.info(f"Scraped data: {result}")  # Log the result for debugging
        return result

    except Exception as e:
        logger.error(f"Scraping error: {str(e)}")
        save_screenshot(driver, f"error_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
        return {"error": str(e)}
    finally:
        pass

def cleanup_driver():
    global _driver
    with _driver_lock:
        if _driver is not None:
            _driver.quit()
            _driver = None
            logger.info("WebDriver instance closed")

import atexit
atexit.register(cleanup_driver)