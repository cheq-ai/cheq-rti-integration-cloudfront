# cheq-rti-integration-cloudfront

This repository provides the components to invoke RTI from CloudFront. 

The provided CloudFront Origin Request and Origin Response Lambda@Edge functions invoke RTI and set response cookie. 

If you have an existing CloudFront distribution that uses caching we recommend that you create a second CloudFront distribution with caching disabled that invokes RTI and uses your existing distribution as the origin server.

### Documentation

[CloudFront Integration](https://cheq-ai.github.io/cheq-rti-integration-cloudfront)

Built
with [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/using-sam-cli.html)

### Prerequisites:

Modify the [configuration](https://cheq-ai.github.io/cheq-rti-integration-cloudfront/interfaces/CloudfrontConfig.html)
at `lib/config.ts` to set your `apiKey` and `tagHash`

### Verify config

```bash
cd lib
npm install
npm run test
```

### Test lambda locally

```bash
sam build
sam local invoke OriginRequest -e events/origin-request-event.json
sam local invoke OriginResponse -e events/origin-response-event.json
```

### Deploy, must always run `sam build` after making any changes

```bash
sam build
sam deploy # deploys the stack using the name defined in samconfig.toml
sam deploy --parameter-overrides TrustedIPHeader=bar # includes origin request policies with trusted ip header
```

### Output

```
CloudFormation outputs from deployed stack
-------------------------------------------------------------------------------------------------------------------------
Outputs
-------------------------------------------------------------------------------------------------------------------------
Key                 OriginRequestVersionARN
Description         Origin Request lambda version ARN.
Value               arn:aws:lambda:us-east-1:839097227002:function:cheq-rti-integration-cloudfront-origin-request:1

Key                 OriginRequestPolicyNoHost
Description         Includes RTI, ja3 fingerprint and tls headers, no host header
Value               cheq-rti-integration-cloudfront-origin-request-policy-no-host

Key                 OriginResponseVersionARN
Description         Origin Response lambda version ARN.
Value               arn:aws:lambda:us-east-1:839097227002:function:cheq-rti-integration-cloudfront-origin-response:1

Key                 OriginRequestPolicy
Description         Includes RTI, ja3 fingerprint, tls and host headers
Value               cheq-rti-integration-cloudfront-origin-request-policy

Key                 ViewerRequestARN
Description         Viewer Request CloudFront function ARN.
Value               arn:aws:cloudfront::839097227002:function/cheq-rti-integration-cloudfront-viewer-request

-------------------------------------------------------------------------------------------------------------------------
```

### CloudFront Distribution Configuration
- Use `OriginRequestVersionARN` for the CloudFront Origin Request Lambda@Edge
- Use `OriginResponseVersionARN` for the CloudFront Origin Response Lambda@Edge
- If your CloudFront origin expects the origin host and cannot resolve the distribution host:
  - Use the `ViewerRequestARN` for the CloudFront Viewer Request CloudFront Function to set the x-cheq-rti-host header 
  - Use the `OriginRequestPolicyNoHost` for the CloudFront Origin Request Policy 
- If your origin supports the distribution host:
  - Use the `OriginRequestPolicy` for the CloudFront Origin Request Policy

### Existing CloudFront Origin Request Lambda
If you have an existing CloudFront Origin Request Lambda@Edge, use the RTI client directly:
```javascript
import {Action, Mode, RTICore} from 'cheq-rti-client-core-js';
import {RTIServiceNode} from 'cheq-rti-client-node';

const config = {
  mode: Mode.MONITORING,
  apiKey: 'REPLACE_ME',
  tagHash: 'REPLACE_ME',
  blockRedirectCodes: [2, 3, 6, 7, 10, 11, 16, 18],
};
const rtiCore = new RTICore(config);
const rtiService = new RTIServiceNode();

export const handler = async (event) => {
  const cfRequest = event.Records[0].cf.request;
  try {
    const headersMap = getHeaders(cfRequest.headers);
    const reqUrl = getReqUrl(cfRequest, headersMap);
    const payload = {
      url: reqUrl.href,
      headers: headersMap,
      method: cfRequest.method,
      ip: cfRequest.clientIp,
      eventType: rtiCore.getEventType(reqUrl.pathname, cfRequest.method),
      ja3: headersMap['cloudfront-viewer-ja3-fingerprint'],
    };
    const rtiResponse = await rtiService.callRTI(payload, config);
    const action = rtiCore.getAction(rtiResponse);
    // use action enum: https://cheq-ai.github.io/cheq-rti-client-core-js/enums/Action.html
  } catch (e) {
    console.log('integration timed out', e);
  }
  // your existing logic
};

function getReqUrl(cfRequest, headers) {
  const protocol = headers['cloudfront-viewer-tls'] ? 'https' : 'http';
  const host = headers['x-cheq-rti-host'] ?? headers.host;
  return new URL(cfRequest.uri, `${protocol}://${host}`);
}

function getHeaders(headers) {
  const result = {};
  for (const key in headers) {
    const keyValues = headers[key];
    result[key] = keyValues.map((kv) => kv.value).join(', ');
  }
  return result;
}

function setHeader(headers, key, value) {
  headers[key] = [{key, value}];
}
```

### Trusted IP Header
Pass the following to `sam deploy`

`--parameter-overrides TrustedIPHeader=foo`

```
Key                 OriginRequestPolicyNoHostTrustedIP
Description         Includes RTI, ja3 fingerprint, tls and trusted ip headers, no host header
Value               cheq-rti-integration-cloudfront-origin-request-policy-no-host-trusted-ip

Key                 OriginRequestPolicyTrustedIP
Description         Includes RTI, ja3 fingerprint, tls, host and trusted ip headers
Value               cheq-rti-integration-cloudfront-origin-request-policy-trusted-ip
```
- If your CloudFront origin expects the origin host and cannot resolve the distribution host:
  - Use the `OriginRequestPolicyNoHostTrustedIP` for the CloudFront Origin Request Policy
- If your origin supports the distribution host:
  - Use the `OriginRequestPolicyTrustedIP` for the CloudFront Origin Request Policy