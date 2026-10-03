// Every stockist, once. The page cards and the finder's map pins used to be
// two hand-written lists, and the three venues added on 3 Oct 2026 got cards
// with no pins because only one list was updated. Add a venue here and both
// surfaces carry it. Coordinates are OpenStreetMap results for the street
// address; logos live on Cloudflare Images.

export type StockistRecord = {
  id: string
  name: string
  address: string
  streetAddress: string
  addressLocality: string
  postalCode: string
  description: string
  website: string
  websiteLabel?: string
  logo: string
  type: string
  location: string
  schemaType: 'BarOrPub' | 'Store'
  lat: number
  lng: number
  mapType: 'independent' | 'bar' | 'restaurant' | 'online'
}

export const STOCKISTS: StockistRecord[] = [
  {
    id: 'the-bank-blackpool',
    name: 'The Bank Bar & Grill',
    address: '28 Corporation St, Blackpool FY1 1EJ',
    streetAddress: '28 Corporation St',
    addressLocality: 'Blackpool',
    postalCode: 'FY1 1EJ',
    description: 'Family run Bar & Grill restaurant in the centre of Blackpool. Serving Brunch and evening A La Carte Menu.',
    website: 'https://www.thebankblackpool.com/',
    logo: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/9084080c-6c1f-45e5-e29f-9b939ad44100/public',
    type: 'Bar & Grill',
    location: 'Blackpool, Lancashire',
    schemaType: 'BarOrPub',
    lat: 53.81795,
    lng: -3.05376,
    mapType: 'bar',
  },
  {
    id: 'spin-the-black-circle-worcester',
    name: 'Spin the Black Circle',
    address: '19-21 Pump Street, Worcester WR1 2QX',
    streetAddress: '19-21 Pump Street',
    addressLocality: 'Worcester',
    postalCode: 'WR1 2QX',
    description: 'Independent record shop and cultural hub in the heart of Worcester. Vinyl, music, and a passion for things done properly.',
    website: 'https://www.spintheblack.com/',
    logo: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/2a07131a-94d4-4817-90c3-15ccb9c54700/public',
    type: 'Independent',
    location: 'Worcester, Worcestershire',
    schemaType: 'Store',
    lat: 52.19093,
    lng: -2.21937,
    mapType: 'independent',
  },
  {
    id: 'the-bull-inn-newington',
    name: 'The Bull Inn',
    address: '32 High St, Newington, Sittingbourne ME9 7JP',
    streetAddress: '32 High St',
    addressLocality: 'Newington',
    postalCode: 'ME9 7JP',
    description: 'A friendly pub in the heart of Newington village. Grade II listed, with origins dating to the 17th century. The sort of place that has been part of the community for a very long time.',
    website: 'https://www.facebook.com/thebullpubnewington/',
    websiteLabel: 'Visit Facebook page',
    logo: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/302d8530-c831-4540-e297-b32c09ae2c00/public',
    type: 'Pub',
    location: 'Newington, Kent',
    schemaType: 'BarOrPub',
    lat: 51.3519,
    lng: 0.6676,
    mapType: 'bar',
  },
  {
    id: 'the-retro-lounge-blackpool',
    name: 'The Retro Lounge',
    address: '3-5 Clifton Street, Blackpool FY1 1JD',
    streetAddress: '3-5 Clifton Street',
    addressLocality: 'Blackpool',
    postalCode: 'FY1 1JD',
    description: 'A vintage cocktail bar on Clifton Street, opposite North Pier. Classic cocktails and classic music, from 70s pop to 90s club anthems, with DJs and karaoke nights.',
    website: 'https://www.retrolounges.co.uk/',
    logo: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/06c3deb3-4753-4879-8c0b-e518432e9000/public',
    type: 'Cocktail Bar',
    location: 'Blackpool, Lancashire',
    schemaType: 'BarOrPub',
    lat: 53.8188257,
    lng: -3.0537418,
    mapType: 'bar',
  },
  {
    id: 'the-victory-hereford',
    name: 'The Victory',
    address: '88 Saint Owen St, Hereford HR1 2QD',
    streetAddress: '88 Saint Owen St',
    addressLocality: 'Hereford',
    postalCode: 'HR1 2QD',
    description: 'A well-loved pub and restaurant on St Owen Street, known for its breakfasts, its live events, and a proper welcome. Popular with Hereford locals and visitors alike.',
    website: 'https://www.facebook.com/TheVictoryHfd/',
    websiteLabel: 'Visit Facebook page',
    logo: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/50904380-16e8-4014-a055-322e30a4d500/public',
    type: 'Pub & Restaurant',
    location: 'Hereford, Herefordshire',
    schemaType: 'BarOrPub',
    lat: 52.0538,
    lng: -2.7082,
    mapType: 'bar',
  },
  {
    id: 'the-lichfield-vaults-hereford',
    name: 'The Lichfield Vaults',
    address: '11 Church St, Hereford HR1 2LR',
    streetAddress: '11 Church St',
    addressLocality: 'Hereford',
    postalCode: 'HR1 2LR',
    description: 'A traditional pub tucked away on Church Street in Hereford city centre, a minute from the Cathedral and High Town. Wood panelling, coal fires in winter, a large decked seating area outside, and a welcome that makes everyone part of the family. Dogs on leads welcome.',
    website: 'https://www.lichfieldvaultshereford.co.uk/',
    logo: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/11f2d5c4-842c-42d2-436f-9f8f6738de00/public',
    type: 'Pub',
    location: 'Hereford, Herefordshire',
    schemaType: 'BarOrPub',
    lat: 52.055546,
    lng: -2.716291,
    mapType: 'bar',
  },
  {
    id: 'saxtys-hereford',
    name: 'Saxtys',
    address: '33 Widemarsh St, Hereford HR4 9EA',
    streetAddress: '33 Widemarsh St',
    addressLocality: 'Hereford',
    postalCode: 'HR4 9EA',
    description: 'Independent cocktail bar, restaurant and club on Widemarsh Street, in the centre of Hereford since 1977. Four bars across the building, a steakhouse restaurant, and a late-night club.',
    website: 'https://saxtys.co.uk/',
    logo: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/596d2515-d7f5-4ac3-79d6-bdb9479ae400/public',
    type: 'Cocktail Bar',
    location: 'Hereford, Herefordshire',
    schemaType: 'BarOrPub',
    lat: 52.0574211,
    lng: -2.7163352,
    mapType: 'bar',
  },
  {
    id: 'underground-alt-blackpool',
    name: 'Underground Alt',
    address: '168-170 Promenade, Blackpool FY1 1RE',
    streetAddress: '168-170 Promenade',
    addressLocality: 'Blackpool',
    postalCode: 'FY1 1RE',
    description: 'Blackpool\'s grassroots home for alternative music, on the Promenade. Alt bands, alt club nights, and a sound system that does not apologise.',
    website: 'https://www.undergroundalt.co.uk/',
    logo: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/7b18d7e7-1a42-4c4a-4252-b07d64963900/public',
    type: 'Bar & Club',
    location: 'Blackpool, Lancashire',
    schemaType: 'BarOrPub',
    lat: 53.8201632,
    lng: -3.0553166,
    mapType: 'bar',
  },
  {
    id: 'which-craft-tap-room-blackpool',
    name: 'Which Craft Tap Room',
    address: '1 Birley Street, Blackpool FY1 1EG',
    streetAddress: '1 Birley Street',
    addressLocality: 'Blackpool',
    postalCode: 'FY1 1EG',
    description: 'A micropub on Birley Street in the town centre, open since August 2026. Belgian and German bottled beers, two cask ales, and live music upstairs.',
    website: 'https://www.instagram.com/whichcraft_taproom/',
    websiteLabel: 'Visit Instagram page',
    logo: 'https://imagedelivery.net/T4IfqPfa6E-8YtW8Lo02gQ/3d79cbb7-44fb-4c53-8c32-422f0ad10b00/public',
    type: 'Micropub',
    location: 'Blackpool, Lancashire',
    schemaType: 'BarOrPub',
    lat: 53.8180739,
    lng: -3.0536098,
    mapType: 'bar',
  },
]
