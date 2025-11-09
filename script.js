const apiKey = "8a6c35cfec4872f128a3ad155786b520"; 
const searchBtn = document.getElementById("searchBtn");
const locationBtn = document.getElementById("locationBtn");
const cityInput = document.getElementById("cityInput");
const themeToggle = document.getElementById("themeToggle");
const weatherInfo = document.getElementById("weatherInfo");
const forecast = document.getElementById("forecast");
const loading = document.getElementById("loading");
const error = document.getElementById("error");
const suggestionsContainer = document.getElementById("suggestions");

let tempChart = null;
let debounceTimer = null;
let currentSuggestionIndex = -1;

// Búsqueda con botón
searchBtn.addEventListener("click", () => {
  const city = cityInput.value.trim();
  if (city) {
    hideSuggestions();
    getWeather(city);
  }
});

// Búsqueda con Enter
cityInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    const city = cityInput.value.trim();
    if (city) {
      hideSuggestions();
      getWeather(city);
    }
  }
});

// Autocompletado mientras se escribe
cityInput.addEventListener("input", (e) => {
  const query = e.target.value.trim();
  
  // Limpiar timer anterior
  clearTimeout(debounceTimer);
  
  if (query.length < 2) {
    hideSuggestions();
    return;
  }
  
  // Esperar 300ms después de que el usuario deje de escribir
  debounceTimer = setTimeout(() => {
    getSuggestions(query);
  }, 300);
});

// Navegación con teclado en sugerencias
cityInput.addEventListener("keydown", (e) => {
  const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
  
  if (suggestions.length === 0) return;
  
  if (e.key === "ArrowDown") {
    e.preventDefault();
    currentSuggestionIndex = (currentSuggestionIndex + 1) % suggestions.length;
    updateActiveSuggestion(suggestions);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    currentSuggestionIndex = currentSuggestionIndex <= 0 ? suggestions.length - 1 : currentSuggestionIndex - 1;
    updateActiveSuggestion(suggestions);
  } else if (e.key === "Enter" && currentSuggestionIndex >= 0) {
    e.preventDefault();
    suggestions[currentSuggestionIndex].click();
  } else if (e.key === "Escape") {
    hideSuggestions();
  }
});

// Cerrar sugerencias al hacer clic fuera
document.addEventListener("click", (e) => {
  if (!e.target.closest('.search-input-container')) {
    hideSuggestions();
  }
});

// Obtener ubicación actual
locationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    loading.classList.remove("hidden");
    weatherInfo.classList.add("hidden");
    forecast.classList.add("hidden");
    error.classList.add("hidden");

    navigator.geolocation.getCurrentPosition(
      position => {
        getWeatherByCoords(position.coords.latitude, position.coords.longitude);
      },
      err => {
        showError("No se pudo obtener tu ubicación. Por favor, permite el acceso a tu ubicación.");
        loading.classList.add("hidden");
      }
    );
  } else {
    showError("Tu navegador no soporta geolocalización.");
  }
});

// Modo oscuro
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  themeToggle.textContent = isDark ? "☀️" : "🌙";
});

// Obtener clima por nombre de ciudad
async function getWeather(city) {
  loading.classList.remove("hidden");
  weatherInfo.classList.add("hidden");
  forecast.classList.add("hidden");
  error.classList.add("hidden");

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&lang=es&appid=${apiKey}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&lang=es&appid=${apiKey}`;

  try {
    const [weatherRes, forecastRes] = await Promise.all([
      fetch(url), 
      fetch(forecastUrl)
    ]);
    
    const weatherData = await weatherRes.json();
    const forecastData = await forecastRes.json();

    if (weatherData.cod === "404") {
      showError("Ciudad no encontrada 😕. Por favor, verifica el nombre e intenta de nuevo.");
      return;
    }

    displayWeather(weatherData, forecastData);
  } catch (err) {
    showError("Error al obtener los datos 😢. Por favor, intenta de nuevo.");
  } finally {
    loading.classList.add("hidden");
  }
}

// Obtener clima por coordenadas
async function getWeatherByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${apiKey}`;
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=es&appid=${apiKey}`;

  try {
    const [weatherRes, forecastRes] = await Promise.all([
      fetch(url), 
      fetch(forecastUrl)
    ]);
    
    const weatherData = await weatherRes.json();
    const forecastData = await forecastRes.json();

    displayWeather(weatherData, forecastData);
  } catch (err) {
    showError("Error al obtener los datos 😢. Por favor, intenta de nuevo.");
  } finally {
    loading.classList.add("hidden");
  }
}

// Mostrar información del clima
function displayWeather(weatherData, forecastData) {
  // Información principal
  document.getElementById("cityName").textContent = `${weatherData.name}, ${weatherData.sys.country}`;
  document.getElementById("temperature").textContent = `${Math.round(weatherData.main.temp)}°C`;
  document.getElementById("description").textContent = weatherData.weather[0].description;
  document.getElementById("feelsLike").textContent = `Sensación térmica: ${Math.round(weatherData.main.feels_like)}°C`;
  document.getElementById("icon").src = `https://openweathermap.org/img/wn/${weatherData.weather[0].icon}@4x.png`;

  // Detalles adicionales
  document.getElementById("humidity").textContent = `${weatherData.main.humidity}%`;
  document.getElementById("wind").textContent = `${Math.round(weatherData.wind.speed * 3.6)} km/h`;
  document.getElementById("pressure").textContent = `${weatherData.main.pressure} hPa`;
  document.getElementById("visibility").textContent = `${(weatherData.visibility / 1000).toFixed(1)} km`;

  // Hora local
  const timezone = weatherData.timezone;
  const localTime = new Date(Date.now() + timezone * 1000);
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'UTC'
  };
  document.getElementById("localTime").textContent = localTime.toLocaleString('es-ES', options);

  // Mostrar secciones
  weatherInfo.classList.remove("hidden");
  forecast.classList.remove("hidden");
  error.classList.add("hidden");

  // Pronóstico
  displayForecast(forecastData);
}

