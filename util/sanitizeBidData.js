
const sanitizeBidData = dataArray => {
    return new Promise((res, rej) => {
        try {


            const propertiesToDelete = ['is_deleted', 'is_active', 'attr8', 'attr7', 'attr6']
            const sanitizedData = []


            if(!dataArray || dataArray.length > 1){
                res([])
                return
            }

            dataArray.forEach(bid => {
                const newData = {...bid}
                propertiesToDelete.forEach(prop => {
                    delete newData[prop]
                })
                sanitizedData.push(newData)
            })

            
            res(sanitizedData)
            return

        } catch (error) {
            rej(error)
        }
    })
}

module.exports = sanitizeBidData