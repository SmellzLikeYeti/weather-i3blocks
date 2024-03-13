import axios from "axios";

const weather = async () => {
  const weatherConfig = {
    // MAKE THIS YOUR OBSERVATION STATION CODE
    observationStation: "KILM",
    // MAKE THIS YOUR LAT
    lat: "34.13",
    // MAKE THIS YOUR LONG
    long: "-77.9",
    // MAKE THIS YOUR NWS ZONE
    zone: "NCZ108",
    gridDataUrl: "https://api.weather.gov/points",
    weatherCurrentConditions: "https://api.weather.gov/stations",
    weatherForecastUrl: "https://api.weather.gov/gridpoints",
    weatherAlertUrl: "https://api.weather.gov/alerts/active/zone",
    hour: new Date().getHours(),
  };

  const getIconForText = (forecastText) => {
    if (
      forecastText.includes("Thunderstorm") ||
      forecastText.includes("Thunder Showers")
    ) {
      return "";
    }
    if (forecastText.includes("Rain") || forecastText.includes("Showers")) {
      return "";
    }
    if (
      forecastText.includes("Snow") ||
      forecastText.includes("Snow Showers")
    ) {
      return "";
    }
    if (/* 
      forecastText.includes("Mostly Sunny") || */
      forecastText.includes("Partly Cloudy")
    ) {
      return weatherConfig.hour > 18 || weatherConfig.hour < 6 ? "" : "";
    }
    if (forecastText.includes("Sunny") || forecastText.includes("Clear")) {
      return weatherConfig.hour > 18 || weatherConfig.hour < 6 ? "" : "";
    }
    if (forecastText.includes("Cloudy")) {
      return "";
    }
  };

  try {
    // We need some grid data from the lat long you want weather from
    const { data: gridData } = await axios.get(
      `${weatherConfig.gridDataUrl}/${weatherConfig.lat},${weatherConfig.long}`,
    );
    if (gridData) {
      // Grid object needed for forecast data
      const gridObject = {
        gridId: gridData.properties.gridId,
        gridX: gridData.properties.gridX,
        gridY: gridData.properties.gridY,
      };

      // Forecast Data For Next Hour
      const { data: weatherForecastData } = await axios.get(
        `${weatherConfig.weatherForecastUrl}/${gridObject.gridId}/${gridObject.gridX},${gridObject.gridY}/forecast/hourly`,
      );
      const closestPeriod = weatherForecastData.properties.periods[0];
      const nextHourObject = {
        forecastTemp: `${Math.round(closestPeriod.temperature)}${closestPeriod.temperatureUnit}`,
        forcastPrecipProb: `${closestPeriod.probabilityOfPrecipitation.value}%`,
        forecastWindSpeed: ` ${closestPeriod.windDirection} at ${closestPeriod.windSpeed}`,
        forecastText: `${closestPeriod.shortForecast}`,
      };
      // Nice pretty string for the next hour
      const nextHour = `| NEXT HOUR:  ${getIconForText(nextHourObject.forecastText)} ${nextHourObject.forecastText}  ${nextHourObject.forecastTemp}   ${nextHourObject.forcastPrecipProb}  ${nextHourObject.forecastWindSpeed} |`;

      // Current Conditions
      const { data: currentConditionsData } = await axios.get(
        `${weatherConfig.weatherCurrentConditions}/${weatherConfig.observationStation}/observations/latest`,
      );
      const currentConditionsObject = {
        currentTemp:
          (currentConditionsData.properties.temperature.value * 9) / 5 + 32,
        currentText: currentConditionsData.properties.textDescription,
      };
      // Nice pretty string for current conditions
      const currently = `CURRENTLY:  ${getIconForText(currentConditionsObject.currentText)} ${currentConditionsObject.currentText} ${Math.round(currentConditionsObject.currentTemp)}F`;

      // Alerts
      const { data: alertData } = await axios.get(
        `${weatherConfig.weatherAlertUrl}/${weatherConfig.zone}`,
      );
      let showAlerts = false;
      let alertText = "";
      if (alertData.features.length > 0) {
        showAlerts = true;
        let severeAlerts = [];
        const activeAlerts = alertData.features.length;
        severeAlerts = alertData.features.filter(
          (alert) => alert.properties.severity === "Severe",
        );
        if (severeAlerts.length > 0) {
          alertText = alertText.concat(
            ` ${severeAlerts.length > 1 ? "SEVERE ALERTS" : "SEVERE ALERT"}  `,
          );
          severeAlerts.forEach((severeAlert) => {
            alertText = alertText.concat(`${severeAlert.properties.event}`);
          });
        } else {
          alertData.features.forEach((alert) => {
            alertText.concat(`${alert.properties.event}`);
          });
          alertText = alertText.concat(
            ` ${alertData.features.length > 1 ? "WEATHER ALERTS" : "WEATHER ALERT"}`,
          );
        }
      }
      // String for i3blocks
      console.log(
        `${showAlerts ? alertText + " | " : ""} ${currently}  ${nextHour}`,
      );
    }
  } catch (e) {
    console.log("NOAA ERROR");
  }
};

weather();
