function Footer() {
  return (
    <footer className="bg-black text-white py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm sm:text-base">© {new Date().getFullYear()} travelaz. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;