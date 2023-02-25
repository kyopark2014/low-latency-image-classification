# Low Latency Image Classification

Smart Factory와 같은 경우에 지연시간이 매우 중요해서 주로 온프레미스(on-premise)을 많이 이용하고 있습니다. 이를 위해선 Factory가 있는 장소에 장비와 인력을 상주시켜야 하는 어려움이 있고, Cloud 특유의 비용 효율성 및 안정적인 시스템을 구축의 장점을 활용할 수 없습니다. 또한, Cloud에 시스템을 구축했더라도, 특정 리전에 시스템을 구축하였다면, Global 서비스의 경우에 다른 먼지역에서 들어오는 요청시 네트워크 지연의 문제점을 피할 수 없습니다. Amazon CloudFront는 WEB 컨텐츠인 html, css, js, image 파일등을 edge에 두어서, 사용자의 요청이 있을때에 가장 가까운 edge location으로 라우팅함으로 웹서비스의 속도를 향상시킵니다. 여기에서는 CloudFront에 Edge Lambda를 이용하여 이미지 분류에 대한 Latency를 줄이는 방법을 설명합니다. 

 2020년 12월부터 Lambda가 컨테이너 이미지를 지원함으로써, [Lambda를 머신러닝(Machine Learning) 추론](https://aws.amazon.com/ko/blogs/korea/new-for-aws-lambda-container-image-support/)을 배포하는 용도로 사용할 수 있게 되었습니다.

S3는 Web hosting을 위한 html, image, css의 storage 역할을 수행합니다.

![image](https://user-images.githubusercontent.com/52392004/221320135-62863c02-11f8-47cf-b468-906281ecca6a.png)




## 구현 및 실패

### Edge Lambda의 ECR 미지원

아래와 같이 ECR을 이용해 Docker Container Image 배포를 시도하면 아래와 같은 에러를 발생합니다. 

```java
6:20:46 AM | CREATE_FAILED        | AWS::CloudFront::Distribution                   | cloudfrontB139FFFD
Resource handler returned message: "Invalid request provided: AWS::CloudFront::Distribution: Lambda@Edge does not support functions with a repository type of ECR (Service: CloudFront, Status Code: 400, Request ID: 9d37f5f8-
b8da-4e5a-b577-46cb505f046a)" (RequestToken: cc4268d3-5af6-af9c-e465-076a0be8229e, HandlerErrorCode: InvalidRequest)
```

사용된 코드는 아래와 같습니다. 

```java
// Create Edge Lambda for image classification
    const lambdaClassifier = new cloudFront.experimental.EdgeFunction(this, "edge-lambda-api", {
      functionName: 'edge-lambda-classification',
      memorySize: 512,
      runtime: lambda.Runtime.FROM_IMAGE,
      handler: lambda.Handler.FROM_IMAGE,
      code: lambda.Code.fromAssetImage(path.join(__dirname, "../../lambda-classification")),
      timeout: cdk.Duration.seconds(30),
    }); 
```

그런데, CDK에서 빌드시에 ECR 미지원에 대해서는 추가 검토할 계획입니다.

[이미지 리사이즈 CloudFront + Lambda@Edge](https://v3.leedo.me/image-resize-by-cloudfront-lambda-edge)


방안중에 하나는 로컬 Docker 이미지로 Lambda 구성하는것입니다. 

[[Docker] 로컬 Docker 이미지 파일 저장 후 원격 서버에 배포하기](https://hwanlee.tistory.com/18)와 같이 아래처럼 docker image를 tar로 저장할 수 있습니다. 

```java
docker save 이미지명 > 파일명.tar
```

[class DockerImage](https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_core.DockerImage.html)을 이용해 Docker container image를 파일로 저장후에 로드해서 쓸수 있다면 ECR 없이 Edge Lambda 생성이 가능할것으로 보여집니다. (실제해보지는 않음)

```java
const entry = '/path/to/function';
const image = DockerImage.fromBuild(entry);
```

### CloudFront 연동시 실패

Edge Lambda를 console에서 생성하고 CloudFront와 연동시 아래처럼 에러가 발생합니다. 아래와 같이 runtime으로 IMAGE를 미지원하면 ML Docker Container를 Edge Lambda에서 미지원으로 보아야 할것으로 보여집니다. 

<img width="882" alt="image" src="https://user-images.githubusercontent.com/52392004/221349568-8484c0f7-53cc-4770-9ef0-b4fc14aae47a.png">

상기와 같은 이유로 현재 상태에서 우선 hold후에 추후 시간이 될때 재시도해 볼 계획입니다.

### Reguest Type

[Using AWS Lambda with CloudFront Lambda@Edge](https://docs.aws.amazon.com/lambda/latest/dg/lambda-edge.html)와 같이 Lambda@Edge는 별도의 Provisioning이나 서버를 관리할 필요없이 CloudFront event에 대한 request나 response에 변경할 수 있습니다. 여기서는 Viewer Request 단계에서 Lambda@Edge를 이용하고자 합니다. 

![image](https://user-images.githubusercontent.com/52392004/221347696-8c240017-7de3-4f5d-abf1-dc07af8af6b0.png)

eventType은 아래처럼 사용합니다.

- eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST
- eventType: cloudfront.LambdaEdgeEventType.VIEWER_RESPONSE

실제 사용하는 예제는 아래와 같습니다. 

```java
const myFunc1 = new cloudfront.experimental.EdgeFunction(this, 'MyFunction1', {
  runtime: lambda.Runtime.NODEJS_14_X,
  handler: 'index.handler',
  code: lambda.Code.fromAsset(path.join(__dirname, 'lambda-handler1')),
  stackId: 'edge-lambda-stack-id-1',
});

declare const myFunc: cloudfront.experimental.EdgeFunction;
// assigning at Distribution creation
declare const myBucket: s3.Bucket;
const myOrigin = new origins.S3Origin(myBucket);
const myDistribution = new cloudfront.Distribution(this, 'myDist', {
  defaultBehavior: { origin: myOrigin },
  additionalBehaviors: {
    'images/*': {
      origin: myOrigin,
      edgeLambdas: [
        {
          functionVersion: myFunc.currentVersion,
          eventType: cloudfront.LambdaEdgeEventType.ORIGIN_REQUEST,
          includeBody: true, // Optional - defaults to false
        },
      ],
    },
  },
});

// assigning after creation
myDistribution.addBehavior('images/*', myOrigin, {
  edgeLambdas: [
    {
      functionVersion: myFunc.currentVersion,
      eventType: cloudfront.LambdaEdgeEventType.VIEWER_RESPONSE,
    },
  ],
});
```

[class EdgeFunction (construct)](https://docs.aws.amazon.com/cdk/api/v1/docs/@aws-cdk_aws-cloudfront.experimental.EdgeFunction.html)


#### Region 설정

Edge Lambda는 'us-east-1'에서만 설정할 수 있습니다. 'bin/cdk-edge-classification.ts"에서 아래와 같이 region을 'us-east-1'으로 고정합니다.

```java
const app = new cdk.App();
new CdkEdgeClassificationStack(app, 'CdkEdgeClassificationStack', {
  env: {
    region: 'us-east-1',
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
```


## ResNet-50 추론

ResNet-50을 이용하여 이미지 분류(Image Classification)에 대한 추론을 구현합니다. 


## Edge Lambda를 이용한 Low Latency 구현

Edge에 있는 CloudFront에서 Lambda를 통해 네트워크에 대한 지연시간을 줄입니다.

Edge Lambda로 구현을 하면 Global 서비스라면 어디든지 Low Latency를 구현할 수 있습니다.


## Reference

[머신러닝(ML) 기반의 이미지 분류를 위한 API 서버 만들기](https://github.com/kyopark2014/image-classification-api-server)

[Adding HTTP Security Headers Using Lambda@Edge and Amazon CloudFront](https://aws.amazon.com/ko/blogs/networking-and-content-delivery/adding-http-security-headers-using-lambdaedge-and-amazon-cloudfront/)


[Lambda@Edge – Intelligent Processing of HTTP Requests at the Edge](https://aws.amazon.com/ko/blogs/aws/lambdaedge-intelligent-processing-of-http-requests-at-the-edge/)

[이미지 리사이즈 CloudFront + Lambda@Edge](https://v3.leedo.me/image-resize-by-cloudfront-lambda-edge)

[How to get and set Account ID and Region in AWS CDK](https://bobbyhadz.com/blog/cdk-get-region-accountid)

[@aws-cdk/aws-cloudfront](https://www.npmjs.com/package/@aws-cdk/aws-cloudfront?activeTab=readme)

[Lambda@Edge를 사용하여 엣지에서 사용자 지정](https://docs.aws.amazon.com/ko_kr/AmazonCloudFront/latest/DeveloperGuide/lambda-at-the-edge.html)

[자습서: 간단한 Lambda@Edge 함수 생성](https://docs.aws.amazon.com/ko_kr/AmazonCloudFront/latest/DeveloperGuide/lambda-edge-how-it-works-tutorial.html)
