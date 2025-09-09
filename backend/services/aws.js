const { S3Client, PutObjectCommand, CreateBucketCommand } = require('@aws-sdk/client-s3');
const { LambdaClient, CreateFunctionCommand, UpdateFunctionCodeCommand } = require('@aws-sdk/client-lambda');
const { ECSClient, CreateServiceCommand, UpdateServiceCommand } = require('@aws-sdk/client-ecs');

class AWSService {
  constructor(config) {
    const { accessKeyId, secretAccessKey, region = 'us-east-1' } = config;

    this.region = region;

    // S3 Client for static hosting
    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Lambda Client for serverless functions
    this.lambdaClient = new LambdaClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // ECS Client for container deployments
    this.ecsClient = new ECSClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  // S3 Static Site Deployment
  async deployToS3(bucketName, buildFiles, options = {}) {
    try {
      const { acl = 'public-read', createBucket = false } = options;

      // Create bucket if it doesn't exist
      if (createBucket) {
        await this.createS3Bucket(bucketName);
      }

      // Upload build files
      const uploadPromises = buildFiles.map(async (file) => {
        const command = new PutObjectCommand({
          Bucket: bucketName,
          Key: file.key,
          Body: file.body,
          ContentType: file.contentType,
          ACL: acl,
        });

        return await this.s3Client.send(command);
      });

      await Promise.all(uploadPromises);

      return {
        success: true,
        bucketName,
        url: `https://${bucketName}.s3.amazonaws.com`,
      };
    } catch (error) {
      console.error('AWS S3 deployment error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Create S3 bucket
  async createS3Bucket(bucketName) {
    try {
      const command = new CreateBucketCommand({
        Bucket: bucketName,
        CreateBucketConfiguration: {
          LocationConstraint: this.region,
        },
      });

      await this.s3Client.send(command);
      return { success: true };
    } catch (error) {
      console.error('AWS create S3 bucket error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Lambda Function Deployment
  async deployLambdaFunction(functionConfig) {
    try {
      const {
        functionName,
        runtime = 'nodejs18.x',
        handler = 'index.handler',
        code,
        environment = {},
        memorySize = 256,
        timeout = 30,
      } = functionConfig;

      const command = new CreateFunctionCommand({
        FunctionName: functionName,
        Runtime: runtime,
        Handler: handler,
        Code: code,
        Environment: {
          Variables: environment,
        },
        MemorySize: memorySize,
        Timeout: timeout,
        Role: process.env.AWS_LAMBDA_ROLE_ARN, // IAM role ARN for Lambda
      });

      const response = await this.lambdaClient.send(command);

      return {
        success: true,
        functionName: response.FunctionName,
        functionArn: response.FunctionArn,
      };
    } catch (error) {
      console.error('AWS Lambda deployment error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Update Lambda Function
  async updateLambdaFunction(functionName, code) {
    try {
      const command = new UpdateFunctionCodeCommand({
        FunctionName: functionName,
        ...code, // ZipFile or S3Bucket/S3Key
      });

      const response = await this.lambdaClient.send(command);

      return {
        success: true,
        functionName: response.FunctionName,
        lastModified: response.LastModified,
      };
    } catch (error) {
      console.error('AWS Lambda update error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // ECS Container Deployment
  async deployToECS(serviceConfig) {
    try {
      const {
        serviceName,
        clusterName,
        taskDefinition,
        desiredCount = 1,
        loadBalancers = [],
      } = serviceConfig;

      const command = new CreateServiceCommand({
        serviceName,
        cluster: clusterName,
        taskDefinition,
        desiredCount,
        loadBalancers,
      });

      const response = await this.ecsClient.send(command);

      return {
        success: true,
        serviceName: response.service.serviceName,
        serviceArn: response.service.serviceArn,
      };
    } catch (error) {
      console.error('AWS ECS deployment error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Update ECS Service
  async updateECSService(clusterName, serviceName, updates) {
    try {
      const command = new UpdateServiceCommand({
        cluster: clusterName,
        service: serviceName,
        ...updates,
      });

      const response = await this.ecsClient.send(command);

      return {
        success: true,
        serviceName: response.service.serviceName,
      };
    } catch (error) {
      console.error('AWS ECS update error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // CloudFront Distribution for CDN
  async createCloudFrontDistribution(bucketName, options = {}) {
    try {
      const { CloudFrontClient, CreateDistributionCommand } = require('@aws-sdk/client-cloudfront');

      const cloudFrontClient = new CloudFrontClient({
        region: this.region,
        credentials: this.s3Client.config.credentials,
      });

      const {
        domainName = `${bucketName}.s3.amazonaws.com`,
        certificateArn,
        aliases = [],
      } = options;

      const distributionConfig = {
        CallerReference: `deploymate-${Date.now()}`,
        Comment: `DeployMate distribution for ${bucketName}`,
        DefaultCacheBehavior: {
          TargetOriginId: `S3-${bucketName}`,
          ViewerProtocolPolicy: 'redirect-to-https',
          TrustedSigners: {
            Enabled: false,
            Quantity: 0,
          },
          ForwardedValues: {
            QueryString: false,
            Cookies: {
              Forward: 'none',
            },
          },
          MinTTL: 0,
        },
        Origins: {
          Quantity: 1,
          Items: [
            {
              Id: `S3-${bucketName}`,
              DomainName: domainName,
              S3OriginConfig: {
                OriginAccessIdentity: '',
              },
            },
          ],
        },
        Enabled: true,
      };

      // Add SSL certificate if provided
      if (certificateArn && aliases.length > 0) {
        distributionConfig.ViewerCertificate = {
          ACMCertificateArn: certificateArn,
          SSLSupportMethod: 'sni-only',
          MinimumProtocolVersion: 'TLSv1.2_2021',
        };
        distributionConfig.Aliases = {
          Quantity: aliases.length,
          Items: aliases,
        };
      }

      const command = new CreateDistributionCommand({
        DistributionConfig: distributionConfig,
      });

      const response = await cloudFrontClient.send(command);

      return {
        success: true,
        distributionId: response.Distribution.Id,
        domainName: response.Distribution.DomainName,
      };
    } catch (error) {
      console.error('AWS CloudFront distribution error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get deployment status
  async getDeploymentStatus(resourceType, resourceId) {
    try {
      switch (resourceType) {
        case 'lambda':
          const { LambdaClient, GetFunctionCommand } = require('@aws-sdk/client-lambda');
          const lambdaClient = new LambdaClient({
            region: this.region,
            credentials: this.s3Client.config.credentials,
          });

          const command = new GetFunctionCommand({
            FunctionName: resourceId,
          });

          const response = await lambdaClient.send(command);
          return {
            success: true,
            status: response.Configuration.State,
            lastModified: response.Configuration.LastModified,
          };

        case 'ecs':
          const { ECSClient, DescribeServicesCommand } = require('@aws-sdk/client-ecs');
          const ecsClient = new ECSClient({
            region: this.region,
            credentials: this.s3Client.config.credentials,
          });

          // This would need cluster name and service name
          return {
            success: true,
            status: 'running', // Placeholder
          };

        default:
          return {
            success: false,
            error: 'Unsupported resource type',
          };
      }
    } catch (error) {
      console.error('AWS get deployment status error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = AWSService;

