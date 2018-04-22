import { Router } from 'express';
import { signin, signout, signup, token } from './authc';

// initialize authentication router
const router = Router();

// add the signup route
router.post('/signup', async (req, res, next) => {
    try {
        // sign up a new user
        let user = await signup(req.body);

        // send a success response
        res.status(200).json({
            status: 200,
            username: user.username
        });
    } catch (err) {
        next(err);
    }
});

// add the signin route
router.post('/signin', async (req, res, next) => {
    try {
        // sign the user in
        const {
            refreshToken,
            accessToken,
            clientId,
            expiresIn
        } = await signin(req.body);

        // send the users credentials
        res.status(200).json({
            status: 200,
            refreshToken,
            accessToken,
            clientId,
            expiresIn
        });
    } catch (err) {
        next(err);
    }
});

// add the route for receving a new access token
router.post('/token', async (req, res, next) => {
    try {
        // request a new access token
        const {
            accessToken,
            expiresIn
        } = await token(req.body);

        // send the new access token
        res.status(200).json({
            status: 200,
            accessToken,
            expiresIn
        });
    } catch (err) {
        next(err);
    }
});

// the route for logging out
router.post('/signout', async (req, res, next) => {
    try {
        // signout the user. 
        let user = await signout(req.body);
            
        // send response to the client.
        res.status(200).json({
            status: 200,
            username: user.username
        });
    } catch (err) {
        next(err);
    }
});

export default router;