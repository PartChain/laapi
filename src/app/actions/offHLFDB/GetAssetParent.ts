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
 * Get asset from the Ledger by primary key action along with parent
 * @param req
 * @param res
 * @param next
 * @constructor
 */
export default async function GetAssetParent(req: any, res: any, next: any) {
    Logger.info("In GetAssetParent in GetAssetParent.ts");
    const jwt = JWT.parseFromHeader(
        req.header('Authorization')
    );

    if (!req.query.hasOwnProperty("serialNumberCustomer")) {
        return Response.json(res, Response.errorPayload(`Request is missing key serialNumberCustomer`), 400);
    }

    let serialNumberCustomer: string = decodeURIComponent(req.query.serialNumberCustomer);

    const offChainDBClient = new OffChainDBClient();
    return offChainDBClient.getAssetParent(
        serialNumberCustomer,
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
 * /v1/off-hlf-db/get-asset-parent:
 *   get:
 *     security:
 *       - Bearer: []
 *     description: Get asset from the ledger by primary key along with parent
 *     tags: ['off-hlf-db']
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: serialNumberCustomer
 *         description: Serial Number Customer
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: asset object matched by given query along with parent object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/AssetWithParentResponse'
 */
