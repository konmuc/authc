import randtoken from 'rand-token';
import uuid4 from 'uuid/v4';
import bcrypt from 'bcrypt';

import { User } from './models';
import { generateAccessToken } from './index';
import { errors } from './messages';
/**
 * Logs a user in.
 * 
 * @param {Object} params
 * @param {String} params.username The username of the user.
 * @param {String} params.password The users password.
 * 
 * @returns {Promise<any>} 
 */
export async function signin({ username, password }) {
    // pass username and password to the user model for authentication
    const { user } = await User.authenticateByPassword({ username, password });

    // generate the uuid v4 clientId
    let clientId = uuid4();

    // generate a random refresh token
    let refreshToken = randtoken.uid(256);

    // sign the access token
    let { accessToken, expiresIn } = generateAccessToken({ clientId, user });

    // update the users clients
    user.clients.push({
        clientId,
        refreshToken,
    });

    // save the changes.
    await user.save();

    // return refreshToken, accessToken, clientId and expiration time.
    return {
        refreshToken,
        accessToken,
        clientId,
        expiresIn
    };
}

/**
 * Registers a new user.
 * 
 * @param {Object} userData The users data.
 * 
 * @returns {Promise<any>}
 */
export async function signup(userData) {
    // hash the passed password
    userData.password = await bcrypt.hash(userData.password, 10);
    
    // verify that the username is available
    let exists =  await User.exists({ username: userData.username });

    if (exists) {
        let err = new Error(errors.user.already.exists);
        err.status = 409;
        throw err;
    }

    //create an user instance and save it
    return (new User(userData)).save();
}

/**
 * Logs a user out.
 * 
 * @param {Object} params
 * @param {Object} params.username The user to signout.
 * @param {Object} params.clientId The client to logout.
 * 
 * @returns {Promise<any>}
 */
export async function signout({ username, clientId }) {
    const { user } = await User.getByUsername({ username });

    // find the client from which the user wishes to log out.
    let client = user.clients.find(client =>  client.clientId === clientId);

    // if no client is found, the user is probably already logged out.
    if (!client || client.invalidated) {
        let err = new Error(errors.user.already.loggedOut);
        err.status = 401;
        throw err;
    }

    // invalidate the client.
    client.invalidated = true;

    // notify mongoose, that we modified the clients array
    user.markModified('clients');

    // save the changes
    return user.save();
}

/**
 * Allows a user to renew its access token.
 * 
 * @param {Object} params
 * @param {String} params.refreshToken The refreshToken of the user.
 * @param {String} params.clientId The users related clientId.
 */
export async function token({ refreshToken, clientId }) {
    // first authenticate the user.
    const { user } = await User.authenticateByToken({ refreshToken, clientId });
    
    // generate the accesstoken
    return generateAccessToken({ user, clientId });
}