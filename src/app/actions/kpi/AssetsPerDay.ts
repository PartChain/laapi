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

import KPIClient from "../../domains/KPIClient";
import JWT from "../../modules/jwt/JWT";
import Response from "../../modules/response/Response";

/**
 * Assets per day action
 * @param req
 * @param res
 * @param next
 * @constructor
 */
export default async function AssetsPerDay(req: any, res: any, next: any) {
    const client = new KPIClient;
    const jwt = JWT.parseFromHeader(
        req.header('Authorization')
    );

    return await client.assetsPerDay(
        req.body.hasOwnProperty("filter") ? req.body.filter : Object.create({}),
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
 * /v1/kpi/assets-per-day:
 *   post:
 *     security:
 *       - Bearer: []
 *     description: Get assets count manufactured within the period in filter
 *     tags: ['kpi']
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
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     vehicles:
 *                       type: object
 */
