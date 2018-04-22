/* global intern console */
import fetch from 'node-fetch';
import server from '../server';

const { assert } = intern.getPlugin('chai');
const { registerSuite } = intern.getInterface('object');

const USERNAME = 'testuser';
const password = 'password';
const port = 9999;
const url = `http://localhost:${port}`
const headers = { 'Content-Type': 'application/json' };

registerSuite('authentication tests', () => {

    var REFRESH_TOKEN;
    var ACCESS_TOKEN;
    var CLIENT_ID;

    return {
        async before() {
            await server();

            const body = JSON.stringify({
                username: USERNAME,
                password
            });

            const request = {
                method: 'POST',
                headers: { ...headers },
                body
            };

            let res = await fetch(`${url}/signup`, request);

            let { status } = await res.json();

            assert.oneOf(status, [ 200, 409 ]);
        },


        tests: {

            'sign up existing user': async() => {
                const body = JSON.stringify({
                    username: USERNAME,
                    password
                });
    
                const request = {
                    method: 'POST',
                    headers: { ...headers },
                    body
                };
    
                let res = await fetch(`${url}/signup`, request);

                let { status } = await res.json();

                assert.equal(status, 409);
            },


            'sign user in': async () => {
                // build the reqest body
                const body = JSON.stringify({
                    username: USERNAME,
                    password
                });

                // build the request object
                const request = {
                    method: 'POST',
                    headers: { ...headers },
                    body
                };

                // trigger signin request
                const res = await fetch(`${url}/signin`, request);
        
                // parse response to json
                let {
                    status,
                    expiresIn,
                    refreshToken,
                    accessToken,
                    clientId,
                    ...error
                } = await res.json();

                // some assertations
                assert.isEmpty(error);
                assert.equal(status, 200);
                assert.isString(refreshToken);
                assert.isString(accessToken);
                assert.isString(clientId);
                assert.isNumber(expiresIn);

                // store refreshToken, accessToken and clientId in test suite scope,
                // so other tests can use it.
                REFRESH_TOKEN = refreshToken;
                ACCESS_TOKEN = accessToken;
                CLIENT_ID = clientId;
            },

            'acccess secured resource': async() => {
                // build the request object
                const request = {
                    method: 'GET',
                    headers: {
                        'x-access-token': ACCESS_TOKEN,
                        ...headers
                    }
                };

                // try to access the secured resource
                const res = await fetch(`${url}/`, request);

                // parse response to json
                const {
                    status,
                    secured,
                    ...error
                } = await res.json();

                // some assertations
                assert.isEmpty(error);
                assert.equal(status, 200);
                assert.isTrue(secured);
            },


            'access secured resource with invalid access token': async() => {
                // build the request object
                const request = {
                    method: 'GET',
                    headers: {
                        'x-access-token': 'invalid',
                        ...headers
                    }
                };

                // try to access the secured resource
                const res = await fetch(`${url}/`, request);

                // parse response to json
                const { status } = await res.json();

                assert.equal(status, 401);
            },


            'access secured resource without access token': async() => {
                // build the request object
                const request = {
                    method: 'GET',
                    headers: {
                        ...headers
                    }
                };

                // try to access the secured resource
                const res = await fetch(`${url}/`, request);

                // parse response to json
                const { status, message } = await res.json();

                assert.equal(status, 401);
            },




            'request a new access token': async() => {
                // build the request body
                const body = JSON.stringify({
                    clientId: CLIENT_ID,
                    refreshToken: REFRESH_TOKEN,
                    username: USERNAME
                });

                // build the request object
                const request = {
                    method: 'POST',
                    headers: { ...headers },
                    body
                };

                // request a new access token
                const res = await fetch(`${url}/token`, request);

                // parse response to json
                const {
                    status,
                    accessToken,
                    expiresIn,
                    ...error
                } = await res.json();

                // some assertations
                assert.isEmpty(error);
                assert.equal(status, 200);
                assert.isString(accessToken);
                assert.isNumber(expiresIn);
            },


            'log user out': async() => {
                // build the request body
                const body = JSON.stringify({
                    clientId: CLIENT_ID,
                    username: USERNAME
                });

                // build the request object
                const request = {
                    method: 'POST',
                    headers: { ...headers },
                    body
                };

                // trigger signout request
                const res = await fetch(`${url}/signout`, request);

                // parse response to json
                const {
                    status,
                    username,
                    ...error
                } = await res.json();

                // some assertations
                assert.isEmpty(error);
                assert.equal(username, USERNAME)
                assert.equal(status, 200);
            },


            'log logged out user out': async() => {
                // build the request body
                const body = JSON.stringify({
                    clientId: CLIENT_ID,
                    username: USERNAME
                });

                // build the request object
                const request = {
                    method: 'POST',
                    headers: { ...headers },
                    body
                };

                // trigger signout request
                const res = await fetch(`${url}/signout`, request);

                // parse response to json
                const {
                    status
                } = await res.json();

                assert.equal(status, 401);
            },


            'access secured route with logged out user credentials': async() => {
                // build request object
                const request = {
                    method: 'GET',
                    headers: {
                        'x-access-token': ACCESS_TOKEN,
                        ...headers
                    }
                }

                // request secured resource with invalid credentials
                const res = await fetch(`${url}/`, request);
                // parse response to json
                const {
                    status,
                    ...error
                } = await res.json();

                // some assertations
                assert.isNotEmpty(error);
                assert.equal(status, 401);
            }
        }
    };
});