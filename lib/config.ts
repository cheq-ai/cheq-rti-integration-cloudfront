import { CloudFrontRequestResult, CloudFrontResponseResult } from 'aws-lambda';
import { CloudFrontRequest } from 'aws-lambda/common/cloudfront';
import { Config, Mode, RTIResponse } from 'cheq-rti-client-core-js';

/**
 * See {@link https://cheq-ai.github.io/cheq-rti-client-core-js/interfaces/Config.html | Config}
 */
export interface CloudfrontConfig extends Config {
    /**
     * Enable telemetry logging
     */
    telemetry: boolean;

    /**
     * Called when {@link https://cheq-ai.github.io/cheq-rti-client-core-js/interfaces/Config.html#challengeCodes | challengeCodes } are configured
     * @param request
     * @param response
     */
    challenge?: (
        request: CloudFrontRequest,
        response: RTIResponse,
    ) => Promise<CloudFrontRequestResult | CloudFrontResponseResult>;

    /**
     * Enables local debug logging
     */
    debug?: boolean;
}

export const config: CloudfrontConfig = {
    mode: Mode.MONITORING,
    apiKey: 'REPLACE_ME',
    tagHash: 'REPLACE_ME',
    blockRedirectCodes: [2, 3, 6, 7, 10, 11, 16, 18],
    telemetry: true,
};
