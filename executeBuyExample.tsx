import { Wallet } from "walletConnector"

// Load csl web assembly
let S: typeof import('@emurgo/cardano-serialization-lib-browser');
import('@emurgo/cardano-serialization-lib-browser').then(module => {
  S = module
});

export interface MintResult {
  isSuccess: boolean,
  txId?: string,
  errorMessage?: string
}

export async function executeBuy(adaCost: number, targetAddress: string, wallet: Wallet): Promise<MintResult> {
  const txBuilder =  S.TransactionBuilder.new(S.TransactionBuilderConfigBuilder.new()
    .max_tx_size(16384)
    .pool_deposit(S.BigNum.from_str('500000000'))
    .key_deposit(S.BigNum.from_str('2000000'))
    .fee_algo(S.LinearFee.new(S.BigNum.from_str('44'), S.BigNum.from_str('155381')))
    .max_value_size(5000)
    .coins_per_utxo_word(S.BigNum.from_str('34482'))
    .build()
  );
  const lovelaceCost = adaCost * 1000000;

  txBuilder.add_output_coin(
      S.Address.from_bech32(targetAddress),
      S.BigNum.from_str(lovelaceCost.toString()))

  const transactionUnspentOutputs = S.TransactionUnspentOutputs.new();
  try {
    const utxosHex = await wallet!.walletApi.getUtxos()
    utxosHex.forEach(((u: any) => transactionUnspentOutputs.add(S.TransactionUnspentOutput.from_bytes(Buffer.from(u, "hex")))));
    txBuilder.add_inputs_from(transactionUnspentOutputs, S.CoinSelectionStrategyCIP2.LargestFirst);

    const changeAddress = S.Address.from_bech32(wallet!.address);
    txBuilder.add_change_if_needed(changeAddress);
  } catch {
    return {
      isSuccess: false,
      errorMessage: "Unable to construct a valid UTXO set for the mint transaction."
    };
  }

  const transaction = S.Transaction.new(txBuilder.build(), S.TransactionWitnessSet.new());
  const transactionBytes = Buffer.from(transaction.to_bytes()).toString("hex");
  let witnessSetBytes;
  try {
     witnessSetBytes = await wallet!.walletApi.signTx(transactionBytes);
  } catch {
    return {
      isSuccess: false,
      errorMessage: "Transaction signing failed."
    };
  }
  const witnessSet = S.TransactionWitnessSet.from_bytes(Buffer.from(witnessSetBytes, "hex"))
  const signedTx = S.Transaction.new(transaction.body(), witnessSet)
  const bsignedTx = Buffer.from(signedTx.to_bytes()).toString("hex")
  console.log("Transaction Bytes: " + bsignedTx);
  try {
    const transactionId = await wallet!.walletApi.submitTx(bsignedTx);
    console.log("Transaction ID: " + transactionId)
    return {
      isSuccess: true,
      txId: transactionId
    };
  } catch (e) {
    console.log(e);
    return {
      isSuccess: false,
      errorMessage: "Transaction submission failed."
    };
  }
}
