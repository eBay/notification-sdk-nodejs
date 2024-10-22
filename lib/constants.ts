/*
 * *
 *  * Copyright 2024 eBay Inc.
 *  *
 *  * Licensed under the Apache License, Version 2.0 (the "License");
 *  * you may not use this file except in compliance with the License.
 *  * You may obtain a copy of the License at
 *  *
 *  *  http://www.apache.org/licenses/LICENSE-2.0
 *  *
 *  * Unless required by applicable law or agreed to in writing, software
 *  * distributed under the License is distributed on an "AS IS" BASIS,
 *  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  * See the License for the specific language governing permissions and
 *  * limitations under the License.
 *  *
 */

'use strict';

export const ALGORITHM = 'ssl3-sha1';
export const AUTHORIZATION = 'Authorization';
export const BASE64 = 'base64';
export const BEARER = 'bearer ';
export const ENVIRONMENT = {
    SANDBOX: 'SANDBOX',
    PRODUCTION: 'PRODUCTION'
} as const;
export type Environment = keyof typeof ENVIRONMENT;
export const HEADERS = {
    APPLICATION_JSON: 'application/json'
};
export const HEX = 'hex';
export const HTTP_STATUS_CODE = {
    NO_CONTENT: 204,
    OK: 200,
    PRECONDITION_FAILED: 412,
    INTERNAL_SERVER_ERROR: 500
};
export const KEY_END = '-----END PUBLIC KEY-----';
export const KEY_PATTERN_END = /-----END PUBLIC KEY-----/;
export const KEY_PATTERN_START = /-----BEGIN PUBLIC KEY-----/;
export const KEY_START = '-----BEGIN PUBLIC KEY-----';
export const NOTIFICATION_API_ENDPOINT_PRODUCTION = 'https://api.ebay.com/commerce/notification/v1/public_key/';
export const NOTIFICATION_API_ENDPOINT_SANDBOX = 'https://api.sandbox.ebay.com/commerce/notification/v1/public_key/';
export const SHA256 = 'sha256';
export const TOPICS = {
    MARKETPLACE_ACCOUNT_DELETION: 'MARKETPLACE_ACCOUNT_DELETION',
    PRIORITY_LISTING_REVISION: 'PRIORITY_LISTING_REVISION'
};
export const X_EBAY_SIGNATURE = 'x-ebay-signature';
