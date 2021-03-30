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

import TransactionModel from '../models/Transaction';
import SQLClient from '../modules/sql-client/SQLClient';
import {Sequelize} from "sequelize";

/**
 * Transaction SQL client
 * @class TransactionClient
 * @extends SQLClient
 */
export default class TransactionClient extends SQLClient {


    /**
     * Establishes a new connection pool to the database if the pool does not yet exist. Also creates a new database
     * and the according tables if they do not exist (based on the JWT mspID)
     * @param mspID
     */
    async connectAndSync(mspID: string): Promise<{ pool: Sequelize; transactionModel: any }> {

        const connectionPool = await super.connectAndSync(mspID);
        const transactionModel = await this.initModel(TransactionModel, connectionPool);
        await transactionModel.sync();
        return {pool: connectionPool, transactionModel: transactionModel};
    }


    /**
     * Get all transactions
     * @async
     * @param filter
     * @param userID
     * @param mspIDFromJWT
     */
    async getTransactions(filter: any = {}, userID: string, mspIDFromJWT: string) {

        const connectionPool = await this.connectAndSync(mspIDFromJWT);

        return await connectionPool.transactionModel.findAll({
            where: filter
        });
    }


}
