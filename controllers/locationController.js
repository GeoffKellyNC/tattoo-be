const convertUserLocationData = require('../google/UserLocation')


exports.getUserLocationData = async (req, res) => {
    try {
        const {latitude, longitude} = req.body


        const geoData = await convertUserLocationData(latitude, longitude)

        if(!geoData){
            console.log('NO GOOGLE DATA') //TODO: Handle this error (LOG)
            res.status(404).json({message: 'Google Error Getting Geo Data'})
            return
        }

        res.status(200).json({message: 'Success', data: geoData})
        return

    } catch (error) {
        console.log('Error getting Location Data: ', error) //!TODO: Handle This Error (LOG)
        res.status(500).json({message: 'Error Getting Location Data'})
    }
}