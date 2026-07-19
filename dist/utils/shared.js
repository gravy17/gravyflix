"use strict";
/*
  Small shaping helpers shared by the trades/sales/movies API controllers.

  Why this exists: none of the four schemas set `toJSON: { virtuals: true }`,
  so calling res.json(doc) drops Mongoose's `.id` virtual and only sends
  `_id`. The frontend (moviecard.ejs, dashboard.js, trade.js, etc.) was
  built expecting `.id` everywhere. Rather than relying on every response
  to remember to add it, these helpers do it once, in one place.

  If you'd rather fix this at the schema level instead (recommended long
  term), add `{ timestamps: true, toJSON: { virtuals: true } }` to each
  schema's options and these helpers become unnecessary -- but they're
  harmless to leave in either way.
*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.shapeMovie = exports.shapeUser = exports.withId = void 0;
function withId(doc) {
    if (!doc)
        return doc;
    const obj = typeof doc.toObject === "function" ? doc.toObject() : doc;
    return { ...obj, id: obj._id ? obj._id.toString() : obj.id };
}
exports.withId = withId;
// Only shapes if the ref was actually populated -- an unpopulated field is
// just a raw ObjectId and should be left alone.
function shapeUser(user) {
    if (!user || typeof user !== "object" || !user.username)
        return user;
    return withId(user);
}
exports.shapeUser = shapeUser;
function shapeMovie(movie) {
    if (!movie || typeof movie !== "object" || !movie.title)
        return movie;
    const shaped = withId(movie);
    if (shaped.createdBy)
        shaped.createdBy = shapeUser(shaped.createdBy);
    return shaped;
}
exports.shapeMovie = shapeMovie;
