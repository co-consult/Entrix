--
-- PostgreSQL database dump
--

-- Dumped from database version 17.3 (Debian 17.3-3.pgdg120+1)
-- Dumped by pg_dump version 17.2

-- Started on 2025-07-29 12:56:33

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 3823 (class 0 OID 380920)
-- Dependencies: 228
-- Data for Name: event_categories; Type: TABLE DATA; Schema: public; Owner: admin
--

INSERT INTO public.event_categories VALUES ('ca7d75b1-10e0-429f-a9ec-58ee8f0e9b1c', 'foot-match', 'Match de foot', NULL, NULL, 90, NULL, true, true, true, true, NULL, NULL, NULL, NULL, 'TND', NULL, NULL, true, '2025-07-28 16:42:00.135433+00', '2025-07-28 16:42:00.135433+00');

--
-- TOC entry 3824 (class 0 OID 381040)
-- Dependencies: 237
-- Data for Name: venue_mappings; Type: TABLE DATA; Schema: public; Owner: admin
--

INSERT INTO public.venue_mappings VALUES ('9f33b2cb-4742-4527-aa38-5f49a969f85d', 'bc43d5e2-9a2f-46df-9021-4f6b6e74b79a', 'Cartographie Sport Taieb Mhiri', 'CARTO-TAIEB-MHIRI-SPORT', 'Cartographie Taieb mhiri', 'DEFAULT', '{}', 10000, NULL, NULL, true, 'null', '2025-07-28 17:20:14.135+00', '2025-07-28 17:20:14.135+00');


--
-- TOC entry 3825 (class 0 OID 381051)
-- Dependencies: 238
-- Data for Name: venue_zones; Type: TABLE DATA; Schema: public; Owner: admin
--

