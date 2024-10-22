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

import * as validator from './validator';
import * as constants from './constants';
import * as processor from './processor/processor';
import { Config } from './types/Config';
import { Message } from './types/Message';

/**
 * Validate the signature and process the message.
 *
 * @param {Message} message - The notification message object received from eBay.
 * @param {string} signature - The signature header received from eBay.
 * @param {Config} config - The configuration object containing necessary credentials and settings.
 * @param {string} config.clientId - The client ID from the [eBay Developer Portal](https://developer.ebay.com).
 * @param {string} config.clientSecret - The client secret from the [eBay Developer Portal](https://developer.ebay.com).
 * @param {string} config.devId - The dev ID from the [eBay Developer Portal](https://developer.ebay.com).
 * @param {string} config.redirectUri - The redirect URI from the [eBay Developer Portal](https://developer.ebay.com).
 * @param {string} config.baseUrl - The base URL for the eBay API (e.g., "api.ebay.com" or "api.sandbox.ebay.com").
 * @param {string} environment - The environment of the eBay API (e.g., "PRODUCTION" or "SANDBOX").
 *
 * @returns {Promise<number>} A promise that resolves to a status code
 *  indicating the result of the validation and processing.
 */
const process = async (message: Message, signature: string, config: Config, environment: string): Promise<number> => {
    try {
        // Validate the input
        if (!message || !message.metadata || !message.notification) throw new Error('Please provide the message.');
        if (!signature) throw new Error('Please provide the signature.');
        if (!config) throw new Error('Please provide the config.');
        if (!environment
            || (environment !== constants.ENVIRONMENT.PRODUCTION
                && environment !== constants.ENVIRONMENT.SANDBOX)) {
            throw new Error('Please provide the Environment.');
        }

        if (environment === constants.ENVIRONMENT.SANDBOX) {
            config.environment = constants.ENVIRONMENT.SANDBOX;
        } else {
            config.environment = constants.ENVIRONMENT.PRODUCTION;
        }

        const response = await validator.validateSignature(message, signature, config);
        if (response) {
            // Get the appropriate processor to process the message
            processor
                .getProcessor(message.metadata.topic)
                .process(message);
            return constants.HTTP_STATUS_CODE.NO_CONTENT;
        }
        return constants.HTTP_STATUS_CODE.PRECONDITION_FAILED;
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        return constants.HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR;
    }
};

/**
 * Generates a challenge response for endpoint validation.
 *
 * @param {string} challengeCode - The challenge code received from eBay.
 * @param {Config} config - The configuration object containing necessary credentials and settings.
 * @param {string} config.endpoint - The endpoint for receiving notifications from eBay.
 * @param {string} config.verificationToken - The verification token associated with your endpoint.
 *
 * @returns {string} The generated challenge response.
 */
const validateEndpoint = (challengeCode: string, config: Config): string => {
    if (!challengeCode) throw new Error('The "challengeCode" is required.');
    if (!config) throw new Error('Please provide the config.');
    if (!config.endpoint) throw new Error('The "endpoint" is required.');
    if (!config.verificationToken) throw new Error('The "verificationToken" is required.');

    try {
        return validator.generateChallengeResponse(challengeCode, config);
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
        throw e;
    }
};

export {
    constants,
    process,
    validateEndpoint
};
