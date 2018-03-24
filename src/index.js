import Bluebird from 'bluebird';
import jwtlegacy from 'jsonwebtoken';
import moment from 'moment';

import { User } from './models';

const jwt = Bluebird.promisifyAll(jwtlegacy);

var config = {
    accessTokenExpiration: { minutes: 10 },
    accessTokenPayload: (user) => { return {}; }, // eslint-disable-line no-unused-vars
    secret: null
};

export function generateAccessToken({ user, clientId }) {
    // short live token expiration
    let accessTokenExpiration = moment()
        .add(config.accessTokenExpiration)
        .unix();

    let payload = {
        username: user.username,
        clientId,
        ...config.accessTokenPayload(user)
    };

    // determine when the accces token expires (in seconds)
    let expiresIn = accessTokenExpiration - moment().unix();
    // generate the access token
    let accessToken = jwt.sign(payload, config.secret, { expiresIn });
    // sign the access token
    return { accessToken, expiresIn };
}

export async function middleware(req, res, next) {
    try {
        // extract the token from either the body, the querystring or the x-access-token header
        const token = req.body.token || req.query.token || req.headers['x-access-token'];

        // check if a token was provided.
        if (!token) {
            let err = new Error('No token provided!')
            err.status = 401;
            throw err;
        }

        var decoded;

        // verify the token
        try {
            decoded = jwt.verify(token, config.secret);
        } catch (err) {
            console.error(err);
            let err2 = new Error('Invalid token provided!');
            err2.status = 401;
            throw err2;
        }

        // extract username and clientId from the decoded token
        const { username, clientId } = decoded;
        
        // search for a user.
        const { user } = await User.get({ username });

        // fetch the client
        const client = user.clients.find(client => client.clientId === clientId);
        // check if the client is invalidated
        if (client.invalidated) {
            console.warn(`client=${clientId} is blacklisted`);

            let err = new Error('Invalid token provided!');
            err.status = 401;
            throw err;
        }
        
        // store the user and client information in the request object
        req.user = user;
        req.client = client;

        next();
    } catch (err) {
        return next(err);
    }
}

export default function configure({ ...custom} = config) {

    config = { ...config, ...custom };

    if (!config.secret) {
        throw new Error('Missing secret!');
    }

    return middleware;
}