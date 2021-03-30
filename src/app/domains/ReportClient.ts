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

import Logger from './../modules/logger/Logger';
import OffChainDBClient from "./OffChainDBClient";
import Report from '../modules/report/Report';
import * as customErrors from "../modules/error/CustomErrors";
import _ = require("lodash");


/**
 * ReportClient class
 * @class ReportClient
 * @export ReportClient
 */
export default class ReportClient {

    async generateReport(filter: any, mspIDFromJWT: string, loadChildrenLevel: number = 2, pagination: number = -1, reportType: string = 'listDataPlainCSV') {
        Logger.info(`[${mspIDFromJWT}] Called generateReport with parameters ${JSON.stringify(filter)}, loadChildrenLevel ${loadChildrenLevel}, pagination ${pagination}, reportType ${reportType}`);

        const offChainDBClient = new OffChainDBClient();
        let assets: any = await offChainDBClient.getAssetList(filter, undefined, loadChildrenLevel, mspIDFromJWT, pagination);

        if (assets.data.length > 25000) {
            throw new customErrors.BadRequestError(`You have requested a report for more than 25000 assets. You requested ${assets.data.length} assets. This is currently not supported!`);
        }

        assets['data'] = assets['data'].map((o: object) => _.omit(o, ['mspid', 'parentSerialNumberCustomer']));

        Logger.info(`[${mspIDFromJWT}] Called getAssetList in generateReport with parameters ${JSON.stringify(filter)}. Got result ${JSON.stringify(assets)}`);

        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
        const yyyy = String(today.getFullYear());
        const todayString = yyyy + mm + dd;

        switch (reportType) {

            case 'customsReportExcel':
                let reportCustomsExcel = Report.getCustomsReportExcel(assets, filter);

                return reportCustomsExcel.writeToBuffer().catch((error: any) => {
                    return error;
                });

            case 'customsReportCSV':
                const subjectCustomsCSV = todayString + '_PartChainCustomsReport.csv';
                let reportCustomsCSV = Report.getCustomsReportCSV(assets, filter);
                return await Report.zipReport(subjectCustomsCSV, reportCustomsCSV);

            case 'listDataExcel':
                let reportListExcel = Report.getAssetListExcel(assets, filter); //CSV.getCustomsReport(assets, filter);

                return reportListExcel.writeToBuffer().catch((error: any) => {
                    return error
                });

            case 'listDataPlainCSV':
                const subjectListCSV = todayString + '_PartChainReport.csv';
                let reportListCSV = Report.getAssetListCSV(assets, filter);
                Logger.info(`created List Report CSV: ${reportListCSV}.`);
                return await Report.zipReport(subjectListCSV, reportListCSV);
        }
    }
}
