import { tracks, type Track } from '@/curriculum'

const shortTitles = {
  algorithms: 'Algorithms',
  'js-ts-core': 'JS/TS Core',
  frontend: 'Frontend',
  'backend-data': 'Backend/Data',
  production: 'Production',
}

export function getTrackShortTitle(track: Pick<Track, 'id' | 'title'>) {
  return shortTitles[track.id as keyof typeof shortTitles] ?? track.title
}

export const trackPreviewItems = tracks.map((track) => ({
  ...track,
  shortTitle: getTrackShortTitle(track),
}))
