const axios = require('axios')

const GOOGLE_GEO_KEY = process.env.GOOGLE_GEOLOCATION_API_KEY
const GOOGLE_BASE_URL = 'https://maps.googleapis.com/maps/api/geocode'


const convertUserLocationData = async (lat, lng) => {
    try {

        const googleRes = await axios.get(`${GOOGLE_BASE_URL}/json?latlng=${lat},${lng}&key=${GOOGLE_GEO_KEY}`)


        const addressComponent = googleRes.data.results[0].address_components



       const city = addressComponent.find(component => component.types.includes('locality'))
       const state = addressComponent.find(component => component.types.includes('administrative_area_level_1'))


        const finalData = { city: city.long_name, state: state.long_name}

        return finalData



    } catch (error) {
        console.log('Error Converting User Location Data: ', error.data) //!TODO: Handle This Error (LOG)
        return false
    }
}

module.exports = convertUserLocationData


