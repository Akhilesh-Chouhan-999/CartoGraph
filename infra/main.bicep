@description('Primary Azure deployment region')
param location string = resourceGroup().location

@description('Environment prefix for resources')
param environmentName string = 'prod'

@description('Base name for CartoGraph resources')
param appName string = 'cartograph'

@description('Container image for CartoGraph server (e.g. acr.azurecr.io/cartograph-server:latest)')
param serverImage string = 'mcr.microsoft.com/azuredocs/aci-helloworld:latest'

@description('CORS allowed client URL (Frontend origin, e.g. https://<app>.azurestaticapps.net)')
param clientUrl string = ''

@description('JWT Secret for token signing (at least 32 characters)')
@secure()
param jwtSecret string

@description('MongoDB connection string')
@secure()
param mongoUri string

@description('Redis connection string (redis:// or rediss://)')
@secure()
param redisUrl string

@description('Optional GitHub Personal Access Token for higher rate limits')
@secure()
param githubToken string = ''

@description('Optional OpenAI API Key for AI codebase chat')
@secure()
param openaiApiKey string = ''

@description('OpenAI Model name')
param openaiModel string = 'gpt-4o-mini'

@description('Log level for server output')
@allowed([
  'fatal'
  'error'
  'warn'
  'info'
  'debug'
  'silent'
])
param logLevel string = 'info'

@description('Optional Google OAuth Client ID')
param googleClientId string = ''

@description('Optional Google OAuth Client Secret')
@secure()
param googleClientSecret string = ''

@description('Optional GitHub OAuth Client ID')
param githubOAuthClientId string = ''

@description('Optional GitHub OAuth Client Secret')
@secure()
param githubOAuthClientSecret string = ''

@description('Optional GitLab OAuth Client ID')
param gitlabClientId string = ''

@description('Optional GitLab OAuth Client Secret')
@secure()
param gitlabClientSecret string = ''

@description('Optional GitHub Container Registry username')
param ghcrUsername string = ''

@description('Optional GitHub Container Registry token')
@secure()
param ghcrToken string = ''

var uniqueSuffix = uniqueString(resourceGroup().id)
var logAnalyticsName = '${appName}-${environmentName}-logs-${uniqueSuffix}'
var containerAppEnvName = '${appName}-${environmentName}-cae-${uniqueSuffix}'
var serverAppName = '${appName}-api-${uniqueSuffix}'
var staticWebAppName = '${appName}-web-${uniqueSuffix}'

// 1. Log Analytics Workspace
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: logAnalyticsName
  location: location
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// 2. Azure Container Apps Managed Environment (Consumption)
resource containerAppEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: containerAppEnvName
  location: location
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

