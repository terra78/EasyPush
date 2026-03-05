const tgUA = {}

tgUA.isMoblie = function() {
	//userAgentHint
	if (window.navigator.userAgentData) {
		return window.navigator.userAgentData.mobile
	}
	//existing userAgent
	else {
		let userAgent = window.navigator.userAgent.toLowerCase();
		let regexp = /android|webos|iphone|ipad|ipod|blackberry|mobile|iemobile|opera mini/i;
		return (userAgent.search(regexp) != -1);
	}
}
