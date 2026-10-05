const cache = new Map()

const key = (lat, lon) =>
  `${parseFloat(lat).toFixed(5)},${parseFloat(lon).toFixed(5)}`

export async function reverseGeocode(lat, lon) {
  const k = key(lat, lon)

  if (cache.has(k)) {
    console.log("Dir is in cache: ", cache.get(k));
    return { ...cache.get(k), fromCache: true }
  }

  console.log("There is no Dir in cache.");

  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`,
    { headers: { 'Accept-Language': 'en', 'User-Agent': 'YourAppName/1.0' } }
  )

  if (!res.ok) throw new Error(`Nominatim error: ${res.status}`)

  const data = await res.json()
  const addr = data.address ?? {}

  const result = {
    street : addr.road ?? addr.pedestrian ?? addr.path ?? addr.footway ?? null,
    city   : addr.city ?? addr.town ?? addr.village ?? null,
    display: data.display_name,
    raw    : addr,
  }

  cache.set(k, result)
  return { ...result, fromCache: false }
}

export const clearGeocodeCache = () => cache.clear()
export const getGeocodeCache   = () => new Map(cache)   // read-only snapshot