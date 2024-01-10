const aiModerationText  = require('../ai/openai/moderation/textModeration')
const socketService = require('../services/socketService')
const { generateAIModel } = require('../ai/openai/dalle/imageGenerator')



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

exports.aiPhotoGeneration = async (req, res) => {
    try {

        const unxid = req.headers['user_unx_id']

        const { prompt, style } = req.body

        if(!unxid){
            res.status(400).json({message:'Error, No unxid provided'})
            return
        }

        const {isFlagged, categories} = await aiModerationText(prompt, unxid)

        if(isFlagged){
            socketService.emitToUser(unxid, 'notification', {
                message: 'Your prompt has been flagged by our moderation Bot!',
                type: 'error'
            })
            return
        }


        const image = await generateAIModel(unxid, prompt, style)

        if(!image.status){
            socketService.emitToUser(unxid, 'notification', {
                message: 'Error generating Image. Please try again',
                type: 'error'
            })

            res.status(400).json({ message: 'There was an error generating image.'})
        }

        res.status(200).json({message: 'Image Created Successfully', data: image.data})
        
    } catch (error) {
        console.log('Error Generating Image: ', error) //!TODO: Handle this error (LOG)
        res.status(500).json({message: 'Error Generating Image', error})
        return
    }
}