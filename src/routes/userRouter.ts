import express, { Request } from 'express';
import { updateContactNumberController, viewProfileController } from '../controller/profileController';
import { loginController } from '../controller/loginController';
import { authenticateJWT, authenticationController } from '../controller/authController';
import { createQueryController, getQueryDataController, HandleQueryResponseController, manageQueryStatusController, viewMyQueriesController } from '../controller/queryController';


const userRouter = express.Router();

userRouter.post("/userLogin", loginController);
userRouter.get("/userAuthentication", authenticationController);

userRouter.use(authenticateJWT);

userRouter.get("/viewProfile",viewProfileController)
userRouter.get("/userViewMyQueries", viewMyQueriesController);
userRouter.get('/userGetQueryData/:queryId', getQueryDataController);

userRouter.post('/userAddContactNumber', updateContactNumberController)
userRouter.post('/userRaiseQuery', createQueryController);

userRouter.post(
    "/userManageQueryStatus/:queryId/:status",
    manageQueryStatusController
);
userRouter.post("/userAddCommentToQuery/:queryId", HandleQueryResponseController);

export default userRouter;