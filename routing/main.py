from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Tuple, Optional
import networkx as nx
import math

app = FastAPI(title="GreenPulse Routing Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Try to load OSM data — fall back to pure math if unavailable
G = None
try:
    import osmnx as ox
    print("Loading Accra road network from OpenStreetMap...")
    G = ox.graph_from_place("Accra, Ghana", network_type="drive")
    G = ox.add_edge_speeds(G)
    G = ox.add_edge_travel_times(G)
    print("✅ Road network loaded.")
except Exception as e:
    print(f"⚠️  OSM unavailable ({e}). Using haversine fallback.")


class Target(BaseModel):
    lat: float
    lng: float
    id: str
    severity: Optional[str] = "MEDIUM"


class RouteRequest(BaseModel):
    start: Tuple[float, float]
    targets: List[Target]


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1))
         * math.cos(math.radians(lat2))
         * math.sin(dlon / 2) ** 2)
    return R * 2 * math.asin(math.sqrt(a))


PRIORITY = {"CRITICAL": 1, "HIGH": 2, "MEDIUM": 3, "LOW": 4}


@app.get("/")
def health():
    return {
        "status": "GreenPulse Routing Service 🛣️",
        "osm_loaded": G is not None,
    }


@app.post("/optimize")
def optimize_route(req: RouteRequest):
    start_lat, start_lng = req.start

    if G is not None:
        try:
            import osmnx as ox
            start_node = ox.nearest_nodes(G, start_lng, start_lat)
            ordered = []
            remaining = list(req.targets)
            current_node = start_node

            while remaining:
                def score(t):
                    try:
                        tn = ox.nearest_nodes(G, t.lng, t.lat)
                        dist = nx.shortest_path_length(
                            G, current_node, tn, weight="travel_time"
                        )
                    except Exception:
                        dist = haversine_km(start_lat, start_lng, t.lat, t.lng) * 1000
                    return dist * PRIORITY.get(t.severity, 3)

                nearest = min(remaining, key=score)
                ordered.append(nearest)
                remaining.remove(nearest)
                current_node = ox.nearest_nodes(G, nearest.lng, nearest.lat)

            total_km = sum(
                haversine_km(ordered[i].lat, ordered[i].lng,
                             ordered[i + 1].lat, ordered[i + 1].lng)
                for i in range(len(ordered) - 1)
            ) if len(ordered) > 1 else 0

            return {
                "route": [
                    {"lat": t.lat, "lng": t.lng, "id": t.id, "severity": t.severity}
                    for t in ordered
                ],
                "distance_km": round(total_km, 2),
                "algorithm": "dijkstra_osm",
            }

        except Exception as e:
            print(f"OSM routing error: {e} — falling back")

    # ── Haversine + priority fallback ──
    def fallback_score(t):
        dist = haversine_km(start_lat, start_lng, t.lat, t.lng)
        return dist * PRIORITY.get(t.severity, 3)

    ordered = sorted(req.targets, key=fallback_score)
    total_km = sum(
        haversine_km(ordered[i].lat, ordered[i].lng,
                     ordered[i + 1].lat, ordered[i + 1].lng)
        for i in range(len(ordered) - 1)
    ) if len(ordered) > 1 else 0

    return {
        "route": [
            {"lat": t.lat, "lng": t.lng, "id": t.id, "severity": t.severity}
            for t in ordered
        ],
        "distance_km": round(total_km, 2),
        "algorithm": "haversine_priority_fallback",
    }
