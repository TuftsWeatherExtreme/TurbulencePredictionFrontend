# combine_predictions.py
# Purpose: Merge NEXRAD and satellite GeoJSON predictions into a single
#          combined GeoJSON with a weighted ensemble severe_prob.
# Usage: python combine_predictions.py <nexrad.geojson> <satellite.geojson> <output.geojson>

import json
import sys
import math
from collections import defaultdict

# Weighting strategy: radar gets slightly more weight since it's been validated longer.
# These should sum to 1.0. Adjust as model accuracy improves.
NEXRAD_WEIGHT = 0.55
SATELLITE_WEIGHT = 0.45

# Spatial bucket size in degrees for matching nearby predictions
BUCKET_DEGREES = 0.25  # ~27km, matches radar grid resolution

# Max time difference in seconds to consider two predictions as "the same event"
MAX_TIME_DIFF_SECONDS = 900  # 15 minutes


def bucket_key(lon, lat, fl_ft):
    """Snap a point to a spatial/altitude bucket for matching."""
    return (
        round(lon / BUCKET_DEGREES) * BUCKET_DEGREES,
        round(lat / BUCKET_DEGREES) * BUCKET_DEGREES,
        round(fl_ft / 2000) * 2000,  # 2000 ft altitude bands
    )


def parse_time(t):
    """Parse ISO time string to seconds since epoch, returns None on failure."""
    from datetime import datetime, timezone
    try:
        dt = datetime.fromisoformat(str(t))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.timestamp()
    except Exception:
        return None


def combine(nexrad_path, satellite_path, output_path):
    with open(nexrad_path) as f:
        nexrad = json.load(f)
    with open(satellite_path) as f:
        satellite = json.load(f)

    # Index satellite features by spatial/altitude bucket
    sat_index = defaultdict(list)
    for feat in satellite["features"]:
        props = feat["properties"]
        coords = feat["geometry"]["coordinates"]
        key = bucket_key(coords[0], coords[1], props.get("flight_level_ft", 0))
        sat_index[key].append(feat)

    combined_features = []

    for nexrad_feat in nexrad["features"]:
        nprops = nexrad_feat["properties"]
        coords = nexrad_feat["geometry"]["coordinates"]
        key = bucket_key(coords[0], coords[1], nprops.get("flight_level_ft", 0))

        nexrad_prob = float(nprops.get("severe_prob", 0))
        nexrad_time = parse_time(nprops.get("pirep_time"))

        # Find closest satellite prediction in the same bucket
        best_sat = None
        best_time_diff = float("inf")
        for sat_feat in sat_index.get(key, []):
            sat_time = parse_time(sat_feat["properties"].get("pirep_time"))
            if nexrad_time and sat_time:
                diff = abs(nexrad_time - sat_time)
                if diff < best_time_diff and diff <= MAX_TIME_DIFF_SECONDS:
                    best_time_diff = diff
                    best_sat = sat_feat

        if best_sat is not None:
            # Both sources have a prediction here — weighted ensemble
            sat_prob = float(best_sat["properties"].get("severe_prob", 0))
            combined_prob = (NEXRAD_WEIGHT * nexrad_prob) + (SATELLITE_WEIGHT * sat_prob)
            source = "combined"
        else:
            # Only radar prediction available — use as-is but slightly discount
            # since we don't have satellite confirmation
            combined_prob = nexrad_prob * 0.85
            source = "nexrad_only"

        combined_features.append({
            "type": "Feature",
            "geometry": nexrad_feat["geometry"],
            "properties": {
                "source": source,
                "severe_prob": round(combined_prob, 4),
                "nexrad_prob": round(nexrad_prob, 4),
                "sat_prob": round(float(best_sat["properties"].get("severe_prob", 0)), 4) if best_sat else None,
                "pred_class": 1 if combined_prob >= 0.5 else 0,
                "flight_level_ft": nprops.get("flight_level_ft"),
                "pirep_time": nprops.get("pirep_time"),
                "patch_id": nprops.get("patch_id"),
            }
        })

    # Also add satellite-only predictions that had no radar match
    matched_sat_ids = set()
    for feat in combined_features:
        if feat["properties"]["source"] == "combined":
            matched_sat_ids.add(feat["properties"].get("patch_id"))

    for sat_feat in satellite["features"]:
        sprops = sat_feat["properties"]
        coords = sat_feat["geometry"]["coordinates"]
        key = bucket_key(coords[0], coords[1], sprops.get("flight_level_ft", 0))

        # Check if this satellite feature was already matched
        already_matched = any(
            bucket_key(f["geometry"]["coordinates"][0],
                      f["geometry"]["coordinates"][1],
                      f["properties"].get("flight_level_ft", 0)) == key
            for f in combined_features
            if f["properties"]["source"] == "combined"
        )

        if not already_matched:
            sat_prob = float(sprops.get("severe_prob", 0))
            combined_features.append({
                "type": "Feature",
                "geometry": sat_feat["geometry"],
                "properties": {
                    "source": "satellite_only",
                    "severe_prob": round(sat_prob * 0.85, 4),
                    "nexrad_prob": None,
                    "sat_prob": round(sat_prob, 4),
                    "pred_class": 1 if sat_prob >= 0.5 else 0,
                    "flight_level_ft": sprops.get("flight_level_ft"),
                    "pirep_time": sprops.get("pirep_time"),
                    "patch_id": sprops.get("patch_id"),
                }
            })

    output = {"type": "FeatureCollection", "features": combined_features}
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)

    # Summary
    n_combined = sum(1 for f in combined_features if f["properties"]["source"] == "combined")
    n_nexrad_only = sum(1 for f in combined_features if f["properties"]["source"] == "nexrad_only")
    n_sat_only = sum(1 for f in combined_features if f["properties"]["source"] == "satellite_only")
    print(f"Written {len(combined_features)} features to {output_path}")
    print(f"  combined: {n_combined}, nexrad_only: {n_nexrad_only}, satellite_only: {n_sat_only}")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        print(f"Usage: python {sys.argv[0]} <nexrad.geojson> <satellite.geojson> <output.geojson>")
        sys.exit(1)
    combine(sys.argv[1], sys.argv[2], sys.argv[3])