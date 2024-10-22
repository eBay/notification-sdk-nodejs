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

import { expect, assert } from 'chai';
import nock from 'nock';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import * as EventNotificationSDK from '../lib/index';
import testData from './test.json';
import { createHash } from 'crypto';
import { Environment, ENVIRONMENT } from '../lib/constants';
import { Config } from '../lib/types/Config';
import { Message } from '../lib/types/Message';

const hostname = 'https://api.ebay.com';
const identityApiPath = '/identity/v1/oauth2/token';
const notificationApiPath = '/commerce/notification/v1/public_key/';

const axiosMock = new MockAdapter(axios, { delayResponse: 100 });

const sampleConfig: Config = {
    'SANDBOX': {
        'clientId': 'clientId',
        'clientSecret': 'clientSecret',
        'devId': 'devId',
        'redirectUri': 'redirectUri',
        'baseUrl': 'api.SANDBOX.ebay.com'
    },
    'PRODUCTION': {
        'clientId': 'clientId',
        'clientSecret': 'clientSecret',
        'devId': 'devId',
        'redirectUri': 'redirectUri',
        'baseUrl': 'api.ebay.com'
    },
    endpoint: 'http://www.testendpoint.com/webhook',
    verificationToken: '71745723-d031-455c-bfa5-f90d11b4f20a',
    environment: ENVIRONMENT.PRODUCTION
};

