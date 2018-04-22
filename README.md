# @konmuc/authc

[![Build Status](https://travis-ci.org/konmuc/authz.png?branch=master)](https://travis-ci.org/konmuc/authz)
[![npm version](https://badge.fury.io/js/%40konmuc%2Fauthc.svg)]

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

Before continuing it is recommended to install also the following express packages:

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

// import the @konmuc/authc middleware and router
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
        app.listen(PORT, () => { console.log(`Listening on ${PORT}.`); });
    });
```

# Middelware API

## @konmuc/authc(options)

The `authc` middleware can be configured by the following options:

| Parameter | Description |
|-----------|-------------|
| `secret` | The required secret which will be used for signing JWTs. It is recommend to use here an SH256-Hash. If no secret is specified an error will be thrown. | 
| `accessTokenExpiration?` (optional) | The lifespan of an access token, after it was created. Defaults to 10 minutes. This property accepts any valid [moment.js](https://momentjs.com/) time configuration. |
| `accessTokenPayload?` (optional) | A function, which allows to modify the payload for the JWT access token. The function gets the related user passed in as argument. |

Example:

```js
import authc from '@konmuc/authc';

// create the middleware
const middleware = authc({
    secret: APP_SECRET, // the required APP_SECRET
    accessTokenExpiration: { minutes: 15 }, // override the defalt acces token expiration
    accessTokenPayload: ({ email }) => { email } // only possible if the UserSchema was extend by an email property.
});

// hook the middleware
app.use(middleware);

```

## @konmuc/authc/schema/UserSchema

The default mongoose user schema used by `@konmuc/authc` comes with a minimum set of immutable properties. These proprties are listed in the following table.

| Property | Description |
|----------|-------------|
| `username` | The users username, which identifies a user. |
| `password` | The users password, which will be stored hashed. For hashing passwords the `bcrypt` library is used. |
| `clients` | A list of all connected clients of a user. A client is identified by a `clientId`. To each client a `refreshToken` is assigned. If a client was logged out, the client has property `invalidated` equals `true`. |

In some cases an application needs more parameters assigned to a user. Therefore the underlying mongoose user schema used by `@konmuc/authc` can be extended. To configure the user schema, an application can use the `@konmuc/authc/schemas/UserSchema` modules `configure` method.

```js
// import the UserSchema modules configure method
import UserSchema from '@konmuc/authc/schemas/UserSchema';

// extend the default user schema with an email field.
UserSchema.configure({
    email: {
        type: String,
    }
});

```

# Authentication Workflow

The authentication mechanism is based on the access token and refresh token pattern. The authentication process follows the following workflow:

1. A user sends its credentials (username and password) to the `/signin` resource. If a user has no credentials yet, the user needs to register using the `/signup` resource.

2. If the credentials where valid, the `/signin` resource responded with the following parameters as json:

    - `accessToken`: A token, which authenticates the user.
    - `expiresIn`: Indicates in seconds, when the inquired `accessToken` will be invalidated.
    - `refreshToken`: A client can use the `refreshToken` to request a new `accessToken`.
    - `clientId`: A `clientId`, which is assigned to the `refreshToken`.

3. On any further request to a secured api, a client need to send the previously inquired `accessToken`. The `accessToken` must be send via the query string, the request body or the `x-access-token` header.

4. Before an `accessToken` will expire, a client can use the `refreshToken` to request a new `accessToken` via the `/token` resource.

5. To singout a user, a client need to send the `clientId` and the `username` via the `/signout` resource.

# Authentication REST-API

## `/signup`

The `/signup`-Resource allows to register a new user for an application.

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
| `refreshToken` | The refresh token, which this is owned by this user. |
| `clientId` | The client id which is assigned to the refresh token. |

### Response

`Content-Type`: application/json

| Parameter | Description |
|-----------|-------------|
| `accessToken` | A token for authenticating the user on each request. This token expires. |
| `expiresIn` | Indicates when the `accessToken` will expire in ms. |

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

To run the tests first run

```
npm install
```

Then execute

```
npm run test
```