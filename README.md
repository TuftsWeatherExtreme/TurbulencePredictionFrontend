# Senior Capstone Project - Frontend
- This frontend was a collaborative project between teams Sky Blue and Celestial Blue. it was inspired by the [Aviation Weather Center's Graphical Forecasts for Aviation](https://aviationweather.gov/gfa/#turb) website.
- The frontend was built using [Next.js](https://nextjs.org) and TypeScript
- Tailwind CSS is used for styling
- We also used [Mapbox](https://www.mapbox.com/) for the map functionality and Tailwind CSS for styling
- In order to run the frontend, you will need to have Node.js and npm installed on your machine, as well as a Mapbox access token

## Relevant Files and Architectural Overview
- The main components that make up the frontend are located in the `app/components/controls` directory, and rely on UI components defined in the `app/components/ui` directory.
- The main components are:
  - `app/components/controls/FlightLevelSlider.tsx` - this component contains the slider on the left side of the map that allows users to select a flight level / altitude to show predictions for. Note that a Flight Level is in hundreds of feet
  (FLxxx = xxx * 100 ft)
  - `app/components/controls/TimeSlider.tsx` - this component contains the slider on the bottom of the map that allows users to select a time (in zulu) to show predictions for.

  - `app/components/controls/Legend.tsx` - this component contains the legend that correlates the color of the predictions to the intensity of turbulence.

  - `app/components/controls/SourcePicker.tsx` - this component contains the dropdown menu that allows users to select the source of the data. The options are "Satellite" and "Radar". When a user selects a different source, the map is re-colored to reflect the new source. By default, both sources are selected, meaning the predictions of both models are shown, blended at 50/50.

  - `app/components/controls/AircraftPicker.tsx` - this component contains the dropdown menu that allows users to select the weight of the aircraft type, which is factored into the prediction intensity for satellite data. When a user selects a different aircraft size, the satellite data is re-colored to reflect more or less intense turbulence.

- all these components are combined in the Map component which is at `app/components/Map.tsx`, and this Map component is used in `app/page.tsx`.

#### Displaying Predictions
- The map loads **raster image overlays** (Mapbox `image` + `raster` layers). Tile URLs follow:
  - `{tileBase}/{source}/frame{num}/alt{idx}.{extension}`
  - `{source}` is `sat` or `rad`; `{num}` is the time slider index; `{idx}` is the altitude slider index (zero-padded).
- **Where `tileBase` comes from** (first match wins):
  1. `NEXT_PUBLIC_TILE_BASE` in `.env` (optional `NEXT_PUBLIC_TILE_EXT`, default `gif`) — use this for a CDN or static host in production.
  2. Otherwise `public/predictions/latest.json` with `{ "tileBase": "...", "extension": "png" }`.
  3. Otherwise bundled static demo tiles: `public/frames/...` as `.gif` files.
- **Development dummy tiles:** If `latest.json` points `tileBase` at `/api/predictions/tiles` and `extension` at `png`, the Next.js route generates solid-color PNGs so time/altitude sliders visibly change (no real model). Remove or override that manifest when using real model outputs.
- **Production direction:** A scheduled job (e.g. hourly) can write new tiles to object storage and set `NEXT_PUBLIC_TILE_BASE` to that URL prefix; the frontend then needs no redeploy for new images.


## Getting Started

### Acquiring a Mapbox Access Token
- In order to use Mapbox, you will need to create an account and get an access token.
- You can do this by going to the [Mapbox website](https://www.mapbox.com/) and signing up for a free account [here](https://www.mapbox.com/signup/).
- As of setting up our accounts in Spring 2025, if you use an institutional email, you must enter a billing address, but no actual billing method so you will not accidentally get charged for usage.
- Once you have signed up, you can create a new access token by going to the [Access Tokens page](https://account.mapbox.com/access-tokens/) and clicking on the "Create a token" button.
- You can name the token whatever you like, but make sure to select the "Default public token" option.
- Once you have created the token, you will see a long string of letters and numbers. This is your access token, and you will need to copy it to use in the next step.
- Then you will need to create a `.env` file in the root of the project and add the following line to it:
```
NEXT_PUBLIC_MAPBOX_TOKEN=your_access_token_here
```
- Make sure to replace `your_access_token_here` with the actual access token you copied from the Mapbox website.

### Running the Frontend

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
(may need to install relevant packages with `npm install` first)


Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can edit the page by modifying `app/page.tsx`. The page auto-updates as you save the file.

## Additional Notes
This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

#### Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

#### Deploy on Vercel

Deployment of this Next.js app can be done using the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

-------------------------------------- WORK DONE BY RAZZLE DAZZLE ROSE TEAM FA25/SP26 ------------------------------
## Capstone Backend-to-Frontend Prediction Pipeline Guide

This section explains the final backend-to-frontend pipeline used in our Senior Capstone project to generate and visualize turbulence predictions from both **NEXRAD radar data** and **GOES-18 satellite data**. These commands correspond to the exact workflow used to create the predictions shown in our final presentation demo. Our demo displayed **severe turbulence predictions for December 2024**.

### Overview
Our system predicts turbulence events using two independent machine learning pipelines:

#### Radar-Based Pipeline
- Uses NEXRAD Level-II radar data
- Processes radar scans into model-ready inputs
- Runs a trained ResNet model
- Exports predictions into GeoJSON format

#### Satellite-Based Pipeline
- Uses GOES-18 satellite imagery
- Processes temporal image sequences
- Runs a trained 3D CNN model
- Exports predictions into GeoJSON format

Both pipelines ultimately generate `.geojson` prediction files which are (currently) copied into the frontend application and rendered visually on an interactive map.

### Overall Data Flow

Raw Weather Data  
↓  
Preprocessed Model Inputs  
↓  
Trained ML Model Inference  
↓  
GeoJSON Prediction Export  
↓  
Transfer GeoJSON to Frontend  
↓  
Frontend Map Visualization  

### How to get from RADAR predictions to frontend output

#### Step 1 — Extract compressed radar inputs
The radar model inputs were stored as compressed archives to reduce storage usage on the HPC system.

Run this command on HPC:

```bash
TMP_DIR="$(mktemp -d)" && \
tar -xJf "/cluster/tufts/capstone25skyblue/UTLN/NEXRADTurbulencePrediction/model_inputs/compressed/2024_12.tar.xz" \
  -C "$TMP_DIR"
```

What this does:
- Creates a temporary directory
- Extracts the compressed radar model inputs for December 2024
- Places extracted files into the temporary directory

Why this is necessary:
- Radar model inputs are large, so compressing them:
  - saves storage space
  - improves organization
  - reduces long-term disk usage
- The temporary directory ensures files are cleaned up after prediction generation.

#### Step 2 — Run radar model inference
Run this command on HPC:

```bash
python -u "/cluster/tufts/capstone25skyblue/UTLN/NEXRADTurbulencePrediction/model_training/export_predictions_geojson.py" \
  --model-type resnet \
  --weights "/cluster/tufts/capstone25skyblue/UTLN/NEXRADTurbulencePrediction/model_training/trained_model_outputs/2026-04-17T14:42:23.042415_best_resnet_model_w_seed_42.pth" \
  --input-dir "$TMP_DIR/2024_12" \
  --recursive \
  --pireps-csv "/cluster/tufts/capstone25skyblue/UTLN/NEXRADTurbulencePrediction/radars/pirep_with_radar_data/2024/12.csv" \
  --output "/tmp/preds_radar_2024_12.geojson"
```

Explanation of parameters:
- `--model-type resnet`: Uses the ResNet-based radar classifier
- `--weights`: Path to trained model weights
- `--input-dir`: Directory containing processed radar inputs
- `--recursive`: Searches through nested directories
- `--pireps-csv`: Pilot report metadata used for alignment/evaluation
- `--output`: Output GeoJSON prediction file

#### Step 3 — Clean up temporary files
Run this command on HPC:

```bash
rm -rf "$TMP_DIR"
```

Radar data flow (conceptual):

Compressed Radar Inputs (`.tar.xz`)  
↓  
Temporary Extraction  
↓  
Processed Radar Arrays  
↓  
ResNet Inference  
↓  
Prediction Probabilities  
↓  
GeoJSON Export  

#### Copy radar predictions to the frontend
Run this command on your local terminal:

```bash
scp <yourUTLN>@login-p03.pax.tufts.edu:/tmp/preds_radar_2024_12.geojson \
  "path/to/TurbulencePredictionFrontend/public/predictions/preds_radar_2024_12.geojson"
```

Note: For the `login-p03.pax.tufts.edu` part, ensure it is correct by running `hostname` on HPC (use that value in place of `login-p03.pax.tufts.edu`).

What this does:
- Securely copies the generated GeoJSON file from the Tufts HPC cluster
- Places it directly into the frontend application's public predictions directory

### How to get from SATELLITE predictions to frontend output

#### Step 1 — Run satellite model inference
Run this command on HPC:

```bash
python -u export_predictions_geojson.py \
  --model-type cnn \
  --weights "/cluster/tufts/capstone25skyblue/UTLN/SatelliteTurbulencePrediction/src/trained_model_outputs/2026_04_18_01_00_conv3d_seed_42.pth" \
  --input-dir "/cluster/tufts/capstone25skyblue/UTLN/SatelliteTurbulencePrediction/model_inputs" \
  --year 2024 --month 12 \
  --output "/tmp/preds_satellite_2024_12.geojson"
```

Explanation of parameters:
- `--model-type cnn`: Uses the satellite CNN model
- `--weights`: Trained 3D CNN weights
- `--input-dir`: Satellite model input directory
- `--year / --month`: Selects dataset timeframe
- `--output`: Output GeoJSON predictions

Satellite data flow (conceptual):

GOES-18 Satellite Imagery  
↓  
Preprocessed Image Sequences  
↓  
3D CNN Inference  
↓  
Prediction Probabilities  
↓  
GeoJSON Export  

#### Copy satellite predictions to the frontend
Run this command on your local terminal:

```bash
scp <yourUTLN>@login-p03.pax.tufts.edu:/tmp/preds_satellite_2024_12.geojson \
  "path/to/TurbulencePredictionFrontend/public/predictions/preds_satellite_2024_12.geojson"
```

This transfers the satellite prediction GeoJSON file into the frontend visualization directory.

### Frontend integration
The frontend application reads prediction files from:
- `/public/predictions/`

Examples:
- `preds_radar_2024_12.geojson`
- `preds_satellite_2024_12.geojson`
- `preds_combined_2024_12.geojson`

These GeoJSON files are loaded into the frontend map visualization system and displayed as prediction overlays.

### Why GeoJSON was used
GeoJSON was selected because it:
- Integrates naturally with web mapping libraries
- Stores geographic coordinates cleanly
- Supports metadata for predictions/probabilities
- Is lightweight and frontend-friendly
- Works well with React/Next.js mapping frameworks

### Notes on reproducibility
Our pipeline was designed to support reproducibility by:
- Using fixed trained model checkpoints
- Keeping model weights versioned
- Organizing data by year/month
- Maintaining consistent GeoJSON export formatting
- Separating backend inference from frontend visualization
