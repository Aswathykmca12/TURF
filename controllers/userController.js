const jwt = require("jsonwebtoken");
const prisma = require("../config/database");

require('dotenv').config();
const CODE = process.env.JSON_KEY;

async function login(req, res) {
    try {
        res.render('user/login');
    } catch (error) {
        console.error(error);
    }
}

async function register(req, res) {
    try {
        res.render('user/register');
    } catch (error) {
        console.error(error);
    }
}

async function registerUserData (req, res) {
    try {
        const { name, phone, password } = req.body;
        const addUser = await prisma.User.create({
            data: {
                name: name,
                phone: phone,
                password: password
            }
        });

        console.log('User added');
        res.redirect('/user/login');
    } catch (error) {
        console.error(error);
    }
}

// handle emp login requests
async function userLoginProcess (req, res) {
    try {
        const { phone, password } = req.body;
        console.log(`${phone} ${password}`);
        
        const user = await prisma.User.findUnique({
            where: {
                phone: phone
            }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found"});
        }

        let isPassVaild = false;

        if ((user.password) === password) {
            isPassVaild = true;
        }

        if (!isPassVaild) {
            return res.status(401).json({message: "Invaild password"})
        }

        const token = jwt.sign({ userId: user.id }, CODE, { expiresIn: '1h' });

        res.cookie("userToken", token, { httpOnly: true });

        res.redirect('/user/dashboard');

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging in' });
    }
}

async function userLogout (req, res) {  
    res.clearCookie('userToken');
    return res.redirect('/');
}

async function dashboard (req, res) {
    try {
        const userData = req.userOne;
        const pk = userData.userId;
        console.log(userData);

        const users = await prisma.User.findUnique({
            where: { id: parseInt(pk) }
        });

        const orders = await prisma.Order.findMany({
            where: { userId: parseInt(pk) },
            include: {
                turf: true,
                turfSchedule: true
            }
        });

        res.render('user/dashboard', { data: users, orders });
    } catch (error) {
        console.error(error);
    }
}


module.exports = {
    login, register, registerUserData, userLoginProcess, dashboard, userLogout,

};