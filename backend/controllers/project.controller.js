import { validationResult } from "express-validator";
import userModel from "../models/user.model.js";
import * as projectService from "../services/project.service.js";
import Project from "../models/project.model.js";

export const createProject = async (req, res) => {

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name } = req.body;

    const loggedInUser = await userModel.findOne({
      email: req.user.email,
    });

    if (!loggedInUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const userId = loggedInUser._id;

    const newProject = await projectService.createProject({
      name,
      userId,
    });

    return res.status(201).json({
      success: true,
      project: newProject,
    });

  } catch (err) {
    console.error("Create Project Error:", err);

    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};


export const getAllProject = async (req, res) => {
  try {

    const loggedInUser = await userModel.findOne({
      email: req.user.email
    })

    console.log('Controller - logged in user:', JSON.stringify(loggedInUser, null, 2));

    const allUserProjects = await projectService.getAllProjectByUserId({
      userId: loggedInUser._id
    })

    console.log('Controller - projects count:', allUserProjects.length);
    console.log('Controller - projects data:', JSON.stringify(allUserProjects, null, 2));

    return res.status(200).json({
      Project: allUserProjects
    })

  } catch (err) {
    console.log(err)
    res.status(400).json({ error: err.message })
  }
}



export const addUserToProject = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {

        const { projectId, users } = req.body

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        })


        const project = await projectService.addUsersToProject({
            projectId,
            users,
            userId: loggedInUser._id
        })

        return res.status(200).json({
            project,
        })

    } catch (err) {
        console.log(err)
        res.status(400).json({ error: err.message })
    }


}

export const removeUserFromProject = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { projectId, userId } = req.body

        const loggedInUser = await userModel.findOne({
            email: req.user.email
        })

        const project = await projectService.removeUserFromProject({
            projectId,
            userId,
            loggedInUserId: loggedInUser._id
        })

        return res.status(200).json({
            message: "User removed from project successfully",
            project
        })
    } catch (error) {
        console.log(error);
        res.status(400).json({ error: error.message })
    }
}

export const getProjectById = async (req , res) =>{
const {projectId} = req.params
 try {
    const project = await projectService.getProjectById({
      projectId
    });

    return res.status(200).json({
      project
    });

  } catch (err) {
    console.log(err);
    return res.status(400).json({
      message: err.message
    });
  }
}
