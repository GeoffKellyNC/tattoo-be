const axios = require('axios')
const socketService = require('../../../services/socketService');


const OPEN_AI_KEY = process.env.OPEN_AI_KEY
const BASE_URL_MOD = 'https://api.openai.com/v1/moderations'


const aiModerationText = async (text,  unxid) => {
    try {
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPEN_AI_KEY}`
        }

        const data = {
            "input": text
        }

        const modRes = await axios.post(`${BASE_URL_MOD}`, data, { headers })

        console.log('modRes: ', modRes) //!REMOVE
        const isFlagged = modRes.data.results[0].flagged
        const categories = modRes.data.results[0].categories


        return { isFlagged, categories }

        
    } catch (error) {
        console.log('Error Converting User Location Data: ', error) //!TODO: Handle This Error (LOG)
        socketService.emitToUser(unxid, 'notification', { 
            message: 'Error Creating Job. Please check zipcode! ', type: 'error' })

        return false
    }
}

module.exports = aiModerationText