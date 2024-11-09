const jwt = require("jsonwebtoken");
const prisma = require("../config/database");

require('dotenv').config();
const CODE = process.env.JSON_KEY;

async function managerLogin (req, res) {
    try {
        res.render('manager/login');
    } catch (error) {
        console.error(error);
    }
}

async function managerReg (req, res) {
    try {
        res.render('manager/register', );
    } catch (error) {
        console.error(error);
    }
}

async function managerRegData (req, res) {
    try {
        const { name, phone, password } = req.body;
        const addManagerData = await prisma.Manager.create({
            data: {
                name: name,
                phone: phone,
                password: password
            }
        });

        console.log('Manager added');
        res.redirect('/manager/');
    } catch (error) {
        console.error(error);
    }
}

async function home(req, res) {
    try {
        const managerData = req.manager;
        const pk = parseInt(managerData.managerId);

        // Start of the current month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        // Use Promise.all to fetch manager details, turf count, and orders in parallel
        const [manager, totalTurfs, orders] = await Promise.all([
            // Fetch manager details
            prisma.Manager.findUnique({
                where: { id: pk },
            }),

            // Get the total number of turfs managed by this manager
            prisma.Turf.count({
                where: { managerId: pk },
            }),

            // Fetch orders for the current month with their associated turfs
            prisma.Order.findMany({
                where: {
                    turf: { managerId: pk },
                    createdAt: { gte: startOfMonth },
                },
                include: {
                    turf: true,
                },
            }),
        ]);

        // Sum up the `amount` values from associated turfs
        const monthlyTotalPayments = orders.reduce((total, order) => {
            return total + (order.turf.amount || 0);
        }, 0);

        // Render manager dashboard with retrieved data
        res.render('manager/index', {
            data: manager,
            totalTurfs,
            totalPayments: monthlyTotalPayments.toFixed(2),
        });
    } catch (error) {
        console.error("Error fetching manager dashboard data:", error);
        res.status(500).send("An error occurred while loading the dashboard.");
    }
}

async function addTurf(req, res) {
    try {
        const managerData = req.manager;
        const pk = parseInt(managerData.managerId);
        
        const manager = await prisma.Manager.findUnique({
            where: { id: pk },
        });

        const turfList = await prisma.Turf.findMany({
            where: { managerId: pk },
            include: { turfSchedules: true },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.render('manager/addTurf', { data: manager, turfList, })
    } catch (error) {
        console.error(error);
    }
}

async function addSchedule(req, res) {
    try {
        const managerData = req.manager;
        const pk = parseInt(managerData.managerId);

        const id = parseInt(req.params.id);
        
        const manager = await prisma.Manager.findUnique({
            where: { id: pk },
        });

        const turf = await prisma.Turf.findMany({
            where: { id: id },
        });

        res.render('manager/addSchedule', { data: manager, turf, })
    } catch (error) {
        console.error(error);
    }
}

async function addNewTurf(req, res) {
    try {
        const id = req.params.mId;
        const { name, place, amount, facilities } = req.body;

        const newTurf = await prisma.Turf.create({
            data: { 
                managerId: parseInt(id),
                name: name,
                place: place,
                amount: parseFloat(amount),
                facilities: facilities
            },
        });

        console.log('Turf is added.');
        res.redirect('/manager/addTurf');
    } catch (error) {
        console.error(error);
    }
}

async function addScheduleTime(req, res) {
    try {
        const id = req.params.id;
        const { time } = req.body;

        const newTurf = await prisma.TurfSchedule.create({
            data: { 
                turfId: parseInt(id),
                scheduleTime: time,
            },
        });

        // Update the corresponding Turf's updatedAt field
        const updateTurf = await prisma.Turf.update({
            where: { id: parseInt(id) },  // Ensure you're using the turfId for the update
            data: { updatedAt: new Date() },  // Update to the current date
        });



        console.log('Schedule time is added.');
        res.redirect('/manager/addTurf');
    } catch (error) {
        console.error(error);
    }
}

// handle emp login requests
async function managerLoginProcess (req, res) {
    try {
        const { phone, password } = req.body;
        console.log(`${phone} ${password}`);
        
        const manager = await prisma.Manager.findUnique({
            where: {
                phone: phone
            }
        });

        if (!manager) {
            return res.status(404).json({ message: "Manager not found"});
        }

        let isPassVaild = false;

        if ((manager.password) === password) {
            isPassVaild = true;
        }

        if (!isPassVaild) {
            return res.status(401).json({message: "Invaild password"})
        }

        const token = jwt.sign({ managerId: manager.id }, CODE, { expiresIn: '1h' });

        res.cookie("managerToken", token, { httpOnly: true });

        res.redirect('/manager/index');

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error logging in' });
    }
}

async function managerLogout (req, res) {  
    res.clearCookie('managerToken');
    return res.redirect('/manager/');
}

async function payment(req, res) {
    try {
        const managerData = req.manager;
        const pk = parseInt(managerData.managerId);
        
        const manager = await prisma.Manager.findUnique({
            where: { id: pk },
        });

        // Fetch orders linked to the manager's turfs
        const orders = await prisma.Order.findMany({
            where: {
                turf: {
                    managerId: pk  // Assuming Turf has a managerId field linking to the Manager model
                }
            },
            include: {
                turf: true,
                turfSchedule: true,
                user: true,
            }
        });

        res.render('manager/payment', { data: manager, orders });
    } catch (error) {
        console.error(error);
    }
}


module.exports = {
    managerLogin, managerReg, managerRegData, managerLoginProcess, managerLogout,
    home, addTurf, addNewTurf, addSchedule, addScheduleTime, payment,
}