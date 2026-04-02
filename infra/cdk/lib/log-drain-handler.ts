/**
 * CloudWatch Logs → Sentry OTLP log drain handler.
 *
 * Receives CloudWatch Logs subscription filter events, decodes the gzip-compressed
 * payload, converts log entries into OTLP LogRecord JSON, and POSTs them to the
 * Sentry OTLP HTTP logs endpoint.
 *
 * Deployed as a shared Lambda via CDK ({@link LogDrainStack}), not per-stage.
 * Each Serverless service self-registers a subscription filter pointing here.
 */

import { gunzip } from 'node:zlib';
import { promisify } from 'node:util';
import type { CloudWatchLogsDecodedData, CloudWatchLogsEvent, Context } from 'aws-lambda';

/**
 * @requirements
 * - REQ-DRAIN-001: Decode and gunzip CloudWatch Logs subscription payloads.
 * - REQ-DRAIN-002: Convert CloudWatch log events into OTLP LogRecord JSON payloads.
 * - REQ-DRAIN-003: Forward payloads to Sentry OTLP over HTTP using x-sentry-auth.
 * - REQ-DRAIN-004: Return HTTP-like success response and throw on forward failures.
 * - REQ-DRAIN-005: Skip CloudWatch CONTROL_MESSAGE events (non-data reachability checks).
 */

const gunzipAsync = promisify(gunzip);

interface HttpResult {
    statusCode: number;
    body: string;
}

interface OtlpStringValue {
    stringValue: string;
}

interface OtlpAttribute {
    key: string;
    value: OtlpStringValue;
}

interface OtlpLogRecord {
    timeUnixNano: string;
    body: OtlpStringValue;
    attributes: OtlpAttribute[];
    severityText: string;
}

interface OtlpLogsPayload {
    resourceLogs: Array<{
        resource: {
            attributes: OtlpAttribute[];
        };
        scopeLogs: Array<{
            scope: {
                name: string;
            };
            logRecords: OtlpLogRecord[];
        }>;
    }>;
}

function getRequiredEnv(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}

function buildOtlpPayload(decoded: CloudWatchLogsDecodedData, region: string): OtlpLogsPayload {
    const logRecords: OtlpLogRecord[] = decoded.logEvents.map((logEvent) => ({
        timeUnixNano: (BigInt(logEvent.timestamp) * 1_000_000n).toString(),
        body: { stringValue: logEvent.message },
        attributes: [
            { key: 'log.group', value: { stringValue: decoded.logGroup } },
            { key: 'log.stream', value: { stringValue: decoded.logStream } },
            { key: 'aws.cloudwatch.log_event_id', value: { stringValue: logEvent.id } },
        ],
        severityText: 'INFO',
    }));

    return {
        resourceLogs: [
            {
                resource: {
                    attributes: [
                        { key: 'service.name', value: { stringValue: decoded.logGroup } },
                        { key: 'cloud.provider', value: { stringValue: 'aws' } },
                        { key: 'cloud.region', value: { stringValue: region } },
                    ],
                },
                scopeLogs: [
                    {
                        scope: { name: 'armoury-log-drain' },
                        logRecords,
                    },
                ],
            },
        ],
    };
}

/**
 * Forwards CloudWatch Logs subscription events to Sentry OTLP logs endpoint.
 *
 * @param event - CloudWatch Logs subscription filter event from Lambda runtime.
 * @param _context - Lambda execution context (unused).
 * @returns HTTP-like success response after logs are forwarded.
 * @throws Error when payload decoding or Sentry forward request fails.
 */
export async function handler(event: CloudWatchLogsEvent, _context: Context): Promise<HttpResult> {
    const otlpLogsUrl = getRequiredEnv('SENTRY_OTLP_LOGS_URL');
    const sentryPublicKey = getRequiredEnv('SENTRY_PUBLIC_KEY');
    const region = getRequiredEnv('AWS_REGION_NAME');

    try {
        const compressedPayload = Buffer.from(event.awslogs.data, 'base64');
        const unzippedPayload = await gunzipAsync(compressedPayload);
        const decoded = JSON.parse(unzippedPayload.toString('utf-8')) as CloudWatchLogsDecodedData;

        // CloudWatch Logs sends periodic CONTROL_MESSAGE events to verify
        // subscription filter reachability. These contain no log data.
        if (decoded.messageType !== 'DATA_MESSAGE') {
            console.info('[log-drain] Skipping non-data message', {
                messageType: decoded.messageType,
                logGroup: decoded.logGroup,
            });

            return { statusCode: 200, body: 'OK' };
        }

        const payload = buildOtlpPayload(decoded, region);

        const response = await fetch(otlpLogsUrl, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'x-sentry-auth': `sentry sentry_key=${sentryPublicKey}`,
            },
            body: JSON.stringify(payload),
        });

        console.info('[log-drain] Forwarded CloudWatch records', {
            count: decoded.logEvents.length,
            status: response.status,
            logGroup: decoded.logGroup,
        });

        if (!response.ok) {
            const responseBody = await response.text();

            throw new Error(`Sentry OTLP request failed with status ${response.status}: ${responseBody}`);
        }

        return {
            statusCode: 200,
            body: 'OK',
        };
    } catch (error) {
        console.error('[log-drain] Failed to forward CloudWatch logs', {
            error: error instanceof Error ? error.message : String(error),
        });

        throw error;
    }
}
