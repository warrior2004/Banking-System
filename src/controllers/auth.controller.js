const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const emailService = require("../services/email.service")

/** 
* - USER Register Controller
* - POST /api/auth/register
*/
async function userRegisterController(req,res){
    const {email,password,name} = req.body

    const ifExist = await userModel.findOne({
        email: email
    })

    if(ifExist){
        return res.status(422).json({
            message: "User already exist!",
            status: "falied"
        })
    }

    const user = await userModel.create({
        email, password, name
    })

    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn:"3d"})

    res.cookie("token", token)

    res.status(201).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        }, 
        token
    })

    await emailService.sendRegisterEmail(user.email, user.name)
}

/** 
* - USER Login Controller
* - POST /api/auth/Login
*/
async function userLoginController(req, res){
    const {email, password} = req.body
    const user = await userModel.findOne({email}).select("+password")

    if(!user){
        return res.status(401).json({
            message: "Email/password is invalid"
        })
    }

    const isValidPassword = await user.comparePassword(password)

    if(!isValidPassword){
        return res.status(401).json({
            message: "Email/Password is invalid"
        })
    }

    const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET, {expiresIn:"3d"})

    res.cookie("token", token)

    res.status(200).json({
        user: {
            _id: user._id,
            email: user.email,
            name: user.name
        }, 
        token
    })
}

module.exports = {
    userRegisterController,
    userLoginController
}
