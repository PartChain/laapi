# PartChain Ledger Abstractor

> __Note:__ This repository is still under active development! Breaking changes are possible, and we are working on improving code quality.


Ledger Abstractor Application Program Interface. This API exposes endpoints to interact with the data stored the
PostgreSQL database in the PartChain ecosystem. It does not store any new information as this is done in the AEMS!

## Prerequisites

* Running PostgreSQL database
* Running Keycloak

## API documentation

API documentation is done via swagger. The swagger can be access for example via http://localhost:8080/api-docs/swagger/

## Docker Build process

This application source code is written in Typescript, and it is using [Webpack](https://webpack.js.org/) for conversion
to ES5. Output ECMA Script version could be changed in `./tsconfig.json` file. For more information about possible
Typescript configuration options please follow
this [link](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html).

```bash
$ docker build . -t [image-name]:[image-tag]
```

For example:

 ```bash
docker build  -t link-to-your-registry/laapi:feature . -f ./Dockerfile
docker push link-to-your-registry/laapi:feature

```

Add ```--build-arg HTTP_PROXY=$http_proxy --build-arg HTTPS_PROXY=$http_proxy``` to the build command in case you have a
proxy.

## Run locally

Install npm packages:

```
npm install
```

Export necessary env variables:

```
export API_DATABASE_PASSWORD=yourpassword
export API_DATABASE_HOST=postgresServer.com
```

Save keycloak.json that looks similar to this:

```
{
  "resource": "abstractor",
  "bearer-only": true,
  "auth-server-url": "https://auth.new.partchain.dev/auth"
}
```

Build project:

```
npm run build
```

Run project:

```
npm run serve
```

Access swagger at

```
http://localhost:8080/api-docs/swagger/
```


## Environment variables 

| Variable name | Description | Default value |
|:----------|:------|:------|
| API_HOST | Application host name | https://domain.tld |
| API_BASE | API base path prefix | v0 |
| API_PORT | Application port | 8080 |
| API_DATABASE_HOST | API database host name | https://localhost |
| API_DATABASE_NAME | API database name | postgres |
| API_DATABASE_USER | API database user | postgres |
| API_DATABASE_PASSWORD  | API database password | password |
| HLF_CHILDREN_MAX_RECURSIVE_LEVEL_LIST  | Count of loaded children levels for getAssetList action | 2 |
| HLF_CHILDREN_MAX_RECURSIVE_LEVEL_DETAIL  | Count of loaded children levels for getAssetDetail action | 2 |
| HLF_PAGINATION_LIMIT | Count of assets per page | 25 |
| KEYCLOAK_CONFIG_PATH | Path to file with Keycloak profile | ./build/development/keycloak/lion/keycloak.json |

This is an excerpt of the used environmental variables. More of them and their default values can be seen
in ```src/app/defaults.ts```.


## Authentication

We use keycloak JWT to authenticate against this API. As we support multiple realms for trust as a service, the
keycloak.json of the API needs to look like this:

```
{
  "resource": "abstractor",
  "bearer-only": true,
  "auth-server-url": "https://auth.keycloak.dev/auth"
}

```

To identify the correct Hyperledger Fabric identity we need a field called mspid in the JWT token. For example if your
fabric mspid is Lion:

```
 "mspid": "Lion",

```

We also experienced that some roles are needed by the keycloak client, for example (maybe less are needed):

```
"realm_access": {
        "roles": [
            "offline_access",
            "lion_user",
            "uma_authorization",
            "user"
        ]
    },
```

## K8S Deployment process

The recommended way of deploying this service is Kubernetes. The Kubernetes deployment can be seen in the respective
helm chart in the Platform Repository

# License

[Apache License 2.0](LICENSE)