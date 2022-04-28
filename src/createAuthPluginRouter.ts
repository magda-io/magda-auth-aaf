import express, { Router } from "express";
import { Authenticator, Profile } from "passport";
import { default as ApiClient } from "@magda/auth-api-client";
import bodyParser from "body-parser";
import {
    AuthPluginConfig,
    createOrGetUserToken,
    redirectOnSuccess,
    redirectOnError,
    getAbsoluteUrl
} from "@magda/authentication-plugin-sdk";

const CustomStrategy = require("passport-custom").Strategy;
const jwt = require("jwt-simple");

export interface AuthPluginRouterOptions {
    authorizationApi: ApiClient;
    passport: Authenticator;
    aafClientUri: string;
    aafClientSecret: string;
    externalUrl: string;
    authPluginRedirectUrl: string;
    authPluginConfig: AuthPluginConfig;
}

export default function createAuthPluginRouter(
    options: AuthPluginRouterOptions
): Router {
    const authorizationApi = options.authorizationApi;
    const passport = options.passport;
    const aafClientUri = options.aafClientUri;
    const externalUrl = options.externalUrl;
    const authPluginConfig = options.authPluginConfig;
    const resultRedirectionUrl = getAbsoluteUrl(
        options.authPluginRedirectUrl,
        externalUrl
    );

    if (!aafClientUri) {
        throw new Error("Required aafClientUri can't be empty!");
    }

    /**
     * Many base64 utility will add a trailing \n to encoded content
     * Just in case the secret has a trailing \n
     * Using trim to remove it.
     * Make sure aafClientSecret is a string to avoid `no toString method`
     * error from jwt.decode
     */
    const aafClientSecret = (
        options.aafClientSecret ? "" + options.aafClientSecret : ""
    ).trim();

    if (!aafClientSecret) {
        throw new Error("Required aafClientSecret can't be empty!");
    }

    passport.use(
        "aaf-custom",
        new CustomStrategy(function (req: any, done: any) {
            const verified_jwt = jwt.decode(
                req.body["assertion"],
                aafClientSecret
            );
            const attribute = verified_jwt["https://aaf.edu.au/attributes"];
            // Use mail as id because AAF return identities will change for every request though the user is the same
            // DB will use this unique mail address to hash and to get an unique id in db
            const profile: Profile = {
                id: attribute["mail"],
                displayName: attribute["displayname"],
                name: {
                    familyName: attribute["surname"],
                    givenName: attribute["givenname"]
                },
                emails: [{ value: attribute["mail"] }],
                photos: [{ value: "none-photoURL" }],
                provider: authPluginConfig.key
            };
            createOrGetUserToken(
                authorizationApi,
                profile,
                authPluginConfig.key
            )
                .then((userId) => {
                    console.log("create or get token:", userId);
                    return done(null, userId);
                })
                .catch((error) => done(error));
        })
    );

    const router: express.Router = express.Router();

    router.use(bodyParser);

    router.get(
        "/",
        (
            req: express.Request,
            res: express.Response,
            next: express.NextFunction
        ) => {
            console.log(req.query);
            res.redirect(aafClientUri);
        }
    );

    router.post(
        "/jwt",
        passport.authenticate("aaf-custom", {
            failWithError: true
        }),
        (req: express.Request, res: express.Response) => {
            redirectOnSuccess(resultRedirectionUrl, req, res);
        },
        (err: any, req: express.Request, res: express.Response): any => {
            console.log("error redirect: " + err);
            redirectOnError(err, resultRedirectionUrl, req, res);
        }
    );

    return router;
}
