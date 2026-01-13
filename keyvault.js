import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import dotenv from 'dotenv';

dotenv.config();

const IS_PROD = process.env.NODE_ENV === 'production';
const vaultUrl = process.env.KEY_VAULT_URL;

let secretClient = null;
const secretCache = new Map();

if (IS_PROD) {
  if (!vaultUrl) {
    throw new Error('KEY_VAULT_URL is required in production environment');
  }
  
  try {
    const credential = new DefaultAzureCredential();
    secretClient = new SecretClient(vaultUrl, credential);
    console.log(`Production mode: Key Vault initialized at ${vaultUrl}`);
  } catch (error) {
    throw new Error(`Failed to initialize Key Vault client in production: ${error.message}`);
  }
}

async function getSecretFromVault(secretName) {
  if (!secretClient) {
    return null;
  }

  if (secretCache.has(secretName)) {
    return secretCache.get(secretName);
  }

  try {
    const secret = await secretClient.getSecret(secretName);
    secretCache.set(secretName, secret.value);
    return secret.value;
  } catch (error) {
    console.error(`Failed to fetch secret '${secretName}' from Key Vault:`, error.message);
    return null;
  }
}

export async function getConfig() {
  const config = {
    dbServer: process.env.DB_SERVER,
    dbPort: process.env.DB_PORT,
    dbName: process.env.DB_NAME,
    dbUser: process.env.DB_USER,
    dbPassword: null,
    nodeEnv: process.env.NODE_ENV || 'development'
  };

  if (IS_PROD) {
    console.log('Production mode: fetching db-password from Key Vault...');
    const pw = await getSecretFromVault('db-password');
    
    if (!pw) {
      throw new Error("Key Vault secret 'db-password' not found or access denied");
    }
    
    config.dbPassword = pw;
  } else {
    console.log('Dev mode: using .env DB_PASSWORD');
    config.dbPassword = process.env.DB_PASSWORD;
  }

  return config;
}

export async function getSecret(secretName, fallbackEnvVar = null) {
  if (IS_PROD && secretClient) {
    const secretValue = await getSecretFromVault(secretName);
    if (secretValue) {
      return secretValue;
    }
    if (IS_PROD) {
      throw new Error(`Key Vault secret '${secretName}' not found or access denied in production`);
    }
  }
  
  return fallbackEnvVar ? process.env[fallbackEnvVar] : null;
}

export function clearCache() {
  secretCache.clear();
  console.log('Secret cache cleared');
}

export const isUsingKeyVault = () => IS_PROD && secretClient !== null;
