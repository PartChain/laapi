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

import ReportClient from '../../domains/ReportClient';
import JWT from '../../modules/jwt/JWT';
import Response from "../../modules/response/Response";

/**
 * Get asset list from the Ledger by given filter
 * @param req
 * @param res
 * @param next
 * @constructor
 */
export default async function GetCustomsReport(req: any, res: any, next: any) {
    const client = new ReportClient;
    const jwt = JWT.parseFromHeader(
        req.header('Authorization')
    );
    const filter = req.body.hasOwnProperty("filter") ? req.body.filter : Object.create({});
    const pagination = (req.body.pagination ? Number(req.body.pagination) : -1);
    const recursiveLevel = (req.body.recursiveLevel ? Number(req.body.recursiveLevel) : 2);
    const reportType = (req.body.reportType ? String(req.body.reportType) : 'listDataPlainCSV');

    client.generateReport(
        filter,
        JWT.parseMspIDFromToken(jwt),
        recursiveLevel,
        pagination,
        reportType
    ).then(
        (response: any) => Response.json(res, {response}, 200)
    ).catch(
        (error: any) => Response.json(res, Response.errorPayload(error), Response.errorStatusCode(error))
    );
}
/**
 * @ignore
 * @swagger
 * /v1/off-hlf-db/get-customs-report:
 *   post:
 *     security:
 *       - Bearer: []
 *     description: Creates a report
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
 *       - name: reportType
 *         description: Which kind of report you do want
 *         in: body
 *         required: true
 *         schema:
 *           type: string
 *           enum: [listDataPlainCSV, listDataExcel, customsReportCSV, customsReportExcel]
 *     responses:
 *       200:
 *         description: Buffer with report data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     response:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: Buffer
 *                         data:
 *                           type: array
 *                           items:
 *                             type: number
 */
