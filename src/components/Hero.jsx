function Hero() {
  return (
    <div className="relative bg-cover bg-center h-96" style={{ backgroundImage: 'url(https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_1200/sample-travel-bg.jpg)' }}>
      <div className="absolute inset-0 bg-black opacity-50"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h2 className="text-4xl font-extrabold text-white">Explore Top Hotels</h2>
        <p className="mt-4 text-lg text-white">Book the best accommodations in Durban, Cape Town, and Bangkok</p>
      </div>
    </div>
  )
}

export default Hero