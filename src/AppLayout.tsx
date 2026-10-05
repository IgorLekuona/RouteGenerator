import React, { useState, useEffect, useReducer } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./AppLayout.css";
import { reverseGeocode } from './geocodeCache';

import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: icon,
  shadowUrl: iconShadow,
});

interface Point {
  lat: number;
  lon: number;
  pos: string;
}

interface TrackNode {
  node_lat: number;
  node_lon: number;
  node_alt: number;
  pk: string;
  pk_details: string;
}

function reducer(state: Point[], action) {
  switch (action.type) {
    case 'add_point':
      return [
        ...state,
        action.payload
      ]
    case 'delete_point': {
      const index = state.findIndex(p => p.lat === action.payload.lat && p.lon === action.payload.lon)

      return [
        ...state.slice(0, index),
        ...state.slice(index + 1),
      ]
    }
    case 'reorder_point': {
      const { from, to } = action.payload;
      if (from === to || from == null) return state;

      const newState = [...state];
      const [moved] = newState.splice(from, 1);
      // If removing `from` shifted everything after it left by one,
      // account for that before inserting at `to`
      const insertAt = from < to ? to - 1 : to;
      newState.splice(insertAt, 0, moved);
      return newState;
    }
    default:
      return state;
  }
}

const GRAPHHOPPER_API_KEY = "c380ee59-f04e-449a-8c49-bfccada6ae51"; // move to an env var, don't hardcode in shipped code

// Handles the "kick" Leaflet needs when its container starts at a layout-dependent size
const MapInvalidator: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 0);
  }, [map]);
  return null;
};

// Listens for map clicks and dispatches add_point while addingPoint is true
const ClickToAddPoint: React.FC<{
  addingPoint: boolean;
  onAdd: (point: Point) => void;
}> = ({ addingPoint, onAdd }) => {
  useMapEvents({
    async click(e) {
      if (!addingPoint) return;
      const geocode: any = await reverseGeocode(e.latlng.lat, e.latlng.lng);
      onAdd({ lat: e.latlng.lat, lon: e.latlng.lng, pos: ((geocode.raw.road || geocode.raw.street) + (geocode.raw.house_number ? (" " + geocode.raw.house_number) : "") + ", " + geocode.city) });
    },
  });
  return null;
};

