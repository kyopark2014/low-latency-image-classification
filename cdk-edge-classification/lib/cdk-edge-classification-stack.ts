import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from "path";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudFront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apiGateway from 'aws-cdk-lib/aws-apigateway';

export class CdkEdgeClassificationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const stage = "dev"; 

    // s3 
    const s3Bucket = new s3.Bucket(this, "gg-depolyment-storage",{
      // bucketName: bucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      publicReadAccess: false,
      versioned: false,
    });
    new cdk.CfnOutput(this, 'bucketName', {
      value: s3Bucket.bucketName,
      description: 'The nmae of bucket',
    });
    new cdk.CfnOutput(this, 's3Arn', {
      value: s3Bucket.bucketArn,
      description: 'The arn of s3',
    });
    new cdk.CfnOutput(this, 's3Path', {
      value: 's3://'+s3Bucket.bucketName,
      description: 'The path of s3',
    });

    // cloudfront
    const distribution = new cloudFront.Distribution(this, 'cloudfront', {
      defaultBehavior: {
        origin: new origins.S3Origin(s3Bucket),
        allowedMethods: cloudFront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudFront.CachePolicy.CACHING_DISABLED,
        viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      priceClass: cloudFront.PriceClass.PRICE_CLASS_200,  
    });
    new cdk.CfnOutput(this, 'distributionDomainName', {
      value: distribution.domainName,
      description: 'The domain name of the Distribution',
    });

    // Create Edge Lambda for image classification
    const mlLambda = new cloudFront.experimental.EdgeFunction(this, "edge-lambda-api", {
      description: 'lambda function for image classification',
      functionName: 'edge-lambda-classification',
      memorySize: 512,
      code: lambda.DockerImageCode.fromImageAsset(path.join(__dirname, '../../lambda-classification')),
      timeout: cdk.Duration.seconds(30),
    }); 

    // version
    const version = mlLambda.currentVersion;
    const alias = new lambda.Alias(this, 'LambdaAlias', {
      aliasName: stage,
      version,
    });
  }
}
