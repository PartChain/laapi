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

import SQLClient from '../modules/sql-client/SQLClient';
import Objects from '../modules/mapper/Objects';
import Strings from '../modules/mapper/Strings';
import Logger from "../modules/logger/Logger";
import AssetModel, {getAssetModelDefinition} from "../models/Asset";
import RelationshipModel from "../models/Relationship";
import env from "../defaults";
import RichQuerySQL from "../modules/rich-query-sql/RichQuerySQL";
import {Sequelize} from "sequelize";
import Iterable from "../modules/iterable/Iterable";
import _ = require("lodash");


/**
 * OffChainDBClient
 * @class OffChainDBClient
 * @extends SQLClient
 */
export default class OffChainDBClient extends SQLClient {

    /**
     * Establishes a new connection pool to the database if the pool does not yet exist. Also creates a new database
     * and the according tables if they do not exist (based on the mspIDFromJWT mspID)
     * @param mspID
     */
    async connectAndSync(mspID: any): Promise<{ pool: Sequelize; assetModel: any; relationshipModel: any; }> {
        const connectionPool = await super.connectAndSync(mspID);
        const assetModel = await this.initModel(AssetModel, connectionPool);
        await assetModel.sync();
        const relationshipModel = await this.initModel(RelationshipModel, connectionPool);
        await relationshipModel.sync();
        return {pool: connectionPool, assetModel: assetModel, relationshipModel: relationshipModel};
    }

    /**
     * Builds ConnectionPool and thus creates database/tables if they do no exist yet
     * @param mspIDFromJWT
     */
    async initDatabase(mspIDFromJWT: string) {
        Logger.info("initDatabase in OffChainDBClient");
        await this.connectAndSync(mspIDFromJWT);
        Logger.info("initDatabase finished");
        return "initDatabase was successful";

    }


    /**
     * Get single Part with or without children
     * @async
     * @param serialNumberCustomers
     * @param maxChildLevel
     * @param mspIDFromJWT
     */
    async getAssetDetail(serialNumberCustomers: string | Array<string>, maxChildLevel: number = Number(env.childrenMaxRecursiveLimits.list), mspIDFromJWT: string) {
        Logger.info(`[${mspIDFromJWT}] GetAssetDetail in OffChainDBClient with serialNumberCustomers ${serialNumberCustomers}`);

        serialNumberCustomers = Iterable.create(serialNumberCustomers);

        const connectionPool = await this.connectAndSync(mspIDFromJWT);

        const serialNumberList = serialNumberCustomers;
        let queryString;

        // If we do not need children, we can do simple query.
        if (maxChildLevel) {
            const whereConditionString = `WHERE serial_number_customer IN (:serialNumberList)`;
            // Create Query
            queryString = await this.buildTreeQuery(whereConditionString, maxChildLevel);
        } else {
            const whereConditionString = `IN (:serialNumberList)`
            queryString = `SELECT a.*,  COALESCE(jsonb_agg(r.child_serial_number_customer) FILTER ( WHERE NOT (r.child_serial_number_customer = 'null')), '[]')  as components_serial_numbers
                                FROM Assets a
                                LEFT JOIN relationships r ON a.serial_number_customer = r.parent_serial_number_customer
                                WHERE serial_number_customer ${whereConditionString}
                                GROUP BY a.serial_number_customer;`;

        }

        Logger.debug(`Executing query: ${queryString}`);
        return connectionPool.pool.query(queryString, this.createRawQueryOptionsWithReplacement({serialNumberList: serialNumberList})).then(
            async (response: any) => {
                if (Array.isArray(response) && response.length === 0) {
                    return {};
                } else {
                    response = Objects.mapNestedKeys(response[0], Strings.snakeCaseToCamelCase);

                    if (response.hasOwnProperty("resultLength")) {
                        delete response.resultLength;
                    }
                    if (response.hasOwnProperty("lvl")) {
                        delete response.lvl;
                    }
                    if (response.hasOwnProperty("createdat")) {
                        delete response.createdat;
                    }
                    if (response.hasOwnProperty("updatedat")) {
                        delete response.updatedat;
                    }
                    return response;
                }

            })

    }

