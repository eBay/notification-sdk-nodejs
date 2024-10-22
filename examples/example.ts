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

/* eslint-disable no-console */
/* eslint-disable max-len */

'use strict';

import express, { Request, Response } from 'express';
import { Config } from '../lib/types/Config';
import configData from './config.json';
import * as constants from '../lib/constants';
import * as EventNotificationSDK from '../lib/index';

const app = express();
const config: Config = configData as Config;

const environment = constants.ENVIRONMENT.PRODUCTION;
const PORT = process.env.PORT || 8080;

app.use(express.json());

app.post('/webhook', (req: Request, res: Response) => {
    const signature = req.headers[constants.X_EBAY_SIGNATURE] as string | undefined;

    if (!signature) {
        res.status(constants.HTTP_STATUS_CODE.PRECONDITION_FAILED).send('Signature is missing');
        return;
    }

    EventNotificationSDK.process(
        req.body,
        signature,
        config,
        environment
    ).then((responseCode: number) => {
        if (responseCode === constants.HTTP_STATUS_CODE.NO_CONTENT) {
            console.log(`Message processed successfully for: \n- Topic: ${req.body.metadata.topic} \n- NotificationId: ${req.body.notification.notificationId}\n`);
        } else if (responseCode === constants.HTTP_STATUS_CODE.PRECONDITION_FAILED) {
            console.error(`Signature mismatch for: \n- Payload: ${JSON.stringify(req.body)} \n- Signature: ${signature}\n`);
        }
        res.status(responseCode).send();
    }).catch((ex) => {
        console.error(`Signature validation processing failure: ${ex}\n`);
        res.status(constants.HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).send();
    });
});

app.get('/webhook', (req: Request, res: Response) => {
    const challengeCode = req.query.challenge_code as string | undefined;

    if (challengeCode) {
        try {
            const challengeResponse = EventNotificationSDK.validateEndpoint(
                challengeCode,
                config);
            res.status(200).send({
                challengeResponse: challengeResponse
            });
        } catch (e) {
            console.error(`Endpoint validation failure: ${e}`);
            res.status(constants.HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).send();
        }
    } else {
        res.status(constants.HTTP_STATUS_CODE.INTERNAL_SERVER_ERROR).send();
    }
});

app.listen(PORT, () => {
    console.log(`Listening at http://localhost:${PORT}`);
});
