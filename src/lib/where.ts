/* Browser only — it asks the phone where it is. */

export type Coords = { lat: number | null; lng: number | null; accuracy: number | null };
const NOWHERE: Coords = { lat: null, lng: null, accuracy: null };
const GOOD_ENOUGH_M = 20;
const LISTEN_MS = 6000;

/** Best-effort coordinates. Every photograph carries where it was taken;
    if the phone will not say, we record that honestly rather than guess.

    `precise` is for the door, where the reading is held against the pin:
    a phone's first fix is often a wifi guess a few hundred metres out, so
    it listens for a few seconds and keeps the best, stopping early once
    one is good enough. A photo mid-checklist takes the first answer. */
export function where({ precise = false } = {}): Promise<Coords> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(NOWHERE);
    const read = (p: GeolocationPosition): Coords => ({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy });

    if (!precise) {
      navigator.geolocation.getCurrentPosition((p) => resolve(read(p)), () => resolve(NOWHERE), { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 });
      return;
    }

    let best: Coords = NOWHERE;
    const finish = () => { navigator.geolocation.clearWatch(watch); clearTimeout(timer); resolve(best); };
    const watch = navigator.geolocation.watchPosition(
      (p) => {
        const c = read(p);
        if (best.accuracy === null || (c.accuracy ?? Infinity) < best.accuracy) best = c;
        if ((best.accuracy ?? Infinity) <= GOOD_ENOUGH_M) finish();
      },
      () => { if (best.lat === null) finish(); },
      { enableHighAccuracy: true, maximumAge: 0 },
    );
    const timer = setTimeout(finish, LISTEN_MS);
  });
}
