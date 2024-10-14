import express from "express";
import {
  adminManageStudentStatusController,
  adminViewRaisedQueryListController,
  adminViewUserListController,
  registerUserController,
} from "../controller/adminController";
import { updateContactNumberController, viewProfileController } from "../controller/profileController";
import { authenticateJWT, authenticationController } from "../controller/authController";
import { createQueryController, getQueryDataController, HandleQueryResponseController, manageQueryStatusController } from "../controller/queryController";

const adminRouter = express.Router();

// adminRouter.get("/", (request: express.Request, response: express.Response) => {
//   try {
//     console.log("Hello from admin Router ..!");
//   } catch (error) {
//     console.log("Error in /admin/ ..!");
//   }
// });

// adminRouter.post("/adminLogin", adminLoginController);
adminRouter.get("/adminAuthentication", authenticationController);

adminRouter.use(authenticateJWT);

adminRouter.get("/adminViewProfile", viewProfileController);
adminRouter.get("/adminViewRaisedQueries", adminViewRaisedQueryListController);
adminRouter.get('/adminGetQueryData/:queryId',getQueryDataController);

adminRouter.get("/adminViewUserList", adminViewUserListController);

adminRouter.post('/adminManageQueryStatus/:queryId/:status', manageQueryStatusController);
adminRouter.get('/adminManageStudentStatus/:email/:action',adminManageStudentStatusController);

adminRouter.post("/adminRaiseQuery", createQueryController);
adminRouter.post("/adminAddResponseToQuery/:queryId",HandleQueryResponseController);
adminRouter.post("/registerUser",registerUserController);
adminRouter.post("/adminAddContactNumber", updateContactNumberController);

export default adminRouter;