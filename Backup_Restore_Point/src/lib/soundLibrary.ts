export type SoundTrack = {
  id: number;
  title: string;
  artist: string;
  duration: string;
  url: string;
  license: string;
  source: string;
  clipStartSeconds: number;
  clipEndSeconds: number;
};

export const SOUND_TRACKS: SoundTrack[] = [
  {
    id: 1,
    title: 'No Music',
    artist: '-',
    duration: '0:00',
    url: '',
    license: '-',
    source: 'Local',
    clipStartSeconds: 0,
    clipEndSeconds: 0
  },
  {
    id: 2,
    title: 'SoundHelix Song 1',
    artist: 'SoundHelix',
    duration: '6:12',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    license: 'Demo / verify license',
    source: 'soundhelix.com',
    clipStartSeconds: 30,
    clipEndSeconds: 150
  },
  {
    id: 3,
    title: 'SoundHelix Song 2',
    artist: 'SoundHelix',
    duration: '7:05',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    license: 'Demo / verify license',
    source: 'soundhelix.com',
    clipStartSeconds: 30,
    clipEndSeconds: 150
  },
  {
    id: 4,
    title: 'SoundHelix Song 3',
    artist: 'SoundHelix',
    duration: '5:15',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    license: 'Demo / verify license',
    source: 'soundhelix.com',
    clipStartSeconds: 20,
    clipEndSeconds: 140
  },
  {
    id: 5,
    title: 'SoundHelix Song 8',
    artist: 'SoundHelix',
    duration: '5:25',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    license: 'Demo / verify license',
    source: 'soundhelix.com',
    clipStartSeconds: 20,
    clipEndSeconds: 140
  },
  {
    id: 6,
    title: 'Enthusiast',
    artist: 'Tours',
    duration: '3:15',
    url: 'https://files.freemusicarchive.org/storage-freemusicarchive-org/music/no_curator/Tours/Enthusiast/Tours_-_01_-_Enthusiast.mp3',
    license: 'Creative Commons (verify on source)',
    source: 'freemusicarchive.org',
    clipStartSeconds: 0,
    clipEndSeconds: 120
  },
  {
    id: 7,
    title: 'Moonlight Sonata (1st Movement)',
    artist: 'Beethoven (Public Domain)',
    duration: '5:15',
    url: 'https://upload.wikimedia.org/wikipedia/commons/transcoded/f/f7/Moonlight_Sonata_1st_Movement.ogg/Moonlight_Sonata_1st_Movement.ogg.mp3',
    license: 'Public Domain (composition) / verify recording on source',
    source: 'Wikimedia Commons',
    clipStartSeconds: 0,
    clipEndSeconds: 180
  },
  {
    id: 8,
    title: 'Romanian Folk Dances (Bartók)',
    artist: 'Advent Chamber Orchestra',
    duration: '2:08',
    url: 'https://commons.wikimedia.org/wiki/Special:FilePath/Bartok_-_Romanian_Folk_Dances.ogg',
    license: 'CC BY-SA 2.0 (per Wikimedia Commons)',
    source: 'Wikimedia Commons',
    clipStartSeconds: 0,
    clipEndSeconds: 120
  }
];
