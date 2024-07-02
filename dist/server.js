"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const cors_1 = __importDefault(require("cors"));
const nearAPI = __importStar(require("near-api-js"));
const near_api_js_1 = require("near-api-js");
const { keyStores } = nearAPI;
const { Contract } = nearAPI;
const myKeyStore = new keyStores.InMemoryKeyStore();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cors_1.default)({ origin: ['https://spearonnear.github.io/SpearHit', 'https://ashikurrahman25.github.io', 'https://spearonnear.github.io', '*'] }));
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
let contract;
let account;
const setup = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("setup");
    const PRIVATE_KEY = "ed25519:kodWpHkpVBoTQ7YK8fp8gxuemB69pHGhQujwhZsE9E3hKwtDtEcygwofCZbb2yEusEZnS85ry5XGwqcQHSXZC77"; // Directly use the private key
    const keyPair = near_api_js_1.KeyPair.fromString(PRIVATE_KEY);
    yield myKeyStore.setKey('testnet', 'tr001.testnet', keyPair);
    const near = yield connect(testConfig);
    account = yield near.account("tr001.testnet");
    const methodOptions = {
        viewMethods: ['ft_balance_of'],
        changeMethods: [`send_ft_to_user`],
        useLocalViewExecution: true
    };
    contract = new Contract(account, "tr001.testnet", methodOptions);
    console.log("Setup Done");
});
setup();
app.get('/balance', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { account_id } = req.query;
        console.log(account_id);
        const _bal = yield contract['ft_balance_of']({
            account_id: account_id
        });
        const balance = _bal / Math.pow(10, 8);
        res.json({ balance });
    }
    catch (error) {
        res.status(500).json({ error: error });
    }
}));
app.post('/claim', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(req.body);
        const { receiver_id, amount } = req.body;
        if (!receiver_id) {
            return res.status(400).json({ error: 'Missing "greeting" in the request body.' });
        }
        const functionCallResult = yield account.functionCall({
            contractId: 'tr001.testnet',
            methodName: 'mint',
            args: {
                receiver_id,
                amount,
            },
        });
        function isFailureStatus(status) {
            return status && typeof status === 'object' && 'Failure' in status;
        }
        function isSuccessStatus(status) {
            return status && typeof status === 'object' && 'SuccessValue' in status;
        }
        function stringifyWithDepth(obj, depth = 5) {
            return JSON.stringify(obj, (key, value) => (depth && typeof value === 'object' && value !== null) ? Object.assign(Object.assign({}, value), { depth: depth - 1 }) : value, 2);
        }
        function getExecutionError(error) {
            if (error && error.ActionError && error.ActionError.kind && error.ActionError.kind.FunctionCallError) {
                return error.ActionError.kind.FunctionCallError.ExecutionError || null;
            }
            return null;
        }
        // Check for overall transaction success
        if (isSuccessStatus(functionCallResult.status)) {
            // console.log('Transaction succeeded:', functionCallResult.status.SuccessValue);
        }
        else {
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
                    exception = executionError;
                    if (executionError) {
                        console.error('Execution error:', executionError);
                    }
                    else {
                        console.error('Detailed error info:', outcomeStatus.Failure);
                    }
                }
                else if (isSuccessStatus(outcomeStatus)) {
                    // console.log('Receipt outcome succeeded:', outcomeStatus.SuccessValue);
                }
                else {
                    // console.log('Receipt outcome status:', outcomeStatus);
                }
            });
        }
        let result;
        if (status === 'success') {
            result = { success: true, message: "Successfully claimed reward!", txnLink: `https://testnet.nearblocks.io/txns/${functionCallResult.transaction_outcome.id}` };
        }
        else {
            result = { success: false, message: exception, txnLink: `null` };
        }
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
const port = process.env.PORT || 9000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
