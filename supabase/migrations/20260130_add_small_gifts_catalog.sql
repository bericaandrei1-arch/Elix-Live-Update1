INSERT INTO public.gifts_catalog (gift_id, name, gift_type, coin_cost, animation_url, sfx_url, is_active)
VALUES
  ('s_rose', 'Rose', 'small', 1, '/gifts/small/rose.svg', NULL, true),
  ('s_heart', 'Heart', 'small', 10, '/gifts/small/heart.svg', NULL, true),
  ('s_sparkle', 'Sparkle', 'small', 25, '/gifts/small/sparkle.svg', NULL, true),
  ('s_star', 'Star', 'small', 50, '/gifts/small/star.svg', NULL, true),
  ('s_diamond', 'Diamond', 'small', 100, '/gifts/small/diamond.svg', NULL, true),
  ('s_fire', 'Fire', 'small', 250, '/gifts/small/fire.svg', NULL, true),
  ('s_crown', 'Crown', 'small', 500, '/gifts/small/crown.svg', NULL, true),
  ('s_rocket', 'Rocket', 'small', 1000, '/gifts/small/rocket.svg', NULL, true)
ON CONFLICT (gift_id) DO UPDATE SET
  name = EXCLUDED.name,
  gift_type = EXCLUDED.gift_type,
  coin_cost = EXCLUDED.coin_cost,
  animation_url = EXCLUDED.animation_url,
  sfx_url = EXCLUDED.sfx_url,
  is_active = EXCLUDED.is_active;

