# @konmuc/authc
This package provides an authentication layer for the konmuc website.

> Warning: This is work in progress



@konmuc/authc has the following features:

- Provides an express middleware based on mongodb for securing apis.
- Comes with built in REST resources for user managment with login, logout and signup support.
- Uses JWT (JSON Web Token) as token mechanism.
- Allows multiple clients per user.


# Installation

To use this package in an express application, execute the following command:

```
npm install @konmuc/authc --save
```

Before continuing it is recommended to install also the following packages:

```
npm install express body-parser mongoose --save
```

# Usage

In the server setup script, first import the middleware and the user managment resources.

```js
// other app imports
...

// import the @konmuc/authc dependencies
import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';

// import the @konmuc/authc package
import authc from '@konmuc/authc';
import authcRouter from '@konmuc/authc/router';

// app setup goes here
...
```

Then connect to mongodb and configure express to use the @konmuc/authc authentication layer.

```js
mongoose.connect('mongodb://localhost/authc')
    .then(() => {
        // create express app
        const app = express();

        // register json middleware
        app.use(bodyParser.json()):

        // register @konmuc/authcRouter with user managment support
        app.use('/', authcRouter);

        // register @konmuc/authc middleware
        app.use(authc({ secret: APP_SECRET }));

        // remaining app setup
        ...

        // start express app
        app.liste(PORT);
    });
```

# Middelware API

## authc(options)

The `authc` middleware can be configured by the following options:

| Parameter | Description |
|-----------|-------------|
| `secret` (required) | The secret which will be used for signing JWTs. It is recommend to use here an SH256-Hash. | 
| `accessTokenExpiration` (optional) | The lifespan of an access token, after it was created. Defaults to 10 minutes. This property accepts any valid [moment.js](https://momentjs.com/) time configuration. |
| `accessTokenPayload` (optional) | A function, which allows to modify the payload for the JWT access token. The function gets the related user passed in as argument.


# Authentication Workflow

The authentication mechanism is based on an access token and refresh token pattern. The authentication process follows the following workflow:

1. A user sends its credentials (username and password) to the `/signin` resource. If a user has no credentials yet, he or she needs to register using the `/signup` resource.

2. If the credentials where valid, the `/signin` resource responded with the following parameters as json:

    - `accessToken`: A token, which authenticates the user.
    - `expiresIn`: Indicates in seconds, when the inquired `accessToken` will be invalidated.
    - `refreshToken`: A client can use the `refreshToken` to request a new `accessToken`.
    - `clientId`: A `clientId`, which is assigned to the `refreshToken`.

3. On any further request to a secured api, a client need to send the previously inquired `accessToken`. The `accessToken` must be send via the query string, the request body or the `x-access-token` header.

4. Before an `accessToken` will expire, a client can use the `refreshToken` to request a new `accessToken` via the `/token` resource.

5. To singout a user, a client need to send the `clientId` and the username via the `/signout` resource.

# Authentication REST-API

> The authentication resources always response with HTTP 200. To verify the state of an response, it includes in each json response the key `status`. This key represents the HTTP state.

## `/signup`

The `/signup`-Resource allows to register a new user for the application.

### Request

`method`: POST

`Content-Type`: application/json


| Parameter | Description |
|-----------|-------------|
| `username` | The users username. |
| `password` | The users password. |
| `firstName?` | The users first name. |
| `lastName?` | The users last name. |
| `email?` | The users email. |

### Response

`Content-Type`: application/json

| Parameter | Description |
|-----------|-------------|
| `username` | The users username. |

## `/signin`

The `/signin`-Resource allows an already registered user to log in to the application.

### Request

`method`: POST

`Content-Type`: application/json

| Parameter | Description |
|-----------|-------------|
| `username` | The users username. |
| `password` | The users password. |

### Response

`Content-Type`: application/json

| Parameter | Description |
|-----------|-------------|
| `accessToken` | A token for authenticating the user on each request. This token expires. |
| `expiresIn` | Indicates when the `accessToken` is going to be expired. |
| `refreshToken` | A token for re-authenticate the user, when the access token will expire. |
| `clientId` | The clientId which is related to the `refreshToken` |


## `/token`

The `/token`-Resource allows an application to inquire a new access token for a registered user.

### Request

`method`: POST

`Content-Type`: application/json

| Parameter | Description |
|-----------|-------------|
| `username` | The users username. |
| `refreshToken` | The refresh token, which this is owned by this user. |
| `clientId` | The client id which is assigned to the refresh token. |

### Response

`Content-Type`: application/json

| Parameter | Description |
|-----------|-------------|
| `accessToken` | A token for authenticating the user on each request. This token expires. |
| `expiresIn` | Indicates when the `accessToken` is going to be expired. |

## `/signout`

The `/signout`-Resource allows an application to log out an logged in user.

### Request

`method`: POST

`Content-Type`: application/json

| Parameter | Description |
|-----------|-------------|
| `username` | The users username. |
| `clientId` | The client id which is assigned to the refresh token. |

### Response

`Content-Type`: application/json

| Parameter | Description |
|-----------|-------------|
| `username` | The name of the logged out user. |


# Testing

The @konmuc/authc package use [`intern`](https://theintern.io/) as test runner.

To run the tests first run start the test server.

```
npm run server
```

Then execute the following command to run the tests.

```
npm run test
```