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

import crypto from 'crypto';
import * as client from './client';
import * as constants from './constants';
import { Config } from './types/Config';
import { XeBaySignature } from './types/XeBaySignature';
import { Message } from './types/Message';
import { PublicKeyResponse } from './types/PublicKeyResponse';

/**
 * Base64 decode and return
 *
 * @param {string} signatureHeader
 * @returns {XeBaySignature}
 */
const getXeBaySignatureHeader = (signatureHeader: string): XeBaySignature => {
    const buffer = Buffer.from(signatureHeader, constants.BASE64);
    const signatureHeaderString = buffer.toString('ascii');
    try {
        return JSON.parse(signatureHeaderString);
    } catch {
        throw new Error(`Parsing failed for signature header ${signatureHeader}`);
    }
};

/**
 * Formats the public key
 *
 * @param {string} key
 * @returns {string}
 */
const formatKey = (key: string): string => {
    try {
        const updatedKey = key.replace(constants.KEY_PATTERN_START, `${constants.KEY_START}\n`);
        return updatedKey.replace(constants.KEY_PATTERN_END, `\n${constants.KEY_END}`);
    } catch (ex) {
        throw new Error(`Invalid key format: ${ex}`);
    }
};

/**
 * Validate the signature
 * 1. Base64 decode signatureHeader and parse it as JSON
 * 2. Get the public for keyId from cache or call eBay Notification API
 * 3. Use crypto library to verify the message
 *
 * @param {any} message
 * @param {string} signatureHeader
 * @param {Config} config
 * @returns {Promise<boolean>}
 */
const validateSignature = async (message: Message, signatureHeader: string, config: Config): Promise<boolean> => {
    // Base64 decode the signatureHeader and convert to JSON
    const xeBaySignature = getXeBaySignatureHeader(signatureHeader);

    // Get the public key
    const publicKey: PublicKeyResponse = await client.getPublicKey(
        xeBaySignature.kid,
        config
    );

    // Init verifier
    const verifier = crypto.createVerify(constants.ALGORITHM);

    verifier.update(JSON.stringify(message));

    return verifier.verify(
        formatKey(publicKey.key),
        xeBaySignature.signature,
        constants.BASE64
    );
};

/**
 * Generates challenge response
 * 1. Hash the challengeCode, verificationToken and endpoint
 * 2. Convert to hex
 *
 * @param {string} challengeCode
 * @param {Config} config
 * @returns {string} challengeResponse
 */
const generateChallengeResponse = (challengeCode: string, config: Config): string => {
    const hash = crypto.createHash(constants.SHA256);

    hash.update(challengeCode);
    hash.update(config.verificationToken);
    hash.update(config.endpoint);

    const responseHash = hash.digest(constants.HEX);
    return Buffer.from(responseHash).toString();
};

export {
    generateChallengeResponse,
    validateSignature
};
