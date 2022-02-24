// Fetches the latest deployed TruffleContract version
async function checkAndRetrieveContract(...contracts) {
	let latest;

	for (const contract of contracts) {
		try {
			latest = await contract.deployed();
		} catch {}
	}

	return latest;
}

function checkAndRetrieveArtifact(artifact) {
	try {
		return artifacts.require(artifact);
	} catch (e) {
		console.log('Oops... retrieve artifact failed.')
		return undefined;
	}
}

module.exports = {
	checkAndRetrieveArtifact,
	checkAndRetrieveContract
};