INSERT INTO public.venue_zones VALUES ('217c8f6c-546a-4b8f-9d27-bfa1d73ea2e8', '9f33b2cb-4742-4527-aa38-5f49a969f85d', NULL, 'Loges', 'L0', 'SEATING_AREA', 'VIP', 0, 200, 30000.00, 'TND', NULL, 'Luxury box seating with exclusive access', '{vip,comfortable,exclusive}', false, false, NULL, '2025-07-28 19:41:48.462953+00', '2025-07-28 19:41:48.462953+00', true);
INSERT INTO public.venue_zones VALUES ('f8e9e5c5-60d2-4b9a-a1f3-f64a3f7e39f0', '9f33b2cb-4742-4527-aa38-5f49a969f85d', NULL, 'Honneur', 'H0', 'SEATING_AREA', 'VIP', 0, 54, 1700.00, 'TND', NULL, 'VIP honor section with premium amenities', '{vip,comfortable,exclusive}', false, false, NULL, '2025-07-28 19:41:48.462953+00', '2025-07-28 19:41:48.462953+00', true);
INSERT INTO public.venue_zones VALUES ('94c28663-7163-4b29-8698-128120d084da', '9f33b2cb-4742-4527-aa38-5f49a969f85d', NULL, 'Centrale', 'C0', 'SEATING_AREA', 'VIP', 0, 519, 1200.00, 'TND', NULL, 'Central seating area with excellent view', '{vip,comfortable,exclusive}', false, false, NULL, '2025-07-28 19:41:48.462953+00', '2025-07-28 19:41:48.462953+00', true);
INSERT INTO public.venue_zones VALUES ('0176d271-8a3b-4bc9-88ef-ef986f65796c', '9f33b2cb-4742-4527-aa38-5f49a969f85d', NULL, 'Chaise 1', 'C1', 'SEATING_AREA', 'PREMIUM', 0, 762, 450.00, 'TND', NULL, 'Premium chair seating section 1', '{premium,comfortable}', false, false, NULL, '2025-07-28 19:41:48.462953+00', '2025-07-28 19:41:48.462953+00', true);
INSERT INTO public.venue_zones VALUES ('6b314cff-2d80-426d-8e86-7c08d578f304', '9f33b2cb-4742-4527-aa38-5f49a969f85d', NULL, 'Chaise 2', 'C2', 'SEATING_AREA', 'PREMIUM', 0, 753, 450.00, 'TND', NULL, 'Premium chair seating section 2', '{premium,comfortable}', false, false, NULL, '2025-07-28 19:41:48.462953+00', '2025-07-28 19:41:48.462953+00', true);
INSERT INTO public.venue_zones VALUES ('7beba44b-e358-4420-90c0-ae747c1ac070', '9f33b2cb-4742-4527-aa38-5f49a969f85d', NULL, 'Accès Voiture', 'V0', 'SEATING_AREA', 'PREMIUM', 0, 80, 1000.00, 'TND', NULL, 'Vehicle access area', '{service,accessible}', false, false, NULL, '2025-07-28 19:41:48.462953+00', '2025-07-28 19:41:48.462953+00', true);
INSERT INTO public.venue_zones VALUES ('8560b507-319f-43ad-97a0-7d86652047d7', '9f33b2cb-4742-4527-aa38-5f49a969f85d', NULL, 'Gradins 6', 'G6', 'SEATING_AREA', 'STANDARD', 0, 1008, 130.00, 'TND', NULL, 'Standard grandstand seating section 6', '{standard,comfortable}', false, false, NULL, '2025-07-28 19:41:48.462953+00', '2025-07-28 19:41:48.462953+00', true);
INSERT INTO public.venue_zones VALUES ('a1503226-3fa1-416c-bd9c-1a40278c9fde', '9f33b2cb-4742-4527-aa38-5f49a969f85d', NULL, 'Gradins 4', 'G4', 'SEATING_AREA', 'STANDARD', 0, 1361, 130.00, 'TND', NULL, 'Standard grandstand seating section 4', '{standard,comfortable}', false, false, NULL, '2025-07-28 19:41:48.462953+00', '2025-07-28 19:41:48.462953+00', true);
INSERT INTO public.venue_zones VALUES ('e81401b8-0411-4ca8-b822-a93f3f8625e2', '9f33b2cb-4742-4527-aa38-5f49a969f85d', NULL, 'Gradins 3', 'G3', 'SEATING_AREA', 'STANDARD', 0, 1439, 130.00, 'TND', NULL, 'Standard grandstand seating section 3', '{standard,comfortable}', false, false, NULL, '2025-07-28 19:41:48.462953+00', '2025-07-28 19:41:48.462953+00', true);
INSERT INTO public.venue_zones VALUES ('f56d2618-b93c-42a5-8e58-476e2cb25a3a', '9f33b2cb-4742-4527-aa38-5f49a969f85d', NULL, 'Gradins 5', 'G5', 'SEATING_AREA', 'STANDARD', 0, 867, 130.00, 'TND', NULL, 'Standard grandstand seating section 5', '{standard,comfortable}', false, false, NULL, '2025-07-28 19:41:48.462953+00', '2025-07-28 19:41:48.462953+00', true);
INSERT INTO public.venue_zones VALUES ('fad94eae-a7ae-4f85-8f4a-6aa9b0392684', '9f33b2cb-4742-4527-aa38-5f49a969f85d', NULL, 'Gradins 8', 'G8', 'SEATING_AREA', 'STANDARD', 0, 1037, 130.00, 'TND', NULL, 'Standard grandstand seating section 8', '{standard,comfortable}', false, false, NULL, '2025-07-28 19:41:48.462953+00', '2025-07-28 19:41:48.462953+00', true);



--
-- TOC entry 3826 (class 0 OID 381119)
-- Dependencies: 243
-- Data for Name: subscription_plans; Type: TABLE DATA; Schema: public; Owner: admin
--

