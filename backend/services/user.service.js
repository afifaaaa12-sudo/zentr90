import User from "../models/user.model.js";

export const createUser = async ({ email, password }) => {
    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    const hashedPassword = await User.hashPassword(password)

    const user = await User.create({
        email,
        password : hashedPassword
    });

    return user;
};

export const login = async ({ email, password }) => {
    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    const user = await User.findOne({ email }).select("+password");
    
    if (!user) {
        throw new Error("Invalid credentials");
    }

    const isMatch = await user.isValidPassword(password);
    
    if (!isMatch) {
        throw new Error("Invalid credentials");
    }

    return user;
};

export const getAllUsers = async({ userId })=>{
 const users = await User.find({
    _id: { $ne: userId }
  });
return users;
}



