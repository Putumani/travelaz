export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, targetLang } = req.body;

  const translations = {
    'en-US': {
      'Home': 'Home',
      'Durban': 'Durban',
      'Cape Town': 'Cape Town',
      'Bangkok': 'Bangkok',
      'Explore Top Hotels': 'Explore Top Hotels',
      'Book the best accommodations': 'Book the best accommodations',
      'Popular Hotels': 'Popular Hotels',
      'Featured Destinations': 'Featured Destinations',
      'Top 10 Accommodations in': 'Top 10 Accommodations in',
      'No accommodations found for': 'No accommodations found for',
      'Loading...': 'Loading...',
      'Error loading accommodations': 'Error loading accommodations',
      'View Deal': 'View Deal',
      'Available': 'Available',
      'Sold Out': 'Sold Out'
    },
    'en-GB': {
      ...translations['en-US'],
      'Book the best accommodations': 'Book the best accommodation'
    },
    'fr': {
      'Home': 'Accueil',
      'Durban': 'Durban',
      'Cape Town': 'Le Cap',
      'Bangkok': 'Bangkok',
      'Explore Top Hotels': 'Découvrez les meilleurs hôtels',
      'Book the best accommodations': 'Réservez les meilleurs hébergements',
      'Popular Hotels': 'Hôtels populaires',
      'Featured Destinations': 'Destinations recommandées',
      'Top 10 Accommodations in': 'Top 10 Hébergements à',
      'No accommodations found for': 'Aucun hébergement trouvé pour',
      'Loading...': 'Chargement...',
      'Error loading accommodations': 'Erreur lors du chargement des hébergements',
      'View Deal': 'Voir l\'offre',
      'Available': 'Disponible',
      'Sold Out': 'Épuisé'
    },
    'es': {
      'Home': 'Inicio',
      'Durban': 'Durban',
      'Cape Town': 'Ciudad del Cabo',
      'Bangkok': 'Bangkok',
      'Explore Top Hotels': 'Explora los mejores hoteles',
      'Book the best accommodations': 'Reserva los mejores alojamientos',
      'Popular Hotels': 'Hoteles populares',
      'Featured Destinations': 'Destacados',
      'Top 10 Accommodations in': 'Top 10 Alojamientos en',
      'No accommodations found for': 'No se encontraron alojamientos para',
      'Loading...': 'Cargando...',
      'Error loading accommodations': 'Error al cargar alojamientos',
      'View Deal': 'Ver oferta',
      'Available': 'Disponible',
      'Sold Out': 'Agotado'
    },
    'de': {
      'Home': 'Startseite',
      'Durban': 'Durban',
      'Cape Town': 'Kapstadt',
      'Bangkok': 'Bangkok',
      'Explore Top Hotels': 'Entdecken Sie die besten Hotels',
      'Book the best accommodations': 'Buchen Sie die besten Unterkünfte',
      'Popular Hotels': 'Beliebte Hotels',
      'Featured Destinations': 'Empfohlene Ziele',
      'Top 10 Accommodations in': 'Top 10 Unterkünfte in',
      'No accommodations found for': 'Keine Unterkünfte gefunden für',
      'Loading...': 'Wird geladen...',
      'Error loading accommodations': 'Fehler beim Laden der Unterkünfte',
      'View Deal': 'Angebot ansehen',
      'Available': 'Verfügbar',
      'Sold Out': 'Ausverkauft'
    },
    'it': {
      'Home': 'Home',
      'Durban': 'Durban',
      'Cape Town': 'Città del Capo',
      'Bangkok': 'Bangkok',
      'Explore Top Hotels': 'Scopri i migliori hotel',
      'Book the best accommodations': 'Prenota i migliori alloggi',
      'Popular Hotels': 'Hotel popolari',
      'Featured Destinations': 'Destinazioni in evidenza',
      'Top 10 Accommodations in': 'Top 10 Alloggi a',
      'No accommodations found for': 'Nessun alloggio trovato per',
      'Loading...': 'Caricamento...',
      'Error loading accommodations': 'Errore nel caricamento degli alloggi',
      'View Deal': 'Visualizza offerta',
      'Available': 'Disponibile',
      'Sold Out': 'Esaurito'
    }
  };

  try {
    const translatedText = translations[targetLang]?.[text] || text;
    res.status(200).json({ translatedText });
  } catch {
    res.status(500).json({ error: 'Translation failed' });
  }
}