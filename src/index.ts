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

import App from './app/App';
import OffChainDBClientAPI from "./app/routes/OffChainDBClientAPI";
import KPIAPI from "./app/routes/KPIAPI";
import Logger from './app/modules/logger/Logger';
import * as cluster from 'cluster';
import * as os from 'os';
import defaults from "./app/defaults";

/**
 * Create an app instance and register routes. The Cluster package is used to run the LAAPI on all CPU cores of the
 * machine where the Code is deployed. All instances listen to the same port, allowing the LAAPI to handle multiple
 * requests simultaneously.
 */

const numCPUs = os.cpus().length;

Logger.info(`Number of CPUS = ${numCPUs}`);

if (cluster.isMaster) {
    Logger.info(
        "                                               \n" +
        "          _        _        _    ____ ___      \n" +
        "         | |      / \\      / \\  |  _ \\_ _|  \n" +
        "         | |     / _ \\    / _ \\ | |_) | |    \n" +
        "         | |___ / ___ \\  / ___ \\|  __/| |    \n" +
        "         |_____/_/   \\_\\/_/   \\_\\_|  |___| \n" +
        "                                               \n" +
        "             © The PartChain Authors           \n");
    Logger.info(`Master ${process.pid} is running`);


    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker: any, code: any, signal: any) => {
        Logger.info(`Worker ${worker.process.pid} died`);
        //TODO: Evaluate in the future if we want to start a new worker if an old worker died
    });
} else {
    // Workers can share any TCP connection
    // In this case it is an Express server
    new App({
        routes: [
            KPIAPI,
            OffChainDBClientAPI
        ],
        swagger: {
            host: defaults.host,
            apis: [
                './src/app/actions/swagger.def',
                './src/app/actions/kpi/*',
                './src/app/actions/offHLFDB/*'
            ]
        }
    });

    Logger.info(`Worker ${process.pid} started`);
}
