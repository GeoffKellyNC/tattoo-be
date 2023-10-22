const axios = require('axios')


const main = async () => {
    let currentNumber = 36
    let numberCreated = 35

    setInterval( async () => {
        const data = {
            user_name: `user${currentNumber}`,
            email: `user${currentNumber}@email.com`,
            first_name: `user${currentNumber}`,
            last_name: `Last${currentNumber}`,
            display_name: `Iam${currentNumber}`,
            account_type: `${currentNumber % 2 === 0 ? 'client' : 'artist'}`,
            password: 'Pa$$word123',
        }

        try {
            const res = await axios.post('http://localhost:9001/user/register', data)
            if (res.status !== 200){
                console.log('ERROR RES: ', res) //TODO: Handle Error (LOG)
            }
        } catch (error) {
            console.log('Error Creating User: ', error) //TODO: Handle Error (LOG)
        }

        currentNumber++
        numberCreated++
    }, 1000); 

}

main()