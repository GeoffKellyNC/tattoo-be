const axios = require('axios')
const socketService = require('../services/socketService');


const GOOGLE_GEO_KEY = process.env.GOOGLE_GEOLOCATION_API_KEY
const GOOGLE_BASE_URL = 'https://maps.googleapis.com/maps/api/geocode'



const zipToCords = async (zip, unxid) => {
    try {
        const googleRes = await axios.get(`${GOOGLE_BASE_URL}/json?address=${zip}&key=${GOOGLE_GEO_KEY}`)

        const cords = googleRes.data.results[0].geometry.location

        return cords

    } catch (error) {
        console.log('Error Converting User Location Data: ', error) //!TODO: Handle This Error (LOG)
        socketService.emitToUser(unxid, 'notification', { 
            message: 'Error Creating Job. Please check zipcode! ', type: 'error' })
        return false
    }
}


module.exports = zipToCords