describe('Test Notification SDK', () => {
    afterEach(() => {
        nock.cleanAll();
    });

    it('should export NotificationSDK as an object', () => {
        expect(EventNotificationSDK).to.be.a('object');
    });

    it('should export NotificationSDK.process() as a function', () => {
        expect(EventNotificationSDK.process).to.be.a('function');
    });

    it('should throw an error if message is not provided', async () => {
        try {
            await EventNotificationSDK.process({} as Message, '', sampleConfig,
                ENVIRONMENT.PRODUCTION);
        } catch (err) {
            expect(err.message).to.equal('Please provide the message.');
        }
    });

    it('should throw an error if message is missing metadata', async () => {
        try {
            await EventNotificationSDK.process({
                notification: {}
            } as Message, '', sampleConfig, ENVIRONMENT.PRODUCTION);
        } catch (err) {
            expect(err.message).to.equal('Please provide the message.');
        }
    });

    it('should throw an error if message is missing notification', async () => {
        try {
            await EventNotificationSDK.process({
                metadata: {}
            } as Message, '', sampleConfig, ENVIRONMENT.PRODUCTION);
        } catch (err) {
            expect(err.message).to.equal('Please provide the message.');
        }
    });

    it('should throw an error if signature is not provided', async () => {
        try {
            await EventNotificationSDK.process({
                metadata: {}, notification: {}
            } as Message, '', sampleConfig, ENVIRONMENT.PRODUCTION);
        } catch (err) {
            expect(err.message).to.equal('Please provide the message.');
        }
    });

    it('should throw an error if config is not provided', async () => {
        try {
            await EventNotificationSDK.process({
                metadata: {}, notification: {}
            } as Message, 'signature', {} as Config, ENVIRONMENT.PRODUCTION);
        } catch (err) {
            expect(err.message).to.equal('Please provide the config.');
        }
    });

    it('should throw an error if environment is not provided', async () => {
        try {
            await EventNotificationSDK.process({
                metadata: {},
                notification: {}
            } as Message, 'signature', sampleConfig, {} as Environment);
        } catch (err) {
            expect(err.message).to.equal('Please provide the environment.');
        }
    });

    it('should throw an error if Client ID is not provided', async () => {
        try {
            await EventNotificationSDK.process(
                { metadata: {}, notification: {} } as Message, 'signature',
                {
                    PRODUCTION: { clientSecret: 'clientSecret' },
                    SANDBOX: { clientSecret: 'clientSecret' }
                } as Config, ENVIRONMENT.PRODUCTION);
        } catch (err) {
            expect(err.message).to.equal('Please provide the Client ID.');
        }
    });

    it('should throw an error if Client Secret is not provided', async () => {
        try {
            await EventNotificationSDK.process(
                { metadata: {}, notification: {} } as Message, 'signature',
                {
                    SANDBOX: { clientId: 'clientId' },
                    PRODUCTION: { clientId: 'clientId' }
                } as Config, ENVIRONMENT.SANDBOX);
        } catch (err) {
            expect(err.message).to.equal('Please provide the Client Secret.');
        }
    });

    it('should throw an error if Environment is not provided', async () => {
        try {
            await EventNotificationSDK.process(
                { metadata: {}, notification: {} } as Message, 'signature',
                {
                    PRODUCTION:
                    {
                        clientSecret: 'clientSecret',
                        clientId: 'clientId'
                    }
                } as Config, ENVIRONMENT.PRODUCTION);
        } catch (err) {
            expect(err.message).to.equal('Please provide the Environment.');
        }
    });

    it('should return 204 for valid inputs', () => {
        axiosMock.onGet(`${hostname}${notificationApiPath}${testData.VALID.public_key}`)
            .reply(200,
                testData.VALID.response
            );

        // Mock token generation
        const tokenCallMock = nock(hostname);
        tokenCallMock.post(identityApiPath, {
            grant_type: 'client_credentials',
            scope: `${hostname}/oauth/api_scope`
        }).reply(200, {
            access_token: 'abcde'
        });

        EventNotificationSDK.process(testData.VALID.message,
            testData.VALID.signature,
            sampleConfig, ENVIRONMENT.PRODUCTION)
            .then((responseCode: number) => {
                expect(responseCode).to.equal(204);
            }).catch((ex) => {
                console.error(`Failed: ${ex}`);
            });
    });

    it('should return 412 when validation fails', () => {
        axiosMock.onGet(`${hostname}${notificationApiPath}${testData.INVALID.public_key}`)
            .reply(200,
                testData.INVALID.response
            );

        // Mock token generation
        const tokenCallMock = nock(hostname);
        tokenCallMock.post(identityApiPath, {
            grant_type: 'client_credentials',
            scope: `${hostname}/oauth/api_scope`
        }).reply(200, {
            access_token: 'abcde'
        });

        EventNotificationSDK.process(testData.INVALID.message,
            testData.INVALID.signature,
            sampleConfig, ENVIRONMENT.PRODUCTION)
            .then((responseCode: number) => {
                expect(responseCode).to.equal(412);
            }).catch((ex) => {
                console.error(`Failed: ${ex}`);
            });
    });

    it('should return 412 for signature mismatch', () => {
        axiosMock.onGet(`${hostname}${notificationApiPath}${testData.SIGNATURE_MISMATCH.public_key}`)
            .reply(200,
                testData.SIGNATURE_MISMATCH.response
            );

        // Mock token generation
        const tokenCallMock = nock(hostname);
        tokenCallMock.post(identityApiPath, {
            grant_type: 'client_credentials',
            scope: `${hostname}/oauth/api_scope`
        }).reply(200, {
            access_token: 'abcde'
        });

        EventNotificationSDK.process(testData.SIGNATURE_MISMATCH.message,
            testData.SIGNATURE_MISMATCH.signature, sampleConfig, ENVIRONMENT.PRODUCTION)
            .then((responseCode: number) => {
                expect(responseCode).to.equal(412);
            }).catch((ex) => {
                console.error(`Failed: ${ex}`);
            });
    });

    it('should return 500 when Notification API call fails', () => {
        axiosMock.onGet(`${hostname}${notificationApiPath}${testData.ERROR.public_key}`)
            .reply(500,
                testData.ERROR.response
            ).onAny().reply(500);

        // Mock token generation
        const tokenCallMock = nock(hostname);
        tokenCallMock.post(identityApiPath, {
            grant_type: 'client_credentials',
            scope: `${hostname}/oauth/api_scope`
        }).reply(200, {
            access_token: 'abcde'
        });

        EventNotificationSDK.process(testData.ERROR.message,
            testData.ERROR.signature, sampleConfig, ENVIRONMENT.PRODUCTION)
            .then((responseCode: number) => {
                assert.equal(responseCode, 500);
            }).catch((ex) => {
                console.error(`Failed: ${ex}`);
            });
    });

    it('should return 500 when API OAuth token call fails', () => {
        axiosMock.onGet(`${hostname}${notificationApiPath}${testData.ERROR.public_key}`)
            .reply(500,
                testData.ERROR.response
            );

        // Mock token generation
        const tokenCallMock = nock(hostname);
        tokenCallMock.post(identityApiPath, {
            grant_type: 'client_credentials',
            scope: `${hostname}/oauth/api_scope`
        }).reply(500, {});

        EventNotificationSDK.process(testData.SIGNATURE_MISMATCH.message,
            testData.SIGNATURE_MISMATCH.signature, sampleConfig, ENVIRONMENT.PRODUCTION)
            .then((responseCode: number) => {
                assert.equal(responseCode, 500);
            }).catch((ex) => {
                console.error(`Failed: ${ex}`);
            });
    });

    it('should return the correct challenge response', () => {
        const challengeCode = '71745723-d031-455c-bfa5-f90d11b4f20a';
        const config: Config = { ...sampleConfig };
        config.endpoint = 'http://www.testendpoint.com/webhook';
        config.verificationToken = '71745723-d031-455c-bfa5-f90d11b4f20a';

        const hash = createHash('sha256');

        hash.update(challengeCode);
        hash.update(config.verificationToken);
        hash.update(config.endpoint);

        const responseHash = hash.digest('hex');
        const expectedResponse = Buffer.from(responseHash).toString();

        const challengeResponse = EventNotificationSDK.validateEndpoint(
            challengeCode,
            config);

        assert.equal(expectedResponse, challengeResponse);
    });
});
