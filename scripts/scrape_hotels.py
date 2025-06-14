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

SCREENSHOTS_DIR = "screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

def setup_driver():
    """Configure and return Chrome WebDriver with visible browser"""
    options = webdriver.ChromeOptions()
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    
    service = Service()
    driver = webdriver.Chrome(service=service, options=options)
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    return driver

def save_screenshot(driver, filename):
    """Save screenshot for debugging"""
    path = os.path.join(SCREENSHOTS_DIR, filename)
    driver.save_screenshot(path)
    print(f"Screenshot saved: {path}")

def modify_search_url(original_url, checkin_date, checkout_date, occupants=2):
    """Modify the search URL with new dates and occupants"""
    parsed = urlparse(original_url)
    query_params = parse_qs(parsed.query)
    
    query_params['checkin'] = [checkin_date]
    query_params['checkout'] = [checkout_date]
    query_params['group_adults'] = [str(occupants)]
    query_params['group_children'] = ['0']
    
    new_query = urlencode(query_params, doseq=True)
    return urlunparse(parsed._replace(query=new_query))

def extract_price(price_text):
    """Clean and extract price from text"""
    if not price_text:
        return "N/A"
    
    numbers = re.findall(r'[\d,]+', price_text.replace("¥", "").replace(",", ""))
    if numbers:
        return numbers[0]
    return "N/A"

def detect_currency(page_text):
    """Detect currency from page content"""
    if "¥" in page_text:
        return "JPY"
    elif "ZAR" in page_text or "R" in page_text:
        return "ZAR"
    elif "$" in page_text:
        return "USD"
    elif "€" in page_text:
        return "EUR"
    return "UNKNOWN"

