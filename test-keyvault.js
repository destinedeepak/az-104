import { getConfig, isUsingKeyVault } from './keyvault.js';

console.log('\n=== Key Vault Configuration Test ===\n');

const env = process.env.NODE_ENV || 'development';
console.log(`Environment: ${env}`);
console.log(`Using Key Vault: ${isUsingKeyVault()}\n`);

const config = await getConfig();

console.log('Configuration loaded:');
console.log(`- DB Server: ${config.dbServer}`);
console.log(`- DB Port: ${config.dbPort}`);
console.log(`- DB Name: ${config.dbName}`);
console.log(`- DB User: ${config.dbUser}`);
console.log(`- DB Password: ${config.dbPassword ? '***' + config.dbPassword.slice(-4) : 'not set'}\n`);

if (isUsingKeyVault()) {
  console.log('✓ Production mode - db-password fetched from Azure Key Vault');
  console.log('  Using Managed Identity for authentication');
} else {
  console.log('✓ Development mode - using .env file for all secrets');
  console.log('  To test production mode: Set NODE_ENV=production');
}

console.log('\n=== Production Configuration Setup (Azure App Service) ===');
console.log('1. Enable Managed Identity on App Service:');
console.log('   Azure Portal → App Service → Identity → System assigned → ON');
console.log('\n2. Grant Key Vault access to Managed Identity:');
console.log('   Azure Portal → Key Vault → Access policies → Add Policy');
console.log('   Secret permissions: Get, List');
console.log('   Select principal: [Your App Service name]');
console.log('\n3. Create Key Vault secret:');
console.log('   Azure Portal → Key Vault → Secrets → Generate/Import');
console.log('   Name: db-password');
console.log('   Value: [Your actual database password]');
console.log('\n4. App Service Configuration → Application settings:');
console.log('   - NODE_ENV=production');
console.log('   - KEY_VAULT_URL=https://az104-key-vault1.vault.azure.net/');
console.log('   - DB_SERVER=az-104.database.windows.net');
console.log('   - DB_PORT=1433');
console.log('   - DB_NAME=free-sql-db-5815210');
console.log('   - DB_USER=CloudSAc864301e');
console.log('   - (DO NOT add DB_PASSWORD - it comes from Key Vault)\n');
