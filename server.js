import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());

const CLIENT_ID = process.env.AMADEUS_KEY;
const CLIENT_SECRET = process.env.AMADEUS_SECRET;

let accessToken = null;

async function getToken() {
  const res = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
  });

  const data = await res.json();
  accessToken = data.access_token;
}

app.get("/flights", async (req, res) => {
  const { destination, departureDate, returnDate } = req.query;

  if (!accessToken) await getToken();

  const url = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=TLV&destinationLocationCode=${destination}&departureDate=${departureDate}&returnDate=${returnDate}&adults=1&max=20`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  const data = await response.json();

  const filtered = data.data.map(f => {
    const segments = f.itineraries[0].segments;
    const departTime = new Date(segments[0].departure.at);

    return {
      price: f.price.total,
      airline: f.validatingAirlineCodes[0],
      stops: segments.length - 1,
      departTime: departTime,
      duration: f.itineraries[0].duration
    };
  }).filter(f =>
    f.stops <= 1 &&
    new Date(f.departTime).getHours() >= 10 &&
    new Date(f.departTime).getHours() <= 17
  );

  res.json(filtered);
});

app.listen(3000);
