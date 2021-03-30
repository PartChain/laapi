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
 * Default configuration map
 * @export object
 */
export default {
    host: process.env.API_HOST ? process.env.API_HOST : 'https://domain.tld',
    port: process.env.API_PORT ? process.env.API_PORT : 8080,
    cors: process.env.API_CORS ? process.env.API_CORS : true,
    tilesDuration: process.env.TILES_DURATION ? process.env.TILES_DURATION : 'month',
    compression: process.env.API_COMPRESSION ? process.env.API_COMPRESSION : true,
    loggingLevel: process.env.LOGGING_LEVEL ? process.env.LOGGING_LEVEL : 'info',
    paginationLimit: process.env.HLF_PAGINATION_LIMIT ? Number(process.env.HLF_PAGINATION_LIMIT) : 25,
    childrenMaxRecursiveLimits: {
        detail: process.env.HLF_CHILDREN_MAX_RECURSIVE_LEVEL_DETAIL ? process.env.HLF_CHILDREN_MAX_RECURSIVE_LEVEL_DETAIL : 2,
        list: process.env.HLF_CHILDREN_MAX_RECURSIVE_LEVEL_LIST ? process.env.HLF_CHILDREN_MAX_RECURSIVE_LEVEL_LIST : 2
    },
    postgres: {
        host: process.env.API_DATABASE_HOST,
        name: process.env.API_DATABASE_NAME ? process.env.API_DATABASE_NAME : 'postgres',
        user: process.env.API_DATABASE_USER ? process.env.API_DATABASE_USER : 'postgres',
        password: process.env.API_DATABASE_PASSWORD,

    },
    docs: {
        enabled: process.env.API_DOCS_ENABLED ? process.env.API_DOCS_ENABLED : true,
        rootFolder: process.env.API_DOCS_ROOT_FOLDER ? process.env.API_DOCS_ROOT_FOLDER : 'docs',
        path: process.env.API_DOCS_HTTP_PATH ? process.env.API_DOCS_HTTP_PATH : '/api-docs/reference'
    },
    swagger: {
        enabled: process.env.API_SWAGGER_ENABLED ? process.env.API_SWAGGER_ENABLED : true,
        host: process.env.API_HOST ? process.env.API_HOST : 'https://domain.tld',
        openapi: process.env.API_SWAGGER_API_VERSION ? process.env.API_SWAGGER_API_VERSION : '3.0.0',
        basePath: process.env.API_BASE ? process.env.API_BASE : '/v1',
        path: process.env.API_SWAGGER_HTTP_PATH ? process.env.API_SWAGGER_HTTP_PATH : '/api-docs/swagger',
        info: {
            title: process.env.API_SWAGGER_TITLE ? process.env.API_SWAGGER_TITLE : 'Part Chain LAAPI',
            description: process.env.API_SWAGGER_DESCRIPTION
                ? process.env.API_SWAGGER_DESCRIPTION
                : 'API service for communication with HLF network.',
            version: process.env.API_SWAGGER_VERSION ? process.env.API_SWAGGER_VERSION : '1.0.0'
        },
        components: {
            securitySchemes: {
                Bearer: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        apis: []
    }
}
