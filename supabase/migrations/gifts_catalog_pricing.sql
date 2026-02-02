CREATE TABLE IF NOT EXISTS public.gifts_catalog (
  gift_id text PRIMARY KEY,
  name text NOT NULL,
  gift_type text NOT NULL CHECK (gift_type IN ('universe', 'big', 'small')),
  coin_cost integer NOT NULL CHECK (coin_cost >= 0),
  animation_url text,
  sfx_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.gifts_catalog (gift_id, name, gift_type, coin_cost, animation_url, sfx_url, is_active)
VALUES
  ('universe', 'Universe', 'universe', 50000, '/gifts/Elix Live Universe.webm', NULL, true),
  ('face_ar_crown', 'Face AR Crown', 'big', 15000, NULL, NULL, true),
  ('face_ar_glasses', 'Face AR Glasses', 'big', 16500, NULL, NULL, true),
  ('face_ar_hearts', 'Face AR Hearts', 'big', 18000, NULL, NULL, true),
  ('face_ar_mask', 'Face AR Mask', 'big', 19500, NULL, NULL, true),
  ('face_ar_ears', 'Face AR Ears', 'big', 21000, NULL, NULL, true),
  ('face_ar_stars', 'Face AR Stars', 'big', 22500, NULL, NULL, true),
  ('global_universe', 'Global Universe', 'big', 24000, '/gifts/Elix Global Universe.webm', NULL, true),
  ('1', 'Beast Relic', 'big', 25500, '/gifts/Beast Relic of the Ancients.webm', NULL, true),
  ('2', 'Thunder Rage', 'big', 27000, '/gifts/Elix Thunder God Rage.webm', NULL, true),
  ('3', 'Frostwing', 'big', 28500, '/gifts/Frostwing Ascendant.webm', NULL, true),
  ('4', 'Hunted Castle', 'big', 30000, '/gifts/Hunted Castel.webm', NULL, true),
  ('5', 'Zeus', 'big', 31500, '/gifts/Zeus.webm', NULL, true),
  ('6', 'Ice Bird', 'big', 33000, '/gifts/majestic_ice_blue_mythic_bird_in_flight.webm', NULL, true),
  ('11', 'Blue Racer', 'big', 34500, '/gifts/Blue Flame Racer.mp4', NULL, true),
  ('12', 'Titan Gorilla', 'big', 36000, '/gifts/Earth Titan Gorilla.mp4', NULL, true),
  ('13', 'Golden Lion', 'big', 37500, '/gifts/Elix Royal Golden Lion.mp4', NULL, true),
  ('14', 'Dragon Egg', 'big', 39000, '/gifts/Ember Dragon Egg.mp4', NULL, true),
  ('15', 'Lava Dragon', 'big', 40500, '/gifts/Molten fury of the lava dragon.mp4', NULL, true),
  ('16', 'Fire Unicorn', 'big', 42000, '/gifts/Mythic Fire Unicorn.mp4', NULL, true),
  ('17', 'Lightning Car', 'big', 43500, '/gifts/Lightning Hypercar.mp4', NULL, true),
  ('18', 'Lucky Kitty', 'big', 45000, '/gifts/Elix Lucky Kitty.mp4', NULL, true),
  ('19', 'Emerald Rhino', 'big', 46500, '/gifts/Emerald Colossus Rhino.mp4', NULL, true),
  ('20', 'Sky Guardian', 'big', 48000, '/gifts/Emerald Sky Guardian.mp4', NULL, true),
  ('21', 'Guardian Chest', 'big', 52000, '/gifts/Eternal Guardian Chest (Phoenix + Wolf + Owl).mp4', NULL, true),
  ('22', 'Falcon King', 'big', 54000, '/gifts/Falcon King Delivery.mp4', NULL, true),
  ('23', 'Ice Unicorn', 'big', 56000, '/gifts/Majestic ice unicorn in enchanted snow.mp4', NULL, true),
  ('24', 'Guardian Vault', 'big', 60000, '/gifts/Mythic Guardian Vault.mp4', NULL, true)
ON CONFLICT (gift_id) DO UPDATE SET
  name = EXCLUDED.name,
  gift_type = EXCLUDED.gift_type,
  coin_cost = EXCLUDED.coin_cost,
  animation_url = EXCLUDED.animation_url,
  sfx_url = EXCLUDED.sfx_url,
  is_active = EXCLUDED.is_active;

UPDATE public.gifts_catalog SET coin_cost = 50000 WHERE gift_id = 'universe';
