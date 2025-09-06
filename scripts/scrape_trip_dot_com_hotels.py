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

import tempfile
import uuid

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
            options.add_argument('--window-size=1280,1024')  # Smaller window size
            options.add_argument('--disable-setuid-sandbox')
            options.add_argument('--ignore-certificate-errors')
            
            # Reduce memory usage
            options.add_argument('--disable-extensions')
            options.add_argument('--disable-software-rasterizer')
            options.add_argument('--disable-background-timer-throttling')
            options.add_argument('--disable-backgrounding-occluded-windows')
            options.add_argument('--disable-renderer-backgrounding')
            options.add_argument('--disable-features=VizDisplayCompositor')
            
            # Use a unique user data directory to avoid conflicts
            # Create a truly unique directory using UUID
            user_data_dir = f"/tmp/chrome-data-{uuid.uuid4().hex}"
            options.add_argument(f'--user-data-dir={user_data_dir}')
            
            # Security and automation detection avoidance
            options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36')
            options.add_argument('--disable-blink-features=AutomationControlled')
            options.add_experimental_option("excludeSwitches", ["enable-automation"])
            options.add_experimental_option('useAutomationExtension', False)
            
            # Set memory limits
            options.add_argument('--memory-pressure-off')
            options.add_argument('--disable-dev-shm-usage')
            
            try:
                # Use webdriver-manager to handle ChromeDriver
                from webdriver_manager.chrome import ChromeDriverManager
                from selenium.webdriver.chrome.service import Service as ChromeService
                
                service = ChromeService(ChromeDriverManager().install())
                _driver = webdriver.Chrome(service=service, options=options)
                
                # Store the user data directory for cleanup
                _driver.user_data_dir = user_data_dir
                
                _driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
                    'source': '''
                        Object.defineProperty(navigator, 'webdriver', {
                            get: () => undefined
                        })
                    '''
                })
                
                logger.info(f"Initialized new WebDriver instance with user data dir: {user_data_dir}")
            except Exception as e:
                logger.error(f"Failed to initialize WebDriver: {str(e)}")
                # Clean up temp directory
                import shutil
                try:
                    if os.path.exists(user_data_dir):
                        shutil.rmtree(user_data_dir)
                except:
                    pass
                raise
        return _driver
    
_browser_pool = []
_max_pool_size = 1 
_pool_lock = Lock()

def get_driver_from_pool():
    global _browser_pool
    with _pool_lock:
        if _browser_pool:
            logger.info("Reusing browser instance from pool")
            return _browser_pool.pop()
        else:
            logger.info("Creating new browser instance (pool empty)")
            return setup_driver_singleton()

def return_driver_to_pool(driver):
    global _browser_pool, _max_pool_size
    with _pool_lock:
        if len(_browser_pool) < _max_pool_size:
            try:
                # Clean up tabs but keep browser instance
                driver.execute_script("window.open('about:blank', '_self');")
                driver.close()
                driver.switch_to.window(driver.window_handles[0])
                _browser_pool.append(driver)
                logger.info(f"Returned browser to pool. Pool size: {len(_browser_pool)}")
            except Exception as e:
                logger.error(f"Error cleaning browser for pool: {str(e)}")
                try:
                    driver.quit()
                except:
                    pass
        else:
            # Pool is full, quit the driver
            try:
                driver.quit()
                logger.info("Quit browser instance (pool full)")
            except:
                pass

def cleanup_pool():
    global _browser_pool
    with _pool_lock:
        for driver in _browser_pool:
            try:
                driver.quit()
            except:
                pass
        _browser_pool = []
        logger.info("Cleaned up browser pool")

