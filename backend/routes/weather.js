import express from "express";
import fetch from "node-fetch";

const router = express.Router();

const weatherToMood = (weatherData) => {
  const weatherCondition = weatherData.weather[0].main;
  const temperature = weatherData.main.temp - 273.15; // Converting temperature from Kelvin to Celsius

  let mood = "neutral";

  if (
    weatherCondition.includes("Clouds") ||
    weatherCondition.includes("Rain") ||
    weatherCondition.includes("Snow")
  ) {
    mood = "sad";
  } else if (weatherCondition.includes("Clear") && temperature > 20) {
    mood = "happy";
  }

  return mood;
};

router.get("/", async (req, res) => {
  const openWeatherMapApiKey = process.env.OPEN_WEATHER_MAP_API_KEY;
  const { lat, lng, code } = req.query;

  try {
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${openWeatherMapApiKey}`
    );
    const weatherData = await weatherResponse.json();
    console.log(weatherData);
    const country = weatherData.sys.country;
    console.log(country);
    res.redirect(
      `http://localhost:3000/Dashboard?country=${country}&code=${code}`
    );
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ message: error.message || "Error fetching weather data" });
  }
});

export default router;