    /**
     * Query multiple Parts with or without Children depending on filter
     * @param filter
     * @param fields
     * @param maxChildLevel
     * @param mspIDFromJWT
     * @param pagination
     */
    async getAssetList(filter: any, fields: Array<string>, maxChildLevel: number = Number(env.childrenMaxRecursiveLimits.list), mspIDFromJWT: string, pagination: number = 0) {
        Logger.info(`[${mspIDFromJWT}] getAssetList in OffChainDBClient with maxChildLevel ${maxChildLevel} and pagination ${pagination}`);
        const connectionPool = await this.connectAndSync(mspIDFromJWT);

        filter = (RichQuerySQL.create(filter, mspIDFromJWT, fields)).query;
        filter = await this.cleanFilter(filter);
        let queryString;
        const whereCondition = await this.buildWhereCondition(filter);
        // If we do not need children, we can do simple query.
        if (maxChildLevel < 1) {
            // remove componentsSerialNumbers from fields (We will add it ourselves if needed in OffChainDBClient)
            const index = filter.fields.indexOf("components_serial_numbers", 0);
            if (index > -1) {
                filter.fields.splice(index, 1);
            }
            queryString = `SELECT a.${filter.fields.join(", a.")}, jsonb_agg(r.child_serial_number_customer) as components_serial_numbers , count(*) OVER() AS result_length
                                    FROM Assets a
                                    LEFT JOIN relationships r ON a.serial_number_customer = r.parent_serial_number_customer
                                    ${whereCondition.whereConditionString}
                                    GROUP BY a.serial_number_customer, a.production_date_gmt
                                    ORDER BY a.production_date_gmt DESC
                                    ${(pagination > 0) ? `OFFSET ${(pagination - 1) * env.paginationLimit} LIMIT ${env.paginationLimit}` : ""};`;

        } else {
            // Create Query
            queryString = await this.buildTreeQuery(whereCondition.whereConditionString, maxChildLevel, pagination, filter.fields);
        }
        Logger.debug(`[${mspIDFromJWT}] Executing query: ${queryString}`);
        return connectionPool.pool.query(queryString, this.createRawQueryOptionsWithReplacement(whereCondition.replacements)).then(
            async (response: any) => {

                Logger.debug(JSON.stringify(response));
                // If response is empty directly call Response.json
                if (response.length < 1) {
                    return response;
                }

                // Convert to CamelCase
                response = response.map(
                    (tx: any) => Objects.mapNestedKeys(tx, Strings.snakeCaseToCamelCase)
                );

                return {
                    "resultLength": response[0].hasOwnProperty("resultLength") ? Number(response[0].resultLength) : response.length,
                    "nextPage": (pagination > 0) ? (pagination * env.paginationLimit < response[0].resultLength) : false,
                    "data": response.map(
                        (tx: any) => {
                            if (tx.hasOwnProperty("resultLength")) {
                                delete tx.resultLength;
                            }
                            if (tx.hasOwnProperty("lvl")) {
                                delete tx.lvl;
                            }
                            return tx
                        }),
                    "status": 200

                };


            }
        );

    }

