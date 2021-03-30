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

/**
 * @class KPIClient
 */
import Logger from "../modules/logger/Logger";
import OffChainDBClient from "./OffChainDBClient";
import RichQuerySQL from "../modules/rich-query-sql/RichQuerySQL";
import DateCreator from "../modules/date/DateCreator";
import env from "../defaults";
import TransactionClient from "./TransactionClient";

const IsoToLatLong = require('country-iso-to-coordinates');

export default class KPIClient extends OffChainDBClient {

    /**
     * Uses data stored in the SQL database to generate kpi statistics
     * @param filter
     * @param mspIDFromJWT
     */
    async kpiStats(filter: any, mspIDFromJWT: string) {
        Logger.info(`[${mspIDFromJWT}] In kpiStats`);

        filter = (filter === undefined) ? Object.create({}) : filter;

        // Get default from to date if one of them is missing
        if (!filter.hasOwnProperty("productionDateTo") || !filter.productionDateTo.hasOwnProperty("value")) {
            filter["productionDateTo"] = {"value": this.getDefaultDateValue('to')};
        }
        if (!filter.hasOwnProperty("productionDateFrom") || !filter.productionDateFrom.hasOwnProperty("value")) {
            filter["productionDateFrom"] = {"value": this.getDefaultDateValue('from')};
        }

        const counts: any = await this.getNumberVehicles(filter, mspIDFromJWT);

        const assetsPerDay: any = await this.assetsPerDay(filter, mspIDFromJWT);

        const qualityStatusRatio: any = await this.getQualityStatusRatio(filter, mspIDFromJWT);

        const AssetsCountPerCountryAndSupplier = await this.assetsPerManufacturerAndCountry(filter, mspIDFromJWT);

        let output = {
            'assetsCount': Number(counts[0].assets_count),
            'ownAssetsCount': Number(counts[0].own_assets_count),
            'otherAssetsCount': Number(counts[0].other_assets_count),
            'assetsPerDay': assetsPerDay,
            'qualityStatusRatio': qualityStatusRatio,
            'AssetsCountPerCountryAndSupplier': AssetsCountPerCountryAndSupplier

        };

        Logger.info(`[${mspIDFromJWT}] kpiStats with output ${JSON.stringify(output)}`);

        return output;
    }

    /**
     * Assets per day
     * @async
     * @param filter
     * @param mspIDFromJWT
     */
    async assetsPerDay(filter: any, mspIDFromJWT: string) {
        Logger.info(`[${mspIDFromJWT}] In assetsPerDay`);
        const dateRange = {
            'productionDateFrom': {
                value: filter.productionDateFrom.value ? filter.productionDateFrom.value : this.getDefaultDateValue('from')
            },
            'productionDateTo': {
                value: filter.productionDateTo.value ? filter.productionDateTo.value : this.getDefaultDateValue('to')
            }
        };

        const richQuerySQLFilter = (RichQuerySQL.create(dateRange, mspIDFromJWT)).query;

        const connectionPool = await this.connectAndSync(mspIDFromJWT);

        const whereCondition = await this.buildWhereCondition(richQuerySQLFilter);
        const queryString = `SELECT to_char(production_date_gmt,'YYYY-MM-DD') date, count(*) AS assets_counts,
                            sum(case when mspid  = '${mspIDFromJWT}' then 1 else 0 end) AS own_assets_count,
                            sum(case when mspid  != '${mspIDFromJWT}' then 1 else 0 end) AS other_assets_count
                            FROM assets
                            ${whereCondition.whereConditionString}
                            GROUP BY to_char(production_date_gmt,'YYYY-MM-DD')`
        Logger.debug(`[${mspIDFromJWT}] Executing query: ${queryString}`);
        const assetsPerDay: any = await connectionPool.pool.query(queryString, this.createRawQueryOptionsWithReplacement(whereCondition.replacements));

        return assetsPerDay.reduce((obj: any, item: any) => {
            if (!obj.hasOwnProperty("ownAssets")) {
                obj['ownAssets'] = this.prepareOutputObject(dateRange);
                obj['otherAssets'] = this.prepareOutputObject(dateRange);
            }
            obj.ownAssets[item.date] = Number(item.own_assets_count)
            obj.otherAssets[item.date] = Number(item.other_assets_count)
            return obj
        }, {})
    }