def scrape_booking_hotel(base_url, checkin_date, checkout_date, occupants=2):
    """Scrape hotel information from Booking.com search results"""
    driver = setup_driver()
    
    try:
        search_url = modify_search_url(base_url, checkin_date, checkout_date, occupants)
        print(f"Loading search URL: {search_url}")
        driver.get(search_url)
        time.sleep(2)  
        
        page_text = driver.page_source
        
        try:
            cookie_accept = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.ID, "onetrust-accept-btn-handler")))
            cookie_accept.click()
            time.sleep(1)
        except TimeoutException:
            print("No cookie consent popup found")
        
        try:
            WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "div[data-testid='property-card']")))
        except TimeoutException:
            save_screenshot(driver, "search_results_timeout.png")
            return {"error": "Search results failed to load"}
        
        currency = detect_currency(driver.page_source)
        print(f"Detected currency: {currency}")
        
        try:
            hotel_card = WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.XPATH, 
                    "//div[contains(@data-testid, 'property-card')][.//div[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'president hotel')]]")))
            
            driver.execute_script("arguments[0].scrollIntoView({behavior: 'smooth', block: 'center'});", hotel_card)
            driver.execute_script("arguments[0].style.border='3px solid red'", hotel_card)
            time.sleep(1)
            
            try:
                hotel_name = hotel_card.find_element(By.CSS_SELECTOR, "div[data-testid='title']").text.strip()
                print(f"Found hotel card for: {hotel_name}")
            except NoSuchElementException:
                hotel_name = "President Hotel"
                print("Using default hotel name")
            
        except TimeoutException:
            save_screenshot(driver, "hotel_card_not_found.png")
            return {"error": "President Hotel card not found"}
        
        room_type = "Not specified"
        try:
            room_type = hotel_card.find_element(
                By.CSS_SELECTOR, "div[data-testid='recommended-units'] h4[role='link']").text.strip()
        except NoSuchElementException:
            print("Could not find room type")
        
        price = "N/A"
        try:
            price_element = hotel_card.find_element(
                By.CSS_SELECTOR, "span[data-testid='price-and-discounted-price']")
            price = extract_price(price_element.get_attribute("textContent"))
        except NoSuchElementException:
            try:
                price_element = hotel_card.find_element(By.XPATH, ".//*[contains(text(), '¥') or contains(text(), 'ZAR') or contains(text(), '$')]")
                price = extract_price(price_element.text)
            except NoSuchElementException:
                print("Could not find price element")
                save_screenshot(driver, "price_element_missing.png")
        
        breakfast = "No"
        try:
            breakfast_elements = hotel_card.find_elements(By.XPATH, 
                ".//*[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'breakfast')]")
            if breakfast_elements:
                breakfast = "Yes"
        except NoSuchElementException:
            print("Could not determine breakfast inclusion")
        
        cancellation = "Unknown"
        try:
            try:
                cancellation_icon = hotel_card.find_element(
                    By.CSS_SELECTOR, "div[data-testid='cancellation-policy-icon']")
                cancellation = "Free"
            except NoSuchElementException:
                if "free cancellation" in hotel_card.text.lower():
                    cancellation = "Free"
                else:
                    cancellation = "Restricted"
        except Exception:
            print("Could not determine cancellation policy")
        
        taxes = "0"
        try:
            taxes_element = hotel_card.find_element(
                By.CSS_SELECTOR, "div[data-testid='taxes-and-charges']")
            taxes = extract_price(taxes_element.text)
        except NoSuchElementException:
            print("Could not find taxes information")
        
        rating_score = "Not rated"
        rating_text = ""
        review_count = ""
        try:
            rating_element = hotel_card.find_element(
                By.CSS_SELECTOR, "div[data-testid='review-score']")
            rating_score = rating_element.find_element(By.CSS_SELECTOR, "div:nth-child(2)").text.strip()
            rating_text = rating_element.find_element(By.CSS_SELECTOR, "div:nth-child(3) div:first-child").text.strip()
            review_count = rating_element.find_element(By.CSS_SELECTOR, "div:nth-child(3) div:nth-child(2)").text.strip()
        except NoSuchElementException:
            print("Could not find rating information")
        
        address = "Not specified"
        try:
            address_element = hotel_card.find_element(
                By.CSS_SELECTOR, "span[data-testid='address']")
            address = address_element.text.strip()
        except NoSuchElementException:
            print("Could not find address")
        
        stay_info = ""
        try:
            stay_element = hotel_card.find_element(
                By.CSS_SELECTOR, "div[data-testid='price-for-x-nights']")
            stay_info = stay_element.text.strip()
        except NoSuchElementException:
            print("Could not find stay duration information")
        
        location_score = "Not rated"
        try:
            location_element = hotel_card.find_element(
                By.XPATH, ".//*[contains(text(), 'Location')]/following-sibling::span")
            location_score = location_element.text.strip()
        except NoSuchElementException:
            print("Could not find location score")
        
        availability = "Available" if price != "N/A" else "Not available"
        
        result = {
            "hotel_name": hotel_name,
            "checkin_date": checkin_date,
            "checkout_date": checkout_date,
            "occupants": occupants,
            "room_type": room_type,
            "price": price,
            "currency": currency,
            "taxes_and_charges": taxes,
            "total_price": str(int(price) + int(taxes)) if price != "N/A" and taxes != "0" else price,
            "breakfast_included": breakfast,
            "free_cancellation": cancellation,
            "rating": {
                "score": rating_score,
                "description": rating_text,
                "review_count": review_count
            },
            "location_score": location_score,
            "address": address,
            "stay_duration": stay_info,
            "availability": availability,
            "timestamp": datetime.now().isoformat(),
            "source": "Booking.com",
            "search_url": search_url
        }
        
        return result
        
    except Exception as e:
        save_screenshot(driver, "general_error.png")
        return {"error": f"General error: {str(e)}", "timestamp": datetime.now().isoformat()}
    finally:
        print("Browser will remain open for 30 seconds...")
        time.sleep(30)
        driver.quit()

def main():
    search_url_template = "https://www.booking.com/searchresults.en-gb.html?aid=2276376&label=msn-bDVsGoYGna9RvPm%2ALrXBvg-80814255876005%3Atikwd-80814447092161%3Aloc-168%3Aneo%3Amte%3Alp137812%3Adec%3AqsPresident%20Hotel%20Sea%20Point%20booking.com&highlighted_hotels=15195&checkin=2026-03-07&redirected=1&city=-1217214&hlrd=with_av&source=hotel&checkout=2026-03-11&keep_landing=1&sid=b67c3091bd6e58f81df1abeb5086b695"
    
    today = datetime.now().strftime("%Y-%m-%d")
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    
    print(f"\nScraping President Hotel for {today} to {tomorrow}...")
    result = scrape_booking_hotel(search_url_template, today, tomorrow)
    
    print("\nScraping results:")
    print(json.dumps(result, indent=2))
    
    output_file = "booking_comparison_results.json"
    with open(output_file, "w") as f:
        json.dump([result], f, indent=2)
    
    print(f"\nScraping complete! Results saved to {output_file}")

if __name__ == "__main__":
    main()