import Joi from "joi";
import { sign } from 'jsonwebtoken';

export const movieValidator = Joi.object().keys({
  title: Joi.string().lowercase().required(),
  description: Joi.string().allow('', null),
  image: Joi.string().uri().allow('').default('/images/default-movie.jpg'),
  price: Joi.number().required(),
});

export const movieModValidator = Joi.object().keys({
  title: Joi.string().lowercase(),
  description: Joi.string().allow('', null),
  image: Joi.string().uri().allow("").default("/images/default-movie.jpg"),
  price: Joi.number(),
});

export const registerValidator = Joi.object()
  .keys({
    fullname: Joi.string(),
    username: Joi.string().required(),
    email: Joi.string().trim().lowercase().required(),
    password: Joi.string()
      .min(8)
      .max(30)
      .required(),
    confirm_password: Joi.ref("password")
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