    async assetsPerManufacturerAndCountry(filter: any, mspIDFromJWT: string) {
        Logger.info(`[${mspIDFromJWT}] In assetsPerManufacturerAndCountry`);
        const connectionPool = await this.connectAndSync(mspIDFromJWT);

        const richQuerySQLFilter = (RichQuerySQL.create(filter, mspIDFromJWT)).query;

        const whereCondition = await this.buildWhereCondition(richQuerySQLFilter);
        const queryString = `SELECT manufacturer, production_country_code_manufacturer,count(*) assets_count
                            FROM assets
                            ${whereCondition.whereConditionString}
                            GROUP BY manufacturer,production_country_code_manufacturer`;
        Logger.debug(`[${mspIDFromJWT})] Executing query: ${queryString}`);
        return connectionPool.pool.query(queryString, this.createRawQueryOptionsWithReplacement(whereCondition.replacements)).then(
            async (response: any) => {
                return response.map((r: any) => {
                    return {
                        'manufacturer': r.manufacturer,
                        'countryCode': r.production_country_code_manufacturer,
                        'coordinates': IsoToLatLong[r.production_country_code_manufacturer].coordinate,
                        'assetsCount': Number(r.assets_count)
                    }
                })
            });

    }


    /**
     * Get tiles data
     * @async
     * @param mspIDFromJWT
     */
    async getTilesData(mspIDFromJWT: string) {
        Logger.info(`[${mspIDFromJWT}] In getTilesData`);
        const filter = {
            productionDateFrom: {value: DateCreator.getBeginningDate(env.tilesDuration)},
            productionDateTo: {value: DateCreator.getToday()}
        };

        const counts: any = await this.getNumberVehicles(filter, mspIDFromJWT);

        const clientDB = new TransactionClient;
        const transactions = await clientDB.getTransactions({status: 'PENDING'}, mspIDFromJWT, mspIDFromJWT);
        Logger.debug(`[${mspIDFromJWT}] Transactions: ${JSON.stringify(transactions)}`);

        const tiles = JSON.parse(
            JSON.stringify({
                "assetsCount": Number(counts[0].assets_count),
                "tilesDuration": env.tilesDuration,
                "otherAssetsCount": Number(counts[0].other_assets_count),
                "transactionsCount": transactions.length,
                "ownAssetsCount": Number(counts[0].own_assets_count)
            })
        );
        Logger.debug(`[${mspIDFromJWT}] Tiles output: ${JSON.stringify(tiles)}`);

        return tiles;
    }

    /**
     *
     * @param filter
     * @param mspIDFromJWT
     */
    async getNumberVehicles(filter: any, mspIDFromJWT: string) {
        Logger.info(`[${mspIDFromJWT}] getNumberVehicles`);
        const connectionPool = await this.connectAndSync(mspIDFromJWT);

        const richQuerySQLFilter = (RichQuerySQL.create(filter, mspIDFromJWT)).query;

        const whereCondition = await this.buildWhereCondition(richQuerySQLFilter);
        const queryString = `SELECT COUNT(*) as assets_count,
                                 sum(case when mspid  = '${mspIDFromJWT}' then 1 else 0 end) as own_assets_count,
                                 sum(case when mspid  != '${mspIDFromJWT}' then 1 else 0 end) as other_assets_count
                                 FROM Assets
                                 ${whereCondition.whereConditionString};`;
        Logger.debug(`[${mspIDFromJWT}] Executing query: ${queryString}`);
        return connectionPool.pool.query(queryString, this.createRawQueryOptionsWithReplacement(whereCondition.replacements));

    }

