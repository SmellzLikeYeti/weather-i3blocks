import axios from 'axios';

const weather = async () => {

    const getIconForText = (forecastText) => {
        if (forecastText.includes('Thunderstorm') || forecastText.includes('Thunder Showers')) {
            return '';
        }
        if (forecastText.includes('Rain') || forecastText.includes('Showers')) {
            return '';
        }
        if (forecastText.includes('Snow') || forecastText.includes('Snow Showers')) {
            return '';
        }
        if (forecastText.includes('Mostly Sunny') || forecastText.includes('Partly Cloudy')) {
            return ''
        }
        if (forecastText.includes('Sunny')) {
            return ''
        }
        if (forecastText.includes('Cloudy')) {
            return ''
        }
    }
    // MAKE THIS YOUR OBSERVATION STATION CODE
    const observationStation = 'KILM'
    // MAKE THIS YOUR LAT
    const lat = '34.13'
    // MAKE THIS YOUR LONG
    const long = '-77.9'
    // MAKE THIS YOUR NWS ZONE
    const zone = 'NCZ108'
    const gridDataUrl = 'https://api.weather.gov/points';
    const weatherCurrentConditions = 'https://api.weather.gov/stations'
    const weatherForecastUrl = 'https://api.weather.gov/gridpoints';
    const weatherAlertUrl = 'https://api.weather.gov/alerts/active/zone'

    try {
        // We need some grid data from the lat long you want weather from
        const { data: gridData } = await axios.get(`${gridDataUrl}/${lat},${long}`)
        if (gridData) {

            const gridId = gridData.properties.gridId;
            const gridX = gridData.properties.gridX
            const gridY = gridData.properties.gridY

            // Forecast Data For Next Hour
            const { data: weatherForecastData } = await axios.get(`${weatherForecastUrl}/${gridId}/${gridX},${gridY}/forecast/hourly`)
            const closestPeriod = weatherForecastData.properties.periods[0];
            const forecastTemp = `${closestPeriod.temperature}${closestPeriod.temperatureUnit}`
            const forcastPrecipProb = `${closestPeriod.probabilityOfPrecipitation.value}%`
            const forecastWindSpeed = ` ${closestPeriod.windDirection} at ${closestPeriod.windSpeed}`
            const forecastText = `${closestPeriod.shortForecast}`

            // Nice pretty string for the next hour
            const nextHour = `| NEXT HOUR:  ${getIconForText(forecastText)} ${forecastText}  ${forecastTemp}  ${forcastPrecipProb}  ${forecastWindSpeed} |`;


            // Current Conditions
            const { data: currentConditionsData } = await axios.get(`${weatherCurrentConditions}/${observationStation}/observations/latest`)
            const currentTemp = currentConditionsData.properties.temperature.value * 9 / 5 + 32;
            const currentText = currentConditionsData.properties.textDescription;
            // Nice pretty string for current conditions
            const currently = `CURRENTLY:  ${getIconForText(currentText)} ${currentText} ${currentTemp}F`

            // Alerts
            const { data: alertData } = await axios.get(`${weatherAlertUrl}/${zone}`)
            let showAlerts = false;
            let alertText = '';
            if (alertData.features.length > 0) {
                showAlerts = true;
                let severeAlerts = [];
                const activeAlerts = alertData.features.length;
                severeAlerts = alertData.features.filter(alert => alert.properties.severity === "Severe");
                if (severeAlerts.length > 0) {
                    alertText = alertText.concat(` ${severeAlerts.length > 1 ? 'SEVERE ALERTS' : 'SEVERE ALERT'}  `)
                    severeAlerts.forEach(severeAlert => {
                        alertText = alertText.concat(`${severeAlert.properties.event}`)
                    })

                } else {
                    alertData.features.forEach(alert => {
                        alertText.concat(`${alert.properties.event}`)
                    })
                    alertText = alertText.concat(` ${alertData.features.length > 1 ? 'WEATHER ALERTS' : 'WEATHER ALERT'}`)
                }
            }
            // String for i3blocks
            console.log(`${showAlerts ? alertText + ' | ' : ''} ${currently}  ${nextHour}`)
        }
    } catch (e) {
        console.log('NOAA ERROR')
    }


}

weather();