import { CloudFrontRequestEvent, CloudFrontRequestResult } from 'aws-lambda';
import { config } from './config';
import { Action, HeadersMap, RTICore, RTIResponse } from 'cheq-rti-client-core-js';
import { RTILoggerNode, RTIServiceNode } from 'cheq-rti-client-node';
import { CloudFrontHeaders, CloudFrontRequest } from 'aws-lambda/common/cloudfront';
import { name, version } from './package.json';

const logger = new RTILoggerNode(config.apiKey, config.tagHash, `${name}-${version}`);
const rtiCore = new RTICore(config);
const rtiService = new RTIServiceNode();

export const handle = async (event: CloudFrontRequestEvent): Promise<CloudFrontRequestResult> => {
    const cfRequest = event.Records[0].cf.request;
    try {
        const headersMap = getHeaders(cfRequest.headers);
        const reqUrl = getReqUrl(cfRequest, headersMap);
        if (rtiCore.shouldIgnore(reqUrl.pathname)) {
            return cfRequest;
        }

        const startRTI = Date.now();
        const rtiResponse = await rtiService.callRTI(
            {
                url: reqUrl.href,
                headers: headersMap,
                method: cfRequest.method,
                ip: cfRequest.clientIp,
                eventType: rtiCore.getEventType(reqUrl.pathname, cfRequest.method),
                ja3: headersMap['cloudfront-viewer-ja3-fingerprint'],
            },
            config,
        );
        const endRTI = Date.now();
        const duration = endRTI - startRTI;
        await logger.info(`rti_duration: ${duration}`);

        const action = rtiCore.getAction(rtiResponse);
        if (action === Action.CHALLENGE && config.challenge) {
            try {
                const challengeResult = await config.challenge(cfRequest, rtiResponse);
                return challengeResult;
            } catch (e) {
                const err: Error = e as Error;
                console.error('challenge error', err);
                await logger.error(`challenge error: ${err.message}`);
                return cfRequest;
            }
        } else if (action === Action.BLOCK) {
            const headers = {};
            setHeader(headers, 'set-cookie', rtiResponse.setCookie);
            return {
                status: '403',
                headers,
            };
        } else if (action === Action.REDIRECT) {
            const headers = {};
            setHeader(headers, 'set-cookie', rtiResponse.setCookie);
            setHeader(headers, 'location', config.redirectLocation!);
            return {
                status: '302',
                headers,
            };
        }

        // set rti headers for upstream use
        setHeaders(cfRequest.headers, rtiResponse);
    } catch (e) {
        const err: Error = e as Error;
        console.error('error', err);
        await logger.error(`error: ${err.message}`);
    }
    return cfRequest;
};

function getReqUrl(cfRequest: CloudFrontRequest, headers: HeadersMap): URL {
    const protocol = headers['cloudfront-viewer-tls'] ? 'https' : 'http';
    const host = headers.host;
    return new URL(cfRequest.uri, `${protocol}://${host}`);
}

function getHeaders(headers: CloudFrontHeaders): HeadersMap {
    const result: HeadersMap = {};
    for (const key in headers) {
        const keyValues = headers[key];
        result[key] = keyValues.map((kv) => kv.value).join(', ');
    }
    return result;
}

function setHeaders(headers: CloudFrontHeaders, rtiResponse: RTIResponse): void {
    setHeader(headers, 'x-cheq-rti-version', String(rtiResponse.version));
    setHeader(headers, 'x-cheq-rti-is-invalid', String(rtiResponse.isInvalid));
    setHeader(headers, 'x-cheq-rti-request-id', rtiResponse.requestId);
    setHeader(headers, 'x-cheq-rti-threat-type-code', String(rtiResponse.threatTypeCode));
    setHeader(headers, 'x-cheq-rti-set-cookie', rtiResponse.setCookie);
}

function setHeader(headers: CloudFrontHeaders, key: string, value: string): void {
    headers[key] = [{ key, value }];
}
