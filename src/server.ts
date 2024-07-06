import dotenv from 'dotenv';
dotenv.config();

import express, { raw } from 'express';
const app = express();
import cors from 'cors';
import * as nearAPI from 'near-api-js';
import { KeyPair, utils } from 'near-api-js';
const { keyStores } = nearAPI;
const { Contract } = nearAPI;
const myKeyStore = new keyStores.InMemoryKeyStore();



app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({ origin: ['https://spearonnear.github.io/SpearHit', 'https://ashikurrahman25.github.io','https://spearonnear.github.io', '*'] }));

const { connect } = nearAPI;

const testConfig = {
  keyStore: myKeyStore, // first create a key store
  networkId: 'testnet',
  nodeUrl: 'https://rpc.testnet.near.org',
  walletUrl: 'https://testnet.mynearwallet.com/',
  helperUrl: 'https://helper.testnet.near.org',
  explorerUrl: 'https://testnet.nearblocks.io',
};

const mainConfig = {
  keyStore: myKeyStore, // first create a key store
  networkId: 'mainnet',
  nodeUrl: 'https://rpc.mainnet.near.org',
  walletUrl: 'https://wallet.mainnet.near.org',
  helperUrl: 'https://helper.mainnet.near.org',
  explorerUrl: 'https://nearblocks.io',
};

//{"account_id":"tr001.testnet","public_key":"ed25519:6GBJeiHaW2F4YHFbDptMunmbpswPTTHTGsTNiPxgmQEH",
//"private_key":"ed25519:kodWpHkpVBoTQ7YK8fp8gxuemB69pHGhQujwhZsE9E3hKwtDtEcygwofCZbb2yEusEZnS85ry5XGwqcQHSXZC77"}

let contract: nearAPI.Contract;
let account: nearAPI.Account;

const setup = async () => {

  console.log("setup");
  const PRIVATE_KEY = "ed25519:kodWpHkpVBoTQ7YK8fp8gxuemB69pHGhQujwhZsE9E3hKwtDtEcygwofCZbb2yEusEZnS85ry5XGwqcQHSXZC77"; // Directly use the private key
  const keyPair = KeyPair.fromString(PRIVATE_KEY);
  await myKeyStore.setKey('testnet', 'tr001.testnet', keyPair);
  
  const near = await connect(
    testConfig
  );


  account = await near.account("tr001.testnet");
  const methodOptions = {
    viewMethods: ['ft_balance_of'],
    changeMethods: [`send_ft_to_user`],
    useLocalViewExecution: true 
  };

  contract = new Contract(account,"tr001.testnet",
  methodOptions
);
console.log("Setup Done");
};


 setup();

app.get('/balance', async (req, res) => {

  try {
    const { account_id } = req.query;
    console.log(account_id)
  const _bal = await (contract as any)['ft_balance_of']({
    account_id:account_id
  })

  const balance = _bal/Math.pow(10,8)

  
    res.json({ balance });
  } catch (error) {
    res.status(500).json({ error: error });
  }

});



app.post('/claim', async (req, res) => {

  try {

    console.log(req.body)
    const { receiver_id, amount } = req.body;


    if (!receiver_id) {
      return res.status(400).json({ error: 'Missing "greeting" in the request body.' });
    }

      

    const functionCallResult = await account.functionCall({
      contractId: 'tr001.testnet',
      methodName: 'mint',
      args: {
        receiver_id,
        amount,
      },
    });


    function isFailureStatus(status: any): status is { Failure: any } {
      return status && typeof status === 'object' && 'Failure' in status;
    }
    
    function isSuccessStatus(status: any): status is { SuccessValue: any } {
      return status && typeof status === 'object' && 'SuccessValue' in status;
    }

    function stringifyWithDepth(obj:any, depth = 5) {
      return JSON.stringify(obj, (key, value) => (depth && typeof value === 'object' && value !== null) ? {...value, depth: depth - 1} : value, 2);
    }
    
    function getExecutionError(error: any): string | null {
      if (error && error.ActionError && error.ActionError.kind && error.ActionError.kind.FunctionCallError) {
        return error.ActionError.kind.FunctionCallError.ExecutionError || null;
      }
      return null;
    }

    // Check for overall transaction success
    if (isSuccessStatus(functionCallResult.status)) {
      // console.log('Transaction succeeded:', functionCallResult.status.SuccessValue);
    } else {
      // console.log('Transaction status:', functionCallResult.status);
    }
    let status = 'success';
    let exception = '';

    if (functionCallResult.receipts_outcome) {
      functionCallResult.receipts_outcome.forEach(outcome => {
        const outcomeStatus = outcome.outcome.status;
    
        if (isFailureStatus(outcomeStatus)) {
          status = 'error';
          // console.error('Transaction failed in outcome:', stringifyWithDepth (outcomeStatus.Failure));
          // Extract the detailed execution error
          const executionError = getExecutionError(outcomeStatus.Failure);
          exception = executionError!;

          if (executionError) {
            console.error('Execution error:', executionError);
          } else {
            console.error('Detailed error info:', outcomeStatus.Failure);
          }
        } else if (isSuccessStatus(outcomeStatus)) {
          // console.log('Receipt outcome succeeded:', outcomeStatus.SuccessValue);
        } else {
          // console.log('Receipt outcome status:', outcomeStatus);
        }
      });
    }

    let result:any;
    if(status === 'success'){
      result ={ success: true, message: "Successfully claimed reward!",txnLink:`https://testnet.nearblocks.io/txns/${functionCallResult.transaction_outcome.id}` }
    }
    else{
      result = { success: false, message: exception ,txnLink:`null`}
    }
  res.json(result);

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const botToken = '6541421797:AAH6VJiuKo_RREGj6g9IMOi0gjOBDGgTFf8';

app.post('/sendMessage', async (req, res) => {
  const { chatId, message, threadId } = req.body;

  if (!chatId || !message || !threadId) {
      return res.status(400).send('chatId, message, and threadId are required');
  }

  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const data = {
      chat_id: chatId,
      text: message,
      message_thread_id: threadId,
      parse_mode: 'HTML',
  };

  try {
      const response = await fetch(url, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
      });
      const result = await response.json();

      if (result.ok) {
          res.status(200).json('Message sent successfully');
      } else {
          res.status(500).json(`Error sending message: ${result.description}`);
      }
  } catch (error:any) {
      res.status(500).json(`Error: ${error.message}`);
  }
});

const port = process.env.PORT || 9000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
