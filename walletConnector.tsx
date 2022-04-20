import React, { useEffect, useState } from "react";
import { getAddress, getBalance, Balance} from "./walletUtils"

export interface Wallet {
  walletApi: any,
  balance: Balance,
  address: string,
  networkId: number,
  walletName: string
}

// set up typing for cardano in window
declare global {
  interface Window { cardano: any; }
}

interface WalletConnectorProps {
	setWallet: (wallet: Wallet|null) => void,
	wallet: Wallet|null
}

export const WalletConnector: React.FC<WalletConnectorProps> = (props) => {
  const [isNamiInstalled, setIsNamiInstalled] = useState<boolean>(false)
  const [isCcvaultInstalled, setIsCcvaultInstalled] = useState<boolean>(false)
  const [isFlintInstalled, setIsFlintInstalled] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string|null>(null);

  const updateWallet = async (walletApi: any, walletName: string) => {
    const networkId = await walletApi.getNetworkId();
    const address = await getAddress(networkId, walletApi);
    const balance = await getBalance(walletApi);
    const wallet: Wallet = {
      walletApi, address, networkId, balance, walletName
    };
    props.setWallet(wallet);
  };

  useEffect(() => {
    // Run a check every 2 seconds to see if the user updated their wallet settings
    // e.g. changed the connected network or account     
    // If so, update the wallet state to propogate changes.
    const interval = setInterval(async () => {
      if (props.wallet === null) {
        return
      }

      try {
        const walletApi = await window.cardano[props.wallet.walletName].enable();
        const networkId = await walletApi.getNetworkId();
        const address = await getAddress(networkId, walletApi);
        if(address !== props.wallet.address) {
          updateWallet(walletApi, props.wallet.walletName);
        }
      } catch (e) {
        // Sometimes CCVault throws AccountChanged error when calling `enable`
        // after the enabled wallet is changed. The subsequent call will succeed though.
        return;
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [props]); // need to set the dependency on props so the closure doesn't get stale.

  const connectToWallet = async (walletName: string) => { 
    let walletApi: any;
    try {
      walletApi = await window.cardano[walletName].enable();
    } catch(e) {
      console.log("Unable to connect to wallet.");
      console.log(e);
      const isEnabled = await window.cardano[walletName].isEnabled();
      if(!isEnabled) {
        setErrorMessage(`Unable to connect to ${walletName}. Please enable wallet access when prompted.`);
      } else {
        setErrorMessage(`Unable to connect to ${walletName}. Please an ensure a wallet is selected and allows Dapp connections.`);
      }
      props.setWallet(null);
      return;
    }

    setErrorMessage(null);
    updateWallet(walletApi, walletName);
  };

  useEffect(() => {
    setIsNamiInstalled('cardano' in window && 'nami' in window.cardano);
    setIsCcvaultInstalled('cardano' in window && 'ccvault' in window.cardano);
    setIsFlintInstalled('cardano' in window && 'flint' in window.cardano);
  });
  const namiColor = "bg-green-500";
  const ccvaultColor = "bg-purple-500";
  const flintColor = "bg-yellow-600";
  var selectedWalletColor = null;
  if (props.wallet?.walletName === "flint") {
    selectedWalletColor = flintColor;
  } else if (props.wallet?.walletName === "ccvault") {
    selectedWalletColor = ccvaultColor;
  } else if (props.wallet?.walletName === "nami") {
    selectedWalletColor = namiColor;
  } 
  return (
    <div className="text-center text-gray-500 font-semibold mt-1">
        {
          props.wallet === null ? (
             <div className="container flex pt-1 mx-auto max-width-480">
			          <button onClick={() => connectToWallet("nami")} disabled={!isNamiInstalled}
                  className={`text-white hover:text-white px-3 py-2 rounded-md text-base font-medium display-block mx-auto ${isNamiInstalled ? namiColor : "bg-gray-200"}`}>
			            {isNamiInstalled ? "Connect to Nami" : "Nami not installed"}
			          </button>

			          <button onClick={() => connectToWallet("ccvault")} disabled={!isCcvaultInstalled}
                  className={`text-white hover:text-white px-3 py-2 rounded-md text-base font-medium display-block mx-auto ${isCcvaultInstalled ? ccvaultColor : "bg-gray-200"}`}>
			            {isCcvaultInstalled ? "Connect to CCVault" : "CCVault not installed"}
			          </button>

			          <button onClick={() => connectToWallet("flint")} disabled={!isFlintInstalled}
                  className={`text-white hover:text-white px-3 py-2 rounded-md text-base font-medium display-block mx-auto ${isFlintInstalled ? flintColor : "bg-gray-200"}`}>
			            {isFlintInstalled ? "Connect to Flint" : "Flint not installed"}
			          </button>
             </div>
            )
            : ( 
             <div className="pt-1 mx-auto">
			        <button onClick={() => props.setWallet(null)} className={`text-white hover:text-white px-3 py-2 rounded-md text-base font-medium ${selectedWalletColor} display-block mx-auto`}>
			          {props.wallet.address.substring(0, 12) + "..." + props.wallet.address.substring(props.wallet.address.length - 4)} (Click to disconnect)
			        </button>
             </div>
            )
        }
        {errorMessage !== null ? (<div className="text-red-500">{errorMessage}</div>) : null}
    </div>
  );
};