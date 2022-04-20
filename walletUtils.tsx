import { hex2a, hexStringToArrayBuffer, uint8ArrayToHexString} from "./hexUtils"
const B = require("bech32");
const CBOR = require("./cbor")

export interface OtherAsset {
    asset: string,
    amount: number
}

export interface Balance {
    lovelace: Number,
    otherAssets: OtherAsset[]
}

export async function getBalance(walletApi: any) {
    const balanceHex = await walletApi.getBalance();
    const balanceBuffer = hexStringToArrayBuffer(balanceHex);
    const balance = CBOR.decode(balanceBuffer);
    return parseValue(balance);
}

export async function getAddress(networkId: number, walletApi: any) {
    const addressHex = await walletApi.getChangeAddress()
    const addressArray = new Uint8Array(hexStringToArrayBuffer(addressHex));
    const addressWords = B.bech32.toWords(addressArray);
    const address = B.bech32.encode(getAddressPrefix(networkId), addressWords, 1000)
    return address;
}

function getAddressPrefix(networkId: number) {
    return networkId == 1 ? "addr" : "addr_test";
}

function parseValue(v: any): Balance {
    if(typeof(v) === "number") {
        return {
            lovelace: v,
			otherAssets: []
        };
    } else {
        const lovelace = v[0];
        const otherAssets = []
        for (var policyStr in v[1]) {
            var policyInts = new Uint8Array(policyStr.split(",").map(v => parseInt(v)));
            const policy = uint8ArrayToHexString(policyInts);
            for (var assetStr in v[1][policyStr]) {
                var assetInts = new Uint8Array(assetStr.split(",").map(v => parseInt(v)));
                const asset = hex2a(uint8ArrayToHexString(assetInts));
                otherAssets.push({
					asset: policy + "." + asset,
					amount: v[1][policyStr][assetStr]
  	          	});
			}
        }
        return { lovelace, otherAssets };
    }
}