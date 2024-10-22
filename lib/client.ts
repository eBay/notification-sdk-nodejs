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

import axios, { AxiosRequestConfig } from 'axios';
import EbayAuthToken from 'ebay-oauth-nodejs-client';
import { LRUCache } from 'lru-cache';
import * as constants from './constants';
import { Config } from './types/Config';
import { TokenResponse } from './types/TokenResponse';
import { PublicKeyResponse } from './types/PublicKeyResponse';

const cache = new LRUCache<string, PublicKeyResponse>({
    max: 100
});

/**
 * Uses the eBay OAuth client to get app token
 * @param {Config} config
 * @returns {Promise<any>} Application token
 */
const getAppToken = async (config: Config): Promise<TokenResponse> => {
    try {
        const envConfig = config[config.environment];
        if (!envConfig) {
            throw new Error(`Environment configuration for ${config.environment} is missing.`);
        }
        const ebayAuthToken = new EbayAuthToken({
            clientId: envConfig.clientId,
            clientSecret: envConfig.clientSecret,
            env: config.environment,
            redirectUri: ''
        });

        const token = await ebayAuthToken.getApplicationToken(config.environment);
        return token && JSON.parse(token);
    } catch (error) {
        console.error(error);
        throw error;
    }
};

/**
 * Look for the Public key in cache, if not found call eBay Notification API
 *
 * @param {string} keyId
 * @param {Config} config
 * @returns {Promise<string>} Public key
 */
const getPublicKey = async (keyId: string, config: Config): Promise<PublicKeyResponse> => {
    const publicKey = cache.get(keyId);

    if (publicKey) {
        return publicKey;
    }

    try {
        const notificationApiEndpoint = (config.environment === constants.ENVIRONMENT.SANDBOX) ?
            constants.NOTIFICATION_API_ENDPOINT_SANDBOX : constants.NOTIFICATION_API_ENDPOINT_PRODUCTION;
        const tokenResponse = await getAppToken(config);
        const uri = `${notificationApiEndpoint}${keyId}`;
        const requestConfig: AxiosRequestConfig = {
            method: 'GET',
            url: uri,
            headers: {
                Authorization: `${constants.BEARER}${tokenResponse.access_token}`,
                'Content-Type': `${constants.HEADERS.APPLICATION_JSON}`
            }
        };

        const notificationApiResponse = await axios(requestConfig);

        if (!notificationApiResponse || notificationApiResponse.status !== constants.HTTP_STATUS_CODE.OK) {
            throw new Error(`Public key retrieval failed with ${notificationApiResponse.status} for ${uri}`);
        }
        cache.set(keyId, notificationApiResponse.data);
        return notificationApiResponse.data;
    } catch (error) {
        console.error(`Error retrieving public key for ${keyId}:`, error);
        throw error;
    }
};

export { getPublicKey };
