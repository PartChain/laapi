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

import OffChainDBClient from "../../domains/OffChainDBClient";
import JWT from '../../modules/jwt/JWT';
import env from "../../defaults";
import Response from "../../modules/response/Response";


/**
 * Get asset list from the Ledger by given filter
 * @param req
 * @param res
 * @param next
 * @constructor
 */
export default async function GetAssetList(req: any, res: any, next: any) {

    const filter = req.body.hasOwnProperty("filter") ? req.body.filter : Object.create({});
    const fields = (req.body.fields ? req.body.fields : undefined);
    const loadChildrenLevel = (req.body.hasOwnProperty("loadChildrenLevel") ? Number(req.body.loadChildrenLevel) : Number(env.childrenMaxRecursiveLimits.list));

    const jwt = JWT.parseFromHeader(
        req.header('Authorization')
    );

    const pagination = (req.body.hasOwnProperty("pagination") ? Number(req.body.pagination) : 1);

    const offChainDBClient = new OffChainDBClient();

    return await offChainDBClient.getAssetList(
        filter,
        fields,
        loadChildrenLevel,
        JWT.parseMspIDFromToken(jwt),
        pagination
    ).then(
        (response: any) => Response.json(res, response, 200)
    ).catch(
        (error: any) => Response.json(res, Response.errorPayload(error), Response.errorStatusCode(error))
    );


}
/**
 * @ignore
 * @swagger
 * /v1/off-hlf-db/get-asset-list:
 *   post:
 *     security:
 *       - Bearer: []
 *     description: Get asset list from the ledger by given filter
 *     tags: ['off-hlf-db']
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: filter
 *         description: Filter object
 *         in: body
 *         required: true
 *         type: object
 *         schema:
 *           $ref: '#/definitions/FilterObject'
 *     responses:
 *       200:
 *         description: asset list matched by given query
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/definitions/AssetListResponse'
 */