INSERT INTO public.subscription_plans VALUES ('02e9a433-05d4-4fcf-8598-1baab3778b6e', 'CHAISE1', 'Chaise 1', 'Chaise 1', 'SEASON', 250.00, 'TND', 762, 0, 'e219c1e4-2f2e-4719-b2f9-c6ce4d2d8d2e', '1970-01-01', '1970-01-01', NULL, NULL, false, 0, false, false, false, 'null', 'null', 'null', true, '2025-07-28 17:03:30.589+00', '2025-07-28 17:03:30.589+00');
INSERT INTO public.subscription_plans VALUES ('027270e7-7b5f-4ad8-8a31-98a794304d39', 'CHAISE2', 'Chaise 2', 'Chaise 2', 'SEASON', 250.00, 'TND', 753, 0, 'e219c1e4-2f2e-4719-b2f9-c6ce4d2d8d2e', '1970-01-01', '1970-01-01', NULL, NULL, false, 0, false, false, false, 'null', 'null', 'null', true, '2025-07-28 17:04:16.369+00', '2025-07-28 17:05:05.397632+00');
INSERT INTO public.subscription_plans VALUES ('8b8b7b6b-8850-4c40-8c94-62001a76c1de', 'CENTRALE', 'Centrale', 'Centrale', 'SEASON', 350.00, 'TND', 519, 0, 'e219c1e4-2f2e-4719-b2f9-c6ce4d2d8d2e', '1970-01-01', '1970-01-01', NULL, NULL, false, 0, false, false, false, 'null', 'null', 'null', true, '2025-07-28 17:05:05.398+00', '2025-07-28 17:05:17.230062+00');
INSERT INTO public.subscription_plans VALUES ('2447ee5d-1bf8-4fa1-8193-b841e291d29c', 'HONNEUR', 'Honneur', 'Honneur', 'SEASON', 4500.00, 'TND', 54, 0, 'e219c1e4-2f2e-4719-b2f9-c6ce4d2d8d2e', '1970-01-01', '1970-01-01', NULL, NULL, false, 0, false, false, false, 'null', 'null', 'null', true, '2025-07-28 17:05:51.822+00', '2025-07-28 17:05:51.822+00');
INSERT INTO public.subscription_plans VALUES ('0d51af28-b6dd-4891-b02e-dfec202e2841', 'LOGE', 'Loge', 'Loge', 'SEASON', 1200.00, 'TND', 200, 0, 'e219c1e4-2f2e-4719-b2f9-c6ce4d2d8d2e', '1970-01-01', '1970-01-01', NULL, NULL, false, 0, false, false, false, 'null', 'null', 'null', true, '2025-07-28 17:06:20.466+00', '2025-07-28 17:06:20.466+00');
INSERT INTO public.subscription_plans VALUES ('8d1c5ee7-ab0b-4644-8c39-9a5e74a7b43d', 'GRADIN-P2', 'Gradins Porte 2', 'Gradins accès par la porte 2', 'SEASON', 150.00, 'TND', 1439, 0, 'e219c1e4-2f2e-4719-b2f9-c6ce4d2d8d2e', '1970-01-01', '1970-01-01', NULL, NULL, false, 0, false, false, false, 'null', 'null', 'null', true, '2025-07-28 17:08:30.629+00', '2025-07-28 17:08:30.629+00');
INSERT INTO public.subscription_plans VALUES ('d4863d89-12ba-49db-bada-de26965364df', 'GRADIN-P3', 'Gradins Porte 3', 'Gradins accès par la porte 3', 'SEASON', 150.00, 'TND', 2228, 0, 'e219c1e4-2f2e-4719-b2f9-c6ce4d2d8d2e', '1970-01-01', '1970-01-01', NULL, NULL, false, 0, false, false, false, 'null', 'null', 'null', true, '2025-07-28 17:08:30.629+00', '2025-07-28 17:08:30.629+00');
INSERT INTO public.subscription_plans VALUES ('9beb9095-b558-48f0-b1b1-a51a64c2cf24', 'GRADIN-P4', 'Gradin Porte 4', 'Gradins accès par la porte 4', 'SEASON', 150.00, 'TND', 2045, 0, 'e219c1e4-2f2e-4719-b2f9-c6ce4d2d8d2e', '1970-01-01', '1970-01-01', NULL, NULL, false, 0, false, false, false, 'null', 'null', 'null', true, '2025-07-28 17:08:30.629+00', '2025-07-28 17:08:30.629+00');
INSERT INTO public.subscription_plans VALUES ('8021b954-c011-4f30-bd72-ce654d30826d', 'VOITURE', 'Voiture', 'Accès voiture / parking', 'SEASON', 6500.00, 'TND', 80, 0, 'e219c1e4-2f2e-4719-b2f9-c6ce4d2d8d2e', '1970-01-01', '1970-01-01', NULL, NULL, false, 0, false, false, false, 'null', 'null', 'null', true, '2025-07-28 17:09:07.316+00', '2025-07-28 17:09:07.316+00');




-- Completed on 2025-07-29 12:56:33

--
-- PostgreSQL database dump complete
--

