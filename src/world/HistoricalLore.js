/**
 * 📖 Dreamstate Highway — Comprehensive Heritage Lore & Historical Archive
 * 
 * Authentic historical, architectural, geological, and cultural narratives
 * for all scenic overlooks, landmarks, and roadside attractions across all 9 zones.
 */

import { LANDMARK_PHOTOS, getLandmarkPhotos } from './LandmarkPhotos.js';

export const HISTORICAL_LORE_DATABASE = {
  // ── Zone 0: Mojave Desert (0 - 2600m) ──────────────────────────────
  turnout_bottle_tree: {
    id: 'turnout_bottle_tree',
    zone: 0,
    zoneName: 'Southern California Desert',
    milepost: 'MP 3.5',
    name: "Elmer's Bottle Tree Ranch",
    sub: 'Folk Art & Welded Bottle Tree Forest',
    yearEst: 'EST. 2000',
    elevation: '2,875 FT ELEVATION',
    coords: '34.6908° N, 117.3347° W',
    category: 'FOLK ART & HIGHWAY ROADSIDE ATTRACTION',
    era: 'Route 66 Heritage Era',
    historyText: `Created by eclectic desert artist Elmer Long over two decades, the Bottle Tree Ranch stands as one of the most beloved folk art installations along historic Route 66 in the Mojave Desert. Long began collecting antique colorful glass bottles during childhood camping trips with his father, eventually welding hundreds of scrap steel pipes into towering geometric trees that hold tens of thousands of bottles in amber, cobalt blue, emerald green, and ruby red.

When high desert gusts sweep through the forest, the bottles create an ethereal wind chime harmony alongside vintage tractor parts, railway lanterns, and repurposed road signs. Long welcomed travelers from around the globe without charging admission, embodying the generous, free-spirited soul of the Mother Road.`,
    fastFact: 'Elmer welded a functional antique wind vane to the crest of nearly every bottle tree, so the entire metal grove gently sways and clicks in unison with desert wind gusts.',
    sceneryHighlight: 'Vintage glass bottles caught in the golden desert sunlight cast vibrant prismatic shadows across the sandy ground.'
  },

  turnout_wigwam_motel: {
    id: 'turnout_wigwam_motel',
    zone: 0,
    zoneName: 'Southern California Desert',
    milepost: 'MP 4.2',
    name: 'Wigwam Village Motel No. 7',
    sub: 'Route 66 Historic Teepee Courtyard',
    yearEst: 'EST. 1949',
    elevation: '1,076 FT ELEVATION',
    coords: '34.1064° N, 117.3621° W',
    category: 'NATIONAL REGISTER OF HISTORIC PLACES',
    era: 'Mid-Century Roadside Architecture',
    historyText: `Built in 1949 by Frank Redford along the Route 66 corridor between San Bernardino and Rialto, Wigwam Village No. 7 is one of only three surviving Wigwam Villages in the United States. Constructing individual guest rooms as 30-foot-tall concrete-and-stucco teepees was a masterpiece of mid-century novelty architecture designed to catch the eye of post-war road trippers speeding across the desert.

Each cone-shaped cottage is arranged in an open crescent around a central palm grove and swimming pool, with classic vintage automobiles permanently parked in front of each room to preserve the 1950s golden age atmosphere. It was officially added to the National Register of Historic Places in 2012.`,
    fastFact: 'The motel inspired the famous "Cozy Cone Motel" in Pixar\'s Cars, right down to the neon entrance marquee and individual cone layout.',
    sceneryHighlight: 'Bright neon red trim illuminates the stucco cones against the deep indigo twilight of the Mojave sky.'
  },

  turnout_route66_diner: {
    id: 'turnout_route66_diner',
    zone: 0,
    zoneName: 'Southern California Desert',
    milepost: 'MP 7.5',
    name: 'Route 66 Neon Diner & Vintage Gas',
    sub: 'Streamline Moderne Roadside Cafe',
    yearEst: 'EST. 1953',
    elevation: '2,100 FT ELEVATION',
    coords: '34.8986° N, 116.9872° W',
    category: 'VINTAGE AMERICANA & HIGHWAY CAFE',
    era: 'Post-War Boom & Neon Age',
    historyText: `During the 1950s golden era of American cross-country automobile travel, sleek Streamline Moderne diners sprang up at lonely desert intersections across California and Arizona. Featuring polished ribbed aluminum siding, wraparound curved glass windows, and soaring neon pylons, these 24-hour oases provided air-conditioned respite, cold milkshakes, and fresh fuel to motorists braving the scorching desert crossings.

The classic diner stood as a symbol of technological optimism, speed, and chrome styling, mirroring the aircraft-inspired tailfins and powerful V8 engines of the automobiles parked outside.`,
    fastFact: 'Route 66 was originally commissioned in November 1926, spanning 2,448 miles from Chicago to the Santa Monica Pier, becoming the ultimate symbol of American freedom and westward migration.',
    sceneryHighlight: 'Reflective stainless steel countertops, turquoise vinyl booths, and glowing dual neon arrows pointing toward the horizon.'
  },

  turnout_coyote_ridge: {
    id: 'turnout_coyote_ridge',
    zone: 0,
    zoneName: 'Southern California Desert',
    milepost: 'MP 10.1',
    name: 'Coyote Ridge 4x4 Trailhead & Summit',
    sub: 'Historic Mining Trail & Mojave Overlook',
    yearEst: 'EST. 1894',
    elevation: '2,840 FT ELEVATION',
    coords: '34.8214° N, 116.8450° W',
    category: 'HISTORIC DESERT PROSPECTING TRAIL & 4X4 PROVING GROUND',
    era: 'Silver Mining Boom & Overlanding Era',
    historyText: `Carved out of the rugged granite bluffs during the 1894 Calico silver rush, the steep switchbacks of Coyote Ridge were originally trodden by heavily laden pack mule trains transporting silver ore down to the Mojave desert floor. Miners painstakingly hand-cleared natural stone ledges and boulder fields along the steep canyon walls to maintain a passable grade.

In the post-WWII era, returning veterans and desert pioneers repurposed surplus Willys Jeeps and custom off-road rigs to conquer the treacherous rocky steps and boulder gardens. Today, Coyote Ridge stands as a world-renowned proving ground for rock-crawling rigs and overland explorers seeking the dramatic summit plateau, offering an awe-inspiring 360-degree panoramic vista looking down upon Route 66 and the vast Mojave Desert.`,
    fastFact: 'The summit overlook sits 125 feet directly above the highway grade, providing visual line-of-sight across 40 miles of desert plains on clear afternoons.',
    sceneryHighlight: 'Stepped granite boulder crawling obstacles ascending to a rustic timber observation deck equipped with panoramic binoculars overlooking Route 66.'
  },

  turnout_mojave_mesas: {
    id: 'turnout_mojave_mesas',
    zone: 0,
    zoneName: 'Southern California Desert',
    milepost: 'MP 14.2',
    name: 'Mojave Mesas & Natural Stone Arch',
    sub: 'Natural Sandstone Arch Panorama',
    yearEst: '150 MILLION YRS OLD',
    elevation: '3,450 FT ELEVATION',
    coords: '35.0112° N, 115.4729° W',
    category: 'GEOLOGICAL NATURAL MONUMENT',
    era: 'Jurassic Aztec Sandstone Formation',
    historyText: `Carved from ancient Jurassic eolian sand dunes over millions of years of wind erosion, freeze-thaw cycles, and flash floods, the towering red sandstone mesas of the Mojave National Preserve rise dramatically above the desert floor. The natural highway stone arch frames the vast panorama of creosote flats, Joshua tree forests, and volcanic cinder cones in the distance.

These massive rock formations served as crucial waypoints and sheltered seasonal springs for Chemehuevi and Mojave peoples for thousands of years before the arrival of Spanish expeditions and transcontinental railroad builders.`,
    fastFact: 'The red and orange colors of the mesas are caused by varying concentrations of iron oxide (hematite and limonite) that oxidized when groundwater permeated the porous sand layers.',
    sceneryHighlight: 'Sheer vertical sandstone battlements displaying multi-toned mineral bands that glow incandescent orange at sunset.'
  },

  turnout_cabazon_dinos: {
    id: 'turnout_cabazon_dinos',
    zone: 0,
    zoneName: 'Southern California Desert',
    milepost: 'MP 15.5',
    name: 'Cabazon Giant Dinosaurs Lookout',
    sub: 'Dinny the Bronto & Mr. Rex Vista',
    yearEst: 'EST. 1964',
    elevation: '1,790 FT ELEVATION',
    coords: '33.9205° N, 116.7725° W',
    category: 'ROADSIDE MONUMENTAL SCULPTURE',
    era: 'Mid-Century Roadside Giant Era',
    historyText: `Created by theme park sculptor and Knott\'s Berry Farm artist Claude Bell to attract motorists off Interstate 10 to his Wheel Inn Cafe, the Cabazon Dinosaurs are among the most celebrated colossal roadside sculptures on Earth. "Dinny," a 150-foot-long, 45-foot-tall Apatosaurus, was hand-built out of a steel framework covered in expanded metal wire mesh and hand-sprayed shotcrete over an eleven-year period.

He was later joined by "Mr. Rex," a ferocious 65-foot Tyrannosaurus Rex with a hollow interior and viewing platform inside his toothy jaws. The prehistoric pair became international pop-culture icons following their starring appearance in the 1985 cult classic film Pee-wee\'s Big Adventure.`,
    fastFact: 'Dinny the dinosaur is large enough that an entire gift shop and natural history exhibit was constructed inside his concrete ribcage.',
    sceneryHighlight: 'Monumental 45-foot concrete sauropod and fierce T-Rex standing guard against the silhouette of San Jacinto Peak.'
  },

  turnout_desert_outlets: {
    id: 'turnout_desert_outlets',
    zone: 0,
    zoneName: 'Southern California Desert',
    milepost: 'MP 16.1',
    name: 'Desert Hills Premium Outlets Plaza',
    sub: 'Spanish Stucco Arcade & Palm Court',
    yearEst: 'EST. 1990',
    elevation: '1,650 FT ELEVATION',
    coords: '33.9242° N, 116.8123° W',
    category: 'LUXURY RETAIL & REGIONAL COMMERCE',
    era: 'Modern Desert Oasis Architecture',
    historyText: `Nestled at the base of the San Gorgonio mountain pass, the Desert Hills retail district was built with grand Spanish Mediterranean colonnades, terracotta barrel-tile roofs, and sweeping date palm plazas. Designed as a luxury shopping destination for travelers journeying between Los Angeles and Palm Springs, it hosts one of the largest concentrations of premier fashion houses and boutiques in the western United States.

The center\'s wide avenues and cooling terracotta breezeways showcase contemporary desert architecture tailored to withstand triple-digit summer heat while providing sweeping views of the surrounding wind turbine valleys.`,
    fastFact: 'The San Gorgonio Pass behind the plaza channels ocean marine winds into the desert at speeds exceeding 40 mph, powering thousands of wind turbines in one of the world\'s densest wind farms.',
    sceneryHighlight: 'Gleaming white stucco arcades, terracotta tile fountains, and manicured Canary Island date palms.'
  },

  turnout_calico_ghost: {
    id: 'turnout_calico_ghost',
    zone: 0,
    zoneName: 'Southern California Desert',
    milepost: 'MP 19.0',
    name: 'Calico Ghost Town Historical Overlook',
    sub: 'Historic 1881 Silver Mining Ridge',
    yearEst: 'EST. 1881',
    elevation: '2,283 FT ELEVATION',
    coords: '34.9492° N, 116.8642° W',
    category: 'CALIFORNIA HISTORICAL LANDMARK #782',
    era: 'Wild West Silver Boom Era',
    historyText: `Founded in 1881 following the discovery of massive silver lodes in the Calico Mountains by four prospectors, Calico boomed into a bustling Wild West boomtown with over 500 silver mines, twenty-two saloons, a Chinatown, and a population exceeding 1,200 people. During its heyday, the Silver King and Maggie mines produced over $20 million in rich silver ore.

When the Silver Purchase Act was repealed in the mid-1890s and silver prices plummeted, Calico became a desolate ghost town almost overnight. In the 1950s, Walter Knott purchased the entire town and meticulously restored its historic wooden false-front buildings, mine shafts, and narrow-gauge railroad before deeding it to San Bernardino County as a public historical park.`,
    fastFact: 'Calico was officially proclaimed "California\'s Silver Rush Ghost Town" by Governor Arnold Schwarzenegger in 2005.',
    sceneryHighlight: 'Rustic rough-hewn pine boardwalks, mine headframes, and weathered tin-roofed saloons perched on red volcanic bluffs.'
  },

  turnout_roys_motel: {
    id: 'turnout_roys_motel',
    zone: 0,
    zoneName: 'Southern California Desert',
    milepost: 'MP 23.0',
    name: "Roy's Motel & Neon Starburst",
    sub: 'Iconic Route 66 Googie Signpost',
    yearEst: 'EST. 1938',
    elevation: '948 FT ELEVATION',
    coords: '34.5806° N, 115.7428° W',
    category: 'GOOGIE MID-CENTURY LANDMARK',
    era: 'Atomic Age & Space Race Architecture',
    historyText: `Located in the remote ghost town of Amboy in the heart of the eastern Mojave Desert, Roy\'s Motel and Cafe was opened by Roy Crowl in 1938. As Route 66 traffic swelled in the post-war boom, Crowl\'s son-in-law Buster Burris expanded the outpost into a thriving 24-hour service complex employing dozens of local residents and pumping hundreds of thousands of gallons of gasoline each year.

In 1959, Burris erected the world-famous Googie-style starburst neon sign: an asymmetric crimson boomerang pylon intersected by a glowing yellow chevron and atomic-age neon script that could be seen from miles across the dark desert basin. Following the opening of Interstate 40 in 1972, Amboy bypassed the highway and languished until preservationists restored the historic sign to illuminate the desert night once more.`,
    fastFact: 'Just 2.5 miles southwest of Roy\'s lies the Amboy Crater, a pristine 6,000-year-old symmetrical volcanic cinder cone rising 250 feet above the basalt lava fields.',
    sceneryHighlight: 'Towering 50-foot retro Googie neon sign standing proudly against the vast expanse of the open Mojave horizon.'
  },

  // ── Zone 1: Malibu & Pacific Coast Highway (2600 - 5200m) ─────────
  turnout_muscle_beach: {
    id: 'turnout_muscle_beach',
    zone: 1,
    zoneName: 'Malibu & Pacific Coast Highway',
    milepost: 'MP 27.0',
    name: 'Santa Monica Muscle Beach',
    sub: 'Original Calisthenics Boardwalk',
    yearEst: 'EST. 1934',
    elevation: '14 FT ELEVATION',
    coords: '34.0089° N, 118.4908° W',
    category: 'CULTURAL HERITAGE & FITNESS CRADLE',
    era: 'Golden Age of California Fitness',
    historyText: `Located just south of the Santa Monica Pier, the original Muscle Beach was established during the Great Depression by the Santa Monica recreation department. It served as the birthplace of the modern physical fitness movement in America, attracting gymnasts, acrobats, stuntmen, and weightlifters who performed thrilling open-air calisthenics on the sand.

Legends such as Jack LaLanne, Joe Gold (founder of Gold\'s Gym), and stunt doubles for Hollywood golden-age epics trained here daily. The oceanfront gymnastics platform, parallel bars, traveling rings, and rope climbing towers established Southern California as the global capital of beach culture, youth vitality, and outdoor athletics.`,
    fastFact: 'Jack LaLanne opened the nation\'s first modern health club in 1936 after training at Santa Monica Muscle Beach, pioneering weight lifting for health and longevity.',
    sceneryHighlight: 'Open-air wooden parallel bars, gymnastic rings, and golden sands with waves breaking against the shoreline.'
  },

  turnout_santa_monica_pier: {
    id: 'turnout_santa_monica_pier',
    zone: 1,
    zoneName: 'Malibu & Pacific Coast Highway',
    milepost: 'MP 27.5',
    name: 'Santa Monica Pier Yacht Harbor Arch',
    sub: 'Historic 1909 Ocean Pier & Official Route 66 End',
    yearEst: 'EST. 1909',
    elevation: '22 FT ELEVATION',
    coords: '34.0099° N, 118.4960° W',
    category: 'SANTA MONICA HISTORIC LANDMARK',
    era: 'Edwardian Seaside Pier & Neon Monument',
    historyText: `Extending over 1,600 feet into the blue waters of Santa Monica Bay, the Santa Monica Pier was opened in September 1909 as the first concrete pier on the West Coast. In 1916, pioneering carousel builder Charles I.D. Looff constructed the famous Looff Hippodrome, which still houses the historic hand-carved 44-horse carousel built in 1922.

The legendary "Santa Monica Yacht Harbor" neon entry arch on Colorado Avenue was built in 1941 and stands as the official western terminus of Route 66 — the "End of the Trail" where 2,448 miles of cross-country asphalt meet the Pacific Ocean.`,
    fastFact: 'The historic 1922 Looff Carousel was featured prominently as the hideout and meeting spot in the Oscar-winning 1973 film The Sting.',
    sceneryHighlight: 'Gleaming white wood railings, iconic yellow-and-blue neon entry portal arch, and wooden planks stretching out over ocean swells.'
  },

  turnout_california_incline: {
    id: 'turnout_california_incline',
    zone: 1,
    zoneName: 'Malibu & Pacific Coast Highway',
    milepost: 'MP 28.2',
    name: 'California Incline & Palisades Bluffs',
    sub: 'Coastal Palisades Ocean Bluffs Roadway',
    yearEst: 'EST. 1896',
    elevation: '135 FT ELEVATION',
    coords: '34.0189° N, 118.5022° W',
    category: 'HISTORIC COASTAL TRANSPORTATION CORRIDOR',
    era: 'Turn-of-the-Century Ocean Ramp',
    historyText: `Carved directly into the sheer golden sandstone bluffs of Palisades Park, the California Incline began as a dirt wagon track in 1896 known as the "Malibu Road Ramp." Connecting the hilltop city grid of Santa Monica with the Pacific Coast Highway below, the ramp was paved in the 1930s and completely modernized in 2016 with an innovative bridge structure engineered to withstand coastal seismic forces.

Driving down the Incline offers one of the most breathtaking panoramic descents on the West Coast, transitioning from high clifftop palm promenades into sweeping views of the sparkling Pacific surf and coastline.`,
    fastFact: 'The top of the bluffs features Palisades Park, a 1.6-mile linear clifftop garden with over 30 varieties of exotic palms and eucalyptus trees planted in 1892.',
    sceneryHighlight: 'High sandstone cliffs crowned with Queen palms framing an unobstructed turquoise ocean vista.'
  },

  turnout_pacific_park: {
    id: 'turnout_pacific_park',
    zone: 1,
    zoneName: 'Malibu & Pacific Coast Highway',
    milepost: 'MP 29.0',
    name: 'Pacific Park Pier & Solar Ferris Wheel',
    sub: 'Pacific Park Coaster & Ferris Wheel',
    yearEst: 'EST. 1996',
    elevation: '28 FT ELEVATION',
    coords: '34.0094° N, 118.4975° W',
    category: 'OCEANFRONT AMUSEMENT PARK & SOLAR PIONEER',
    era: 'Modern Seaside Boardwalk',
    historyText: `Pacific Park is the only amusement park situated directly on a wooden ocean pier on the West Coast of the United States. Its centerpiece, the 85-foot-tall "Pacific Wheel," was introduced in 1996 and made history in 1998 when it was retrofitted into the world\'s first solar-powered Ferris wheel, powered by over 650 square feet of photovoltaic solar panels mounted on the pier pavilion.

At night, the Ferris wheel illuminates the coastline with a computerized light show featuring 174,000 energy-efficient LED lights capable of displaying dynamic animations, geometric kaleidoscopic patterns, and holiday light shows visible miles across the bay.`,
    fastFact: 'The Pacific Wheel lifts riders over 130 feet above Santa Monica Bay, providing unobstructed 360-degree views from Catalina Island to Point Dume.',
    sceneryHighlight: 'Vibrant turquoise roller coaster track and spinning rainbow LED Ferris wheel perched over breaking ocean waves.'
  },

  turnout_will_rogers: {
    id: 'turnout_will_rogers',
    zone: 1,
    zoneName: 'Malibu & Pacific Coast Highway',
    milepost: 'MP 32.0',
    name: 'Will Rogers State Beach & Baywatch HQ',
    sub: 'Lifeguard Headquarters & Historic Surf Break',
    yearEst: 'EST. 1941',
    elevation: '16 FT ELEVATION',
    coords: '34.0378° N, 118.5283° W',
    category: 'STATE PARK & TELEVISION CULTURAL SITE',
    era: 'Hollywood Coastal & Surf Culture',
    historyText: `Named in honor of beloved American humorist, actor, and cowboy philosopher Will Rogers, who owned extensive ranch land in the canyon above, Will Rogers State Beach was deeded to the public by Rogers\' widow in the 1940s. Featuring over 1.7 miles of wide golden sand and gentle point breaks, it became a pioneering hub for Southern California beach volleyball and surfing.

In the 1990s, the iconic wooden lifeguard headquarters at Tower 18 served as the primary filming location for Baywatch — at its peak the most-watched television series on Earth with over 1.1 billion weekly viewers across 148 countries.`,
    fastFact: 'Will Rogers, famously known for declaring "I never met a man I didn\'t like," was California\'s first Honorary Mayor of Beverly Hills in 1926.',
    sceneryHighlight: 'Classic elevated blue wooden lifeguard tower with yellow rescue cans overlooking crystalline surf lines.'
  },

  turnout_getty_villa: {
    id: 'turnout_getty_villa',
    zone: 1,
    zoneName: 'Malibu & Pacific Coast Highway',
    milepost: 'MP 35.0',
    name: 'The Getty Villa Roman Colonnade',
    sub: 'Roman Peristyle & Hillside Gardens',
    yearEst: 'EST. 1974',
    elevation: '185 FT ELEVATION',
    coords: '34.0458° N, 118.5653° W',
    category: 'ANCIENT ART MUSEUM & CLASSICAL REPLICA',
    era: 'Classical Roman Revival Architecture',
    historyText: `Commissioned by oil tycoon J. Paul Getty on his Malibu estate, the Getty Villa is a stunning, full-scale architectural recreation of the Villa dei Papiri — a first-century Roman country palace in Herculaneum that was buried by the eruption of Mount Vesuvius in 79 AD. Opened in 1974, the villa houses over 44,000 Greek, Roman, and Etruscan antiquities dating from 6,500 BC to 400 AD.

The Outer Peristyle garden features a 220-foot-long reflecting pool bordered by bronze sculpture replicas, ornate mosaic fountains, fragrant Mediterranean herbs, and Corinthian travertine colonnades with views overlooking the Pacific canyon.`,
    fastFact: 'The original Villa dei Papiri in Italy remains mostly unexcavated under 90 feet of volcanic rock; the Malibu Getty Villa was reconstructed entirely from 18th-century subterranean tunnel maps drawn by Swiss engineer Karl Weber.',
    sceneryHighlight: 'Fluted marble columns, terracotta frescoed porticos, and cypress trees lining a turquoise reflecting pool.'
  },

  turnout_topanga_canyon: {
    id: 'turnout_topanga_canyon',
    zone: 1,
    zoneName: 'Malibu & Pacific Coast Highway',
    milepost: 'MP 38.0',
    name: 'Topanga Beach Surf Shack & VW Bus',
    sub: 'Bohemian Surfer Haven & Point Break',
    yearEst: 'EST. 1965',
    elevation: '18 FT ELEVATION',
    coords: '34.0392° N, 118.5833° W',
    category: 'SURF HERITAGE & COUNTERCULTURE REFUGE',
    era: '1960s Folk Rock & California Surf Craze',
    historyText: `Where the rugged Santa Monica Mountains meet the sea at Topanga Creek, Topanga Beach established itself as a bohemian sanctuary and legendary cobblestone right-hand point break. In the 1960s and 70s, Topanga Canyon became the creative incubator for California\'s folk rock explosion, housing musicians such as Neil Young, Joni Mitchell, Jim Morrison, and Crosby, Stills & Nash.

Surfers camped out in customized split-window Volkswagen Type 2 camper buses along Highway 1, shaping innovative shortboards and celebrating an off-grid lifestyle centered on Pacific swell forecasts, acoustics, and ocean sunsets.`,
    fastFact: 'The word "Topanga" comes from the indigenous Tongva language, meaning "where the mountain meets the sea" or "the place above."',
    sceneryHighlight: 'Vintage two-tone VW bus with bamboo roof rack parked beside a weathered redwood surf shack.'
  },

  turnout_malibu_pier: {
    id: 'turnout_malibu_pier',
    zone: 1,
    zoneName: 'Malibu & Pacific Coast Highway',
    milepost: 'MP 41.0',
    name: 'Malibu Pier & Surfrider Beach',
    sub: 'Historic Twin White Pier Pavilions',
    yearEst: 'EST. 1905',
    elevation: '20 FT ELEVATION',
    coords: '34.0361° N, 118.6778° W',
    category: 'HISTORIC WOODEN PIER & WORLD SURFING RESERVE',
    era: 'Edwardian Ranch Shipping to Modern Surf Meccas',
    historyText: `Built in 1905 by Frederick Hastings Rindge for his 17,000-acre Malibu Rancho ranching and tile-making empire, the 780-foot dual-pavilion wooden pier served as a deep-water shipping dock for Malibu Potteries tiles before welcoming sportfishing boats in the 1930s.

Adjacent to the pier lies Surfrider Beach (First Point), officially dedicated in 2010 as the world\'s first World Surfing Reserve. Its peeling, mechanical right-hand point break revolutionized post-war surfing and was the central backdrop for 1950s Gidget culture and endless Hollywood beach films.`,
    fastFact: 'May Knight Rindge, "Queen of Malibu," fought the construction of the Pacific Coast Highway through her private ranch in a legendary 20-year legal battle that went all the way to the U.S. Supreme Court before opening to the public in 1929.',
    sceneryHighlight: 'Twin whitewashed wood ocean pavilions with blue shingled roofs stretching out over emerald surf point breaks.'
  },

  turnout_carbon_beach: {
    id: 'turnout_carbon_beach',
    zone: 1,
    zoneName: 'Malibu & Pacific Coast Highway',
    milepost: 'MP 44.0',
    name: 'Carbon Beach Stilt Mansions',
    sub: "Modern Billionaires' Row Architecture",
    yearEst: 'EST. 1970',
    elevation: '12 FT ELEVATION',
    coords: '34.0336° N, 118.6536° W',
    category: 'CONTEMPORARY COASTAL ARCHITECTURE',
    era: 'Modernist Coastal Cantilever Design',
    historyText: `Nicknamed "Billionaires\' Row," Carbon Beach is an ultra-exclusive 1.5-mile crescent of Pacific sand flanked by multi-million-dollar modern estates engineered on deep concrete pilings over the tidal surge. Renowned modernist architects including Richard Meier, Frank Gehry, and John Lautner designed custom residences featuring frameless floor-to-ceiling tempered glass, cantilevered teak decks, and raw board-formed concrete.

Despite its private appearance, public coastal access paths preserved under the California Coastal Act of 1976 allow beachgoers to stroll along the water\'s edge beneath the dramatic architectural overhangs.`,
    fastFact: 'The entire 1.5-mile stretch of beach sits on deep alluvial sand deposits with zero public parking lots, making it one of the quietest sandy shores in Los Angeles County.',
    sceneryHighlight: 'Futuristic cantilevered glass and steel oceanfront villas with waves washing beneath their concrete support stilts.'
  },

  turnout_zuma_beach: {
    id: 'turnout_zuma_beach',
    zone: 1,
    zoneName: 'Malibu & Pacific Coast Highway',
    milepost: 'MP 46.5',
    name: 'Zuma Beach & Lifeguard Tower 26',
    sub: 'Pristine White Sands & Shorebreak',
    yearEst: 'EST. 1957',
    elevation: '14 FT ELEVATION',
    coords: '34.0219° N, 118.8267° W',
    category: 'LOS ANGELES COUNTY PREMIER BEACH',
    era: 'Post-War Public Recreation Expansion',
    historyText: `Spanning 1.8 miles of wide white sand, Zuma Beach is the largest and most popular county-operated beach in Malibu. Known for its crystal-clear water, consistent shorebreak waves, and brisk coastal upwelling currents, Zuma has served as the training ground for world-class ocean lifeguards and big-wave watermen for over seven decades.

The beach features 30 classic yellow lifeguard stands spaced evenly across the sand, backing onto native coastal sage scrub bluffs where migrating California gray whales and pods of coastal bottlenose dolphins can be spotted year-round.`,
    fastFact: 'During peak summer weekends, Zuma Beach welcomes over 100,000 visitors per day, protected by the Los Angeles County Fire Department Lifeguard Division.',
    sceneryHighlight: 'Expansive wide white sand plains meeting turquoise shorebreak barrels beneath blue skies.'
  },

  turnout_point_dume: {
    id: 'turnout_point_dume',
    zone: 1,
    zoneName: 'Malibu & Pacific Coast Highway',
    milepost: 'MP 48.0',
    name: 'Point Dume Marine Nature Reserve',
    sub: 'Coastal Headland & Whale Watching Bluff',
    yearEst: 'EST. 1979',
    elevation: '215 FT ELEVATION',
    coords: '34.0011° N, 118.8067° W',
    category: 'STATE NATURAL PRESERVE & MARINE PROTECTED AREA',
    era: 'Miocene Volcanic Headland',
    historyText: `Point Dume is a massive volcanic promontory that juts dramatically into the Pacific Ocean, forming the northern boundary of Santa Monica Bay. Named in 1793 by British explorer George Vancouver in honor of Franciscan Padre Francisco Dumetz, the headland is composed of Miocene basalt and dacite volcanic formations over 15 million years old.

The sheer cliffs and summit boardwalk offer one of the premier clifftop marine observation posts in California, overlooking thriving kelp forests, a resident Pacific harbor seal rookery, and the migratory path of thousands of Pacific gray whales journeying between Alaska and Baja California.`,
    fastFact: 'The secluded cove and sheer rock face on the west side of Point Dume served as the climactic filming location for the final scene of the 1968 classic sci-fi film Planet of the Apes.',
    sceneryHighlight: 'High promontory cliff trail overlooking emerald kelp beds and breaking waves far below.'
  },

  turnout_el_matador: {
    id: 'turnout_el_matador',
    zone: 1,
    zoneName: 'Malibu & Pacific Coast Highway',
    milepost: 'MP 49.5',
    name: 'El Matador Sea Arches & Caves',
    sub: 'Cathedral Rock Natural Sea Portals',
    yearEst: 'EST. 1980',
    elevation: '110 FT ELEVATION',
    coords: '34.0375° N, 118.8744° W',
    category: 'ROBERT H. MEYER MEMORIAL STATE BEACH',
    era: 'Wave-Carved Coastal Geomorphology',
    historyText: `Part of the Robert H. Meyer Memorial State Beaches, El Matador is famous for its dramatic cluster of massive sea stacks, natural cathedral arches, and tidal caves carved by the relentless hydraulic action of Pacific swells into sedimentary shale cliffs.

Visitors descend a steep wooden staircase clinging to the eroding bluffs to reach a secluded pocket beach where arches and keyholes create dramatic frames for golden-hour coastal photography. At low tide, adventurous explorers can walk through interconnected sea caves lined with colorful sea anemones, mussels, and starfish.`,
    fastFact: 'The iconic sea arches of El Matador have appeared in countless fashion magazines, music videos (including Britney Spears\' "Don\'t Let Me Be the Last to Know"), and romance films like The Notebook.',
    sceneryHighlight: 'Perforated sandstone sea arches standing in the rolling white foam of the Pacific surf.'
  },

  turnout_neptunes_net: {
    id: 'turnout_neptunes_net',
    zone: 1,
    zoneName: 'Malibu & Pacific Coast Highway',
    milepost: 'MP 50.5',
    name: "Neptune's Net Seafood Roadhouse",
    sub: 'Iconic Highway 1 Seafood Shack',
    yearEst: 'EST. 1958',
    elevation: '35 FT ELEVATION',
    coords: '34.0522° N, 118.9642° W',
    category: 'ROADSIDE LANDMARK & MOTORCYCLE HERITAGE',
    era: 'Classic California Coastal Roadhouse',
    historyText: `Established in 1958 by Eastman Jacobs as a humble gas station and diner, Neptune\'s Net at County Line Beach expanded in 1974 to include a live-tank seafood market and outdoor picnic patio. Perched right on Highway 1 at the Ventura County line, it became a legendary meeting ground where surfers, sports car enthusiasts, and cross-country motorcycle riders gather for clam chowder, fried fish and chips, and fresh Pacific lobster.

The roadhouse was immortalized in automotive cinema history when Brian O\'Conner (Paul Walker) and Dominic Toretto (Vin Diesel) pulled up in their tuned Toyota Supra to discuss street racing in the original 2001 film The Fast and the Furious.`,
    fastFact: 'The seafood shack has two separate service sides: "Restaurant Side" for fried seafood baskets and burgers, and "Seafood Side" where patrons pick live crab and lobster steamed on the spot in seawater cauldrons.',
    sceneryHighlight: 'Rustic red wooden shack with outdoor red-and-white picnic tables packed with sports cars and motorcycles facing County Line surf.'
  },

  turnout_point_mugu: {
    id: 'turnout_point_mugu',
    zone: 1,
    zoneName: 'Malibu & Pacific Coast Highway',
    milepost: 'MP 51.5',
    name: 'Point Mugu Rock Bluff Cut',
    sub: 'Mountain Sea Cliff Highway Gateway',
    yearEst: 'EST. 1937',
    elevation: '45 FT ELEVATION',
    coords: '34.0847° N, 119.0603° W',
    category: 'CIVIL ENGINEERING & HIGHWAY LANDMARK',
    era: 'Great Depression PCH Blasting Project',
    historyText: `Mugu Rock is a striking volcanic headland where the Santa Monica Mountains plunge directly into the deep Pacific Ocean. Prior to 1937, Highway 1 ended abruptly at the cliffs, requiring inland detours. In 1937, California Division of Highways engineers detonated hundreds of tons of dynamite to blast a deep vertical channel through the solid basalt ridge, creating the highway pass seen today and leaving Mugu Rock standing as an isolated sea tower.

The rock serves as the majestic northwestern portal to the Malibu coast, greeting motorists as they transition from the agricultural plains of Oxnard into the winding canyon curves of the Pacific Coast Highway.`,
    fastFact: 'The indigenous Chumash named the area "Muwu," meaning "beach" or "landing place," and established a major coastal trading capital here with tomol plank canoes over 3,000 years ago.',
    sceneryHighlight: 'Towering dark basalt monolith with waves exploding in white spray against its ocean-facing base.'
  },

  // ── Zone 2: Big Sur (5200 - 7800m) ─────────────────────────────────
  turnout_big_sur_inn: {
    id: 'turnout_big_sur_inn',
    zone: 2,
    zoneName: 'Big Sur Highway 1',
    milepost: 'MP 55.5',
    name: 'Big Sur River Inn & Redwoods',
    sub: 'Rustic Mountain Lodge & River Deck',
    yearEst: 'EST. 1934',
    elevation: '280 FT ELEVATION',
    coords: '36.2736° N, 121.8089° W',
    category: 'HISTORIC MOUNTAIN RESORT & DINING',
    era: 'Big Sur Pioneer Homestead Era',
    historyText: `Originally opened as the "Apple Pie Inn" by Ellen Pfeiffer Brown in 1934, the Big Sur River Inn became Big Sur\'s first dedicated tourist resort and restaurant. Built with rustic redwood logs, rough-hewn timber beams, and native river rock fireplaces, the lodge has welcomed travelers driving the newly opened Highway 1 for nearly a century.

Its most famous tradition features wooden Adirondack chairs placed directly in the cool, shallow waters of the Big Sur River, allowing guests to soak their feet under the redwood canopy while listening to mountain water rushing over river stones.`,
    fastFact: 'The Pfeiffer family was among the first European settlers to homestead Big Sur in 1869, giving their name to Pfeiffer Big Sur State Park, Pfeiffer Beach, and Julia Pfeiffer Burns State Park.',
    sceneryHighlight: 'Cedar log lodge tucked beneath towering old-growth redwoods with Adirondack chairs resting in clear river currents.'
  },

  turnout_hurricane_point: {
    id: 'turnout_hurricane_point',
    zone: 2,
    zoneName: 'Big Sur Highway 1',
    milepost: 'MP 57.0',
    name: 'Hurricane Point Ocean Vista',
    sub: 'High-Altitude Big Sur Precipice',
    yearEst: 'EST. 1937',
    elevation: '560 FT ELEVATION',
    coords: '36.3572° N, 121.9056° W',
    category: 'COASTAL PROMONTORY & WEATHER VISTA',
    era: 'Santa Lucia Mountain Crest',
    historyText: `Perched 560 feet above the crashing Pacific surf on an exposed, razor-thin mountain ridge, Hurricane Point is one of the highest and windiest vehicle overlooks on the entire California coastline. Named for the fierce, gale-force oceanic winds that funnel up the Santa Lucia canyons at speeds often exceeding 65 mph, this breathtaking vantage point offers sweeping views extending south to Point Sur Lightstation and north to Bixby Creek.

The precipitous cliffs plunge almost vertically into turquoise waters where marine upwelling nourishes giant kelp forests and attracts migrating sea otters and gray whales.`,
    fastFact: 'On clear winter afternoons after rainstorms, the atmospheric visibility at Hurricane Point can exceed 40 miles, revealing the distant peaks of the Monterey Peninsula.',
    sceneryHighlight: 'Staggering 500-foot vertical coastal cliff panorama with dramatic rolling marine fog banks swirling over mountain ridges.'
  },

  turnout_mcway_falls: {
    id: 'turnout_mcway_falls',
    zone: 2,
    zoneName: 'Big Sur Highway 1',
    milepost: 'MP 59.5',
    name: 'McWay Falls Waterfall Cove',
    sub: '80-Foot Tidefall & Turquoise Inlet',
    yearEst: 'PROTECTED 1962',
    elevation: '120 FT ELEVATION',
    coords: '36.1578° N, 121.6722° W',
    category: 'JULIA PFEIFFER BURNS STATE PARK',
    era: 'Rare Natural Pacific Tidefall',
    historyText: `Cascading 80 feet over a sheer granite cliff directly onto the pristine golden sands of McWay Cove, McWay Falls is one of only two rare "tidefalls" (waterfalls that empty into the ocean) in California. Fed year-round by crystal-clear mountain springs in the Santa Lucia Mountains, the falls originally dropped directly into the ocean waves at high tide.

In 1983, a massive mudslide south of the cove deposited over three million cubic yards of earth into the ocean, creating the idyllic sandy cove and turquoise lagoon seen today. The land was gifted to the state in 1962 by Lathrop and Hélène Brown in memory of pioneer rancher Julia Pfeiffer Burns.`,
    fastFact: 'Prior to gifting the estate, the Brown family constructed "Waterfall House," a luxury cliffside mansion with an electric funicular tramway directly above McWay Falls, whose stone foundations can still be seen today.',
    sceneryHighlight: 'Slender ribbon waterfall plunging onto untouched golden sand surrounded by aquamarine ocean waters.'
  },

  turnout_henry_miller: {
    id: 'turnout_henry_miller',
    zone: 2,
    zoneName: 'Big Sur Highway 1',
    milepost: 'MP 61.5',
    name: 'Henry Miller Library in the Pines',
    sub: 'Bohemian Sculpture Garden in Redwoods',
    yearEst: 'EST. 1981',
    elevation: '420 FT ELEVATION',
    coords: '36.2164° N, 121.7583° W',
    category: 'LITERARY LANDMARK & ARTS SANCTUARY',
    era: 'Big Sur Bohemian Golden Age',
    historyText: `Nestled deep within a cathedral grove of ancient coast redwoods, the Henry Miller Memorial Library was established in 1981 by painter Emil White to celebrate the life and works of legendary American author Henry Miller, who lived in Big Sur from 1944 to 1962. Miller wrote many of his celebrated works here, including Big Sur and the Oranges of Hieronymus Bosch, praising the region as a sanctuary of creative spirit and untamed nature.

Today, the timber cottage serves as a non-profit cultural center, indie bookstore, outdoor cinema, and intimate acoustic performance venue hosting world-renowned musicians in the forest.`,
    fastFact: 'Henry Miller arrived in Big Sur in 1944 with only $5 in his pocket, living in a primitive cabin on Partington Ridge without electricity or running water for over a decade.',
    sceneryHighlight: 'Rough-sawn cedar cottage surrounded by handcrafted wooden sculptures, vintage typewriters, and towering redwoods.'
  },

  turnout_nepenthe: {
    id: 'turnout_nepenthe',
    zone: 2,
    zoneName: 'Big Sur Highway 1',
    milepost: 'MP 63.0',
    name: 'Nepenthe Cliffside Vista Deck',
    sub: '800-Foot Ocean Panorama Dining',
    yearEst: 'EST. 1949',
    elevation: '808 FT ELEVATION',
    coords: '36.2231° N, 121.7642° W',
    category: 'HISTORIC ARCHITECTURAL RESTAURANT & OVERLOOK',
    era: 'Organic Modernist Redwood Architecture',
    historyText: `Perched 808 feet above the Pacific on an oceanfront promontory, Nepenthe was designed in 1949 by Rowan Maiden, a protégé of master architect Frank Lloyd Wright. Built using massive local redwood timbers and native Santa Lucia stone masonry, the building features an open triangular terrace framing an unbroken 40-mile coastal vista.

The property was originally purchased in 1944 by Hollywood icon Orson Welles as a romantic coastal cabin for his wife Rita Hayworth. When the Fassett family acquired it in 1949, they named it "Nepenthe" after the mythological potion of the gods described by Homer that banishes sorrow and grief.`,
    fastFact: 'The outdoor brick fire pit and amphitheater seating have served as the gathering place for bohemian artists, writers, and travelers for over 75 consecutive years.',
    sceneryHighlight: 'Expansive redwood deck with iron fire pit overlooking endless layered mountain headlands fading into the ocean mist.'
  },

  turnout_bixby_bridge: {
    id: 'turnout_bixby_bridge',
    zone: 2,
    zoneName: 'Big Sur Highway 1',
    milepost: 'MP 66.5',
    name: 'Bixby Creek Bridge North Vista',
    sub: 'Iconic Concrete Open-Spandrel Arch',
    yearEst: 'EST. 1932',
    elevation: '260 FT ELEVATION',
    coords: '36.3714° N, 121.9018° W',
    category: 'NATIONAL REGISTER OF HISTORIC PLACES',
    era: 'Great Depression Civil Engineering Triumph',
    historyText: `Rising 260 feet above the crashing waves of Bixby Creek, Bixby Creek Bridge is one of the most photographed bridge spans in the world and the crowning architectural icon of the Pacific Coast Highway. Designed by California State Bridge Engineer C.H. Purcell and completed in October 1932 for just $200,000, the 714-foot reinforced concrete open-spandrel arch eliminated a grueling 30-mile inland wagon bypass through the Old Coast Road.

Constructing the bridge required building a massive 260-foot timber falsework arch across the canyon gap using over 300,000 board feet of Douglas fir, anchored into the sheer granite canyon walls to pour 45,000 sacks of cement.`,
    fastFact: 'At the time of its opening in 1932, Bixby Bridge was the longest concrete arch span on the California State Highway System and remains one of the tallest single-span concrete arch bridges in North America.',
    sceneryHighlight: 'Towering graceful concrete arch framed against deep blue ocean swells and steep chaparral canyons.'
  },

  turnout_pfeiffer_arch: {
    id: 'turnout_pfeiffer_arch',
    zone: 2,
    zoneName: 'Big Sur Highway 1',
    milepost: 'MP 71.0',
    name: 'Pfeiffer Beach Keyhole Arch Rock',
    sub: 'Natural Sea Arch & Purple Sand Beach',
    yearEst: 'NATIVE GEOLOGICAL WONDER',
    elevation: '25 FT ELEVATION',
    coords: '36.2383° N, 121.8156° W',
    category: 'LOS PADRES NATIONAL FOREST',
    era: 'Wave-Sculpted Franciscan Granite',
    historyText: `Hidden at the end of unmarked Sycamore Canyon Road, Pfeiffer Beach is world-renowned for its stunning geological features, including the monumental Keyhole Arch — a massive freestanding granite sea stack with a natural rectangular portal carved through its center by oceanic wave energy.

The beach is also famous for its rare, vibrant purple sand streaks created by manganese garnet crystals eroding from the steep metamorphic schist cliffs above. During the winter solstice, sunset light aligns perfectly through the keyhole opening, casting a golden laser beam of light across the ocean spray.`,
    fastFact: 'The distinctive purple and violet colors in the sand are concentrated along the northern half of the beach following winter rainstorms that wash mineral deposits down the cliffs.',
    sceneryHighlight: 'Monumental granite sea stack with waves roaring through a natural rectangular keyhole tunnel onto purple-streaked sands.'
  },

  turnout_point_sur_light: {
    id: 'turnout_point_sur_light',
    zone: 2,
    zoneName: 'Big Sur Highway 1',
    milepost: 'MP 75.5',
    name: 'Point Sur Historic Lightstation',
    sub: '1889 Volcanic Rock Lighthouse Crest',
    yearEst: 'EST. 1889',
    elevation: '361 FT ELEVATION',
    coords: '36.3056° N, 121.8997° W',
    category: 'STATE HISTORIC PARK & NATIONAL REGISTER',
    era: 'Victorian Maritime Navigation Heritage',
    historyText: `Perched 361 feet above the sea on the summit of a volcanic sandstone rock mesa that rises like an island off the coastline, Point Sur Lightstation was illuminated on August 1, 1889, to protect shipping along the treacherous Big Sur coastline. Prior to its construction, dozens of vessels wrecked in the dense coastal fog, including the steamship Ventura in 1875.

The lighthouse features a classic First-Order Fresnel lens ground by Barbier & Fenestre in Paris, France, flashing a beam visible 25 nautical miles out to sea. It is the only complete turn-of-the-century lighthouse complex remaining in California.`,
    fastFact: 'In February 1935, the massive U.S. Navy helium dirigible airship USS Macon (ZRS-5) crashed in the ocean just south of Point Sur during a fierce winter gale.',
    sceneryHighlight: 'Sandstone Victorian lighthouse and lightkeeper quarters perched high atop a lone volcanic sea rock.'
  },

  // ── Zone 3: Monterey & Carmel (7800 - 10400m) ──────────────────────
  turnout_cannery_row: {
    id: 'turnout_cannery_row',
    zone: 3,
    zoneName: 'Monterey Bay & Carmel',
    milepost: 'MP 83.0',
    name: 'Cannery Row & Monterey Bay Aquarium',
    sub: 'Steinbeck Historic Sardine Waterfront',
    yearEst: 'EST. 1902',
    elevation: '18 FT ELEVATION',
    coords: '36.6181° N, 121.9014° W',
    category: 'NATIONAL REGISTER OF HISTORIC DISTRICTS',
    era: 'Industrial Sardine Boom to Marine Conservation',
    historyText: `Originally named Ocean View Avenue, Cannery Row was the bustling epicenter of the West Coast sardine packing industry from 1902 until the fishery collapsed in the late 1940s. At its peak, sixteen massive packing houses canned over 250,000 tons of sardines annually.

The street was immortalized in John Steinbeck\'s acclaimed 1945 novel Cannery Row, celebrating the vibrant camaraderie of cannery workers, fishermen, and philosopher-biologist Ed Ricketts ("Doc"). In 1984, the historic Hovden Cannery was transformed into the world-renowned Monterey Bay Aquarium, pioneering ocean conservation and deep-sea exhibitry.`,
    fastFact: 'Ed Ricketts\' real Pacific Biological Laboratories at 800 Cannery Row remains preserved today, where Ricketts and Steinbeck co-authored Sea of Cortez in 1941.',
    sceneryHighlight: 'Corrugated iron cannery crossover bridges spanning above the street with kelp forest canopies visible in the bay.'
  },

  turnout_pebble_beach: {
    id: 'turnout_pebble_beach',
    zone: 3,
    zoneName: 'Monterey Bay & Carmel',
    milepost: 'MP 88.0',
    name: 'Pebble Beach 18th Hole Ocean Vista',
    sub: 'World-Famous Coastal Links Fairway',
    yearEst: 'EST. 1919',
    elevation: '35 FT ELEVATION',
    coords: '36.5689° N, 121.9506° W',
    category: 'CHAMPIONSHIP GOLF HERITAGE & SCENIC COAST',
    era: 'Roaring Twenties Resort Architecture',
    historyText: `Designed by Jack Neville and Douglas Grant along the rocky headlands of Carmel Bay, Pebble Beach Golf Links opened in 1919 and is widely regarded as the greatest public golf course on Earth. Its signature 18th hole — a 543-yard par 5 curving around the craggy granite bluffs of Stillwater Cove — is considered the most famous finishing hole in all of golf.

Pebble Beach has hosted six U.S. Open Championships and is the annual home of the prestigious Pebble Beach Concours d\'Elegance, where the world\'s rarest historic collector automobiles gather on the 18th fairway.`,
    fastFact: 'Jack Neville had never designed a golf course prior to Pebble Beach; his vision was simply to lay out as many holes as possible directly hugging the rugged rocky Pacific shoreline.',
    sceneryHighlight: 'Lush manicured fairway bordering craggy granite shoreline boulders where ocean swells crash into Stillwater Cove.'
  },

  turnout_lone_cypress: {
    id: 'turnout_lone_cypress',
    zone: 3,
    zoneName: 'Monterey Bay & Carmel',
    milepost: 'MP 93.0',
    name: 'The Lone Cypress 250-Year Landmark',
    sub: 'Granite Cliff Icon on 17-Mile Drive',
    yearEst: 'OVER 250 YRS OLD',
    elevation: '48 FT ELEVATION',
    coords: '36.5686° N, 121.9658° W',
    category: 'HISTORIC BOTANICAL ARBOREAL MONUMENT',
    era: 'Monterey Cypress (Cupressus macrocarpa)',
    historyText: `Clinging tenaciously to an exposed granite pedestal overlooking the rocky surf of Carmel Bay along 17-Mile Drive, The Lone Cypress has stood for over 250 years as an enduring symbol of resilience, beauty, and the spirit of the California coast. Monterey Cypress trees are indigenous to only two small native coastal groves in the entire world: here at Pebble Beach and across the bay at Point Lobos.

The weathered tree has survived fierce Pacific winter storms, salt spray, and lightning strikes, and has been the registered trademark emblem of the Pebble Beach Company since 1919.`,
    fastFact: 'To protect the ancient tree from winter storm wind shear, arborists installed discreet submerged steel stabilization cables and a protective granite masonry foundation around its root base.',
    sceneryHighlight: 'Gnarled bonsai-like cypress tree silhouetted against crashing ocean surf atop a rugged granite sea rock.'
  },

  turnout_carmel_cottages: {
    id: 'turnout_carmel_cottages',
    zone: 3,
    zoneName: 'Monterey Bay & Carmel',
    milepost: 'MP 97.5',
    name: 'Carmel-by-the-Sea Fairytale Cottages',
    sub: 'Hugh Comstock Storybook Architecture',
    yearEst: 'EST. 1924',
    elevation: '160 FT ELEVATION',
    coords: '36.5553° N, 121.9233° W',
    category: 'STORYBOOK RESIDENTIAL ARCHITECTURE',
    era: '1920s Bohemian Artist Colony Era',
    historyText: `In 1924, builder Hugh Comstock designed a whimsical, cottage-style studio named "Hansom and Gretel" for his wife Maytta\'s handcrafted rag dolls. Its steep pitched gables, rounded asymmetrical stone chimneys, hand-hewn cedar timber framing, and rolling cedar shake roofs launched the "Storybook Style" architectural movement in Carmel-by-the-Sea.

Carmel was founded as a bohemian artist and writer retreat where luminaries like Jack London, Robinson Jeffers, and Ansel Adams lived. To preserve its village charm, the town famously has no street numbers, parking meters, or chain restaurants, and mail is still collected by residents at the central post office.`,
    fastFact: 'Oscar-winning actor and director Clint Eastwood served as the Mayor of Carmel-by-the-Sea from 1986 to 1988, working to preserve the village\'s unique architectural character.',
    sceneryHighlight: 'Charming thatched-roof fairy tale cottage with wavy eaves, river rock chimney, and colorful climbing roses.'
  },

  turnout_carmel_mission: {
    id: 'turnout_carmel_mission',
    zone: 3,
    zoneName: 'Monterey Bay & Carmel',
    milepost: 'MP 101.5',
    name: 'Carmel Mission Basilica San Carlos',
    sub: 'Historic 1797 Adobe Bell Tower & Quad',
    yearEst: 'EST. 1770',
    elevation: '85 FT ELEVATION',
    coords: '36.5428° N, 121.9197° W',
    category: 'NATIONAL HISTORIC LANDMARK & BASILICA',
    era: 'Spanish Colonial Alta California Era',
    historyText: `Founded on Pentecost Sunday, June 3, 1770, by Franciscan Father Junípero Serra, Mission San Carlos Borromeo del Río Carmelo served as the headquarters for all twenty-one Spanish Alta California missions. The present stone church, constructed between 1793 and 1797 out of native yellow sandstone quarried from the Carmel Valley and cemented with lime made from abalone shells, features an iconic Moorish-style domed bell tower.

Father Serra is buried beneath the sanctuary floor near the altar. The mission stands as one of the most authentically restored Spanish Colonial basilicas in North America.`,
    fastFact: 'The mission\'s distinctive parabolic stone arch ceiling was designed by master mason Manuel Ruiz, inspired by Mediterranean and Moorish architecture.',
    sceneryHighlight: 'Warm yellow sandstone cathedral with ornate curved bell tower, iron bells, and courtyard fountain.'
  },

  // ── Zone 4: NorCal & Marin (10400 - 13000m) ────────────────────────
  turnout_painted_ladies: {
    id: 'turnout_painted_ladies',
    zone: 4,
    zoneName: 'NorCal & Marin Headlands',
    milepost: 'MP 108.0',
    name: 'SF Painted Ladies Victorian Row',
    sub: 'Alamo Square Pastel Mansions',
    yearEst: 'EST. 1892',
    elevation: '210 FT ELEVATION',
    coords: '37.7763° N, 122.4328° W',
    category: 'HISTORIC ARCHITECTURAL DISTRICT',
    era: 'Queen Anne Victorian Era',
    historyText: `Built between 1892 and 1896 by developer Matthew Kavanaugh on Steiner Street across from Alamo Square Park, the "Postcard Row" of Painted Ladies is one of the most celebrated examples of Victorian Queen Anne architecture in the world. Featuring three-story bay windows, ornate fretwork, turned wood spindles, and pastel multi-color palettes, these historic residences showcase the artisanal craftsmanship of San Francisco\'s Gold Rush wealth.

The row survived the devastating 1906 San Francisco earthquake and fire and is famously juxtaposed against the soaring modern glass skyscrapers of the downtown skyline behind it.`,
    fastFact: 'Over 48,000 Victorian and Edwardian homes were built in San Francisco between 1849 and 1915, of which approximately 16,000 survive today.',
    sceneryHighlight: 'Intricately detailed pastel Victorian facades overlooking a green hillside park with the city skyline rising behind.'
  },

  turnout_sf_cable_car: {
    id: 'turnout_sf_cable_car',
    zone: 4,
    zoneName: 'NorCal & Marin Headlands',
    milepost: 'MP 111.0',
    name: 'San Francisco Historic Cable Car',
    sub: '1890s Powell-Mason Wooden Turntable',
    yearEst: 'EST. 1873',
    elevation: '85 FT ELEVATION',
    coords: '37.8072° N, 122.4172° W',
    category: 'NATIONAL HISTORIC LANDMARK (MOVING)',
    era: 'Industrial Mechanical Transportation Era',
    historyText: `Invented in 1873 by Andrew Smith Hallidie after witnessing horses struggling to pull carriages up San Francisco\'s steep cobblestone hills in the rain, the San Francisco cable car system is the world\'s last manually operated cable car network. Moving at a constant 9.5 mph, each wooden car grips an underground steel cable running continuously in a subterranean slot beneath the street.

At the end of each line, gripmen and conductors manually rotate the massive wooden cars 180 degrees on hand-turned wooden turntables to prepare for the return trip over the hills.`,
    fastFact: 'The cable cars are the only mobile National Historic Landmark in the United States, officially designated in 1964.',
    sceneryHighlight: 'Vintage maroon-and-cream wooden cable car resting on a rotating wooden turntable at the base of a steep hill.'
  },

  turnout_marin_headlands: {
    id: 'turnout_marin_headlands',
    zone: 4,
    zoneName: 'NorCal & Marin Headlands',
    milepost: 'MP 114.0',
    name: 'Marin Headlands Coastal Bunkers',
    sub: 'WWII Coastal Battery & Pacific Straits',
    yearEst: 'EST. 1898',
    elevation: '450 FT ELEVATION',
    coords: '37.8267° N, 122.4994° W',
    category: 'GOLDEN GATE NATIONAL RECREATION AREA',
    era: 'Endicott & World War II Coastal Defense Era',
    historyText: `Guarding the narrow entrance to San Francisco Bay (the Golden Gate strait), the windswept ridges of the Marin Headlands host an extensive network of historic military fortifications, including Battery Spencer, Battery Mendell, and Battery Alexander. Built between 1898 and World War II, these reinforced concrete casemates housed massive 12-inch and 16-inch rifled artillery guns capable of striking enemy warships over 25 miles out to sea.

Today, the decommissioned bunkers offer breathtaking clifftop vistas looking directly down onto the towers of the Golden Gate Bridge and the San Francisco skyline.`,
    fastFact: 'During the Cold War, the Marin Headlands housed Project Nike anti-aircraft missile launch sites (SF-88), which are now preserved as a historical military museum.',
    sceneryHighlight: 'Weathered olive-drab concrete bunker battlements perched high on sea cliffs above the Golden Gate Bridge.'
  },

  turnout_golden_gate: {
    id: 'turnout_golden_gate',
    zone: 4,
    zoneName: 'NorCal & Marin Headlands',
    milepost: 'MP 117.5',
    name: 'Golden Gate Bridge Vista Plaza',
    sub: 'International Orange Suspension Towers',
    yearEst: 'EST. 1937',
    elevation: '220 FT ELEVATION',
    coords: '37.8199° N, 122.4783° W',
    category: 'CIVIL ENGINEERING WONDER OF THE MODERN WORLD',
    era: 'Art Deco Suspension Span Mastery',
    historyText: `Spanning the 1-mile wide Golden Gate strait connecting San Francisco with Marin County, the Golden Gate Bridge was engineered by Joseph Strauss, Charles Ellis, and Leon Moisseiff, opening to pedestrians on May 27, 1937. With its iconic Art Deco fluted tower portals designed by Irving Morrow and painted in signature "International Orange," the bridge was the longest and tallest suspension bridge in the world upon its completion.

Its two 746-foot towers support main suspension cables spun from 80,000 miles of galvanized steel wire, engineered to withstand 100 mph Pacific gale winds and powerful 5-knot tidal currents rushing in and out of San Francisco Bay.`,
    fastFact: 'The bridge\'s color, International Orange, was originally intended only as a temporary lead-based primer sealant, but architect Irving Morrow loved how visible and harmonious it was against the ocean fog and lobbied to make it permanent.',
    sceneryHighlight: 'Soaring 746-foot Art Deco orange steel suspension towers framed by rolling white fog banks over the bay.'
  },

  turnout_sonoma_vineyard: {
    id: 'turnout_sonoma_vineyard',
    zone: 4,
    zoneName: 'NorCal & Marin Headlands',
    milepost: 'MP 124.0',
    name: 'Sonoma Mission Chateau & Vineyards',
    sub: 'Rolling Wine Country Hillside Terraces',
    yearEst: 'EST. 1857',
    elevation: '320 FT ELEVATION',
    coords: '38.2919° N, 122.4583° W',
    category: 'CALIFORNIA HISTORIC VITICULTURAL AREA',
    era: 'Birthplace of California Wine Industry',
    historyText: `Founded in 1857 by Hungarian nobleman Count Agoston Haraszthy (known as the "Father of California Viticulture"), Buena Vista and the surrounding Sonoma Valley estates pioneered commercial premium winemaking in California. Haraszthy traveled to Europe in 1861, returning with over 100,000 cuttings of 300 noble grape varietals (including Cabernet Sauvignon, Pinot Noir, and Zinfandel) that transformed the state into a global wine powerhouse.

The chateaus feature hand-carved limestone wine aging cellars tunneled deep into the Mayacamas hillside, surrounded by rolling vineyards and olive groves.`,
    fastFact: 'The historic stone cellars survived the 1906 earthquake and were the first subterranean wine caves excavated in California.',
    sceneryHighlight: 'Grand stone chateau with slate mansard roof overlooking neat geometric rows of sun-drenched vineyards.'
  },

  turnout_bodega_church: {
    id: 'turnout_bodega_church',
    zone: 4,
    zoneName: 'NorCal & Marin Headlands',
    milepost: 'MP 128.0',
    name: 'Bodega Bay & St. Teresa Church',
    sub: 'Historic 1859 White Steeple Parish',
    yearEst: 'EST. 1859',
    elevation: '115 FT ELEVATION',
    coords: '38.3453° N, 122.9739° W',
    category: 'CALIFORNIA HISTORICAL LANDMARK & CINEMATIC SITE',
    era: 'Pioneer Carpenter Gothic Church',
    historyText: `Built in 1859 by Spanish and Portuguese dairy ranchers on land donated by Jasper O\'Farrell, St. Teresa of Avila Church in Bodega is the oldest continuously operating Catholic parish in Sonoma County. Constructed out of virgin old-growth redwood lumber by local shipwrights, the church features classic Carpenter Gothic board-and-batten architecture and a slender white bell steeple.

The church gained worldwide cinematic fame when legendary director Alfred Hitchcock featured it and the neighboring 1873 Potter Schoolhouse in his 1963 psychological horror masterpiece The Birds. It was also famously photographed in 1953 by Ansel Adams.`,
    fastFact: 'Inside the church hangs an original stained glass window and altar gifted directly by the family of Spanish King Philip V in the 19th century.',
    sceneryHighlight: 'Pristine whitewashed pioneer wooden church with tall bell tower perched on a rolling green hillside.'
  },

  // ── Zone 5: Redwood Forest (13000 - 15600m) ────────────────────────
  turnout_covered_bridge: {
    id: 'turnout_covered_bridge',
    zone: 5,
    zoneName: 'Pacific Redwood Forest',
    milepost: 'MP 134.5',
    name: 'Redwood Creek Covered Timber Bridge',
    sub: 'Cedar Shingle Historic Stream Crossing',
    yearEst: 'EST. 1888',
    elevation: '420 FT ELEVATION',
    coords: '41.2131° N, 124.0047° W',
    category: 'HISTORIC TIMBER COVERED BRIDGE',
    era: '19th-Century Burr-Truss Bridge Engineering',
    historyText: `Built in the late 19th century to allow stagecoaches and heavy logging teams to cross Redwood Creek during torrential winter mountain floods, this authentic covered timber bridge was constructed using heavy Douglas fir and coast redwood trusses. The wooden roof and siding were designed to protect the critical structural load-bearing timbers from the relentless 80-inch annual rainfall of the Pacific Northwest temperate rainforest.

The bridge\'s weathered cedar shake shingles and hand-hewn interior timber kingposts remain a testament to pioneer bridgecraft and early coastal logging routes.`,
    fastFact: 'Covered bridges were covered not to protect travelers, but because uncovered wooden bridges rotted and failed in 10-15 years, whereas covered bridges could easily endure over a century.',
    sceneryHighlight: 'Rustic moss-covered red timber bridge crossing a boulder-strewn fern canyon beneath massive redwood trees.'
  },

  turnout_chandelier_tree: {
    id: 'turnout_chandelier_tree',
    zone: 5,
    zoneName: 'Pacific Redwood Forest',
    milepost: 'MP 139.0',
    name: 'Chandelier Drive-Thru Redwood Tree',
    sub: '315-Foot Ancient Tunnel Tree',
    yearEst: 'OVER 2,400 YRS OLD',
    elevation: '510 FT ELEVATION',
    coords: '39.8647° N, 123.7192° W',
    category: 'ANCIENT OLD-GROWTH REDWOOD & ROADSIDE ICON',
    era: 'Coast Redwood (Sequoia sempervirens)',
    historyText: `Standing 315 feet tall with a trunk diameter exceeding 16 feet at its base, the Chandelier Tree in Leggett, California, is one of the world\'s most famous living trees. Named for the massive, sweeping lateral branches that sprout from its upper trunk like the arms of an ornate chandelier, this ancient Sequoia sempervirens sprouted over 2,400 years ago during the height of the classical Greek era.

In 1937, a 6-foot-wide by 7-foot-high tunnel was carefully carved through the base of the living tree, allowing vintage automobiles to drive directly through its center without harming its vital sapwood.`,
    fastFact: 'Coast redwoods are the tallest living organisms on Earth, with the tallest known specimen (Hyperion in Redwood National Park) measuring 380.3 feet in height.',
    sceneryHighlight: 'Towering cathedral redwood with an automobile-sized tunnel carved through its massive mossy bark base.'
  },

  turnout_carson_mansion: {
    id: 'turnout_carson_mansion',
    zone: 5,
    zoneName: 'Pacific Redwood Forest',
    milepost: 'MP 144.0',
    name: 'Carson Mansion Eureka Victorian',
    sub: 'Historic Queen Anne Redwood Estate',
    yearEst: 'EST. 1886',
    elevation: '45 FT ELEVATION',
    coords: '40.8053° N, 124.1578° W',
    category: 'QUEEN ANNE VICTORIAN MASTERPIECE',
    era: 'Lumber Baron Gilded Age',
    historyText: `Built in Eureka between 1884 and 1886 for pioneering lumber baron William Carson, founder of the Pacific Lumber Company, the Carson Mansion is widely acknowledged as the grandest and most spectacular Victorian Queen Anne residence in the United States. Designed by San Francisco architects Samuel and Joseph Cather Newsom, the three-story estate was constructed entirely out of 100% prime old-growth redwood lumber harvested from Carson\'s own timber mills.

Featuring an intricate four-story corner tower, stained glass bay windows, hand-carved redwood paneling, and elaborate Eastlake exterior trim, the mansion kept Carson\'s 100 top craftsmen employed during an economic slowdown.`,
    fastFact: 'When asked why he built such a lavish home, Carson famously replied: "If I built it poorly, they\'d say I was a cheapskate. If I built it well, they\'d say I was a showoff. So I decided to build it right."',
    sceneryHighlight: 'Grand forest-green and gold Victorian mansion with dramatic multi-tiered turret overlooking Humboldt Bay.'
  },

  turnout_bigfoot_museum: {
    id: 'turnout_bigfoot_museum',
    zone: 5,
    zoneName: 'Pacific Redwood Forest',
    milepost: 'MP 149.5',
    name: 'Legend of Bigfoot Forest Museum',
    sub: 'Sasquatch Carvings & Forest Lore',
    yearEst: 'EST. 1978',
    elevation: '680 FT ELEVATION',
    coords: '40.0631° N, 123.7911° W',
    category: 'PACIFIC NORTHWEST FOLKLORE & WOODCARVING',
    era: 'Sasquatch Cryptid & Redwood Crafts Era',
    historyText: `Deep in the misty old-growth forests of Northern California, the Legend of Bigfoot Museum celebrates the rich oral traditions, indigenous legends, and cryptid folklore of the Sasquatch. Native Hupa, Yurok, and Karuk tribes have passed down stories of the giant "Wild Man of the Woods" for centuries, honoring the creature as a peaceful guardian of the ancient forest.

In 1958, modern Bigfoot fever erupted when logger Jerry Crew discovered massive 16-inch footprint impressions pressed into the mud at Bluff Creek in Humboldt County. The roadside museum features monumental chainsaw-carved redwood Sasquatch statues, plaster footprint casts, and historical artifacts.`,
    fastFact: 'The famous 1967 Patterson-Gimlin film, showing a purported female Bigfoot walking along a gravel creek bank, was filmed just 40 miles east of here in the Six Rivers National Forest.',
    sceneryHighlight: '18-foot-tall chainsaw-carved redwood Bigfoot statue standing at the edge of the dark, mossy forest.'
  },

  turnout_sawmill_camp: {
    id: 'turnout_sawmill_camp',
    zone: 5,
    zoneName: 'Pacific Redwood Forest',
    milepost: 'MP 154.0',
    name: 'Redwood Sawmill & Steam Donkey Camp',
    sub: 'Historic 19th Century Steam Logging',
    yearEst: 'EST. 1892',
    elevation: '550 FT ELEVATION',
    coords: '40.4908° N, 124.0156° W',
    category: 'HISTORIC INDUSTRIAL FORESTRY MUSEUM',
    era: 'Steam-Powered Industrial Logging Era',
    historyText: `Prior to modern machinery, harvesting giant redwood trees that weighed up to 500 tons required revolutionary steam technology. Invented by John Dolbeer in 1881 in Humboldt County, the "Steam Donkey" — a portable steam engine with a geared cable winch drum — revolutionized logging by dragging colossal timber logs out of steep mountain ravines using steel cables.

This restored historic sawmill camp preserves authentic steam boilers, upright wood-fired donkey engines, vintage narrow-gauge logging rail cars, and giant two-man crosscut "misery whip" saws used by pioneer timber jacks.`,
    fastFact: 'Old-growth redwoods were so massive that early loggers had to build elevated wooden scaffold platforms (springboards) 10 to 15 feet off the ground just to begin sawing above the flared root base.',
    sceneryHighlight: 'Massive iron steam boiler and vintage geared winch engine resting beside stacks of colossal redwood logs.'
  },

  // ── Zone 6: Oregon Coast (15600 - 18200m) ──────────────────────────
  turnout_yaquina_light: {
    id: 'turnout_yaquina_light',
    zone: 6,
    zoneName: 'Oregon Coast Highway 101',
    milepost: 'MP 161.0',
    name: 'Yaquina Head Lighthouse & Cobble Beach',
    sub: '93-Foot Coastal Beacon & Headlands',
    yearEst: 'EST. 1873',
    elevation: '162 FT ELEVATION',
    coords: '44.6775° N, 124.0797° W',
    category: 'OUTSTANDING NATURAL AREA & NATIONAL REGISTER',
    era: 'High Victorian Maritime Beacon',
    historyText: `Standing 93 feet tall atop a dramatic basalt lava headland jutting one mile into the Pacific Ocean, Yaquina Head Light is Oregon\'s tallest lighthouse. First illuminated on August 20, 1873, using a massive French-crafted First-Order Fresnel lens featuring 254 glass prisms, the beacon has guided mariners along the treacherous Pacific Northwest coast for over 150 years.

Below the lighthouse lies Cobble Beach, famous for its smooth black basalt cobblestones that produce a distinctive rumbling acoustic sound as ocean waves roll them across the shore.`,
    fastFact: 'The headland was formed 14 million years ago by colossal Columbia River basalt lava flows that originated in eastern Oregon and flowed over 300 miles to reach the Pacific Ocean.',
    sceneryHighlight: 'Towering white brick lighthouse beacon overlooking dramatic crashing surf and black cobblestone tidepools.'
  },

  turnout_haystack_rock: {
    id: 'turnout_haystack_rock',
    zone: 6,
    zoneName: 'Oregon Coast Highway 101',
    milepost: 'MP 166.0',
    name: 'Haystack Rock & The Needles Overlook',
    sub: '235-Foot Marine Monolith Sea Stack',
    yearEst: 'EST. 1990 PROTECTED',
    elevation: '30 FT ELEVATION',
    coords: '45.8847° N, 123.9678° W',
    category: 'STATE MARINE RESERVE & BIRD REFUGE',
    era: 'Miocene Basalt Sea Stack',
    historyText: `Rising 235 feet above the surf at Cannon Beach, Haystack Rock is one of the most recognizable and magnificent coastal monoliths in the world. Created 15 million years ago by the same massive volcanic basalt flows that shaped the Columbia Gorge, the sea stack was sculpted by wave erosion into an isolated coastal sanctuary.

Haystack Rock is a protected National Wildlife Refuge, serving as a critical nesting colony for thousands of seabirds, including tufted puffins, common murres, and cormorants. At low tide, visitors can walk right up to its base to explore colorful marine tidepools.`,
    fastFact: 'Haystack Rock was featured prominently in the opening coastal race scene of the 1985 classic adventure film The Goonies.',
    sceneryHighlight: 'Colossal dark basalt monolith flanked by sharp sea needle rocks reflecting in wide, mirror-like tidal sands.'
  },

  turnout_driftwood_caves: {
    id: 'turnout_driftwood_caves',
    zone: 6,
    zoneName: 'Oregon Coast Highway 101',
    milepost: 'MP 172.0',
    name: 'Oregon Driftwood Beach & Sea Caves',
    sub: 'Pacific Tide Pools & Weathered Logs',
    yearEst: 'NATIVE COASTAL FORMATION',
    elevation: '18 FT ELEVATION',
    coords: '45.1242° N, 123.9856° W',
    category: 'OREGON STATE SCENIC WATERWAY',
    era: 'Wave-Carved Basalt Sea Caves',
    historyText: `The rugged central Oregon coast is renowned for its wild, tempestuous beaches where colossal old-growth Sitka spruce and Douglas fir logs — washed down coastal rivers during winter storms — are sculpted and bleached by salt spray into giant natural driftwood monuments on the sand.

At the base of the towering sea bluffs, violent tidal surges have hollowed out deep marine sea caves lined with gooseneck barnacles, green sea anemones, and ochre sea stars that are accessible during negative low tides.`,
    fastFact: 'Under the landmark 1967 Oregon Beach Bill passed by Governor Tom McCall, all 362 miles of Oregon\'s coastline are permanently open to the public as a free state recreation area.',
    sceneryHighlight: 'Massive silver bleached driftwood tree trunks resting on broad sands before dark cathedral sea caves.'
  },

  turnout_tillamook_barn: {
    id: 'turnout_tillamook_barn',
    zone: 6,
    zoneName: 'Oregon Coast Highway 101',
    milepost: 'MP 178.0',
    name: 'Tillamook Creamery & Historic Barn',
    sub: 'Oregon Valley Dairy & Yellow Barn',
    yearEst: 'EST. 1909',
    elevation: '28 FT ELEVATION',
    coords: '45.4853° N, 123.8447° W',
    category: 'AGRICULTURAL COOPERATIVE & CREAMERY',
    era: 'Pacific Northwest Dairy Heritage',
    historyText: `Nestled in the lush, emerald river valleys between the Coast Range mountains and the ocean, the Tillamook County Creamery Association was founded in 1909 as a farmer-owned cooperative uniting ten local dairy farms. The region\'s mild coastal climate, rich alluvial soils, and abundant rainfall produce year-round clover pastures ideal for prize dairy cattle.

Tillamook revolutionized artisan cheesemaking with its signature naturally aged medium and sharp cheddar cheeses. Today, the iconic yellow barn and modern creamery welcome over 1.3 million visitors each year.`,
    fastFact: 'In 1855, before coastal roads or railroads existed, local farmers hand-built the schooner Morning Star to transport their fresh butter and cheese across the stormy ocean to Portland markets.',
    sceneryHighlight: 'Iconic bright yellow Dutch-gambrel wooden barn surrounded by grazing cows and misty green valley pastures.'
  },

  // ── Zone 7: Columbia River Gorge (18200 - 20800m) ──────────────────
  turnout_bridge_of_gods: {
    id: 'turnout_bridge_of_gods',
    zone: 7,
    zoneName: 'Columbia River Gorge National Scenic Area',
    milepost: 'MP 186.5',
    name: 'Bridge of the Gods Steel Cantilever',
    sub: 'PCT Columbia River Mountain Span',
    yearEst: 'EST. 1926',
    elevation: '140 FT ELEVATION',
    coords: '45.6625° N, 121.9014° W',
    category: 'HISTORIC STEEL CANTILEVER BRIDGE',
    era: '1920s Trans-Columbia River Engineering',
    historyText: `Spanning 1,856 feet across the Columbia River between Cascade Locks, Oregon, and Stevenson, Washington, the Bridge of the Gods is a historic steel cantilever truss bridge completed in 1926. It takes its legendary name from a massive geological landslide (the Bonneville Landslide) that dammed the Columbia River around 1450 AD, creating a natural stone bridge that indigenous Klickitat and Chinook peoples crossed on foot.

Today, the bridge serves as the official Columbia River crossing for the 2,650-mile Pacific Crest National Scenic Trail (PCT), where through-hikers journeying from Mexico to Canada walk across the steel grate above the roaring river.`,
    fastFact: 'The bridge was famously featured in the climactic scene of the 2014 biographical film Wild, starring Reese Witherspoon as Cheryl Strayed completing her 1,100-mile solo PCT hike.',
    sceneryHighlight: 'Towering silver-green steel cantilever truss bridge soaring across the wide Columbia River between forested mountain peaks.'
  },

  turnout_multnomah_falls: {
    id: 'turnout_multnomah_falls',
    zone: 7,
    zoneName: 'Columbia River Gorge National Scenic Area',
    milepost: 'MP 192.5',
    name: 'Multnomah Falls 620-Foot Cascade',
    sub: 'Two-Tier Waterfall & Benson Stone Arch',
    yearEst: 'EST. 1914',
    elevation: '620 FT ELEVATION',
    coords: '45.5762° N, 122.1158° W',
    category: 'NATIONAL SCENIC AREA & OREGON ICON',
    era: 'Miocene Layered Basalt Falls',
    historyText: `Plunging a breathtaking 620 feet down sheer black basalt amphitheater cliffs, Multnomah Falls is the tallest waterfall in Oregon and the most visited natural recreation site in the Pacific Northwest. Fed by underground springs from Larch Mountain, the waterfall drops in two dramatic tiers: the upper falls (542 feet) and lower falls (69 feet).

In 1914, Italian stone masons constructed the iconic Benson Bridge — a graceful concrete arch span 105 feet above the lower cascade — allowing visitors to stand directly above the misting lower pool between the two falling torrents.`,
    fastFact: 'Unlike many seasonal waterfalls, Multnomah Falls flows year-round with an average flow rate of 150 cubic feet of water per second, creating stunning ice formations during freezing Columbia Gorge winter gales.',
    sceneryHighlight: 'Colossal two-tiered waterfall roaring down moss-draped basalt cliffs behind a historic stone footbridge.'
  },

  turnout_bonneville_dam: {
    id: 'turnout_bonneville_dam',
    zone: 7,
    zoneName: 'Columbia River Gorge National Scenic Area',
    milepost: 'MP 198.5',
    name: 'Bonneville Hydroelectric Dam Spillway',
    sub: 'Columbia River Spillway & Fish Ladders',
    yearEst: 'EST. 1937',
    elevation: '82 FT ELEVATION',
    coords: '45.6442° N, 121.9406° W',
    category: 'NATIONAL HISTORIC CIVIL ENGINEERING LANDMARK',
    era: 'New Deal Great Depression Hydroelectric Era',
    historyText: `Authorized by President Franklin D. Roosevelt in 1933 as a monumental Public Works Administration (PWA) New Deal project, Bonneville Dam was completed in 1937 to provide clean hydroelectric power and open the Columbia River to deep-water navigation. Built by the U.S. Army Corps of Engineers, its massive concrete spillway gates harness the immense hydraulic force of the river.

To protect migrating Pacific salmon, steelhead, and lamprey returning from the ocean to spawn, engineers designed pioneering fish ladders and underwater observation galleries that allow thousands of fish to swim upstream around the dam each day.`,
    fastFact: 'Folk music icon Woody Guthrie was hired by the Bonneville Power Administration in 1941, writing twenty-six legendary songs in thirty days, including "Roll On, Columbia, Roll On" and "Pastures of Plenty."',
    sceneryHighlight: 'Massive concrete dam spillway with roaring white water cascades flowing between green mountain slopes.'
  },

  turnout_vista_house: {
    id: 'turnout_vista_house',
    zone: 7,
    zoneName: 'Columbia River Gorge National Scenic Area',
    milepost: 'MP 204.5',
    name: 'Vista House at Crown Point (1918)',
    sub: '733-Foot Clifftop Marble Rotunda',
    yearEst: 'EST. 1918',
    elevation: '733 FT ELEVATION',
    coords: '45.5394° N, 122.2442° W',
    category: 'NATIONAL REGISTER OF HISTORIC PLACES',
    era: 'Art Nouveau & German Secessionist Stone Rotunda',
    historyText: `Perched 733 feet above the Columbia River on Crown Point — a sheer promontory created by a 14-million-year-old basalt lava flow — Vista House was designed by architect Edgar M. Lazarus and dedicated on May 5, 1918. Built as an observatory and memorial to Oregon pioneers along the Historic Columbia River Highway, the 44-foot-diameter octagonal stone rotunda is crowned with a green glazed ceramic tile roof.

The interior is lined with Alaskan Tushkah marble, Kasota limestone, and stained glass windows, framing an awe-inspiring 30-mile panorama of the river gorge extending east into the Cascade Mountain Range.`,
    fastFact: 'Sam Hill, visionary builder of the Historic Columbia River Highway, envisioned the road as a poem in stone and steel, declaring: "We must build a road for all time to show that modern man can equal the ancients in stonework."',
    sceneryHighlight: 'Ornate stone rotunda with green copper dome crowning a sheer clifftop promontory high above the river.'
  },

  // ── Zone 8: Washington & Olympic (20800 - 23400m) ──────────────────
  turnout_snoqualmie_falls: {
    id: 'turnout_snoqualmie_falls',
    zone: 8,
    zoneName: 'Washington & Pacific Northwest',
    milepost: 'MP 213.5',
    name: 'Snoqualmie Falls & Salish Mountain Lodge',
    sub: '268-Foot Roaring Cascade & River Gorge',
    yearEst: 'EST. 1898',
    elevation: '440 FT ELEVATION',
    coords: '47.5417° N, 121.8378° W',
    category: 'TRADITIONAL CULTURAL PROPERTY & NATIONAL REGISTER',
    era: 'Sacred Indigenous Site & Industrial Hydro Pioneer',
    historyText: `Dropping 268 feet over a sheer volcanic cliff into a deep river canyon — nearly 100 feet taller than Niagara Falls — Snoqualmie Falls is sacred to the Snoqualmie people as the birthplace of humanity and the spiritual conduit where prayers rise to the Creator in the mist.

In 1898, civil engineer Charles Baker designed the world\'s first completely underground hydroelectric power plant, carved 270 feet deep inside the bedrock behind the waterfall. Perched on the cliff edge above the falls sits the historic Salish Lodge, celebrated internationally as the exterior of the "Great Northern Hotel" in David Lynch\'s cult television series Twin Peaks.`,
    fastFact: 'The underground power plant built in 1898 is still operating with its original Westinghouse electric generators, producing clean renewable energy for the Puget Sound region.',
    sceneryHighlight: 'Thunderous 268-foot waterfall roaring into a misty canyon beneath a luxury cedar shingle mountain lodge.'
  },

  turnout_puget_ferry: {
    id: 'turnout_puget_ferry',
    zone: 8,
    zoneName: 'Washington & Pacific Northwest',
    milepost: 'MP 219.5',
    name: 'Puget Sound Jumbo Ferry Dock',
    sub: 'Washington State Jumbo Ferry Crossing',
    yearEst: 'EST. 1951',
    elevation: '12 FT ELEVATION',
    coords: '47.6025° N, 122.3389° W',
    category: 'WASHINGTON STATE MARINE HIGHWAY SYSTEM',
    era: 'Pacific Northwest Marine Transportation',
    historyText: `Operating since 1951, Washington State Ferries is the largest ferry system in the United States and the second largest in the world, carrying over 24 million passengers and 10 million vehicles across Puget Sound each year. The iconic green-and-white Jumbo Mark II ferries span 460 feet in length and carry up to 202 automobiles and 2,500 passengers.

Gliding across the deep saltwater fjords between Seattle, Bainbridge Island, and the Olympic Peninsula, the ferries offer unmatched vistas of the Olympic Mountains, Mount Rainier, and the Seattle skyline.`,
    fastFact: 'Puget Sound is a glacially carved fjord system reaching depths of over 930 feet, home to resident orca whale pods, giant Pacific octopuses, and harbor seals.',
    sceneryHighlight: 'Colossal green-and-white double-ended ferry vessel docking at a wooden piling slip in Puget Sound.'
  },

  turnout_space_needle: {
    id: 'turnout_space_needle',
    zone: 8,
    zoneName: 'Washington & Pacific Northwest',
    milepost: 'MP 225.5',
    name: 'Seattle Space Needle & Mount Rainier Plaza',
    sub: '605-Foot Observation Spire & Skyline',
    yearEst: 'EST. 1962',
    elevation: '605 FT ELEVATION',
    coords: '47.6205° N, 122.3493° W',
    category: 'WORLD FAIR ICON & SEATTLE HISTORIC LANDMARK',
    era: 'Space Age Century 21 Exposition',
    historyText: `Built as the soaring centerpiece of the 1962 Century 21 Exposition (Seattle World\'s Fair), the 605-foot Space Needle was designed by Edward E. Carlson and John Graham Jr. to embody the Space Age future. Engineered to withstand 200 mph hurricane winds and category 9.0 earthquakes, the spire features a 30-foot-deep concrete foundation weighing 5,850 tons.

Its flying saucer top house features the world\'s first revolving glass floor ("The Loupe"), offering 360-degree vistas across Elliott Bay, downtown Seattle, the Cascade Range, and the snow-capped 14,411-foot volcanic peak of Mount Rainier.`,
    fastFact: 'The Space Needle was built in just 400 days and originally painted in futuristic colors: "Orbital Olive" (body), "Astronaut White" (core), and "Orbital Orange" (roof).',
    sceneryHighlight: 'Futuristic 605-foot Space Age spire soaring into the sky with Mount Rainier\'s snow-capped volcano in the background.'
  },

  turnout_pike_place: {
    id: 'turnout_pike_place',
    zone: 8,
    zoneName: 'Washington & Pacific Northwest',
    milepost: 'MP 231.0',
    name: 'Pike Place Market & Historic Neon Clock',
    sub: 'Historic Farmers Market & Waterfront Esplanade',
    yearEst: 'EST. 1907',
    elevation: '85 FT ELEVATION',
    coords: '47.6089° N, 122.3406° W',
    category: 'NATIONAL HISTORIC DISTRICT & PUBLIC MARKET',
    era: 'Early 20th-Century Public Farmers Market',
    historyText: `Opened on August 17, 1907, to connect local farmers directly with consumers and bypass price-gouging middlemen, Pike Place Market is the oldest continuously operated public farmers market in the United States. Spanning nine historic acres along the Seattle waterfront, its multi-level wooden arcades house hundreds of independent farmers, artisanal craftspeople, and fresh seafood purveyors.

The famous "Public Market Center" neon clock and sign were erected in 1927. The market is world-famous for its flying fish mongers at Pike Place Fish Market and for preserving Seattle\'s authentic maritime and agricultural spirit.`,
    fastFact: 'In the late 1960s, a plan was proposed to demolish the market for high-rise condos, but visionary architect Victor Steinbrueck led a citizen campaign that voted to protect it forever as a historic district in 1971.',
    sceneryHighlight: 'Vibrant multi-story timber market with red neon clock, flower stalls, and seafood counters overlooking the waterfront.'
  },

  // ── Zone 9: Cascade Pass & Mount Rainier (23400 - 26000m) ─────────
  turnout_paradise_lodge: {
    id: 'turnout_paradise_lodge',
    zone: 9,
    zoneName: 'Cascade Alpine Pass & Mount Rainier',
    milepost: 'MP 241.0',
    name: 'Paradise Historic Timber Lodge (1916)',
    sub: '5,420-Foot Subalpine Timber Landmark',
    yearEst: 'EST. 1916',
    elevation: '5,420 FT ELEVATION',
    coords: '46.7865° N, 121.7350° W',
    category: 'NATIONAL HISTORIC LANDMARK & RUSTIC LODGE',
    era: 'National Park Service Rustic Architecture Era',
    historyText: `Perched at 5,420 feet on the south slope of Mount Rainier, Paradise Inn was constructed in 1916 from massive cedar logs and timbers salvaged from the great 1885 forest fire in the Silver Forest. Designed by Frederick Heath, the lodge features exposed 2-foot-thick hand-hewn cedar posts, multi-tiered steep roofs designed to shed up to 30 feet of annual snowpack, and massive 14-foot stone fireplaces crafted from local glacial boulders.

The Great Hall houses historic handcrafted rustic furniture built on-site by German carpenter Hans Fraehnke, including a 1,500-pound cedar log grandfather clock and an intricate cedar upright piano that have greeted alpine climbers and road travelers for over a century.`,
    fastFact: 'Paradise holds the world record for the most recorded snowfall in a single 12-month season: an astonishing 1,122 inches (93.5 feet / 28.5 meters) during the winter of 1971–1972.',
    sceneryHighlight: 'Colossal rustic timber lodge framed by snow-covered subalpine firs and towering Mount Rainier.'
  },

  turnout_narada_falls: {
    id: 'turnout_narada_falls',
    zone: 9,
    zoneName: 'Cascade Alpine Pass & Mount Rainier',
    milepost: 'MP 249.0',
    name: 'Narada Falls Basalt Chasm Overlook',
    sub: '176-Foot Columnar Basalt Glacial Cascade',
    yearEst: 'EST. 1893',
    elevation: '4,590 FT ELEVATION',
    coords: '46.7753° N, 121.7456° W',
    category: 'GEOLOGICAL CHASM & GLACIAL CASCADE',
    era: 'Early Pacific Northwest Exploration Era',
    historyText: `Narada Falls is one of Mount Rainier National Park's most dramatic geological wonders, where the Paradise River plunges 176 feet over an ancient flow of columnar andesite and basalt into a misty, moss-lined canyon. The falls drop in two dramatic tiers: a thunderous 159-foot sheer plunge followed by a 17-foot series of tiered step rapids.

The columnar rock formation was formed by lava cooling against ancient glacial ice thousands of years ago, fracturing the stone into distinctive vertical hexagonal pillars. In early morning and afternoon light, the continuous plume of glacial spray creates brilliant circular rainbows across the gorge.`,
    fastFact: 'The name "Narada" was suggested in 1893 by early park explorer Peter B. Van Trump, named after the celestial sage and traveler Narada from Hindu literature.',
    sceneryHighlight: 'Sheer vertical basalt amphitheater with thunderous glacial waterfall and rainbow mist over icy plunge pool.'
  },

  // ── Zone 10: Idaho Panhandle & Lake Coeur d'Alene (26000 - 28600m) ────
  turnout_coeur_dalene_boardwalk: {
    id: 'turnout_coeur_dalene_boardwalk',
    zone: 10,
    zoneName: "Idaho Panhandle & Lake Coeur d'Alene",
    milepost: 'MP 268.0',
    name: "Lake Coeur d'Alene Floating Boardwalk",
    sub: "Sapphire Lake Marina & Resort Promenade",
    yearEst: 'EST. 1887 (Resort Era: 1939)',
    elevation: '2,152 FT ELEVATION',
    coords: '47.6740° N, 116.7805° W',
    category: "INLAND SEA & RESORT MARINA",
    era: 'Timber Boom & Inland Northwest Resort Era',
    historyText: `Lake Coeur d'Alene is one of the most remarkably clear and sapphire-blue bodies of water in all of North America. Stretching 25 miles in length and plunging to depths of 220 feet, the lake occupies a glacially carved valley at the heart of the Idaho Panhandle, fed by the pristine St. Joe and Coeur d'Alene rivers flowing through ancient cedar and ponderosa pine forests.\n\nThe Coeur d'Alene Resort, built in 1986 on the site of a former Northern Pacific Railroad railyard, features the world's only floating golf green — a 14th-hole tee-to-green island that is mechanically moved to different distances each day across the shimmering lake. In late summer, the crystal-clear water reveals submerged tree stumps from the 1906 flooding of Fernan Lake, ghost forests of the timber era preserved under 15 feet of glass-calm water.`,
    fastFact: "In 1991, the Coeur d'Alene Resort's floating golf course green earned a Guinness World Record as the world's only navigable floating golf hole — it is moved by a specially designed boat to distances between 100 and 175 yards from the 14th tee.",
    sceneryHighlight: "Sapphire lake reflecting forested mountains, resort hotel towers, and a floating marina boardwalk with seaplane docks."
  },

  turnout_cataldo_mission: {
    id: 'turnout_cataldo_mission',
    zone: 10,
    zoneName: "Idaho Panhandle & Lake Coeur d'Alene",
    milepost: 'MP 276.0',
    name: "Cataldo Old Mission (1853)",
    sub: "Idaho's Oldest Standing Building — Jesuit Frontier Church",
    yearEst: 'EST. 1848 (Completed 1853)',
    elevation: '2,178 FT ELEVATION',
    coords: '47.5427° N, 116.4026° W',
    category: "NATIONAL HISTORIC LANDMARK — FRONTIER MISSION CHURCH",
    era: 'Jesuit Pacific Northwest Missionary Era',
    historyText: `The Cataldo Old Mission — officially the Mission of the Sacred Heart — stands as Idaho's oldest surviving building and one of the most significant historic structures in the entire American West. Completed in 1853 after five years of construction, the Neoclassical mission church was built by Jesuit missionaries and Coeur d'Alene tribal craftsmen entirely without nails, saws, or modern tools. Every timber, plank, beam, and arch was hewn by hand using only axes, chisels, and augers.\n\nThe church walls are constructed from a wattle-and-daub technique: hand-woven willow branches packed tightly with a mixture of dried grass and river mud, then whitewashed with locally sourced quicklime. The elegant interior features a hand-painted false-perspective ceiling painted by Brother Joseph Carignano, creating a stunning illusion of arched stone vaults in a humble frontier structure. The building withstood devastating floods in 1867, 1886, and 1917 that destroyed every other structure at the mission — only the stone church foundations, built 14 feet above the valley floor on a natural bluff, kept the walls standing.`,
    fastFact: "The Cataldo Mission was constructed entirely without metal nails: wooden pegs, leather lashing, and hand-packed river mud bind every joint — a 40,000-square-foot frontier church built by hand in five years with zero hardware.",
    sceneryHighlight: "White Neoclassical frontier church rising above the bottomland prairie with cedar forests behind and the Coeur d'Alene River valley spread below."
  },

  // ── Zone 11: Montana Big Sky & Glacier Going-to-the-Sun (28600 - 31200m) ──
  turnout_lake_mcdonald: {
    id: 'turnout_lake_mcdonald',
    zone: 11,
    zoneName: "Montana Big Sky & Glacier",
    milepost: 'MP 292.0',
    name: "Lake McDonald Glacial Vista & Colored Pebble Shore",
    sub: "1913 Swiss Chalet Cedar Lodge & Glacial Fjord Overlook",
    yearEst: 'EST. 1913 (Lewis Glacier Hotel)',
    elevation: '3,153 FT ELEVATION',
    coords: '48.6186° N, 113.8789° W',
    category: "GLACIAL LAKE & HISTORIC PARK CHALET",
    era: 'Great Northern Railway & Early Park Tourism Era',
    historyText: `Lake McDonald is the crown jewel of western Glacier National Park — a pristine, glacially carved fjord stretching 10 miles in length and plunging to depths of 472 feet. Its waters are so transparent that on calm mornings, submerged submerged trees and boulders are visible 30 feet below the surface. The lake is internationally renowned for its rainbow beds of smooth river pebbles: red, green, maroon, turquoise, and amber stones formed from ancient Precambrian mudstones of the Grinnell and Appekunny argillite formations.\n\nPerched along the northeastern shore sits the historic Lake McDonald Lodge, constructed in 1913–1914 by John Lewis as the Lewis Glacier Hotel. Designed by architect Kirtland Cutter in Swiss-chalet rustic revival style, the main lodge features an expansive three-story timber lobby framed by giant cedar logs, hand-carved balconies, massive river-rock fireplaces, and hanging hunting trophies and Native American trade blankets. Guests originally arrived by wooden motor launches across the lake before Going-to-the-Sun Road was completed.`,
    fastFact: "Lake McDonald's famous colored pebbles owe their brilliant hues to ancient iron oxidation: red and purple stones oxidized in shallow oxygen-rich mudflats 1.4 billion years ago, while green stones were deposited in deep oxygen-deprived waters.",
    sceneryHighlight: "Turquoise glacial fjord reflecting towering glaciated peaks, flanked by historic cedar chalets and shores of polished maroon and emerald pebbles."
  },

  turnout_logan_pass: {
    id: 'turnout_logan_pass',
    zone: 11,
    zoneName: "Montana Big Sky & Glacier",
    milepost: 'MP 308.0',
    name: "Logan Pass Continental Divide (6,646 ft)",
    sub: "Crown of the Continent Alpine Visitor Center & Highline Trailhead",
    yearEst: 'COMPLETED 1932 (Dedicated 1933)',
    elevation: '6,646 FT ELEVATION',
    coords: '48.6961° N, 113.7178° W',
    category: "CONTINENTAL DIVIDE & ALPINE PASS ROAD",
    era: 'Going-to-the-Sun Highway Engineering Triumph',
    historyText: `Logan Pass marks the highest point on the legendary Going-to-the-Sun Road, cresting the spine of the Continental Divide at 6,646 feet between the towering pyramids of Clements Mountain and Mount Reynolds. Precipitation falling to the west of the divide flows into the Pacific Ocean via the Columbia River basin, while runoff to the east travels across the Great Plains to Hudson Bay and the Gulf of Mexico.\n\nEngineered between 1921 and 1932 under Bureau of Public Roads civil engineer Frank A. Kittredge, the 50-mile Going-to-the-Sun Road is celebrated as one of the world's most daring civil engineering masterpieces. Road crews suspended in bosun's chairs drilled explosive blast holes into the sheer 3,000-foot vertical cliff face of the Garden Wall using compressed air lines. The road is famously navigated by Glacier's iconic fleet of 1936 White Motor Company Model 706 'Red Bus Jammers', whose roll-back canvas tops provide panoramic views of hanging glaciers, cascading snowmelt waterfalls, and resident herds of white mountain goats.`,
    fastFact: "Glacier's Red Buses earned the nickname 'Jammers' because early drivers had to vigorously 'jam' the unsynchronized manual transmissions between gears while climbing the brutal grades of the Garden Wall.",
    sceneryHighlight: "Sweeping 360-degree panorama of jagged glacial horn peaks, alpine tundra wildflower meadows, and historic stone arches overlooking the Continental Divide abyss."
  },

  // ── Zone 12: Las Vegas Strip & Red Rock Canyon (31200 - 33800m) ──
  turnout_vegas_sign: {
    id: 'turnout_vegas_sign',
    zone: 12,
    zoneName: "Las Vegas Strip & Red Rock",
    milepost: 'MP 318.0',
    name: "Welcome to Fabulous Las Vegas Neon Sign",
    sub: "1959 Betty Willis Googie Neon Masterpiece & Turf Median Plaza",
    yearEst: 'ERECTED MAY 1959',
    elevation: '2,180 FT ELEVATION',
    coords: '36.0820° N, 115.1728° W',
    category: "HISTORIC NEON ROADSIDE MONUMENT",
    era: 'Mid-Century Googie & Atomic Vegas Golden Age',
    historyText: `The 25-foot-tall 'Welcome to Fabulous Las Vegas' sign is universally recognized as the world's most famous roadside neon welcome beacon. Designed in May 1959 by pioneering commercial artist Betty Willis for Western Neon, the sign was commissioned by Clark County commissioners eager to greet tourists driving north up Highway 91 (the Los Angeles Highway) into the burgeoning casino strip.\n\nWillis intentionally declined to copyright the design, declaring it a public gift to the city she loved — enabling its imagery to proliferate worldwide as an emblem of American glamour, optimism, and desert nocturnal neon art. The design exemplifies Googie architecture: an elongated 8-pointed yellow starburst crown, seven blue circles framing white silver-dollar discs that spell out 'W-E-L-C-O-M-E' in homage to Nevada's Silver State heritage, cursive ruby-red neon lettering reading 'to Fabulous', and double-faced yellow incandescent running chaser bulbs framing a 50-degree tilted stretched diamond.\n\nIn 2008, Clark County constructed a dedicated median parking lot and landscaped turf island so travelers could safely photograph the historic monument on foot without darting across eight lanes of Las Vegas Boulevard traffic.`,
    fastFact: "Designer Betty Willis never copyrighted the sign: she considered it her personal gift to Las Vegas. The reverse side warmly bids travelers goodbye with: 'Drive Carefully • Come Back Soon'.",
    sceneryHighlight: "Iconic 1959 Googie diamond neon sign glowing radiant blue, ruby red, and amber gold above palm trees and turf median at twilight."
  },

  turnout_red_rock_canyon: {
    id: 'turnout_red_rock_canyon',
    zone: 12,
    zoneName: "Las Vegas Strip & Red Rock",
    milepost: 'MP 332.0',
    name: "Red Rock Canyon National Conservation Area",
    sub: "Keystone Thrust Fault & Aztec Sandstone Calico Hills Overlook",
    yearEst: 'EST. 1967 (Recreation Area) / 1990 (NCA)',
    elevation: '3,780 FT ELEVATION',
    coords: '36.1353° N, 115.4272° W',
    category: "NATIONAL CONSERVATION AREA & GEOLOGIC ESCARPMENT",
    era: 'Mesozoic Aztec Sandstone & Laramide Orogeny',
    historyText: `Just 15 miles west of the dazzling neon casino towers of Las Vegas lies Red Rock Canyon National Conservation Area — a breathtaking geological sanctuary dominated by the sheer 3,000-foot sandstone escarpment of the Spring Mountain Range. The vivid crimson, terracotta, salmon, and bleached ivory rock layers of the Calico Hills are remnants of an immense 180-million-year-old Jurassic sand sea (the Aztec Sandstone formation) whose petrified dunes were fossilized and later sculpted by millions of years of water, flash floods, and wind.\n\nThe canyon's most dramatic structural wonder is the Keystone Thrust Fault. During the late Mesozoic era approximately 65 million years ago, enormous tectonic compressional forces during the Sevier/Laramide mountain-building event shoved an ancient, 500-million-year-old grey Cambrian limestone plate eastward directly over the much younger 180-million-year-old red Jurassic sandstone — creating a striking, razor-sharp visual boundary where ancient dark grey crags sit directly atop blazing red cliffs.\n\nFor millennia, Southern Paiute peoples utilized the canyon's tinajas (natural sandstone water basins), leaving petroglyphs and agave roasting pits throughout the canyons, while today the conservation area protects critical habitat for desert tortoises, bighorn sheep, and soaring golden eagles.`,
    fastFact: "The Keystone Thrust Fault is one of the most vividly exposed geological thrust contacts on Earth: dark 500-million-year-old Cambrian limestone was thrust over younger 180-million-year-old red sandstone for miles.",
    sceneryHighlight: "Towering 3,000-ft banded crimson Aztec sandstone walls and desert tortoises under the towering silhouette of Mount Wilson and the Spring Mountains."
  }
};

// Attach freely available photographs to each database entry
for (const [id, item] of Object.entries(HISTORICAL_LORE_DATABASE)) {
  item.photos = LANDMARK_PHOTOS[id] || [];
}

/**
 * Helper to get historical lore by landmark/turnout ID
 */
export function getHistoricalLore(id) {
  return HISTORICAL_LORE_DATABASE[id] || null;
}

/**
 * Helper to get all historical lore items for a given zone index (0-8)
 */
export function getHistoricalLoreForZone(zoneIndex) {
  return Object.values(HISTORICAL_LORE_DATABASE).filter(item => item.zone === zoneIndex);
}

/**
 * Total count of historical archives in the game
 */
export const TOTAL_HISTORICAL_ARCHIVES = Object.keys(HISTORICAL_LORE_DATABASE).length;

export { LANDMARK_PHOTOS, getLandmarkPhotos };
