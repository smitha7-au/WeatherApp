// js/app.test.js (or js/test.js)

import { getCityTemperature, drawWeatherChart } from './script.js'; // Adjust path if your file is app.js
import fetchMock from 'jest-fetch-mock'; // <<<<<<<<<<<< BRING THIS IMPORT BACK

// Mock the Chart.js constructor and its methods
jest.mock('chart.js', () => ({
  Chart: jest.fn().mockImplementation(() => ({
    destroy: jest.fn(),
  })),
}));

describe('getCityTemperature', () => {
  let cityInput;
  let output;
  let weatherChart;

  
  beforeAll(() => {
    // This ensures fetch is mocked once for the entire test suite
    fetchMock.enableMocks();
    global.Chart = require('chart.js').Chart; // Use require() here as it's within Jest context
  });

  beforeEach(() => {
    // Reset mocks before each test
    // fetchMock is now available via the import and beforeAll call
    fetchMock.resetMocks();
    document.body.innerHTML = `
      <input id="cityInput" type="text" />
      <div id="output"></div>
      <canvas id="weatherChart"></canvas>
    `;
    cityInput = document.getElementById('cityInput');
    output = document.getElementById('output');
    weatherChart = document.getElementById('weatherChart');

    // Mock getContext for the canvas element
    const mockGetContext = jest.fn(() => ({}));
    weatherChart.getContext = mockGetContext;

    // Clear the global chart instance before each test
    // This is important if your `chart` variable is truly global and not re-initialized
    if (global.chart && typeof global.chart.destroy === 'function') {
      global.chart.destroy();
    }
    global.chart = undefined; // Reset it
  });

  // Test Case 1: Validate input
  describe('Input Validation', () => {
    test('should display an error if the city input is empty', async () => {
      cityInput.value = '';
      await getCityTemperature();
      expect(output.textContent).toBe('❗ Please enter a valid city name.');
    });

    test('should display "City not found" if geocoding API returns no results', async () => {
      cityInput.value = 'NonExistentCity';

      fetchMock.mockResponseOnce(JSON.stringify({ results: [] }), { status: 200 }); // Mock geocoding API

      await getCityTemperature();
      expect(output.textContent).toBe('❌ City not found. Please check the spelling.');
    });
  });

  // Test Case 2: Network Errors
  describe('Network Error Handling', () => {
    test('should display an error if geocoding API fetch fails (network error)', async () => {
      cityInput.value = 'London';
      fetchMock.mockRejectOnce(new Error('Network is down')); // Simulate network error for geocoding
      await getCityTemperature();
      expect(output.textContent).toBe('⚠️ Error: Network is down');
    });

    test('should display an error if geocoding API returns a non-200 status', async () => {
      cityInput.value = 'London';
      fetchMock.mockResponseOnce('{"error": "server error"}', { status: 500 }); // Simulate server error
      await getCityTemperature();
      expect(output.textContent).toBe('⚠️ Error: Failed to fetch location.');
    });

    test('should display an error if weather API fetch fails (network error)', async () => {
      cityInput.value = 'London';

      // Mock successful geocoding API response
      fetchMock.mockResponseOnce(JSON.stringify({
        results: [{
          latitude: 51.5,
          longitude: -0.12,
          name: 'London',
          country: 'United Kingdom'
        }]
      }), { status: 200 });

      // Simulate network error for weather API
      fetchMock.mockRejectOnce(new Error('Weather service unavailable'));

      await getCityTemperature();
      expect(output.textContent).toBe('⚠️ Error: Weather service unavailable');
    });

    test('should display an error if weather API returns a non-200 status', async () => {
      cityInput.value = 'London';

      // Mock successful geocoding API response
      fetchMock.mockResponseOnce(JSON.stringify({
        results: [{
          latitude: 51.5,
          longitude: -0.12,
          name: 'London',
          country: 'United Kingdom'
        }]
      }), { status: 200 });

      // Simulate server error for weather API
      fetchMock.mockResponseOnce('{"error": "weather data not found"}', { status: 404 });

      await getCityTemperature();
      expect(output.textContent).toBe('⚠️ Error: Failed to fetch weather data.');
    });
  });

  // Example of a successful run test (good practice to have)
  test('should display weather data and draw chart for a valid city', async () => {
    cityInput.value = 'Paris';

    // Mock successful geocoding API response
    fetchMock.mockResponseOnce(JSON.stringify({
      results: [{
        latitude: 48.85,
        longitude: 2.35,
        name: 'Paris',
        country: 'France'
      }]
    }), { status: 200 });

    // Mock successful weather API response
    fetchMock.mockResponseOnce(JSON.stringify({
      daily: {
        time: ['2025-06-01', '2025-06-02', '2025-06-03', '2025-06-04', '2025-06-05'],
        temperature_2m_max: [20, 22, 19, 21, 23],
        temperature_2m_min: [10, 11, 9, 10, 12],
        weathercode: [0, 1, 3, 61, 71]
      }
    }), { status: 200 });

    await getCityTemperature();

    // Check if output contains expected city and temperature
    expect(output.innerHTML).toContain('<h3>📍 Paris, France</h3>');
    expect(output.innerHTML).toContain('L ☀️ 10°C / 50.0°F - H 20°C / 68.0°F');
    expect(output.innerHTML).toContain('L 🌧️ 10°C / 50.0°F - H 21°C / 69.8°F');


    // Check if chart is drawn
    expect(weatherChart.style.display).toBe('block');
    // Ensure Chart constructor was called
   // const { Chart } = require('chart.js'); // Keeping require for Chart.js mock import
    expect(Chart).toHaveBeenCalledTimes(1);
    expect(Chart).toHaveBeenCalledWith(
      expect.any(Object), // The canvas context
      expect.objectContaining({
        type: 'line',
        data: {
          labels: ['2025-06-01', '2025-06-02', '2025-06-03', '2025-06-04', '2025-06-05'],
          datasets: expect.arrayContaining([
            expect.objectContaining({ label: 'Min Temp (°C)' }),
            expect.objectContaining({ label: 'Max Temp (°C)' })
          ])
        }
      })
    );
  });
});