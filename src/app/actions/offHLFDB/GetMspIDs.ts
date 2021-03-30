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

import JWT from "../../modules/jwt/JWT";
import Response from "../../modules/response/Response";
import OffChainDBClient from "../../domains/OffChainDBClient";

/**
 * Assets per day action
 * @param req
 * @param res
 * @param next
 * @constructor
 */
export default async function GetMspIDs(req: any, res: any, next: any) {
    const offChainDBClient = new OffChainDBClient();
    const jwt = JWT.parseFromHeader(
        req.header('Authorization')
    );

    return offChainDBClient.getMspIDs(
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
 * /v1/off-hlf-db/get-mspids:
 *   get:
 *     security:
 *       - Bearer: []
 *     description: Get all mspIDs stored in postgres
 *     tags: ['off-hlf-db']
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: List of mspIDs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 */
