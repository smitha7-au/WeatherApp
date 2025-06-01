// Import the functions from your main application logic file
import { getCityTemperature } from './script.js'; 

document.addEventListener('DOMContentLoaded', () => {
  const getWeatherButton = document.getElementById('getWeatherButton');
  if (getWeatherButton) {
    getWeatherButton.addEventListener('click', getCityTemperature);
    //console.log('Event listener attached to Get Weather button.');
  } else {
    console.error('Get Weather button not found!');
  }
});