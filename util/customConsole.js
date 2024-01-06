


const customConsole = (data) => {
    const formatedDate = new Date(Date.now()).toLocaleString('en-US', { timeZone: 'America/New_York' });
    console.log(`
        👤 User: ${data.unxid ? data.unxid : 'No unxid'}
        ⏰ Current time: ${formatedDate}
        🦠 req.path: ${data.path}
        📀 metaData: ${data.metaData ? data.metaData : 'No metaData'}

    `)
}


module.exports = customConsole;