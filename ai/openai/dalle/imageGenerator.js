const OpenAI = require('openai')

const IMAGE_MODEL = 'dall-e-3'



const generateAIModel = async (unxid, userPrompt, userStyle) => {
    try {

        const openAi = new OpenAI

        const res = await openAi.images.generate(
            {
                model: IMAGE_MODEL, 
                prompt: userPrompt,
                quality: 'hd',
                user: unxid,
                style: userStyle
            })

        if(!res.data.length < 1) {
            return false
        }

        return { status: true, data: res.data[0]["url"]}


        
    } catch (error) {
        console.log('Error Generating Image', error) //!TODO: Handle this error (LOG)
        return {status: false, data: error}
    }

}

module.exports = generateAIModel