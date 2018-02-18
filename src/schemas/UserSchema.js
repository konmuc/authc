import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';

const UserSchema = new Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    clients: {
        type: Array
    },
    firstName: {
        type: String,
        trim: true
    },
    lastName: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        trim: true
    }
});

/**
 * Authenticate a user by password.
 * 
 * @param {Object} params
 * @param {String} params.username The username.
 * @param {String} params.password The users password.
 * 
 * @returns {Promise<User>}
 */
UserSchema.statics.authenticateByPassword = async function({ username, password }) {
    try {
        const { user } = await User.get({ username });

        // compare the password with the users encrypted password.
        await bcrypt.compare(password, user.password);

        return { user };
    } catch (err) {
        console.error(err);
        let err2 = new Error('User not found or password invalid!');
        err2.status = 401;
        throw err2;
    }
};

/**
 * Authenticate a user by an JWT Access Token.
 * 
 * @param {Object} params
 * @param {String} params.username The username to authenticate
 * @param {String} params.refreshToken The refershToken to get a access token.
 * @param {String} params.clientId The client id which is related to the refresh token.
 * 
 * @returns {Promise<User>}
 */
UserSchema.statics.authenticateByToken = async function({ username, refreshToken, clientId }) {
    try {
        const { user } = await User.get({ username });

        // check if passed clientId and refreshToken are valid for username
        const client = user.clients
            .filter(client => !client.invalidated) // only look at active clients
            .find(client => client.refreshToken === refreshToken && client.clientId === clientId);
        
        // if no client is found, this means wether the requested client was invalidated or
        // there is a missmatch between clientId and refreshToken.
        if (!client) {
            console.warn(`Unknown client=${clientId} for user=${username}!`);

            throw new Error('Client not found');
        }

        return { user };
    } catch (err) {
        console.error(err);

        let err2 = new Error('User not found or token invalid!');
        err2.status = 401;
        throw err2;
    }
};

/**
 * Fetch a user.
 * 
 * @param {Object} params
 * @param {String} params.username The user to fetch.
 * 
 * @returns {Promise<User>}
 */
UserSchema.statics.get = async function({ username }) {
    try {
        var user;
        try {
            user = await User.findOne({ username }).exec();
        } catch (err) {
            console.error(err);
            throw new Error('User not found!');
        }

        if (!user) {
            throw new Error('User not found!');
        }

        return { user };
    } catch (err) {
        err.status = 401;
        throw err;
    }
};

const User = mongoose.model('User', UserSchema);

export default User;