    /**
     * getAssetParent
     * @async
     * @param serialNumberCustomers
     * @param mspIDFromJWT
     * @param fields
     */
    async getAssetParent(serialNumberCustomers: string | Array<string>, mspIDFromJWT: string,
                         fields: Array<string> = RichQuerySQL.defaultFields.map(((field: string) => Strings.camelCaseToSnakeCase(field)))) {
        Logger.info(`[${mspIDFromJWT}] getAssetParent in OffChainDBClient`);
        const connectionPool = await this.connectAndSync(mspIDFromJWT);

        const serialNumberList = Iterable.create(serialNumberCustomers);

        fields = await this.cleanFields(fields);
        const index = fields.indexOf("components_serial_numbers", 0);
        let fieldsRightOuterJoin = fields;
        // This is needed since components_serial_numbers is built in the RightOuterJoin, thus cannot be referenced again
        if (index > -1) {
            fieldsRightOuterJoin.splice(index, 1);
        }
        const whereConditionString = `IN (:serialNumberList)`
        const queryString = `SELECT    ${fields ? `${fields.join(", ")}` : "*"}, components_serial_numbers, parents
                                FROM (
                                         SELECT a.*,
                                                COALESCE(jsonb_agg(r.child_serial_number_customer)
                                                         FILTER ( WHERE NOT (r.child_serial_number_customer = 'null')), ' []
                                                                            ') as components_serial_numbers  --Aggregate children into one column
                             
                                         FROM Assets a
                                                  LEFT JOIN relationships r ON a.serial_number_customer = r.parent_serial_number_customer
                                         WHERE a.serial_number_customer ${whereConditionString}
                                         GROUP BY a.serial_number_customer
                                      ) Assets --Child asset joined with relationship table to get its components_serial_numbers
                                LEFT OUTER JOIN
                                    (
                                         SELECT relationships.child_serial_number_customer, to_jsonb(Assets) parents
                                         FROM (SELECT * from relationships where child_serial_number_customer = (SELECT serial_number_customer from assets where serial_number_customer ${whereConditionString})) Relationships --Only get the relevant relationship 
                                                  LEFT OUTER JOIN (SELECT  ${fieldsRightOuterJoin ? `${fieldsRightOuterJoin.join(", ")}` : "*"} from Assets) Assets 
                                                  ON Relationships.parent_serial_number_customer = Assets.serial_number_customer
                                     ) parents
                                ON parents.child_serial_number_customer = assets.serial_number_customer  --Join tables to get the child and its parent s
                                WHERE serial_number_customer ${whereConditionString};`;
        Logger.debug(`Executing query: ${queryString}`);
        return connectionPool.pool.query(queryString, this.createRawQueryOptionsWithReplacement({serialNumberList: serialNumberList})).then(
            async (response: any) => {
                if (response.length > 0) {
                    response = Objects.mapNestedKeys(response, Strings.snakeCaseToCamelCase);
                    const responseMerged = Object.assign({}, response[0]);
                    if (responseMerged.hasOwnProperty("resultLength")) {
                        delete responseMerged.resultLength;
                    }
                    // merge all parents into one object
                    responseMerged["parents"] = response.map((asset: any) => asset.parents);
                    responseMerged["parents"] = _.compact(responseMerged["parents"]);

                    return responseMerged;
                }
                return response;

            }
        );
    }

    /**
     * getAssetChildren
     * @async
     * @param serialNumberCustomers
     * @param mspIDFromJWT
     * @param fields
     */
    async getAssetChildren(serialNumberCustomers: string | Array<string>, mspIDFromJWT: string,
                           fields: Array<string> = RichQuerySQL.defaultFields.map(((field: string) => Strings.camelCaseToSnakeCase(field)))) {
        Logger.info(`[${mspIDFromJWT}] getAssetChildren in OffChainDBClient`);
        const connectionPool = await this.connectAndSync(mspIDFromJWT);

        fields = await this.cleanFields(fields);

        const serialNumberList = Iterable.create(serialNumberCustomers);

        const whereConditionString = `IN (:serialNumberList)`;
        const queryString = `select ${fields ? `Assets.${fields.join(", Assets.")}` : "Assets.*"}
                            FROM Relationships
                                     RIGHT OUTER JOIN (
                                                        SELECT a.*,
                                                               COALESCE(jsonb_agg(r.child_serial_number_customer)
                                                                        FILTER ( WHERE NOT (r.child_serial_number_customer = 'null')), '[]') as components_serial_numbers
                                                    
                                                        FROM Assets a
                                                                 LEFT JOIN relationships r ON a.serial_number_customer = r.parent_serial_number_customer
                                                        GROUP BY a.serial_number_customer) Assets
                                     ON Relationships.child_Serial_Number_Customer = Assets.serial_Number_Customer
                            WHERE parent_serial_number_customer ${whereConditionString};`;
        Logger.debug(`[${mspIDFromJWT}] Executing query: ${queryString}`);
        return connectionPool.pool.query(queryString, this.createRawQueryOptionsWithReplacement({serialNumberList: serialNumberList})).then(
            async (response: any) => {
                if (response.length < 1) {
                    return response;
                } else {
                    // Convert to CamelCase
                    return response.map(
                        (tx: any) => Objects.mapNestedKeys(tx, Strings.snakeCaseToCamelCase)
                    );
                }

            }
        )

    }

    /**
     * Get all distinct mspIDs in the asset table
     * @param mspIDFromJWT
     */
    async getMspIDs(mspIDFromJWT: string) {
        Logger.info(`[${mspIDFromJWT}] mspIDFromJWTs in OffChainDBClient`);
        const connectionPool = await this.connectAndSync(mspIDFromJWT);

        const queryString = `SELECT distinct(mspid)
                             FROM assets;`;
        Logger.debug(`[${mspIDFromJWT}] Executing query: ${queryString}`);
        return connectionPool.pool.query(queryString, this.createRawQueryOptionsWithReplacement(null)).then(
            async (response: any) => {
                return response.map((r: any) => r.mspid)
            });
    }


