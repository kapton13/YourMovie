import type { Messages } from "..";
import account from "./account";
import anime from "./anime";
import auth from "./auth";
import catalog from "./catalog";
import common from "./common";
import hidden from "./hidden";
import home from "./home";
import labels from "./labels";
import list from "./list";
import my from "./my";
import profile from "./profile";
import recs from "./recs";

const messages: Messages = { common, labels, home, catalog, anime, list, my, hidden, recs, profile, auth, account };

export default messages;
