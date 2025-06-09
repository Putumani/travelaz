import { useState } from 'react';
import { incrementHotelView } from '../utils/hotelViews';
import LoadingSpinner from './LoadingSpinner'; 

function ComparisonCard({ accommodation, isOpen, onClose }) {
  const [isUpdatingViews, setIsUpdatingViews] = useState(false);
  const [lastClickedDeal, setLastClickedDeal] = useState(null);

  if (!isOpen) return null;

  const handleViewDealClick = async (e, deal) => {
    e.preventDefault();
    e.stopPropagation();
    setLastClickedDeal(deal.site_name);
    setIsUpdatingViews(true);
    
    try {
      await incrementHotelView(accommodation.id);
      console.log(`View counted for ${accommodation.name} via ${deal.site_name}`);
      
      if (window.gtag) {
        window.gtag('event', 'view_deal', {
          hotel_id: accommodation.id,
          deal_site: deal.site_name,
          price: deal.price
        });
      }
    } catch (error) {
      console.error('View count error:', error);
    } finally {
      setIsUpdatingViews(false);
      window.open(deal.affiliate_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-lg md:max-w-xl p-6 mx-4" onClick={e => e.stopPropagation()}>
        <div className="bg-gray-800 text-white rounded-t-lg -m-6 mb-4 p-4 flex justify-between items-center">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4zM6 7H5v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7H6z"/>
              </svg>
              <span className="text-sm">12 May 2025</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4zM6 7H5v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7H6z"/>
              </svg>
              <span className="text-sm">15 May 2025</span>
            </div>
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span className="text-sm">2 Rooms, 4 Guests</span>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {accommodation?.affiliate_deals?.length > 0 ? (
            accommodation.affiliate_deals
              .sort((a, b) => a.price - b.price)
              .map((deal, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-medium">
                      {deal.site_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm truncate">{deal.site_name}</h4>
                      <p className="text-xs text-gray-500 truncate">Standard Room • Free Cancellation</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`text-xs ${deal.price > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {deal.price > 0 ? "Available" : "Sold Out"}
                    </span>
                    <span className="font-bold text-lg whitespace-nowrap">${deal.price}</span>
                    <button
                      onClick={(e) => handleViewDealClick(e, deal)}
                      disabled={isUpdatingViews && lastClickedDeal === deal.site_name}
                      className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800 disabled:opacity-75 flex items-center gap-1"
                    >
                      {isUpdatingViews && lastClickedDeal === deal.site_name ? (
                        <>
                          <LoadingSpinner size="small" />
                          <span>Opening...</span>
                        </>
                      ) : (
                        'View Deal'
                      )}
                    </button>
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">No deals available currently</p>
              <button 
                onClick={onClose}
                className="mt-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                Check Back Later
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ComparisonCard;