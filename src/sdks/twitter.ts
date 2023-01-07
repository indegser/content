import { Client } from "twitter-api-sdk";

export const twitter = new Client(process.env.TWITTER_BEARER_TOKEN);