// 3. Azure Container App: Server & BullMQ Worker
resource serverApp 'Microsoft.App/containerApps@2024-03-01' = {
  name: serverAppName
  location: location
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      ingress: {
        external: true
        targetPort: 5000
        transport: 'auto'
        allowInsecure: false
        corsPolicy: {
          allowedOrigins: empty(clientUrl) ? ['*'] : [clientUrl]
          allowCredentials: true
          allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
          allowedHeaders: ['*']
        }
      }
      secrets: [
        {
          name: 'jwt-secret'
          value: jwtSecret
        }
        {
          name: 'mongo-uri'
          value: mongoUri
        }
        {
          name: 'redis-url'
          value: redisUrl
        }
        {
          name: 'github-token'
          value: empty(githubToken) ? 'disabled' : githubToken
        }
        {
          name: 'openai-api-key'
          value: empty(openaiApiKey) ? 'disabled' : openaiApiKey
        }
        {
          name: 'google-client-secret'
          value: empty(googleClientSecret) ? 'disabled' : googleClientSecret
        }
        {
          name: 'github-oauth-client-secret'
          value: empty(githubOAuthClientSecret) ? 'disabled' : githubOAuthClientSecret
        }
        {
          name: 'gitlab-client-secret'
          value: empty(gitlabClientSecret) ? 'disabled' : gitlabClientSecret
        }
        {
          name: 'ghcr-token'
          value: empty(ghcrToken) ? 'disabled' : ghcrToken
        }
      ]
      registries: !empty(ghcrToken) && !empty(ghcrUsername) ? [
        {
          server: 'ghcr.io'
          username: ghcrUsername
          passwordSecretRef: 'ghcr-token'
        }
      ] : []
    }
    template: {
      containers: [
        {
          name: 'server'
          image: serverImage
          resources: {
            cpu: json('0.5')
            memory: '1.0Gi'
          }
          env: [
            {
              name: 'NODE_ENV'
              value: 'production'
            }
            {
              name: 'PORT'
              value: '5000'
            }
            {
              name: 'API_BASE_URL'
              value: 'https://${serverAppName}.${containerAppEnv.properties.defaultDomain}'
            }
            {
              name: 'CLIENT_URL'
              value: empty(clientUrl) ? 'https://${staticWebApp.properties.defaultHostname}' : clientUrl
            }
            {
              name: 'LOG_LEVEL'
              value: logLevel
            }
            {
              name: 'OPENAI_MODEL'
              value: openaiModel
            }
            {
              name: 'JWT_EXPIRES_IN'
              value: '7d'
            }
            {
              name: 'JWT_SECRET'
              secretRef: 'jwt-secret'
            }
            {
              name: 'MONGO_URI'
              secretRef: 'mongo-uri'
            }
            {
              name: 'REDIS_URL'
              secretRef: 'redis-url'
            }
            {
              name: 'GITHUB_TOKEN'
              secretRef: 'github-token'
            }
            {
              name: 'OPENAI_API_KEY'
              secretRef: 'openai-api-key'
            }
            {
              name: 'GOOGLE_CLIENT_ID'
              value: googleClientId
            }
            {
              name: 'GOOGLE_CLIENT_SECRET'
              secretRef: 'google-client-secret'
            }
            {
              name: 'GITHUB_OAUTH_CLIENT_ID'
              value: githubOAuthClientId
            }
            {
              name: 'GITHUB_OAUTH_CLIENT_SECRET'
              secretRef: 'github-oauth-client-secret'
            }
            {
              name: 'GITLAB_CLIENT_ID'
              value: gitlabClientId
            }
            {
              name: 'GITLAB_CLIENT_SECRET'
              secretRef: 'gitlab-client-secret'
            }
          ]
          probes: [
            {
              type: 'Liveness'
              httpGet: {
                path: '/health'
                port: 5000
                scheme: 'HTTP'
              }
              periodSeconds: 30
              failureThreshold: 3
            }
            {
              type: 'Readiness'
              httpGet: {
                path: '/health'
                port: 5000
                scheme: 'HTTP'
              }
              periodSeconds: 15
              failureThreshold: 3
            }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 2
        rules: [
          {
            name: 'http-rule'
            http: {
              metadata: {
                concurrentRequests: '50'
              }
            }
          }
        ]
      }
    }
  }
}

// 4. Azure Static Web App (Frontend Vite React SPA)
resource staticWebApp 'Microsoft.Web/staticSites@2023-12-01' = {
  name: staticWebAppName
  location: location == 'eastus2' ? 'eastus2' : 'centralus' // Static Web Apps available regions
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
    allowConfigFileUpdates: true
    stagingEnvironmentPolicy: 'Disabled'
  }
}

output serverFqdn string = serverApp.properties.configuration.ingress.fqdn
output serverUrl string = 'https://${serverApp.properties.configuration.ingress.fqdn}'
output staticWebAppDefaultHostname string = staticWebApp.properties.defaultHostname
output staticWebAppUrl string = 'https://${staticWebApp.properties.defaultHostname}'
output staticWebAppName string = staticWebApp.name
output serverAppName string = serverApp.name
output resourceGroupName string = resourceGroup().name