def setup_driver_singleton():
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
    options.add_argument('--disable-background-timer-throttling')
    options.add_argument('--disable-backgrounding-occluded-windows')
    options.add_argument('--disable-renderer-backgrounding')
    
    # Use a single user data directory but with no persistence
    options.add_argument('--user-data-dir=/tmp/chrome-singleton')
    options.add_argument('--incognito')  # Use incognito mode to avoid conflicts
    
    # Security and automation detection avoidance
    options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36')
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    
    try:
        # Use webdriver-manager to handle ChromeDriver
        from webdriver_manager.chrome import ChromeDriverManager
        from selenium.webdriver.chrome.service import Service as ChromeService
        
        service = ChromeService(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
        
        driver.execute_cdp_cmd('Page.addScriptToEvaluateOnNewDocument', {
            'source': '''
                Object.defineProperty(navigator, 'webdriver', {
                    get: () => undefined
                })
            '''
        })
        
        logger.info("Initialized singleton WebDriver instance")
        return driver
    except Exception as e:
        logger.error(f"Failed to initialize WebDriver: {str(e)}")
        raise

def cleanup_driver_singleton():
    global _driver
    with _driver_lock:
        if _driver is not None:
            try:
                # Just close all tabs but keep the browser open
                _driver.execute_script("window.open('about:blank', '_self');")
                _driver.close()  # Close current tab
                # Switch to the first tab (about:blank)
                _driver.switch_to.window(_driver.window_handles[0])
                logger.info("Cleaned up tabs, keeping browser instance alive")
            except Exception as e:
                logger.error(f"Error during driver cleanup: {str(e)}")
                try:
                    _driver.quit()
                    _driver = None
                except:
                    pass

def modify_hotel_url(original_url, checkin_date, checkout_date, adults=2, children=0, rooms=1):
    parsed = urlparse(original_url)
    query_params = parse_qs(parsed.query)

    query_params['checkIn'] = [checkin_date]
    query_params['checkOut'] = [checkout_date]
    query_params['adult'] = [str(adults)]
    query_params['children'] = [str(children)]
    query_params['crn'] = [str(rooms)]

    for param in ['subStamp', 'subChannel', 'travelpurpose', 'curr', 'locale']:
        if param in query_params:
            del query_params[param]

    query_params['curr'] = ['USD']
    query_params['locale'] = ['en-XX']

    new_query = urlencode(query_params, doseq=True)
    logger.info(f"Modified hotel URL: {new_query}")
    return urlunparse(parsed._replace(query=new_query))

def extract_price(price_text):
    if not price_text:
        return None
    numbers = re.findall(r'[\d,]+(?:\.\d+)?', price_text.replace(",", ""))
    return float(numbers[0]) if numbers else None

def detect_currency(page_text):
    if "US$" in page_text:
        return "USD"
    elif "ZAR" in page_text or "R" in page_text:
        return "ZAR"
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
                "dates": f"{checkin_dt.strftime('%b %d')} - {new_checkout.strftime('%b %d')}",
                "price": None,
                "currency": "USD"
            })
        return alternatives
    except ValueError:
        return []

def parse_alternative_dates(hotel_card):
    try:
        soldout_section = hotel_card.find_element(By.CSS_SELECTOR, "div.soldout-recommend")
        items = soldout_section.find_elements(By.CSS_SELECTOR, "div.recommend-item")
        alternatives = []
        for item in items:
            date_text = item.find_element(By.CSS_SELECTOR, "div.date span").text
            price_text = item.find_element(By.CSS_SELECTOR, "p.price").text
            price = extract_price(price_text)
            if '-' in date_text:
                checkin_str, checkout_str = date_text.split(' - ')
                checkin_dt = datetime.strptime(checkin_str, '%b %d').replace(year=datetime.now().year)
                checkout_dt = datetime.strptime(checkout_str, '%b %d').replace(year=datetime.now().year)
                if checkout_dt < checkin_dt:
                    checkout_dt = checkout_dt.replace(year=checkout_dt.year + 1)
                nights = (checkout_dt - checkin_dt).days
                alternatives.append({
                    "checkin_date": checkin_dt.strftime('%Y-%m-%d'),
                    "checkout_date": checkout_dt.strftime('%Y-%m-%d'),
                    "nights": nights,
                    "dates": date_text,
                    "price": price,
                    "currency": "USD"
                })
        return alternatives
    except NoSuchElementException:
        return []

