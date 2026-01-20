const API_BASE = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://travelaz.onrender.com';

export const scrapeBooking = (data) =>
  fetch(`${API_BASE}/scrape-booking`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

export const scrapeTrip = (data) =>
  fetch(`${API_BASE}/scrape-trip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

export async function translateText(text, targetLang) {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLang })
  });
  const data = await response.json();
  return data.translatedText || text;
}

export async function convertCurrency(amount, fromCurrency, toCurrency) {
  const response = await fetch('/api/convert', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, fromCurrency, toCurrency })
  });
  const data = await response.json();
  return data;
}