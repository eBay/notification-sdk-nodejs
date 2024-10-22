
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

type JSONValue = string | number | boolean | { [x: string]: JSONValue } | JSONValue[];
export interface NotificationData {
    [key: string]: JSONValue;
}

export interface Notification {
    notificationId: string;
    eventDate: string;
    publishDate: string;
    publishAttemptCount: number;
    data: NotificationData;
}

export interface Message {
    metadata?: {
        topic: string;
        schemaVersion?: string | null;
        deprecated?: boolean;
    };
    notification?: Notification;
}
