# cheq-rti-integration-cloudfront

Built with AWS SAM CLI - https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/using-sam-cli.html

Modify the `lib/config.ts`, set `apiKey`, `tagHash`
```
export const config: CloudfrontConfig = {
    mode: Mode.BLOCKING,
    apiKey: 'REPLACE_ME',
    tagHash: 'REPLACE_ME',
};
```

Verify config
```bash
cd lib
npm install
npm run test
```

Test lambda locally
```bash
sam build
sam local invoke ViewerRequest -e events/viewer-request-event.json
sam local invoke ViewerResponse -e events/viewer-response-event.json
```

Deploy, must always run `sam build` after making any changes
```bash
sam build
sam deploy
```

Output 
```
CloudFormation outputs from deployed stack
-------------------------------------------------------------------------------------------------------------------------
Outputs                                                                                                                 
-------------------------------------------------------------------------------------------------------------------------
Key                 ViewerRequestOriginRequestPolicy                                                                    
Description         Viewer Request Origin Request Policy with ja3 fingerprint enabled                                   
Value               cheq-rti-integration-cloudfront-viewer-request-origin-request-policy                                

Key                 ViewerResponseVersionARN                                                                            
Description         Viewer Response lambda version ARN.                                                                 
Value               arn:aws:lambda:us-east-1:839097227002:function:cheq-rti-integration-cloudfront-viewer-response:1    

Key                 ViewerRequestVersionARN                                                                             
Description         Viewer Request lambda version ARN.                                                                  
Value               arn:aws:lambda:us-east-1:839097227002:function:cheq-rti-integration-cloudfront-viewer-request:1     
-------------------------------------------------------------------------------------------------------------------------
```

Use `ViewerRequestOriginRequestPolicy` for the cloudfront Viewer Request Origin Request Policy to enable ja3 fingerprint
Use `ViewerRequestVersionARN` for the cloudfront Viewer Request Lambda@Edge
Use `ViewerResponseVersionARN` for the cloudfront Viewer Response Lambda@Edge