    /**
     * This function builds a SQL query which builds up a hierachy from parents -> children recursively for all levels.
     * It is inspired by https://schinckel.net/2017/07/01/tree-data-as-a-nested-list-redux/ , but customized for our needs.
     * @param whereConditionStringParent
     * @param fields
     * @param maxChildLevel
     * @param pagination
     */
    async buildTreeQuery(whereConditionStringParent: string, maxChildLevel: number = 0, pagination: number = 0,
                         fields: Array<string> = RichQuerySQL.defaultFields.map(((field: string) => Strings.camelCaseToSnakeCase(field)))) {

        //let atLeastOneNOKString = atLeastOneNOK ? "AND EXISTS (SELECT * FROM c_tree x WHERE c_tree.serial_number_customer = x.parent AND x.qualityStatus = 'NOK')" : "";

        pagination = Number(pagination);
        fields = await this.cleanFields(fields);

        let paginationString = (pagination > 0) ? `OFFSET ${(pagination - 1) * env.paginationLimit} LIMIT ${env.paginationLimit}` : "";
        // let minimumNumberChildrenString = minimumNumberChildren ?  `and JSONB_ARRAY_LENGTH(js->'Children') > ${minimumNumberChildren};` : `;`;

        return `WITH RECURSIVE 
                 filtered_set AS (  SELECT * ${(pagination > 0) ? ", count(*) over() as result_length" : ""}
                                    FROM assets
                                    ${whereConditionStringParent}
                                    ORDER BY production_Date_Gmt DESC
                                    ${paginationString}),
                location_with_level AS ((
                SELECT ${fields ? `t1.${fields.join(", t1.")}` : "t1.*"}, t1.parent_Serial_Number_Customer,
                       0 AS lvl ${(pagination > 0) ? ",t1.result_length" : ""} 
                FROM (
                        select *
                        from  (SELECT * from relationships where exists(SELECT 1 from filtered_set AS fs where fs.serial_number_customer = parent_serial_number_customer)) Relationships
                        RIGHT OUTER JOIN ( 
                             
                             SELECT a.*,(SELECT COALESCE(jsonb_agg(r.child_serial_number_customer) FILTER ( WHERE NOT (r.child_serial_number_customer = 'null')), '[]') FROM Assets assets_duplicate
                                                    LEFT JOIN relationships r ON assets_duplicate.serial_number_customer = r.parent_serial_number_customer
                                                     WHERE a.serial_number_customer = assets_duplicate.serial_number_customer
                                                    GROUP BY assets_duplicate.serial_number_customer)  as components_serial_numbers
                            FROM filtered_set a
                            ) Assets ON Relationships.child_Serial_Number_Customer=Assets.serial_Number_Customer
                       ) as t1  where t1.parent_serial_number_customer is NULL)

                UNION ALL
            
                SELECT ${fields ? `child.${fields.join(", child.")}` : "child.*"}, child.parent_Serial_Number_customer,
                       parent.lvl + 1 ${(pagination > 0) ? ", 0 as result_length" : ""}
                FROM (
                        select *
                        from  Relationships
                        RIGHT OUTER JOIN (
                                       SELECT a.*,
                                                (SELECT COALESCE(jsonb_agg(r.child_serial_number_customer)
                                                                 FILTER ( WHERE NOT (r.child_serial_number_customer = 'null')),
                                                                 '[]') 
                                                 FROM Assets assets_duplicate
                                                          LEFT JOIN relationships r
                                                                    ON assets_duplicate.serial_number_customer = r.parent_serial_number_customer
                                                 WHERE a.serial_number_customer = assets_duplicate.serial_number_customer
                                                 GROUP BY assets_duplicate.serial_number_customer) as components_serial_numbers
                                         FROM (
                                                  SELECT * 
                                                  from assets
                                              ) a ) Assets
                                        ON Relationships.child_Serial_Number_Customer=Assets.serial_Number_Customer
                                    ) as child
                         JOIN location_with_level parent ON parent.serial_Number_customer = child.parent_Serial_Number_customer
                ),
                maxlvl AS ( SELECT max(lvl) maxlvl FROM (SELECT * from location_with_level where lvl <= ${maxChildLevel}) maxlvltable),
                location_with_lvl_restricted AS (SELECT * from location_with_level where lvl <= ${maxChildLevel}), 
                c_tree AS (
                   SELECT location_with_lvl_restricted.*, '[]'::jsonb child_components
                   FROM location_with_lvl_restricted, maxlvl
                   WHERE location_with_lvl_restricted.lvl = maxlvl
                
                   UNION
                
                   (
                       SELECT (branch_parent).*, coalesce(jsonb_agg(branch_child) FILTER ( WHERE NOT (branch_child = 'null')), '[]'::jsonb)
                       FROM (
                                SELECT branch_parent,
                                       to_jsonb(branch_child) - 'lvl' - 'parent' - 'result_length' AS branch_child
                                FROM location_with_lvl_restricted branch_parent
                                         JOIN c_tree branch_child ON branch_child.parent_Serial_Number_customer = branch_parent.serial_Number_customer
                            ) branch
                       GROUP BY branch.branch_parent
                
                       UNION
                
                       SELECT c.*,
                              '[]'::jsonb
                       FROM location_with_lvl_restricted c
                       WHERE NOT EXISTS (SELECT 1
                                         FROM location_with_lvl_restricted hypothetical_child
                                         WHERE hypothetical_child.parent_Serial_Number_customer = c.serial_Number_customer)
                   )
                )
                SELECT * FROM (
                                SELECT *
                                FROM c_tree
                                UNION 
                                SELECT *, '[]'::jsonb
                                FROM location_with_level
                                WHERE lvl >= ${maxChildLevel}
                              ) final_set  WHERE EXISTS(SELECT 1 FROM filtered_set AS fs WHERE fs.serial_number_customer = final_set.serial_number_customer);`;

    }

