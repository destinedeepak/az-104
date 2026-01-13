# Azure Key Vault Setup Guide

This application uses Azure Key Vault to securely manage database passwords in production, following best practices for secret management.

## Architecture Overview

- **Development** (`NODE_ENV=development`): Uses `.env` file for all configuration
- **Production** (`NODE_ENV=production`): Uses Azure Key Vault for `db-password`, App Service settings for other config
- **Fail-Fast**: If Key Vault is unreachable in production, the app throws an error instead of falling back

## Local Development Setup

1. All configuration is in `.env` file:
```bash
NODE_ENV=development
DB_SERVER=az-104.database.windows.net
DB_PORT=1433
DB_NAME=free-sql-db-5815210
DB_USER=CloudSAc864301e
DB_PASSWORD=myPassword@123
```

2. Start the application:
```bash
npm start
```

The app will use local `.env` values and NOT connect to Key Vault.

## Production Setup (Azure App Service)

### Step 1: Enable Managed Identity

1. Go to Azure Portal → Your App Service
2. Navigate to **Identity** → **System assigned**
3. Set Status to **ON**
4. Click **Save**
5. Copy the **Object (principal) ID** (you'll need this for Key Vault access)

### Step 2: Create Key Vault Secret

1. Go to Azure Portal → Your Key Vault (`az104-key-vault1`)
2. Navigate to **Secrets** → **Generate/Import**
3. Create a new secret:
   - **Name**: `db-password`
   - **Value**: Your actual database password (e.g., `myPassword@123`)
4. Click **Create**

### Step 3: Grant Key Vault Access to App Service

1. In Key Vault, go to **Access policies** → **Create**
2. **Secret permissions**: Select `Get` and `List`
3. Click **Next**
4. **Principal**: Search for your App Service name and select it
5. Click **Next** → **Next** → **Create**

### Step 4: Configure App Service Application Settings

1. Go to Azure Portal → Your App Service
2. Navigate to **Configuration** → **Application settings**
3. Add the following settings:

| Name | Value | Note |
|------|-------|------|
| `NODE_ENV` | `production` | Enables Key Vault mode |
| `KEY_VAULT_URL` | `https://az104-key-vault1.vault.azure.net/` | Your Key Vault URL |
| `DB_SERVER` | `az-104.database.windows.net` | Database server |
| `DB_PORT` | `1433` | Database port |
| `DB_NAME` | `free-sql-db-5815210` | Database name |
| `DB_USER` | `CloudSAc864301e` | Database user |

4. **IMPORTANT**: Do NOT add `DB_PASSWORD` - it will be fetched from Key Vault
5. Click **Save** → **Continue**

### Step 5: Deploy and Verify

1. Deploy your application to App Service
2. Check the application logs:
   - Look for: `Production mode: Key Vault initialized at https://...`
   - Look for: `Production mode: fetching db-password from Key Vault...`
3. If there's an error accessing Key Vault, the app will fail with a clear error message

## Testing Key Vault Locally (Optional)

To test Key Vault integration locally:

1. Authenticate with Azure CLI:
```bash
az login
```

2. Set environment variables:
```bash
export NODE_ENV=production
export KEY_VAULT_URL=https://az104-key-vault1.vault.azure.net/
export DB_SERVER=az-104.database.windows.net
export DB_PORT=1433
export DB_NAME=free-sql-db-5815210
export DB_USER=CloudSAc864301e
```

3. Run the test:
```bash
node test-keyvault.js
```

## Security Best Practices

✅ **DO:**
- Use Managed Identity for authentication (no credentials in code)
- Store only sensitive data (passwords) in Key Vault
- Use fail-fast approach in production
- Set `NODE_ENV=production` in production environments

❌ **DON'T:**
- Store `DB_PASSWORD` in App Service settings when using Key Vault
- Use fallbacks to `.env` in production
- Commit `.env` file to git (add to `.gitignore`)
- Share Key Vault access policies unnecessarily

## Troubleshooting

### Error: "KEY_VAULT_URL is required in production environment"
- Make sure `KEY_VAULT_URL` is set in App Service Configuration

### Error: "Failed to initialize Key Vault client in production"
- Verify Managed Identity is enabled on App Service
- Check that the Key Vault name is correct in the URL

### Error: "Key Vault secret 'db-password' not found or access denied"
- Verify the secret exists in Key Vault with the exact name `db-password`
- Check that App Service Managed Identity has access policy in Key Vault
- Verify permissions include `Get` and `List` for secrets

### Database connection fails
- Check that all DB settings (SERVER, PORT, NAME, USER) are correct in App Service settings
- Verify the App Service IP is allowed in Azure SQL Server firewall rules

## Files

- `keyvault.js` - Key Vault integration module
- `.env` - Local development configuration
- `test-keyvault.js` - Configuration testing script
- `database.js` - Database connection using Key Vault
- `server.js` - Express server

## Support

For issues related to:
- Azure Key Vault: Check Azure documentation
- Managed Identity: Verify App Service configuration
- Database connection: Check Azure SQL firewall rules
