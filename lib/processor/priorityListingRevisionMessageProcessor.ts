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

import { Message } from '../types/Message';

/**
 * Process the message
 *
 * @param {Message} message
 */
const processInternal = (message: Message): void => {
    const data = message.notification?.data;
    // eslint-disable-next-line no-console
    console.log(`\n==========================\nPriorityListingRevision Date :${JSON.stringify(data, null, 2)}`);
};

export { processInternal as process };
