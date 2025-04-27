import { errors } from "@vinejs/vine";
import { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";

const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof errors.E_VALIDATION_ERROR) {
    return c.json(
      {
        message: "Validation error",
        errors: err.messages,
      },
      422
    );
  } else if (
    err.message === "Failed to parse JSON" ||
    err.message === "Unexpected end of JSON input"
  ) {
    return c.json(
      {
        message: "JSON body invalid",
      },
      400
    );
  } else if (err instanceof HTTPException) {
    return err.getResponse();
  }

  console.error(err);
  return c.json(
    {
      message: "Unexpected error",
    },
    500
  );
};

export default errorHandler;
