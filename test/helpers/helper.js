const validateEnvVar = (arr) => {
    for (let index = 0; index < arr.length; index++) {
        const element = arr[index];

        if (!element.addr) {
            throw Error(`Check environment variables. Field "addr" should not be blank.`);
        }
    }
};

const advanceTimeAndBlock = async (time) => {
    //capture current time
    let block = await web3.eth.getBlock('latest')
    let forwardTime = block['timestamp'] + time

    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: '2.0',
            method: 'evm_mine',
            params: [forwardTime],
            id: new Date().getTime()
        }, (err, result) => {
            if (err) {
                return reject(err)
            }
            return resolve(result)
        })
    })
}

const encodeParameters = (updatedAmount) => {
    return web3.eth.abi.encodeParameters(["uint256"], [updatedAmount]);
}

const mineBlocks = async function () {
    const times = 10;
    const timeTravel = 6; // time travel in seconds

    for (let i = 0; i < parseInt(times); i++) {
        await advanceTimeAndBlock(timeTravel); // i seconds
    }
}

module.exports = {
    validateEnvVar,
    advanceTimeAndBlock,
    mineBlocks,
    encodeParameters
}
