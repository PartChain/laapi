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

import route, {getRouteOptions} from "../modules/route/route";
import InitDatabase from "../actions/offHLFDB/InitDatabase";
import GetAssetDetail from "../actions/offHLFDB/GetAssetDetail";
import GetAssetList from "../actions/offHLFDB/GetAssetList";
import GetAssetChildren from "../actions/offHLFDB/GetAssetChildren";
import {default as GetAssetParentOffHLFDB} from "../actions/offHLFDB/GetAssetParent";
import GetCustomsReport from "../actions/offHLFDB/GetCustomsReport";
import GetMspIDs from "../actions/offHLFDB/GetMspIDs";


/**
 * Global options for all routes
 */

/**
 * Initialize the database and the according tables
 */
const initDatabase = route('init-database', InitDatabase, getRouteOptions("post"));

/**
 * Get asset detail route
 */
const getAssetDetail = route('get-asset-detail', GetAssetDetail, getRouteOptions("get"));

/**
 * Get asset list route
 */
const getAssetList = route('get-asset-list', GetAssetList, getRouteOptions("post"));

/**
 * Get asset children route
 */
const getAssetChildren = route('get-asset-children', GetAssetChildren, getRouteOptions("get"));

/**
 * Get asset children route
 */
const getAssetParent = route('get-asset-parent', GetAssetParentOffHLFDB, getRouteOptions("get"));

/**
 * Get customs report for FR
 */
const getCustomsReport = route('get-customs-report', GetCustomsReport, getRouteOptions("post"));

/**
 * Get all mspIDs stored in postgres
 */
const getMspIDs = route('get-mspids', GetMspIDs, getRouteOptions("get"));

/**
 * OffChainDBClient API router
 * @export object
 */
export default {
    pathPrefix: 'v1/off-hlf-db',
    data: [
        initDatabase,
        getAssetDetail,
        getAssetList,
        getAssetParent,
        getAssetChildren,
        getCustomsReport,
        getMspIDs
    ]
}
