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