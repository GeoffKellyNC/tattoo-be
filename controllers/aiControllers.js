const aiModerationText  = require('../ai/openai/moderation/textModeration')
const socketService = require('../services/socketService')



exports.aiModerationText = async (req, res, next) => {
    try {
        const unxid = req.headers['user_unx_id']

        const { text } = req.body
    
        const {isFlagged, categories} = await aiModerationText(text, unxid)

        if(isFlagged){
            socketService.emitToUser(unxid, 'notification', { 
                message: 'Moderation Error: Text is flagged', type: 'error' })
            res.status(200).json({message: 'Text is flagged', data: {isFlagged, categories}})

            return
        }

        res.status(200).json({message: 'Text is not flagged', data: {isFlagged, categories}})

        
    } catch (error) {
        console.log('Error Converting User Location Data: ', error) //!TODO: Handle This Error (LOG)
        res.status(500).json({message: 'Error Converting User Location Data', error})
    }
   
}