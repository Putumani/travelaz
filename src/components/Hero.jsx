function Hero() {
  const backgroundUrl = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_1800,h_500,c_fill/pexels-taryn-elliott-4098987_x3jl2e`;

  return (
    <div className="relative bg-cover bg-center h-96" style={{ backgroundImage: `url(${backgroundUrl})` }}><div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h2 className="text-4xl font-extrabold text-white">Explore Top Hotels</h2>
        <p className="mt-4 text-lg text-white">Book the best accommodations in Durban, Cape Town, and Bangkok</p>
      </div>
    </div>
  )
}

export default Hero