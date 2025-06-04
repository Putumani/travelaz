function ComparisonCard({ accommodation, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md sm:max-w-lg md:max-w-xl p-6 mx-4" onClick={e => e.stopPropagation()}>
        <div className="bg-gray-800 text-white rounded-t-lg -m-6 mb-4 p-4 flex justify-between items-center">
          <div className="flex space-x-6">
            <div className="flex items-center">
              <svg className="w-7 h-7 mr-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4zM6 7H5v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7H6zm6 10h-2v-6h2v6zm4-6h-2v6h2v-6z"/>
              </svg>
              <span>Check-in: 12 May 2025</span>
            </div>
            <div className="flex items-center">
              <svg className="w-7 h-7 mr-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4zM6 7H5v12c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V7H6zm6 10h-2v-6h2v6zm4-6h-2v6h2v-6z"/>
              </svg>
              <span>Check-out: 15 May 2025</span>
            </div>
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
              <span>2 Rooms, 4 Guests</span>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-300 focus:outline-none">
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
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      {deal.site_name === "Booking.com" ? "B" : deal.site_name === "Expedia" ? "E" : "H"}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{deal.site_name}</h4>
                      <p className="text-xs text-gray-500">Standard Room, Free Cancellation</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`text-xs ${deal.price > 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {deal.price > 0 ? "Available" : "Sold Out"}
                    </span>
                    <span className="font-bold text-lg">${deal.price}/night</span>
                    <a
                      href={deal.affiliate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
                    >
                      View Deals
                    </a>
                  </div>
                </div>
              ))
          ) : (
            <p className="text-center text-gray-500">No deals available.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ComparisonCard;