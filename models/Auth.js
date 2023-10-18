const bcrypt = require('bcrypt')

 const hashUserPassword = async (user_pass) => {
    try {
        const saltRounds = 10;

        const hashed_user_pass = bcrypt.hash(user_pass, saltRounds)

        return hashed_user_pass

    } catch (error) {
        console.log("Error hasing user password", error) //TODO : HANDLE ERROR
        return false
    }
}

 const comparePassHash = async (password, stored_hash) => {
    try {
        const isSame = await bcrypt.compare(password, stored_hash)

        return isSame ? true : false

    } catch (error) {
        console.log("Error comparing hash ", error) //TODO: Handle Error
    }
}

module.exports = {
    hashUserPassword,
    comparePassHash
}