def scrape_trip_hotel(hotel_url, checkin_date, checkout_date, adults=2, children=0, rooms=1):
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
                    EC.presence_of_element_located((By.CSS_SELECTOR, "section.main-container.main-content ul.long-list.long-list-v8 li[id]"))
                )
                break
            except Exception as e:
                if attempt == max_retries - 1:
                    raise
                logger.warning(f"Attempt {attempt + 1} failed, retrying...")
                time.sleep(random.uniform(2, 4))

        with open('trip_page_content.html', 'w', encoding='utf-8') as f:
            f.write(driver.page_source)

        try:
            error_message = driver.find_element(By.CSS_SELECTOR, "div.error-tips").text
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
            if "minimum stay" in error_message.lower():
                result["alternative_dates"] = generate_alternative_dates(checkin_date, checkout_date)
            return result
        except NoSuchElementException:
            logger.info("No error message found, proceeding with hotel card scraping")

        hotel_card = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "section.main-container.main-content ul.long-list.long-list-v8 li[id]"))
        )

        hotel_name = hotel_card.find_element(By.CSS_SELECTOR, "div.list-card-title a.name").text
        rating = hotel_card.find_element(By.CSS_SELECTOR, "div.score .real").text
        reviews = hotel_card.find_element(By.CSS_SELECTOR, "div.count a").text
        location = hotel_card.find_element(By.CSS_SELECTOR, "span[data-testid='address']").text if hotel_card.find_elements(By.CSS_SELECTOR, "span[data-testid='address']") else "Unknown"
        distance = hotel_card.find_element(By.CSS_SELECTOR, "p.transport span:nth-child(2)").text
        availability_url = hotel_card.find_element(By.CSS_SELECTOR, "a[href*='/hotels/detail']").get_attribute("href")
        currency = detect_currency(hotel_card.text)

        try:
            soldout_section = hotel_card.find_element(By.CSS_SELECTOR, "div.soldout-recommend")
            logger.info("Hotel is sold out, extracting alternative dates")
            result = {
                "hotel_name": hotel_name,
                "rating": rating,
                "reviews": reviews,
                "location": location,
                "distance_from_center": distance,
                "price": None,
                "taxes": None,
                "currency": currency,
                "availability": "Not available",
                "checkin_date": checkin_date,
                "checkout_date": checkout_date,
                "room_type": "Standard Room",
                "source_url": availability_url,
                "alternative_dates": parse_alternative_dates(hotel_card)
            }
            return result
        except NoSuchElementException:
            logger.info("Hotel not sold out, proceeding with price and room type extraction")

        try:
            price_element = hotel_card.find_element(By.CSS_SELECTOR, "div.real.labelColor")
            price_text = price_element.text.replace("US$", "").strip()
            price = extract_price(price_text)
            taxes_info = hotel_card.find_element(By.CSS_SELECTOR, "p.price-explain").text
            taxes_match = re.search(r'Total \(incl\. taxes & fees\): US\$(\d+\.?\d*)', taxes_info)
            taxes = float(taxes_match.group(1)) - price if taxes_match else 0
            availability = "Available" if price else "Not available"
        except NoSuchElementException:
            logger.warning("Price element not found, assuming not available")
            price = None
            taxes = None
            availability = "Not available"

        try:
            room_type = hotel_card.find_element(By.CSS_SELECTOR, "span.room-panel-roominfo-name").text
        except NoSuchElementException:
            logger.warning("Room type element not found, using default")
            room_type = "Standard Room"

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
        with open('trip_error_page_content.html', 'w', encoding='utf-8') as f:
            f.write(driver.page_source)
        return {"error": str(e), "fallback_data": {
            "price": None,
            "taxes": 0,
            "currency": "USD",
            "availability": "Not available",
            "room_type": "Standard Room",
            "source": "Trip.com"
        }, "alternative_dates": []}
    
    finally:
        if not use_external_driver: # type: ignore
            cleanup_driver()

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