const AppLayout: React.FC = () => {
  // const [selectedPoints, setSelectedPoints] = useState<Point[]>([]);
  const [state, dispatch] = useReducer(reducer, []);
  const [addingPoint, setAddingPoint] = useState(false);
  const [pointTrack, setPointTrack] = useState<[number, number][]>([]);
  const [trackDetails, setTrackDetails] = useState<TrackNode[]>([]);



  function handleDeletePoint(sp: Point) { dispatch({ type: 'delete_point', payload: sp }); setPointTrack([]); setTrackDetails([]); }

  function handleAddPoint(point: Point) { dispatch({ type: "add_point", payload: point }); setAddingPoint(false); }

  // const mapContainerRef = useRef<HTMLDivElement | null>(null);
  // const mapRef = useRef<L.Map | null>(null);

  // useEffect(() => {
  //   if (!mapContainerRef.current || mapRef.current) return;

  //   // Initialize the Leaflet map once
  //   mapRef.current = L.map(mapContainerRef.current).setView([43.320556, -1.975], 12);

  //   L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  //     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  //     maxZoom: 19,
  //   }).addTo(mapRef.current);

  //   // Leaflet needs a resize kick since its container starts at layout-dependent size
  //   setTimeout(() => mapRef.current?.invalidateSize(), 0);

  //   return () => {
  //     mapRef.current?.remove();
  //     mapRef.current = null;
  //   };
  // }, []);

  // const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Create the layer group once, right after the map is created
  // useEffect(() => {
  //   if (!mapContainerRef.current || mapRef.current) return;

  //   mapRef.current = L.map(mapContainerRef.current).setView([43.320556, -1.975], 12);

  //   L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  //     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  //     maxZoom: 19,
  //   }).addTo(mapRef.current);

  //   markersLayerRef.current = L.layerGroup().addTo(mapRef.current);

  //   setTimeout(() => mapRef.current?.invalidateSize(), 0);

  //   return () => {
  //     mapRef.current?.remove();
  //     mapRef.current = null;
  //   };
  // }, []);

  // Sync markers whenever state (the points array) changes
  // useEffect(() => {
  //   if (!markersLayerRef.current) return;

  //   markersLayerRef.current.clearLayers();

  //   state.forEach((sp, i) => {
  //     L.marker([sp.lat, sp.lon])
  //       .addTo(markersLayerRef.current!)
  //       .bindPopup(`Point ${i + 1}: ${sp.lat.toFixed(3)}, ${sp.lon.toFixed(3)}`);
  //   });
  // }, [state]);

  // useEffect(() => {
  //   if (!mapRef.current) return;

  //   const handleMapClick = (e: L.LeafletMouseEvent) => {
  //     dispatch({
  //       type: 'add_point',
  //       payload: { lat: e.latlng.lat, lon: e.latlng.lng }
  //     });
  //     setAddingPoint(false); // turn off after placing one point, remove if you want multi-add
  //   };

  //   if (addingPoint) {
  //     mapRef.current.on('click', handleMapClick);
  //   }

  //   return () => {
  //     mapRef.current?.off('click', handleMapClick);
  //   };
  // }, [addingPoint]);

  function createNumberedIcon(number: number) {
    return L.divIcon({
      className: "numbered-marker",
      html: `<div class="numbered-marker-inner"><span>${number}</span></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28], // bottom-center, like a pin tip
      popupAnchor: [0, -28],
    });
  }

  function getWaypointIndices(instructions: any[]): number[] {
    const indices: number[] = [0]; // route always starts at the first point

    for (const instr of instructions) {
      if (instr.sign === 5) {
        // VIA_REACHED — a via point was reached at the end of this instruction's interval
        indices.push(instr.interval[1]);
      } else if (instr.sign === 4) {
        // FINISH — the last instruction; its interval start is the final point
        indices.push(instr.interval[0]);
      }
    }

    return indices;
  }

  function buildTrackDetails(
    points: Point[],
    coordinates: [number, number][], // GraphHopper gives [lon, lat]
    wayPoints: number[]
  ): TrackNode[] {
    const details: TrackNode[] = [];

    for (let i = 0; i < points.length; i++) {
      // The stored waypoint itself: plain integer pk, pos as pk_details
      details.push({
        node_lat: points[i].lat,
        node_lon: points[i].lon,
        node_alt: 0,
        pk: `${i + 1}`,
        pk_details: points[i].pos,
      });

      const isLast = i === points.length - 1;
      if (isLast) break;

      const startIdx = wayPoints[i];
      const endIdx = wayPoints[i + 1];

      // Interpolated route points between this waypoint and the next one
      let subIndex = 1;
      for (let j = startIdx + 1; j < endIdx; j++) {
        const [lon, lat] = coordinates[j];
        details.push({
          node_lat: lat,
          node_lon: lon,
          node_alt: 0,
          pk: `${i + 1}.${subIndex}`,
          pk_details: "",
        });
        subIndex++;
      }
    }

    return details;
  }

  function formatDecimal(num: number, decimals = 6): string {
    return num.toFixed(decimals).replace(".", ",");
  }

  async function handleVisualizeTrack() {
    // console.log("Visualize track...");
    if (state.length < 2) {
      console.warn("Need at least 2 points to generate a track");
      return;
    }

    try {
      const pointsParam = state
        .map((p) => `point=${p.lat},${p.lon}`)
        .join("&");

      const url = `https://graphhopper.com/api/1/route?${pointsParam}&vehicle=car&locale=en&points_encoded=false&key=${GRAPHHOPPER_API_KEY}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`GraphHopper request failed: ${res.status}`);
      }

      const data = await res.json();
      const path = data.paths[0];
      const coordinates: [number, number][] = path.points.coordinates;
      const wayPointIndices = getWaypointIndices(path.instructions);

      // GraphHopper returns [lon, lat] (GeoJSON order) — flip to [lat, lon] for Leaflet
      const latLngs: [number, number][] = coordinates.map(([lon, lat]) => [lat, lon]);

      setPointTrack(latLngs);

      // Do the pk/pk_details mapping BEFORE storing into the new hook
      const details = buildTrackDetails(state, coordinates, wayPointIndices);
      console.log(details);
      setTrackDetails(details);
    } catch (err) {
      console.error("Error generating track:", err);
    }
  }

  function handleGenerateFile() {
    if (trackDetails.length === 0) {
      console.warn("No track details to export — run Visualize Track first");
      return;
    }

    const filename = window.prompt("Enter a file name:", `track_${Date.now()}`);
    if (!filename) return; // user cancelled or left it blank

    const header = "node_lat;node_lon;node_alt;pk;pk_details";

    const rows = trackDetails.map((node) =>
      [
        formatDecimal(node.node_lat),
        formatDecimal(node.node_lon),
        String(node.node_alt), // always 0, no decimal formatting needed
        node.pk,
        node.pk_details,
      ].join(";")
    );

    const csvContent = [header, ...rows].join("\n");

    // BOM so Excel opens accented characters (á, é, ñ, etc.) correctly
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  function handleDragStart(e: React.DragEvent, index: number) {
    setDraggedIndex(index);

    // Walk up from the number to its parent card, and use that as the drag ghost
    const card = (e.currentTarget as HTMLElement).closest('.point-span') as HTMLElement;
    if (card) {
      // offsetX/offsetY position the cursor within the ghost image —
      // roughly where the user actually clicked (the number) relative to the card
      const rect = card.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      e.dataTransfer.setDragImage(card, offsetX, offsetY);
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault(); // required — without this, onDrop never fires
  }

  function handleDrop(targetIndex: number) {
    if (draggedIndex !== null) {
      dispatch({ type: 'reorder_point', payload: { from: draggedIndex, to: targetIndex } });
    }
    setDraggedIndex(null);
    setPointTrack([]); setTrackDetails([]);
  }

  return (
    <div className="app-shell">
      <header className="header">
        <span className="header-title">CCT Route Generator</span>
        <div className="header-btn-div">
          <button onClick={handleVisualizeTrack}>Visualize track</button>
          <button onClick={handleGenerateFile}>Generate file</button>
        </div>
      </header>

      <div className="body">
        <aside className="sidebar">
          <span>Select points</span>
          <div className="point-list">
            {state.map((sp: Point, i: number) => (
              <div
                className="point-selected"
                key={i}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(i)}
              >
                <span className="point-span">
                  <b
                    draggable
                    onDragStart={(e) => handleDragStart(e, i)}
                    onDragEnd={() => setDraggedIndex(null)}
                    style={{ marginRight: "auto", cursor: "grab" }}
                  >
                    {i + 1}
                  </b>
                  <p style={{ fontSize: "10px" }}>
                    {/* {sp.lat.toFixed(3)}, {sp.lon.toFixed(3)} */}
                    {sp.pos}
                  </p>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16" height="16"
                    fill="red"
                    className="bi bi-trash3 delete-icon"
                    viewBox="0 0 16 16"
                    style={{ marginLeft: "auto" }}
                    onClick={() => handleDeletePoint(sp)}
                  >
                    <path d="M6.5 1h3a.5.5 0 0 1 .5.5v1H6v-1a.5.5 0 0 1 .5-.5M11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3A1.5 1.5 0 0 0 5 1.5v1H1.5a.5.5 0 0 0 0 1h.538l.853 10.66A2 2 0 0 0 4.885 16h6.23a2 2 0 0 0 1.994-1.84l.853-10.66h.538a.5.5 0 0 0 0-1zm1.958 1-.846 10.58a1 1 0 0 1-.997.92h-6.23a1 1 0 0 1-.997-.92L3.042 3.5zm-7.487 1a.5.5 0 0 1 .528.47l.5 8.5a.5.5 0 0 1-.998.06L5 5.03a.5.5 0 0 1 .47-.53Zm5.058 0a.5.5 0 0 1 .47.53l-.5 8.5a.5.5 0 1 1-.998-.06l.5-8.5a.5.5 0 0 1 .528-.47M8 4.5a.5.5 0 0 1 .5.5v8.5a.5.5 0 0 1-1 0V5a.5.5 0 0 1 .5-.5" />
                  </svg>
                </span>
                <span className="vert-span">
                  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="8" height="8">
                    <circle cx="50" cy="50" r="12.5" fill="black" />
                  </svg>
                  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="8" height="8">
                    <circle cx="50" cy="50" r="12.5" fill="black" />
                  </svg>
                  <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="8" height="8">
                    <circle cx="50" cy="50" r="12.5" fill="black" />
                  </svg>
                </span>
              </div>
            ))}
          </div>

          {addingPoint ?
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="red"
              className="bi bi-x-circle"
              viewBox="0 0 16 16"
              onClick={() => setAddingPoint(false)}
            >
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16" />
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
            </svg>
            :
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="green"
              className="bi bi-plus-circle-dotted add-icon"
              viewBox="0 0 16 16"
              onClick={() => setAddingPoint(true)}
            >
              <path d="M8 0q-.264 0-.523.017l.064.998a7 7 0 0 1 .918 0l.064-.998A8 8 0 0 0 8 0M6.44.152q-.52.104-1.012.27l.321.948q.43-.147.884-.237L6.44.153zm4.132.271a8 8 0 0 0-1.011-.27l-.194.98q.453.09.884.237zm1.873.925a8 8 0 0 0-.906-.524l-.443.896q.413.205.793.459zM4.46.824q-.471.233-.905.524l.556.83a7 7 0 0 1 .793-.458zM2.725 1.985q-.394.346-.74.74l.752.66q.303-.345.648-.648zm11.29.74a8 8 0 0 0-.74-.74l-.66.752q.346.303.648.648zm1.161 1.735a8 8 0 0 0-.524-.905l-.83.556q.254.38.458.793l.896-.443zM1.348 3.555q-.292.433-.524.906l.896.443q.205-.413.459-.793zM.423 5.428a8 8 0 0 0-.27 1.011l.98.194q.09-.453.237-.884zM15.848 6.44a8 8 0 0 0-.27-1.012l-.948.321q.147.43.237.884zM.017 7.477a8 8 0 0 0 0 1.046l.998-.064a7 7 0 0 1 0-.918zM16 8a8 8 0 0 0-.017-.523l-.998.064a7 7 0 0 1 0 .918l.998.064A8 8 0 0 0 16 8M.152 9.56q.104.52.27 1.012l.948-.321a7 7 0 0 1-.237-.884l-.98.194zm15.425 1.012q.168-.493.27-1.011l-.98-.194q-.09.453-.237.884zM.824 11.54a8 8 0 0 0 .524.905l.83-.556a7 7 0 0 1-.458-.793zm13.828.905q.292-.434.524-.906l-.896-.443q-.205.413-.459.793zm-12.667.83q.346.394.74.74l.66-.752a7 7 0 0 1-.648-.648zm11.29.74q.394-.346.74-.74l-.752-.66q-.302.346-.648.648zm-1.735 1.161q.471-.233.905-.524l-.556-.83a7 7 0 0 1-.793.458zm-7.985-.524q.434.292.906.524l.443-.896a7 7 0 0 1-.793-.459zm1.873.925q.493.168 1.011.27l.194-.98a7 7 0 0 1-.884-.237zm4.132.271a8 8 0 0 0 1.012-.27l-.321-.948a7 7 0 0 1-.884.237l.194.98zm-2.083.135a8 8 0 0 0 1.046 0l-.064-.998a7 7 0 0 1-.918 0zM8.5 4.5a.5.5 0 0 0-1 0v3h-3a.5.5 0 0 0 0 1h3v3a.5.5 0 0 0 1 0v-3h3a.5.5 0 0 0 0-1h-3z" />
            </svg>}
        </aside>

        <main className="map-wrapper">
          {/* <div ref={mapContainerRef} className="map" /> */}
          <MapContainer
            center={[43.320556, -1.975]}
            zoom={12}
            className="map"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
            <MapInvalidator />
            <ClickToAddPoint addingPoint={addingPoint} onAdd={handleAddPoint} />
            {state.map((sp: Point, i: number) => (
              <Marker key={i} position={[sp.lat, sp.lon]} icon={createNumberedIcon(i + 1)}>
                <Popup>
                  Point {i + 1}: {sp.lat.toFixed(3)}, {sp.lon.toFixed(3)}
                </Popup>
              </Marker>
            ))}
            {pointTrack.length > 0 && (
              <Polyline positions={pointTrack} pathOptions={{ color: "#1ee53f", weight: 4 }} />
            )}
          </MapContainer>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;