    /**
     * Removes keys from object which are not found in the assetModel definition
     * @param filter
     */
    async cleanFilter(filter: any) {
        Logger.debug("In cleanFilter now");
        // Remove all keys where are not fit to the model
        const assetColumns = await getAssetModelDefinition(AssetModel);
        for (let key in filter.selector) {
            if (!assetColumns.hasOwnProperty(key) && key !== "components_serial_numbers" && key !== "child_components" && key !== "part_name_number") {
                Logger.info(`Deleting key ${key}`);
                delete filter.selector[key];
            }

        }
        filter.fields = await this.cleanFields(filter.fields);
        return filter;
    }

    /**
     * Removes Fields which are not in Asset Definition
     * @param fields
     */
    async cleanFields(fields: Array<string>) {
        Logger.debug("In cleanFields now");
        // Remove all keys where are not fit to the model
        const assetColumns = await getAssetModelDefinition(AssetModel);
        for (let key of fields) {
            // components_serial_numbers is not in the AssetModelDefinition, but we want it either way
            if (!assetColumns.hasOwnProperty(key) && key !== "components_serial_numbers") {
                Logger.debug(`Deleting field ${key}`);
                let index = fields.indexOf(key);
                if (index !== -1) fields.splice(index, 1);
            }
        }
        return fields;
    }

    /**
     * Uses the filter generated by RichQuerySQL to build an WHERE clause
     * @param filter
     */
    async buildWhereCondition(filter: any) {
        Logger.debug(`Called buildWhereCondition with ${JSON.stringify(filter)}`);

        let replacements = Object.create({});
        let whereConditionString = "";
        for (let key in filter.selector) {
            if (filter.selector.hasOwnProperty(key)) {
                if (!whereConditionString) {
                    // omit key if key == partNameNumber, since the structure of partNameNumber value. See getPartNameNumberSelector function for details
                    whereConditionString = `WHERE ${(key === 'part_name_number') ? "" : key} ${filter.selector[key].whereClause}`;
                    replacements = {...replacements, ...filter.selector[key].replacement};
                } else {
                    whereConditionString = whereConditionString + ` AND ${(key === 'part_name_number') ? "" : key} ${filter.selector[key].whereClause}`;
                    replacements = {...replacements, ...filter.selector[key].replacement};

                }
            }

        }
        Logger.debug(replacements);
        return {"whereConditionString": whereConditionString, "replacements": replacements};
    }

}
