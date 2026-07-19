import Joi from "joi";
import { sign } from 'jsonwebtoken';
import { FormatEnum, ConditionEnum, ListingTypeEnum } from "../enum";

export const movieValidator = Joi.object().keys({
  title: Joi.string().lowercase().required(),
  description: Joi.string().allow('', null),
  image: Joi.string().uri().allow('').default('/images/default-movie.jpg'),
  price: Joi.number().required(),
  format: Joi.string().valid(...FormatEnum).optional(),
  condition: Joi.string().valid(...ConditionEnum).optional(),
  // required: true on the Movie schema -- match that here so a missing
  // listingType fails fast with a clean 400 instead of a Mongoose
  // validation error further down.
  listingType: Joi.string().valid(...ListingTypeEnum).required(),
});

export const movieModValidator = Joi.object().keys({
  title: Joi.string().lowercase(),
  description: Joi.string().allow('', null),
  image: Joi.string().uri().allow("").default("/images/default-movie.jpg"),
  price: Joi.number(),
  format: Joi.string().valid(...FormatEnum).optional(),
  condition: Joi.string().valid(...ConditionEnum).optional(),
  listingType: Joi.string().valid(...ListingTypeEnum).optional(),
});

export const registerValidator = Joi.object()
  .keys({
    fullname: Joi.string().required(),
    username: Joi.string().required(),
    email: Joi.string().trim().lowercase().required(),
    password: Joi.string()
      .min(8)
      .max(30)
      .required(),
    image: Joi.string().uri().allow("").optional(),
    confirm_password: Joi.ref("password"),
    city: Joi.string().allow('', null).optional(),
    // required: true on the User schema. Uppercased here since the CSS
    // text-transform on the signup form's input is cosmetic only -- it
    // doesn't change the actual submitted value's case.
    country_code: Joi.string().length(2).uppercase().required(),
  })
  .with("password", "confirm_password");

export const loginValidator = Joi.object().keys({
  username: Joi.string().required(),
  password: Joi.string()
    .min(8)
    .max(30)
    .required()
});

export const validationOpts = {
  abortEarly: false,
  errors: {
    wrap: {
      label: "",
    },
  },
};

export const generateToken = (user: { [key: string]: unknown}): unknown => {
  try {
    const secret = process.env.JWT_SECRET as string;
    return sign(user, secret, { expiresIn: "7d" });
  } catch (err) {
    console.error(err);
  }
};
