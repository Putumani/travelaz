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
    """Modify the specific hotel URL with new dates and occupancy"""
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
    driver = setup_driver()
    try:
        search_url = modify_hotel_url(hotel_url, checkin_date, checkout_date, adults, children, rooms)
        logger.info(f"Loading hotel URL: {search_url}")
        
        max_retries = 3
        for attempt in range(max_retries):
            try:
                driver.get(search_url)
                WebDriverWait(driver, 20).until(
                    lambda d: d.find_elements(By.CSS_SELECTOR, "[data-testid='property-header'], [data-testid='property-card']")
                )
                break
            except Exception as e:
                if attempt == max_retries - 1:
                    raise
                logger.warning(f"Attempt {attempt + 1} failed, retrying...")
                time.sleep(2)
        
        is_hotel_page = len(driver.find_elements(By.CSS_SELECTOR, "[data-testid='property-header']")) > 0
        
        if not is_hotel_page:
            try:
                hotel_card = driver.find_element(By.CSS_SELECTOR, "[data-testid='property-card']")
                view_deal_btn = hotel_card.find_element(By.CSS_SELECTOR, "[data-testid='availability-cta']")
                view_deal_btn.click()
                WebDriverWait(driver, 20).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='property-header']"))
                )
            except Exception as e:
                logger.error("Could not navigate to hotel page from search results")
                return {"error": "Could not navigate to hotel page"}

        try:
            hotel_name_element = WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[data-testid='property-header'] h2"))
            )
            hotel_name = hotel_name_element.text
        except TimeoutException:
            logger.error("Hotel name element not found")
            return {"error": "Hotel page elements not found"}

        try:
            room_containers = WebDriverWait(driver, 20).until(
                EC.presence_of_all_elements_located((By.CSS_SELECTOR, "[data-testid='property-room-card']"))
            )
            if not room_containers:
                logger.warning("No room containers found")
                return {"error": "No available rooms found"}
            
            room = room_containers[0]
            
            try:
                room_type_element = room.find_element(By.CSS_SELECTOR, "[data-testid='room-type-name']")
                room_type = room_type_element.text
            except NoSuchElementException:
                room_type = "Standard Room"

            try:
                price_element = room.find_element(By.CSS_SELECTOR, "[data-testid='price-and-discounted-price']")
                price = extract_price(price_element.text)
            except NoSuchElementException:
                price = None

            try:
                taxes_element = room.find_element(By.CSS_SELECTOR, "[data-testid='taxes-and-charges']")
                taxes = extract_price(taxes_element.text.replace("+", "").replace(" taxes and charges", ""))
            except NoSuchElementException:
                taxes = 0

            try:
                amenities = room.find_elements(By.CSS_SELECTOR, ".c-occupancy-icons + div")
                breakfast_included = any("Breakfast" in elem.text for elem in amenities)
                free_cancellation = any("FREE cancellation" in elem.text for elem in amenities)
            except NoSuchElementException:
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
                "free_cancellation": free_cancellation,
                "source_url": search_url
            }
            logger.info(f"Scraped data: {result}")
            return result

        except Exception as e:
            logger.error(f"Error scraping room details: {str(e)}")
            return {"error": f"Error scraping room details: {str(e)}"}

    except Exception as e:
        logger.error(f"Scraping error: {str(e)}")
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