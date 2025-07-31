CREATE TABLE accommodations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  city VARCHAR(50),
  price FLOAT,
  rating FLOAT,
  image_url TEXT,
  booking_dot_com_affiliate_url TEXT,
  trip_dot_com_affiliate_url TEXT,
  expedia_affiliate_url TEXT,
  hotels_dot_com_affiliate_url TEXT,
  priceline_affiliate_url TEXT,
  view_count INTEGER DEFAULT 0
);

CREATE TABLE accommodation_deals (
  id SERIAL PRIMARY KEY,
  hotel_id INTEGER REFERENCES accommodations(id),
  source VARCHAR(50),
  price FLOAT,
  currency VARCHAR(10),
  availability VARCHAR(20),
  check_in DATE,
  check_out DATE,
  room_type VARCHAR(100),
  source_url TEXT
);

CREATE POLICY "Allow public read" ON accommodations FOR SELECT USING (true);
CREATE POLICY "Allow public read" ON accommodation_deals FOR SELECT USING (true);