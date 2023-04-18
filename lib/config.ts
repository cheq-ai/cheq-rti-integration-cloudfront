import { CloudFrontRequestResult, CloudFrontResponseResult } from 'aws-lambda';
import { CloudFrontRequest } from 'aws-lambda/common/cloudfront';
import { Config, EventType, Mode, RTIResponse } from 'cheq-rti-client-core-js';

export type CloudfrontConfig = Config & {
    challenge?: (
        request: CloudFrontRequest,
        response: RTIResponse,
    ) => Promise<CloudFrontRequestResult | CloudFrontResponseResult>;
};

export const config: CloudfrontConfig = {
    mode: Mode.MONITORING,
    apiKey: 'REPLACE_ME',
    tagHash: 'REPLACE_ME',
    blockRedirectCodes: [2, 3, 6, 7, 10, 11, 16, 18],
};
