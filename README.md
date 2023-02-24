# Low Latency Image Classification

CloudFront에서 Edge Lambda를 이용한 Image Classification을 구현합니다. 

Smart Factory와 같은 경우에 지연시간이 매우 중요해서 주로 on prem을 많이 이용하고 있습니다. 하지만 이를 위해서는 Local에 있는 Factory에 장비와 인력을 상주 시켜야 합니다. 또한, Cloud를 활용함으로 인해 비용 효율성 뿐 아니라 안정적인 시스템을 구축할 수 있습니다. Global 서비스의 경우에 특정 지역에 시스템이 있을 경우에 Global의 다른 지역에서 네트워크 지연 이슈로 Latency 이슈가 심각해질 수 있습니다. 하지만 이때마다 지역마다 시스템을 별도로 구성하는것은 비용적으로 부담이 됩니다.

Cloud 시스템에서 Latency를 줄이는 방법에 CloudFront에 Edge Lambda를 통해 어느정도 개선을 할 수 있습니다. 여기서는 Edge Lambda에 Image Classification을 수행하는 머신 러닝 API를 구현하고자 합니다. 

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
