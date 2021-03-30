/*
 * Copyright 2021 The PartChain Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import JWT from './../../modules/jwt/JWT';
import Response from "../../modules/response/Response";
import OffChainDBClient from "../../domains/OffChainDBClient";
import Logger from "../../modules/logger/Logger";

/**
 * Builds ConnectionPool and thus creates database/tables if they do no exist yet
 * @param req
 * @param res
 * @param next
 * @constructor
 */
export default async function initDatabase(req: any, res: any, next: any) {
    Logger.info("In initDatabase in InitDatabase.ts");
    const jwt = JWT.parseFromHeader(
        req.header('Authorization')
    );

    const offChainDBClient = new OffChainDBClient();
    return offChainDBClient.initDatabase(
        JWT.parseMspIDFromToken(jwt)
    ).then(
        (response: any) => Response.json(res, response, 200)
    ).catch(
        (error: any) => Response.json(res, Response.errorPayload(error), Response.errorStatusCode(error))
    );


}
/**
 * @ignore
 * @swagger
 * /v1/off-hlf-db/init-database:
 *   post:
 *     security:
 *       - Bearer: []
 *     description: Creates database/tables for a given mspID (extracted from JWT) if they do no exist yet. Needs to be called the first time a new mspID is introduced to the LAAPI/DIS.
 *     tags: ['off-hlf-db']
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Databases and tables were created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/InitDatabaseResponse'
 */
