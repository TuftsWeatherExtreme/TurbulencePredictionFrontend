# Senior Capstone Project - Frontend
- This frontend was a collaborative project between teams Sky Blue and Celestial Blue. it was inspired by the [Aviation Weather Center's Graphical Forecasts for Aviation](https://aviationweather.gov/gfa/#turb) website.

- The frontend was built using [Next.js](https://nextjs.org) and TypeScript
- We also used [Mapbox](https://www.mapbox.com/) for the map functionality and Tailwind CSS for styling
- In order to run the frontend, you will need to have Node.js and npm installed on your machine, as well as a Mapbox access token

## Relevant Files and Architectural Overview
- The main components that make up the frontend are located in the `app/components/controls` directory, and rely on UI components defined in the `app/components/ui` directory.
- The main components are:
  - `app/components/controls/FlightLevelSlider.tsx` - this component contains the slider on the left side of the map that allows users to select a flight level / altitude to show predictions for.
  - `app/components/controls/TimeSlider.tsx` - this component contains the slider on the bottom of the map that allows users to select a time to show predictions for.

  - `app/components/controls/Legend.tsx` - this component contains the legend that correlates the color of the predictions to the intensity of turbulence.

  - `app/components/controls/SourcePicker.tsx` - this component contains the dropdown menu that allows users to select the source of the data. The options are "Satellite" and "Radar". When a user selects a different source, the map is re-colored to reflect the new source. By default, both sources are selected, meaning the predictions of both models are shown, at 70% capacity.

  - `app/components/controls/AircraftPicker.tsx` - this component contains the dropdown menu that allows users to select the weight of the aircraft type, which is factored into the prediction intensity for satellite data. When a user selects a different aircraft size, the satellite data is re-colored to reflect more or less intense turbulence.

- all these components are combined in the Map component which is at `app/components/Map.tsx`, and this Map component is used in `app/page.tsx`.

#### Displaying Predictions
- in order to display predictions on the map, we used Mapbox raster tiles, which are `.gif` files stored at `public/frames/{source}/frame{num}/alt{idx}.gif` where `{source}` is the source of the data (either "sat" for satellite or "rad" for radar), `{num}` is the frame number, which represents the index along the time slider, and `{idx}` is the index of the altitude.
- In the future, ideally the backend could, on a certain time interval, query the model and generate new images to be displayed on the map.


## Getting Started

### Acquiring a Mapbox Access Token
- In order to use Mapbox, you will need to create an account and get an access token.
- You can do this by going to the [Mapbox website](https://www.mapbox.com/) and signing up for a free account [here](https://www.mapbox.com/signup/).
- As of setting up our accounts in Spring 2025, if you use an institutional email, you must enter a billing address, but no actual billing method so you will not get accidentally get charged for usage.
- Once you have signed up, you can create a new access token by going to the [Access Tokens page](https://account.mapbox.com/access-tokens/) and clicking on the "Create a token" button.
- You can name the token whatever you like, but make sure to select the "Default public token" option.
- Once you have created the token, you will see a long string of letters and numbers. This is your access token, and you will need to copy it to use in the next step.
- Then you will need to create a `.env` file in the root of the project and add the following line to it:
```
MAPBOX_ACCESS_TOKEN=your_access_token_here
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

(may need to install relevarelevantnt packages with `npm install` first)


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

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
