let chart; // Global Chart.js instance


async function getCityTemperature() {
  const city = document.getElementById("cityInput").value.trim();
  const output = document.getElementById("output");

  // Clear previous output
  output.textContent = "";

  // Step 1: Validate input
  if (!city) {
    output.textContent = "❗ Please enter a valid city name.";
    return;
  }

  try {
    // Step 2: Fetch coordinates from geocoding API
    const geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
    const geoRes = await fetch(geoURL);
    if (!geoRes.ok) throw new Error("Failed to fetch location.");

    const geoData = await geoRes.json();

    if (!geoData.results || geoData.results.length === 0) {
      output.textContent = "❌ City not found. Please check the spelling.";
      return;
    }

    const { latitude, longitude, name, country } = geoData.results[0];

    // Step 3: Fetch weather data
    const weatherURL = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
    const weatherRes = await fetch(weatherURL);
    if (!weatherRes.ok) throw new Error("Failed to fetch weather data.");

    const weatherData = await weatherRes.json();
    const dates = weatherData.daily.time;
    const tempsMax = weatherData.daily.temperature_2m_max;
    const tempsMin = weatherData.daily.temperature_2m_min;
    const weatherCodes = weatherData.daily.weathercode;


    // Step 4: Display result
    let html = `<h3>📍 ${name}, ${country}</h3><ul>`;
    for (let i = 0; i < 5; i++) {
      const minC = tempsMin[i];
      const maxC = tempsMax[i];
      const minF = (minC * 9 / 5 + 32).toFixed(1);
      const maxF = (maxC * 9 / 5 + 32).toFixed(1);
      const icon = getWeatherIcon(weatherCodes[i]);
      
      html += `<li>📅 <strong>${dates[i]}</strong>: 
               L ${icon} ${minC}°C / ${minF}°F - H ${maxC}°C / ${maxF}°F</li>`;
    }
    html += "</ul>";
    output.innerHTML = html;

    // Draw Chart
    drawWeatherChart(dates.slice(0, 5), tempsMin.slice(0, 5), tempsMax.slice(0, 5));
    document.getElementById("weatherChart").style.display = "block";


  } catch (err) {
    output.textContent = "⚠️ Error: " + err.message;
  }
}
// Explicitly attach to the global window object
//window.getCityTemperature = getCityTemperature;

// Simple weather code → emoji mapping
function getWeatherIcon(code) {
  const icons = {
    0: "☀️", // Clear sky
    1: "🌤️", 2: "⛅", 3: "☁️", // Clouds
    45: "🌫️", 48: "🌫️",       // Fog
    51: "🌦️", 61: "🌧️", 63: "🌧️", 65: "🌧️", // Rain
    71: "🌨️", 73: "🌨️", 75: "❄️", // Snow
    95: "⛈️", 96: "⛈️", 99: "⛈️"   // Thunderstorm
  };
  return icons[code] || "🌈";
}

// Draws line chart for 5-day temperature
 function drawWeatherChart(dates, minTemps, maxTemps) {
  const ctx = document.getElementById('weatherChart').getContext('2d');

  if (chart) chart.destroy(); // Clear existing chart

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: dates,
      datasets: [
        {
          label: 'Min Temp (°C)',
          data: minTemps,
          borderColor: 'blue',
          fill: false,
        },
        {
          label: 'Max Temp (°C)',
          data: maxTemps,
          borderColor: 'red',
          fill: false,
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        title: {
          display: true,
          text: '5-Day Temperature Forecast'
        }
      }
    }
  });
  document.getElementById('weatherChart').style.display = 'block';
}


// Export functions for Jest testing (and other modules)
export { getCityTemperature, getWeatherIcon, drawWeatherChart };