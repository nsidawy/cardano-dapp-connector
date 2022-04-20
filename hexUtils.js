export function a2hex(s) {
    var hex = "";
    for (var i=0; i < s.length; i++) {
        hex += s.charCodeAt(i).toString(16).padStart(2, '0');
    }
    return hex;
}

export function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

export function uint8ArrayToHexString(arr) {
    var hex = "";
    for(var i = 0; i < arr.length; i++) {
        hex += arr[i].toString(16).padStart(2, "0");
    }
    return hex;
}

export function hexStringToArrayBuffer(hexString) {
	// remove the leading 0x
	hexString = hexString.replace(/^0x/, '');
	
	// ensure even number of characters
	if (hexString.length % 2 != 0) {
		console.log('WARNING: expecting an even number of characters in the hexString');
	}
	
	// check for some non-hex characters
	var bad = hexString.match(/[G-Z\s]/i);
	if (bad) {
		console.log('WARNING: found non-hex characters', bad);    
	}
	
	// split the string into pairs of octets
	var pairs = hexString.match(/[\dA-F]{2}/gi);
	
	// convert the octets to integers
	var integers = pairs.map(function(s) {
		return parseInt(s, 16);
	});
	
	var array = new Uint8Array(integers);				
	return array.buffer;
}