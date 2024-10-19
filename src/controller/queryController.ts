import { CustomRequest, generateUniqueId, Messages, StatusCodes } from "../config";
import { Request, Response } from "express";
import queryModel from "../model/queryModel";

export const HandleQueryResponseController = async (
    request: CustomRequest,
    response: Response
) => {
    try {
        if (!request.payload) {
            return response.status(StatusCodes.UNAUTHORIZED).json({ message: Messages.PAYLOAD_MISSING_OR_INVALID, });
        }
        const { name, email, roleName } = request.payload;
        const { queryId } = request.params;
        const { message } = request.body;

        // Check if the necessary fields are available
        if (!queryId || !message) {
            return response.status(StatusCodes.BAD_REQUEST).json({ message: `QueryId and Message ${Messages.REQUIRED}` });
        }

        console.log("QueryId:", queryId);

        // Find the query by its queryId
        const query = await queryModel.findOne({ id: queryId });

        // Check if the query exists
        if (!query) {
            return response.status(StatusCodes.NOT_FOUND).json({ message: `Query ${Messages.DATA_NOT_FOUND}` });
        }

        console.log("Query Status:", query.status);

        // Ensure the query status is either "Open" or "in-progress"
        if (["Open", "in-progress"].includes(query.status)) {
            console.log("Name:", name);
            console.log("Email:", email);

            // Add the response to the conversation
            query.conversation.push({
                sender: name,
                email: email,
                message,
                role: roleName,
                timestamp: new Date(),
            });

            // Save the updated query
            await query.save();
            console.log("Updated Conversation:", query.conversation);
            return response.status(StatusCodes.CREATED).json({ message: "Your response has been sent to the inquirer successfully!" });
        } else {
            // If the query is already closed
            return response.status(StatusCodes.BAD_REQUEST).json({ error: "Query has been closed by the user!" });
        }
    } catch (error) {
        console.error("Error in adminResponseController:", error);
        return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to process the query." });       
    }
};

export const getQueryDataController = async (request: Request, response: Response) => {
    try {
        const { queryId } = request.params;
        console.log("Inside userGetQueryDataController", queryId)
        const queryData = await queryModel.findOne({ id: queryId });
        if (queryData) {
            console.log("Inside userGetQueryDataController",queryData)
            response.status(StatusCodes.OK).json({ queryData: queryData, message: "Query has been f ..!" });
        } else {
            response.status(StatusCodes.NOT_FOUND).json({ queryData: null, message: "Query Not found with this Id  ..!" });
        }
    } catch (error) {
        console.log("Error while user authentication Controller", error);
        response.status(StatusCodes.UNAUTHORIZED).json({ message: 'Token Not verify please login then try to access ..!' });
    }
};

export const manageQueryStatusController = async (
    request: CustomRequest,
    response: Response
) => {
    try {
        const roleName = request.payload?.roleName;
        const { queryId, status } = request.params;
        const { userEmail } = request.body;
        console.log("queryId inside manageQueryStatusController ")
        if (!queryId || !status) {
            return response.status(StatusCodes.BAD_REQUEST).json({ message: `QueryId or Status ${Messages.MISSING_OR_INVALID}` });
        }

        console.log("QueryId:", queryId, "UserEmail:", userEmail, "Role:", roleName);
        const statusToUpdate = status?.toLowerCase();
        console.log("Status to update ",statusToUpdate);

        const validStatuses = ["in-progress", "closed"];
        if (!validStatuses.includes(statusToUpdate)) {
            return response.status(StatusCodes.BAD_REQUEST).json({ message: `Status must be one of the following: ${validStatuses.join(', ')}` });
        }

        const query = await queryModel.findOne({ id: queryId, userEmail });
        if (!query) {
            return response.status(StatusCodes.NOT_FOUND).json({ message: `Query ${Messages.DATA_NOT_FOUND}` });
        }

        if (query.status.toLowerCase() === "closed") {
            return response.status(StatusCodes.BAD_REQUEST).json({ message: Messages.ALREADY_CLOSED });
        }

        if (roleName === "Student" && statusToUpdate !== "closed") {
            return response.status(StatusCodes.FORBIDDEN).json({ message: "Students can only close the query." });
        }

        const result = await queryModel.updateOne(
            { id: queryId, userEmail },
            { $set: { status: statusToUpdate } }
        );

        console.log("Status of query status updation ",result)
        if (result?.acknowledged) {
            console.log("Query status updated successfully");
            return response.status(StatusCodes.CREATED).json({ message: "Query status updated successfully!" });
        } else {
            return response.status(StatusCodes.NOT_FOUND).json({ message: "Query not found or email mismatch." });
        }
    } catch (error) {
        console.error("Error while updating query status:", error);
        return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Failed to update query status." });       
    }
};

export const createQueryController = async (request: CustomRequest, response: Response) => {
    try {
        const { name, email, roleName } = request.payload || {};
        const { subject, message } = request.body;
        const similaryExistingQuery = await queryModel.findOne({ userEmail: email, userRole: roleName, subject, message });
        if (similaryExistingQuery) {
            return response.status(StatusCodes.ALREADY_EXIST).json({ message: "A similar query has already been added by you ..!" });
        }
        const queryId = await generateUniqueId(queryModel, "QUERY");
        console.log('Unique QueryId inside createQueryController ', queryId);
        const updatedQuery = await queryModel.create({
            id: queryId,
            userEmail: email,
            userRole: roleName,
            subject,
            message,
            conversation: [{
                sender: name,
                email: email,
                message: message,
                role: roleName,
                timestamp: new Date()
            }]
        });
        if (updatedQuery) {
            console.log('query raised successfull ..!', updatedQuery)
            response.status(StatusCodes.OK).json({ message: "Your query has been successfully published ..!" });
        } else {
            response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ userData: null, message: "Something went wrong ..!" })
        }

    } catch (error) {
        console.log(error);
        response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Failed to create query' });
    }
};

export const viewMyQueriesController = async (request: CustomRequest, response: Response) => {
    try {
        const { email, roleName } = request.payload || {};
        const myQueries = await queryModel.find({ userEmail: email, userRole: roleName },
            { "conversation._id": 0, '_id': 0 })
            .sort({ updatedAt: -1, createdAt: -1 });
        // console.log(`RaisedQuery by  ${myQueries} : `);
        if (myQueries) {
            response.status(StatusCodes.OK).json({ myQueries: myQueries, message: "These are the recently raised queries by you ..!" });
        } else {
            response.status(StatusCodes.NOT_FOUND).json({ myQueries: null, message: "No Queries are added by You ..!" });  
        }
    } catch (error) {
        console.log('Error occure in userRaiseQueryController : ', error)
        response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong ..!" });
    }
}