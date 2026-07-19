"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadImage = void 0;
const nodejs_1 = __importDefault(require("@imagekit/nodejs"));
const client = new nodejs_1.default({
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || '',
});
const uploadImage = async (imagePath, fileName, user) => {
    try {
        const result = await client.files.upload({
            file: imagePath,
            fileName: fileName,
            folder: "/user_uploads/" + user,
        });
        return result.url;
    }
    catch (error) {
        console.log(error);
    }
};
exports.uploadImage = uploadImage;
