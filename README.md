# Low Latency Image Classification

Smart Factory와 같은 경우에 지연시간이 매우 중요해서 주로 온프레미스(on-premise)을 많이 이용하고 있습니다. 이를 위해선 Factory가 있는 장소에 장비와 인력을 상주시켜야 하는 어려움이 있고, Cloud 특유의 비용 효율성 및 안정적인 시스템을 구축의 장점을 활용할 수 없습니다. 또한, Cloud에 시스템을 구축했더라도, 특정 리전에 시스템을 구축하였다면, Global 서비스의 경우에 다른 먼지역에서 들어오는 요청시 네트워크 지연의 문제점을 피할 수 없습니다. Amazon CloudFront는 WEB 컨텐츠인 html, css, js, image 파일등을 edge에 두어서, 사용자의 요청이 있을때에 가장 가까운 edge location으로 라우팅함으로 웹서비스의 속도를 향상시킵니다. 여기에서는 CloudFront에 Edge Lambda를 이용하여 이미지 분류에 대한 Latency를 줄이는 방법을 설명합니다. 

S3는 Web hosting을 위한 html, image, css의 storage 역할을 수행합니다.

![image](https://user-images.githubusercontent.com/52392004/221320135-62863c02-11f8-47cf-b468-906281ecca6a.png)



## ResNet-50 추론

ResNet-50을 이용하여 이미지 분류(Image Classification)에 대한 추론을 구현합니다. 


## Edge Lambda를 이용한 Low Latency 구현

Edge에 있는 CloudFront에서 Lambda를 통해 네트워크에 대한 지연시간을 줄입니다.

Edge Lambda로 구현을 하면 Global 서비스라면 어디든지 Low Latency를 구현할 수 있습니다.

## Reference

[머신러닝(ML) 기반의 이미지 분류를 위한 API 서버 만들기](https://github.com/kyopark2014/image-classification-api-server)

[Adding HTTP Security Headers Using Lambda@Edge and Amazon CloudFront](https://aws.amazon.com/ko/blogs/networking-and-content-delivery/adding-http-security-headers-using-lambdaedge-and-amazon-cloudfront/)

[@aws-cdk/aws-cloudfront](https://www.npmjs.com/package/@aws-cdk/aws-cloudfront?activeTab=readme)
