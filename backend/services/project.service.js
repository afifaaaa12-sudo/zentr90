import mongoose from "mongoose";
import ProjectModel from "../models/project.model.js";

export const createProject = async ({ name, userId }) => {
  if (!name) {
    throw new Error("Name is required");
  }

  if (!userId) {
    throw new Error("User is required");
  }

  let project;
  try {
    project = await ProjectModel.create({
      name,
      users: [userId],
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new Error("Project name already exists");
    }
    throw error;
  }

  return project;
};

export const getAllProjectByUserId = async ({ userId }) => {
  if (!userId) {
    throw new Error("UserId is required");
  }

  console.log("Querying projects for userId:", userId, "Type:", typeof userId);

  const allUserProjects = await ProjectModel.find({
    users: userId,
  });

  console.log("Found projects:", allUserProjects.length);
  console.log(
    "Projects:",
    allUserProjects.map((p) => ({ id: p._id, name: p.name, users: p.users })),
  );

  return allUserProjects;
};

export const addUsersToProject = async ({ projectId, users, userId }) => {

    if (!projectId) {
        throw new Error("projectId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
        throw new Error("Invalid projectId")
    }

    if (!users) {
        throw new Error("users are required")
    }

    if (!Array.isArray(users) || users.some(userId => !mongoose.Types.ObjectId.isValid(userId))) {
        throw new Error("Invalid userId(s) in users array")
    }

    if (!userId) {
        throw new Error("userId is required")
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error("Invalid userId")
    }


    const project = await ProjectModel.findOne({
        _id: projectId,
        users: userId
    })

    console.log(project)

    if (!project) {
        throw new Error("User not belong to this project")
    }

    const updatedProject = await ProjectModel.findOneAndUpdate({
        _id: projectId
    }, {
        $addToSet: {
            users: {
                $each: users
            }
        }
    }, {
        new: true
    })

    return updatedProject

}

export const removeUserFromProject = async ({ projectId, userId, loggedInUserId }) => {
  if (!projectId || !userId) {
    throw new Error("projectId and userId are required");
  }

  const project = await ProjectModel.findById(projectId);
  
  if (!project) {
    throw new Error("Project not found");
  }

  // Check if logged in user is the project owner
  if (!project.users.includes(loggedInUserId)) {
    throw new Error("You are not authorized to remove users from this project");
  }

  // Remove user from project
  project.users = project.users.filter(user => user.toString() !== userId);
  
  await project.save();

  return project;
};

export const getProjectById = async ({ projectId }) => {

  if (!projectId) {
    throw new Error("projectId is required");
  }

  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    throw new Error("Invalid projectId");
  }

  const project = await ProjectModel.findOne({
    _id: projectId
  }).populate('users', 'email');

  return project;
};