// Mostrar pronóstico de 5 días
function displayForecast(forecastData) {
  const forecastContainer = document.getElementById("forecastContainer");
  forecastContainer.innerHTML = "";

  // Agrupar por día
  const dailyForecasts = {};
  
  forecastData.list.forEach(item => {
    const date = new Date(item.dt * 1000).toLocaleDateString('es-ES');
    if (!dailyForecasts[date]) {
      dailyForecasts[date] = item;
    }
  });

  // Tomar los próximos 5 días
  const days = Object.values(dailyForecasts).slice(1, 6);
  const chartLabels = [];
  const chartTemps = [];

  days.forEach(day => {
    const date = new Date(day.dt * 1000);
    const dayName = date.toLocaleDateString("es-ES", { 
      weekday: "long", 
      day: "numeric", 
      month: "short" 
    });
    
    chartLabels.push(dayName);
    chartTemps.push(Math.round(day.main.temp));

    forecastContainer.innerHTML += `
      <div class="day">
        <h4>${dayName}</h4>
        <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png" alt="${day.weather[0].description}">
        <p>${Math.round(day.main.temp)}°C</p>
        <p class="forecast-desc">${day.weather[0].description}</p>
      </div>
    `;
  });

  // Crear gráfico de temperaturas
  createChart(chartLabels, chartTemps);
}

// Crear gráfico con Chart.js
function createChart(labels, temps) {
  const ctx = document.getElementById('tempChart');
  
  // Destruir gráfico anterior si existe
  if (tempChart) {
    tempChart.destroy();
  }

  tempChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Temperatura (°C)',
        data: temps,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 3,
        tension: 0.4,
        fill: true,
        pointRadius: 5,
        pointBackgroundColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14
          },
          bodyFont: {
            size: 13
          },
          callbacks: {
            label: function(context) {
              return 'Temperatura: ' + context.parsed.y + '°C';
            }
          }
        }
      },
      scales: {
        y: {
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)',
            font: {
              size: 12
            },
            callback: function(value) {
              return value + '°';
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            drawBorder: false
          }
        },
        x: {
          ticks: {
            color: 'rgba(255, 255, 255, 0.8)',
            font: {
              size: 11
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)',
            drawBorder: false
          }
        }
      }
    }
  });
}

// Obtener sugerencias de ciudades
async function getSuggestions(query) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.length > 0) {
      displaySuggestions(data);
    } else {
      hideSuggestions();
    }
  } catch (err) {
    console.error("Error al obtener sugerencias:", err);
    hideSuggestions();
  }
}

// Mostrar sugerencias
function displaySuggestions(cities) {
  suggestionsContainer.innerHTML = "";
  currentSuggestionIndex = -1;
  
  cities.forEach((city, index) => {
    const div = document.createElement("div");
    div.className = "suggestion-item";
    div.innerHTML = `
      <span class="suggestion-icon">📍</span>
      <span class="suggestion-text">
        ${city.name}${city.state ? ', ' + city.state : ''}
      </span>
      <span class="suggestion-country">${city.country}</span>
    `;
    
    div.addEventListener("click", () => {
      cityInput.value = city.name;
      hideSuggestions();
      getWeather(city.name);
    });
    
    suggestionsContainer.appendChild(div);
  });
  
  suggestionsContainer.classList.remove("hidden");
}

// Ocultar sugerencias
function hideSuggestions() {
  suggestionsContainer.classList.add("hidden");
  currentSuggestionIndex = -1;
}

// Actualizar sugerencia activa con teclado
function updateActiveSuggestion(suggestions) {
  suggestions.forEach((suggestion, index) => {
    if (index === currentSuggestionIndex) {
      suggestion.classList.add("active");
      suggestion.scrollIntoView({ block: "nearest" });
    } else {
      suggestion.classList.remove("active");
    }
  });
}

// Mostrar mensaje de error
function showError(message) {
  error.textContent = message;
  error.classList.remove("hidden");
  loading.classList.add("hidden");
}