    /**
     *
     * @param filter
     * @param mspIDFromJWT
     */
    async getQualityStatusRatio(filter: any, mspIDFromJWT: string) {
        Logger.info(`[${mspIDFromJWT}] getQualityStatusRatio`);
        const connectionPool = await this.connectAndSync(mspIDFromJWT);

        const richQuerySQLFilter = (RichQuerySQL.create(filter, mspIDFromJWT)).query;

        const whereCondition = await this.buildWhereCondition(richQuerySQLFilter);
        // the union ensures that all manufacturers are there even if the value of this manufacturer in the given range is 0
        const queryString = `   WITH table1 AS (SELECT manufacturer,
                                                       sum(case when quality_status = 'OK' then 1 else 0 end)  as OK,
                                                       sum(case when quality_status = 'NOK' then 1 else 0 end) as NOK
                                                FROM assets
                                                ${whereCondition.whereConditionString}
                                                GROUP BY manufacturer)
                                SELECT *
                                FROM table1
                                
                                UNION ALL
                                
                                SELECT *
                                FROM (SELECT DISTINCT(manufacturer), 0 AS OK, 0 AS NOK FROM assets) table2
                                WHERE NOT exists(SELECT 1 FROM table1 WHERE table1.manufacturer = table2.manufacturer)`;
        Logger.debug(`[${mspIDFromJWT}] Executing query: ${queryString}`);
        const qualityStatusRatio: any = await connectionPool.pool.query(queryString, this.createRawQueryOptionsWithReplacement(whereCondition.replacements));

        return qualityStatusRatio.reduce((obj: any, item: any) => {
            if (!obj.hasOwnProperty(item.manufacturer)) {
                obj[item.manufacturer] = {};
            }
            obj[item.manufacturer]["OK"] = Number(item.ok);
            obj[item.manufacturer]["NOK"] = Number(item.nok);
            delete obj[item.manufacturer].manufacturer;
            return obj
        }, {})

    }

    /**
     * @param mspIDFromJWT
     */
    async getRelationshipStats(mspIDFromJWT: string) {
        Logger.info(`[${mspIDFromJWT}] getRelationshipStats`);
        const connectionPool = await this.connectAndSync(mspIDFromJWT);


        const queryString = `SELECT transfer_status, COUNT(*)
                                FROM relationships
                                GROUP BY transfer_status;`;
        Logger.debug(`[${mspIDFromJWT}] Executing query: ${queryString}`);
        return connectionPool.pool.query(queryString, this.createRawQueryOptionsWithReplacement(null));
    }


    /**
     * Prepare output object
     * @protected
     * @param dateRange
     */
    protected prepareOutputObject(dateRange: any) {
        const output = Object.create({});

        const currentDate = new Date(
            Date.parse(dateRange.productionDateFrom.value)
        );
        const endDate = new Date(
            Date.parse(dateRange.productionDateTo.value)
        );

        output[this.dateToDateString(currentDate)] = 0;

        let proceed = true;
        while (proceed) {
            currentDate.setDate(currentDate.getDate() + 1);
            const date = this.dateToDateString(currentDate);

            output[date] = 0;
            proceed = currentDate.getTime() < endDate.getTime();
        }

        return output;
    }

    /**
     * Cut date from timestamp string
     * @protected
     * @param timestamp
     */
    protected cutDateFromTimestamp(timestamp: string) {
        const dateMask = 'yyyy-mm-dd';

        return timestamp.substr(0, dateMask.length);
    }

    /**
     * Get default value for date range
     * @protected
     * @param key
     * @param defaultPeriod
     */
    protected getDefaultDateValue(key: string, defaultPeriod: number = 30) {
        //default period in days
        const date = new Date();

        if (key === 'from') {
            date.setDate(date.getDate() - defaultPeriod);
        }

        return this.dateToDateString(date);
    }

    /**
     * Convert date to DateString
     * @protected
     * @param date
     */
    protected dateToDateString(date: Date) {
        const month = date.getMonth() + 1;
        const day = date.getDate();

        return date.getFullYear()
            + '-' + (month < 10 ? '0' : '') + month
            + '-' + (day < 10 ? '0' : '') + day;
        //    + 'T00:00:00Z';
    }

}
