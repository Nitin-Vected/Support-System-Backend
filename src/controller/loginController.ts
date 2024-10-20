import express from "express";
import axios from "axios";
import userModel from "../model/userModel";
import { tokenGenerator } from "../utilities/jwt";
import {
  generateUniqueId,
  GOOGLE_DECODE_TOKEN_API,
  Messages,
  StatusCodes,
} from "../config";
import roleModel from "../model/roleModel";

interface TokenResponse {
  access_token: string;
}

const verifyGoogleToken = async (tokenResponse: TokenResponse) => {
  try {
    const result = await axios.get(`${GOOGLE_DECODE_TOKEN_API}`, {
      headers: {
        Authorization: `Bearer ${tokenResponse.access_token}`,
      },
    });
    return result.data || null;
  } catch (error) {
    console.error("Error verifying token:", error);
    return null; // Return null if there's an error
  }
};

export const loginController = async (
  request: express.Request,
  response: express.Response
) => {
  try {
    const { tokenResponse } = request.body;
    const decodedToken = await verifyGoogleToken(tokenResponse);

    if (!decodedToken) {
      return response.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid Google token!" });
    }

    const { given_name, family_name, picture, email, email_verified } = decodedToken;
    if (!email_verified) {
      return response.status(StatusCodes.BAD_REQUEST).json({ message: Messages.GOOGLE_AUTHENTICATION_FAILED });
    }

    let user = await userModel.findOne({ email: email });
        if (!user) {
      return response.status(StatusCodes.NOT_FOUND).json({
  message: Messages.USER_NOT_FOUND
});
    }
      user.email = email;
      user.firstName = given_name;
      user.lastName = family_name;
      user.profileImg = picture;
      await user.save();

    const roleDetails = await roleModel.findOne({ id: user.roleId });
    const result = {
      name: given_name + " " + family_name,
      email: email,
      contactNumber: user.contactNumber,
      profileImg: picture,
      role: roleDetails?.name,
    };

    const payload = {
      name: given_name + " " + family_name,
      userId: user.id,
      email,
      roleId: user.roleId,
      roleName: roleDetails ? roleDetails.name : "Not mentioned",
      googleToken: tokenResponse?.access_token,
      isActive: user.isActive,
    };

    const token = tokenGenerator(payload);
    return response.status(StatusCodes.CREATED).json({
      userData: result,
      token: token,
      message: "Login Successful!",
    });
  } catch (error) {
    console.error(error);
    return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: Messages.SOMETHING_WENT_WRONG });
  }
};
