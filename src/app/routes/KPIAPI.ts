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
 * Global options for all routes
 */
import route, {getRouteOptions} from "../modules/route/route";
import AssetsPerDay from "../actions/kpi/AssetsPerDay";
import KpiStats from "../actions/kpi/kpiStats";
import AssetsPerManufacturerAndCountry from "../actions/kpi/AssetsPerManufacturerAndCountry";
import Tiles from "../actions/kpi/Tiles";
import RelationshipStats from "../actions/kpi/relationshipStats";


/**
 * Assets per day route
 */
const assetsPerDay = route('assets-per-day', AssetsPerDay, getRouteOptions("post"));

/**
 * Assets per country and manufacturer
 */
const assetsPerManufacturerAndCountry = route('assets-per-MaC', AssetsPerManufacturerAndCountry, getRouteOptions("post"));

/**
 * Asset KPI stats
 */
const kpiStats = route('kpi-stats', KpiStats, getRouteOptions("post"));

/**
 * Asset Relationship stats
 */
const relationshipStats = route('relationship-stats', RelationshipStats, getRouteOptions("get"));

/**
 * Get tiles for dashboard
 */
const getTiles = route('tiles', Tiles, getRouteOptions("get"));

/**
 * KPI API router
 * @export object
 */
export default {
    pathPrefix: 'v1/kpi',
    data: [
        assetsPerDay,
        assetsPerManufacturerAndCountry,
        kpiStats,
        getTiles,
        relationshipStats
    ]
}
